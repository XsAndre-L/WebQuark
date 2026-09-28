# wq-switch

Run in the **consuming project**, in the directory containing its package.json.

```powershell
bun run wq-setup
bun run wq-switch local
bun run wq-switch status
bun run wq-switch build
bun run wq-switch npm
```

Setup creates this editable, gitignored configuration (version copied from the
consumer's `@webquark/core` dependency in package.json):

```json
{
  "wq-switch": {
    "version": 1,
    "source": "",
    "preferredVersion": "1.1.0-dev.6"
  }
}
```

Fill in `wq-switch.source` with the physical WebQuark repository root before running
`local` or `build`. Alternatively pass `--source "path/to/WebQuark"` to setup.
The exact dependency specifier is preserved, including a range when one is used.
`preferredVersion` records your release preference; `npm` still restores the saved
installation and does not download a different version.

The only supported configuration file is `.webquark.json`, with settings inside
`"wq-switch"`. Setup preserves other top-level sections. The `.wq-switch/`
directory holds runtime snapshots and is separate from configuration.

## Setting up dev.6

After `1.1.0-dev.6` is published, run these steps inside the consuming app:

1. Stop its development server. If already using a local switcher setup, run
   `bun run wq-switch npm` **before installing packages**, so the saved npm
   installation is restored safely. For a fresh setup, proceed to installation.
2. Install matching versions. For an Angular app:
   ```powershell
   bun add --exact @webquark/core@1.1.0-dev.6 @webquark/angular@1.1.0-dev.6
   ```
   React apps use `@webquark/react` instead of `@webquark/angular`.
3. Run the setup command:
   ```powershell
   bun run wq-setup --source "D:\Dev\PurelyIT\WebQuark"
   ```
   This creates or updates `.webquark.json` with settings under `"wq-switch"`.
   Other sections are preserved. An existing `preferredVersion`
   remains unchanged; it is a recorded preference, not the active package version.
4. Optionally run `bun run wq-switch local` to use the physical checkout.
   Otherwise, continue using the installed npm release. Restart the app's dev server.

Dev.6 also adds navbar alignment. Existing layouts keep their defaults; opt in
with `navAlign="center" navCenterWithin="container"` in Angular/React, or
`nav-align="center" nav-center-within="container"` in HTML. See the
[navbar guide](../../src/components/layout/navbar/readme.md#navigation-alignment)
for optical offsets, responsive behaviour, and custom-slot fallbacks.

Setup also adds these scripts without changing dependency versions or lockfiles:

```json
{
  "scripts": {
    "wq-sandbox": "wq-sandbox",
    "wq-switch": "wq-switch",
    "wq-check": "wq-switch check"
  }
}
```

The commands on the right resolve installed package executables through Bun's
script PATH; they do not recursively invoke the package scripts. Setup preserves
existing configuration and unrelated scripts, and rejects conflicting script
names before writing anything. `wq-switch setup` remains an equivalent alias.

| Command | Effect |
| --- | --- |
| `setup [--source <path>]` | Creates config, captures the release preference, and adds scripts and ignore entries |
| `local` | Builds core, React, and Angular; activates snapshots of only the packages declared by the consumer |
| `build` | Always builds all three; refreshes snapshots when this consumer is already local |
| `npm` | Restores the exact previous package entries; does not download or upgrade packages |
| `check` | Verifies the native-content.css export and file; prints setup guidance if missing |
| `status` | Reports actual connections, missing artifacts, mixed installs, and pending recovery |

Restart the consumer development server after switching or refreshing. The CLI
does not start/stop app servers or automatically watch source files. Editing the
checkout or running `packages:build` alone does not update active snapshots;
use `wq-switch build` from each consumer to activate its refreshed copy.

## Availability

Core ships bundled Node executables as `scripts/wq-switch/dist/index.js` and
`scripts/wq-switch/dist/setup.js`, exposed as `wq-switch` and `wq-setup`.
The source and handlers are TypeScript; `bun run switch:build` type-checks and
bundles them, and the normal WebQuark build includes that step.

Until the consuming app installs a release containing this command, it can invoke
the built CLI directly from the checkout (from the app's working directory):

```powershell
node "D:\Dev\PurelyIT\WebQuark\scripts\wq-switch\dist\index.js" setup --source "D:\Dev\PurelyIT\WebQuark"
node "D:\Dev\PurelyIT\WebQuark\scripts\wq-switch\dist\index.js" local
```

Continue using that direct invocation for `build`, `status`, and `npm` if the old
installed package has no `wq-switch` executable. Existing package-manager bin
shims are not rewritten. For releases containing the CLI, it remains available
through the original package store or through the active package entry.

## How switching works

- Switching does not edit package manifests or lockfiles. Setup adds package
  scripts, config, and ignore entries. Install the consumer's dependencies first.
- Local packages are immutable snapshots in `.wq-switch/packages/`. Build failure
  leaves the active snapshots untouched. Activation is journaled across packages;
  stop/restart the dev server because the multi-package swap is not globally atomic.
- Original entries are renamed beside themselves in `node_modules/@webquark/`,
  preserving relative Bun links. Hoisted installs receive a removable local entry.
- Framework peers resolve from the consuming project. Runtime dependencies come
  from its originally installed package graph. A missing required dependency stops
  staging; the tool never installs dependencies automatically.
- Project and source locks prevent concurrent switcher operations. Interrupted
  transactions are rolled back before the next modifying command. Changes made
  by another install are detected and are not overwritten. Run `npm` before a
  package-manager install; backups depend on the original package store remaining.
- Old snapshots are retained so existing processes and recovery references stay
  valid. After restoring and stopping app processes, the `.wq-switch` directory
  can be removed to reclaim disk space. Keep `.webquark.json` for future use.

## Source layout

`index.ts` routes switch commands; `setup.ts` exposes the standalone setup command.
`config.ts`, `state.ts`, and `packages.ts` own shared
configuration, journal/locks, and snapshot/dependency logic. `commands/` contains
the five command handlers. `dist/index.js` is generated and not maintained.

Validation: `bun run switch:build` followed by
`bunx vitest run --project tooling scripts/wq-switch/switch.unit.test.ts`.

### Catch missing stylesheet exports before bundling

Setup adds a `wq-check` script. Run `bun run wq-check`, or prefix your dev/build commands with `bun run wq-check &&`, to verify that the installed core exports `@webquark/core/native-content.css` and its built file exists. The diagnostic directs local consumers to `bun run wq-setup --source "<path-to-WebQuark>"` followed by `bun run wq-switch local`. Setup alone does not replace an older published package. A complete published package needs no local checkout.

The check cannot intercept Angular's errors automatically: it must run before the bundler. Older CLI releases do not include this command.
