import { lstat, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import type { VisualMetadataAdapter } from '../adapters/metadata.js';

export interface VersioningConfig {
  jsonMirrors: readonly string[];
  bun?: { lock: string; workspaces: readonly string[]; refreshCommand?: readonly string[] };
  cargo?: { manifest: string; lock: string; packageName: string };
  tauri?: { config: string; versionReference: string };
}

/** All file paths are explicit descendants of the consumer root. */
export interface ChangelogConfig {
  root: string;
  sourceManifest: string;
  changelog: string;
  releasesDirectory: string;
  unreleasedDirectory: string;
  feedOutputDirectory?: string;
  feedPublicPrefix?: string;
  captureStagingDirectory?: string;
  metadata?: VisualMetadataAdapter;
  /** Require contextual metadata for every active Unreleased visual. Historical archives retain their own contract. */
  requireVisualMetadata?: boolean;
  versioning?: VersioningConfig;
  lockNamespace?: string;
  unreleasedReadme?: string;
}

export interface NotesConfig extends ChangelogConfig {
  feedOutputDirectory: string;
  feedPublicPrefix: string;
}
export interface CaptureContentConfig extends NotesConfig { captureStagingDirectory: string; metadata: VisualMetadataAdapter }

export function requireMetadata(config: ChangelogConfig): asserts config is ChangelogConfig & { metadata: VisualMetadataAdapter } {
  if (!config.metadata?.applications.length || !config.metadata.id || !config.metadata.revision) throw new Error('Visual content requires a reviewed metadata adapter.');
}
export function requireNotesConfig(config: ChangelogConfig): asserts config is NotesConfig {
  if (!config.feedOutputDirectory || !config.feedPublicPrefix) throw new Error('Feed generation requires explicit output directory and public prefix.');
}
export function requireCaptureContentConfig(config: ChangelogConfig): asserts config is CaptureContentConfig {
  requireNotesConfig(config);
  requireMetadata(config);
  if (!config.captureStagingDirectory) throw new Error('Capture presentation requires an explicit staging directory.');
}

export function projectPath(config: Pick<ChangelogConfig, 'root'>, path: string): string {
  if (typeof path !== 'string' || !path || isAbsolute(path) || /[\u0000:?#]/.test(path)
    || path.replaceAll('\\', '/').split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Configured path must be a relative project descendant: ${path}.`);
  }
  const root = resolve(config.root), target = resolve(root, path);
  const within = relative(root, target);
  if (!within || within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within)) {
    throw new Error(`Configured path escapes the project root: ${path}.`);
  }
  return target;
}

export function releaseDirectory(config: ChangelogConfig, version: string): string {
  return projectPath(config, `${config.releasesDirectory}/v${version}`);
}

/** Reject path aliases before any shared operation can read or replace content. */
export async function validateChangelogConfig(config: ChangelogConfig): Promise<void> {
  if (!config.root || !isAbsolute(config.root)) throw new Error('Changelog config requires an absolute consumer root.');
  if (config.metadata) requireMetadata(config);
  if (config.requireVisualMetadata !== undefined && typeof config.requireVisualMetadata !== 'boolean') throw new Error('requireVisualMetadata must be boolean.');
  if (config.feedPublicPrefix !== undefined && (!config.feedPublicPrefix || /[\\\u0000:?#]/.test(config.feedPublicPrefix)
    || config.feedPublicPrefix.split('/').some(part => !part || part === '.' || part === '..'))) throw new Error('Feed public prefix must be a relative URL path.');
  const fields = [config.sourceManifest, config.changelog, config.releasesDirectory, config.unreleasedDirectory,
    ...(config.feedOutputDirectory ? [config.feedOutputDirectory] : []), ...(config.captureStagingDirectory ? [config.captureStagingDirectory] : []), ...(config.versioning?.jsonMirrors ?? [])];
  if (config.versioning?.bun) fields.push(config.versioning.bun.lock);
  if (config.versioning?.cargo) fields.push(config.versioning.cargo.manifest, config.versioning.cargo.lock);
  if (config.versioning?.tauri) {
    fields.push(config.versioning.tauri.config);
    if (resolve(dirname(projectPath(config, config.versioning.tauri.config)), config.versioning.tauri.versionReference) !== projectPath(config, config.sourceManifest)) throw new Error('Tauri version reference must resolve to the configured source manifest.');
  }
  const root = await realpath(config.root);
  for (const field of fields) {
    let ancestor = projectPath(config, field);
    while (!(await lstat(ancestor).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    }))) ancestor = dirname(ancestor);
    const canonical = await realpath(ancestor);
    const expected = resolve(root, relative(config.root, ancestor));
    if (pathKey(canonical) !== pathKey(expected)) throw new Error(`Configured path aliases another location: ${field}.`);
  }
  const outputFields = [config.feedOutputDirectory, config.captureStagingDirectory].filter((field): field is string => Boolean(field));
  const protectedFields = [config.sourceManifest, config.changelog, config.releasesDirectory, config.unreleasedDirectory,
    ...(config.versioning?.jsonMirrors ?? []), ...(config.versioning?.bun ? [config.versioning.bun.lock] : []),
    ...(config.versioning?.cargo ? [config.versioning.cargo.manifest, config.versioning.cargo.lock] : []),
    ...(config.versioning?.tauri ? [config.versioning.tauri.config] : []), '.git', '.agents', '.codex', '.aws', 'node_modules'];
  for (const outputField of outputFields) {
    const output = projectPath(config, outputField);
    for (const field of [...protectedFields, ...outputFields.filter(field => field !== outputField)]) {
      const protectedPath = projectPath(config, field);
      if (contains(output, protectedPath) || contains(protectedPath, output)) throw new Error(`Configured output ${outputField} overlaps protected content: ${field}.`);
    }
  }
  if (config.feedOutputDirectory && config.feedOutputDirectory === config.captureStagingDirectory) throw new Error('Feed output and capture staging must be disjoint.');
  if (config.versioning?.cargo && !config.versioning.cargo.packageName.trim()) throw new Error('Cargo package identity is required.');
}

function contains(root: string, path: string): boolean {
  const within = relative(root, path);
  return !within || (!isAbsolute(within) && within !== '..' && !within.startsWith(`..${sep}`));
}
function pathKey(path: string): string { return process.platform === 'win32' ? path.toLowerCase() : path; }
