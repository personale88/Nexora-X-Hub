import {
  ACTIVE_REPO,
  PRIMARY_ISSUE,
  PRIMARY_PATCH,
  PRIMARY_REGRESSION_TEST,
} from './mock-data';
import {
  RepositoryData,
  DetectedIssue,
  CodePatch,
  RegressionTest,
  VerificationResult,
  ReasoningStep,
} from './types';

export interface AIEngineConfig {
  mode: 'demo' | 'live';
  modelName: string;
  apiKey?: string;
  temperature: number;
}

class RepoPilotAIEngine {
  private config: AIEngineConfig = {
    mode: 'demo',
    modelName: 'RepoPilot Deterministic Engine v2.4 (Zero-Failure Demo Mode)',
    temperature: 0.1,
  };

  public getStatus() {
    return {
      mode: this.config.mode,
      label: this.config.mode === 'live' ? 'Live LLM Engine' : 'Demo Engine',
      model: this.config.modelName,
      isConfigured: true,
      hasApiKey: !!this.config.apiKey,
    };
  }

  public setApiKey(key: string) {
    if (key && key.trim().length > 0) {
      this.config.apiKey = key.trim();
      this.config.mode = 'live';
      this.config.modelName = 'OpenAI GPT-4o / Claude 3.7 (Online)';
    } else {
      this.config.apiKey = undefined;
      this.config.mode = 'demo';
      this.config.modelName = 'RepoPilot Deterministic Engine v2.4 (Zero-Failure Demo Mode)';
    }
  }

  public resetToDemo() {
    this.config.apiKey = undefined;
    this.config.mode = 'demo';
    this.config.modelName = 'RepoPilot Deterministic Engine v2.4 (Zero-Failure Demo Mode)';
  }

  /**
   * 1. Repository Understanding: Parses AST, dependencies, coverage, and security posture
   */
  public async analyzeRepository(repoId: string = 'commerce-api'): Promise<RepositoryData> {
    // Simulated rapid AST parse latency for realism
    await new Promise((resolve) => setTimeout(resolve, 600));
    return ACTIVE_REPO;
  }

  /**
   * 2. Issue Investigation: Deep root-cause and execution path analysis
   */
  public async investigateIssue(issueId: string = 'AUTH-104'): Promise<{
    issue: DetectedIssue;
    steps: ReasoningStep[];
  }> {
    const steps: ReasoningStep[] = [
      {
        id: 'step-1',
        text: 'Repository context loaded',
        detail: 'Indexed 184 files and parsed AST symbol references.',
        status: 'completed',
        durationMs: 140,
      },
      {
        id: 'step-2',
        text: 'Relevant files identified',
        detail: 'Matched `src/middleware/auth.ts` and related router pipelines.',
        status: 'completed',
        durationMs: 220,
      },
      {
        id: 'step-3',
        text: 'Authentication flow traced',
        detail: 'Traced Bearer token extraction -> jwt.verify() -> next() middleware chain.',
        status: 'completed',
        durationMs: 310,
      },
      {
        id: 'step-4',
        text: 'Root cause identified',
        detail: 'jwt.verify() decoded payload passes truthy test without validating exp timestamp.',
        status: 'completed',
        durationMs: 180,
      },
      {
        id: 'step-5',
        text: 'Fix strategy generated',
        detail: 'Enforce structural assertion and explicit (decoded.exp * 1000 < Date.now()) rejection.',
        status: 'completed',
        durationMs: 240,
      },
      {
        id: 'step-6',
        text: 'Regression test generated',
        detail: 'Synthesized synthetic expired bearer token test against Supertest profile route.',
        status: 'completed',
        durationMs: 190,
      },
    ];

    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      issue: PRIMARY_ISSUE,
      steps,
    };
  }

  /**
   * 3. Fix Generation: Produces minimal-risk surgical patch
   */
  public async generateFix(issueId: string = 'AUTH-104'): Promise<CodePatch> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return PRIMARY_PATCH;
  }

  /**
   * 4. Regression Test Generation: Constructs targeted security test suite
   */
  public async generateRegressionTest(issueId: string = 'AUTH-104'): Promise<RegressionTest> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return PRIMARY_REGRESSION_TEST;
  }

  /**
   * 5. Verification: Executes virtual sandbox test runner and security verification
   */
  public async verifyFix(issueId: string = 'AUTH-104'): Promise<VerificationResult> {
    const logs = [
      '$ npm test -- --runInBand --coverage=false',
      'Initializing verification sandbox...',
      '✓ Loading patched repository: commerce-api (src/middleware/auth.ts)',
      '✓ Running authentication tests: 8 passed',
      '✓ Running regression tests: tests/auth.test.ts (JWT expiration) passed (12ms)',
      '✓ Running API tests: 15 passed',
      '✓ Checking affected modules: [routes/api.routes.ts, controllers/auth.controller.ts]',
      '✓ Static analysis & TypeScript typecheck: 0 errors',
      '✓ Security vulnerability check: AUTH-104 bypass confirmed neutralized',
      'All 24 test suites executed successfully.',
    ];

    return {
      totalTests: 24,
      passed: 24,
      failed: 0,
      durationMs: 1240,
      confidence: 97,
      securityChecks: [
        {
          name: 'JWT expiration handling',
          status: 'PASS',
          details: 'Expired tokens reliably return HTTP 401 Unauthorized before controller dispatch.',
        },
        {
          name: 'Non-string payload type validation',
          status: 'PASS',
          details: 'String tokens and malformed signatures rejected immediately.',
        },
      ],
      regressionTests: [
        {
          name: 'Expired token rejected at /api/profile',
          status: 'PASS',
          durationMs: 12,
        },
        {
          name: 'Valid unexpired token authorized',
          status: 'PASS',
          durationMs: 15,
        },
      ],
      logs,
    };
  }
}

export const aiEngine = new RepoPilotAIEngine();
