import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { createRepairJob, getRepairJobsByUserId } from '@/lib/server/db';
import { runAutonomousRepairPipeline } from '@/lib/server/repair-pipeline';
import path from 'path';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const jobs = getRepairJobsByUserId(auth.user.id);
  return NextResponse.json({
    success: true,
    jobs,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const {
      repository,
      issueDescription,
      issueCode,
      reproductionEvidence,
      maxRetries,
    } = body;

    const defaultFixturePath = path.join(process.cwd(), 'fixtures', 'sample-vulnerable-repo');

    const jobRepo = {
      owner: repository?.owner || 'personale88',
      name: repository?.name || 'Nexora-X-Hub',
      branch: repository?.branch || 'main',
      gitUrl: repository?.gitUrl || 'https://github.com/personale88/Nexora-X-Hub.git',
      pinnedCommitSha: repository?.pinnedCommitSha || '7a8f93e210b48c909d8e7f1234a56b78c90d1e2f',
      localPath: repository?.localPath || defaultFixturePath,
    };

    const job = createRepairJob({
      userId: auth.user.id,
      repository: jobRepo,
      issueDescription:
        issueDescription ||
        'AUTH-104: Expired JWT tokens bypass authentication middleware without exp timestamp verification.',
      issueCode: issueCode || 'AUTH-104',
      reproductionEvidence,
      maxRetries: typeof maxRetries === 'number' ? maxRetries : 3,
    });

    // Run the pipeline asynchronously in background
    setTimeout(() => {
      runAutonomousRepairPipeline(job.id).catch((err) => {
        console.error(`Autonomous pipeline execution error for job ${job.id}:`, err);
      });
    }, 100);

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'CREATE_JOB_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
