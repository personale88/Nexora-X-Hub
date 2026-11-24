import { z } from 'zod';

export type AIProviderType = 'gemini' | 'ollama' | 'hybrid';

export interface ProviderHealth {
  provider: AIProviderType;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  model: string;
  latencyMs?: number;
  availableModels?: string[];
  message?: string;
  lastChecked: string;
}

export interface AIProviderInterface {
  readonly id: string;
  readonly name: string;
  readonly type: AIProviderType;

  healthCheck(): Promise<ProviderHealth>;
  listModels(): Promise<string[]>;
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
  generateStructuredJSON<T>(
    prompt: string,
    schemaDescription: string,
    systemInstruction?: string
  ): Promise<T>;
}
