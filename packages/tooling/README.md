# WebQuark developer tooling

This package owns `wq-switch` and `wq-setup`, alongside the changelog tools.
Their source is in `src/tooling/wq-switch/`; `bun run tooling:build` at the
repository root builds the Node CLI bundles. Core keeps its existing commands
as forwarding launchers. See the [switcher guide](https://github.com/Purely-IT/WebQuark/blob/main/src/tooling/wq-switch/README.md).

The sandbox server implementation lives in `src/tooling/sandbox/` and is
exported as `@webquark/tooling/sandbox`. Core's `wq-sandbox` launcher supplies
the path to its packaged playground assets.

## Changelog tooling

Generate release-note JSON from your application's changelog, add manual images
when needed, and optionally configure version mirrors or automated capture.
Your application owns the browser viewer. Text notes and manual visuals need no
metadata adapter, capture setup, browser component package, or framework adapter.
Existing consumers can set `requireVisualMetadata: true` to retain a strict
metadata requirement for every active Unreleased visual. Historical archives
retain their own metadata contract.

Use **Bun 1.4.2 or later** for the CLI and build scripts. The umbrella also
exposes `@webquark/core/tooling/changelog`; the five packages share one version
and release channel. Runtime tooling belongs in build scripts, never in browsers.

## Start with automatic setup

With a stable `X.Y.Z` version in your application's existing `package.json`,
install `@webquark/tooling` as a development dependency. The starter can also use
an explicitly declared `@webquark/core` dependency through its tooling subpath.
The initializer is currently available in the local candidate only. Until the
coordinated npm publication, install the reviewed tooling tarball with
`bun add --dev ./webquark-tooling-<version>.tgz @types/bun`; after publication the usual
installation is `bun add --dev @webquark/tooling @types/bun`.
The TypeScript preview script references the installed Bun types; init does not
install this dependency automatically.

```sh
bunx --no-install wq-changelog init
bun run changelog:preview
```

Open `http://127.0.0.1:4173/changelog/`. Init creates the configuration, content
folders, generator and a small static viewer; preview generates a development feed
and serves it locally. Add your release bullets to `CHANGELOG.md` to show your
actual changes. The starter begins with Unreleased and does not invent released
versions or sample product history.

Generated files:

1. `changelog.config.ts` with explicit project paths and no metadata or capture adapter.
2. `CHANGELOG.md` plus `docs/changelog/unreleased/README.md`, `visuals.json`, and `images/.gitkeep`.
3. `scripts/generate-changelog.ts` for feed generation and local preview.
4. `public/changelog/index.html` and `viewer.js` for a static application-owned viewer.
5. Package scripts `changelog:generate` and `changelog:preview`, plus ignore entries for `public/changelog/generated/` and `public/changelog/feed-url.js`.

`bunx --no-install wq-changelog init --dry-run` reports the proposed setup without
writing. Init requires a declared tooling or umbrella dependency and an existing
stable source version. It does not install dependencies. Existing scaffold files,
owned directories, or conflicting script names stop initialization before writes;
repeating init also stops without replacing files. Other package fields, scripts,
and ignore entries are preserved.
An application that already has a changelog setup uses the manual reference or
its existing reviewed configuration; init does not merge or migrate that setup.

The viewer uses plain-text DOM rendering and feed-relative image URLs. It imports
no runtime tooling. Feed assets stay in ignored `public/changelog/generated/`;
the application writes its separate ignored `public/changelog/feed-url.js`
bridge from returned `feedUrl`. The generator still emits `feed-url.ts`.
Integrate `/changelog/` and its complete generated directory through
your application's static-asset pipeline. Init does not guess framework routing,
start your application, add capture adapters, prepare releases, or publish files.
The generated server and URL bridge use the starter's configured paths. If you
customize the output path or public prefix, update the generator/server mappings
alongside the config. When hosting the complete public tree below an application
base path, the starter's module-relative feed URL preserves that base path.

`bun run changelog:generate` generates production output by default, excluding
Unreleased. A new starter has no released history, so its initial production feed
is empty. `bun run changelog:preview` defaults to development and shows Unreleased,
which initially contains no bullets. Both scripts respect an explicit
`ENVIRONMENT_TYPE`; `prod` and `prod-rehearsal` suppress Unreleased even in preview.
Add `captures.json` only when adopting the optional capture setup.

The complete manual configuration below remains useful for existing custom paths,
viewers and asset pipelines. Add manual visuals using the same `visuals.json`
contract regardless of whether setup came from init or manual configuration.

## Manual reference: 1. Install and configure

Existing applications keep their manifest. For this complete small example,
first create root `package.json`:

```json
{
  "name": "changelog-adoption-example",
  "private": true,
  "type": "module",
  "version": "0.1.0"
}
```

Then install the development dependency in that directory:

```sh
bun add --dev @webquark/tooling @types/bun
```

For an unpublished candidate, install the reviewed local `.tgz` instead.
Publishing the coordinated packages remains a separate action.

Create `changelog.config.ts` in that same directory:

```ts
import { fileURLToPath } from 'node:url';
import type { ChangelogConfig } from '@webquark/tooling/changelog';

export const changelogConfig: ChangelogConfig = {
  root: fileURLToPath(new URL('.', import.meta.url)),
  sourceManifest: 'package.json',
  changelog: 'CHANGELOG.md',
  releasesDirectory: 'docs/changelog',
  unreleasedDirectory: 'docs/changelog/unreleased',
  feedOutputDirectory: 'dist/release-notes',
  feedPublicPrefix: 'release-notes',
};
```

Filesystem paths must stay below the explicit root. The public prefix is a relative
URL path, without a leading slash. The generator replaces its entire output folder
on each run; keep that folder separate from notes, other build output, and capture
staging. Add `dist/` to your `.gitignore`.

## Manual reference: 2. Add text notes and release folders

Create `CHANGELOG.md`:

```md
# Changelog

## Unreleased

### Added

- A fictional release-note panel shows text and an illustration.

## v0.1.0 - 2026-10-10

### Added

- The first fictional application release.
```

Create `docs/changelog/v0.1.0/README.md` containing `# v0.1.0`, and
`docs/changelog/unreleased/README.md` containing `# Unreleased`. **Every included
dated release needs its matching `v<version>/` directory even for text-only notes.**
An Unreleased preview needs its Unreleased directory. Neither `visuals.json` nor
images are required for text-only feed generation.

Detailed README prose stays in your documentation. Feed summaries come from the
Added, Changed, Fixed and Removed bullets in `CHANGELOG.md`. Only stable `X.Y.Z`
releases at or below the source manifest's version enter the feed, newest first.
Development may include Unreleased; `environmentType: 'prod'` or `'prod-rehearsal'`
always excludes it, including when a preview flag is set.

## Manual reference: 3. Generate and serve the output

Create `generate.ts`:

```ts
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { generateWhatsNew } from '@webquark/tooling/changelog';
import { changelogConfig } from './changelog.config';

const result = await generateWhatsNew(changelogConfig, {
  includeUnreleased: true,
  environmentType: process.env.ENVIRONMENT_TYPE ?? 'dev',
});
await writeFile(fileURLToPath(new URL('./dist/feed-url.js', import.meta.url)),
  `export const feedPath = ${JSON.stringify(result.feedUrl)};\n`);
console.log(`Generated ${result.releases} releases: ${result.feedUrl}`);
```

The output includes `releases.<hash>.json`, `images/<hash>.<ext>` when visuals
exist, and `feed-url.ts` exporting `WHAT_S_NEW_FEED_URL`. The feed remains
`{ releases }`. The returned `feedUrl` supplies the current hashed URL; this
example bridges it into an application-owned JavaScript module. TypeScript apps
can instead consume generated `feed-url.ts` during their build. Never guess a
hashed filename or import runtime tooling into a browser.

Create `serve.ts` for this local example:

```ts
/// <reference types="bun" />
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 4173,
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const filePath = path === '/' ? 'viewer.html'
      : path === '/feed-url.js' ? 'dist/feed-url.js'
      : /^\/release-notes\/(?:releases\.[a-f0-9]+\.json|images\/[a-f0-9]+\.(?:png|jpe?g|webp|gif|avif|svg))$/.test(path)
        ? `dist${path}` : undefined;
    if (!filePath) return new Response('Not found', { status: 404 });
    const file = Bun.file(`${root}/${filePath}`);
    return await file.exists() ? new Response(file) : new Response('Run bun generate.ts first.', { status: 404 });
  },
});
console.log(`Release notes: ${server.url}`);
```

In a real app, serve or copy the whole generated directory at `/release-notes/`.
Both the JSON and sibling images must be reachable. For a deployment below
`/app/`, use a public prefix such as `app/release-notes` and serve that path.
The local server above serves this root example only. Generation does not
configure your web server or deploy files.

## Manual reference: 4. Render in the browser

Create `viewer.html`:

```html
<!doctype html>
<html lang="en">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Release notes example</title>
  <style>body { max-width: 760px; margin: 32px auto; padding: 0 20px; font: 16px/1.6 system-ui; } img { max-width: 100%; height: auto; } figure { margin: 16px 0; }</style>
  <h1>Release notes</h1>
  <p id="status" role="status">Loading release notes…</p>
  <main id="releases"></main>
  <script type="module">
    import { feedPath } from './feed-url.js';
    const feedUrl = new URL(feedPath, new URL('/', location.href));
    const status = document.querySelector('#status');
    const releases = document.querySelector('#releases');
    function element(tag, text) {
      const node = document.createElement(tag);
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function imageFigure(reference, label) {
      const figure = element('figure');
      const image = element('img');
      const imageUrl = new URL(reference.src, feedUrl);
      if (imageUrl.origin !== feedUrl.origin || !['http:', 'https:'].includes(imageUrl.protocol)) {
        throw new Error('Image URL must be served with this feed.');
      }
      image.src = imageUrl.href;
      image.alt = reference.alt;
      figure.append(image, element('figcaption', label));
      return figure;
    }
    try {
      const response = await fetch(feedUrl);
      if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
      const feed = await response.json();
      for (const release of feed.releases) {
        const article = element('article');
        article.append(element('h2', release.unreleased ? 'Unreleased' : `v${release.version}`));
        if (release.date) article.append(element('p', release.date));
        for (const category of release.categories) {
          article.append(element('h3', category.name));
          const list = element('ul');
          for (const summary of category.summaries) list.append(element('li', summary));
          article.append(list);
        }
        for (const visual of release.visuals) {
          article.append(element('h3', visual.title));
          if (visual.description) article.append(element('p', visual.description));
          if (visual.kind === 'image') article.append(imageFigure(visual.image, visual.title));
          else article.append(imageFigure(visual.before, 'Before'), imageFigure(visual.after, 'After'));
        }
        releases.append(article);
      }
      status.textContent = `Loaded ${feed.releases.length} releases.`;
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Could not load release notes.';
    }
  </script>
</html>
```

All note text uses `textContent`; Markdown and HTML remain plain text. Image paths
resolve against the **feed URL**, so `/release-notes/images/<hash>.svg` works even
when the viewer is on another route. TypeScript viewers can use
`import type { ReleaseFeed } from '@webquark/tooling/changelog'`; that import
erases at build time. The minimal viewer shows full images and both comparison
sides. Applications implement optional crop, summary placement, and contextual
guidance presentation when using those fields.

Run `bun generate.ts`, then `bun serve.ts`, and open `http://127.0.0.1:4173/`.
The first run shows two text releases. The CLI alternative is
`bunx --no-install wq-changelog notes --config ./changelog.config.ts --include-unreleased`.
It generates the same folder and prints the generated feed URL; connect that URL
to your application, or use generated `feed-url.ts`.

For production output in PowerShell, run these two commands before packaging
your application's assets:

```powershell
$env:ENVIRONMENT_TYPE = 'prod'
bun generate.ts
```

That produces only the dated release, even with `includeUnreleased: true`. Use
`$env:ENVIRONMENT_TYPE = 'dev'` when returning to the local preview. The viewer
resolves the returned prefix from the origin root; a prefix such as
`app/release-notes` must not also be resolved against `/app/` a second time.

## Manual reference: 5. Add a manual visual

Create `docs/changelog/unreleased/images/release-panel.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="240" viewBox="0 0 640 240">
  <rect width="640" height="240" rx="16" fill="#eef3fa"/>
  <rect x="24" y="24" width="592" height="192" rx="12" fill="white" stroke="#b8c6dc"/>
  <text x="48" y="76" font-family="sans-serif" font-size="26" fill="#182337">Fictional release notes</text>
  <rect x="48" y="108" width="450" height="12" rx="6" fill="#b8c6dc"/>
  <rect x="48" y="144" width="360" height="12" rx="6" fill="#b8c6dc"/>
</svg>
```

Create `docs/changelog/unreleased/visuals.json`:

```json
[
  {
    "id": "release-panel",
    "kind": "image",
    "title": "Release-note panel",
    "description": "A hand-authored illustration using fictional content.",
    "afterSummary": {
      "category": "Added",
      "summary": "A fictional release-note panel shows text and an illustration."
    },
    "image": {
      "src": "images/release-panel.svg",
      "alt": "A release-note panel with a heading and two text lines."
    }
  }
]
```

Run `bun generate.ts` again and reload the page. The generator copies the image
bytes with a content-hashed filename and points the JSON to that copy. For a
comparison use `kind: 'comparison'` with `before` and `after` image references in
place of `image`; each needs `src` and `alt`. Omitting `kind` retains the legacy
comparison form. Source images must stay inside that release's `images/` folder.

`description`, `aspectRatio`, and `afterSummary` are optional. A summary anchor
must match exactly one complete bullet in the category. An image's `crop` uses
percentage `{ x, y, width, height }`; `framing` uses `{ anchor, width, height }`
and becomes a canonical crop in the feed. Use one or the other, never both.

## Optional contextual metadata

For page labels, navigation, access and guidance, add a reviewed `metadata`
adapter with `id`, `revision`, `applications`, and `resolve(root, record, context)`.
Pair authored `location: { application, route }` with `subject: { kind: 'page' }`
or a component subject containing `label` or `key`. The resolver returns
`location: { application, route, pageLabel, navigation, access }`,
`subject: { kind, label }`, and `guidance: { text, sourceRevision, readerSteps? }`.
`readerSteps` may also be authored on the visual. Contextual visuals require the
resolver; plain visuals can coexist with them. Release preparation snapshots
resolved contextual labels in `locations.json` for historical releases. Empty or
partial contextual fields are errors, not substitutes for omitting them.
Fully contextual archives keep snapshot schema version 1. Plain or mixed archives
use version 2, which older tooling cannot read; update tooling before reading
new version 2 archives. Existing archives are not rewritten by adoption.

## Optional versioning and release preparation

For mirrors, add `versioning: { jsonMirrors: ['client/package.json', 'server/package.json'] }`.
Only those explicit manifests are synchronized; no recursive discovery occurs.
Optional Bun, Cargo and Tauri sections appear in the
[repository versioning reference](https://github.com/Purely-IT/WebQuark/blob/main/docs/tooling/README.md).
Version-only configuration omits feed output, metadata and capture setup.

```sh
bunx --no-install wq-changelog version check --config ./changelog.config.ts
bunx --no-install wq-changelog version status --config ./changelog.config.ts
```

When the release owner requests preparation, first set the source manifest to
the next stable version (for this example, `0.1.1`), keep categorized Unreleased
bullets, and ensure `unreleased/README.md` and `unreleased/images/` exist. Then:

```sh
bunx --no-install wq-changelog release --config ./changelog.config.ts
```

Preparation archives Unreleased into `v0.1.1/`, adds the dated heading, snapshots
contextual metadata, creates fresh Unreleased content, and synchronizes configured
mirrors. It restores declared changes if it fails. It neither chooses the next
version nor commits, tags, publishes npm packages, or deploys the feed.

## Optional automated capture

Capture additionally requires a metadata adapter, `captureStagingDirectory`, and
a reviewed `captureAdapter` or async `loadCaptureAdapter()` export from the config
module. That application-owned adapter supplies the registry and configuration,
environment ownership, authentication, seed/network evidence, fingerprints,
capture behavior, and cleanup. JSON selects reviewed jobs; it cannot register
executable code. Browser dependencies and binaries require explicit application
setup. There is no built-in universal application adapter.

After the application setup, use the explicit workflow:

```sh
bunx --no-install wq-changelog capture stage --config ./changelog.config.ts --scenario release-panel
# Inspect the returned run's images and report before selecting its run ID.
bunx --no-install wq-changelog capture publish <run-id> --config ./changelog.config.ts
```

`stage` produces review artifacts without saving bytes to authored release images.
`publish <run-id>` revalidates the reviewed run and saves its selected bytes into
Unreleased image destinations. It does not publish a feed, package or deployment.
Generate notes afterward. API equivalents are
`stageCaptures(config, adapter, { selected: ['release-panel'] })` and
`publishReviewedRun(config, adapter, runId)`. Lossless WebP is the default;
PNG needs an explicit format and matching filename extension.

Legacy `capture --stage-only`, `capture --publish-run <run-id>`, and capture/watch
behavior remain available. Prefer explicit `stage` and `publish` for new adoption;
legacy custom capture without `--stage-only` may save images immediately.

The repository also has a
[runnable browser example](https://github.com/Purely-IT/WebQuark/tree/main/examples/changelog-adoption)
and [additional adoption notes](https://github.com/Purely-IT/WebQuark/blob/main/docs/tooling/README.md).
Those examples are repository files; the installed package ships this README,
compiled `dist/`, and its license.
