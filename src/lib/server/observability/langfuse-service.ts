/**
 * RepoPilot AI — Langfuse Observability & Tracing Engine
 * Monitors LLM latency, prompt inputs, model outputs, token usage,
 * and repair job accuracy. Enforces strict credential redaction.
 */

import { Langfuse } from 'langfuse';

export interface ObservabilityTraceData {
  jobId: string;
  repository: string;
  model: string;
  provider: string;
  prompt: string;
  response: string;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
}

// Sensitive patterns to automatically redact from traces
const REDACT_PATTERNS = [
  /ghp_[A-Za-z0-9]{36}/g,
  /github_pat_[A-Za-z0-9_]{82}/g,
  /AIza[0-9A-Za-z-_]{35}/g,
  /(?:password|passwd|secret|api_key|token)\s*[:=]\s*['"][^'"]+['"]/gi,
];

function sanitizeForObservability(text: string): string {
  let sanitized = text;
  for (const pattern of REDACT_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
  }
  return sanitized;
}

export class LangfuseObservabilityService {
  private client: Langfuse | null = null;
  private isConfigured = false;

  constructor() {
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const baseUrl = process.env.LANGFUSE_BASE_URL || 'http://localhost:3000';

    if (publicKey && secretKey && !publicKey.includes('your-')) {
      try {
        this.client = new Langfuse({
          publicKey,
          secretKey,
          baseUrl,
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('Langfuse client init fallback:', err);
      }
    }
  }

  /**
   * Log an AI generation trace to Langfuse with secret sanitization
   */
  public async traceGeneration(data: ObservabilityTraceData): Promise<void> {
    const sanitizedPrompt = sanitizeForObservability(data.prompt);
    const sanitizedResponse = sanitizeForObservability(data.response);

    if (this.client && this.isConfigured) {
      try {
        const trace = this.client.trace({
          id: `trace_${data.jobId}_${Date.now()}`,
          name: `repair_job_${data.jobId}`,
          metadata: {
            repository: data.repository,
            provider: data.provider,
            model: data.model,
          },
        });

        trace.generation({
          name: 'ai_investigation_and_patch',
          model: data.model,
          input: sanitizedPrompt,
          output: sanitizedResponse,
          level: data.status === 'SUCCESS' ? 'DEFAULT' : 'ERROR',
          statusMessage: data.error,
        });

        await this.client.flushAsync();
        return;
      } catch (err) {
        console.warn('Langfuse trace export warning:', err);
      }
    }

    // Local structured trace log when Langfuse is not running
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[Observability Trace] Job=${data.jobId} Model=${data.model} Provider=${data.provider} Duration=${data.durationMs}ms Status=${data.status}`
      );
    }
  }
}

export const langfuseService = new LangfuseObservabilityService();
