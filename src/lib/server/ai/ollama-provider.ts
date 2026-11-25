import { AIProviderInterface, ProviderHealth } from './types';

export class OllamaProvider implements AIProviderInterface {
  public readonly id = 'ollama';
  public readonly name = 'Ollama Local AI Inference';
  public readonly type = 'ollama' as const;

  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = (baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
    this.model = model || process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const now = new Date().toISOString();
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        return {
          provider: 'ollama',
          status: 'ERROR',
          model: this.model,
          latencyMs: Date.now() - start,
          message: `Ollama returned HTTP ${res.status}: ${res.statusText}`,
          lastChecked: now,
        };
      }

      const data = await res.json();
      const availableModels: string[] = (data.models || []).map((m: any) => m.name || m.model);

      const isModelPresent = availableModels.some((m) =>
        m.toLowerCase().startsWith(this.model.toLowerCase().split(':')[0])
      );

      return {
        provider: 'ollama',
        status: 'CONNECTED',
        model: this.model,
        latencyMs: Date.now() - start,
        availableModels,
        message: isModelPresent
          ? `Connected to Ollama. Model "${this.model}" is ready.`
          : `Connected to Ollama, but model "${this.model}" is not installed. Run: ollama pull ${this.model}`,
        lastChecked: now,
      };
    } catch (err: any) {
      return {
        provider: 'ollama',
        status: 'DISCONNECTED',
        model: this.model,
        latencyMs: Date.now() - start,
        message:
          'Ollama local server not detected on ' +
          this.baseUrl +
          '. Start Ollama (`ollama serve`) for local inference.',
        lastChecked: now,
      };
    }
  }

  public async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return ['qwen2.5-coder:7b', 'qwen2.5-coder:3b'];
      const data = await res.json();
      return (data.models || []).map((m: any) => m.name);
    } catch {
      return ['qwen2.5-coder:7b', 'qwen2.5-coder:3b'];
    }
  }

  public async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OLLAMA_ERROR (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.message?.content || '';
  }

  public async generateStructuredJSON<T>(
    prompt: string,
    schemaDescription: string,
    systemInstruction?: string
  ): Promise<T> {
    const messages = [];
    const system = `${systemInstruction || ''}\nYou MUST return valid JSON adhering strictly to schema:\n${schemaDescription}\nReturn ONLY JSON without explanation.`;
    messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        format: 'json',
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OLLAMA_JSON_ERROR (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data.message?.content || '{}';

    try {
      const sanitized = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(sanitized) as T;
    } catch (e: any) {
      throw new Error(`FAILED_TO_PARSE_OLLAMA_JSON: ${e.message}\nContent:\n${content}`);
    }
  }
}
