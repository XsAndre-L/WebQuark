import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type PackageManifest = Record<string, any> & {
  name: string;
  version: string;
};

export const repositoryRoot = resolve(import.meta.dir, '../../..');
export const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export const packages = [
  { key: 'core', name: '@webquark/core', directory: repositoryRoot },
  { key: 'react', name: '@webquark/react', directory: resolve(repositoryRoot, 'packages/react') },
  { key: 'angular', name: '@webquark/angular', directory: resolve(repositoryRoot, 'packages/angular') },
] as const;

export function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

export function writeJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

export function packageJsonPath(directory: string): string {
  return resolve(directory, 'package.json');
}

export function readPackage(directory: string): PackageManifest {
  return readJson<PackageManifest>(packageJsonPath(directory));
}

export function run(command: string[], cwd = repositoryRoot): void {
  console.log('\n> ' + command.join(' '));
  const result = Bun.spawnSync({
    cmd: command,
    cwd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
    env: process.env,
  });

  if (result.exitCode !== 0) {
    throw new Error('Command failed with exit code ' + result.exitCode + ': ' + command.join(' '));
  }
}

export function capture(command: string[], cwd = repositoryRoot) {
  const result = Bun.spawnSync({
    cmd: command,
    cwd,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
    env: process.env,
  });

  const decoder = new TextDecoder();
  return {
    exitCode: result.exitCode,
    stdout: decoder.decode(result.stdout).trim(),
    stderr: decoder.decode(result.stderr).trim(),
  };
}

export function requireArgument(name: string): string {
  const index = Bun.argv.indexOf(name);
  const value = index >= 0 ? Bun.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) {
    throw new Error('Missing required argument: ' + name);
  }
  return value;
}

export function hasFlag(name: string): boolean {
  return Bun.argv.includes(name);
}

export function assertStableVersion(version: string): void {
  const stableSemVer = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  if (!stableSemVer.test(version)) {
    throw new Error(version + ' is not a stable semantic version such as 1.1.0');
  }
}

export function assertFile(filePath: string, description: string): void {
  if (!existsSync(filePath)) {
    throw new Error(description + ' does not exist: ' + filePath);
  }
}
