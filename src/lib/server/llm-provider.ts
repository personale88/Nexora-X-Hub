import { RepairJobDiagnosis, RepairJobPatch } from '@/lib/types';
import { createUnifiedDiff } from './sandbox';

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'custom' | 'none';
  apiKey?: string;
  model: string;
  endpoint?: string;
  timeoutMs: number;
}

/**
 * Detect and resolve configured LLM provider from server environment
 */
export function getLLMConfig(): LLMConfig {
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      timeoutMs: 45000,
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219',
      endpoint: 'https://api.anthropic.com/v1/messages',
      timeoutMs: 45000,
    };
  }

  if (process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent`,
      timeoutMs: 45000,
    };
  }

  if (process.env.CUSTOM_LLM_ENDPOINT && process.env.CUSTOM_LLM_API_KEY) {
    return {
      provider: 'custom',
      apiKey: process.env.CUSTOM_LLM_API_KEY,
      model: process.env.CUSTOM_LLM_MODEL || 'default',
      endpoint: process.env.CUSTOM_LLM_ENDPOINT,
      timeoutMs: 45000,
    };
  }

  return {
    provider: 'none',
    model: 'none',
    timeoutMs: 10000,
  };
}

/**
 * Validate that an LLM provider is configured; throws clear actionable error if missing
 */
export function assertLLMConfigured(): LLMConfig {
  const config = getLLMConfig();
  if (config.provider === 'none' || !config.apiKey) {
    throw new Error(
      'NO_LLM_PROVIDER_CONFIGURED: No LLM API key detected. Please configure OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in your .env.local to run autonomous AI debugging.'
    );
  }
  return config;
}

/**
 * Internal helper to query LLM with strict JSON schema instructions
 */
async function callLLM(
  prompt: string,
  systemInstruction: string,
  config: LLMConfig
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    if (config.provider === 'openai' || config.provider === 'custom') {
      const res = await fetch(config.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LLM_PROVIDER_ERROR (${config.provider}): ${res.status} ${res.statusText} - ${errText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '{}';
    }

    if (config.provider === 'anthropic') {
      const res = await fetch(config.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 4096,
          temperature: 0.1,
          system: systemInstruction,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LLM_PROVIDER_ERROR (anthropic): ${res.status} ${res.statusText} - ${errText}`);
      }

      const data = await res.json();
      return data.content?.[0]?.text || '{}';
    }

    if (config.provider === 'gemini') {
      const url = `${config.endpoint}?key=${config.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\nTask:\n${prompt}` }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LLM_PROVIDER_ERROR (gemini): ${res.status} ${res.statusText} - ${errText}`);
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    }

    throw new Error(`UNSUPPORTED_PROVIDER: ${config.provider}`);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`LLM_TIMEOUT: Model request exceeded timeout limit of ${config.timeoutMs}ms.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Safely parse JSON from model output with fallback cleanup for markdown blocks
 */
function cleanAndParseJSON<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (err: any) {
    throw new Error(`LLM_OUTPUT_MALFORMED: Failed to parse structured JSON from model: ${err.message}`);
  }
}

/**
 * Autonomous Diagnosis:
 * Analyzes repository evidence, failure output, and AST context to locate root cause.
 */
export async function diagnoseIssue(params: {
  issueDescription: string;
  reproductionOutput: string;
  targetFile: string;
  fileContent: string;
  candidateFiles?: string[];
}): Promise<RepairJobDiagnosis> {
  const config = assertLLMConfigured();

  const systemInstruction = `You are a Senior Autonomous Systems Debugging Agent.
Analyze the provided code and reproduction output. Return ONLY a valid JSON object matching this schema:
{
  "rootCause": "Clear 1-sentence technical root-cause",
  "affectedFile": "relative path to affected file",
  "startLine": number,
  "endLine": number,
  "explanation": "concise technical summary of the flaw",
  "flawExplanation": "plain-English explanation of why this code fails",
  "attackScenario": "how this vulnerability or defect causes failure in practice",
  "fixRationale": "why the proposed architectural fix is minimal and correct",
  "rule": "memorable developer golden rule to avoid this bug",
  "confidence": number between 1 and 100,
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}`;

  const prompt = `Issue Report:
${params.issueDescription}

Reproduction Test Failure:
${params.reproductionOutput}

Target File: ${params.targetFile}
File Content:
${params.fileContent}

Candidate Files: ${params.candidateFiles?.join(', ') || 'none'}

Diagnose the exact root cause, line range, and educational breakdown.`;

  const rawJson = await callLLM(prompt, systemInstruction, config);
  const parsed = cleanAndParseJSON<any>(rawJson);

  // Validate required structure
  if (!parsed.rootCause || !parsed.affectedFile) {
    throw new Error('LLM_OUTPUT_INVALID: Diagnosis response missing rootCause or affectedFile.');
  }

  return {
    rootCause: String(parsed.rootCause),
    affectedFile: String(parsed.affectedFile),
    startLine: Number(parsed.startLine) || 1,
    endLine: Number(parsed.endLine) || 1,
    explanation: String(parsed.explanation || parsed.rootCause),
    flawExplanation: parsed.flawExplanation ? String(parsed.flawExplanation) : undefined,
    attackScenario: parsed.attackScenario ? String(parsed.attackScenario) : undefined,
    fixRationale: parsed.fixRationale ? String(parsed.fixRationale) : undefined,
    rule: parsed.rule ? String(parsed.rule) : undefined,
    confidence: Math.min(100, Math.max(1, Number(parsed.confidence) || 95)),
    severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.severity)
      ? parsed.severity
      : 'HIGH',
  };
}

