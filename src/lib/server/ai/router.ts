import { AIProviderInterface, AIProviderType, ProviderHealth } from './types';
import { GeminiProvider } from './gemini-provider';
import { OllamaProvider } from './ollama-provider';

export type TaskComplexity = 'lightweight' | 'standard' | 'complex';

export class AIProviderManager {
  private static instance: AIProviderManager;
  private gemini: GeminiProvider;
  private ollama: OllamaProvider;
  private activeMode: AIProviderType = 'gemini';

  private constructor() {
    this.gemini = new GeminiProvider();
    this.ollama = new OllamaProvider();
    const envDefault = (process.env.DEFAULT_AI_PROVIDER as AIProviderType) || 'gemini';
    this.activeMode = envDefault;
  }

  public static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  public getGemini(): GeminiProvider {
    return this.gemini;
  }

  public getOllama(): OllamaProvider {
    return this.ollama;
  }

  public getMode(): AIProviderType {
    return this.activeMode;
  }

  public setMode(mode: AIProviderType) {
    this.activeMode = mode;
  }

  public async getOverallHealth(): Promise<{
    activeMode: AIProviderType;
    gemini: ProviderHealth;
    ollama: ProviderHealth;
  }> {
    const [geminiHealth, ollamaHealth] = await Promise.all([
      this.gemini.healthCheck(),
      this.ollama.healthCheck(),
    ]);

    return {
      activeMode: this.activeMode,
      gemini: geminiHealth,
      ollama: ollamaHealth,
    };
  }

  /**
   * Intelligently routes tasks based on active mode, task complexity, and provider availability.
   */
  public async getProviderForTask(complexity: TaskComplexity): Promise<{
    provider: AIProviderInterface;
    fallbackProvider?: AIProviderInterface;
    routedReason: string;
  }> {
    if (this.activeMode === 'gemini') {
      return {
        provider: this.gemini,
        fallbackProvider: this.ollama,
        routedReason: 'User explicit setting: Gemini Cloud Provider',
      };
    }

    if (this.activeMode === 'ollama') {
      return {
        provider: this.ollama,
        fallbackProvider: this.gemini,
        routedReason: 'User explicit setting: Ollama Local Provider',
      };
    }

    // Hybrid Mode:
    // Lightweight tasks (code review, single function triage, explanation) -> Ollama
    // Complex tasks (multi-file root cause, patch synthesis, regression test) -> Gemini
    if (complexity === 'lightweight') {
      const ollamaHealth = await this.ollama.healthCheck();
      if (ollamaHealth.status === 'CONNECTED') {
        return {
          provider: this.ollama,
          fallbackProvider: this.gemini,
          routedReason: 'Hybrid Router: Lightweight triage assigned to Local Ollama',
        };
      }
    }

    return {
      provider: this.gemini,
      fallbackProvider: this.ollama,
      routedReason: 'Hybrid Router: Complex reasoning assigned to Cloud Gemini 2.5',
    };
  }
}

export const aiProviderManager = AIProviderManager.getInstance();
