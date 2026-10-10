import { compareStableVersions, parseStableVersion } from '../versioning/stable-version.js';
import { categoryNames, type ChangeCategory, type ReleaseEntry } from './types.js';

/** Unreleased content is included only for an explicitly requested development preview. */
export function parseReleaseSummaries(
  changelog: string,
  builtVersion: string,
  includeUnreleased = false,
): ReleaseEntry[] {
  const built = parseStableVersion(builtVersion, 'Built application version');
  const releases: ReleaseEntry[] = [];
  const seenVersions = new Set<string>();
  let release: ReleaseEntry | undefined;
  let category: ChangeCategory | undefined;
  let summary: { summaries: string[]; index: number } | undefined;
  let fenced = false;
  for (const line of changelog.replace(/\r\n/g, '\n').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      summary = undefined;
      continue;
    }
    if (fenced) {
      continue;
    }
    if (/^##\s+/.test(line)) {
      release = undefined;
      category = undefined;
      summary = undefined;
      if (includeUnreleased && /^##\s+\[?Unreleased\]?\s*$/i.test(line)) {
        if (releases.some((entry) => entry.unreleased)) {
          throw new Error('CHANGELOG.md: duplicate Unreleased section.');
        }
        release = { version: 'unreleased', date: null, unreleased: true, categories: [], visuals: [] };
        releases.push(release);
        continue;
      }
      const heading = /^##\s+\[?v?(\d+\.\d+\.\d+)\]?\s+-\s+(\d{4}-\d{2}-\d{2})\s*$/.exec(line);
      if (!heading) {
        continue;
      }
      const version = heading[1]!;
      const date = heading[2]!;
      const released = parseStableVersion(version, `CHANGELOG.md release v${version}`);
      if (compareStableVersions(released, built) > 0) {
        continue;
      }
      if (seenVersions.has(version)) {
        throw new Error(`CHANGELOG.md: duplicate release v${version}.`);
      }
      if (!Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
        throw new Error(`CHANGELOG.md: v${version} needs a valid YYYY-MM-DD release date.`);
      }
      seenVersions.add(version);
      release = { version, date, categories: [], visuals: [] };
      releases.push(release);
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) {
      category = categoryNames.find((name) => line.trim() === `### ${name}`);
      summary = undefined;
      continue;
    }
    if (!release || !category) {
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      let changes = release.categories.find((changes) => changes.name === category);
      if (!changes) {
        changes = { name: category, summaries: [] };
        release.categories.push(changes);
      }
      changes.summaries.push(bullet[1]!.trim());
      summary = { summaries: changes.summaries, index: changes.summaries.length - 1 };
    } else if (summary && /^\s+\S/.test(line)) {
      summary.summaries[summary.index] += ` ${line.trim()}`;
    } else if (line.trim()) {
      summary = undefined;
    }
  }
  return releases
    .sort((a, b) => {
      if (a.unreleased || b.unreleased) {
        return a.unreleased ? -1 : 1;
      }
      return compareStableVersions(parseStableVersion(b.version), parseStableVersion(a.version));
    })
    .map((entry) => ({
      ...entry,
      categories: categoryNames.flatMap((name) => (
        entry.categories.filter((category) => category.name === name)
      )),
    }));
}