/**
 * Autonomous Patch Generation:
 * Produces minimal-risk, surgical code substitution anchored in existing code.
 */
export async function generatePatch(params: {
  affectedFile: string;
  fileContent: string;
  rootCause: string;
  issueDescription: string;
  testFailure: string;
}): Promise<RepairJobPatch> {
  const config = assertLLMConfigured();

  const systemInstruction = `You are an Autonomous Software Engineer synthesizing a surgical code patch.
You MUST output ONLY a valid JSON object matching this schema:
{
  "beforeCode": "exact character-for-character snippet from original file that must be replaced",
  "afterCode": "exact replacement code to substitute",
  "explanation": "concise explanation of why this fix resolves the issue"
}
CRITICAL RULES:
1. beforeCode MUST be an exact verbatim substring of the target file content.
2. Produce the smallest minimal surgical fix possible. Do not rewrite unrelated code.
3. Return valid JSON only.`;

  const prompt = `Target File: ${params.affectedFile}
Root Cause: ${params.rootCause}
Issue Description: ${params.issueDescription}
Failure Details:
${params.testFailure}

Original File Content:
${params.fileContent}

Generate the exact surgical beforeCode and afterCode replacement.`;

  const rawJson = await callLLM(prompt, systemInstruction, config);
  const parsed = cleanAndParseJSON<any>(rawJson);

  if (!parsed.beforeCode || typeof parsed.afterCode !== 'string') {
    throw new Error('LLM_OUTPUT_INVALID: Model patch missing beforeCode or afterCode.');
  }

  const beforeCode = String(parsed.beforeCode).trim();
  const afterCode = String(parsed.afterCode).trim();
  const explanation = String(parsed.explanation || 'Surgical patch generated by RepoPilot AI.');

  // Verify that beforeCode actually exists in target file
  if (!params.fileContent.includes(beforeCode)) {
    throw new Error(
      `PATCH_ANCHOR_INVALID: Proposed beforeCode cannot be found verbatim in target file "${params.affectedFile}".`
    );
  }

  const unifiedDiff = createUnifiedDiff(params.affectedFile, beforeCode, afterCode);
  const beforeLines = beforeCode.split('\n');
  const afterLines = afterCode.split('\n');

  return {
    file: params.affectedFile,
    beforeCode,
    afterCode,
    unifiedDiff,
    additions: Math.max(0, afterLines.length - beforeLines.length) + 1,
    deletions: Math.max(0, beforeLines.length - afterLines.length) + 1,
    explanation,
    appliedSuccessfully: false,
  };
}

/**
 * Autonomous Patch Revision:
 * If a patch applied cleanly but tests failed, requests a revised fix using the real error trace.
 */
export async function revisePatch(params: {
  affectedFile: string;
  fileContent: string;
  previousPatch: RepairJobPatch;
  testFailureOutput: string;
  attemptNumber: number;
}): Promise<RepairJobPatch> {
  const config = assertLLMConfigured();

  const systemInstruction = `You are an Autonomous Software Engineer revising a failed patch.
Your previous fix failed verification tests. Analyze the test failure output and provide a revised fix.
Return ONLY a valid JSON object:
{
  "beforeCode": "exact verbatim substring from current file content to replace",
  "afterCode": "replacement code",
  "explanation": "explanation of how the revision addresses the test failure"
}`;

  const prompt = `Attempt Number: ${params.attemptNumber}
Target File: ${params.affectedFile}

Previous Patch:
${params.previousPatch.unifiedDiff}

Verification Test Failure:
${params.testFailureOutput}

Current File Content:
${params.fileContent}

Generate a revised surgical fix that satisfies all test expectations.`;

  const rawJson = await callLLM(prompt, systemInstruction, config);
  const parsed = cleanAndParseJSON<any>(rawJson);

  if (!parsed.beforeCode || typeof parsed.afterCode !== 'string') {
    throw new Error('LLM_OUTPUT_INVALID: Revised patch missing beforeCode or afterCode.');
  }

  const beforeCode = String(parsed.beforeCode).trim();
  const afterCode = String(parsed.afterCode).trim();
  const explanation = String(parsed.explanation || `Revised patch for attempt ${params.attemptNumber}`);

  if (!params.fileContent.includes(beforeCode)) {
    throw new Error(`PATCH_ANCHOR_INVALID: Revised beforeCode not found in file.`);
  }

  const unifiedDiff = createUnifiedDiff(params.affectedFile, beforeCode, afterCode);
  const beforeLines = beforeCode.split('\n');
  const afterLines = afterCode.split('\n');

  return {
    file: params.affectedFile,
    beforeCode,
    afterCode,
    unifiedDiff,
    additions: Math.max(0, afterLines.length - beforeLines.length) + 1,
    deletions: Math.max(0, beforeLines.length - afterLines.length) + 1,
    explanation,
    appliedSuccessfully: false,
  };
}
