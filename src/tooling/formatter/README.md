# Embedded Prettier

Run `bun run tooling:update formatter` from the WebQuark root to update the browser formatter. The updater reads the stable `prettier` release from the public npm registry, verifies its tarball against npm's SHA-512 digest, and stages the browser modules and license notices.

| Path in this directory | Contents |
| --- | --- |
| `prettier/` | Upstream standalone ESM, plugins and notices, plus WebQuark's generated language entries and SHA-256 manifest |
| `build/` | Generated browser modules and their precompressed `.mjs.gz` siblings |
| `versions/prettier/<version>/` | The preceding release, once the first upgrade has taken place |
| `versions/version.json` | Installation and upgrade history with the UTC timestamp, previous and new Prettier versions, integrity, and published WebQuark `latest` and `dev` tags |

Each upgrade stages and exercises the language modules before activating them. The updater records history before pruning the older backup. Rerun the same command to finish an interrupted update. When the installed release already matches npm, the command refreshes outdated language entries and regenerates the build. History and the previous release are preserved. Keep the active source, backup and history together in version control.

## Build and serve

Run `bun run formatter:build` to regenerate the assets from the pinned files offline. The browser package build and playground startup run this step automatically. The browser package ships the assets in `dist/formatters/prettier/`. A static host can serve the ordinary `.mjs` files directly or negotiate the gzip variants using `Content-Encoding: gzip` and `Vary: Accept-Encoding`.

After changing parsers or plugins in the [language catalog](./languages.ts), run `bun run formatter:refresh`. It regenerates the pinned language entries offline, checks them with the installed Prettier release, and updates the source manifest before activating the verified build. Include the regenerated entries and source manifest with the catalog change. The manifest in `build/` lists SHA-256 checksums for the shipped files, including the compressed modules.

Syntax Box and Syntax View load these modules on the first Format action for a language that uses Prettier. Strict JSON uses the component's built-in token-preserving formatter. See the [component language table](../../../docs/components/q-syntax-box.md#languages) for the supported modes.

## Verify a change

- Run `bun test src/tooling/formatter/update.test.ts` to exercise installation, backup rotation, interrupted updates, and recovery using local fixtures.
- After a browser package build, run `bun scripts/verify-formatter-consumer.ts` with Playwright Chromium installed to test the packed package under a URL subdirectory. The check exercises the loader, direct component imports, and gzip negotiation.
