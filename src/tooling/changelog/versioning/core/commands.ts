import { spawn } from 'node:child_process';
import type { CommandResult, CommandRunner } from './types.js';

export async function defaultCommandRunner(command: readonly string[], cwd: string): Promise<CommandResult> {
  const child = spawn(command[0], command.slice(1), { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const stdout: Buffer[] = [], stderr: Buffer[] = [];
  child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
  child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
  const exitCode = await new Promise<number>((resolvePromise, reject) => {
    child.once('error', reject);
    child.once('close', code => resolvePromise(code ?? 1));
  });
  return { exitCode, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') };
}

export async function runCheckedCommand(command: readonly string[], cwd: string, runner: CommandRunner): Promise<void> {
  const result = await runner(command, cwd);
  if (result.exitCode !== 0) throw new Error(`${command.join(' ')} exited ${result.exitCode}: ${result.stderr.trim() || result.stdout.trim() || 'no output'}`);
}
