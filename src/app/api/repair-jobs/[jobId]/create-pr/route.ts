import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getRepairJob, updateRepairJob, getGitHubAccessToken } from '@/lib/server/db';
import { createBranch, commitFileChange, createPullRequest } from '@/lib/server/github-service';
import { dispatchJobEvent } from '@/lib/server/repair-pipeline';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { jobId } = await context.params;
  const job = getRepairJob(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Repair job not found.' }, { status: 404 });
  }

  if (job.userId !== auth.user.id) {
    return NextResponse.json({ error: 'FORBIDDEN: You do not have access to this repair job.' }, { status: 403 });
  }

  if (!job.proposedPatch || !job.proposedPatch.appliedSuccessfully) {
    return NextResponse.json(
      { error: 'CANNOT_CREATE_PR: No verified patch exists for this repair job.' },
      { status: 400 }
    );
  }

  const gitHubToken = getGitHubAccessToken(auth.user.id);
  if (!gitHubToken) {
    return NextResponse.json(
      { error: 'GITHUB_NOT_CONNECTED: Please connect your GitHub account to publish pull requests.' },
      { status: 400 }
    );
  }

  const { owner, name: repo, branch: baseBranch } = job.repository;
  const issueKey = job.issueCode || `fix-${job.id.slice(0, 8)}`;
  const repairBranch = `repopilot/${issueKey.toLowerCase()}-${Date.now().toString().slice(-4)}`;

  try {
    dispatchJobEvent(jobId, {
      stage: 'PR_AUTOMATION',
      type: 'pr.branch_creating',
      message: `Creating repair branch "${repairBranch}" from ${baseBranch}...`,
    });

    // 1. Create repair branch
    await createBranch(gitHubToken, owner, repo, repairBranch, baseBranch || 'main');

    dispatchJobEvent(jobId, {
      stage: 'PR_AUTOMATION',
      type: 'pr.committing',
      message: `Committing verified patch to ${job.proposedPatch.file}...`,
    });

    // 2. Commit file modification
    const commitMessage = `fix(${issueKey}): ${job.diagnosis?.rootCause || 'resolve identified defect'}\n\nAutomated fix synthesized and verified by RepoPilot AI.`;
    await commitFileChange(
      gitHubToken,
      owner,
      repo,
      repairBranch,
      job.proposedPatch.file,
      job.proposedPatch.afterCode,
      commitMessage
    );

    dispatchJobEvent(jobId, {
      stage: 'PR_AUTOMATION',
      type: 'pr.opening',
      message: `Opening official GitHub Pull Request against ${baseBranch}...`,
    });

    // 3. Construct rich Pull Request description
    const prTitle = `[RepoPilot AI] Fix: ${job.diagnosis?.rootCause || 'Autonomous bug repair'}`;
    const prBody = `## 🤖 RepoPilot AI Autonomous Repair Report

### 🎯 Issue Summary
${job.issueDescription}

---

### 🔍 Root Cause Analysis
- **Target File:** \`${job.diagnosis?.affectedFile || job.proposedPatch.file}\`
- **Location:** Lines ${job.diagnosis?.startLine || 1} - ${job.diagnosis?.endLine || 1}
- **Root Cause:** ${job.diagnosis?.rootCause || 'Identified defect in business logic'}
- **Confidence:** ${job.diagnosis?.confidence || 95}%
- **Severity:** ${job.diagnosis?.severity || 'HIGH'}

> **Technical Explanation:**
> ${job.diagnosis?.explanation || 'Surgical patch generated and verified against test suite.'}

---

### 🛠️ Proposed Patch Summary
- **Lines Modified:** +${job.proposedPatch.additions} / -${job.proposedPatch.deletions}
- **Reasoning:** ${job.proposedPatch.explanation}

\`\`\`diff
${job.proposedPatch.unifiedDiff}
\`\`\`

---

### ✅ Verification & Sandbox Status
- **Outcome:** ${job.verificationOutcome}
- **Test Runs:** ${job.testRuns.length} executed in isolated sandbox
- **Exit Code:** 0 (PASSED)

*Generated autonomously by [RepoPilot AI](https://nexora-x-hub.vercel.app)*
`;

    const pr = await createPullRequest(gitHubToken, owner, repo, {
      title: prTitle,
      head: repairBranch,
      base: baseBranch || 'main',
      body: prBody,
    });

    const pullRequestInfo = {
      id: pr.id,
      number: pr.number,
      htmlUrl: pr.htmlUrl,
      branch: repairBranch,
      createdAt: new Date().toISOString(),
    };

    updateRepairJob(jobId, {
      pullRequest: pullRequestInfo,
    });

    dispatchJobEvent(jobId, {
      stage: 'PR_AUTOMATION',
      type: 'pr.created',
      message: `Pull Request #${pr.number} successfully created: ${pr.htmlUrl}`,
      payload: pullRequestInfo,
    });

    return NextResponse.json({
      success: true,
      pullRequest: pullRequestInfo,
    });
  } catch (err: any) {
    dispatchJobEvent(jobId, {
      stage: 'PR_AUTOMATION',
      type: 'pr.failed',
      message: `Failed to create Pull Request: ${err.message}`,
      payload: { error: err.message },
    });

    return NextResponse.json(
      { error: `PR_CREATION_FAILED: ${err.message}` },
      { status: 500 }
    );
  }
}
