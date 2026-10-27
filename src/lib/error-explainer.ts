import { ErrorExplanation, LiveDiagnostic, SupportedLanguage } from './types';

/**
 * Real-Time As-You-Type Code Analyzer & Linter for Multi-Language Sandboxes
 * Supports: Python, Java, C++, C, Go, Rust, JavaScript, TypeScript
 * Scans code while typing and immediately reports:
 * - Has error? (true/false)
 * - Where the mistake was made (exact line & snippet)
 * - Why it is an error in this specific language
 * - How to fix it
 */
export function analyzeCodeLive(
  code: string,
  language: SupportedLanguage = 'javascript',
  challengeId?: string
): LiveDiagnostic {
  if (!code || !code.trim()) {
    return {
      hasError: false,
      type: 'clean',
      title: 'Empty Editor',
      whereIsMistake: 'Editor is empty.',
      whyIsError: 'No code to evaluate yet.',
      howToFix: 'Start typing code or click "Load Starter" to load template code.',
    };
  }

  const lines = code.split('\n');

  // ==========================================
  // 1. PYTHON MODE (sandbox.py)
  // ==========================================
  if (language === 'python') {
    let openParens = 0;
    let openBrackets = 0;
    let openBraces = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      const lineTrimmed = lineText.trim();
      const lineNum = i + 1;

      // Check for JavaScript/Java console.log in Python
      if (lineTrimmed.includes('console.log(')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "NameError: 'console' is not defined in Python",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "In Python, output is printed using the 'print(...)' function. 'console.log' is JavaScript syntax.",
          howToFix: `Replace 'console.log(...)' with 'print(...)'.`,
        };
      }

      // Check for Java System.out.println in Python
      if (lineTrimmed.includes('System.out.println(')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "NameError: 'System' is not defined in Python",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "In Python, output is printed using 'print(...)'. 'System.out.println' is Java syntax.",
          howToFix: `Replace 'System.out.println(...)' with 'print(...)'.`,
        };
      }

      // Check for JS/Java variable keywords
      if (lineTrimmed.startsWith('let ') || lineTrimmed.startsWith('const ') || lineTrimmed.startsWith('var ')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "SyntaxError: 'let'/'const'/'var' is not valid in Python",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "Python does not use variable declaration keywords like 'let', 'const', or 'var'. Variables are created by direct assignment.",
          howToFix: `Remove the keyword: '${lineTrimmed.replace(/^(let|const|var)\s+/, '')}'.`,
        };
      }

      // Check for JS/Java comments '//'
      if (lineTrimmed.startsWith('//')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "SyntaxError: '//' is floor division in Python, not a comment",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "In Python, single-line comments begin with the '#' symbol. '//' is the floor-division operator.",
          howToFix: `Change '//' to '#': "# ${lineTrimmed.replace(/^\/\/\s*/, '')}".`,
        };
      }

      // Check for Java import packages
      if (lineTrimmed.startsWith('import java.') || lineTrimmed.includes('import .')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "ModuleNotFoundError: Java package in Python",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "Python does not have Java packages. Standard Python modules include 'math', 'json', 'sys', 'os', 'datetime'.",
          howToFix: "Use Python imports: 'import math' or 'from datetime import datetime'.",
        };
      }

      // Check for curly braces on print: print{
      if (lineTrimmed.startsWith('print{') || lineTrimmed.startsWith('print {')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "SyntaxError: invalid syntax '{'",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "Function calls in Python use round parentheses '()', not curly braces '{}'. Curly braces are reserved for dicts and sets.",
          howToFix: `Change to round parentheses: 'print(...)'.`,
        };
      }

      // Check for missing colon on def/if/for/while/class/elif/else/try/except
      if (
        (lineTrimmed.startsWith('def ') ||
          lineTrimmed.startsWith('if ') ||
          lineTrimmed.startsWith('elif ') ||
          lineTrimmed.startsWith('for ') ||
          lineTrimmed.startsWith('while ') ||
          lineTrimmed === 'else' ||
          lineTrimmed === 'try' ||
          lineTrimmed.startsWith('except')) &&
        !lineTrimmed.endsWith(':') &&
        !lineTrimmed.endsWith('"""') &&
        !lineTrimmed.endsWith("'''")
      ) {
        return {
          hasError: true,
          type: 'syntax',
          title: "SyntaxError: expected ':' at end of compound statement",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}" (missing ':' at the end)`,
          whyIsError: "In Python, block headers (if, for, while, def, class, else, except) must always end with a colon ':'.",
          howToFix: `Add ':' at the end of the line: "${lineTrimmed}:".`,
        };
      }

      // Count delimiters
      for (const char of lineText) {
        if (char === '(') openParens++;
        if (char === ')') openParens--;
        if (char === '[') openBrackets++;
        if (char === ']') openBrackets--;
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
      }

      // If a print statement is unclosed on this line
      if (lineTrimmed.startsWith('print(') && !lineTrimmed.includes(')')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "SyntaxError: unexpected EOF while parsing - unclosed '('",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "The 'print(' statement was opened but never closed with a matching ')'. Python requires all opened parentheses to be closed before statement execution.",
          howToFix: `Close the parenthesis: "${lineTrimmed})".`,
        };
      }
    }

    if (openParens > 0) {
      return {
        hasError: true,
        type: 'syntax',
        title: "SyntaxError: unexpected EOF while parsing (unclosed parenthesis ')')",
        line: lines.length,
        codeSnippet: lines[lines.length - 1].trim(),
        whereIsMistake: `Line ${lines.length}: Unclosed parenthesis '('`,
        whyIsError: "There is an opening '(' in your Python code that has not been closed with a matching ')'.",
        howToFix: "Add ')' to close the open expression.",
      };
    }
  }

  // ==========================================
  // 2. JAVA MODE (Main.java)
  // ==========================================
  if (language === 'java') {
    let hasClass = false;

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      const lineTrimmed = lineText.trim();
      const lineNum = i + 1;

      if (lineTrimmed.includes('class ')) hasClass = true;

      // Check for Python print in Java
      if (lineTrimmed.startsWith('print(') || lineTrimmed.startsWith('console.log(')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "error: cannot find symbol method print()",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "Java does not have a bare 'print()' or 'console.log()' function. Standard output uses System.out.println(...).",
          howToFix: `Change to Java syntax: "System.out.println(${lineTrimmed.replace(/^(print|console\.log)\(/, '')}".`,
        };
      }

      // Check for Python def in Java
      if (lineTrimmed.startsWith('def ')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "error: invalid method declaration in Java",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "Java is statically typed and does not use Python 'def'. Java methods must specify a return type (e.g. void, int, String).",
          howToFix: "Declare as: public static void methodName() { ... }",
        };
      }

      // Check for malformed import
      if (lineTrimmed.includes('import .') || (lineTrimmed.startsWith('import ') && !lineTrimmed.endsWith(';') && !lineTrimmed.startsWith('import java.'))) {
        return {
          hasError: true,
          type: 'syntax',
          title: "error: '.' unexpected after import in Java",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "Java package imports cannot have a dot immediately after 'import'. Java imports follow: 'import java.util.*;' or 'import java.util.Scanner;'.",
          howToFix: "Use correct Java import syntax: 'import java.util.*;'.",
        };
      }

      // Check for missing semicolon on plain statement lines
      if (
        lineTrimmed.length > 0 &&
        !lineTrimmed.startsWith('//') &&
        !lineTrimmed.startsWith('/*') &&
        !lineTrimmed.startsWith('*') &&
        !lineTrimmed.endsWith('{') &&
        !lineTrimmed.endsWith('}') &&
        !lineTrimmed.endsWith(';') &&
        !lineTrimmed.startsWith('public class') &&
        !lineTrimmed.startsWith('class ') &&
        !lineTrimmed.startsWith('static class') &&
        !lineTrimmed.startsWith('public static void main') &&
        !lineTrimmed.startsWith('public ') &&
        !lineTrimmed.startsWith('private ') &&
        !lineTrimmed.startsWith('protected ') &&
        !lineTrimmed.startsWith('import ') &&
        !lineTrimmed.startsWith('package ') &&
        !lineTrimmed.startsWith('@')
      ) {
        return {
          hasError: true,
          type: 'syntax',
          title: "error: ';' expected",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "In Java, every statement must terminate with a semicolon ';'.",
          howToFix: `Add ';' to the end of line ${lineNum}: "${lineTrimmed};".`,
        };
      }
    }

    if (!hasClass && lines.some((l) => l.trim().length > 0)) {
      return {
        hasError: true,
        type: 'syntax',
        title: "error: class, interface, or enum expected",
        line: 1,
        codeSnippet: lines[0].trim(),
        whereIsMistake: "Line 1: Code written outside of a Java class",
        whyIsError: "In Java, all executable statements and methods must reside inside an enclosing class.",
        howToFix: "Enclose your code inside a class: public class Main { public static void main(String[] args) { ... } }.",
      };
    }
  }

  // ==========================================
  // 3. C++ MODE (main.cpp)
  // ==========================================
  if (language === 'cpp') {
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      const lineTrimmed = lineText.trim();
      const lineNum = i + 1;

      // Check for Java/JS output in C++
      if (lineTrimmed.includes('System.out.println(') || lineTrimmed.includes('console.log(')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "error: unknown output identifier in C++",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "In C++, output is streamed via 'std::cout << ... << std::endl;'. Neither System.out.println nor console.log exist in C++.",
          howToFix: 'Use C++ iostream: std::cout << "..." << std::endl;',
        };
      }

      // Check for missing semicolon on statements
      if (
        lineTrimmed.length > 0 &&
        !lineTrimmed.startsWith('//') &&
        !lineTrimmed.startsWith('#') &&
        !lineTrimmed.endsWith('{') &&
        !lineTrimmed.endsWith('}') &&
        !lineTrimmed.endsWith(';') &&
        !lineTrimmed.includes('int main(') &&
        !lineTrimmed.includes('float ') &&
        !lineTrimmed.includes('void ')
      ) {
        return {
          hasError: true,
          type: 'syntax',
          title: "error: expected ';' before end of line",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "In C++, statements must terminate with a semicolon ';'.",
          howToFix: `Append ';' to line ${lineNum}: "${lineTrimmed};".`,
        };
      }
    }
  }

  // ==========================================
  // 4. C MODE (main.c)
  // ==========================================
  if (language === 'c') {
    for (let i = 0; i < lines.length; i++) {
      const lineTrimmed = lines[i].trim();
      const lineNum = i + 1;

      if (lineTrimmed.startsWith('print(') || lineTrimmed.startsWith('cout <<')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "error: 'print' undeclared in C",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "In C, standard formatted output is performed with 'printf(...)'. Include <stdio.h> to use printf.",
          howToFix: `Use printf: printf("Hello, World!\\n");`,
        };
      }

      if (
        lineTrimmed.length > 0 &&
        !lineTrimmed.startsWith('//') &&
        !lineTrimmed.startsWith('#') &&
        !lineTrimmed.endsWith('{') &&
        !lineTrimmed.endsWith('}') &&
        !lineTrimmed.endsWith(';') &&
        !lineTrimmed.includes('int main(')
      ) {
        return {
          hasError: true,
          type: 'syntax',
          title: "error: expected ';' before end of line in C",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "In C, every statement must end with a semicolon ';'.",
          howToFix: `Add ';' to line ${lineNum}: "${lineTrimmed};".`,
        };
      }
    }
  }

  // ==========================================
  // 5. GO MODE (main.go)
  // ==========================================
  if (language === 'go') {
    let hasPackage = false;
    for (let i = 0; i < lines.length; i++) {
      const lineTrimmed = lines[i].trim();
      const lineNum = i + 1;
      if (lineTrimmed.startsWith('package ')) hasPackage = true;

      if (lineTrimmed.startsWith('print(') || lineTrimmed.startsWith('console.log(')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "undefined: print (use fmt.Println in Go)",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "In Go, formatted output uses the 'fmt' package: fmt.Println(...).",
          howToFix: `Use: fmt.Println(...) and import "fmt".`,
        };
      }
    }

    if (!hasPackage && lines.some((l) => l.trim().length > 0)) {
      return {
        hasError: true,
        type: 'syntax',
        title: "expected 'package', found import or statement",
        line: 1,
        codeSnippet: lines[0].trim(),
        whereIsMistake: "Line 1: Missing package clause",
        whyIsError: "Every Go source file must start with a package declaration: 'package main'.",
        howToFix: "Add 'package main' at line 1.",
      };
    }
  }

  // ==========================================
  // 6. RUST MODE (main.rs)
  // ==========================================
  if (language === 'rust') {
    for (let i = 0; i < lines.length; i++) {
      const lineTrimmed = lines[i].trim();
      const lineNum = i + 1;

      if (lineTrimmed.startsWith('print(') || lineTrimmed.startsWith('console.log(')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "cannot find function `print` in this scope (use println! macro)",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "In Rust, printing to console uses the macro 'println!(...)'. Note the exclamation mark '!' indicating a macro.",
          howToFix: `Use: println!("Hello from Rust!");`,
        };
      }
    }
  }

  // ==========================================
  // 7. JAVASCRIPT & TYPESCRIPT MODE (sandbox.js / sandbox.ts)
  // ==========================================
  if (language === 'javascript' || language === 'typescript') {
    let openParens = 0;
    let openBrackets = 0;
    let openBraces = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      const lineTrimmed = lineText.trim();
      const lineNum = i + 1;

      for (const ch of lineText) {
        if (ch === '(') openParens++;
        if (ch === ')') openParens--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
      }

      // Check for unclosed print( in JavaScript
      if (lineTrimmed.startsWith('print(') && !lineTrimmed.includes(')')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "SyntaxError: missing ')' after argument list",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}" (unclosed parenthesis)`,
          whyIsError: "You called 'print(' with an unclosed parenthesis. In addition, note that JavaScript uses 'console.log(...)' for output, while 'print(...)' is Python. If you want to write Python, click the 🐍 Python button in the language toolbar!",
          howToFix: `Close with ')': "console.log(...)" or switch language toolbar to Python.`,
        };
      }

      // Check for Python def in JavaScript
      if (lineTrimmed.startsWith('def ') && lineTrimmed.endsWith(':')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "SyntaxError: Python 'def' function syntax in JavaScript",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "You are using Python 'def func():' syntax in a JavaScript environment. JavaScript uses 'function name() { ... }'.",
          howToFix: "Change to: function name() { ... } or switch the language toolbar to Python.",
        };
      }

      // Check for Java import in JavaScript
      if (lineTrimmed.includes('import .') || lineTrimmed.startsWith('import java.')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "SyntaxError: Java package import in JavaScript",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "You wrote Java package syntax ('import . java'). In JavaScript, standard library utilities (Math, JSON, Date, Array) are built-in globally without imports.",
          howToFix: "Remove the Java import statement. Switch to Java in the language toolbar if writing Java.",
        };
      }

      // Check for Java System.out in JavaScript
      if (lineTrimmed.includes('System.out.println')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "ReferenceError: System is not defined in JavaScript",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "'System.out.println' is Java syntax. JavaScript uses 'console.log(...)'.",
          howToFix: "Replace 'System.out.println(...)' with 'console.log(...)'.",
        };
      }

      // Check for C++ #include in JavaScript
      if (lineTrimmed.startsWith('#include')) {
        return {
          hasError: true,
          type: 'syntax',
          title: "SyntaxError: C++ preprocessor directive in JavaScript",
          line: lineNum,
          codeSnippet: lineTrimmed,
          whereIsMistake: `Line ${lineNum}: "${lineTrimmed}"`,
          whyIsError: "'#include' is C++ syntax. JavaScript does not have preprocessor directives.",
          howToFix: "Remove '#include' or switch the language toolbar to C++.",
        };
      }
    }

    // Check for delimiter mismatches before Function() evaluation
    if (openParens > 0) {
      return {
        hasError: true,
        type: 'syntax',
        title: "SyntaxError: missing ')' after argument list or expression",
        line: lines.length,
        codeSnippet: lines[lines.length - 1].trim(),
        whereIsMistake: `Line ${lines.length}: Unclosed parenthesis '('`,
        whyIsError: "An opening '(' was never closed with a matching ')'. JavaScript cannot parse an expression with unbalanced parentheses.",
        howToFix: "Add ')' to close the open expression.",
      };
    }

    if (openBrackets > 0) {
      return {
        hasError: true,
        type: 'syntax',
        title: "SyntaxError: missing ']' after array elements",
        line: lines.length,
        codeSnippet: lines[lines.length - 1].trim(),
        whereIsMistake: `Line ${lines.length}: Unclosed bracket '['`,
        whyIsError: "An opening square bracket '[' was never closed with a matching ']'.",
        howToFix: "Add ']' to close the array or index access.",
      };
    }

    if (openBraces > 0) {
      return {
        hasError: true,
        type: 'syntax',
        title: "SyntaxError: missing '}' after function or block body",
        line: lines.length,
        codeSnippet: lines[lines.length - 1].trim(),
        whereIsMistake: `Line ${lines.length}: Unclosed curly brace '{'`,
        whyIsError: "An opening curly brace '{' was never closed with a matching '}'.",
        howToFix: "Add '}' to close the block scope.",
      };
    }

    // Evaluate JavaScript syntax safely
    try {
      const sanitized = code
        .replace(/:\s*(string|number|boolean|any|void|JwtPayload|null)\b/g, '')
        .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '');
      new Function(sanitized);
    } catch (err: unknown) {
      const syntaxMsg = err instanceof Error ? err.message : String(err);
      let errLine = 1;

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l.startsWith('print(') || l.includes('import .') || l.includes('const =') || l.includes('let =')) {
          errLine = i + 1;
          break;
        }
      }

      const failingSnippet = lines[errLine - 1] ? lines[errLine - 1].trim() : code.slice(0, 40);

      // Human-friendly translation of V8's cryptic messages
      let readableWhy = `The JavaScript engine's parser cannot understand this grammar: "${syntaxMsg}".`;
      let readableFix = `Check line ${errLine} for mismatched brackets, unclosed quotes, or foreign language syntax.`;

      if (syntaxMsg.includes("Unexpected token '}'")) {
        readableWhy = `The JavaScript engine reached the end of the script while waiting for an unclosed delimiter (like '(', '[', or '{') to be closed.`;
        readableFix = `Ensure all opened brackets, parentheses, and braces are properly closed.`;
      }

      return {
        hasError: true,
        type: 'syntax',
        title: `SyntaxError: ${syntaxMsg}`,
        line: errLine,
        codeSnippet: failingSnippet,
        whereIsMistake: `Line ${errLine}: "${failingSnippet}"`,
        whyIsError: readableWhy,
        howToFix: readableFix,
      };
    }
  }

  // 8. Code is clean!
  return {
    hasError: false,
    type: 'clean',
    title: `Code Syntax Clean & Valid (${language.toUpperCase()})`,
    whereIsMistake: 'No syntax mistakes detected.',
    whyIsError: `Your ${language.toUpperCase()} code grammar is valid and ready to execute.`,
    howToFix: 'Click "Run Code" (or press Ctrl+Enter) to evaluate output in the sandbox.',
  };
}

