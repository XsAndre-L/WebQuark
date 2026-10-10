import { readFile } from 'node:fs/promises';
import { projectPath, validateChangelogConfig, type ChangelogConfig } from '../../config/index.js';
import { parseStableVersion } from '../stable-version.js';
import { readBunWorkspaceVersion } from './bun.js';
import { readCargoPackageVersion, readCargoLockPackageVersion } from './cargo.js';
import { errorMessage, readJsonObject, writePreservingLineEndings } from './files.js';
import { readSourceVersion } from './versions.js';
import type { VersionCheckResult } from './types.js';

export async function inspectVersionDrift(config: ChangelogConfig): Promise<VersionCheckResult> {
  await validateChangelogConfig(config);
  const errors: string[] = [];
  let sourceVersion: string | undefined;
  try { sourceVersion = (await readSourceVersion(config)).value; } catch (error) { errors.push(errorMessage(error)); }
  const inspect = async (label: string, read: () => Promise<string>) => {
    try {
      const version = parseStableVersion(await read(), `${label} version`).value;
      if (sourceVersion && version !== sourceVersion) errors.push(`${label}: expected ${sourceVersion}, found ${version}.`);
    } catch (error) { errors.push(`${label}: ${errorMessage(error)}`); }
  };
  for (const path of config.versioning?.jsonMirrors ?? []) await inspect(path, async () => String((await readJsonObject(projectPath(config, path))).version));
  const { bun, cargo, tauri } = config.versioning ?? {};
  if (cargo) {
    await inspect(cargo.manifest, async () => readCargoPackageVersion(await readFile(projectPath(config, cargo.manifest), 'utf8')));
    await inspect(`${cargo.lock} package ${cargo.packageName}`, async () => readCargoLockPackageVersion(await readFile(projectPath(config, cargo.lock), 'utf8'), cargo.packageName));
  }
  if (bun) {
    try {
      const lock = await readFile(projectPath(config, bun.lock), 'utf8');
      for (const workspace of bun.workspaces) await inspect(`${bun.lock} workspace ${workspace}`, async () => readBunWorkspaceVersion(lock, workspace));
    } catch (error) { errors.push(`${bun.lock}: ${errorMessage(error)}`); }
  }
  if (tauri) {
    try {
      const actual = (await readJsonObject(projectPath(config, tauri.config))).version;
      if (actual !== tauri.versionReference) errors.push(`${tauri.config}: expected version ${JSON.stringify(tauri.versionReference)}, found ${JSON.stringify(actual)}.`);
    } catch (error) { errors.push(`${tauri.config}: ${errorMessage(error)}`); }
  }
  return { sourceVersion, errors };
}

export async function updateJsonManifestVersion(path: string, version: string): Promise<void> {
  const original = await readFile(path, 'utf8');
  const manifest = JSON.parse(original) as Record<string, unknown>;
  manifest.version = version;
  await writePreservingLineEndings(path, `${JSON.stringify(manifest, null, 2)}\n`, original);
}
