import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

const WORKSPACES_ROOT = path.join(process.cwd(), '.workspaces', 'repair-jobs');

/**
 * Ensure workspaces root exists
 */
export function ensureWorkspacesRoot(): string {
  if (!fs.existsSync(WORKSPACES_ROOT)) {
    fs.mkdirSync(WORKSPACES_ROOT, { recursive: true });
  }
  return WORKSPACES_ROOT;
}

/**
 * Path Traversal Guard:
 * Resolves a path relative to workspaceDir and asserts that the canonical
 * destination is strictly inside workspaceDir.
 */
export function assertSafePath(workspaceDir: string, relativePath: string): string {
  // Normalize and prevent null bytes or empty path
  if (!relativePath || relativePath.includes('\0')) {
    throw new Error('SECURITY_VIOLATION: Invalid or malformed file path.');
  }

  const cleanWorkspace = path.resolve(workspaceDir);
  const resolvedTarget = path.resolve(cleanWorkspace, relativePath);

  // Strict boundary check: target must be under workspace directory
  if (!resolvedTarget.startsWith(cleanWorkspace + path.sep) && resolvedTarget !== cleanWorkspace) {
    throw new Error(`SECURITY_VIOLATION: Path traversal attempt blocked for "${relativePath}".`);
  }

  return resolvedTarget;
}

/**
 * Redact secrets and sensitive tokens from logs and terminal outputs
 */
export function redactSecrets(text: string): string {
  if (!text) return text;
  let sanitized = text;

  // Mask common secret patterns: bearer tokens, github tokens, secrets
  sanitized = sanitized.replace(/gh[pousr]_[A-Za-z0-9_]{16,255}/g, 'ghp_REDACTED_SECRET');
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer REDACTED_TOKEN');
  sanitized = sanitized.replace(/(AUTH_SECRET|CLIENT_SECRET|API_KEY|TOKEN)=["']?[A-Za-z0-9\-_./+=]+["']?/gi, '$1=REDACTED');
  sanitized = sanitized.replace(/GOCSPX-[A-Za-z0-9\-_]+/g, 'GOCSPX-REDACTED');

  return sanitized;
}

/**
 * Command Allowlist Guard:
 * Only permits strictly vetted development and testing commands.
 */
const ALLOWED_EXECUTABLES = new Set(['npm', 'npm.cmd', 'npx', 'npx.cmd', 'node', 'node.exe']);
const FORBIDDEN_OPERATORS = [';', '&&', '||', '|', '`', '$(', '\n', '\r'];
const FORBIDDEN_COMMANDS = [/\brm\b/i, /\brmdir\b/i, /\bdel\b/i, /\bcurl\b/i, /\bwget\b/i, /\bnc\b/i, /\bbash\b/i, /\bpowershell\b/i, /\bcmd(\.exe)?\b/i];

export function validateCommand(command: string): { executable: string; args: string[] } {
  const trimmed = command.trim();
  if (!trimmed) {
    throw new Error('EMPTY_COMMAND: No command provided to sandbox runner.');
  }

  // Reject shell command chaining or injection characters
  for (const op of FORBIDDEN_OPERATORS) {
    if (trimmed.includes(op)) {
      throw new Error(`SECURITY_VIOLATION: Command contains unpermitted shell operator "${op}".`);
    }
  }

  for (const regex of FORBIDDEN_COMMANDS) {
    if (regex.test(trimmed)) {
      throw new Error(`SECURITY_VIOLATION: Command contains unpermitted command pattern "${regex.source}".`);
    }
  }

  const parts = trimmed.split(/\s+/);
  const executable = parts[0];
  const args = parts.slice(1);

  if (!ALLOWED_EXECUTABLES.has(executable.toLowerCase())) {
    throw new Error(`SECURITY_VIOLATION: Executable "${executable}" is not allowlisted for sandbox execution. Allowed: npm, npx, node.`);
  }

  return { executable, args };
}

/**
 * Initialize isolated disposable workspace for a repair job
 */
export async function initializeWorkspace(
  jobId: string,
  initialFiles?: Record<string, string>
): Promise<string> {
  const root = ensureWorkspacesRoot();
  const workspaceDir = path.join(root, jobId);

  if (fs.existsSync(workspaceDir)) {
    fs.rmSync(workspaceDir, { recursive: true, force: true });
  }

  fs.mkdirSync(workspaceDir, { recursive: true });

  if (initialFiles) {
    for (const [relPath, content] of Object.entries(initialFiles)) {
      const targetPath = assertSafePath(workspaceDir, relPath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, content, 'utf-8');
    }
  }

  return workspaceDir;
}

/**
 * Copy directory contents into isolated workspace
 */
export async function copyToWorkspace(
  sourceDir: string,
  workspaceDir: string,
  excludePatterns: string[] = ['node_modules', '.git', '.next', '.workspaces', '.data']
): Promise<void> {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`SOURCE_NOT_FOUND: Source directory "${sourceDir}" does not exist.`);
  }

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (excludePatterns.includes(entry.name)) continue;

    const srcPath = path.join(sourceDir, entry.name);
    const destPath = path.join(workspaceDir, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      await copyToWorkspace(srcPath, destPath, excludePatterns);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Read file safely from workspace
 */
export function readFile(workspaceDir: string, relativePath: string): string {
  const targetPath = assertSafePath(workspaceDir, relativePath);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`FILE_NOT_FOUND: File "${relativePath}" does not exist in workspace.`);
  }
  return fs.readFileSync(targetPath, 'utf-8');
}

