import { AIProviderInterface, ProviderHealth } from './types';
import { GoogleGenAI } from '@google/genai';

export class GeminiProvider implements AIProviderInterface {
  public readonly id = 'gemini';
  public readonly name = 'Google Gemini Cloud Intelligence';
  public readonly type = 'gemini' as const;

  private client: GoogleGenAI | null = null;
  private model: string;
  private apiKey: string;
  private static readonly FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model || process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    if (this.apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const now = new Date().toISOString();
    if (!this.apiKey || this.apiKey.includes('your-gemini-api-key')) {
      return {
        provider: 'gemini',
        status: 'DISCONNECTED',
        model: this.model,
        message: 'GEMINI_API_KEY is not configured in environment.',
        lastChecked: now,
      };
    }

    const start = Date.now();
    const probeCandidates = [this.model, ...GeminiProvider.FALLBACK_MODELS.filter(m => m !== this.model)];
    let lastError: any = null;

    for (const candidate of probeCandidates) {
      try {
        if (!this.client) {
          this.client = new GoogleGenAI({ apiKey: this.apiKey });
        }

        const res = await this.client.models.generateContent({
          model: candidate,
          contents: 'Ping: return {"status":"ok"} in JSON',
        });

        const latencyMs = Date.now() - start;
        this.model = candidate;

        return {
          provider: 'gemini',
          status: 'CONNECTED',
          model: candidate,
          latencyMs,
          availableModels: ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.8-flash'],
          message: `Gemini Cloud API healthy and responsive (${candidate}).`,
          lastChecked: now,
        };
      } catch (err: any) {
        lastError = err;
        // If model not found or temporarily unavailable, try next candidate
        if (err.message && (err.message.includes('404') || err.message.includes('503') || err.message.includes('not found') || err.message.includes('no longer available'))) {
          continue;
        }
        break;
      }
    }

    return {
      provider: 'gemini',
      status: 'ERROR',
      model: this.model,
      latencyMs: Date.now() - start,
      message: lastError?.message || 'Error connecting to Gemini API.',
      lastChecked: now,
    };
  }

  public async listModels(): Promise<string[]> {
    return ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.8-flash'];
  }

  public async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.client) {
      if (!this.apiKey) throw new Error('GEMINI_API_KEY_MISSING: Gemini API Key is required.');
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }

    const candidates = [this.model, ...GeminiProvider.FALLBACK_MODELS.filter(m => m !== this.model)];
    let lastErr: any;

    for (const candidate of candidates) {
      try {
        const response = await this.client.models.generateContent({
          model: candidate,
          contents: prompt,
          config: systemInstruction ? { systemInstruction } : undefined,
        });
        this.model = candidate;
        return response.text || '';
      } catch (err: any) {
        lastErr = err;
        if (err.message && (err.message.includes('404') || err.message.includes('503') || err.message.includes('no longer available'))) {
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  public async generateStructuredJSON<T>(
    prompt: string,
    schemaDescription: string,
    systemInstruction?: string
  ): Promise<T> {
    if (!this.client) {
      if (!this.apiKey) throw new Error('GEMINI_API_KEY_MISSING: Gemini API Key is required.');
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }

    const enrichedPrompt = `${prompt}\n\nStrict Output Requirements:\n- Respond with ONLY valid JSON conforming to this schema:\n${schemaDescription}\n- Do not wrap in markdown or backticks. Return raw JSON.`;

    const candidates = [this.model, ...GeminiProvider.FALLBACK_MODELS.filter(m => m !== this.model)];
    let lastErr: any;

    for (const candidate of candidates) {
      try {
        const response = await this.client.models.generateContent({
          model: candidate,
          contents: enrichedPrompt,
          config: {
            responseMimeType: 'application/json',
            systemInstruction,
          },
        });

        this.model = candidate;
        const rawText = response.text || '{}';
        const sanitized = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(sanitized) as T;
      } catch (err: any) {
        lastErr = err;
        if (err.message && (err.message.includes('404') || err.message.includes('503') || err.message.includes('no longer available'))) {
          continue;
        }
        if (err.message && err.message.includes('FAILED_TO_PARSE_GEMINI_JSON')) {
          throw err;
        }
        throw err;
      }
    }
    throw lastErr;
  }
}
