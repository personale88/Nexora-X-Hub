import { GoogleGenAI } from '@google/genai';

export interface GeminiCallOptions {
  model?: string;
  temperature?: number;
  timeoutMs?: number;
  systemInstruction?: string;
  jsonSchema?: Record<string, unknown>;
  maxRetries?: number;
}

export class GeminiProvider {
  private client: GoogleGenAI | null = null;
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Check if Gemini API is configured
   */
  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.client);
  }

  /**
   * Assert configuration, throwing clear actionable error if missing
   */
  public assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new Error(
        'GEMINI_API_KEY_MISSING: Gemini API key is not configured. Please set GEMINI_API_KEY in your environment or .env.local file.'
      );
    }
  }

  /**
   * Execute raw prompt with retries and timeout
   */
  public async generateContent(
    prompt: string,
    options: GeminiCallOptions = {}
  ): Promise<string> {
    this.assertConfigured();

    const model = options.model || this.defaultModel;
    const timeoutMs = options.timeoutMs || 45000;
    const maxRetries = options.maxRetries ?? 2;
    const temperature = options.temperature ?? 0.1;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `GEMINI_TIMEOUT: Model generation timed out after ${timeoutMs}ms.`
                )
              ),
            timeoutMs
          )
        );

        const callPromise = this.client!.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature,
            systemInstruction: options.systemInstruction,
            responseMimeType: 'text/plain',
          },
        });

        const response = await Promise.race([callPromise, timeoutPromise]);
        const text = response.text;

        if (!text) {
          throw new Error('GEMINI_EMPTY_RESPONSE: Model returned an empty response.');
        }

        return text;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err.message || err);

        // Check for quota or rate limit
        if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
          throw new Error(
            'GEMINI_QUOTA_EXCEEDED: Gemini API quota exceeded or rate limit reached. Please wait or check your Google Cloud quota.'
          );
        }

        // Retry on network/transient failures if retries remaining
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
      }
    }

    throw lastError || new Error('GEMINI_CALL_FAILED: Unknown error occurred.');
  }

  /**
   * Execute prompt expecting strict JSON output and validate schema
   */
  public async generateJSON<T>(
    prompt: string,
    systemInstruction: string,
    validator?: (parsed: any) => T,
    options: GeminiCallOptions = {}
  ): Promise<T> {
    this.assertConfigured();

    const model = options.model || this.defaultModel;
    const timeoutMs = options.timeoutMs || 45000;
    const maxRetries = options.maxRetries ?? 2;
    const temperature = options.temperature ?? 0.1;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `GEMINI_TIMEOUT: Model generation timed out after ${timeoutMs}ms.`
                )
              ),
            timeoutMs
          )
        );

        const callPromise = this.client!.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature,
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });

        const response = await Promise.race([callPromise, timeoutPromise]);
        const text = response.text;

        if (!text) {
          throw new Error('GEMINI_EMPTY_RESPONSE: Model returned an empty response.');
        }

        // Clean any markdown formatting if present
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
        }

        let parsed: any;
        try {
          parsed = JSON.parse(cleaned);
        } catch (jsonErr: any) {
          throw new Error(
            `GEMINI_INVALID_JSON: Failed to parse JSON from model output: ${jsonErr.message}. Output was: ${cleaned.slice(0, 200)}...`
          );
        }

        if (validator) {
          return validator(parsed);
        }

        return parsed as T;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err.message || err);

        if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
          throw new Error(
            'GEMINI_QUOTA_EXCEEDED: Gemini API quota exceeded or rate limit reached. Please check your Google Cloud quota.'
          );
        }

        if (attempt < maxRetries && !errMsg.includes('GEMINI_INVALID_JSON')) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
      }
    }

    throw lastError || new Error('GEMINI_JSON_GENERATION_FAILED: Unknown error occurred.');
  }
}

export const defaultGeminiProvider = new GeminiProvider();
