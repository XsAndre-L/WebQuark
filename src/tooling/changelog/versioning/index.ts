import { validateChangelogConfig, type ChangelogConfig } from '../config/index.js';
import { findLatestReleasedVersion, readSourceVersion } from './core/versions.js';
import type { CommandRunner } from './core/types.js';
export * from './stable-version.js';
export * from './core/types.js';
export * from './core/bun.js';
export * from './core/cargo.js';
export * from './core/changelog.js';
export * from './core/commands.js';
export * from './core/files.js';
export * from './core/manifests.js';
export * from './core/preflight.js';
export * from './core/release.js';
export * from './core/snapshot.js';
export * from './core/versions.js';
export { inspectVersionDrift as checkVersions } from './core/manifests.js';
export { releaseRepository as prepareRelease } from './core/release.js';

export async function versionStatus(config: ChangelogConfig, commandRunner?: CommandRunner): Promise<string> {
  await validateChangelogConfig(config);
  const source = await readSourceVersion(config), released = await findLatestReleasedVersion(config, commandRunner);
  return [`Source:    ${source.value}`, `Released:  ${released?.value ?? 'unknown'}`, 'Deployed:  unknown'].join('\n');
}
