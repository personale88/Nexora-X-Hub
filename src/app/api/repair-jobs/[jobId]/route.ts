import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getRepairJob } from '@/lib/server/db';

export async function GET(
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

  // Authorization check: ensure user owns this job
  if (job.userId !== auth.user.id) {
    return NextResponse.json({ error: 'FORBIDDEN: You do not have access to this repair job.' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    job,
  });
}
