import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { projectPaths } from './consumer-paths';
import { workspaceRoot } from './workspace-boundary';
import { json } from '../../infrastructure/filesystem/atomic-json';

export interface SwitchConfig {
  version: 1;
  source: string;
  preferredVersion?: string;
}

export interface WebQuarkConfig {
  'wq-switch'?: SwitchConfig;
  [key: string]: unknown;
}

export interface ResolvedSwitchConfig {
  root: string;
  file: string;
  config: SwitchConfig;
}

/** Reads the raw .webquark/.webquark.json configuration document from a consumer root. */
export function readWebQuarkConfig(root: string): WebQuarkConfig {
  const file = projectPaths(root).config;
  if (!existsSync(file)) return {};
  const value = json<unknown>(file);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${file}; expected a JSON object.`);
  }
  return value as WebQuarkConfig;
}

export function switchConfig(document: WebQuarkConfig, file: string): SwitchConfig | undefined {
  const value = document['wq-switch'];
  if (value === undefined) return undefined;
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    value.version !== 1 ||
    typeof value.source !== 'string' ||
    (value.preferredVersion !== undefined && typeof value.preferredVersion !== 'string')
  ) {
    throw new Error(`Invalid WebQuark wq-switch configuration in ${file}; existing configuration was not overwritten.`);
  }
  return value;
}

/** Resolves switch configuration, checking locally first and then inheriting up to the monorepo boundary. */
export function resolveSwitchConfig(root: string): ResolvedSwitchConfig | undefined {
  const localFile = projectPaths(root).config;
  const local = switchConfig(readWebQuarkConfig(root), localFile);
  if (local) return { root, file: localFile, config: local };

  const boundary = workspaceRoot(root);
  if (boundary === root) return undefined;

  for (let directory = dirname(root); ; directory = dirname(directory)) {
    const file = projectPaths(directory).config;
    const config = switchConfig(readWebQuarkConfig(directory), file);
    if (config) return { root: directory, file, config };
    if (directory === boundary) return undefined;
  }
}

/** Reads active or inherited SwitchConfig for a consumer root. */
export function readSwitchConfig(root: string): SwitchConfig | undefined {
  return resolveSwitchConfig(root)?.config;
}
