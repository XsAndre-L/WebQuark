import { projectPath, type ChangelogConfig } from '../../config/index.js';
import { compareStableVersions, parseStableVersion, STABLE_VERSION_PATTERN, type StableVersion } from '../stable-version.js';
import { defaultCommandRunner } from './commands.js';
import { readJsonObject } from './files.js';
import type { CommandRunner } from './types.js';

export function latestStableTag(tagOutput: string): StableVersion | undefined {
  let latest: StableVersion | undefined;
  for (const rawTag of tagOutput.split(/\r?\n/)) {
    const tag = rawTag.trim(), candidate = tag.startsWith('v') ? tag.slice(1) : tag;
    if (!STABLE_VERSION_PATTERN.test(candidate)) continue;
    const version = parseStableVersion(candidate, `Git tag ${tag}`);
    if (!latest || compareStableVersions(version, latest) > 0) latest = version;
  }
  return latest;
}

export async function readSourceVersion(config: ChangelogConfig): Promise<StableVersion> {
  return parseStableVersion((await readJsonObject(projectPath(config, config.sourceManifest))).version, `${config.sourceManifest} version`);
}

export async function findLatestReleasedVersion(config: ChangelogConfig, runner: CommandRunner = defaultCommandRunner): Promise<StableVersion | undefined> {
  const result = await runner(['git', 'tag', '--list'], config.root);
  return result.exitCode === 0 ? latestStableTag(result.stdout) : undefined;
}
