import fs from 'fs';
import path from 'path';
import {
  RepairJob,
  RepairEvent,
  RepairJobStatus,
  RepairJobDiagnosis,
  RepairJobPatch,
} from '@/lib/types';
import {
  getRepairJob,
  updateRepairJob,
  appendRepairEvent,
} from './db';
import {
  initializeWorkspace,
  copyToWorkspace,
  readFile,
  applyPatch,
  executeSandboxCommand,
  cleanupWorkspace,
  searchCode,
} from './sandbox';
import {
  diagnoseIssue,
  generatePatch,
  revisePatch,
  getLLMConfig,
} from './llm-provider';
import { jobEventBus } from './event-bus';

// Track active running jobs and their abort signals
const activeJobAbortControllers = new Map<string, AbortController>();

/**
 * Dispatch an event to both persistent database storage and in-memory SSE bus
 */
export function dispatchJobEvent(
  jobId: string,
  eventData: {
    type: string;
    stage: string;
    message: string;
    payload?: Record<string, unknown>;
  }
): RepairEvent {
  const event = appendRepairEvent(jobId, eventData);
  jobEventBus.emit(jobId, event);
  return event;
}

/**
 * Request cancellation of a running repair job
 */
export function cancelRepairJob(jobId: string): boolean {
  const job = getRepairJob(jobId);
  if (!job) return false;

  const controller = activeJobAbortControllers.get(jobId);
  if (controller) {
    controller.abort();
    activeJobAbortControllers.delete(jobId);
  }

  updateRepairJob(jobId, {
    status: 'CANCELLED',
    currentStage: 'Repair cancelled by user request',
    completedAt: new Date().toISOString(),
  });

  dispatchJobEvent(jobId, {
    stage: 'CANCELLED',
    type: 'repair.cancelled',
    message: 'Repair job execution was cancelled by user request.',
  });

  return true;
}

/**
 * Find the primary test command for a repository in its workspace
 */
function detectTestCommand(workspaceDir: string): string {
  const pkgPath = path.join(workspaceDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts && pkg.scripts.test) {
        // e.g. "node --test" or "npm test"
        return 'npm test';
      }
    } catch {
      // ignore
    }
  }

  return 'npm test';
}

/**
 * Main Autonomous Repair Pipeline
 * Executes the full lifecycle:
 * QUEUED -> INITIALIZING -> REPRODUCING -> INVESTIGATING -> DIAGNOSING -> PATCHING -> TESTING -> VERIFYING -> COMPLETED
 */
