import { GeminiProvider, defaultGeminiProvider } from './provider';
import { createUnifiedDiff } from '../sandbox';
import { RepairJobPatch } from '@/lib/types';

export interface GeneratedPatch extends RepairJobPatch {
  reason: string;
  diffLinesCount: number;
}

export class PatchGenerator {
  constructor(private provider: GeminiProvider = defaultGeminiProvider) {}

  public async generatePatch(params: {
    targetFile: string;
    originalContent: string;
    rootCause: string;
    explanation: string;
    proposedSolution?: string;
    compilerOrTestFeedback?: string;
  }): Promise<GeneratedPatch> {
    const systemInstruction = `You are a Principal Software Engineer & Autonomous Patch Generation Agent.
Your objective is to generate a minimal, surgically precise fix for the target file.
RULES:
1. Return the COMPLETE modified file content under the "afterCode" field. Do not truncate, omit code, or use comments like "// ...rest of file unchanged".
2. Preserve existing coding style, indentation, semicolons, naming conventions, and unrelated functions.
3. Fix ONLY the root cause; do not introduce unrelated refactorings or unnecessary changes.
4. Return a valid JSON object matching this schema:
{
  "explanation": "Clear explanation of the changes made",
  "reason": "Why this modification resolves the issue without regressions",
  "afterCode": "COMPLETE FULL TEXT OF THE FIXED FILE"
}`;

    const prompt = `Target File: ${params.targetFile}

Original File Content:
${params.originalContent}

Diagnosed Root Cause:
${params.rootCause}

Technical Breakdown:
${params.explanation}

${params.proposedSolution ? `Recommended Solution:\n${params.proposedSolution}\n` : ''}
${params.compilerOrTestFeedback ? `Previous Test / Execution Feedback:\n${params.compilerOrTestFeedback}\n` : ''}

Generate the minimal, correct fix preserving all unrelated code.`;

    const result = await this.provider.generateJSON<{
      explanation: string;
      reason: string;
      afterCode: string;
    }>(prompt, systemInstruction, (parsed) => {
      if (!parsed.afterCode || typeof parsed.afterCode !== 'string') {
        throw new Error('MALFORMED_PATCH: Patch generator did not produce valid afterCode.');
      }
      return parsed;
    });

    // Compute verified unified diff
    const unifiedDiff = createUnifiedDiff(
      params.targetFile,
      params.originalContent,
      result.afterCode
    );

    // Count additions and deletions
    let additions = 0;
    let deletions = 0;
    const diffLines = unifiedDiff.split('\n');

    for (const line of diffLines) {
      if (line.startsWith('+') && !line.startsWith('+++')) additions++;
      if (line.startsWith('-') && !line.startsWith('---')) deletions++;
    }

    return {
      file: params.targetFile,
      beforeCode: params.originalContent,
      afterCode: result.afterCode,
      unifiedDiff,
      additions,
      deletions,
      explanation: result.explanation || 'Automated surgical bug fix',
      reason: result.reason || 'Resolves identified root cause',
      diffLinesCount: diffLines.length,
      appliedSuccessfully: true,
    };
  }
}
