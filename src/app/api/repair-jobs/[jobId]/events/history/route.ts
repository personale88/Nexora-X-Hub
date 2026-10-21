import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getRepairJob, getRepairEvents } from '@/lib/server/db';

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

  if (job.userId !== auth.user.id) {
    return NextResponse.json({ error: 'FORBIDDEN: You do not have access to this repair job.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const afterSequence = parseInt(searchParams.get('afterSequence') || '0', 10) || 0;

  const events = getRepairEvents(jobId, afterSequence);

  return NextResponse.json({
    success: true,
    jobId,
    count: events.length,
    events,
  });
}
