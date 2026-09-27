import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const names = ['@webquark/core', '@webquark/angular', '@webquark/react'] as const;
export type PackageName = typeof names[number];
export interface SwitchConfig { version: 1; source: string; preferredVersion?: string; }
export interface WebQuarkConfig { 'wq-switch'?: SwitchConfig; [key: string]: unknown; }
export const configName = '.webquark.json';
export const legacyConfigName = '.wq-switch.json';

export function readWebQuarkConfig(root: string): WebQuarkConfig {
  const file = join(root, configName);
  if (!existsSync(file)) return {};
  const value = json<unknown>(file);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${configName}; expected a JSON object.`);
  return value as WebQuarkConfig;
}

export function readSwitchConfig(root: string): SwitchConfig | undefined {
  const document = readWebQuarkConfig(root);
  const legacy = join(root, legacyConfigName);
  const value = Object.hasOwn(document, 'wq-switch') ? document['wq-switch'] : existsSync(legacy) ? json<SwitchConfig>(legacy) : undefined;
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1 || typeof value.source !== 'string' ||
      (value.preferredVersion !== undefined && typeof value.preferredVersion !== 'string')) {
    throw new Error(`Invalid WebQuark wq-switch configuration; existing configuration was not overwritten.`);
  }
  return value;
}
export type Manifest = { name: string; version: string; main?: string; module?: string; types?: string; files?: string[]; bin?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; peerDependencies?: Record<string, string>; peerDependenciesMeta?: Record<string, { optional?: boolean }>; scripts?: Record<string, string> };
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
  if (manifest(root).name === '@webquark/core') throw new Error('Run wq-switch in the consuming app, not the WebQuark repository.');
  return realpathSync(root);
}
export function validateSource(source: string): string {
  const root = realpathSync(resolve(source));
  if (manifest(root).name !== '@webquark/core' || !manifest(root).scripts?.['packages:build'] ||
      manifest(join(root, 'packages/angular')).name !== '@webquark/angular' ||
      manifest(join(root, 'packages/react')).name !== '@webquark/react') {
    throw new Error('Source must be the WebQuark repository root, with packages:build and both wrappers.');
  }
  return root;
}
export function sourceFor(root: string): string {
  const config = readSwitchConfig(root);
  if (!config) throw new Error('First run: wq-setup');
  if (!config.source.trim()) throw new Error('Set source inside "wq-switch" in .webquark.json to your WebQuark repository, or run wq-setup --source "path/to/WebQuark".');
  return validateSource(resolve(root, config.source));
}
export function selectedPackages(root: string): PackageName[] {
  const pkg = manifest(root);
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  if (!dependencies['@webquark/core']) throw new Error('The consuming project must declare @webquark/core.');
  return names.filter(name => dependencies[name]);
}
