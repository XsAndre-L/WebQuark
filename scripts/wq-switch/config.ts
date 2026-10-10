import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { projectPaths } from './paths';

export const names = ['@webquark/core', '@webquark/browser', '@webquark/tooling', '@webquark/angular', '@webquark/react'] as const;
export type PackageName = typeof names[number];
export const packageDirectories: Record<PackageName, string> = {
  '@webquark/core': 'packages/core',
  '@webquark/browser': 'packages/browser/components',
  '@webquark/tooling': 'packages/tooling',
  '@webquark/angular': 'packages/browser/angular',
  '@webquark/react': 'packages/browser/react',
};
export const localDependencies: Record<PackageName, readonly PackageName[]> = {
  '@webquark/core': ['@webquark/browser', '@webquark/tooling'],
  '@webquark/browser': [],
  '@webquark/tooling': [],
  '@webquark/angular': ['@webquark/browser'],
  '@webquark/react': ['@webquark/browser'],
};
export interface SwitchConfig { version: 1; source: string; preferredVersion?: string; }
export interface WebQuarkConfig { 'wq-switch'?: SwitchConfig; [key: string]: unknown; }
export function readWebQuarkConfig(root: string): WebQuarkConfig {
  const file = projectPaths(root).config;
  if (!existsSync(file)) return {};
  const value = json<unknown>(file);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${file}; expected a JSON object.`);
  return value as WebQuarkConfig;
}

export function readSwitchConfig(root: string): SwitchConfig | undefined {
  const document = readWebQuarkConfig(root);
  const value = document['wq-switch'];
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1 || typeof value.source !== 'string' ||
      (value.preferredVersion !== undefined && typeof value.preferredVersion !== 'string')) {
    throw new Error(`Invalid WebQuark wq-switch configuration; existing configuration was not overwritten.`);
  }
  return value;
}
export type Manifest = { name: string; version: string; private?: boolean; main?: string; module?: string; types?: string; exports?: Record<string, unknown>; files?: string[]; bin?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; peerDependencies?: Record<string, string>; peerDependenciesMeta?: Record<string, { optional?: boolean }>; scripts?: Record<string, string> };
export function json<T>(file: string): T { return JSON.parse(readFileSync(file, 'utf8')) as T; }
export function manifest(root: string): Manifest { return json(join(root, 'package.json')); }
export function writeJson(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
  renameSync(temporary, file);
}
export function consumerRoot(cwd = process.cwd()): string {
  let root = resolve(cwd);
  while (!existsSync(join(root, 'package.json'))) {
    const parent = dirname(root);
    if (parent === root) throw new Error('Run this command inside the consuming project.');
    root = parent;
  }
  const pkg = manifest(root);
  if (names.includes(pkg.name as PackageName) || (pkg.private && pkg.scripts?.['packages:build'])) throw new Error('Run wq-switch in the consuming app, not the WebQuark repository.');
  return realpathSync(root);
}
export function validateSource(source: string): string {
  const root = realpathSync(resolve(source));
  const pkg = manifest(root);
  if (!pkg.private || !pkg.scripts?.['packages:build'] ||
      !names.every(name => existsSync(join(root, packageDirectories[name], 'package.json')) &&
        manifest(join(root, packageDirectories[name])).name === name)) {
    throw new Error('Source must be the private WebQuark repository root, with packages:build and all five package manifests.');
  }
  return root;
}
export function sourceFor(root: string): string {
  const config = readSwitchConfig(root);
  if (!config) throw new Error('First run: wq-setup');
  if (!config.source.trim()) throw new Error('Set source inside "wq-switch" in .webquark/.webquark.json to your WebQuark repository, or run wq-setup --source "path/to/WebQuark".');
  return validateSource(resolve(root, config.source));
}
export function selectedPackages(root: string): PackageName[] {
  const pkg = manifest(root);
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  const selected = new Set<PackageName>(names.filter(name => dependencies[name]));
  if (!selected.size) throw new Error('The consuming project must declare a WebQuark package.');
  for (const name of selected) for (const dependency of localDependencies[name]) selected.add(dependency);
  return names.filter(name => selected.has(name));
}
