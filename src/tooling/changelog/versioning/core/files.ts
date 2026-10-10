import { lstat, readFile, writeFile } from 'node:fs/promises';

export async function readJsonObject(path: string): Promise<Record<string, unknown>> {
  const value = JSON.parse(await readFile(path, 'utf8')) as unknown;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path} must contain a JSON object.`);
  }
  return value as Record<string, unknown>;
}

export async function writePreservingLineEndings(
  path: string,
  content: string,
  original: string,
): Promise<void> {
  const usesCrLf = original.includes('\r\n');
  const normalized = content.replace(/\r\n/g, '\n');
  await writeFile(path, usesCrLf ? normalized.replace(/\n/g, '\r\n') : normalized, 'utf8');
}

export async function pathExists(path: string): Promise<boolean> {
  return lstat(path).then(
    () => true,
    () => false,
  );
}

export async function isFile(path: string): Promise<boolean> {
  return lstat(path).then(
    (value) => value.isFile(),
    () => false,
  );
}

export async function isDirectory(path: string): Promise<boolean> {
  return lstat(path).then(
    (value) => value.isDirectory(),
    () => false,
  );
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

