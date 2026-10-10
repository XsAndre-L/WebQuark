import { createHash, randomUUID } from 'node:crypto';
import { open, readFile, realpath, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Exclusive across processes and canonical checkout aliases. Never steals a stale lock. */
export async function acquireFileLock(repositoryRoot: string, name: string, namespace = 'webquark'): Promise<() => Promise<void>> {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error('Lock name must contain only lowercase letters, numbers and hyphens.');
  }
  if (!/^[a-z][a-z0-9-]*$/.test(namespace)) throw new Error('Lock namespace must contain lowercase letters, numbers and hyphens.');
  const canonicalRoot = await realpath(repositoryRoot);
  const identity = process.platform === 'win32' ? canonicalRoot.toLowerCase() : canonicalRoot;
  const key = createHash('sha256').update(identity).digest('hex').slice(0, 24);
  const path = join(tmpdir(), `${namespace}-${name}-${key}.lock`);
  const owner = JSON.stringify({ token: randomUUID(), pid: process.pid, started: new Date().toISOString() });
  const file = await open(path, 'wx').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'EEXIST') {
      throw new Error(`${name} is already locked. Retry after its owner finishes. If interrupted, confirm its process stopped before removing ${path}.`);
    }
    throw error;
  });
  try {
    await file.writeFile(owner);
  } catch (error) {
    await file.close();
    await unlink(path);
    throw error;
  }
  await file.close();

  return async () => {
    if (await readFile(path, 'utf8') !== owner) {
      throw new Error(`Lock ownership changed: ${path}.`);
    }
    await unlink(path);
  };
}

export function acquireReleaseContentLock(repositoryRoot: string, namespace = 'webquark'): Promise<() => Promise<void>> {
  return acquireFileLock(repositoryRoot, 'release-content', namespace);
}
