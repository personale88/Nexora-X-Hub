import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { explainError } from '@/lib/error-explainer';
import { defaultGeminiProvider } from '@/lib/server/gemini';
import { executeSandboxCommand, ensureWorkspacesRoot, assertSafePath, cleanupWorkspace } from '@/lib/server/sandbox';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, code, error, language, question, challengeId } = body;

    // Action 1: Execute code in isolated sandbox
    if (action === 'execute-sandbox') {
      const root = ensureWorkspacesRoot();
      const runId = `practice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const workspaceDir = path.join(root, runId);
      fs.mkdirSync(workspaceDir, { recursive: true });

      try {
        const lang = (language || 'javascript').toLowerCase();
        let executable = 'node';
        let filename = 'solution.js';

        if (lang === 'python') {
          executable = process.platform === 'win32' ? 'python' : 'python3';
          filename = 'solution.py';
        } else if (lang === 'typescript' || lang === 'javascript') {
          executable = 'node';
          filename = 'solution.js';
        }

        const filePath = assertSafePath(workspaceDir, filename);
        fs.writeFileSync(filePath, code || '', 'utf-8');

        const result = await executeSandboxCommand(workspaceDir, `${executable} ${filename}`, {
          timeoutMs: 8000,
        });

        return NextResponse.json({
          success: true,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          durationMs: result.durationMs,
          passed: result.passed,
        });
      } finally {
        await cleanupWorkspace(workspaceDir);
      }
    }

    // Action 2: Explain Error with Gemini
    if (action === 'explain-error') {
      if (defaultGeminiProvider.isConfigured()) {
        try {
          const prompt = `Student Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Runtime / Compiler Error:
${error}

Provide a clear, pedagogical explanation for a junior engineer:
1. What the error means conceptually in this programming language.
2. Why this specific code triggered it.
3. How to fix it safely without regressions.`;

          const aiExplanation = await defaultGeminiProvider.generateContent(prompt, {
            systemInstruction: 'You are an elite, patient computer science educator and compiler expert. Provide concise, illuminating explanations with simple analogies.',
            temperature: 0.2,
          });

          return NextResponse.json({
            success: true,
            explanation: {
              title: `Analysis of ${error.split('\n')[0] || 'Error'}`,
              summary: aiExplanation,
              concept: `Understanding ${language} runtime behavior`,
              fix: 'Inspect variable states and defensive guards',
            },
          });
        } catch (aiErr) {
          console.warn('AI error explainer fallback to rule-based engine:', aiErr);
        }
      }

      // Rule-based pedagogical fallback
      const explanation = explainError(error || 'Unknown error', code || '', language || 'javascript', challengeId);
      return NextResponse.json({ success: true, explanation });
    }

    // Action 3: Ask AI Concept Tutor
    if (action === 'ask-tutor') {
      if (defaultGeminiProvider.isConfigured()) {
        try {
          const prompt = `Student Question: ${question}

Context Code:
\`\`\`${language || 'javascript'}
${code}
\`\`\`

${error ? `Recent Error:\n${error}\n` : ''}

Explain the concept thoroughly, illuminating the underlying language mechanics, memory models, and best practices.`;

          const tutorAnswer = await defaultGeminiProvider.generateContent(prompt, {
            systemInstruction: 'You are the RepoPilot AI Concept Tutor. Explain programming concepts deeply yet intuitively for engineers.',
            temperature: 0.2,
          });

          return NextResponse.json({
            success: true,
            answer: tutorAnswer,
            model: 'Gemini 2.0 Flash (Concept Tutor)',
          });
        } catch (geminiErr: any) {
          console.warn('Gemini Tutor failed, falling back:', geminiErr);
        }
      }

      // Fallback domain pedagogical responses
      let tutorAnswer = '';
      const lowerQ = (question || '').toLowerCase();

      if (lowerQ.includes('typeof null') || lowerQ.includes('null object')) {
        tutorAnswer =
          'In JavaScript, `typeof null === "object"` is a famous historical bug dating back to the very first JS implementation in 1995. Values were stored with a type tag in the lower bits of their memory pointer: object references had a tag of `000`. Since `null` represented a null pointer (all zeroes), its tag was also `000`, causing `typeof` to mistakenly return "object". It cannot be fixed today because doing so would break millions of legacy websites!';
      } else if (lowerQ.includes('typescript') || lowerQ.includes('strictnullchecks')) {
        tutorAnswer =
          'TypeScript completely prevents this class of errors at compile time when you enable `"strictNullChecks": true` in `tsconfig.json`. In this mode, `undefined` and `null` have their own distinct types and cannot be assigned to objects without explicitly declaring union types (e.g. `User | undefined`). The TypeScript compiler will give you a red squiggly line before you even run your code!';
      } else if (lowerQ.includes('optional chaining') || lowerQ.includes('?.') || lowerQ.includes('nullish')) {
        tutorAnswer =
          'Optional chaining (`?.`) works by checking if the reference before `?.` is strictly null or undefined. If it is, JavaScript immediately halts the expression and returns `undefined` without executing any of the operations to the right. Nullish coalescing (`??`) pairs with it to provide a fallback value ONLY when the result is null or undefined (unlike `||` which triggers on 0, false, and empty strings).';
      } else {
        tutorAnswer =
          `When debugging this in ${language || 'code'}: always check the values of variables right before the crash line. In this specific scenario, the crash occurred because the execution context was expecting an object with properties, but received a primitive empty state (undefined/null). You can use defensive assertions or optional chaining to guard references.`;
      }

      return NextResponse.json({
        success: true,
        answer: tutorAnswer,
        model: 'RepoPilot Concept Tutor (Curated)',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
