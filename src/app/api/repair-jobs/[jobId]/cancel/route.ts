import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getRepairJob } from '@/lib/server/db';
import { cancelRepairJob } from '@/lib/server/repair-pipeline';

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

  const success = cancelRepairJob(jobId);

  return NextResponse.json({
    success,
    jobId,
    status: 'CANCELLED',
  });
}
