import { GeminiProvider, defaultGeminiProvider } from './provider';
import { CodeHealth, LanguageStat } from '@/lib/types';

export interface RepositoryAnalysisResult {
  stack: string[];
  languages: LanguageStat[];
  health: CodeHealth;
  summary: string;
  keyFrameworks: string[];
  testFramework?: string;
  packageManager?: string;
}

export class RepositoryAnalyzer {
  constructor(private provider: GeminiProvider = defaultGeminiProvider) {}

  public async analyzeRepository(params: {
    repoName: string;
    description?: string;
    fileTree: string[];
    manifests: Record<string, string>; // e.g. package.json, requirements.txt
    sampleFiles?: Record<string, string>;
  }): Promise<RepositoryAnalysisResult> {
    const systemInstruction = `You are an expert Autonomous Repository Architecture & Security Analyzer.
Analyze the repository metadata, manifest files, and directory tree.
Evaluate architectural health, dependency risks, security vulnerabilities, testing coverage readiness, and technology stack.
You must return a valid JSON object matching this schema:
{
  "stack": ["string"],
  "languages": [
    { "name": "TypeScript", "percentage": 85, "color": "#3178c6" }
  ],
  "health": {
    "architecture": { "status": "Good" | "Warning" | "Critical", "score": number (0-100), "label": "string" },
    "dependencies": { "status": "Good" | "Warning" | "Critical", "count": number, "label": "string" },
    "security": { "status": "Good" | "Warning" | "Critical", "vulnerabilities": number, "label": "string" },
    "testing": { "status": "Good" | "Warning" | "Critical", "coverage": number, "label": "string" }
  },
  "summary": "Concise architectural assessment",
  "keyFrameworks": ["string"],
  "testFramework": "jest | vitest | mocha | pytest | go-test | unknown",
  "packageManager": "npm | pnpm | yarn | pip | go | unknown"
}`;

    const prompt = `Repository Name: ${params.repoName}
Description: ${params.description || 'No description provided'}

Detected Manifests:
${Object.entries(params.manifests)
  .map(([name, content]) => `--- File: ${name} ---\n${content.slice(0, 3000)}`)
  .join('\n\n')}

File Tree (Sample):
${params.fileTree.slice(0, 150).join('\n')}
${params.fileTree.length > 150 ? `...and ${params.fileTree.length - 150} more files` : ''}

Perform complete architectural, security, and dependency analysis.`;

    return this.provider.generateJSON<RepositoryAnalysisResult>(
      prompt,
      systemInstruction,
      (parsed) => {
        if (!parsed.health || !parsed.languages || !Array.isArray(parsed.stack)) {
          throw new Error('MALFORMED_ANALYSIS: Repository analysis missing required health or language breakdown.');
        }
        return parsed as RepositoryAnalysisResult;
      }
    );
  }
}
