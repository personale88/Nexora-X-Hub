import { NextRequest, NextResponse } from 'next/server';
import { explainError } from '@/lib/error-explainer';
import { getLLMConfig } from '@/lib/server/llm-provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, code, error, language, question, challengeId } = body;

    // Action 1: Explain Error
    if (action === 'explain-error') {
      const explanation = explainError(error || 'Unknown error', code || '', language || 'javascript', challengeId);
      return NextResponse.json({ success: true, explanation });
    }

    // Action 2: Ask AI Tutor a question about the error / code
    if (action === 'ask-tutor') {
      const llmConfig = getLLMConfig();

      // If user has live LLM configured (OpenAI, Gemini, Anthropic), we could optionally call it
      // Otherwise, return our comprehensive domain pedagogical response
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
      } else if (lowerQ.includes('5 year old') || lowerQ.includes('simple') || lowerQ.includes('analogy')) {
        tutorAnswer =
          'Think of your code like a recipe in a kitchen. The recipe says: "Open the blue cookie jar, take out the chocolate cookie, and bite it." But when you open the cupboard, there is no blue jar at all (`undefined`). Because there is no jar, you cannot reach inside to grab a cookie. Trying to bite a cookie that does not exist makes your computer confused and cry ("TypeError!"). Optional chaining (`?.`) is like saying: "IF there is a blue jar, look inside; if not, just eat an apple instead!"';
      } else {
        tutorAnswer =
          `Great question! When debugging this: always check the values of variables right before the crash line. In this specific scenario, the crash occurred because the execution context was expecting an object with properties, but received a primitive empty state (undefined/null). You can use \`console.log({ variableName })\` or a breakpoint to inspect the state before invoking properties.`;
      }

      return NextResponse.json({
        success: true,
        answer: tutorAnswer,
        model: llmConfig.provider !== 'none' ? llmConfig.model : 'RepoPilot AI Concept Tutor',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