/**
 * Write file safely to workspace
 */
export function writeFile(workspaceDir: string, relativePath: string, content: string): void {
  const targetPath = assertSafePath(workspaceDir, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf-8');
}

/**
 * Search workspace code for literal query or symbol
 */
export function searchCode(
  workspaceDir: string,
  query: string,
  maxResults: number = 25
): Array<{ file: string; line: number; text: string }> {
  const results: Array<{ file: string; line: number; text: string }> = [];
  const lowerQuery = query.toLowerCase();

  function scanDir(dir: string) {
    if (results.length >= maxResults) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          const relPath = path.relative(workspaceDir, fullPath).replace(/\\/g, '/');

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(lowerQuery)) {
              results.push({
                file: relPath,
                line: i + 1,
                text: lines[i].trim(),
              });
              if (results.length >= maxResults) break;
            }
          }
        } catch {
          // ignore binary or unreadable files
        }
      }
    }
  }

  scanDir(workspaceDir);
  return results;
}

/**
 * Generate standard unified-style diff string between two text snippets
 */
export function createUnifiedDiff(filename: string, beforeText: string, afterText: string): string {
  const beforeLines = beforeText.split('\n');
  const afterLines = afterText.split('\n');

  const diffLines: string[] = [
    `--- a/${filename}`,
    `+++ b/${filename}`,
    `@@ -1,${beforeLines.length} +1,${afterLines.length} @@`,
  ];

  for (const line of beforeLines) {
    if (!afterLines.includes(line)) {
      diffLines.push(`-${line}`);
    } else {
      diffLines.push(` ${line}`);
    }
  }

  for (const line of afterLines) {
    if (!beforeLines.includes(line)) {
      diffLines.push(`+${line}`);
    }
  }

  return diffLines.join('\n');
}

/**
 * Apply validated surgical patch to a file in workspace
 */
export function applyPatch(
  workspaceDir: string,
  patch: {
    file: string;
    beforeCode: string;
    afterCode: string;
  }
): { success: boolean; error?: string; diff: string; additions: number; deletions: number } {
  try {
    const targetPath = assertSafePath(workspaceDir, patch.file);
    if (!fs.existsSync(targetPath)) {
      return {
        success: false,
        error: `Target file "${patch.file}" does not exist in workspace.`,
        diff: '',
        additions: 0,
        deletions: 0,
      };
    }

    const currentContent = fs.readFileSync(targetPath, 'utf-8');

    // Normalizing newlines for reliable matching
    const normCurrent = currentContent.replace(/\r\n/g, '\n');
    const normBefore = patch.beforeCode.replace(/\r\n/g, '\n').trim();
    const normAfter = patch.afterCode.replace(/\r\n/g, '\n').trim();

    if (!normBefore) {
      return {
        success: false,
        error: 'Patch beforeCode cannot be empty.',
        diff: '',
        additions: 0,
        deletions: 0,
      };
    }

    if (!normCurrent.includes(normBefore)) {
      return {
        success: false,
        error: `Anchor mismatch: target lines could not be cleanly located in "${patch.file}".`,
        diff: '',
        additions: 0,
        deletions: 0,
      };
    }

    // Apply substitution cleanly
    const updatedContent = normCurrent.replace(normBefore, normAfter);
    fs.writeFileSync(targetPath, updatedContent, 'utf-8');

    const beforeLines = normBefore.split('\n');
    const afterLines = normAfter.split('\n');
    const additions = Math.max(0, afterLines.length - beforeLines.length) + 1;
    const deletions = Math.max(0, beforeLines.length - afterLines.length) + 1;
    const diff = createUnifiedDiff(patch.file, normBefore, normAfter);

    return {
      success: true,
      diff,
      additions,
      deletions,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown error applying patch.',
      diff: '',
      additions: 0,
      deletions: 0,
    };
  }
}

