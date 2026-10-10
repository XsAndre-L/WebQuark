# Changelog tooling adoption

Use [`@webquark/tooling/changelog`](../../packages/tooling/README.md) directly, or
`@webquark/core/tooling/changelog` through the installation umbrella. Browser
imports use `@webquark/browser` or the explicit `@webquark/core/browser` subpaths.
The five packages share one version and release channel. Tooling has no browser
or framework runtime dependency; each application owns its viewer.

The playground includes [static tooling documentation](../../src/playground/views/tooling/tooling.html),
[sample notes](../../src/playground/views/tooling/sample-notes.md), and a
[sample feed](../../src/playground/views/tooling/sample-feed.json). These examples
load no tooling code, API, authentication session or database.

## WebAppStack version-only reference

This example describes the previously inspected WebAppStack versioning contract,
including its extra CMS mirror and Cargo package identity. Place the reviewed
module at that project's root as `changelog.config.ts` when adoption is separately
requested. WebAppStack has not been edited or adopted by this migration.

```ts
import { fileURLToPath } from 'node:url';
import type { ChangelogConfig } from '@webquark/tooling/changelog';

export const changelogConfig: ChangelogConfig = {
  root: fileURLToPath(new URL('.', import.meta.url)),
  sourceManifest: 'package.json',
  changelog: 'CHANGELOG.md',
  releasesDirectory: 'docs/changelog',
  unreleasedDirectory: 'docs/changelog/unreleased',
  lockNamespace: 'webappstack',
  versioning: {
    jsonMirrors: [
      'frontend/package.json',
      'backend/package.json',
      'backend/libs/graphql/package.json',
      'backend/apps/cms/package.json',
    ],
    bun: {
      lock: 'bun.lock',
      workspaces: ['frontend', 'backend', 'backend/libs/graphql', 'backend/apps/cms'],
      refreshCommand: ['bun', 'install', '--lockfile-only'],
    },
    cargo: {
      manifest: 'frontend/src-tauri/Cargo.toml',
      lock: 'frontend/src-tauri/Cargo.lock',
      packageName: 'webappstack_shell',
    },
    tauri: {
      config: 'frontend/src-tauri/tauri.conf.json',
      versionReference: '../../package.json',
    },
  },
};
```

Read-only checks use:

```sh
wq-changelog version check --config ./changelog.config.ts
wq-changelog version status --config ./changelog.config.ts
```

Bun, Cargo and Tauri sections can each be omitted. Version-only consumers need no
visual metadata, feed output or capture setup. A visual-bearing release adds a
project metadata resolver so the archive preserves reviewed historical labels.

WebAppStack capture support remains unimplemented. It needs its own reviewed
profiles/scenarios, authentication, fictional seed evidence and owned environment
adapter. The extra CMS process and destructive database-reset command are not
part of this example or a supported capture workflow.

## Current migration gate

InStoreFocus keeps its existing command aliases and supplies root-owned
configuration and adapters. Local validation uses temporary packed artifacts and
installed snapshots; no archives or machine-specific dependency paths are
tracked. Clean CI installation waits for the separately authorized coordinated
npm publication at the consumer's declared package version.
