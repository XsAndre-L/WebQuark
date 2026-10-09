# WebQuark local tooling

Run the commands in the **consuming project**, in the directory containing its
package.json. The tooling is being rebuilt before full release and uses one
supported consumer layout:

```text
.webquark/
  .webquark.json                 configuration and release preference
  generated/packages/<id>/      immutable built package snapshots
  state/state.json              active connections and npm restore information
  state/journal.json            recovery journal while a switch is in progress
```

`wq-setup` creates the configuration and adds `/.webquark/` to `.gitignore`.
Switching creates `generated` and `state` as needed. Generated packages are
active dependencies; keep them while using a local installation.

## Setup

Install the consumer's dependencies first. Declare matching WebQuark core and
framework package versions. Then run:

```powershell
bun run wq-setup --source "D:\Dev\PurelyIT\WebQuark"
bun run wq-switch local
bun run wq-switch status
```

Restart the development server after activation. Setup alone configures the
source path; `local` builds the checkout and activates snapshots of the packages
declared by this consumer.

Setup writes `.webquark/.webquark.json` with settings inside `"wq-switch"`:

```json
{
  "wq-switch": {
    "version": 1,
    "source": "D:\\Dev\\PurelyIT\\WebQuark",
    "preferredVersion": "1.1.0-dev.7"
  }
}
```

Without `--source`, setup creates an empty source setting. Fill it in before
running `local` or `build`. Relative source paths resolve from the consuming
project's package.json directory.

`preferredVersion` is copied from the consumer's `@webquark/core` dependency.
Setup preserves an existing preference, including ranges, and other top-level
configuration sections. The preference does not select or download a release;
`npm` restores the saved installation.

Setup adds these package scripts without changing dependency versions or
lockfiles:

```json
{
  "scripts": {
    "wq-sandbox": "wq-sandbox",
    "wq-switch": "wq-switch",
    "wq-check": "wq-switch check"
  }
}
```

The command names resolve installed executables through Bun's script PATH.
Setup preserves unrelated scripts and rejects conflicting script names before
writing configuration. `wq-switch setup` is an equivalent setup command.
Restore npm connections before changing configuration for an active local setup.

## Commands

| Command | Effect |
| --- | --- |
| `setup [--source <path>]` | Creates configuration, records the release preference, and adds scripts and ignore entries |
| `local` | Builds core, React, and Angular; activates snapshots of the packages declared by the consumer |
| `build` | Builds all three packages; refreshes snapshots when this consumer is already local |
| `npm` | Restores the exact saved npm entries without downloading or upgrading packages |
| `check` | Verifies native-content.css and reports active local package versions and recovery state |
| `status` | Reports connections, missing artifacts, mixed installs, and pending recovery |

After editing WebQuark source, run `bun run wq-switch build` in each local
consumer and restart its server. Editing the checkout or building packages there
alone does not update a consumer's snapshots. The CLI does not start or stop app
servers or watch source files.

Run `bun run wq-switch npm` before installing dependencies while switched locally.
Original package backups depend on the installed package graph remaining intact.

## Developing the CLI

Core exposes bundled Node executables as `wq-switch` and `wq-setup`. Build them
from the current WebQuark checkout:

```powershell
bun run --cwd "D:\Dev\PurelyIT\WebQuark" switch:build
```

To exercise that exact build, invoke it directly from the consuming project:

```powershell
node "D:\Dev\PurelyIT\WebQuark\scripts\wq-switch\dist\index.js" setup --source "D:\Dev\PurelyIT\WebQuark"
node "D:\Dev\PurelyIT\WebQuark\scripts\wq-switch\dist\index.js" local
node "D:\Dev\PurelyIT\WebQuark\scripts\wq-switch\dist\index.js" status
node "D:\Dev\PurelyIT\WebQuark\scripts\wq-switch\dist\index.js" npm
```

Use the same checkout executable for subsequent commands while testing CLI
changes. Existing package-manager bin shims are not rewritten by switching.

## Switching and recovery

- Package snapshots are immutable. Build failure leaves active packages intact.
  Activation records a recovery journal because swapping multiple package links
  is not globally atomic; stop and restart the consumer server when switching.
- Original npm entries are renamed beside themselves in `node_modules/@webquark/`
  to preserve relative Bun links. Hoisted packages receive removable local entries.
- Framework peers resolve from the consumer. Runtime dependencies resolve from
  its installed package graph. Missing required dependencies stop staging; the
  switcher does not install dependencies automatically.
- Consumer and source locks remain in the OS temp directory so independent
  projects coordinate builds of the same checkout. Interrupted operations roll
  back before the next modifying command. Connections changed by another install
  are detected and are not overwritten.
- Previous build snapshots remain available for existing processes and recovery.
  After restoring npm and stopping those processes, `.webquark/generated/` can
  be removed to reclaim disk space. Keep `.webquark/.webquark.json` for future use.

## Preflight checks

Prefix dev/build commands with `bun run wq-check &&` to verify that core exports
`@webquark/core/native-content.css` and includes its built file. The diagnostic
explains the separate setup and activation steps. A complete published package
needs no local checkout.

For an active local snapshot, `check` reuses `status`. It reports installed
versions separately from the release preference and fails for mixed or interrupted
activation. It does not compare snapshots with source or claim they are current.
These checks read configuration and state without changing files.

## Source and validation

`paths.ts` defines all consumer paths. `config.ts`, `state.ts`, and `packages.ts`
own configuration, transactions/locks, and snapshots/dependency resolution.
`index.ts` routes commands; `setup.ts` exposes the standalone setup executable.
Bundled files in `dist/` are generated.

```powershell
bun run switch:build
bunx vitest run --project tooling scripts/wq-switch/switch.unit.test.ts scripts/wq-switch/check.unit.test.ts
```
