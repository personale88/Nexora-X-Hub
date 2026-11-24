import { GeminiProvider, defaultGeminiProvider } from './provider';

export interface CodeReviewResult {
  status: 'APPROVED' | 'CHANGES_REQUESTED';
  score: number;
  summary: string;
  safetyChecks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  potentialRisks: string[];
  suggestedImprovements: string[];
}

export class CodeReviewAgent {
  constructor(private provider: GeminiProvider = defaultGeminiProvider) {}

  public async reviewPatch(params: {
    targetFile: string;
    beforeCode: string;
    afterCode: string;
    unifiedDiff: string;
    rootCause: string;
  }): Promise<CodeReviewResult> {
    const systemInstruction = `You are a Principal Software Security Auditor & Staff Engineer.
Perform a strict code review on the proposed patch diff.
Inspect for:
1. Regressions and unintended side effects.
2. New vulnerabilities (OWASP Top 10, memory leaks, unhandled exceptions).
3. API contract breaks or backward compatibility failures.
4. Minimal footprint (no unnecessary changes).
You must return a valid JSON object matching this schema:
{
  "status": "APPROVED" | "CHANGES_REQUESTED",
  "score": number (0-100),
  "summary": "Concise review verdict",
  "safetyChecks": [
    { "name": "Vulnerability Check", "passed": true, "details": "No new vulnerabilities introduced" },
    { "name": "API Compatibility", "passed": true, "details": "Function signatures preserved" },
    { "name": "Minimal Footprint", "passed": true, "details": "Changes restricted to root cause" }
  ],
  "potentialRisks": ["Risk description if any"],
  "suggestedImprovements": ["Suggestion if any"]
}`;

    const prompt = `Target File: ${params.targetFile}

Diagnosed Root Cause:
${params.rootCause}

Unified Diff:
${params.unifiedDiff}

Original File:
${params.beforeCode.slice(0, 3000)}

Patched File:
${params.afterCode.slice(0, 3000)}

Review the proposed patch thoroughly.`;

    return this.provider.generateJSON<CodeReviewResult>(
      prompt,
      systemInstruction,
      (parsed) => {
        if (!parsed.status || !Array.isArray(parsed.safetyChecks)) {
          throw new Error('MALFORMED_REVIEW: Code review missing status or safety checks.');
        }
        return parsed as CodeReviewResult;
      }
    );
  }
}