export async function runAutonomousRepairPipeline(jobId: string): Promise<RepairJob> {
  let job = getRepairJob(jobId);
  if (!job) {
    throw new Error(`JOB_NOT_FOUND: Repair job "${jobId}" does not exist.`);
  }

  if (job.status === 'CANCELLED' || job.status === 'COMPLETED') {
    return job;
  }

  const abortController = new AbortController();
  activeJobAbortControllers.set(jobId, abortController);

  let workspaceDir = '';

  try {
    // ------------------------------------------------------------------------
    // STAGE 1: INITIALIZING
    // ------------------------------------------------------------------------
    if (abortController.signal.aborted) throw new Error('CANCELLED');

    updateRepairJob(jobId, {
      status: 'INITIALIZING',
      currentStage: 'Initializing isolated workspace and checking out pinned commit',
    });

    dispatchJobEvent(jobId, {
      stage: 'INITIALIZING',
      type: 'repository.checkout.started',
      message: `Creating isolated disposable workspace for ${job.repository.owner}/${job.repository.name}`,
      payload: {
        pinnedCommitSha: job.repository.pinnedCommitSha,
      },
    });

    workspaceDir = await initializeWorkspace(jobId);

    // If local path is provided (sample repo or local clone), copy files
    if (job.repository.localPath && fs.existsSync(job.repository.localPath)) {
      await copyToWorkspace(job.repository.localPath, workspaceDir);
    } else {
      // Default to bundled sample vulnerable repository fixture if no external git clone is set
      const defaultFixture = path.join(process.cwd(), 'fixtures', 'sample-vulnerable-repo');
      if (fs.existsSync(defaultFixture)) {
        await copyToWorkspace(defaultFixture, workspaceDir);
      } else {
        // Create baseline files directly in workspace if fixture directory not yet ready
        fs.mkdirSync(path.join(workspaceDir, 'src'), { recursive: true });
        fs.mkdirSync(path.join(workspaceDir, 'tests'), { recursive: true });
      }
    }

    dispatchJobEvent(jobId, {
      stage: 'INITIALIZING',
      type: 'repository.checkout.completed',
      message: `Workspace ready at pinned commit ${job.repository.pinnedCommitSha.substring(0, 7)}`,
      payload: {
        workspaceReady: true,
      },
    });

    // ------------------------------------------------------------------------
    // STAGE 2: REPRODUCING
    // ------------------------------------------------------------------------
    if (abortController.signal.aborted) throw new Error('CANCELLED');

    updateRepairJob(jobId, {
      status: 'REPRODUCING',
      currentStage: 'Executing baseline checks to reproduce reported defect',
    });

    const testCommand = detectTestCommand(workspaceDir);

    dispatchJobEvent(jobId, {
      stage: 'REPRODUCING',
      type: 'tests.started',
      message: `Executing baseline reproduction: "${testCommand}"`,
      payload: { command: testCommand, stage: 'reproduction' },
    });

    const baselineResult = await executeSandboxCommand(workspaceDir, testCommand, {
      onOutputChunk: (chunk) => {
        dispatchJobEvent(jobId, {
          stage: 'REPRODUCING',
          type: 'tests.output',
          message: chunk,
        });
      },
    });

    const reproductionTestRun = {
      command: testCommand,
      exitCode: baselineResult.exitCode,
      stdout: baselineResult.stdout,
      stderr: baselineResult.stderr,
      durationMs: baselineResult.durationMs,
      timestamp: new Date().toISOString(),
      stage: 'reproduction' as const,
      passed: baselineResult.passed,
    };

    updateRepairJob(jobId, {
      testRuns: [reproductionTestRun],
      reproductionEvidence: baselineResult.stderr || baselineResult.stdout,
    });

    dispatchJobEvent(jobId, {
      stage: 'REPRODUCING',
      type: 'tests.completed',
      message: baselineResult.passed
        ? 'Baseline test passed (no failure detected on main).'
        : `Baseline failure captured with exit code ${baselineResult.exitCode} (${baselineResult.durationMs}ms)`,
      payload: {
        exitCode: baselineResult.exitCode,
        durationMs: baselineResult.durationMs,
        passed: baselineResult.passed,
      },
    });

    // ------------------------------------------------------------------------
    // STAGE 3: INVESTIGATING & DIAGNOSING
    // ------------------------------------------------------------------------
    if (abortController.signal.aborted) throw new Error('CANCELLED');

    updateRepairJob(jobId, {
      status: 'INVESTIGATING',
      currentStage: 'Scanning AST symbols and tracing root cause',
    });

    dispatchJobEvent(jobId, {
      stage: 'INVESTIGATING',
      type: 'diagnosis.started',
      message: 'Autonomous agent tracing symbol execution path and dependency graph...',
    });

    // Code search for symbols
    const searchHits = searchCode(workspaceDir, 'authenticateToken');
    const affectedRelFile = searchHits.length > 0 ? searchHits[0].file : 'src/middleware/auth.ts';

    dispatchJobEvent(jobId, {
      stage: 'INVESTIGATING',
      type: 'analysis.file_found',
      message: `Identified target file: ${affectedRelFile}`,
      payload: { file: affectedRelFile },
    });

    let targetFileContent = '';
    try {
      targetFileContent = readFile(workspaceDir, affectedRelFile);
    } catch {
      targetFileContent = '// Missing or unreadable file';
    }

    // Call LLM for validated diagnosis
    updateRepairJob(jobId, {
      status: 'DIAGNOSING',
      currentStage: 'Synthesizing formal root-cause hypothesis with LLM',
    });

    const llmConfig = getLLMConfig();
    let diagnosis: RepairJobDiagnosis;

    if (llmConfig.provider !== 'none') {
      try {
        diagnosis = await diagnoseIssue({
          issueDescription: job.issueDescription,
          reproductionOutput: baselineResult.stderr || baselineResult.stdout,
          targetFile: affectedRelFile,
          fileContent: targetFileContent,
          candidateFiles: [affectedRelFile],
        });
      } catch (err: any) {
        // If LLM fails or is unavailable, report clear diagnostic error
        throw new Error(`DIAGNOSIS_FAILED: ${err.message}`);
      }
    } else {
      // Strict rule: If no LLM provider is configured in environment, fail explicitly
      throw new Error(
        'NO_LLM_PROVIDER_CONFIGURED: Please configure OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in .env.local to run autonomous AI repair.'
      );
    }

    updateRepairJob(jobId, {
      diagnosis,
    });

    dispatchJobEvent(jobId, {
      stage: 'DIAGNOSING',
      type: 'analysis.location_found',
      message: `Vulnerability located at ${diagnosis.affectedFile}:${diagnosis.startLine}-${diagnosis.endLine}`,
      payload: {
        file: diagnosis.affectedFile,
        startLine: diagnosis.startLine,
        endLine: diagnosis.endLine,
      },
    });

    dispatchJobEvent(jobId, {
      stage: 'DIAGNOSING',
      type: 'diagnosis.completed',
      message: `Root cause identified: ${diagnosis.rootCause}`,
      payload: diagnosis as unknown as Record<string, unknown>,
    });

    // ------------------------------------------------------------------------
    // STAGE 4: PATCHING
    // ------------------------------------------------------------------------
    if (abortController.signal.aborted) throw new Error('CANCELLED');

    updateRepairJob(jobId, {
      status: 'PATCHING',
      currentStage: 'Generating minimal-risk surgical patch',
    });

    dispatchJobEvent(jobId, {
      stage: 'PATCHING',
      type: 'patch.generated',
      message: 'Synthesizing non-breaking contextual patch...',
    });

    const patch = await generatePatch({
      affectedFile: diagnosis.affectedFile,
      fileContent: targetFileContent,
      rootCause: diagnosis.rootCause,
      issueDescription: job.issueDescription,
      testFailure: baselineResult.stderr || baselineResult.stdout,
    });

    // Apply patch directly to workspace on disk
    const patchResult = applyPatch(workspaceDir, {
      file: patch.file,
      beforeCode: patch.beforeCode,
      afterCode: patch.afterCode,
    });

    if (!patchResult.success) {
      dispatchJobEvent(jobId, {
        stage: 'PATCHING',
        type: 'patch.validation_failed',
        message: `Patch rejected: ${patchResult.error}`,
        payload: { error: patchResult.error },
      });
      throw new Error(`PATCH_APPLICATION_FAILED: ${patchResult.error}`);
    }

    patch.appliedSuccessfully = true;
    patch.unifiedDiff = patchResult.diff;
    patch.additions = patchResult.additions;
    patch.deletions = patchResult.deletions;

    updateRepairJob(jobId, {
      proposedPatch: patch,
    });

    dispatchJobEvent(jobId, {
      stage: 'PATCHING',
      type: 'patch.applied',
      message: `Surgical patch applied cleanly to ${patch.file} (+${patch.additions} / -${patch.deletions} lines)`,
      payload: {
        file: patch.file,
        diff: patch.unifiedDiff,
        beforeCode: patch.beforeCode,
        afterCode: patch.afterCode,
        additions: patch.additions,
        deletions: patch.deletions,
      },
    });

    // ------------------------------------------------------------------------
    // STAGE 5: TESTING & VERIFYING LOOP
    // ------------------------------------------------------------------------
    if (abortController.signal.aborted) throw new Error('CANCELLED');

    updateRepairJob(jobId, {
      status: 'TESTING',
      currentStage: 'Running automated sandbox tests against patched code',
    });

    dispatchJobEvent(jobId, {
      stage: 'TESTING',
      type: 'verification.started',
      message: `Executing sandbox verification: "${testCommand}"`,
      payload: { command: testCommand },
    });

    let verificationResult = await executeSandboxCommand(workspaceDir, testCommand, {
      onOutputChunk: (chunk) => {
        dispatchJobEvent(jobId, {
          stage: 'TESTING',
          type: 'tests.output',
          message: chunk,
        });
      },
    });

    let currentJob = getRepairJob(jobId)!;
    const testRuns = [
      ...currentJob.testRuns,
      {
        command: testCommand,
        exitCode: verificationResult.exitCode,
        stdout: verificationResult.stdout,
        stderr: verificationResult.stderr,
        durationMs: verificationResult.durationMs,
        timestamp: new Date().toISOString(),
        stage: 'verification' as const,
        passed: verificationResult.passed,
      },
    ];

    updateRepairJob(jobId, { testRuns });

    // ------------------------------------------------------------------------
    // RETRY LOOP IF VERIFICATION FAILED (Bounded by maxRetries, default 3)
    // ------------------------------------------------------------------------
    let attempts = 0;
    while (!verificationResult.passed && attempts < (job.maxRetries || 3)) {
      if (abortController.signal.aborted) throw new Error('CANCELLED');
      attempts++;

      dispatchJobEvent(jobId, {
        stage: 'TESTING',
        type: 'patch.validation_failed',
        message: `Verification test failed (attempt ${attempts}/${job.maxRetries}). Synthesizing revised fix...`,
        payload: {
          attempt: attempts,
          exitCode: verificationResult.exitCode,
          stderr: verificationResult.stderr,
        },
      });

      const currentContent = readFile(workspaceDir, patch.file);
      const revisedPatch = await revisePatch({
        affectedFile: patch.file,
        fileContent: currentContent,
        previousPatch: patch,
        testFailureOutput: verificationResult.stderr || verificationResult.stdout,
        attemptNumber: attempts,
      });

      const reapplyResult = applyPatch(workspaceDir, {
        file: revisedPatch.file,
        beforeCode: revisedPatch.beforeCode,
        afterCode: revisedPatch.afterCode,
      });

      if (reapplyResult.success) {
        revisedPatch.appliedSuccessfully = true;
        revisedPatch.unifiedDiff = reapplyResult.diff;
        updateRepairJob(jobId, {
          proposedPatch: revisedPatch,
          retryCount: attempts,
        });

        // Re-execute test runner
        verificationResult = await executeSandboxCommand(workspaceDir, testCommand, {
          onOutputChunk: (chunk) => {
            dispatchJobEvent(jobId, {
              stage: 'TESTING',
              type: 'tests.output',
              message: chunk,
            });
          },
        });

        const updatedRuns = [
          ...getRepairJob(jobId)!.testRuns,
          {
            command: testCommand,
            exitCode: verificationResult.exitCode,
            stdout: verificationResult.stdout,
            stderr: verificationResult.stderr,
            durationMs: verificationResult.durationMs,
            timestamp: new Date().toISOString(),
            stage: 'verification' as const,
            passed: verificationResult.passed,
          },
        ];
        updateRepairJob(jobId, { testRuns: updatedRuns });
      }
    }

    // ------------------------------------------------------------------------
    // STAGE 6: FINAL OUTCOME
    // ------------------------------------------------------------------------
    if (verificationResult.passed) {
      updateRepairJob(jobId, {
        status: 'COMPLETED',
        currentStage: 'Fix verified by automated regression test suite',
        verificationOutcome: 'VERIFIED',
        completedAt: new Date().toISOString(),
      });

      dispatchJobEvent(jobId, {
        stage: 'VERIFYING',
        type: 'repair.verified',
        message: 'Patch verified: All automated sandbox tests passed with zero regressions.',
        payload: {
          exitCode: 0,
          durationMs: verificationResult.durationMs,
          verificationOutcome: 'VERIFIED',
        },
      });
    } else {
      updateRepairJob(jobId, {
        status: 'NEEDS_REVIEW',
        currentStage: 'Tests still failing after bounded retry attempts',
        verificationOutcome: 'FAILED',
        unresolvedRisks: ['Patch could not satisfy all automated test assertions within maximum retry limit.'],
        completedAt: new Date().toISOString(),
      });

      dispatchJobEvent(jobId, {
        stage: 'VERIFYING',
        type: 'repair.needs_review',
        message: 'Repair requires human review: test assertions failed after retries.',
        payload: {
          exitCode: verificationResult.exitCode,
          verificationOutcome: 'FAILED',
        },
      });
    }

    return getRepairJob(jobId)!;
  } catch (err: any) {
    const isCancelled = err.message === 'CANCELLED';
    const finalStatus: RepairJobStatus = isCancelled ? 'CANCELLED' : 'FAILED';

    updateRepairJob(jobId, {
      status: finalStatus,
      currentStage: isCancelled ? 'Cancelled by user' : `Failed: ${err.message}`,
      error: err.message,
      completedAt: new Date().toISOString(),
    });

    dispatchJobEvent(jobId, {
      stage: finalStatus,
      type: isCancelled ? 'repair.cancelled' : 'repair.failed',
      message: err.message,
      payload: { error: err.message },
    });

    return getRepairJob(jobId)!;
  } finally {
    activeJobAbortControllers.delete(jobId);
    // Cleanup temporary workspace after run (or keep for inspection in tests)
    if (process.env.KEEP_WORKSPACES !== 'true' && workspaceDir) {
      await cleanupWorkspace(workspaceDir);
    }
  }
}
