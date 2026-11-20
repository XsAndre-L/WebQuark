# WebQuark to-do list

## Reusable documentation module

- [ ] Add a reusable module to the WebQuark library that takes a project's `docs/` folder and automatically generates documentation pages from its Markdown files.
- [ ] Support both publishing those pages under an existing website and hosting the same documentation as a standalone site. Relative links and images should work in both places.
- [ ] Use the module for WebQuark's own documentation, including its [component reference](docs/components/README.md) and the getting-started guide [Run a copied example](docs/playground-consumer.md). When publishing the guide, point its playground link to the corresponding hosted playground.

## Prettier updater and version history

- [x] Have `bun run tooling:update formatter` stage and verify the incoming Prettier release, including its build and gzip files, before changing the active copy.
- [x] Keep one on-disk backup under `src/tooling/formatter/versions/prettier/<version>/`. On a successful upgrade, the previously active release becomes that backup. The first installation has nothing to rotate, and rerunning the same version must leave the backup and history intact.
- [x] Keep a permanent, tracked `src/tooling/formatter/versions/version.json` at the root of `versions/`. For each successful installation or upgrade, record the time, outgoing Prettier version (if any), incoming Prettier version, and the published `@webquark/browser` versions on npm's `latest` and `dev` tags at update time. These values identify what was live before the next WebQuark release.
- [x] Allow one update at a time. Recover interrupted updates on retry, including pending cleanup, without duplicating history. Delete the older backup directory only after the active copy, replacement backup, and history record are safely in place.

### Formatter release checks

- [x] Exercise a first install, two successive upgrades, a same-version rerun, and an interruption before pruning. Verify the active version, single backup, and complete history after recovery.
- [x] Build the published browser package and the playground from the pinned local files. Check the sandbox serves JavaScript modules compressed and uncompressed. In a clean app under a URL subdirectory, load the packed release through both the loader and direct component imports with external requests blocked. Exclude backup files from published packages.
- [x] Verify every advertised language in Syntax Box and Syntax View, including their playground selectors. Check that edits or resets made while a formatter loads take precedence over its result, and retain the existing JSON token-preservation tests.
