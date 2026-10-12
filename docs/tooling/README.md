# Changelog tooling adoption

Use [`@webquark/tooling/changelog`](../../packages/tooling/README.md) directly, or
`@webquark/core/tooling/changelog` through the installation umbrella. Browser
imports use `@webquark/browser` or the explicit `@webquark/core/browser` subpaths.
The five packages share one version and release channel. Tooling has no browser
or framework runtime dependency; each application owns its viewer.

Start with the [installed-package README](../../packages/tooling/README.md). It
leads with automatic setup and retains the complete manual configuration reference.
Text notes and ordinary visuals require no metadata or capture adapter.

## Initialize an application

In an application that already declares `@webquark/tooling` or `@webquark/core`
and has a stable `X.Y.Z` package version, using the reviewed local packed
candidate (init is not published to npm yet):

```sh
bunx --no-install wq-changelog init
bun run changelog:preview
```

Open `http://127.0.0.1:4173/changelog/` and add your actual release bullets to
`CHANGELOG.md`. The starter creates only empty Unreleased content; it does not
invent released history. It creates a root config, source note folders,
`scripts/generate-changelog.ts`, a static viewer under `public/changelog/`, and
the `changelog:generate` and `changelog:preview` package scripts. Feed/image output
stays under ignored `public/changelog/generated/`; its separate ignored browser
URL bridge is `public/changelog/feed-url.js`.

`bun run changelog:generate` defaults to production and excludes Unreleased; a
fresh starter therefore has an empty production feed. Preview defaults to
development and initially shows Unreleased without bullets. Explicit
`ENVIRONMENT_TYPE` is respected, so `prod` and `prod-rehearsal` omit Unreleased
even while serving a preview. Capture configuration is added only when needed.

Use `bunx --no-install wq-changelog init --dry-run` to inspect the planned files.
Existing scaffold files, owned directories or conflicting script names stop init
before writes; repeated init does not replace customized files. Existing package
fields/scripts and ignore entries are preserved. Init does not install packages,
guess framework routes, supply capture adapters or prepare a release. Serve the
starter and its generated assets using the application's existing static pipeline.
The generated preview server assumes the starter paths; changes to output paths
or public prefixes need corresponding generator/server mapping updates. Hosting
the complete public tree below an application base path preserves its URLs.
Applications with existing changelog homes, such as InStoreFocus, continue using
their reviewed config/manual wiring; init does not merge or migrate those files.

For customized adoption, use the installed README's manual reference; it contains
the complete config, files, generation and server code. The existing browser
example below remains a separate fictional reference.

The existing [playground documentation](../../src/playground/views/tooling/tooling.html)
links to a [runnable adoption example](../../src/playground/views/tooling/adoption).
That example generates its feed using the installed tooling API; its browser code
fetches JSON and uses `textContent` for summaries and descriptions. It resolves
image paths against the fetched feed URL and imports no runtime tooling. The
[sample notes](../../src/playground/views/tooling/sample-notes.md) and
[sample feed](../../src/playground/views/tooling/sample-feed.json) remain fictional
static format references, not generator acceptance evidence.

## Run the existing browser example

From the repository root, after `bun run tooling:build`:

```sh
bun src/playground/views/tooling/adoption/generate.ts
bun src/playground/views/tooling/adoption/serve.ts
```

Open `http://127.0.0.1:4173/`. The example shows an Unreleased manual-image entry
and a dated text-only release. To verify installed-package adoption, copy the
`adoption/` directory into a separate application, install the reviewed tooling
package or packed candidate there, then run `bun generate.ts` and `bun serve.ts`.
It needs Bun 1.4.2 or later. All generated JSON, image copies and URL integration
files stay under ignored `dist/`, outside the source notes. The build script uses
returned `feedUrl` to write an application-owned browser URL module. Generated
`feed-url.ts` remains available for a TypeScript application build.

For a text-only trial, omit `docs/changelog/unreleased/visuals.json` from the
copied example and regenerate. Keep the release folders: the current contract
requires one matching directory per included `CHANGELOG.md` release, even when
it has no images. An Unreleased directory is required only when included.

## Choose the optional capabilities

| Capability | Additional setup | Result |
| --- | --- | --- |
| Text feed | Output directory and public URL prefix | Hashed JSON and `feed-url.ts` |
| Manual image or comparison | `visuals.json` and local `images/` files | Hashed image copies referenced relative to the feed |
| Contextual visuals | Metadata adapter and authored location/subject | Page labels, navigation, access and guidance; historical snapshots during release preparation |
| Versioning | Explicit JSON mirrors; optional Bun/Cargo/Tauri settings | Drift checks and synchronized preparation |
| Automated capture | Metadata, staging, reviewed application capture adapter and browser setup | Staged review artifacts, then explicitly saved reviewed bytes |

`requireVisualMetadata: true` lets an established consumer retain its strict
metadata policy for active Unreleased visuals; historical archives retain their
own contract. The default permits text notes and plain visuals. Partial
contextual fields still fail validation. Fully contextual
archives retain `locations.json` schema version 1; plain or mixed visual archives
use version 2. Older tooling cannot read the new version 2 snapshot schema;
update tooling before reading those newly prepared archives. Adoption itself
does not rewrite existing release content.

Capture uses `wq-changelog capture stage --config ./changelog.config.ts` followed,
after reviewing the run's images and report, by
`wq-changelog capture publish <run-id> --config ./changelog.config.ts`. Optional
selection uses `--scenario <id>` on stage; stage also supports `--watch`. Legacy
`capture --stage-only` and `capture --publish-run <run-id>` remain supported.

These actions have separate effects:

1. **Generate notes:** replace the generator-owned feed directory; serve or copy it through your application's asset pipeline.
2. **Stage captures:** write review artifacts and evidence without saving images into authored notes.
3. **Publish a reviewed capture run:** revalidate and save selected staged image bytes into Unreleased; regenerate the feed afterward.
4. **Prepare a release:** after the owner selects a new source version, archive Unreleased and synchronize configured mirrors; no commit, tag, npm publication or deployment.
5. **Publish npm packages:** a separately authorized coordinated package release, outside the adoption example.

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
visual metadata, feed output or capture setup. A contextual visual adds a
project metadata resolver so the archive preserves reviewed historical labels;
manual visuals without location/subject metadata do not need one.

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
