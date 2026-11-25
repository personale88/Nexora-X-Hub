import { AIProviderInterface, ProviderHealth } from './types';
import { GoogleGenAI } from '@google/genai';

export class GeminiProvider implements AIProviderInterface {
  public readonly id = 'gemini';
  public readonly name = 'Google Gemini 2.0 Flash Intelligence';
  public readonly type = 'gemini' as const;

  private client: GoogleGenAI | null = null;
  private model: string;
  private apiKey: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';

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
    try {
      if (!this.client) {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      }

      // Lightweight probe
      const res = await this.client.models.generateContent({
        model: this.model,
        contents: 'Ping: return {"status":"ok"} in JSON',
      });

      const latencyMs = Date.now() - start;
      const text = res.text?.trim() || '';

      return {
        provider: 'gemini',
        status: 'CONNECTED',
        model: this.model,
        latencyMs,
        availableModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
        message: 'Gemini Cloud API healthy and responsive.',
        lastChecked: now,
      };
    } catch (err: any) {
      return {
        provider: 'gemini',
        status: 'ERROR',
        model: this.model,
        latencyMs: Date.now() - start,
        message: err.message || 'Error connecting to Gemini API.',
        lastChecked: now,
      };
    }
  }

  public async listModels(): Promise<string[]> {
    return ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  }

  public async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.client) {
      if (!this.apiKey) throw new Error('GEMINI_API_KEY_MISSING: Gemini API Key is required.');
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    return response.text || '';
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

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: enrichedPrompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction,
      },
    });

    const rawText = response.text || '{}';
    try {
      const sanitized = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(sanitized) as T;
    } catch (e: any) {
      throw new Error(`FAILED_TO_PARSE_GEMINI_JSON: ${e.message}\nRaw response:\n${rawText}`);
    }
  }
}
