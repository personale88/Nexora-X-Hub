import { GeminiProvider, defaultGeminiProvider } from './provider';

export interface GeneratedRegressionTest {
  filename: string;
  code: string;
  framework: string;
  suiteName: string;
  description: string;
  expectedBehavior: string;
}

export class RegressionTestGenerator {
  constructor(private provider: GeminiProvider = defaultGeminiProvider) {}

  public async generateTest(params: {
    targetFile: string;
    originalContent: string;
    patchedContent: string;
    rootCause: string;
    testFramework?: string;
    existingTestSample?: string;
    packageJsonContent?: string;
  }): Promise<GeneratedRegressionTest> {
    const systemInstruction = `You are a Principal Test Automation & Quality Assurance Engineer.
Your objective is to generate a comprehensive, runnable regression test that verifies the bug fix.
RULES:
1. The test must test the exact boundary condition, edge case, or vulnerability that was patched.
2. Use the repository's detected test framework (${params.testFramework || 'auto-detect'}).
3. Output the FULL, runnable test file code in "code". Do not use placeholders or omit imports.
4. Return a valid JSON object matching this schema:
{
  "filename": "tests/regression-test.spec.js",
  "framework": "${params.testFramework || 'jest'}",
  "suiteName": "Regression Test Suite",
  "description": "Verifies that the root cause cannot recur",
  "expectedBehavior": "Expected assertion outcomes",
  "code": "COMPLETE RUNNABLE TEST CODE"
}`;

    const prompt = `Target File Under Test: ${params.targetFile}

Original Flawed Code:
${params.originalContent}

Patched Code:
${params.patchedContent}

Diagnosed Root Cause:
${params.rootCause}

${params.packageJsonContent ? `package.json:\n${params.packageJsonContent.slice(0, 1500)}\n` : ''}
${params.existingTestSample ? `Sample Existing Test in Repo:\n${params.existingTestSample.slice(0, 1500)}\n` : ''}

Generate a standalone executable regression test file targeting this bug.`;

    return this.provider.generateJSON<GeneratedRegressionTest>(
      prompt,
      systemInstruction,
      (parsed) => {
        if (!parsed.code || !parsed.filename) {
          throw new Error('MALFORMED_TEST: Regression test generator did not produce valid code or filename.');
        }
        return parsed as GeneratedRegressionTest;
      }
    );
  }
}
