import { readFile } from 'node:fs/promises';
import { projectPath, validateChangelogConfig, type ChangelogConfig } from '../../config/index.js';
import { compareStableVersions } from '../stable-version.js';
import { acquireReleaseContentLock } from '../../shared/release-content-lock.js';
import { updateBunWorkspaceVersion } from './bun.js';
import { updateCargoPackageVersion, updateCargoLockPackageVersion } from './cargo.js';
import { archiveReleaseNotes, localIsoDate } from './changelog.js';
import { defaultCommandRunner, runCheckedCommand } from './commands.js';
import { errorMessage, writePreservingLineEndings } from './files.js';
import { inspectVersionDrift, updateJsonManifestVersion } from './manifests.js';
import { preflightRelease } from './preflight.js';
import { createSnapshot, restoreSnapshot, removeSnapshot } from './snapshot.js';
import { readSourceVersion, findLatestReleasedVersion } from './versions.js';
import type { ReleaseOptions, ReleaseResult } from './types.js';

export async function releaseRepository(config: ChangelogConfig, options: ReleaseOptions = {}): Promise<ReleaseResult> {
  await validateChangelogConfig(config);
  const unlock = await acquireReleaseContentLock(config.root, config.lockNamespace);
  try { return await releaseLocked(config, options); } finally { await unlock(); }
}

async function releaseLocked(config: ChangelogConfig, options: ReleaseOptions): Promise<ReleaseResult> {
  const runner = options.commandRunner ?? defaultCommandRunner;
  const source = await readSourceVersion(config), latest = await findLatestReleasedVersion(config, runner);
  if (latest && compareStableVersions(source, latest) <= 0) throw new Error(`Root version ${source.value} must be greater than latest released version ${latest.value}.`);
  await preflightRelease(config, source.value);
  const { jsonMirrors = [], bun, cargo } = config.versioning ?? {};
  const target = `${config.releasesDirectory}/v${source.value}`;
  const mutatedPaths = [...jsonMirrors, ...(cargo ? [cargo.manifest, cargo.lock] : []), ...(bun ? [bun.lock] : []), config.changelog, config.unreleasedDirectory, target];
  const snapshot = await createSnapshot(config.root, mutatedPaths);
  let phase = 'synchronizing version mirrors';
  try {
    for (const path of jsonMirrors) await updateJsonManifestVersion(projectPath(config, path), source.value);
    if (cargo) {
      const path = projectPath(config, cargo.manifest), original = await readFile(path, 'utf8');
      await writePreservingLineEndings(path, updateCargoPackageVersion(original, source.value), original);
    }
    if (bun) {
      phase = 'refreshing Bun lock';
      const path = projectPath(config, bun.lock), original = await readFile(path, 'utf8');
      await writePreservingLineEndings(path, bun.workspaces.reduce((lock, workspace) => updateBunWorkspaceVersion(lock, workspace, source.value), original), original);
      if (bun.refreshCommand) await runCheckedCommand(bun.refreshCommand, config.root, runner);
    }
    if (cargo) {
      phase = 'refreshing Cargo.lock';
      const path = projectPath(config, cargo.lock), original = await readFile(path, 'utf8');
      await writePreservingLineEndings(path, updateCargoLockPackageVersion(original, cargo.packageName, source.value), original);
      await runCheckedCommand(['cargo', 'metadata', '--manifest-path', cargo.manifest, '--format-version', '1', '--no-deps'], config.root, runner);
    }
    phase = 'archiving changelog';
    await archiveReleaseNotes(config, source.value, options.date ?? localIsoDate());
    phase = 'checking synchronized versions';
    const check = await inspectVersionDrift(config);
    if (check.errors.length) throw new Error(check.errors.join('\n'));
    return { version: source.value, releasedVersion: latest?.value, changedPaths: mutatedPaths };
  } catch (error) {
    await restoreSnapshot(snapshot);
    throw new Error(`Release failed while ${phase}: ${errorMessage(error)}`);
  } finally { await removeSnapshot(snapshot); }
}
