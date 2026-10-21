import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getRepairJob, getRepairEvents } from '@/lib/server/db';
import { jobEventBus } from '@/lib/server/event-bus';
import { RepairEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

  // Parse reconnect sequence
  const { searchParams } = new URL(req.url);
  const lastEventIdHeader = req.headers.get('last-event-id');
  let afterSequence = 0;

  if (lastEventIdHeader) {
    const parts = lastEventIdHeader.split('_');
    const seq = parseInt(parts[parts.length - 2], 10);
    if (!isNaN(seq)) afterSequence = seq;
  } else if (searchParams.get('afterSequence')) {
    afterSequence = parseInt(searchParams.get('afterSequence') || '0', 10) || 0;
  }

  // Set up SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function sendEvent(event: RepairEvent) {
        const payload = `id: ${event.eventId}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // stream closed
        }
      }

      // 1. Replay missed historical events
      const historicalEvents = getRepairEvents(jobId, afterSequence);
      for (const ev of historicalEvents) {
        sendEvent(ev);
      }

      // If job is already completed/failed/cancelled and no more events expected
      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) {
        // keep alive brief moment then close
        setTimeout(() => {
          try {
            controller.close();
          } catch {
            // ignore
          }
        }, 1000);
        return;
      }

      // 2. Subscribe to real-time events
      const unsubscribe = jobEventBus.subscribe(jobId, (liveEvent) => {
        sendEvent(liveEvent);

        if (['repair.verified', 'repair.failed', 'repair.cancelled', 'repair.needs_review'].includes(liveEvent.type)) {
          setTimeout(() => {
            try {
              controller.close();
            } catch {
              // ignore
            }
          }, 1500);
        }
      });

      // 3. Heartbeat interval
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatTimer);
          unsubscribe();
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatTimer);
        unsubscribe();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
