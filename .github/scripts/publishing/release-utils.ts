import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type PackageManifest = Record<string, any> & {
  name: string;
  version: string;
};

export const repositoryRoot = resolve(import.meta.dir, '../../..');
export const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export const packages = [
  { key: 'browser', role: 'browser', name: '@webquark/browser', directory: resolve(repositoryRoot, 'packages/browser/components'), dependencies: [] },
  { key: 'tooling', role: 'tooling', name: '@webquark/tooling', directory: resolve(repositoryRoot, 'packages/tooling'), dependencies: [] },
  { key: 'core', role: 'umbrella', name: '@webquark/core', directory: resolve(repositoryRoot, 'packages/core'), dependencies: ['@webquark/browser', '@webquark/tooling'] },
  { key: 'react', role: 'wrapper', name: '@webquark/react', directory: resolve(repositoryRoot, 'packages/browser/react'), dependencies: ['@webquark/browser'] },
  { key: 'angular', role: 'wrapper', name: '@webquark/angular', directory: resolve(repositoryRoot, 'packages/browser/angular'), dependencies: ['@webquark/browser'] },
] as const;
export type PackageDefinition = typeof packages[number];

/** Align only the declared package graph; framework peers retain their ranges. */
export function prepareManifest(definition: PackageDefinition, manifest: PackageManifest, version: string): PackageManifest {
  if (manifest.name !== definition.name || manifest.private) throw new Error('Invalid publishable package: ' + definition.name);
  const prepared = { ...manifest, version };
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
    if (prepared[field]) prepared[field] = { ...prepared[field] };
    for (const name of Object.keys(prepared[field] ?? {})) {
      if (packages.some(candidate => candidate.name === name)) prepared[field][name] = version;
    }
  }
  if (definition.dependencies.length) {
    prepared.dependencies ??= {};
    for (const name of definition.dependencies) prepared.dependencies[name] = version;
  }
  if (definition.role === 'wrapper') {
    prepared.peerDependencies ??= {};
    for (const name of definition.dependencies) prepared.peerDependencies[name] = version;
  }
  assertPackageContract(definition, prepared, version);
  return prepared;
}

export function assertPackageContract(definition: PackageDefinition, manifest: PackageManifest, version: string): void {
  if (manifest.name !== definition.name || manifest.private) throw new Error('Invalid publishable package: ' + definition.name);
  if (manifest.version !== version) throw new Error(manifest.name + ' must use lockstep version ' + version);
  for (const name of definition.dependencies) {
    if (manifest.dependencies?.[name] !== version || (definition.role === 'wrapper' && manifest.peerDependencies?.[name] !== version)) {
      throw new Error(manifest.name + ' must depend on ' + name + '@' + version + (definition.role === 'wrapper' ? ' and use that exact peer version' : ''));
    }
  }
  for (const field of ['dependencies', 'peerDependencies'] as const) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      if (!packages.some(candidate => candidate.name === name)) continue;
      if (!(definition.dependencies as readonly string[]).includes(name) || range !== version) {
        throw new Error('Invalid internal dependency: ' + manifest.name + ' ' + field + ' ' + name + '=' + range);
      }
    }
  }
}

export function assertLockstepPackages(manifests: PackageManifest[]): string {
  if (manifests.length !== packages.length) throw new Error('All five package manifests are required.');
  const version = manifests[0].version;
  for (const definition of packages) {
    const manifest = manifests.find(candidate => candidate.name === definition.name);
    if (!manifest) throw new Error('Missing package manifest: ' + definition.name);
    assertPackageContract(definition, manifest, version);
  }
  return version;
}

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
