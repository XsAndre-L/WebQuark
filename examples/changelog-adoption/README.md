# Runnable changelog adoption example

This example generates its own feed from `CHANGELOG.md`; it does not render the
hand-authored playground sample feed. It is a small application example, not a
viewer package, scaffold command, capture adapter, or framework integration.

With Bun 1.4.2 or later, run from the WebQuark repository root after building
tooling:

```sh
bun examples/changelog-adoption/generate.ts
bun examples/changelog-adoption/serve.ts
```

Open `http://127.0.0.1:4173/`. The browser shows an Unreleased manual image and a
dated text-only release. Browser imports stay application-owned; tooling runs in
`generate.ts` only. `viewer.js` uses `textContent` and resolves image references
relative to the feed URL. This example shows full images and comparison pairs;
optional crop, summary placement and contextual guidance need application rendering.

To run independently, copy this directory into a new application directory,
install `@webquark/tooling` or a reviewed packed candidate there, and run
`bun generate.ts`, then `bun serve.ts`. For a text-only trial, omit
`docs/changelog/unreleased/visuals.json` in that copy and regenerate. Keep the
required release folders. Source SVG bytes are a fictional illustration; capture
automation is not involved.

Generated feed, copied images and the browser URL module live under ignored
`dist/`. The generator preserves `dist/release-notes/feed-url.ts`; the application
uses returned `feedUrl` to create `dist/feed-url.js`. Serve the complete generated
directory at `/release-notes/`, including `images/`.

For production output in PowerShell:

```powershell
$env:ENVIRONMENT_TYPE = 'prod'
bun generate.ts
```

Only the dated release remains. Set `$env:ENVIRONMENT_TYPE = 'dev'` for previews.
For a real application at `/app/`, use prefix `app/release-notes` and serve that
path; the viewer resolves the prefix from the origin root. The local example's
server routes serve the root configuration only.

The [installed-package README](../../packages/tooling/README.md)
contains the complete copyable setup, manual-image contract, versioning,
optional contextual metadata and explicit capture stage/publish workflow.
