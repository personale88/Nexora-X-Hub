import { Course, PracticeChallenge } from './types';

export const COURSES: Course[] = [
  {
    id: 'js-ts-debugging',
    title: 'Mastering JavaScript & TypeScript Debugging',
    tagline: 'Understand the V8 Engine, Execution Contexts, and Solve Runtime Errors Like a Pro',
    description:
      'Tired of seeing "TypeError: Cannot read properties of undefined"? In this deep-dive masterclass, you will demystify how JavaScript executes your code, explore the Call Stack and Event Loop, and learn systematic debugging workflows to eliminate runtime crashes forever.',
    category: 'Debugging & Errors',
    level: 'Beginner',
    duration: '4h 15m',
    xp: 650,
    badge: 'Error Detective',
    iconName: 'Bug',
    color: 'from-amber-500 to-orange-600',
    skillsGained: [
      'Call Stack & Execution Contexts',
      'Temporal Dead Zone (TDZ)',
      'Optional Chaining & Nullish Coalescing',
      'Event Loop & Microtask Queue',
      'Async/Await Error Propagation',
    ],
    modules: [
      {
        id: 'm1-contexts',
        title: 'Module 1: Execution Contexts, Scopes & The Dreaded ReferenceError',
        description: 'Understand how JavaScript creates lexical environments and why accessing variables too early triggers TDZ.',
        lessons: [
          {
            id: 'l1-callstack',
            title: '1.1 The Anatomy of the JavaScript Call Stack',
            durationMinutes: 10,
            type: 'concept',
            summary: 'How JavaScript manages function calls using a LIFO stack, and what a stack trace actually represents.',
            content: [
              'When your JavaScript code executes, the JavaScript engine (like Chrome V8 or Node.js) allocates a **Call Stack**. The Call Stack is a single-threaded Last-In, First-Out (LIFO) data structure that tracks where the program currently is in execution.',
              'Whenever a function is invoked, an **Execution Context** is pushed onto the stack. When the function returns, its frame is popped off.',
              'When an uncaught error occurs, the engine freezes the current state and dumps the **Stack Trace**. Reading a stack trace from top to bottom reveals the exact call chain that led to the crash: the top line is where the error exploded, and the lines below show the functions that called it.',
            ],
            keyTakeaways: [
              'The Call Stack is single-threaded: only one function executes at any given millisecond.',
              'A Stack Trace reads bottom-to-top for invocation order, and top-to-bottom for the point of failure.',
              'Infinite recursion without a base case causes a RangeError: Maximum call stack size exceeded.',
            ],
            codeExample: {
              language: 'javascript',
              description: 'Call Stack push and pop mechanics',
              code: `function multiply(a, b) {
  // Line 2: At top of stack
  return a * b;
}

function calculateTotal(price, tax) {
  // Line 7: Pushes multiply() to the stack
  return multiply(price, 1 + tax);
}

// Line 11: Main script starts
console.log(calculateTotal(100, 0.08));`,
            },
            quiz: [
              {
                id: 'q1',
                question: 'When reading an error stack trace, what does the very top line indicate?',
                options: [
                  'The entry point of your program (e.g. index.js)',
                  'The exact file and line number where the exception was thrown',
                  'The slowest function in your call stack',
                  'The function that caught the error',
                ],
                correctIndex: 1,
                explanation: 'The top line of a stack trace points to the innermost frame where the error was generated before any unwinding occurred.',
              },
            ],
          },
          {
            id: 'l2-tdz',
            title: '1.2 ReferenceError Demystified: The Temporal Dead Zone (TDZ)',
            durationMinutes: 14,
            type: 'interactive_lab',
            summary: 'Why `var` hoists as undefined, while `let` and `const` throw a ReferenceError when accessed before declaration.',
            content: [
              'One of the most confusing errors for developers is: `ReferenceError: Cannot access variable before initialization`.',
              'Both `var`, `let`, and `const` are hoisted during the creation phase of an execution context. However, while `var` is initialized immediately with `undefined`, `let` and `const` remain in an uninitialized state called the **Temporal Dead Zone (TDZ)**.',
              'Any attempt to read or write to a variable in its TDZ throws an immediate ReferenceError. This is a deliberate safety feature designed in ES6 to prevent bugs where uninitialized variables are accidentally consumed.',
            ],
            keyTakeaways: [
              'Hoisting reserves memory space for declarations before code executes.',
              'TDZ starts from the beginning of the enclosing block until the line where `let` or `const` is declared.',
              'Always declare variables at the top of their enclosing lexical block to avoid TDZ errors.',
            ],
            practiceChallengeId: 'ref-error-tdz',
            codeExample: {
              language: 'javascript',
              description: 'TDZ demonstration',
              code: `function calculateDiscount(price) {
  // TDZ for 'discount' starts here
  // console.log(discount); // 💥 ReferenceError!
  
  const discount = price > 100 ? 0.15 : 0.05; // TDZ ends here
  return price * (1 - discount);
}`,
            },
            quiz: [
              {
                id: 'q2',
                question: 'Why did ES6 introduce the Temporal Dead Zone for let and const?',
                options: [
                  'To save memory on mobile devices',
                  'To prevent developers from accidentally reading variables before their deliberate assignment',
                  'To allow let variables to be reassigned across scopes',
                  'Because V8 cannot allocate memory ahead of time',
                ],
                correctIndex: 1,
                explanation: 'TDZ makes reading uninitialized variables a fail-fast runtime exception instead of silently returning undefined.',
              },
            ],
          },
        ],
      },
      {
        id: 'm2-typeerror',
        title: 'Module 2: The Dreaded TypeError & Defensive Null Safety',
        description: 'Deep dive into JavaScript object property resolution, prototypes, and modern null handling patterns.',
        lessons: [
          {
            id: 'l3-why-null-fails',
            title: '2.1 Why `Cannot read properties of undefined` Happens in V8',
            durationMinutes: 12,
            type: 'concept',
            summary: 'Understand the V8 internal property lookup mechanism and why accessing properties on null/undefined is prohibited.',
            content: [
              'In JavaScript, primitives like numbers and strings have object wrappers (`Number.prototype`, `String.prototype`) that allow property access. But `null` and `undefined` do not have a prototype.',
              'When the V8 engine evaluates `obj.user.address.street`, it walks down the chain:',
              '1. Looks up `obj` -> Found object.',
              '2. Looks up `.user` on `obj` -> Returns `undefined`.',
              '3. Tries to look up `.address` on `undefined` -> V8 halts: `TypeError: Cannot read properties of undefined (reading "address")`.',
              'This is because `undefined` has no internal `[[Get]]` slot or prototype table.',
            ],
            keyTakeaways: [
              'null represents intentional absence of value; undefined represents uninitialized variable.',
              'Neither null nor undefined have a prototype or properties.',
              'Chained property lookups without defensive guards are the #1 source of web app crashes.',
            ],
            codeExample: {
              language: 'javascript',
              description: 'V8 Property Lookup failure',
              code: `const apiResponse = {
  status: 200,
  data: null // intentional empty data
};

// 💥 CRASH: Cannot read properties of null (reading 'userName')
console.log(apiResponse.data.userName);`,
            },
            quiz: [
              {
                id: 'q3',
                question: 'What is the fundamental reason V8 throws a TypeError when accessing a property on undefined?',
                options: [
                  'Because undefined is an empty string in memory',
                  'Because undefined has no prototype or internal [[Get]] method to resolve properties',
                  'Because modern browsers ban the use of undefined',
                  'Because undefined only exists in client-side code',
                ],
                correctIndex: 1,
                explanation: 'Primitives null and undefined possess no prototype chain or object wrapper, so property access is impossible.',
              },
            ],
          },
          {
            id: 'l4-optional-chaining',
            title: '2.2 Defensive Coding: Optional Chaining (?.) & Nullish Coalescing (??)',
            durationMinutes: 15,
            type: 'interactive_lab',
            summary: 'Modern syntactic features that make code crash-proof against null/undefined, and how they differ from logical OR (||).',
            content: [
              'Prior to ECMAScript 2020, developers had to write verbose nested guards: `if (user && user.profile && user.profile.tier)`.',
              'Modern JavaScript provides **Optional Chaining (`?.`)**:',
              '`const tier = user?.profile?.tier;`',
              'If any reference before `?.` is `null` or `undefined`, the expression short-circuits and safely returns `undefined` instead of throwing an error.',
              'Combine this with **Nullish Coalescing (`??`)** to provide safe fallbacks without the pitfalls of `||` (which misinterprets valid values like `0` or `""` as falsey).',
            ],
            keyTakeaways: [
              '`?.` short-circuits execution as soon as a nullish property is encountered.',
              '`??` checks only for null or undefined, preserving valid falsey values like 0, false, and empty strings.',
              'Never use `!` (non-null assertion in TypeScript) unless you have mathematically proven the value cannot be null.',
            ],
            practiceChallengeId: 'type-error-null',
            codeExample: {
              language: 'javascript',
              description: 'Crash-proof optional chaining and fallback',
              code: `const userAccount = {
  id: 'usr_819',
  settings: {
    notificationsCount: 0 // valid count
  }
};

// Safe access with ?. and ??
const count = userAccount?.settings?.notificationsCount ?? 10;
console.log(count); // Correctly returns 0, not 10!`,
            },
            quiz: [
              {
                id: 'q4',
                question: 'What will `0 ?? 42` evaluate to?',
                options: ['42', '0', 'undefined', 'null'],
                correctIndex: 1,
                explanation: 'The nullish coalescing operator ?? only triggers for null or undefined. 0 is a number, so 0 is returned.',
              },
            ],
          },
        ],
      },
      {
        id: 'm3-async-errors',
        title: 'Module 3: Asynchronous Pitfalls & Unhandled Promise Rejections',
        description: 'Master error handling in async/await, Promise chains, and avoid silent failures in backend Node.js and React.',
        lessons: [
          {
            id: 'l5-unhandled-rejections',
            title: '3.1 The Microtask Queue & Unhandled Promise Rejections',
            durationMinutes: 14,
            type: 'interactive_lab',
            summary: 'Why unhandled promise rejections can terminate Node.js servers and freeze React components.',
            content: [
              'Promises run in the **Microtask Queue**, which is processed immediately after the current synchronous script completes and before any rendering or macrotasks (like `setTimeout`).',
              'If a Promise rejects and there is no `.catch()` handler or surrounding `try...catch` in an `async` function, an `unhandledrejection` event is fired.',
              'In Node.js >= 15, unhandled promise rejections automatically terminate the process with exit code 1 to prevent corrupt state. In frontend browsers, they lead to silent UI freezes.',
            ],
            keyTakeaways: [
              'Always wrap `await` calls in `try...catch` blocks or chain `.catch()`.',
              'Never leave a fire-and-forget promise without error handling.',
              'Use `Promise.allSettled()` instead of `Promise.all()` when you want partial successes.',
            ],
            practiceChallengeId: 'async-unhandled-rejection',
            codeExample: {
              language: 'javascript',
              description: 'Robust async/await error boundary pattern',
              code: `async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load user:', error.message);
    return { fallback: true, userId };
  }
}`,
            },
            quiz: [
              {
                id: 'q5',
                question: 'What happens in modern Node.js when a Promise rejects without a catch handler?',
                options: [
                  'It silently ignores the error and logs a warning',
                  'It retries the request 3 times automatically',
                  'It crashes the process with an UnhandledPromiseRejection exception',
                  'It converts the rejected value into null',
                ],
                correctIndex: 2,
                explanation: 'Node.js intentionally terminates the process to prevent executing in an inconsistent, corrupt state.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'defensive-architecture',
    title: 'Defensive Programming & Error Architecture',
    tagline: 'Build Crash-Proof Systems with Custom Error Hierarchies and Fallbacks',
    description:
      'Learn how senior engineers architect software that gracefully handles unexpected failures. Master custom error classes, circuit breakers, structured error codes, and React Error Boundaries to prevent single-point failures.',
    category: 'Debugging & Errors',
    level: 'Intermediate',
    duration: '3h 30m',
    xp: 550,
    badge: 'Reliability Architect',
    iconName: 'ShieldCheck',
    color: 'from-emerald-500 to-teal-600',
    skillsGained: [
      'Custom Error Hierarchies',
      'Structured Error Enums',
      'Circuit Breakers & Exponential Backoff',
      'React Error Boundaries',
      'Error Observability (Sentry / Datadog)',
    ],
    modules: [
      {
        id: 'm1-custom-errors',
        title: 'Module 1: Custom Error Classes & Structured Error Enums',
        description: 'Replace generic `new Error("something broke")` with domain-driven, typed exception classes.',
        lessons: [
          {
            id: 'l6-custom-errors',
            title: '1.1 Creating Domain Error Hierarchies',
            durationMinutes: 12,
            type: 'concept',
            summary: 'How extending Error with custom metadata (HTTP status, error codes, recovery hints) transforms debugging.',
            content: [
              'Throwing generic strings or plain `Error` objects leaves downstream callers guessing what went wrong.',
              'By creating a base `AppError` and extending specialized subclasses (`ValidationError`, `AuthenticationError`, `NotFoundError`), your application can inspect error types cleanly with `instanceof` and respond with appropriate HTTP status codes and user-friendly messages.',
            ],
            keyTakeaways: [
              'Always set `this.name = this.constructor.name` and capture stack trace.',
              'Attach machine-readable `errorCode` strings for frontend internationalization.',
              'Distinguish operational errors (predictable) from programmer bugs (unhandled exceptions).',
            ],
            codeExample: {
              language: 'typescript',
              description: 'Custom AppError base class',
              code: `export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(\`\${resource} with id '\${id}' was not found.\`, 404, 'RESOURCE_NOT_FOUND');
  }
}`,
            },
            quiz: [
              {
                id: 'q6',
                question: 'Why is `isOperational: boolean` important on custom errors?',
                options: [
                  'It speeds up JavaScript garbage collection',
                  'It tells error handlers whether the error is expected (e.g. invalid user input) vs an unhandled programmer bug',
                  'It automatically converts the error into JSON',
                  'It prevents the browser from logging to console',
                ],
                correctIndex: 1,
                explanation: 'Operational errors can be handled gracefully with user notifications; non-operational bugs usually require restarting or logging to alerting systems.',
              },
            ],
          },
        ],
      },
      {
        id: 'm2-boundaries',
        title: 'Module 2: React Error Boundaries & Graceful Degradation',
        description: 'Prevent white-screen-of-death in React applications by isolating UI failures.',
        lessons: [
          {
            id: 'l7-error-boundaries',
            title: '2.1 Isolating Component Failures with Error Boundaries',
            durationMinutes: 14,
            type: 'concept',
            summary: 'How React componentDidCatch and getDerivedStateFromError contain crashes to specific UI widgets.',
            content: [
              'By default, if an unhandled JavaScript error is thrown inside any React render cycle, React unmounts the ENTIRE component tree, leaving the user with a blank white screen.',
              'Error Boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of crashing the whole page.',
            ],
            keyTakeaways: [
              'Wrap independent widgets (e.g. sidebar, feed, payment modal) in separate Error Boundaries.',
              'Error Boundaries do not catch errors inside async callbacks (like setTimeout or fetch); handle those inside the handlers.',
              'Always provide a "Try Again / Reload Component" button in your fallback UI.',
            ],
            codeExample: {
              language: 'tsx',
              description: 'React Error Boundary with fallback',
              code: `class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Widget crash captured:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
          <p className="font-semibold">Unable to load this section.</p>
          <button onClick={() => this.setState({ hasError: false })} className="text-xs underline mt-2">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}`,
            },
          },
        ],
      },
    ],
  },
  {
    id: 'web-security-owasp',
    title: 'Web Security & Vulnerability Auditing (OWASP Top 10)',
    tagline: 'Learn Real-World Exploit Vectors, JWT Verification Flaws & Secure Patching',
    description:
      'Directly inspired by RepoPilot autonomous repair mechanics! Master how real vulnerabilities happen: from expired JWT token bypasses to injection attacks. Learn how to audit, reproduce, and apply surgical security patches.',
    category: 'Security & Auth',
    level: 'Advanced',
    duration: '5h 00m',
    xp: 750,
    badge: 'Security Sentinel',
    iconName: 'Lock',
    color: 'from-rose-500 to-indigo-600',
    skillsGained: [
      'JWT Signature & Expiration Auditing',
      'SQL & Command Injection Prevention',
      'Broken Object-Level Authorization (BOLA)',
      'Cross-Site Scripting (XSS) Sanitization',
      'Automated Security Regression Suites',
    ],
    modules: [
      {
        id: 'm1-jwt-security',
        title: 'Module 1: Authentication Vulnerabilities & The JWT Trap',
        description: 'Understand how developers mistakenly trust decoded token truthiness without enforcing signature and exp claims.',
        lessons: [
          {
            id: 'l8-jwt-flaw',
            title: '1.1 The Expired JWT Token Verification Exploit',
            durationMinutes: 18,
            type: 'interactive_lab',
            summary: 'Step-by-step breakdown of how AUTH-104 allowed expired tokens past middleware.',
            content: [
              'JSON Web Tokens (JWT) consist of 3 parts separated by dots: `Header.Payload.Signature`.',
              'When developers verify a token with `jwt.verify(token, SECRET)`, they often inspect the returned decoded object:',
              '`const decoded = jwt.verify(token, SECRET);`',
              '`if (decoded) { return next(); }`',
              '**The fatal flaw:** If an expired token is passed, or if the verify method was invoked with options that skipped clock checks, checking `if (decoded)` passes truthiness! The system trusts an expired session, granting attackers indefinite access.',
              'The fix requires asserting that decoded is a non-string object AND that `decoded.exp * 1000 >= Date.now()`.',
            ],
            keyTakeaways: [
              'Never rely on truthiness checks alone on decoded tokens.',
              'Explicitly validate the `exp` (expiration), `iss` (issuer), and `aud` (audience) claims.',
              'Use automated regression security tests that simulate expired and forged tokens.',
            ],
            practiceChallengeId: 'jwt-exp-flaw',
            codeExample: {
              language: 'typescript',
              description: 'Hardened JWT Verification Middleware',
              code: `export function verifyAuthToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { exp?: number };
    
    // Strict assertion: must exist and have valid timestamp
    if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
      return false;
    }
    
    const isNotExpired = decoded.exp * 1000 > Date.now();
    return isNotExpired;
  } catch (err) {
    return false; // Signature invalid or malformed
  }
}`,
            },
            quiz: [
              {
                id: 'q8',
                question: 'Why is `decoded.exp * 1000` multiplied by 1000 when comparing with Date.now()?',
                options: [
                  'To convert microseconds to milliseconds',
                  'Because JWT exp is standardized in seconds, while JavaScript Date.now() returns milliseconds',
                  'To account for leap seconds',
                  'Because V8 requires 64-bit integers',
                ],
                correctIndex: 1,
                explanation: 'JWT timestamps (Unix epoch) are in seconds; Date.now() is in milliseconds. Multiplying by 1000 normalizes the units.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'python-error-mastery',
    title: 'Python Fundamentals & Exception Handling',
    tagline: 'Master Pythonic Error Handling, Context Managers and Boundary Checks',
    description:
      'Learn idiomatic Python error handling: from preventing IndexError and KeyError in complex data pipelines to building robust context managers with the `with` statement.',
    category: 'Python & Algorithms',
    level: 'Beginner',
    duration: '3h 15m',
    xp: 480,
    badge: 'Python Alchemist',
    iconName: 'Terminal',
    color: 'from-blue-500 to-cyan-600',
    skillsGained: [
      'IndexError & KeyError Prevention',
      'EAFP (Easier to Ask Forgiveness than Permission)',
      'Custom Python Exception Hierarchies',
      'Context Managers (`__enter__` & `__exit__`)',
      'Logging & Traceback Formatting',
    ],
    modules: [
      {
        id: 'm1-py-errors',
        title: 'Module 1: Indexing & Collection Traps in Python',
        description: 'Understand zero-indexed lists, negative slicing, and bounds checking.',
        lessons: [
          {
            id: 'l9-index-error',
            title: '1.1 Solving IndexError: list index out of range',
            durationMinutes: 12,
            type: 'interactive_lab',
            summary: 'Why off-by-one errors happen in range loops and how to use Pythonic iteration like enumerate().',
            content: [
              'In Python, accessing `items[len(items)]` raises an `IndexError: list index out of range` because Python lists are 0-indexed (valid indices run from `0` to `len - 1`).',
              'Beginners coming from other languages often write `for i in range(len(items) + 1)` or access the last element with `items[len(items)]` instead of the clean, idiomatic Python negative index `items[-1]`.',
            ],
            keyTakeaways: [
              'Use `items[-1]` to read the last element cleanly without calculating length.',
              'Use `for item in items:` or `for i, item in enumerate(items):` instead of manual index counters.',
              'Use `.get()` with dictionaries to avoid `KeyError`.',
            ],
            practiceChallengeId: 'py-index-error',
            codeExample: {
              language: 'python',
              description: 'Idiomatic boundary-safe iteration in Python',
              code: `scores = [88, 92, 79, 95]

# Safe last element access:
latest_score = scores[-1]

# Idiomatic iteration with index and value:
for index, score in enumerate(scores):
    print(f"Student #{index + 1}: {score}")`,
            },
            quiz: [
              {
                id: 'q9',
                question: 'What is the most idiomatic Python way to get the last element of a list named `data`?',
                options: ['data[len(data)]', 'data.last()', 'data[-1]', 'data[data.size - 1]'],
                correctIndex: 2,
                explanation: 'Python natively supports negative indexing: data[-1] accesses the last item without risk of off-by-one errors.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'react-state-traps',
    title: 'Modern React Architecture & State Traps',
    tagline: 'Fix Stale Closures, Infinite Render Loops, and Direct State Mutations',
    description:
      'Master React rendering mechanics: understand why direct state mutation breaks UI updates, how stale closures occur in `useEffect` and `useCallback`, and how to write predictable, pure state updates.',
    category: 'React & Architecture',
    level: 'Intermediate',
    duration: '3h 45m',
    xp: 600,
    badge: 'React Specialist',
    iconName: 'Code',
    color: 'from-cyan-500 to-indigo-600',
    skillsGained: [
      'React Fiber & Reconciliation Engine',
      'Immutable State Updates',
      'Stale Closure Resolution',
      'useEffect Dependency Array Rules',
      'useMemo / useCallback Optimization',
    ],
    modules: [
      {
        id: 'm1-state-mutations',
        title: 'Module 1: The Immutability Principle in React',
        description: 'Understand how React checks object reference equality and why `.push()` breaks re-renders.',
        lessons: [
          {
            id: 'l10-mutation-trap',
            title: '1.1 The Direct State Mutation Trap',
            durationMinutes: 15,
            type: 'interactive_lab',
            summary: 'Why `state.items.push(newItem)` fails to re-render React components and how to use spread syntax.',
            content: [
              'React uses shallow reference equality (`Object.is(oldState, newState)`) to decide if a component needs to re-render.',
              'When you write `items.push(newItem); setItems(items);`, the array memory address has NOT changed! React compares `items === items`, sees identical memory references, and skips the re-render completely.',
              'To trigger a re-render, you must create a new array reference using the spread operator: `setItems([...items, newItem])`.',
            ],
            keyTakeaways: [
              'Never mutate state directly in React.',
              'Arrays: use `[...items, newItem]`, `items.filter(...)`, or `items.map(...)`.',
              'Objects: use `{ ...user, status: "active" }`.',
            ],
            practiceChallengeId: 'react-mutation-bug',
            codeExample: {
              language: 'javascript',
              description: 'Immutable state updates',
              code: `// ❌ BUG: Same reference, no re-render
todos.push({ text: 'Buy milk' });
setTodos(todos);

// ✅ FIXED: New array reference created
setTodos(prev => [...prev, { text: 'Buy milk' }]);`,
            },
          },
        ],
      },
    ],
  },
  {
    id: 'java-oop-errors',
    title: 'Java Exception Architecture & Robust OOP',
    tagline: 'Defeat NullPointerExceptions, Master Checked vs Unchecked Exceptions, and JVM Memory Safety',
    description:
      'Java enterprise systems must be crash-resilient. Learn how the JVM handles stack frames, understand heap references, avoid NullPointerExceptions using Optional<T> and defensive guards, and write clean try-with-resources blocks.',
    category: 'Java & Backend',
    level: 'Beginner',
    duration: '3h 45m',
    xp: 600,
    badge: 'Java Champion',
    iconName: 'Coffee',
    color: 'from-amber-600 to-red-600',
    skillsGained: [
      'NullPointerException Elimination',
      'ArrayIndexOutOfBounds Defensive Coding',
      'Checked vs Unchecked Exceptions',
      'Optional<T> & Monadic Handling',
      'Try-with-resources & Memory Leaks',
    ],
    modules: [
      {
        id: 'jm1-exceptions',
        title: 'Module 1: JVM Stack Traces & Null Pointer Elimination',
        description: 'Understand why references are null in Java and how to use Optional and guards to guarantee safety.',
        lessons: [
          {
            id: 'jl1-npe',
            title: '1.1 The Billion-Dollar Mistake: Java NullPointerException',
            durationMinutes: 12,
            type: 'interactive_lab',
            summary: 'Why dereferencing uninitialized or missing references throws NullPointerException in Java.',
            content: [
              'Tony Hoare invented the null reference in 1965 and called it his "billion-dollar mistake". In Java, reference variables point to memory locations on the JVM Heap. If a variable holds null, attempting to invoke methods or access fields throws java.lang.NullPointerException (NPE).',
              'Defensive approaches include: (1) Explicit null checking with if (obj != null), (2) Java 8 Optional<T>, and (3) Objects.requireNonNull().',
            ],
            keyTakeaways: [
              'Always validate method parameters and external API responses before invoking methods on them.',
              'Use Optional<T> for return types that might legitimately be empty.',
              'Never return null from collections: return Collections.emptyList() instead.',
            ],
            practiceChallengeId: 'java-null-pointer',
            codeExample: {
              language: 'java',
              description: 'Null-safe object traversal in Java',
              code: `public String getEmailSafe(User user) {
    if (user == null || user.getEmail() == null) {
        return "no-reply@example.com";
    }
    return user.getEmail().toLowerCase();
}`,
            },
            quiz: [
              {
                id: 'jq1',
                question: 'What is the recommended Java 8+ container for values that may or may not be present?',
                options: ['Optional<T>', 'Nullable<T>', 'Wrapper<T>', 'SafeRef<T>'],
                correctIndex: 0,
                explanation: 'Java 8 introduced java.util.Optional<T> to represent optional values without using null references.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cpp-memory-safety',
    title: 'C & C++ Memory Management & Safety',
    tagline: 'Pointers, Segmentation Faults, Valgrind, and Modern RAII Smart Pointers',
    description:
      'Step beyond high-level runtimes into manual and RAII memory control. Understand the Stack vs Heap, diagnose segmentation faults, fix buffer overflows, and master std::unique_ptr and std::shared_ptr in modern C++20.',
    category: 'C & Systems Programming',
    level: 'Intermediate',
    duration: '4h 30m',
    xp: 750,
    badge: 'Systems Architect',
    iconName: 'Cpu',
    color: 'from-blue-600 to-indigo-700',
    skillsGained: [
      'Pointers & Heap Allocation',
      'Segmentation Fault Diagnosis',
      'Buffer Overflow Prevention',
      'Modern RAII & Smart Pointers',
      'Vector Bounds Checking',
    ],
    modules: [
      {
        id: 'cm1-pointers',
        title: 'Module 1: Pointer Dereference & Bounds Checking',
        description: 'Understand raw pointers, dangling memory, and vector bounds safety.',
        lessons: [
          {
            id: 'cl1-bounds',
            title: '1.1 Bounds Safety: operator[] vs .at() in std::vector',
            durationMinutes: 15,
            type: 'interactive_lab',
            summary: 'Why C++ vector operator[] silently produces undefined behavior on out-of-bounds, while .at() throws std::out_of_range.',
            content: [
              'In C++, std::vector::operator[] does NOT perform bounds checking for raw performance reasons. Accessing vec[vec.size()] reads arbitrary memory or causes a Segmentation Fault.',
              'std::vector::at() performs strict bounds checking and throws std::out_of_range if index >= size(), allowing structured exception handling.',
            ],
            keyTakeaways: [
              'Use .at(index) when indices are computed dynamically or come from user input.',
              'Use range-based for loops: for (const auto& item : vec) to avoid index boundary off-by-one errors.',
            ],
            practiceChallengeId: 'cpp-vector-range',
            codeExample: {
              language: 'cpp',
              description: 'Safe C++ vector access with bounds check',
              code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> numbers = {10, 20, 30};
    try {
        std::cout << numbers.at(1) << std::endl; // Safe: 20
    } catch (const std::out_of_range& e) {
        std::cerr << "Out of bounds error: " << e.what() << std::endl;
    }
    return 0;
}`,
            },
          },
        ],
      },
    ],
  },
];

export const PRACTICE_CHALLENGES: PracticeChallenge[] = [
  {
    id: 'type-error-null',
    title: 'TypeError: Cannot read properties of undefined',
    difficulty: 'Easy',
    language: 'javascript',
    category: 'Error Debugging',
    description:
      'The function `getUserBadge` crashes when receiving user objects with missing or undefined membership data. Run the code, observe the error, explore the AI explanation of why it happened, and fix it using optional chaining or null guarding.',
    errorNameTarget: "TypeError: Cannot read properties of undefined (reading 'tier')",
    relatedCourseId: 'js-ts-debugging',
    relatedLessonId: 'l4-optional-chaining',
    initialCode: `// Challenge: Fix the TypeError when accessing nested user profile data
function getUserBadge(user) {
  // 💥 BUG: If user.subscription is undefined, accessing .tier crashes the app!
  const tier = user.subscription.tier;
  
  if (tier === 'pro') {
    return '🌟 Pro Member';
  } else if (tier === 'enterprise') {
    return '👑 Enterprise VIP';
  }
  return '🌱 Free Tier';
}

// Test cases
console.log('User 1 (Pro):', getUserBadge({ name: 'Alice', subscription: { tier: 'pro' } }));

// This call currently throws TypeError!
console.log('User 2 (Guest):', getUserBadge({ name: 'Bob' }));
`,
    solutionCode: `// Challenge: Fix the TypeError when accessing nested user profile data
function getUserBadge(user) {
  // ✅ FIXED: Use optional chaining (?.) and nullish coalescing (??)
  const tier = user?.subscription?.tier ?? 'free';
  
  if (tier === 'pro') {
    return '🌟 Pro Member';
  } else if (tier === 'enterprise') {
    return '👑 Enterprise VIP';
  }
  return '🌱 Free Tier';
}

// Test cases
console.log('User 1 (Pro):', getUserBadge({ name: 'Alice', subscription: { tier: 'pro' } }));
console.log('User 2 (Guest):', getUserBadge({ name: 'Bob' }));
console.log('User 3 (Null):', getUserBadge(null));
`,
    hints: [
      'Look at line 4: `user.subscription` is undefined when a user has no active subscription.',
      'In modern JavaScript, you can use the optional chaining operator `?.` to safely traverse nested properties: `user?.subscription?.tier`.',
      'Provide a fallback value with the nullish coalescing operator `?? "free"` to handle missing values gracefully.',
    ],
    testCases: [
      {
        id: 'tc-1',
        name: 'Valid Pro User',
        inputDescription: '{ name: "Alice", subscription: { tier: "pro" } }',
        expectedOutput: '🌟 Pro Member',
      },
      {
        id: 'tc-2',
        name: 'Guest User (undefined subscription)',
        inputDescription: '{ name: "Bob" }',
        expectedOutput: '🌱 Free Tier',
      },
      {
        id: 'tc-3',
        name: 'Completely Null User Object',
        inputDescription: 'null',
        expectedOutput: '🌱 Free Tier',
      },
    ],
  },
  {
    id: 'ref-error-tdz',
    title: 'ReferenceError: Cannot access variable before initialization',
    difficulty: 'Easy',
    language: 'javascript',
    category: 'Error Debugging',
    description:
      'A shipping calculator is failing with a ReferenceError. The variable `taxRate` is being used in a calculation before its `let` declaration. Fix the scoping and order of execution to eliminate the Temporal Dead Zone error.',
    errorNameTarget: "ReferenceError: Cannot access 'taxRate' before initialization",
    relatedCourseId: 'js-ts-debugging',
    relatedLessonId: 'l2-tdz',
    initialCode: `// Challenge: Fix the ReferenceError caused by Temporal Dead Zone (TDZ)
function calculateOrderTotal(subtotal, region) {
  // 💥 BUG: Calculating tax before 'taxRate' is declared!
  const estimatedTax = subtotal * taxRate;

  let taxRate;
  if (region === 'CA') {
    taxRate = 0.0925;
  } else if (region === 'NY') {
    taxRate = 0.08875;
  } else {
    taxRate = 0.05;
  }

  return subtotal + estimatedTax;
}

console.log('Order Total:', calculateOrderTotal(100, 'CA'));
`,
    solutionCode: `// Challenge: Fix the ReferenceError caused by Temporal Dead Zone (TDZ)
function calculateOrderTotal(subtotal, region) {
  // ✅ FIXED: Declare and resolve taxRate before performing arithmetic
  let taxRate;
  if (region === 'CA') {
    taxRate = 0.0925;
  } else if (region === 'NY') {
    taxRate = 0.08875;
  } else {
    taxRate = 0.05;
  }

  const estimatedTax = subtotal * taxRate;
  return subtotal + estimatedTax;
}

console.log('Order Total:', calculateOrderTotal(100, 'CA'));
`,
    hints: [
      'In JavaScript, variables declared with `let` or `const` cannot be read before their declaration line (Temporal Dead Zone).',
      'Move the declaration and resolution of `taxRate` above line 4 before computing `estimatedTax`.',
    ],
    testCases: [
      {
        id: 'tc-1',
        name: 'California Region (CA)',
        inputDescription: 'calculateOrderTotal(100, "CA")',
        expectedOutput: '109.25',
      },
      {
        id: 'tc-2',
        name: 'Default Region',
        inputDescription: 'calculateOrderTotal(50, "TX")',
        expectedOutput: '52.5',
      },
    ],
  },
  {
    id: 'range-error-recursion',
    title: 'RangeError: Maximum call stack size exceeded',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Error Debugging',
    description:
      'A recursive countdown timer / tree traversal function keeps executing without stopping until V8 throws `RangeError: Maximum call stack size exceeded`. Diagnose the missing base case and restore stack safety.',
    errorNameTarget: 'RangeError: Maximum call stack size exceeded',
    relatedCourseId: 'js-ts-debugging',
    relatedLessonId: 'l1-callstack',
    initialCode: `// Challenge: Fix infinite recursion stack overflow
function countdownToLaunch(secondsRemaining) {
  console.log(\`T-minus \${secondsRemaining} seconds...\`);
  
  // 💥 BUG: Missing base condition! The recursion runs endlessly into negative numbers!
  return countdownToLaunch(secondsRemaining - 1);
}

// Running this will quickly blow the call stack:
countdownToLaunch(5);
`,
    solutionCode: `// Challenge: Fix infinite recursion stack overflow
function countdownToLaunch(secondsRemaining) {
  console.log(\`T-minus \${secondsRemaining} seconds...\`);
  
  // ✅ FIXED: Base condition halts the recursion when reaching 0
  if (secondsRemaining <= 1) {
    console.log('🚀 Liftoff!');
    return 'Launched';
  }
  
  return countdownToLaunch(secondsRemaining - 1);
}

countdownToLaunch(5);
`,
    hints: [
      'Every recursive function requires a BASE CASE: a condition that returns a value without making another recursive call.',
      'Check if `secondsRemaining <= 1` and return or log liftoff instead of calling `countdownToLaunch` again.',
    ],
    testCases: [
      {
        id: 'tc-1',
        name: 'Countdown from 3',
        inputDescription: 'countdownToLaunch(3)',
        expectedOutput: 'Launched',
      },
    ],
  },
  {
    id: 'async-unhandled-rejection',
    title: 'UnhandledPromiseRejection: Network request failed',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Async & Promises',
    description:
      'An asynchronous data loader makes an API request that can reject. Because it lacks a try...catch or error boundary, the promise rejection is unhandled and halts execution. Implement proper async error recovery.',
    errorNameTarget: 'UnhandledPromiseRejection: Failed to fetch user profile: Network Timeout',
    relatedCourseId: 'js-ts-debugging',
    relatedLessonId: 'l5-unhandled-rejections',
    initialCode: `// Challenge: Handle asynchronous Promise rejections gracefully
async function fetchUserMetrics(userId) {
  const simulatedNetworkCall = () =>
    new Promise((resolve, reject) => {
      // Simulating a failed network timeout
      reject(new Error('Network Timeout: Gateway 504'));
    });

  // 💥 BUG: Awaiting a rejecting promise without a try...catch wrapper!
  const data = await simulatedNetworkCall();
  return { status: 200, data };
}

fetchUserMetrics('usr_102');
`,
    solutionCode: `// Challenge: Handle asynchronous Promise rejections gracefully
async function fetchUserMetrics(userId) {
  const simulatedNetworkCall = () =>
    new Promise((resolve, reject) => {
      reject(new Error('Network Timeout: Gateway 504'));
    });

  // ✅ FIXED: Enclosed in try...catch to return a graceful fallback
  try {
    const data = await simulatedNetworkCall();
    return { status: 200, data };
  } catch (error) {
    console.warn(\`Handled async failure for user \${userId}:\`, error.message);
    return { status: 504, data: null, error: error.message, isFallback: true };
  }
}

fetchUserMetrics('usr_102').then(res => console.log('Recovered result:', res));
`,
    hints: [
      'Wrap the `await simulatedNetworkCall()` in a `try { ... } catch (error) { ... }` block.',
      'In the `catch` block, return a fallback object with `{ status: 504, error: error.message, isFallback: true }` so the caller can handle the outage cleanly.',
    ],
    testCases: [
      {
        id: 'tc-1',
        name: 'Graceful Error Recovery',
        inputDescription: 'fetchUserMetrics("usr_102")',
        expectedOutput: 'Recovered result: { status: 504, data: null, isFallback: true }',
      },
    ],
  },
  {
    id: 'type-error-const-assign',
    title: 'TypeError: Assignment to constant variable',
    difficulty: 'Easy',
    language: 'javascript',
    category: 'Error Debugging',
    description:
      'A cart total accumulator attempts to reassign a `const` variable inside a loop. Understand the difference between reassignment of primitives versus mutation of array references.',
    errorNameTarget: 'TypeError: Assignment to constant variable.',
    relatedCourseId: 'js-ts-debugging',
    relatedLessonId: 'l2-tdz',
    initialCode: `// Challenge: Fix TypeError when accumulating values
function sumCart(items) {
  // 💥 BUG: Declared as 'const', but reassigned in each loop iteration!
  const total = 0;

  for (const item of items) {
    total = total + item.price; // 💥 CRASH!
  }

  return total;
}

const cart = [{ name: 'Keyboard', price: 75 }, { name: 'Mouse', price: 45 }];
console.log('Total:', sumCart(cart));
`,
    solutionCode: `// Challenge: Fix TypeError when accumulating values
function sumCart(items) {
  // ✅ FIXED: Use 'let' for accumulators that get reassigned, or use .reduce()
  let total = 0;

  for (const item of items) {
    total += item.price;
  }

  return total;
}

const cart = [{ name: 'Keyboard', price: 75 }, { name: 'Mouse', price: 45 }];
console.log('Total:', sumCart(cart));
`,
    hints: [
      'Variables declared with `const` cannot be reassigned with the `=` operator.',
      'Change `const total = 0;` to `let total = 0;`, or use `items.reduce((sum, item) => sum + item.price, 0)`.',
    ],
    testCases: [
      {
        id: 'tc-1',
        name: 'Accumulate items',
        inputDescription: 'sumCart([{ price: 75 }, { price: 45 }])',
        expectedOutput: '120',
      },
    ],
  },
  {
    id: 'py-index-error',
    title: 'Python IndexError: list index out of range',
    difficulty: 'Easy',
    language: 'python',
    category: 'Error Debugging',
    description:
      'A Python log summarizer tries to print each log entry by calculating indices up to `len(logs)`. Because Python uses 0-based indexing, `logs[len(logs)]` triggers an IndexError. Fix the loop boundary.',
    errorNameTarget: 'IndexError: list index out of range',
    relatedCourseId: 'python-error-mastery',
    relatedLessonId: 'l9-index-error',
    initialCode: `# Challenge: Fix Python IndexError in list traversal
def summarize_logs(log_entries):
    summary = []
    # 💥 BUG: range(len + 1) iterates one step too far!
    for i in range(len(log_entries) + 1):
        entry = log_entries[i] # 💥 IndexError on last iteration!
        summary.append(f"Log #{i}: {entry}")
    return summary

logs = ["System boot", "Service started", "User logged in"]
print(summarize_logs(logs))
`,
    solutionCode: `# Challenge: Fix Python IndexError in list traversal
def summarize_logs(log_entries):
    # ✅ FIXED: Use Pythonic enumerate() without manual index boundaries
    summary = []
    for i, entry in enumerate(log_entries):
        summary.append(f"Log #{i}: {entry}")
    return summary

logs = ["System boot", "Service started", "User logged in"]
print(summarize_logs(logs))
`,
    hints: [
      'In Python, a list of length 3 has valid indices 0, 1, and 2. An index of 3 is out of range.',
      'Instead of `range(len(log_entries) + 1)`, use `range(len(log_entries))` or even better, the Pythonic `for i, entry in enumerate(log_entries):`.',
    ],
    testCases: [
      {
        id: 'tc-1',
        name: '3 Logs',
        inputDescription: 'summarize_logs(["System boot", "Service started", "User logged in"])',
        expectedOutput: '3 formatted entries without crash',
      },
    ],
  },
  {
    id: 'react-mutation-bug',
    title: 'React State Mutation: Missing UI Re-renders',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'State & Closures',
    description:
      'A shopping list app adds items to state using `items.push(newItem)`. While the array updates in memory, React never re-renders the UI because the object reference remained identical. Refactor to an immutable state update.',
    errorNameTarget: 'StateMutationError: Array.prototype.push directly mutated state reference',
    relatedCourseId: 'react-state-traps',
    relatedLessonId: 'l10-mutation-trap',
    initialCode: `// Challenge: Fix React Direct State Mutation Bug
function addNotification(state, newNotification) {
  // 💥 BUG: Direct mutation with .push() retains the same memory reference!
  // React's shallow comparison Object.is(oldState, newState) evaluates to TRUE,
  // causing React to skip re-rendering the UI.
  state.notifications.push(newNotification);
  return state;
}

const currentState = { notifications: ['Welcome!'] };
const nextState = addNotification(currentState, 'New Message');

console.log('Same reference?:', currentState === nextState); // true (BUG!)
`,
    solutionCode: `// Challenge: Fix React Direct State Mutation Bug
function addNotification(state, newNotification) {
  // ✅ FIXED: Return a brand new object and new array reference using spread syntax
  return {
    ...state,
    notifications: [...state.notifications, newNotification],
  };
}

const currentState = { notifications: ['Welcome!'] };
const nextState = addNotification(currentState, 'New Message');

console.log('Same reference?:', currentState === nextState); // false (Proper immutable update!)
console.log('Next State:', nextState);
`,
    hints: [
      'React requires a new object/array memory reference to detect changes.',
      'Use the spread operator: `return { ...state, notifications: [...state.notifications, newNotification] };`',
    ],
    testCases: [
      {
        id: 'tc-1',
        name: 'Immutable update',
        inputDescription: 'addNotification({ notifications: [] }, "Ping")',
        expectedOutput: 'New reference with ["Ping"]',
      },
    ],
  },
  {
    id: 'jwt-exp-flaw',
    title: 'Security Vulnerability: Expired Token Bypass (AUTH-104)',
    difficulty: 'Hard',
    language: 'typescript',
    category: 'Security',
    description:
      'The exact vulnerability analyzed in RepoPilot! The auth middleware verifies the JWT signature but assumes that if `decoded` is truthy, the session is valid. An expired token with a valid past signature passes through. Enforce strict expiration assertion.',
    errorNameTarget: 'SecurityVulnerability: Expired token accepted as valid authenticated session',
    relatedCourseId: 'web-security-owasp',
    relatedLessonId: 'l8-jwt-flaw',
    initialCode: `// Challenge: Fix the AUTH-104 Expired JWT Bypass Vulnerability
interface JwtPayload {
  userId: string;
  role: string;
  exp: number; // Unix timestamp in seconds
}

function authenticateRequest(decodedPayload: JwtPayload | null): boolean {
  // 💥 CRITICAL SECURITY GAP:
  // Developers assume if decodedPayload exists, the user is authorized.
  // Expired tokens from hours or days ago pass truthiness!
  if (decodedPayload) {
    return true; // 💥 EXPLOIT: Expired session accepted!
  }
  return false;
}

// Expired token generated 2 hours ago:
const expiredTokenPayload: JwtPayload = {
  userId: 'usr_hacker',
  role: 'admin',
  exp: Math.floor(Date.now() / 1000) - 7200, // 2 hours in the past
};

console.log('Is Authorized?:', authenticateRequest(expiredTokenPayload)); // Returns true (DANGEROUS BUG!)
`,
    solutionCode: `// Challenge: Fix the AUTH-104 Expired JWT Bypass Vulnerability
interface JwtPayload {
  userId: string;
  role: string;
  exp: number; // Unix timestamp in seconds
}

function authenticateRequest(decodedPayload: JwtPayload | null): boolean {
  // ✅ FIXED: Validate payload structure and enforce strict expiration check
  if (!decodedPayload || typeof decodedPayload !== 'object' || !decodedPayload.exp) {
    return false;
  }

  const currentTimestampSec = Math.floor(Date.now() / 1000);
  const isNotExpired = decodedPayload.exp > currentTimestampSec;

  return isNotExpired;
}

const expiredTokenPayload: JwtPayload = {
  userId: 'usr_hacker',
  role: 'admin',
  exp: Math.floor(Date.now() / 1000) - 7200,
};

console.log('Is Authorized?:', authenticateRequest(expiredTokenPayload)); // Returns false (SECURE!)
`,
    hints: [
      'Compare `decodedPayload.exp` against the current time in seconds: `Math.floor(Date.now() / 1000)`.',
      'The token is only valid if `decodedPayload.exp > currentTimestampSec`.',
      'Ensure you also verify `!decodedPayload || !decodedPayload.exp` to avoid null pointer exceptions.',
    ],
    testCases: [
      {
        id: 'tc-1',
        name: 'Reject expired token',
        inputDescription: 'authenticateRequest({ exp: now - 3600 })',
        expectedOutput: 'false',
      },
      {
        id: 'tc-2',
        name: 'Accept fresh token',
        inputDescription: 'authenticateRequest({ exp: now + 3600 })',
        expectedOutput: 'true',
      },
    ],
  },
  {
    id: 'java-null-pointer',
    title: 'Java NullPointerException: Object Reference Dereference',
    difficulty: 'Easy',
    language: 'java',
    category: 'Error Debugging',
    description:
      'In a Java user authentication service, `User.getEmail()` is invoked on a user object where email is null or uninitialized. Fix the code to guard against null references using safe conditional checks or Optional.',
    errorNameTarget: 'java.lang.NullPointerException: Cannot invoke "String.toLowerCase()" because "email" is null',
    relatedCourseId: 'java-oop-errors',
    relatedLessonId: 'jl1-npe',
    initialCode: `// Java Practice Sandbox: Fix NullPointerException
public class Main {
    static class User {
        private String name;
        private String email;

        public User(String name, String email) {
            this.name = name;
            this.email = email;
        }

        public String getEmail() {
            return this.email;
        }
    }

    public static String formatUserEmail(User user) {
        // 💥 BUG: If user is null or email is null, .toLowerCase() throws NullPointerException!
        return user.getEmail().toLowerCase();
    }

    public static void main(String[] args) {
        User validUser = new User("Alice", "ALICE@EXAMPLE.COM");
        System.out.println("Valid user: " + formatUserEmail(validUser));

        // 💥 This triggers NullPointerException:
        User nullEmailUser = new User("Bob", null);
        System.out.println("Null email user: " + formatUserEmail(nullEmailUser));
    }
}
`,
    solutionCode: `// Java Practice Sandbox: Fix NullPointerException
public class Main {
    static class User {
        private String name;
        private String email;

        public User(String name, String email) {
            this.name = name;
            this.email = email;
        }

        public String getEmail() {
            return this.email;
        }
    }

    public static String formatUserEmail(User user) {
        // ✅ FIXED: Null guard prevents NullPointerException
        if (user == null || user.getEmail() == null) {
            return "no-reply@system.local";
        }
        return user.getEmail().toLowerCase();
    }

    public static void main(String[] args) {
        User validUser = new User("Alice", "ALICE@EXAMPLE.COM");
        System.out.println("Valid user: " + formatUserEmail(validUser));

        User nullEmailUser = new User("Bob", null);
        System.out.println("Null email user: " + formatUserEmail(nullEmailUser));
    }
}
`,
    hints: [
      'In Java, invoking any method on a reference that is null throws `NullPointerException`.',
      'Check `if (user == null || user.getEmail() == null)` before calling `.toLowerCase()`.',
      'Return a safe default fallback like `"no-reply@system.local"` when null.',
    ],
    testCases: [
      {
        id: 'tc-j1',
        name: 'Valid Email Check',
        inputDescription: 'User("Alice", "ALICE@EXAMPLE.COM")',
        expectedOutput: 'alice@example.com',
      },
      {
        id: 'tc-j2',
        name: 'Null Email Guard',
        inputDescription: 'User("Bob", null)',
        expectedOutput: 'no-reply@system.local',
      },
    ],
  },
  {
    id: 'java-array-oob',
    title: 'Java ArrayIndexOutOfBoundsException: Off-by-one Boundary',
    difficulty: 'Easy',
    language: 'java',
    category: 'Error Debugging',
    description:
      'A score statistics processor iterates through an array of scores using `<= array.length` instead of `< array.length`, attempting to access an index outside the allocated array memory.',
    errorNameTarget: 'java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 5',
    relatedCourseId: 'java-oop-errors',
    relatedLessonId: 'jl1-npe',
    initialCode: `// Java Practice Sandbox: Fix ArrayIndexOutOfBoundsException
public class Main {
    public static int calculateTotal(int[] scores) {
        int total = 0;
        // 💥 BUG: <= scores.length tries to read index equal to length!
        // An array of length 5 has valid indices 0, 1, 2, 3, 4. Index 5 crashes!
        for (int i = 0; i <= scores.length; i++) {
            total += scores[i];
        }
        return total;
    }

    public static void main(String[] args) {
        int[] playerScores = {10, 20, 30, 40, 50};
        System.out.println("Total Score: " + calculateTotal(playerScores));
    }
}
`,
    solutionCode: `// Java Practice Sandbox: Fix ArrayIndexOutOfBoundsException
public class Main {
    public static int calculateTotal(int[] scores) {
        int total = 0;
        // ✅ FIXED: Use < scores.length, or enhanced for-each loop
        for (int i = 0; i < scores.length; i++) {
            total += scores[i];
        }
        return total;
    }

    public static void main(String[] args) {
        int[] playerScores = {10, 20, 30, 40, 50};
        System.out.println("Total Score: " + calculateTotal(playerScores));
    }
}
`,
    hints: [
      'Java arrays are 0-indexed. An array of length 5 has valid indices 0 through 4.',
      'Change `i <= scores.length` to `i < scores.length` in the loop condition.',
      'Alternatively, use the enhanced for loop: `for (int score : scores) { total += score; }`.',
    ],
    testCases: [
      {
        id: 'tc-joob1',
        name: 'Calculate 5 scores sum',
        inputDescription: '{10, 20, 30, 40, 50}',
        expectedOutput: '150',
      },
    ],
  },
  {
    id: 'cpp-vector-range',
    title: 'C++ std::out_of_range: Vector Bounds Violation',
    difficulty: 'Medium',
    language: 'cpp',
    category: 'Error Debugging',
    description:
      'A telemetry reader accesses sensor values from `std::vector<float>` using an index equal to `vec.size()`. Understand why bounds checking with `.at()` throws `std::out_of_range` and prevent out-of-bounds access.',
    errorNameTarget: 'std::out_of_range: vector::_M_range_check: __n >= this->size()',
    relatedCourseId: 'cpp-memory-safety',
    relatedLessonId: 'cl1-bounds',
    initialCode: `// C++ Practice Sandbox: Fix std::out_of_range
#include <iostream>
#include <vector>

float getLatestReading(const std::vector<float>& readings) {
    // 💥 BUG: readings.size() is 1 past the last element!
    // A vector of size 3 has valid indices 0, 1, 2. Index 3 is out of range!
    return readings.at(readings.size());
}

int main() {
    std::vector<float> telemetry = {23.4f, 24.1f, 22.8f};
    std::cout << "Latest Telemetry: " << getLatestReading(telemetry) << std::endl;
    return 0;
}
`,
    solutionCode: `// C++ Practice Sandbox: Fix std::out_of_range
#include <iostream>
#include <vector>

float getLatestReading(const std::vector<float>& readings) {
    // ✅ FIXED: Guard against empty vector and access readings.back() or size() - 1
    if (readings.empty()) {
        return 0.0f;
    }
    return readings.back(); // or readings.at(readings.size() - 1)
}

int main() {
    std::vector<float> telemetry = {23.4f, 24.1f, 22.8f};
    std::cout << "Latest Telemetry: " << getLatestReading(telemetry) << std::endl;
    return 0;
}
`,
    hints: [
      'In C++, `std::vector::size()` returns the count of elements. The last valid element is at `size() - 1`.',
      'Prefer using `readings.back()` to retrieve the last element safely.',
      'Always check `readings.empty()` to avoid calling `.back()` on an empty container.',
    ],
    testCases: [
      {
        id: 'tc-cpp1',
        name: 'Last telemetry reading',
        inputDescription: '{23.4, 24.1, 22.8}',
        expectedOutput: '22.8',
      },
    ],
  },
  {
    id: 'cpp-segfault',
    title: 'C++ Segmentation Fault: Dangling Stack Pointer',
    difficulty: 'Hard',
    language: 'cpp',
    category: 'Security',
    description:
      'A configuration factory returns a raw pointer to a local stack-allocated variable. Once the function frame pops off the stack, dereferencing the pointer causes undefined behavior or Segmentation Fault (SIGSEGV).',
    errorNameTarget: 'Segmentation fault (core dumped): dereferencing dangling pointer',
    relatedCourseId: 'cpp-memory-safety',
    relatedLessonId: 'cl1-bounds',
    initialCode: `// C++ Practice Sandbox: Fix Segmentation Fault / Dangling Pointer
#include <iostream>
#include <string>

std::string* createConfigBanner() {
    // 💥 BUG: 'banner' is allocated on the stack frame of this function!
    // When createConfigBanner() returns, its stack memory is deallocated.
    std::string banner = "Production Server v2.4 (Active)";
    return &banner; // Returning address of local temporary!
}

int main() {
    std::string* ptr = createConfigBanner();
    // 💥 Dereferencing dangling pointer triggers undefined behavior or SIGSEGV!
    std::cout << "Banner: " << *ptr << std::endl;
    return 0;
}
`,
    solutionCode: `// C++ Practice Sandbox: Fix Segmentation Fault / Dangling Pointer
#include <iostream>
#include <string>
#include <memory>

// ✅ FIXED: Return by value (exploiting Move Semantics / RVO) or use std::unique_ptr
std::string createConfigBanner() {
    std::string banner = "Production Server v2.4 (Active)";
    return banner; // Safe: Return Value Optimization (RVO) avoids copying!
}

int main() {
    std::string banner = createConfigBanner();
    std::cout << "Banner: " << banner << std::endl;
    return 0;
}
`,
    hints: [
      'Never return the memory address (`&variable`) of a local variable declared on the stack.',
      'In modern C++, return standard objects like `std::string` or `std::vector` by value; Return Value Optimization (RVO) makes it zero-cost.',
      'If heap allocation is strictly necessary, return `std::unique_ptr<T>` instead of raw `T*`.',
    ],
    testCases: [
      {
        id: 'tc-cpp-seg',
        name: 'Safe Banner Generation',
        inputDescription: 'createConfigBanner()',
        expectedOutput: 'Production Server v2.4 (Active)',
      },
    ],
  },
  {
    id: 'py-key-error',
    title: 'Python KeyError: Missing Dictionary Key in Session',
    difficulty: 'Easy',
    language: 'python',
    category: 'Error Debugging',
    description:
      'An authentication handler checks user role permissions by directly indexing `session["role"]`. When a user visits without an active session cookie, Python raises `KeyError: "role"`. Use `.get()` or defensive presence checking.',
    errorNameTarget: "KeyError: 'role'",
    relatedCourseId: 'python-error-mastery',
    relatedLessonId: 'l9-index-error',
    initialCode: `# Python Practice Sandbox: Fix KeyError
def get_dashboard_theme(user_session):
    # 💥 BUG: Direct indexing session['role'] crashes with KeyError if 'role' is absent!
    user_role = user_session['role']
    
    if user_role == 'admin':
        return 'dark_gold_admin'
    return 'default_light'

# Valid session:
print("Admin theme:", get_dashboard_theme({'user_id': 101, 'role': 'admin'}))

# 💥 Crashes with KeyError: 'role':
guest_session = {'user_id': 102}
print("Guest theme:", get_dashboard_theme(guest_session))
`,
    solutionCode: `# Python Practice Sandbox: Fix KeyError
def get_dashboard_theme(user_session):
    # ✅ FIXED: Use dict.get(key, default) to safely retrieve without KeyError
    user_role = user_session.get('role', 'guest')
    
    if user_role == 'admin':
        return 'dark_gold_admin'
    return 'default_light'

# Valid session:
print("Admin theme:", get_dashboard_theme({'user_id': 101, 'role': 'admin'}))
guest_session = {'user_id': 102}
print("Guest theme:", get_dashboard_theme(guest_session))
`,
    hints: [
      'In Python, accessing `dictionary["key"]` raises a `KeyError` if the key does not exist.',
      'Use `user_session.get("role", "guest")` which safely returns `"guest"` instead of crashing.',
      'Alternatively, use `if "role" in user_session:` to check before reading.',
    ],
    testCases: [
      {
        id: 'tc-py-key1',
        name: 'Admin session',
        inputDescription: '{"role": "admin"}',
        expectedOutput: 'dark_gold_admin',
      },
      {
        id: 'tc-py-key2',
        name: 'Missing key session',
        inputDescription: '{"user_id": 102}',
        expectedOutput: 'default_light',
      },
    ],
  },
  {
    id: 'py-zero-division',
    title: 'Python ZeroDivisionError: Division by Zero in Metrics',
    difficulty: 'Easy',
    language: 'python',
    category: 'Error Debugging',
    description:
      'A ratings accumulator computes the average score with `sum(ratings) / len(ratings)`. When a new product has zero ratings, `len(ratings)` is 0, raising `ZeroDivisionError: division by zero`.',
    errorNameTarget: 'ZeroDivisionError: division by zero',
    relatedCourseId: 'python-error-mastery',
    relatedLessonId: 'l9-index-error',
    initialCode: `# Python Practice Sandbox: Fix ZeroDivisionError
def calculate_average_rating(ratings):
    # 💥 BUG: If ratings is an empty list [], len(ratings) is 0, causing division by zero!
    return sum(ratings) / len(ratings)

print("Product A avg:", calculate_average_rating([4.5, 5.0, 4.0]))

# 💥 Crashes with ZeroDivisionError:
print("Product B avg:", calculate_average_rating([]))
`,
    solutionCode: `# Python Practice Sandbox: Fix ZeroDivisionError
def calculate_average_rating(ratings):
    # ✅ FIXED: Check if ratings list is empty before dividing
    if not ratings:
        return 0.0
    return sum(ratings) / len(ratings)

print("Product A avg:", calculate_average_rating([4.5, 5.0, 4.0]))
print("Product B avg:", calculate_average_rating([]))
`,
    hints: [
      'In Python, dividing any number by zero raises `ZeroDivisionError`.',
      'Add a guard: `if not ratings: return 0.0` before performing the division.',
    ],
    testCases: [
      {
        id: 'tc-py-zd1',
        name: 'Valid ratings',
        inputDescription: '[4.5, 5.0, 4.0]',
        expectedOutput: '4.5',
      },
      {
        id: 'tc-py-zd2',
        name: 'Empty ratings list',
        inputDescription: '[]',
        expectedOutput: '0.0',
      },
    ],
  },
  {
    id: 'c-buffer-overflow',
    title: 'C Buffer Overflow: Unbounded strcpy Memory Corruption',
    difficulty: 'Hard',
    language: 'c',
    category: 'Security',
    description:
      'A legacy C authentication token parser uses unsafe `strcpy` to copy user input into a fixed-size 16-byte stack buffer. An attacker input exceeding 16 bytes smashes the stack and causes a buffer overflow vulnerability.',
    errorNameTarget: '*** stack smashing detected ***: terminated (buffer overflow in strcpy)',
    relatedCourseId: 'cpp-memory-safety',
    relatedLessonId: 'cl1-bounds',
    initialCode: `// C Practice Sandbox: Fix Buffer Overflow Vulnerability
#include <stdio.h>
#include <string.h>

void processUsername(const char* inputUsername) {
    char buffer[16];
    
    // 💥 CRITICAL SECURITY BUG: strcpy does NOT check buffer capacity!
    // Passing a string longer than 15 characters overwrites the stack frame return pointer!
    strcpy(buffer, inputUsername);
    printf("Processed username: %s\\n", buffer);
}

int main() {
    // 💥 28-character payload overflows the 16-byte buffer:
    processUsername("super_administrator_corporate_root");
    return 0;
}
`,
    solutionCode: `// C Practice Sandbox: Fix Buffer Overflow Vulnerability
#include <stdio.h>
#include <string.h>

void processUsername(const char* inputUsername) {
    char buffer[16];
    
    // ✅ FIXED: Use bounded strncpy or snprintf to guarantee no buffer overflow
    snprintf(buffer, sizeof(buffer), "%s", inputUsername);
    printf("Processed username: %s\\n", buffer);
}

int main() {
    processUsername("super_administrator_corporate_root");
    return 0;
}
`,
    hints: [
      'Never use unbounded memory copy functions like `strcpy` or `gets` in C.',
      'Use `snprintf(buffer, sizeof(buffer), "%s", inputUsername);` to prevent copying more bytes than buffer capacity.',
      'Ensure the string is always null-terminated.',
    ],
    testCases: [
      {
        id: 'tc-c-buf1',
        name: 'Safe username truncation',
        inputDescription: '"super_administrator_corporate_root"',
        expectedOutput: 'super_administr',
      },
    ],
  },
  {
    id: 'go-nil-pointer',
    title: 'Go Nil Pointer Dereference: Panic in Struct Pointer',
    difficulty: 'Medium',
    language: 'go',
    category: 'Error Debugging',
    description:
      'A Go worker tries to read field `user.Account.Balance` when the `Account` pointer is nil. In Go, dereferencing a nil pointer causes a runtime panic. Implement defensive nil checks.',
    errorNameTarget: 'panic: runtime error: invalid memory address or nil pointer dereference',
    relatedCourseId: 'js-ts-debugging',
    relatedLessonId: 'l4-optional-chaining',
    initialCode: `// Go Practice Sandbox: Fix Nil Pointer Dereference
package main

import "fmt"

type Account struct {
    Balance float64
}

type User struct {
    Name    string
    Account *Account
}

func GetBalance(u *User) float64 {
    // 💥 BUG: If u is nil or u.Account is nil, dereferencing panics!
    return u.Account.Balance
}

func main() {
    u1 := &User{Name: "Alice", Account: &Account{Balance: 250.75}}
    fmt.Printf("Alice Balance: $%.2f\\n", GetBalance(u1))

    // 💥 Account is nil: triggers panic!
    u2 := &User{Name: "Bob", Account: nil}
    fmt.Printf("Bob Balance: $%.2f\\n", GetBalance(u2))
}
`,
    solutionCode: `// Go Practice Sandbox: Fix Nil Pointer Dereference
package main

import "fmt"

type Account struct {
    Balance float64
}

type User struct {
    Name    string
    Account *Account
}

func GetBalance(u *User) float64 {
    // ✅ FIXED: Defensive nil pointer checks in Go
    if u == nil || u.Account == nil {
        return 0.0
    }
    return u.Account.Balance
}

func main() {
    u1 := &User{Name: "Alice", Account: &Account{Balance: 250.75}}
    fmt.Printf("Alice Balance: $%.2f\\n", GetBalance(u1))

    u2 := &User{Name: "Bob", Account: nil}
    fmt.Printf("Bob Balance: $%.2f\\n", GetBalance(u2))
}
`,
    hints: [
      'In Go, attempting to access a field or method on a nil pointer results in `panic: runtime error: invalid memory address or nil pointer dereference`.',
      'Check `if u == nil || u.Account == nil { return 0.0 }` before accessing `.Balance`.',
    ],
    testCases: [
      {
        id: 'tc-go-nil',
        name: 'Nil account guard',
        inputDescription: 'User{Account: nil}',
        expectedOutput: '0.00',
      },
    ],
  },
  {
    id: 'rust-borrow-checker',
    title: 'Rust Ownership & Borrowing: Borrow of Moved Value',
    difficulty: 'Hard',
    language: 'rust',
    category: 'Security',
    description:
      'A Rust microservice passes a `String` ownership to a logging helper, and then tries to reuse the moved value in a subsequent database query. Understand the Rust Borrow Checker and use references `&str`.',
    errorNameTarget: 'error[E0382]: borrow of moved value: "token"',
    relatedCourseId: 'cpp-memory-safety',
    relatedLessonId: 'cl1-bounds',
    initialCode: `// Rust Practice Sandbox: Fix Borrow of Moved Value
fn log_token(token: String) {
    println!("[AUDIT] Authenticated token: {}", token);
    // token is dropped here at the end of scope!
}

fn main() {
    let token = String::from("bearer_jwt_auth_xyz123");

    // 💥 BUG: Passing 'token' moves ownership into log_token!
    log_token(token);

    // 💥 ERROR[E0382]: borrow of moved value: 'token'!
    println!("Database querying with token: {}", token);
}
`,
    solutionCode: `// Rust Practice Sandbox: Fix Borrow of Moved Value
// ✅ FIXED: Borrow token as a read-only string slice &str instead of taking ownership
fn log_token(token: &str) {
    println!("[AUDIT] Authenticated token: {}", token);
}

fn main() {
    let token = String::from("bearer_jwt_auth_xyz123");

    // Pass by reference: &token
    log_token(&token);

    // 'token' remains valid and owned by main!
    println!("Database querying with token: {}", token);
}
`,
    hints: [
      'In Rust, variables that do not implement the `Copy` trait (like `String`) transfer ownership on assignment or function call.',
      'Change `fn log_token(token: String)` to `fn log_token(token: &str)` to borrow the value instead of moving it.',
      'Call `log_token(&token)` in `main()`.',
    ],
    testCases: [
      {
        id: 'tc-rust-borrow',
        name: 'Borrow token without moving',
        inputDescription: 'token = "bearer_jwt_auth_xyz123"',
        expectedOutput: 'Database querying with token: bearer_jwt_auth_xyz123',
      },
    ],
  },
];
