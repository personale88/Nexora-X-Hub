import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { executeSandboxCommand, SandboxExecutionResult } from './sandbox';

export interface SandboxExecutionOptions {
  timeoutMs?: number;
  memoryLimitMb?: number;
  cpuLimit?: number;
  network?: boolean;
  onOutputChunk?: (chunk: string) => void;
}

export class DockerSandboxWorker {
  private isDockerAvailableCached: boolean | null = null;
  private workerUrl: string | undefined;
  private workerSecret: string | undefined;

  constructor() {
    this.workerUrl = process.env.SANDBOX_WORKER_URL;
    this.workerSecret = process.env.SANDBOX_WORKER_SECRET;
  }

  /**
   * Check if Docker is locally installed and running
   */
  public isDockerAvailable(): boolean {
    if (this.isDockerAvailableCached !== null) {
      return this.isDockerAvailableCached;
    }
    try {
      execSync('docker --version', { stdio: 'ignore', timeout: 2000 });
      execSync('docker info', { stdio: 'ignore', timeout: 3000 });
      this.isDockerAvailableCached = true;
    } catch {
      this.isDockerAvailableCached = false;
    }
    return this.isDockerAvailableCached;
  }

  /**
   * Execute test or command inside isolated Docker container or secured process sandbox
   */
  public async execute(
    workspaceDir: string,
    command: string,
    options: SandboxExecutionOptions = {}
  ): Promise<SandboxExecutionResult & { runner: 'docker' | 'remote_worker' | 'process_sandbox' }> {
    const timeoutMs = options.timeoutMs || 30000;
    const memoryLimit = options.memoryLimitMb || 512;
    const cpuLimit = options.cpuLimit || 1.0;

    // 1. Remote Sandbox Worker (for cloud/Vercel serverless production)
    if (this.workerUrl) {
      try {
        const res = await fetch(`${this.workerUrl}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.workerSecret ? { Authorization: `Bearer ${this.workerSecret}` } : {}),
          },
          body: JSON.stringify({
            command,
            timeoutMs,
            memoryLimitMb: memoryLimit,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            ...data,
            runner: 'remote_worker',
          };
        }
      } catch (workerErr) {
        console.warn('Remote sandbox worker failed, falling back to local isolation:', workerErr);
      }
    }

    // 2. Docker Container Isolation (if Docker is running locally)
    if (this.isDockerAvailable()) {
      try {
        const start = Date.now();
        const dockerArgs = [
          'run',
          '--rm',
          '--network',
          options.network ? 'bridge' : 'none',
          '--memory',
          `${memoryLimit}m`,
          '--cpus',
          String(cpuLimit),
          '-v',
          `${path.resolve(workspaceDir)}:/app`,
          '-w',
          '/app',
          'node:20-alpine',
          'sh',
          '-c',
          command,
        ];

        let stdout = '';
        let stderr = '';

        const proc = spawn('docker', dockerArgs);
        proc.stdout.on('data', (d) => {
          const str = d.toString();
          stdout += str;
          if (options.onOutputChunk) options.onOutputChunk(str);
        });
        proc.stderr.on('data', (d) => {
          const str = d.toString();
          stderr += str;
          if (options.onOutputChunk) options.onOutputChunk(str);
        });

        const exitCode: number = await new Promise((resolve) => {
          const timer = setTimeout(() => {
            try {
              proc.kill('SIGKILL');
            } catch {}
            resolve(124); // Timeout
          }, timeoutMs);

          proc.on('close', (code) => {
            clearTimeout(timer);
            resolve(code ?? 0);
          });
        });

        return {
          exitCode,
          stdout,
          stderr,
          durationMs: Date.now() - start,
          passed: exitCode === 0,
          runner: 'docker',
        };
      } catch (dockerErr) {
        console.warn('Docker run error, falling back to secure process sandbox:', dockerErr);
      }
    }

    // 3. Secure Process Sandbox fallback (enforces allowlist, path traversal guards, timeouts)
    const procResult = await executeSandboxCommand(workspaceDir, command, {
      timeoutMs,
      onOutputChunk: options.onOutputChunk,
    });

    return {
      ...procResult,
      runner: 'process_sandbox',
    };
  }
}

export const dockerSandboxWorker = new DockerSandboxWorker();