/**
 * Execute an allowlisted test command inside the sandbox with strict bounds
 */
export async function executeSandboxCommand(
  workspaceDir: string,
  command: string,
  options: {
    timeoutMs?: number;
    maxBufferBytes?: number;
    onOutputChunk?: (chunk: string) => void;
  } = {}
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  passed: boolean;
  timedOut?: boolean;
}> {
  const timeoutMs = options.timeoutMs ?? 35000;
  const maxBuffer = options.maxBufferBytes ?? 512 * 1024; // 512 KB
  const { executable, args } = validateCommand(command);

  const startTime = Date.now();
  let stdoutAcc = '';
  let stderrAcc = '';
  let timedOut = false;

  // Sanitized environment: explicitly strip sensitive API keys & tokens
  const sanitizedEnv: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'test',
    CI: 'true',
    AUTH_SECRET: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
    GITHUB_CLIENT_SECRET: undefined,
    OPENAI_API_KEY: undefined,
    ANTHROPIC_API_KEY: undefined,
    GEMINI_API_KEY: undefined,
  };

  return new Promise((resolve) => {
    let proc: any = null;
    let timer: NodeJS.Timeout | null = null;
    const isWin = process.platform === 'win32';
    const isNpmScript = isWin && (executable.toLowerCase().startsWith('npm') || executable.toLowerCase().startsWith('npx'));

    try {
      proc = spawn(executable, args, {
        cwd: workspaceDir,
        env: sanitizedEnv,
        shell: isNpmScript, // Only invoke shell for npm/npx batch runners on Windows; run node binary directly
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (spawnErr: any) {
      return resolve({
        exitCode: 1,
        stdout: '',
        stderr: redactSecrets(spawnErr.message || 'Failed to spawn process'),
        durationMs: Date.now() - startTime,
        passed: false,
      });
    }

    timer = setTimeout(() => {
      timedOut = true;
      try {
        if (proc && !proc.killed) {
          if (isWin) {
            try {
              execSync(`taskkill /pid ${proc.pid} /T /F`);
            } catch {
              proc.kill('SIGKILL');
            }
          } else {
            proc.kill('SIGTERM');
            setTimeout(() => {
              if (proc && !proc.killed) proc.kill('SIGKILL');
            }, 1500);
          }
        }
      } catch {
        // ignore kill errors
      }
    }, timeoutMs);

    proc.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString('utf-8');
      if (stdoutAcc.length < maxBuffer) {
        stdoutAcc += chunk;
      }
      if (options.onOutputChunk) {
        options.onOutputChunk(redactSecrets(chunk));
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString('utf-8');
      if (stderrAcc.length < maxBuffer) {
        stderrAcc += chunk;
      }
      if (options.onOutputChunk) {
        options.onOutputChunk(redactSecrets(chunk));
      }
    });

    proc.on('close', (code: number | null) => {
      if (timer) clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      const exitCode = timedOut ? 124 : (code ?? 0);
      const passed = exitCode === 0;

      if (timedOut) {
        stderrAcc += `\n[SANDBOX TIMEOUT]: Execution exceeded bounded limit of ${timeoutMs}ms and was terminated.`;
      }

      resolve({
        exitCode,
        stdout: redactSecrets(stdoutAcc),
        stderr: redactSecrets(stderrAcc),
        durationMs,
        passed,
        timedOut,
      });
    });

    proc.on('error', (err: any) => {
      if (timer) clearTimeout(timer);
      resolve({
        exitCode: 1,
        stdout: redactSecrets(stdoutAcc),
        stderr: redactSecrets(err.message || 'Subprocess error'),
        durationMs: Date.now() - startTime,
        passed: false,
      });
    });
  });
}

/**
 * Clean up isolated workspace safely
 */
export async function cleanupWorkspace(workspaceDir: string): Promise<void> {
  try {
    const cleanWorkspace = path.resolve(workspaceDir);
    const root = path.resolve(ensureWorkspacesRoot());

    // Never delete outside WORKSPACES_ROOT
    if (cleanWorkspace.startsWith(root + path.sep)) {
      if (fs.existsSync(cleanWorkspace)) {
        fs.rmSync(cleanWorkspace, { recursive: true, force: true });
      }
    }
  } catch (err) {
    console.warn('Sandbox workspace cleanup warning:', err);
  }
}
