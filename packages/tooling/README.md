# WebQuark tooling

`@webquark/tooling/changelog` provides configured release-note feeds and application versioning. Capture mechanics use project-owned environment, authentication, route and seed adapters. The application owns its viewer and detailed notes.

The tooling package installs independently of browser components and framework integrations. It emits `src/tooling/changelog` into package-owned `dist/changelog`; it uses Bun and releases in lockstep with the other four WebQuark packages. `wq-changelog` is also forwarded by the umbrella package.

The umbrella import is `@webquark/core/tooling/changelog`; browser imports use
`@webquark/browser` or `@webquark/core/browser`. See the
[adoption guide and alternate versioning reference](../../docs/tooling/README.md)
and the playground's static Changelog Tooling entry for fictional notes/feed data.

## Configuration

Imports never infer a consumer root from the installed package. Define a reviewed project module with explicit root-relative paths:

```ts
import { fileURLToPath } from 'node:url';
import type { ChangelogConfig } from '@webquark/tooling/changelog';

export const changelogConfig: ChangelogConfig = {
  root: fileURLToPath(new URL('.', import.meta.url)),
  sourceManifest: 'package.json',
  changelog: 'CHANGELOG.md',
  releasesDirectory: 'docs/changelog',
  unreleasedDirectory: 'docs/changelog/unreleased',
  versioning: {
    jsonMirrors: ['client/package.json', 'server/package.json'],
    bun: {
      lock: 'bun.lock',
      workspaces: ['client', 'server'],
      refreshCommand: ['bun', 'install', '--lockfile-only'],
    },
  },
};
```

Version-only consumers need no visual resolver, feed directory or capture setup. JSON mirrors are explicit; no recursive package discovery takes place. Bun lock synchronization is optional and its external refresh command runs only when configured. Cargo synchronization optionally supplies `{ manifest, lock, packageName }`; Tauri validation optionally supplies `{ config, versionReference }`. A Tauri reference must resolve to the source manifest.

For feeds, add `feedOutputDirectory`, `feedPublicPrefix`, and a `metadata` adapter with reviewed `id`, `revision`, `applications`, and `resolve(root, visual, context)`. The resolver supplies literal page labels, navigation, access and guidance provenance. A visual-bearing release needs that resolver to snapshot its historical labels. Paths reject traversal and aliases, and feed output cannot overlap release content or capture staging. Capture presentation additionally requires `captureStagingDirectory`.

## API and CLI

```ts
import { checkVersions, versionStatus, generateWhatsNew, prepareRelease } from '@webquark/tooling/changelog';

await checkVersions(changelogConfig); // read-only drift report
await versionStatus(changelogConfig); // read-only source/local-tag status
// notesConfig also declares feed output/public prefix and a metadata adapter:
await generateWhatsNew(notesConfig, { includeUnreleased: true, environmentType: 'dev' });
// Only when the release owner explicitly requests release preparation:
await prepareRelease(changelogConfig);
```

The CLI loads only the explicitly named reviewed project module. Content JSON cannot register scripts or actions.

```sh
wq-changelog version check --config ./changelog.config.ts
wq-changelog version status --config ./changelog.config.ts
wq-changelog notes --config ./changelog.config.ts --include-unreleased
wq-changelog release --config ./changelog.config.ts
```

Capture config modules additionally export a reviewed `captureAdapter` or an
async `loadCaptureAdapter()` provider. The API takes that adapter explicitly:
`stageCaptures(config, adapter, { selected })` and
`publishReviewedRun(config, adapter, runId)`. Application-owned prerequisites
and required evidence remain in the adapter.

Production and production rehearsal exclude Unreleased even when a preview flag is supplied. Feeds preserve `{ releases }`, canonical crops, summary anchors, content-hashed image/feed URLs and `feed-url.ts`. Preparation archives Unreleased, synchronizes configured mirrors and restores declared mutations on failure. It does not commit, tag, publish, package or deploy.

The initial supported runtime is Bun 1.4.2 or later. Capture dependencies load when capture is selected; browser binaries require explicit consumer setup. During the unpublished migration, validate with temporary packed artifacts and local switch snapshots. Clean CI installation waits for the separately authorized npm publication of the five packages; no migration archives are tracked.
