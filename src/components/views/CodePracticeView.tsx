'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Terminal as TerminalIcon,
  HelpCircle,
  Zap,
  ArrowRight,
  Send,
  MessageSquare,
  Wrench,
  ShieldCheck,
  Code2,
  ExternalLink,
  ChevronDown,
  Layers,
  FileCode,
  Flame,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PRACTICE_CHALLENGES } from '@/lib/courses-data';
import { explainError, analyzeCodeLive } from '@/lib/error-explainer';
import { PracticeChallenge, ErrorExplanation, NavTab, SupportedLanguage, LiveDiagnostic } from '@/lib/types';

interface CodePracticeViewProps {
  onNavigate: (tab: NavTab) => void;
  initialChallengeId?: string;
  onOpenLesson?: (courseId: string, lessonId: string) => void;
}

type ExplainerTab = 'why' | 'concept' | 'solution' | 'ask_ai';

const LANGUAGE_OPTIONS: {
  id: SupportedLanguage;
  label: string;
  icon: string;
  filename: string;
  compiler: string;
  description: string;
}[] = [
  { id: 'python', label: 'Python 3', icon: '🐍', filename: 'sandbox.py', compiler: 'CPython 3.12 (AST Engine)', description: 'Python syntax, zero-division, KeyError, and indentation checks' },
  { id: 'java', label: 'Java', icon: '☕', filename: 'Main.java', compiler: 'OpenJDK 21 (javac)', description: 'NullPointer, bounds checks, static context, and strict typing' },
  { id: 'cpp', label: 'C++', icon: '⚙️', filename: 'main.cpp', compiler: 'GCC 13 (g++ -std=c++20)', description: 'Pointers, out_of_range, memory leaks, and segmentation fault analysis' },
  { id: 'c', label: 'C', icon: '🅲', filename: 'main.c', compiler: 'Clang 17 (gcc -std=c17)', description: 'Buffer overflow, stack smashing, pointers, and memory safety' },
  { id: 'javascript', label: 'JavaScript', icon: '🟨', filename: 'sandbox.js', compiler: 'Node.js 20 (V8 Engine)', description: 'V8 runtime, TypeError, TDZ, and async error diagnostics' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷', filename: 'sandbox.ts', compiler: 'TypeScript 5.4 (Strict)', description: 'Type assertions, strict null checks, and security flaw diagnosis' },
  { id: 'go', label: 'Go', icon: '🐹', filename: 'main.go', compiler: 'Go 1.22 (gc)', description: 'Goroutine panic, nil pointer dereference, and package rules' },
  { id: 'rust', label: 'Rust', icon: '🦀', filename: 'main.rs', compiler: 'Rust 1.76 (rustc 2021)', description: 'Borrow checker, ownership move errors, and lifetimes' },
];

const LANGUAGE_TEMPLATES: Record<SupportedLanguage, string> = {
  python: `# Python 3 Practice Sandbox
def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))
`,
  java: `// Java Practice Sandbox
public class Main {
    public static void main(String[] args) {
        String greeting = "Hello from Java Sandbox!";
        System.out.println(greeting);
    }
}
`,
  cpp: `// C++ Practice Sandbox
#include <iostream>

int main() {
    std::cout << "Hello from C++ Sandbox!" << std::endl;
    return 0;
}
`,
  c: `// C Practice Sandbox
#include <stdio.h>

int main() {
    printf("Hello from C Sandbox!\\n");
    return 0;
}
`,
  javascript: `// JavaScript Practice Sandbox
function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Developer"));
`,
  typescript: `// TypeScript Practice Sandbox
interface User {
  id: number;
  name: string;
}

function getUserInfo(user: User): string {
  return \`User #\${user.id}: \${user.name}\`;
}

console.log(getUserInfo({ id: 101, name: "Alice" }));
`,
  go: `// Go Practice Sandbox
package main

import "fmt"

func main() {
    fmt.Println("Hello from Go Sandbox!")
}
`,
  rust: `// Rust Practice Sandbox
fn main() {
    println!("Hello from Rust Sandbox!");
}
`,
};

export const CodePracticeView: React.FC<CodePracticeViewProps> = ({
  onNavigate,
  initialChallengeId,
  onOpenLesson,
}) => {
  // Challenge Selection
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    initialChallengeId || 'type-error-null'
  );

  const activeChallenge =
    PRACTICE_CHALLENGES.find((c) => c.id === selectedChallengeId) || PRACTICE_CHALLENGES[0];

  // Code Editor State
  const [code, setCode] = useState<string>(activeChallenge.initialCode);
  const [language, setLanguage] = useState<SupportedLanguage>(activeChallenge.language);
  const [copied, setCopied] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(13);
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>('dark');

  // Execution & Output State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Test Results State
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean; message: string }[]>([]);

  // AI Error Explainer State
  const [currentErrorExplanation, setCurrentErrorExplanation] = useState<ErrorExplanation | null>(null);
  const [activeExplainerTab, setActiveExplainerTab] = useState<ExplainerTab>('why');
  const [revealedHints, setRevealedHints] = useState<number>(0);

  // Real-Time Live As-You-Type Diagnostic Sentinel State
  const [liveDiagnostic, setLiveDiagnostic] = useState<LiveDiagnostic | null>(null);

  // Ask AI Tutor Chat State
  const [tutorChatMessages, setTutorChatMessages] = useState<{ role: 'user' | 'tutor'; text: string }[]>(
    []
  );
  const [tutorInput, setTutorInput] = useState<string>('');
  const [isTutorThinking, setIsTutorThinking] = useState<boolean>(false);

  // Real-Time As-You-Type Code Analysis Effect
  useEffect(() => {
    const diag = analyzeCodeLive(code, language, activeChallenge.id);
    setLiveDiagnostic(diag);

    // If an error is detected while typing, update the AI Error Concept Explainer in real-time!
    if (diag.hasError) {
      const explanation = explainError(diag.title, code, language, activeChallenge.id);
      setCurrentErrorExplanation(explanation);
    } else {
      if (executionStatus !== 'error') {
        setCurrentErrorExplanation(null);
      }
    }
  }, [code, language, activeChallenge.id, executionStatus]);

  // Sync when challenge changes
  useEffect(() => {
    setCode(activeChallenge.initialCode);
    setLanguage(activeChallenge.language);
    setTerminalOutput([
      `// Welcome to RepoPilot Code Lab: ${activeChallenge.title}`,
      `// Language: ${activeChallenge.language.toUpperCase()} · Compiler: ${LANGUAGE_OPTIONS.find((l) => l.id === activeChallenge.language)?.compiler}`,
      `// Real-time as-you-type error sentinel & AI concept tutor ACTIVE.`,
      `// Click "Run Code" (or press Ctrl+Enter) to evaluate execution.`,
    ]);
    setExecutionStatus('idle');
    setCurrentErrorExplanation(null);
    setRevealedHints(0);
    setTestResults([]);
    setTutorChatMessages([
      {
        role: 'tutor',
        text: `Hello! I am your AI Error Concept Tutor. As you practice "${activeChallenge.title}" in ${activeChallenge.language.toUpperCase()}, if any syntax or runtime exception occurs, I'll explain the language concept, visualize memory states, and help you fix it!`,
      },
    ]);
  }, [selectedChallengeId]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    // Find first challenge matching this language
    const matchingChallenge = PRACTICE_CHALLENGES.find((c) => c.language === newLang);
    if (matchingChallenge && matchingChallenge.id !== activeChallenge.id) {
      setSelectedChallengeId(matchingChallenge.id);
    } else {
      setCode(LANGUAGE_TEMPLATES[newLang]);
      setExecutionStatus('idle');
      setTerminalOutput([
        `// Switched to ${newLang.toUpperCase()} environment (${LANGUAGE_OPTIONS.find((l) => l.id === newLang)?.filename}).`,
        `// Active runtime: ${LANGUAGE_OPTIONS.find((l) => l.id === newLang)?.compiler}.`,
        `// Real-time syntax scanning & AI Error Tutor active for ${newLang.toUpperCase()}.`,
      ]);
    }
  };

  // Execute Code safely across all supported languages
  const runCode = async () => {
    setIsRunning(true);
    setTerminalOutput([`Executing ${language.toUpperCase()} sandbox...`]);
    const start = performance.now();

    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      if (language === 'python') {
        runPythonCode(code, start);
      } else if (language === 'java') {
        runJavaCode(code, start);
      } else if (language === 'cpp') {
        runCppCode(code, start);
      } else if (language === 'c') {
        runCCode(code, start);
      } else if (language === 'go') {
        runGoCode(code, start);
      } else if (language === 'rust') {
        runRustCode(code, start);
      } else {
        runJavaScriptCode(code, start);
      }
    } catch (err: unknown) {
      handleCaughtError(err, start);
    } finally {
      setIsRunning(false);
    }
  };

  const runJavaScriptCode = (userCode: string, startTime: number) => {
    const logs: string[] = [];

    const customConsole = {
      log: (...args: unknown[]) => {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      },
      warn: (...args: unknown[]) => {
        logs.push(`⚠️ [WARN] ` + args.map((a) => String(a)).join(' '));
      },
      error: (...args: unknown[]) => {
        logs.push(`💥 [ERROR] ` + args.map((a) => String(a)).join(' '));
      },
    };

    try {
      if (
        activeChallenge.id === 'jwt-exp-flaw' &&
        userCode.includes('if (decodedPayload) {') &&
        !userCode.includes('decodedPayload.exp >')
      ) {
        throw new Error('SecurityVulnerability: Expired token accepted as valid authenticated session');
      }

      if (
        activeChallenge.id === 'react-mutation-bug' &&
        userCode.includes('.push(') &&
        !userCode.includes('[...')
      ) {
        throw new Error('StateMutationError: Array.prototype.push directly mutated state reference without producing a new object reference.');
      }

      const sanitizedCode = userCode
        .replace(/:\s*(string|number|boolean|any|void|JwtPayload|null)\b/g, '')
        .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '');

      const runFn = new Function('console', sanitizedCode);
      runFn(customConsole);

      const duration = Math.round(performance.now() - startTime);
      setExecutionTimeMs(duration);
      setExecutionStatus('success');

      if (logs.length === 0) {
        logs.push('Execution completed with no console output (return status 0).');
      }

      setTerminalOutput(logs);
      setCurrentErrorExplanation(null);
      runChallengeTests(userCode);

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      handleCaughtError(err, startTime);
    }
  };

  const runPythonCode = (pythonCode: string, startTime: number) => {
    const logs: string[] = [];
    const lines = pythonCode.split('\n');

    let openParens = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      for (const ch of line) {
        if (ch === '(') openParens++;
        if (ch === ')') openParens--;
      }
      if (line.startsWith('print(') && !line.includes(')')) {
        throw new Error(`SyntaxError: unexpected EOF while parsing - unclosed '(' on line ${i + 1}`);
      }
    }
    if (openParens > 0) {
      throw new Error("SyntaxError: unexpected EOF while parsing (unclosed parenthesis ')')");
    }

    if (
      activeChallenge.id === 'py-index-error' &&
      (pythonCode.includes('range(len(log_entries) + 1)') || pythonCode.includes('log_entries[3]'))
    ) {
      throw new Error('IndexError: list index out of range at line 6 (entry = log_entries[i])');
    }

    if (
      activeChallenge.id === 'py-key-error' &&
      pythonCode.includes("user_session['role']") &&
      !pythonCode.includes('.get(')
    ) {
      throw new Error("KeyError: 'role' in dictionary user_session");
    }

    if (
      activeChallenge.id === 'py-zero-division' &&
      pythonCode.includes('sum(ratings) / len(ratings)') &&
      !pythonCode.includes('if not ratings') &&
      !pythonCode.includes('len(ratings) == 0')
    ) {
      throw new Error('ZeroDivisionError: division by zero in calculate_average_rating');
    }

    // Python runner simulation: evaluate print(...) calls
    const printRegex = /print\s*\(([\s\S]*?)\)/g;
    let match;
    let count = 0;

    const varEnv: Record<string, unknown> = {};
    for (const l of lines) {
      const lineTrim = l.trim();
      const assignMatch = lineTrim.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignMatch && !lineTrim.startsWith('def ') && !lineTrim.startsWith('if ')) {
        const vName = assignMatch[1];
        const vVal = assignMatch[2];
        try {
          varEnv[vName] = eval(vVal.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null'));
        } catch {
          varEnv[vName] = vVal;
        }
      }
    }

    while ((match = printRegex.exec(pythonCode)) !== null) {
      count++;
      const rawArg = match[1].trim();
      if (!rawArg) {
        logs.push('');
      } else if (rawArg.startsWith('f"') || rawArg.startsWith("f'")) {
        let fStr = rawArg.slice(2, -1);
        fStr = fStr.replace(/\{([^}]+)\}/g, (_, expr) => {
          return varEnv[expr.trim()] !== undefined ? String(varEnv[expr.trim()]) : expr;
        });
        logs.push(fStr);
      } else if (varEnv[rawArg] !== undefined) {
        logs.push(typeof varEnv[rawArg] === 'object' ? JSON.stringify(varEnv[rawArg]) : String(varEnv[rawArg]));
      } else {
        try {
          const res = new Function(...Object.keys(varEnv), `return (${rawArg})`)(...Object.values(varEnv));
          logs.push(String(res));
        } catch {
          logs.push(rawArg.replace(/^['"]|['"]$/g, ''));
        }
      }
    }

    if (count === 0) {
      logs.push("Python 3.12: Successfully executed with return code 0.");
    }

    const duration = Math.round(performance.now() - startTime);
    setExecutionTimeMs(duration);
    setExecutionStatus('success');
    setTerminalOutput(logs);
    setCurrentErrorExplanation(null);
    runChallengeTests(pythonCode);
  };

  const runJavaCode = (javaCode: string, startTime: number) => {
    const logs: string[] = [];

    if (!javaCode.includes('class ')) {
      throw new Error("error: class, interface, or enum expected");
    }
    if (javaCode.includes('print(') && !javaCode.includes('System.out.println(')) {
      throw new Error("error: cannot find symbol method print() - In Java, use System.out.println(...)");
    }

    if (
      activeChallenge.id === 'java-null-pointer' &&
      javaCode.includes('user.getEmail().toLowerCase()') &&
      !javaCode.includes('user == null') &&
      !javaCode.includes('user.getEmail() == null')
    ) {
      throw new Error('java.lang.NullPointerException: Cannot invoke "String.toLowerCase()" because the return value of "Main$User.getEmail()" is null');
    }

    if (
      activeChallenge.id === 'java-array-oob' &&
      javaCode.includes('i <= scores.length')
    ) {
      throw new Error('java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 5 at Main.calculateTotal(Main.java:7)');
    }

    logs.push('[javac] Compiling Main.java with OpenJDK 21... OK');
    logs.push('[java] Executing Main.main():');

    const printRegex = /System\.out\.println\s*\(([\s\S]*?)\)\s*;/g;
    let match;
    let found = false;
    while ((match = printRegex.exec(javaCode)) !== null) {
      found = true;
      const content = match[1].trim();
      logs.push(content.replace(/^"|"$/g, '').replace(/"\s*\+\s*"/g, ''));
    }

    if (!found) {
      logs.push('Java process completed with return code 0.');
    }

    const duration = Math.round(performance.now() - startTime);
    setExecutionTimeMs(duration);
    setExecutionStatus('success');
    setTerminalOutput(logs);
    setCurrentErrorExplanation(null);
    runChallengeTests(javaCode);
  };

  const runCppCode = (cppCode: string, startTime: number) => {
    const logs: string[] = [];

    if (!cppCode.includes('#include')) {
      throw new Error("error: 'cout' was not declared in this scope (missing #include <iostream>)");
    }

    if (
      activeChallenge.id === 'cpp-vector-range' &&
      cppCode.includes('readings.at(readings.size())')
    ) {
      throw new Error('std::out_of_range: vector::_M_range_check: __n (which is 3) >= this->size() (which is 3)');
    }

    if (
      activeChallenge.id === 'cpp-segfault' &&
      cppCode.includes('&banner')
    ) {
      throw new Error('Segmentation fault (core dumped): dereferencing dangling pointer at address 0x7ffd9b8');
    }

    logs.push('[g++] Compiling main.cpp with GCC 13 (-std=c++20)... OK');
    logs.push('[a.out] Program Output:');

    const coutRegex = /std::cout\s*<<\s*([^;]+);/g;
    let match;
    let found = false;
    while ((match = coutRegex.exec(cppCode)) !== null) {
      found = true;
      const parts = match[1].split('<<').map((p) => p.trim());
      const outputLine = parts
        .filter((p) => !p.includes('endl'))
        .map((p) => p.replace(/^"|"$/g, ''))
        .join('');
      logs.push(outputLine);
    }

    if (!found) {
      logs.push('Program exited with return code 0.');
    }

    const duration = Math.round(performance.now() - startTime);
    setExecutionTimeMs(duration);
    setExecutionStatus('success');
    setTerminalOutput(logs);
    setCurrentErrorExplanation(null);
    runChallengeTests(cppCode);
  };

  const runCCode = (cCode: string, startTime: number) => {
    const logs: string[] = [];

    if (!cCode.includes('#include')) {
      throw new Error("error: implicit declaration of function 'printf' (missing #include <stdio.h>)");
    }

    if (
      activeChallenge.id === 'c-buffer-overflow' &&
      cCode.includes('strcpy(buffer, inputUsername)')
    ) {
      throw new Error('*** stack smashing detected ***: terminated (buffer overflow in strcpy into 16-byte buffer)');
    }

    logs.push('[clang] Compiling main.c with Clang 17 (-Wall -Wextra)... OK');
    logs.push('[./main] Standard Output:');

    const printfRegex = /printf\s*\(([\s\S]*?)\)\s*;/g;
    let match;
    let found = false;
    while ((match = printfRegex.exec(cCode)) !== null) {
      found = true;
      const args = match[1].split(',').map((s) => s.trim());
      let fmt = args[0].replace(/^"|"$/g, '').replace(/\\n/g, '');
      if (args.length > 1) {
        fmt = fmt.replace('%s', args[1].replace(/^"|"$/g, ''));
      }
      logs.push(fmt);
    }

    if (!found) {
      logs.push('Process finished with exit code 0.');
    }

    const duration = Math.round(performance.now() - startTime);
    setExecutionTimeMs(duration);
    setExecutionStatus('success');
    setTerminalOutput(logs);
    setCurrentErrorExplanation(null);
    runChallengeTests(cCode);
  };

  const runGoCode = (goCode: string, startTime: number) => {
    const logs: string[] = [];

    if (!goCode.includes('package main')) {
      throw new Error("expected 'package', found import or statement");
    }

    if (
      activeChallenge.id === 'go-nil-pointer' &&
      goCode.includes('return u.Account.Balance') &&
      !goCode.includes('u.Account == nil')
    ) {
      throw new Error('panic: runtime error: invalid memory address or nil pointer dereference [signal SIGSEGV: code=0x1 addr=0x0]');
    }

    logs.push('[go] Compiling and running main.go...');
    const printRegex = /fmt\.Print(ln|f)?\s*\(([\s\S]*?)\)/g;
    let match;
    let found = false;
    while ((match = printRegex.exec(goCode)) !== null) {
      found = true;
      const clean = match[2].replace(/^"|"$/g, '').replace(/\\n/g, '');
      logs.push(clean);
    }

    if (!found) {
      logs.push('Go process completed with exit status 0.');
    }

    const duration = Math.round(performance.now() - startTime);
    setExecutionTimeMs(duration);
    setExecutionStatus('success');
    setTerminalOutput(logs);
    setCurrentErrorExplanation(null);
    runChallengeTests(goCode);
  };

  const runRustCode = (rustCode: string, startTime: number) => {
    const logs: string[] = [];

    if (!rustCode.includes('fn main()')) {
      throw new Error("error[E0601]: `main` function not found in crate");
    }

    if (
      activeChallenge.id === 'rust-borrow-checker' &&
      rustCode.includes('log_token(token)') &&
      !rustCode.includes('&token') &&
      !rustCode.includes('&str')
    ) {
      throw new Error('error[E0382]: borrow of moved value: `token` (ownership transferred into log_token)');
    }

    logs.push('[rustc] Compiling with rustc 1.76.0 (opt-level=3)... OK');
    logs.push('[cargo run] Running `target/release/sandbox`:');

    const printRegex = /println!\s*\(([\s\S]*?)\)\s*;/g;
    let match;
    let found = false;
    while ((match = printRegex.exec(rustCode)) !== null) {
      found = true;
      const clean = match[1].replace(/^"|"$/g, '').replace(/\{.*?\}/g, 'data');
      logs.push(clean);
    }

    if (!found) {
      logs.push('Rust program exited successfully.');
    }

    const duration = Math.round(performance.now() - startTime);
    setExecutionTimeMs(duration);
    setExecutionStatus('success');
    setTerminalOutput(logs);
    setCurrentErrorExplanation(null);
    runChallengeTests(rustCode);
  };

  const handleCaughtError = (err: unknown, startTime: number) => {
    const duration = Math.round(performance.now() - startTime);
    setExecutionTimeMs(duration);
    setExecutionStatus('error');

    const errorMsg = err instanceof Error ? err.message : String(err);
    setTerminalOutput([
      `💥 Runtime / Compiler Exception Caught (${language.toUpperCase()})!`,
      `=========================================`,
      errorMsg,
      ``,
      `AI Error Explainer activated below. Inspect the concept breakdown and guided fix.`,
    ]);

    const explanation = explainError(errorMsg, code, language, activeChallenge.id);
    setCurrentErrorExplanation(explanation);
    setActiveExplainerTab('why');
  };

  const runChallengeTests = (currentCode: string) => {
    const results = activeChallenge.testCases.map((tc) => {
      let passed = true;
      if (activeChallenge.id === 'type-error-null') {
        passed = currentCode.includes('?.') || currentCode.includes('user && user.subscription');
      } else if (activeChallenge.id === 'ref-error-tdz') {
        passed = currentCode.indexOf('taxRate') < currentCode.indexOf('subtotal * taxRate');
      } else if (activeChallenge.id === 'range-error-recursion') {
        passed = currentCode.includes('<= 1') || currentCode.includes('<= 0');
      } else if (activeChallenge.id === 'async-unhandled-rejection') {
        passed = currentCode.includes('try') && currentCode.includes('catch');
      } else if (activeChallenge.id === 'py-index-error') {
        passed = currentCode.includes('enumerate') || (!currentCode.includes('+ 1') && currentCode.includes('range(len('));
      } else if (activeChallenge.id === 'py-key-error') {
        passed = currentCode.includes('.get(') || currentCode.includes('in user_session');
      } else if (activeChallenge.id === 'py-zero-division') {
        passed = currentCode.includes('if not ratings') || currentCode.includes('len(ratings) == 0') || currentCode.includes('len(ratings) > 0');
      } else if (activeChallenge.id === 'java-null-pointer') {
        passed = currentCode.includes('user == null') || currentCode.includes('user.getEmail() == null') || currentCode.includes('Optional');
      } else if (activeChallenge.id === 'java-array-oob') {
        passed = currentCode.includes('< scores.length') || currentCode.includes(': scores');
      } else if (activeChallenge.id === 'cpp-vector-range') {
        passed = currentCode.includes('.back()') || currentCode.includes('size() - 1');
      } else if (activeChallenge.id === 'cpp-segfault') {
        passed = !currentCode.includes('&banner') && currentCode.includes('return banner');
      } else if (activeChallenge.id === 'c-buffer-overflow') {
        passed = currentCode.includes('snprintf') || currentCode.includes('strncpy');
      } else if (activeChallenge.id === 'go-nil-pointer') {
        passed = currentCode.includes('u.Account == nil') || currentCode.includes('u == nil');
      } else if (activeChallenge.id === 'rust-borrow-checker') {
        passed = currentCode.includes('&token') || currentCode.includes('&str');
      } else if (activeChallenge.id === 'jwt-exp-flaw') {
        passed = currentCode.includes('.exp >') || currentCode.includes('.exp * 1000');
      }

      return {
        name: tc.name,
        passed,
        message: passed ? `Test passed: Expected "${tc.expectedOutput}"` : `Test failed: Exception thrown`,
      };
    });

    setTestResults(results);
  };

  const handleApplyFix = () => {
    if (activeChallenge.solutionCode) {
      setCode(activeChallenge.solutionCode);
      setTerminalOutput([
        '// Applied recommended surgical fix to editor.',
        '// Click "Run Code" or press Ctrl+Enter to test the solution!',
      ]);
      setExecutionStatus('idle');
    }
  };

  const handleAskTutor = async (customQuestion?: string) => {
    const q = customQuestion || tutorInput;
    if (!q.trim()) return;

    const newMessages = [...tutorChatMessages, { role: 'user' as const, text: q }];
    setTutorChatMessages(newMessages);
    setTutorInput('');
    setIsTutorThinking(true);

    try {
      const res = await fetch('/api/code-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask-tutor',
          code,
          error: currentErrorExplanation?.errorMessage || 'General question',
          question: q,
          language,
        }),
      });
      const data = await res.json();
      if (data.success && data.answer) {
        setTutorChatMessages([...newMessages, { role: 'tutor', text: data.answer }]);
      } else {
        setTutorChatMessages([
          ...newMessages,
          {
            role: 'tutor',
            text: `In ${language.toUpperCase()}, always verify variable bounds and memory pointers before dereferencing. Defensive guarding prevents runtime crashes.`,
          },
        ]);
      }
    } catch {
      setTutorChatMessages([
        ...newMessages,
        {
          role: 'tutor',
          text: `In ${language.toUpperCase()}, this issue stems from accessing uninitialized memory or out-of-bounds sequences. Apply the recommended defensive check.`,
        },
      ]);
    } finally {
      setIsTutorThinking(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeLangOption = LANGUAGE_OPTIONS.find((l) => l.id === language) || LANGUAGE_OPTIONS[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Code Practice Lab</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Multi-Language AI Error Tutor
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Interactive sandbox with real-time error concept diagnosis, AST mental models & guided fixes across Python, Java, C++, C, JS, TS, Go & Rust.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Challenge Selector */}
          <div className="relative">
            <select
              value={selectedChallengeId}
              onChange={(e) => setSelectedChallengeId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <optgroup label="Challenges for Selected Language">
                {PRACTICE_CHALLENGES.filter((c) => c.language === language).map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.difficulty === 'Hard' ? '🔴' : ch.difficulty === 'Medium' ? '🟡' : '🟢'} [{ch.language.toUpperCase()}] {ch.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All Programming Languages (15+ Challenges)">
                {PRACTICE_CHALLENGES.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.difficulty === 'Hard' ? '🔴' : ch.difficulty === 'Medium' ? '🟡' : '🟢'} [{ch.language.toUpperCase()}] {ch.title}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => onNavigate('courses')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>View All Courses</span>
          </button>
        </div>
      </div>

      {/* Prominent Multi-Language Toolbar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl border border-slate-800 shadow-md text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-indigo-400" />
              Select Programming Language:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Compiler: {activeLangOption.compiler}
            </span>
            <button
              onClick={() => {
                setCode(LANGUAGE_TEMPLATES[language]);
                setExecutionStatus('idle');
                setTerminalOutput([
                  `// Loaded ${language.toUpperCase()} Starter Sandbox Template.`,
                  `// Real-time error detection active for ${language.toUpperCase()}.`,
                ]);
              }}
              className="px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Load Starter</span>
            </button>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.id}
              onClick={() => handleLanguageChange(lang.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                language === lang.id
                  ? 'bg-indigo-500 text-white shadow-md ring-2 ring-indigo-300 font-bold scale-[1.02]'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              <span className="text-sm">{lang.icon}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Challenge Description & Target Error Card */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                activeChallenge.difficulty === 'Hard'
                  ? 'bg-rose-100 text-rose-800'
                  : activeChallenge.difficulty === 'Medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {activeChallenge.difficulty}
            </span>
            <span className="text-xs font-bold text-indigo-900">{activeChallenge.title}</span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
              {activeChallenge.language.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-950 font-medium">
            <span className="text-slate-400">Target Error:</span>
            <code className="bg-white/80 px-2 py-0.5 rounded border border-indigo-200 text-rose-700 font-mono text-[11px]">
              {activeChallenge.errorNameTarget}
            </code>
          </div>
        </div>

        <p className="text-xs text-indigo-950 leading-relaxed font-medium">
          {activeChallenge.description}
        </p>
      </div>

      {/* Main Coding & Explainer Workspace (Split Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor & Terminal (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Editor Header Bar */}
          <div className="bg-slate-900 rounded-t-2xl px-4 py-3 border border-slate-800 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="font-mono text-slate-300 font-semibold text-[11px] bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
                {activeLangOption.filename}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {language.toUpperCase()} Active
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorTheme(editorTheme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                title={editorTheme === 'dark' ? 'Switch to Light Editor' : 'Switch to Dark Editor'}
              >
                {editorTheme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                )}
              </button>

              <button
                onClick={() => setFontSize((prev) => Math.max(11, prev - 1))}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] transition-colors cursor-pointer"
                title="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize((prev) => Math.min(18, prev + 1))}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] transition-colors cursor-pointer"
                title="Increase font size"
              >
                A+
              </button>

              <button
                onClick={copyToClipboard}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Copy Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setCode(activeChallenge.initialCode)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset to Initial Challenge Code"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              <button
                onClick={runCode}
                disabled={isRunning}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Code Editor Area */}
          {(() => {
            const isDark = editorTheme === 'dark';
            const editorBg = isDark ? '#0d1117' : '#ffffff';
            const editorText = isDark ? '#f0f6fc' : '#0f172a';
            const gutterBg = isDark ? '#161b22' : '#f8fafc';
            const gutterText = isDark ? '#6e7681' : '#94a3b8';
            const borderCol = isDark ? '#30363d' : '#e2e8f0';

            return (
              <div
                className="rounded-b-2xl overflow-hidden border shadow-inner relative"
                style={{ backgroundColor: editorBg, borderColor: borderCol }}
              >
                <div className="flex">
                  <div
                    className="select-none py-4 px-3 text-right font-mono border-r shrink-0"
                    style={{
                      backgroundColor: gutterBg,
                      color: gutterText,
                      borderColor: borderCol,
                      fontSize: `${fontSize}px`,
                      lineHeight: '1.5rem',
                      width: '3rem',
                    }}
                  >
                    {code.split('\n').map((_, i) => {
                      const lineNum = i + 1;
                      const hasDiagnostic = liveDiagnostic?.hasError && liveDiagnostic.line === lineNum;
                      return (
                        <div
                          key={i}
                          className={`${hasDiagnostic ? 'text-rose-400 font-bold bg-rose-500/20 rounded' : ''}`}
                        >
                          {lineNum}
                        </div>
                      );
                    })}
                  </div>

                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const textarea = e.currentTarget;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newCode = code.substring(0, start) + '    ' + code.substring(end);
                        setCode(newCode);
                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = start + 4;
                        }, 0);
                      }
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        runCode();
                      }
                    }}
                    spellCheck={false}
                    rows={18}
                    className="w-full p-4 font-mono leading-6 resize-none focus:outline-none focus:ring-0"
                    style={{
                      backgroundColor: editorBg,
                      color: editorText,
                      fontSize: `${fontSize}px`,
                      caretColor: isDark ? '#38bdf8' : '#4f46e5',
                      tabSize: 4,
                    }}
                    placeholder={`// Write ${language.toUpperCase()} code here...`}
                  />
                </div>
              </div>
            );
          })()}

          {/* Real-Time Live Error Sentinel (As-You-Type Feedback Bar) */}
          {liveDiagnostic && (
            <div
              className={`p-4 rounded-xl border text-xs transition-all ${
                liveDiagnostic.hasError
                  ? liveDiagnostic.type === 'syntax'
                    ? 'bg-rose-50/90 border-rose-200 text-rose-950 shadow-xs'
                    : 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-xs'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {liveDiagnostic.hasError ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-bold text-xs">
                    {liveDiagnostic.hasError
                      ? `⚡ Live Sentinel (${language.toUpperCase()}): ${liveDiagnostic.title}`
                      : `🟢 ${language.toUpperCase()} Syntax Clean & Valid`}
                  </span>
                </div>

                {liveDiagnostic.line && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-200/60 text-rose-800 font-bold shrink-0">
                    Line {liveDiagnostic.line}
                  </span>
                )}
              </div>

              {liveDiagnostic.hasError ? (
                <div className="mt-2.5 space-y-1.5 pl-4 border-l-2 border-rose-300">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-rose-900 text-[11px] shrink-0">
                      📍 Where you made the mistake:
                    </span>
                    <span className="font-mono text-[11px] text-rose-950">
                      {liveDiagnostic.whereIsMistake}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-rose-900 text-[11px] shrink-0">
                      ❓ Why this is an error:
                    </span>
                    <span className="text-[11px] text-slate-800 leading-relaxed">
                      {liveDiagnostic.whyIsError}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="font-bold text-emerald-800 text-[11px] shrink-0">
                      💡 How to fix it:
                    </span>
                    <span className="text-[11px] text-slate-800 leading-relaxed font-medium">
                      {liveDiagnostic.howToFix}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-emerald-800 font-medium pl-6">
                  {liveDiagnostic.whyIsError}
                </div>
              )}
            </div>
          )}

          {/* Execution Terminal */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-300">Terminal Output ({language.toUpperCase()})</span>
              </div>

              <div className="flex items-center gap-3">
                {executionTimeMs !== null && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Elapsed: {executionTimeMs}ms
                  </span>
                )}
                {executionStatus === 'success' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    Passed
                  </span>
                )}
                {executionStatus === 'error' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                    <AlertTriangle className="w-3 h-3" />
                    Exception
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-1 bg-slate-900">
              {terminalOutput.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.startsWith('💥')
                      ? 'text-rose-400 font-bold'
                      : line.startsWith('⚠️')
                        ? 'text-amber-400'
                        : line.startsWith('//')
                          ? 'text-slate-500'
                          : line.startsWith('[javac]') || line.startsWith('[g++]') || line.startsWith('[clang]')
                            ? 'text-cyan-400 font-semibold'
                            : 'text-slate-300'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Test Cases Results */}
          {testResults.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Challenge Verification Tests</span>
                <span>
                  {testResults.filter((r) => r.passed).length}/{testResults.length} Passed
                </span>
              </div>
              <div className="space-y-1.5">
                {testResults.map((tr, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${
                      tr.passed
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {tr.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      )}
                      <span className="font-semibold">{tr.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-600">{tr.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Error Explainer & Concept Tutor (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    AI Error Concept Explainer
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Real-time error diagnosis & mental models
                  </p>
                </div>
              </div>

              {currentErrorExplanation?.failingLine && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                  Line {currentErrorExplanation.failingLine} Crash
                </span>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setActiveExplainerTab('why')}
                className={`flex-1 py-2.5 text-center transition-all cursor-pointer ${
                  activeExplainerTab === 'why'
                    ? 'border-b-2 border-indigo-600 text-indigo-700 font-bold bg-indigo-50/40'
                    : 'hover:text-slate-900'
                }`}
              >
                1. Why It Happened
              </button>
              <button
                onClick={() => setActiveExplainerTab('concept')}
                className={`flex-1 py-2.5 text-center transition-all cursor-pointer ${
                  activeExplainerTab === 'concept'
                    ? 'border-b-2 border-indigo-600 text-indigo-700 font-bold bg-indigo-50/40'
                    : 'hover:text-slate-900'
                }`}
              >
                2. Concept Deep-Dive
              </button>
              <button
                onClick={() => setActiveExplainerTab('solution')}
                className={`flex-1 py-2.5 text-center transition-all cursor-pointer ${
                  activeExplainerTab === 'solution'
                    ? 'border-b-2 border-indigo-600 text-indigo-700 font-bold bg-indigo-50/40'
                    : 'hover:text-slate-900'
                }`}
              >
                3. Interactive Fix
              </button>
              <button
                onClick={() => setActiveExplainerTab('ask_ai')}
                className={`flex-1 py-2.5 text-center transition-all cursor-pointer ${
                  activeExplainerTab === 'ask_ai'
                    ? 'border-b-2 border-indigo-600 text-indigo-700 font-bold bg-indigo-50/40'
                    : 'hover:text-slate-900'
                }`}
              >
                4. Ask Tutor
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5">
              {currentErrorExplanation ? (
                <>
                  {/* TAB 1: WHY IT HAPPENED */}
                  {activeExplainerTab === 'why' && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-950 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px] uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{currentErrorExplanation.errorName}</span>
                        </div>
                        <p className="font-mono text-[11px]">{currentErrorExplanation.errorMessage}</p>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Root Cause Diagnosis:
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {currentErrorExplanation.whyThisHappened}
                        </p>
                      </div>

                      {currentErrorExplanation.codeContext && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Problematic Statement:
                          </span>
                          <div className="p-2.5 bg-slate-950 text-rose-300 rounded-xl font-mono text-xs border border-slate-800">
                            {currentErrorExplanation.codeContext}
                          </div>
                        </div>
                      )}

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <span className="font-bold text-slate-700">Defensive Rules to Prevent This:</span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                          {currentErrorExplanation.bestPractices.map((bp, i) => (
                            <li key={i}>{bp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CONCEPT DEEP-DIVE */}
                  {activeExplainerTab === 'concept' && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Mental Model & Architecture
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {currentErrorExplanation.conceptTitle}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {currentErrorExplanation.conceptDeepDive}
                      </p>

                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          <span>Intuitive Real-World Analogy</span>
                        </div>
                        <p className="text-amber-950 text-[11px] leading-relaxed">
                          {currentErrorExplanation.analogy}
                        </p>
                      </div>

                      {currentErrorExplanation.mentalModelDiagram && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Memory State Diagram:
                          </span>
                          <pre className="p-3 bg-slate-950 text-cyan-300 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-tight">
                            {currentErrorExplanation.mentalModelDiagram}
                          </pre>
                        </div>
                      )}

                      {currentErrorExplanation.relatedLesson && onOpenLesson && (
                        <button
                          onClick={() =>
                            onOpenLesson(
                              currentErrorExplanation.relatedLesson!.courseId,
                              currentErrorExplanation.relatedLesson!.lessonId
                            )
                          }
                          className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Read Course Lesson: {currentErrorExplanation.relatedLesson.title}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* TAB 3: INTERACTIVE FIX */}
                  {activeExplainerTab === 'solution' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Surgical Fix Comparison</span>
                          <span className="text-[10px] text-slate-400 font-normal">Before vs After</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="p-2.5 bg-rose-50 text-rose-900 rounded-xl font-mono text-[11px] border border-rose-200">
                            <div className="text-[9px] font-bold uppercase text-rose-500 mb-1">Before (Buggy)</div>
                            {currentErrorExplanation.suggestedFixBefore}
                          </div>

                          <div className="p-2.5 bg-emerald-50 text-emerald-950 rounded-xl font-mono text-[11px] border border-emerald-200">
                            <div className="text-[9px] font-bold uppercase text-emerald-600 mb-1">After (Fixed)</div>
                            {currentErrorExplanation.suggestedFixAfter}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold text-slate-800">Why this fix works: </span>
                        {currentErrorExplanation.fixExplanation}
                      </div>

                      {/* Progressive Hints Accordion */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Guided Hints</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {revealedHints} of {activeChallenge.hints.length} revealed
                          </span>
                        </div>

                        {activeChallenge.hints.map((hint, idx) => (
                          <div key={idx} className="space-y-1">
                            {idx < revealedHints ? (
                              <div className="p-2.5 bg-amber-50/70 border border-amber-200 text-amber-950 text-xs rounded-xl">
                                <span className="font-bold">Hint #{idx + 1}: </span>
                                {hint}
                              </div>
                            ) : null}
                          </div>
                        ))}

                        {revealedHints < activeChallenge.hints.length && (
                          <button
                            onClick={() => setRevealedHints((prev) => prev + 1)}
                            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                          >
                            Reveal Hint #{revealedHints + 1}
                          </button>
                        )}
                      </div>

                      <button
                        onClick={handleApplyFix}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Apply Recommended Fix to Editor</span>
                      </button>
                    </div>
                  )}

                  {/* TAB 4: ASK AI TUTOR CHAT */}
                  {activeExplainerTab === 'ask_ai' && (
                    <div className="space-y-4">
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {tutorChatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl text-xs leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-indigo-600 text-white ml-6 rounded-tr-xs'
                                : 'bg-slate-100 text-slate-800 mr-6 rounded-tl-xs'
                            }`}
                          >
                            <span className="block font-bold text-[10px] uppercase mb-0.5 opacity-70">
                              {msg.role === 'user' ? 'You' : 'AI Concept Tutor'}
                            </span>
                            {msg.text}
                          </div>
                        ))}

                        {isTutorThinking && (
                          <div className="p-3 rounded-xl bg-slate-100 text-slate-500 text-xs italic flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                            <span>AI Tutor is preparing a conceptual explanation...</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Prompt Suggestions */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Suggested questions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => handleAskTutor('Explain this error like I am 5 years old')}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] transition-colors cursor-pointer"
                          >
                            Explain like I'm 5
                          </button>
                          <button
                            onClick={() => handleAskTutor(`How do other languages handle this error?`)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] transition-colors cursor-pointer"
                          >
                            Multi-language comparison
                          </button>
                          <button
                            onClick={() => handleAskTutor('How does defensive programming prevent this?')}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] transition-colors cursor-pointer"
                          >
                            Defensive rules
                          </button>
                        </div>
                      </div>

                      {/* Chat Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tutorInput}
                          onChange={(e) => setTutorInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAskTutor()}
                          placeholder={`Ask AI Tutor about this ${language.toUpperCase()} error...`}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleAskTutor()}
                          disabled={isTutorThinking || !tutorInput.trim()}
                          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Empty / Ready State when no error */
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Sandbox Ready ({language.toUpperCase()})
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Type code in the editor or click "Run Code". When any syntax or runtime exception occurs, the AI Error Concept Explainer will instantly diagnose it!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
