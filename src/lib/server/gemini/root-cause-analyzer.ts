import { GeminiProvider, defaultGeminiProvider } from './provider';
import { RepairJobDiagnosis } from '@/lib/types';

export interface DeepDiagnosisResult extends RepairJobDiagnosis {
  evidence: string;
  affectedFunction?: string;
  technicalExplanation: string;
  proposedSolution: string;
}

export class RootCauseAnalyzer {
  constructor(private provider: GeminiProvider = defaultGeminiProvider) {}

  public async analyzeRootCause(params: {
    issueTitle: string;
    issueDescription: string;
    reproductionOutput?: string;
    targetFile: string;
    fileContent: string;
    candidateFiles?: string[];
    relatedFiles?: Record<string, string>;
  }): Promise<DeepDiagnosisResult> {
    const systemInstruction = `You are a World-Class Autonomous Debugging & Security Researcher.
You are given the full source code of a suspect file, related repository files, and reproduction failure logs.
Your task is to pinpoint the exact root cause with line numbers and verifiable code evidence.
Never assert a bug exists without quoting exact lines or tokens from the source file.
You must return a valid JSON object matching this schema:
{
  "rootCause": "Clear, precise 1-sentence root-cause statement",
  "affectedFile": "${params.targetFile}",
  "affectedFunction": "name of flawed function or method",
  "startLine": number (1-based index in file),
  "endLine": number (1-based index in file),
  "evidence": "exact verbatim lines or code snippet from file demonstrating flaw",
  "explanation": "concise technical summary of the flaw",
  "technicalExplanation": "in-depth breakdown of the logical or security vulnerability",
  "flawExplanation": "plain-English explanation of why this code fails",
  "attackScenario": "how this vulnerability or defect manifests in real execution",
  "proposedSolution": "step-by-step technical fix description",
  "fixRationale": "why this minimal architectural fix is correct without side effects",
  "rule": "memorable developer golden rule to prevent this bug",
  "confidence": number between 1 and 100,
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}`;

    const prompt = `Defect Report:
Title: ${params.issueTitle}
Description:
${params.issueDescription}

${params.reproductionOutput ? `Reproduction Output / Test Failures:\n${params.reproductionOutput}\n` : ''}

Primary Target File: ${params.targetFile}
File Content (with line numbers):
${params.fileContent
  .split('\n')
  .map((line, idx) => `${idx + 1}: ${line}`)
  .join('\n')}

${
  params.relatedFiles && Object.keys(params.relatedFiles).length > 0
    ? `Related Repository Files:\n${Object.entries(params.relatedFiles)
        .map(([f, c]) => `--- File: ${f} ---\n${c.slice(0, 2000)}`)
        .join('\n\n')}`
    : ''
}

Perform comprehensive root-cause analysis, locate exact line numbers, and provide code evidence.`;

    return this.provider.generateJSON<DeepDiagnosisResult>(
      prompt,
      systemInstruction,
      (parsed) => {
        if (!parsed.rootCause || !parsed.evidence || typeof parsed.startLine !== 'number') {
          throw new Error('MALFORMED_ROOT_CAUSE: Root cause response missing rootCause, evidence, or line numbers.');
        }

        return {
          rootCause: String(parsed.rootCause),
          affectedFile: params.targetFile,
          affectedFunction: parsed.affectedFunction ? String(parsed.affectedFunction) : undefined,
          startLine: Math.max(1, Number(parsed.startLine)),
          endLine: Math.max(Number(parsed.startLine), Number(parsed.endLine)),
          evidence: String(parsed.evidence),
          explanation: String(parsed.explanation || parsed.technicalExplanation),
          technicalExplanation: String(parsed.technicalExplanation || parsed.explanation),
          flawExplanation: parsed.flawExplanation ? String(parsed.flawExplanation) : undefined,
          attackScenario: parsed.attackScenario ? String(parsed.attackScenario) : undefined,
          proposedSolution: String(parsed.proposedSolution || parsed.fixRationale),
          fixRationale: parsed.fixRationale ? String(parsed.fixRationale) : undefined,
          rule: parsed.rule ? String(parsed.rule) : undefined,
          confidence: Math.min(100, Math.max(1, Number(parsed.confidence) || 90)),
          severity: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.severity)
            ? parsed.severity
            : 'HIGH') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        };
      }
    );
  }
}
