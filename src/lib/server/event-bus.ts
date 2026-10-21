import { RepairEvent } from '@/lib/types';
import { EventEmitter } from 'events';

class JobEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  public emit(jobId: string, event: RepairEvent): void {
    this.emitter.emit(`job:${jobId}`, event);
  }

  public subscribe(
    jobId: string,
    callback: (event: RepairEvent) => void
  ): () => void {
    const channel = `job:${jobId}`;
    this.emitter.on(channel, callback);
    return () => {
      this.emitter.off(channel, callback);
    };
  }
}

// Global singleton across server runtime
const globalEventBus = (global as any).__repopilot_event_bus || new JobEventBus();
if (!(global as any).__repopilot_event_bus) {
  (global as any).__repopilot_event_bus = globalEventBus;
}

export const jobEventBus: JobEventBus = globalEventBus;
