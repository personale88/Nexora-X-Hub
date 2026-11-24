import { GeminiProvider, defaultGeminiProvider } from './provider';

export interface BugInvestigationTarget {
  candidateFiles: string[];
  primarySuspectFile: string;
  bugType: 'LOGICAL' | 'SECURITY_VULNERABILITY' | 'RUNTIME_EXCEPTION' | 'SYNTAX' | 'DEPENDENCY';
  hypothesizedPath: string;
  initialObservations: string[];
  relevantSymbols: string[];
}

export class BugInvestigator {
  constructor(private provider: GeminiProvider = defaultGeminiProvider) {}

  public async investigateIssue(params: {
    issueTitle: string;
    issueDescription: string;
    stackTrace?: string;
    compilerError?: string;
    fileTree: string[];
    relevantContextSnippets?: Record<string, string>;
  }): Promise<BugInvestigationTarget> {
    const systemInstruction = `You are a Principal Software Reliability & Autonomous Bug Investigation Agent.
Your objective is to inspect the reported defect (issue, stack trace, or compiler error) against the repository's file structure and context snippets.
Identify the most likely affected files, execution pathways, and suspect symbols.
You must return a valid JSON object matching this schema:
{
  "candidateFiles": ["path/to/candidate1.ts", "path/to/candidate2.ts"],
  "primarySuspectFile": "path/to/most_critical_file.ts",
  "bugType": "LOGICAL" | "SECURITY_VULNERABILITY" | "RUNTIME_EXCEPTION" | "SYNTAX" | "DEPENDENCY",
  "hypothesizedPath": "Detailed execution flow leading from trigger to failure",
  "initialObservations": ["Observation 1", "Observation 2"],
  "relevantSymbols": ["functionName", "className", "variableName"]
}`;

    const prompt = `Issue Title: ${params.issueTitle}
Description:
${params.issueDescription}

${params.stackTrace ? `Stack Trace / Error Log:\n${params.stackTrace}\n` : ''}
${params.compilerError ? `Compiler / Linter Output:\n${params.compilerError}\n` : ''}

Repository Files:
${params.fileTree.slice(0, 150).join('\n')}

${
  params.relevantContextSnippets
    ? `Available Context Snippets:\n${Object.entries(params.relevantContextSnippets)
        .map(([f, c]) => `--- File: ${f} ---\n${c.slice(0, 2500)}`)
        .join('\n\n')}`
    : ''
}

Analyze the error and locate the exact suspect files and execution flow.`;

    return this.provider.generateJSON<BugInvestigationTarget>(
      prompt,
      systemInstruction,
      (parsed) => {
        if (!parsed.primarySuspectFile || !Array.isArray(parsed.candidateFiles)) {
          throw new Error('MALFORMED_INVESTIGATION: Bug investigation missing primary suspect file.');
        }
        return parsed as BugInvestigationTarget;
      }
    );
  }
}
