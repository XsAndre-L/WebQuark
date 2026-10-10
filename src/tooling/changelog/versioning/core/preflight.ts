import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { projectPath, releaseDirectory, validateChangelogConfig, type ChangelogConfig } from '../../config/index.js';
import { parseStableVersion } from '../stable-version.js';
import { readBunWorkspaceVersion } from './bun.js';
import { readCargoPackageVersion, readCargoLockPackageVersion } from './cargo.js';
import { archiveChangelog } from './changelog.js';
import { errorMessage, isDirectory, isFile, pathExists, readJsonObject } from './files.js';

export async function preflightRelease(config: ChangelogConfig, version: string): Promise<void> {
  await validateChangelogConfig(config);
  const errors: string[] = [];
  const check = async (label: string, inspect: () => Promise<unknown>) => { try { await inspect(); } catch (error) { errors.push(`${label}: ${errorMessage(error)}`); } };
  for (const path of config.versioning?.jsonMirrors ?? []) await check(path, async () => parseStableVersion((await readJsonObject(projectPath(config, path))).version, `${path} version`));
  const { bun, cargo, tauri } = config.versioning ?? {};
  if (cargo) {
    await check(cargo.manifest, async () => readCargoPackageVersion(await readFile(projectPath(config, cargo.manifest), 'utf8')));
    await check(cargo.lock, async () => readCargoLockPackageVersion(await readFile(projectPath(config, cargo.lock), 'utf8'), cargo.packageName));
  }
  if (bun) await check(bun.lock, async () => {
    const lock = await readFile(projectPath(config, bun.lock), 'utf8');
    for (const workspace of bun.workspaces) readBunWorkspaceVersion(lock, workspace);
  });
  if (tauri) await check(tauri.config, async () => {
    if ((await readJsonObject(projectPath(config, tauri.config))).version !== tauri.versionReference) throw new Error(`version must be ${JSON.stringify(tauri.versionReference)} before release.`);
  });
  await check(config.changelog, async () => archiveChangelog(await readFile(projectPath(config, config.changelog), 'utf8'), version, '2000-01-01'));
  const unreleased = projectPath(config, config.unreleasedDirectory);
  if (!(await isFile(resolve(unreleased, 'README.md')))) errors.push(`${config.unreleasedDirectory}/README.md must exist.`);
  if (!(await isDirectory(resolve(unreleased, 'images')))) errors.push(`${config.unreleasedDirectory}/images must exist.`);
  if (await pathExists(releaseDirectory(config, version))) errors.push(`${config.releasesDirectory}/v${version} already exists.`);
  if (errors.length) throw new Error(`Release preflight failed:\n- ${errors.join('\n- ')}`);
}
