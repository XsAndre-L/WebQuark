import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

/** Coordinates mutual exclusion across processes using atomic lockfiles in OS temp directory. */
export async function locked<T>(key: string, action: () => Promise<T>): Promise<T> {
  const file = join(tmpdir(), `wq-switch-${createHash('sha256').update(key.toLowerCase()).digest('hex')}.lock`);
  const content = JSON.stringify({ pid: process.pid, id: randomUUID() });

  try {
    writeFileSync(file, content, { flag: 'wx' });
  } catch (error: any) {
    if (error.code !== 'EEXIST') throw error;
    const previous = readFileSync(file, 'utf8');
    const { pid } = JSON.parse(previous);
    let alive = true;
    try {
      process.kill(pid, 0);
    } catch (e: any) {
      if (e.code === 'ESRCH') alive = false;
    }
    if (alive) throw new Error(`Another switch/build is running (PID ${pid}).`);
    if (readFileSync(file, 'utf8') !== previous) throw new Error('Lock changed; retry.');
    unlinkSync(file);
    writeFileSync(file, content, { flag: 'wx' });
  }

  try {
    return await action();
  } finally {
    if (existsSync(file) && readFileSync(file, 'utf8') === content) {
      unlinkSync(file);
    }
  }
}