/**
 * Intelligent Error Concept Explainer & Diagnostic Engine
 * Analyzes the ACTUAL caught error dynamically across all programming languages:
 * Python, Java, C++, C, Go, Rust, JavaScript, TypeScript
 */
export function explainError(
  rawError: string | Error,
  code: string,
  language: SupportedLanguage = 'javascript',
  challengeId?: string
): ErrorExplanation {
  const errorText = typeof rawError === 'string' ? rawError : rawError.message || String(rawError);
  const stack = typeof rawError === 'object' && rawError.stack ? rawError.stack : '';

  // Extract failing line number
  let failingLine: number | undefined;
  const lineMatch =
    stack.match(/:(\d+):(\d+)/) ||
    errorText.match(/line\s+(\d+)/i) ||
    errorText.match(/:(\d+)\)/);
  if (lineMatch && lineMatch[1]) {
    failingLine = parseInt(lineMatch[1], 10);
  }

  const codeLines = code.split('\n');
  const codeContext =
    failingLine && codeLines[failingLine - 1]
      ? codeLines[failingLine - 1].trim()
      : codeLines[0] || '';

  // ==========================================
  // 1. JAVA: NullPointerException
  // ==========================================
  if (
    language === 'java' &&
    (errorText.includes('NullPointerException') || code.includes('formatUserEmail'))
  ) {
    return {
      errorName: 'java.lang.NullPointerException: Dereferencing Null Object Reference',
      errorMessage: errorText,
      failingLine: failingLine || 19,
      codeContext: codeContext || 'return user.getEmail().toLowerCase();',
      whyThisHappened:
        `In Java, attempting to invoke an instance method (such as .getEmail() or .toLowerCase()) on a reference variable that evaluates to 'null' causes the JVM to throw java.lang.NullPointerException (NPE). Primitive variables hold values, but object variables hold memory references; when a reference is null, there is no heap memory to dereference.`,
      conceptTitle: 'JVM Heap References, Null Pointers & The Billion-Dollar Mistake',
      conceptDeepDive:
        'Tony Hoare introduced null in 1965 to denote missing values, later calling it his "billion-dollar mistake". In the JVM, invoking an instance method uses the `invokevirtual` bytecode instruction. The JVM checks if the object reference on the operand stack is null; if null, it immediately throws NullPointerException. Modern Java best practices use Optional<T>, explicit null checks, or Objects.requireNonNull().',
      analogy: 'Dialing a phone number that is disconnected and expecting a person to answer.',
      mentalModelDiagram: `
  user Reference ──► [ null ]  (Points to 0x0 / nothing)
                         │
                         ▼
             invokevirtual .getEmail()  💥 JVM CRASH: java.lang.NullPointerException!
`,
      suggestedFixBefore: codeContext || 'return user.getEmail().toLowerCase();',
      suggestedFixAfter: `if (user == null || user.getEmail() == null) {\n    return "no-reply@system.local";\n}\nreturn user.getEmail().toLowerCase();`,
      fixExplanation: 'Add a defensive null guard check: verify both user != null and user.getEmail() != null before calling methods.',
      bestPractices: [
        'Always guard against null before calling methods on objects received from parameters or external services.',
        'Use java.util.Optional<T> for methods that may legitimately return no value.',
        'Never return null collections; return Collections.emptyList() or Collections.emptyMap().',
      ],
      relatedLesson: {
        courseId: 'java-oop-errors',
        lessonId: 'jl1-npe',
        title: '1.1 The Billion-Dollar Mistake: Java NullPointerException',
      },
    };
  }

  // ==========================================
  // 2. JAVA: ArrayIndexOutOfBoundsException
  // ==========================================
  if (
    language === 'java' &&
    (errorText.includes('ArrayIndexOutOfBoundsException') || code.includes('calculateTotal'))
  ) {
    return {
      errorName: 'java.lang.ArrayIndexOutOfBoundsException: Array Index Out of Range',
      errorMessage: errorText,
      failingLine: failingLine || 7,
      codeContext: codeContext || 'for (int i = 0; i <= scores.length; i++)',
      whyThisHappened:
        `In Java, arrays are 0-indexed. An array of length N has valid indices from 0 to N-1. The loop condition 'i <= scores.length' allows 'i' to reach N (equal to length), attempting to access memory outside the array boundary.`,
      conceptTitle: 'Java Array Memory Contiguity & Strict Bounds Verification',
      conceptDeepDive:
        'Every Java array is an object stored in contiguous memory on the JVM heap with an immutable .length field. At bytecode level, array indexing uses instructions like `iaload`. The JVM performs hardware bounds checking on every access: if index < 0 or index >= length, it terminates with ArrayIndexOutOfBoundsException to prevent buffer overflow vulnerabilities.',
      analogy: 'Booking seats in an airplane with 5 rows (numbered 0 to 4) and trying to sit in row 5.',
      suggestedFixBefore: 'for (int i = 0; i <= scores.length; i++)',
      suggestedFixAfter: 'for (int i = 0; i < scores.length; i++) {\n    total += scores[i];\n}',
      fixExplanation: 'Change "<= scores.length" to "< scores.length" or use an enhanced for-each loop: "for (int score : scores)".',
      bestPractices: [
        'Use strict inequality "< array.length" for index-based loops.',
        'Prefer enhanced for-each loops: "for (Type item : collection)" whenever manual indices are not required.',
      ],
      relatedLesson: {
        courseId: 'java-oop-errors',
        lessonId: 'jl1-npe',
        title: '1.1 The Billion-Dollar Mistake: Java NullPointerException',
      },
    };
  }

  // ==========================================
  // 3. C++: std::out_of_range
  // ==========================================
  if (
    language === 'cpp' &&
    (errorText.includes('out_of_range') || code.includes('readings.at'))
  ) {
    return {
      errorName: 'std::out_of_range: vector::_M_range_check: index >= this->size()',
      errorMessage: errorText,
      failingLine: failingLine || 8,
      codeContext: codeContext || 'return readings.at(readings.size());',
      whyThisHappened:
        `In C++, std::vector::size() returns the number of elements in the vector. Valid indices range from 0 to size() - 1. Accessing index readings.size() attempts to read past the end of the vector. Calling .at() detects this and throws std::out_of_range.`,
      conceptTitle: 'C++ STL Containers, Bounds Checking & Exception Safety',
      conceptDeepDive:
        'In C++, std::vector provides two element access mechanisms: operator[] and .at(). operator[] does NOT perform bounds checking in release builds for raw performance, leading to undefined behavior or segmentation faults. In contrast, .at() checks the index against size() and throws std::out_of_range, enabling safe error recovery.',
      analogy: 'Opening a filing cabinet with 3 folders and demanding to read folder #4.',
      suggestedFixBefore: 'return readings.at(readings.size());',
      suggestedFixAfter: 'if (readings.empty()) return 0.0f;\nreturn readings.back(); // or readings.at(readings.size() - 1)',
      fixExplanation: 'Use readings.back() to safely retrieve the last element, and guard against empty vectors with readings.empty().',
      bestPractices: [
        'Use .at() when indices come from untrusted user input or dynamic math.',
        'Use .back() and .front() for container boundary elements.',
        'Always check .empty() before querying elements.',
      ],
      relatedLesson: {
        courseId: 'cpp-memory-safety',
        lessonId: 'cl1-bounds',
        title: '1.1 Bounds Safety: operator[] vs .at() in std::vector',
      },
    };
  }

  // ==========================================
  // 4. C++: Segmentation Fault
  // ==========================================
  if (
    language === 'cpp' &&
    (errorText.includes('Segmentation fault') || code.includes('createConfigBanner'))
  ) {
    return {
      errorName: 'Segmentation fault (SIGSEGV): Dereferencing Dangling Stack Pointer',
      errorMessage: errorText,
      failingLine: failingLine || 17,
      codeContext: codeContext || 'std::cout << "Banner: " << *ptr << std::endl;',
      whyThisHappened:
        `The function returned the memory address (&banner) of a local stack variable. When createConfigBanner() finished execution, its stack frame was reclaimed and overwritten. Dereferencing *ptr accesses invalid memory, causing an operating system memory protection fault (SIGSEGV).`,
      conceptTitle: 'Stack Frame Lifetimes, Dangling Pointers & RAII',
      conceptDeepDive:
        'In C and C++, local variables reside in the function stack frame. When the function returns, the stack pointer (RSP/ESP) unwinds, rendering all stack addresses invalid. Returning a pointer to local stack memory creates a "dangling pointer". Dereferencing it invokes Undefined Behavior (UB), often manifesting as an immediate SIGSEGV signal from the OS kernel MMU.',
      analogy: 'Writing down an address of a hotel room you just checked out of, and expecting your luggage to still be there next year.',
      suggestedFixBefore: 'std::string* createConfigBanner() { std::string banner = "..."; return &banner; }',
      suggestedFixAfter: 'std::string createConfigBanner() {\n    std::string banner = "Production Server v2.4 (Active)";\n    return banner; // Safe: Return Value Optimization (RVO)\n}',
      fixExplanation: 'Return objects by value in modern C++. Return Value Optimization (RVO) avoids copying completely and prevents dangling memory.',
      bestPractices: [
        'Never return pointers or references to local stack variables.',
        'Prefer returning by value in C++11 and newer to leverage move semantics and copy elision.',
        'If dynamic allocation is needed, use std::unique_ptr or std::shared_ptr.',
      ],
      relatedLesson: {
        courseId: 'cpp-memory-safety',
        lessonId: 'cl1-bounds',
        title: '1.1 Bounds Safety: operator[] vs .at() in std::vector',
      },
    };
  }

  // ==========================================
  // 5. C: Buffer Overflow / Stack Smashing
  // ==========================================
  if (
    language === 'c' &&
    (errorText.includes('buffer overflow') || errorText.includes('stack smashing') || code.includes('strcpy(buffer'))
  ) {
    return {
      errorName: 'Stack Smashing Detected: Buffer Overflow in Unsafe Memory Copy',
      errorMessage: errorText,
      failingLine: failingLine || 9,
      codeContext: codeContext || 'strcpy(buffer, inputUsername);',
      whyThisHappened:
        `The code uses 'strcpy', which copies bytes until a null terminator '\\0' is found without checking the destination buffer capacity. A 28-byte string copied into a 16-byte buffer overwrites adjacent memory on the stack, corrupting the return pointer and triggering stack canary protection.`,
      conceptTitle: 'Buffer Overflows, Stack Canaries & Memory Safety in C',
      conceptDeepDive:
        'Buffer overflows are among the oldest and most dangerous security vulnerabilities (CWE-120). Compilers like GCC insert a "stack canary" value between local buffers and the saved return pointer. Before returning, the function checks if the canary was modified. If modified, GCC terminates the program with "*** stack smashing detected ***" to prevent arbitrary code execution.',
      analogy: 'Pouring a gallon of water into a pint glass: the excess liquid spills over and ruins the electronics beneath.',
      suggestedFixBefore: 'char buffer[16];\nstrcpy(buffer, inputUsername);',
      suggestedFixAfter: 'char buffer[16];\nsnprintf(buffer, sizeof(buffer), "%s", inputUsername);',
      fixExplanation: 'Use bounded functions like snprintf(buffer, sizeof(buffer), "%s", input) or strncpy to enforce capacity limits.',
      bestPractices: [
        'Never use unbounded memory functions (strcpy, gets, sprintf).',
        'Use size-bounded APIs: snprintf, strncpy_s, or fgets.',
        'Enable compiler security flags (-fstack-protector-strong, -D_FORTIFY_SOURCE=2).',
      ],
      relatedLesson: {
        courseId: 'cpp-memory-safety',
        lessonId: 'cl1-bounds',
        title: '1.1 Bounds Safety: operator[] vs .at() in std::vector',
      },
    };
  }

  // ==========================================
  // 6. PYTHON: KeyError
  // ==========================================
  if (
    language === 'python' &&
    (errorText.includes('KeyError') || code.includes('user_session['))
  ) {
    return {
      errorName: "KeyError: 'role' not found in dictionary",
      errorMessage: errorText,
      failingLine: failingLine || 4,
      codeContext: codeContext || "user_role = user_session['role']",
      whyThisHappened:
        `In Python, indexing a dictionary with dict[key] requires the key to exist in the hash table. If the key is absent, Python raises a KeyError exception instead of returning None.`,
      conceptTitle: 'Python Hash Tables, Dictionary Lookups & Safe Key Retrieval',
      conceptDeepDive:
        'Python dictionaries (dict) are implemented as dense hash tables. When key lookup fails, the internal PyDict_GetItemWithError raises KeyError. The Pythonic approach to optional dictionary keys is dict.get(key, default) or using collections.defaultdict.',
      analogy: 'Searching for a book in a library card catalog by a title that was never cataloged.',
      suggestedFixBefore: "user_role = user_session['role']",
      suggestedFixAfter: "user_role = user_session.get('role', 'guest')",
      fixExplanation: "Use dict.get('role', default_value) to safely retrieve values with a fallback without raising KeyError.",
      bestPractices: [
        "Use dict.get(key, default) for optional keys.",
        "Use 'if key in dictionary:' to test for key membership before access.",
      ],
      relatedLesson: {
        courseId: 'python-error-mastery',
        lessonId: 'l9-index-error',
        title: '4.1 Sequence Boundary Traps: Python IndexError Demystified',
      },
    };
  }

  // ==========================================
  // 7. PYTHON: ZeroDivisionError
  // ==========================================
  if (
    language === 'python' &&
    (errorText.includes('ZeroDivisionError') || code.includes('calculate_average_rating'))
  ) {
    return {
      errorName: 'ZeroDivisionError: division by zero in average calculation',
      errorMessage: errorText,
      failingLine: failingLine || 4,
      codeContext: codeContext || 'return sum(ratings) / len(ratings)',
      whyThisHappened:
        `When the ratings list is empty, len(ratings) evaluates to 0. In mathematics and Python, dividing any number by zero is undefined and raises ZeroDivisionError.`,
      conceptTitle: 'Arithmetic Exceptions & Defensive Numeric Guarding',
      conceptDeepDive:
        'In Python, floating point and integer division check the denominator value in the C layer. If denominator == 0, PyErr_SetString(PyExc_ZeroDivisionError, "division by zero") is called. Mathematical algorithms must always guard against zero denominators before executing division.',
      analogy: 'Trying to divide a pizza among 0 people.',
      suggestedFixBefore: 'return sum(ratings) / len(ratings)',
      suggestedFixAfter: 'if not ratings:\n    return 0.0\nreturn sum(ratings) / len(ratings)',
      fixExplanation: 'Add a guard: check if the list is empty (if not ratings: return 0.0) before performing the division.',
      bestPractices: [
        'Always check that the divisor is non-zero before dividing.',
        'Use fallback values (0.0 or None) for empty dataset averages.',
      ],
      relatedLesson: {
        courseId: 'python-error-mastery',
        lessonId: 'l9-index-error',
        title: '4.1 Sequence Boundary Traps: Python IndexError Demystified',
      },
    };
  }

  // ==========================================
  // 8. PYTHON: IndexError
  // ==========================================
  if (
    language === 'python' &&
    (errorText.includes('IndexError') || code.includes('summarize_logs'))
  ) {
    return {
      errorName: 'IndexError: list index out of range',
      errorMessage: errorText,
      failingLine: failingLine || 6,
      codeContext: codeContext || 'entry = log_entries[i]',
      whyThisHappened:
        `Python uses 0-based indexing. For a list of 3 items, valid indices are 0, 1, and 2. The loop 'range(len(log_entries) + 1)' tried to access index 3, which is out of range.`,
      conceptTitle: 'Python Sequence Indexing & enumerate() Idiom',
      conceptDeepDive:
        'Python lists are dynamic arrays. Accessing list[i] where i >= len(list) raises IndexError. Pythonic code avoids manual index arithmetic by using direct iteration: "for entry in log_entries:" or "for i, entry in enumerate(log_entries):".',
      analogy: 'Calling seat 4 on a 3-seat bench.',
      suggestedFixBefore: 'for i in range(len(log_entries) + 1):\n    entry = log_entries[i]',
      suggestedFixAfter: 'for i, entry in enumerate(log_entries):\n    summary.append(f"Log #{i}: {entry}")',
      fixExplanation: 'Use enumerate(log_entries) to iterate both index and item safely without manual boundary math.',
      bestPractices: [
        'Prefer "for item in list:" or "for i, item in enumerate(list):" over manual range(len()) loops.',
      ],
      relatedLesson: {
        courseId: 'python-error-mastery',
        lessonId: 'l9-index-error',
        title: '4.1 Sequence Boundary Traps: Python IndexError Demystified',
      },
    };
  }

  // ==========================================
  // 9. GO: Nil Pointer Panic
  // ==========================================
  if (
    language === 'go' &&
    (errorText.includes('nil pointer dereference') || code.includes('u.Account.Balance'))
  ) {
    return {
      errorName: 'panic: runtime error: invalid memory address or nil pointer dereference',
      errorMessage: errorText,
      failingLine: failingLine || 15,
      codeContext: codeContext || 'return u.Account.Balance',
      whyThisHappened:
        `In Go, pointers default to 'nil' when uninitialized. Attempting to access fields on a nil pointer (u.Account == nil) causes the Go runtime to trigger a panic: invalid memory address or nil pointer dereference.`,
      conceptTitle: 'Go Pointers, Nil Values & Defensive Guard Idiom',
      conceptDeepDive:
        'Unlike languages with exception hierarchies, Go uses explicit error values and panics for catastrophic memory violations. Dereferencing a nil pointer causes an immediate runtime panic. Robust Go code always validates pointers: "if u == nil || u.Account == nil { return 0.0 }".',
      analogy: 'Unwrapping a gift box only to find it is completely empty, and trying to wear the non-existent watch inside.',
      suggestedFixBefore: 'return u.Account.Balance',
      suggestedFixAfter: 'if u == nil || u.Account == nil {\n    return 0.0\n}\nreturn u.Account.Balance',
      fixExplanation: 'Add defensive nil pointer checks before reading fields from pointers.',
      bestPractices: [
        'Always check for nil before accessing pointer fields.',
        'Consider returning (value, error) pairs for methods that can fail.',
      ],
      relatedLesson: {
        courseId: 'js-ts-debugging',
        lessonId: 'l4-optional-chaining',
        title: '2.2 Defensive Coding: Optional Chaining (?.) & Nullish Coalescing (??)',
      },
    };
  }

  // ==========================================
  // 10. RUST: Borrow of Moved Value (E0382)
  // ==========================================
  if (
    language === 'rust' &&
    (errorText.includes('borrow of moved value') || errorText.includes('E0382') || code.includes('log_token'))
  ) {
    return {
      errorName: "error[E0382]: borrow of moved value: 'token'",
      errorMessage: errorText,
      failingLine: failingLine || 14,
      codeContext: codeContext || 'println!("Database querying with token: {}", token);',
      whyThisHappened:
        `In Rust, passing 'token' (a heap-allocated String) by value to 'log_token(token)' moves ownership of the string to the function. Once moved, 'main' no longer owns the memory and cannot access 'token' again.`,
      conceptTitle: 'Rust Ownership, Move Semantics & Borrowing References',
      conceptDeepDive:
        'Rust ensures memory safety without a garbage collector through its affine type system and Borrow Checker. Every value has a single owner. Passing non-Copy types by value transfers ownership ("move"). To allow read-only access without relinquishing ownership, borrow by reference: &str or &T.',
      analogy: 'Giving your car keys away permanently instead of lending the spare key for the afternoon.',
      suggestedFixBefore: 'fn log_token(token: String) { ... }\nlog_token(token);',
      suggestedFixAfter: 'fn log_token(token: &str) { ... }\nlog_token(&token);',
      fixExplanation: 'Change the function parameter to a string slice &str and pass a reference &token to borrow without moving.',
      bestPractices: [
        'Prefer borrowing (&str, &[T]) for read-only function arguments.',
        'Keep ownership in the calling scope unless transfer is required.',
      ],
      relatedLesson: {
        courseId: 'cpp-memory-safety',
        lessonId: 'cl1-bounds',
        title: '1.1 Bounds Safety: operator[] vs .at() in std::vector',
      },
    };
  }

  // ==========================================
  // 11. Cross-Language print() confusion
  // ==========================================
  if (code.includes('print(') && (language === 'javascript' || language === 'typescript')) {
    return {
      errorName: "SyntaxError: unclosed parenthesis or Python syntax in JS",
      errorMessage: errorText,
      failingLine: failingLine || 1,
      codeContext: codeContext || 'print(',
      whyThisHappened:
        `On line ${failingLine || 1}, '${codeContext}' is missing a closing ')' or uses Python 'print(...)' in a JavaScript environment.`,
      conceptTitle: 'Standard Output Across Languages: JS console.log vs Python print',
      conceptDeepDive:
        'In Python, standard output is printed using the built-in print() function. In JavaScript, standard output is written to the developer console using console.log(). In addition, any function call with an unclosed parenthesis triggers an immediate syntax parse error.',
      analogy: 'Dialing the first 5 digits of a phone number and waiting for it to ring without pressing the remaining digits.',
      suggestedFixBefore: codeContext || 'print(',
      suggestedFixAfter: 'console.log("Hello from JavaScript!"); // Or click Python in the language toolbar!',
      fixExplanation: 'Close the parenthesis with ")", or replace print() with console.log(), or click the 🐍 Python button in the language toolbar.',
      bestPractices: [
        'In JavaScript/TypeScript, use console.log(...) for output.',
        'In Python, use print(...) with closed parentheses.',
        'In Java, use System.out.println(...).',
        'In C++, use std::cout << ... << std::endl;.',
      ],
    };
  }

  // ==========================================
  // 12. JavaScript TypeError: Cannot read properties of undefined
  // ==========================================
  if (errorText.includes('Cannot read propert') || (errorText.includes('TypeError') && code.includes('.'))) {
    const propMatch = errorText.match(/reading '([^']+)'/);
    const propName = propMatch ? propMatch[1] : 'property';

    return {
      errorName: `TypeError: Cannot read properties of undefined (reading '${propName}')`,
      errorMessage: errorText,
      failingLine: failingLine || 4,
      codeContext: codeContext || 'const tier = user.subscription.tier;',
      whyThisHappened:
        `On line ${failingLine || 4}, the code attempts to read '.${propName}' on an object reference that evaluated to undefined or null. Because undefined is a primitive without property descriptors or prototype slots, the JavaScript V8 engine throws a fatal TypeError.`,
      conceptTitle: 'V8 Object Property Resolution & Prototype Slots',
      conceptDeepDive:
        'In JavaScript, object property access invokes the internal [[Get]] specification. If the left-hand expression resolves to undefined or null, [[Get]] cannot be called because primitives have no prototype table. V8 stops execution immediately.',
      analogy: 'Attempting to open a drawer inside a desk that does not exist in the room.',
      mentalModelDiagram: `
  user
   └── subscription: undefined
           └── .${propName}  💥 CRASH: Cannot invoke [[Get]] on undefined!
  
  CRASH-PROOF OPTIONAL CHAINING:
  user?.subscription?.${propName}
   └── Short-circuits safely to undefined without throwing!
`,
      suggestedFixBefore: codeContext || 'const tier = user.subscription.tier;',
      suggestedFixAfter: `const tier = user?.subscription?.${propName} ?? 'free';`,
      fixExplanation:
        'Use the optional chaining operator (?.) to short-circuit if subscription is undefined, and the nullish coalescing operator (??) to supply a default fallback value.',
      bestPractices: [
        'Always guard nested property access with optional chaining (?.).',
        'Use nullish coalescing (??) instead of logical OR (||) to prevent falsy bugs with 0 or empty strings.',
      ],
      relatedLesson: {
        courseId: 'js-ts-debugging',
        lessonId: 'l4-optional-chaining',
        title: '2.2 Defensive Coding: Optional Chaining (?.) & Nullish Coalescing (??)',
      },
    };
  }

  // ==========================================
  // 13. Generic Fallback
  // ==========================================
  return {
    errorName: `${language.toUpperCase()} Exception or Syntax Mistake`,
    errorMessage: errorText,
    failingLine,
    codeContext,
    whyThisHappened:
      `An exception occurred in your ${language.toUpperCase()} code: "${errorText}". Check line ${failingLine || 1} for syntax, unclosed delimiters, or missing keywords.`,
    conceptTitle: `${language.toUpperCase()} Language Grammar & Runtime Execution`,
    conceptDeepDive:
      `Programming languages require strictly formatted grammar. In ${language.toUpperCase()}, all keywords, delimiters, and variable references must match the language specification.`,
    analogy: 'A puzzle piece that does not fit into the board.',
    suggestedFixBefore: codeContext || 'yourCode()',
    suggestedFixAfter: '// Verify syntax and variable names',
    fixExplanation: 'Review the line of code and adjust delimiters, spelling, or variable declarations.',
    bestPractices: [
      'Use the Language Selector to match your desired programming language.',
      'Check for matching parentheses and quotation marks.',
    ],
  };
}
