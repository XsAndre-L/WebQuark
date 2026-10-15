# WebQuark local tooling

Run the commands in the **consuming project**, in the directory containing its
package.json. CLI execution requires Node.js 24 or newer. The tooling is being rebuilt before full release and uses one
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

Install the consumer's dependencies first. Declare matching WebQuark versions:
`@webquark/core` installs browser and tooling, while `@webquark/browser` and
`@webquark/tooling` can be used directly. Angular and React remain optional.
The switcher stages core's browser/tooling dependencies and wrappers' browser
dependency even when the consumer does not declare those dependencies directly.
Then run:

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
configuration owner's directory (the parent of `.webquark`), even when a child
consumer inherits that configuration.

### Shared workspace configuration

A consumer first uses its own `wq-switch` configuration, then the nearest
ancestor configuration up to its declared workspace root. Workspace membership
comes from `package.json` `workspaces` arrays or `workspaces.packages`, with
relative positive glob patterns. A nested workspace root is a boundary; a
consumer not included in the nearest workspace does not inherit its settings.
Standalone projects never inherit configuration merely because a parent has one.
Invalid nearer configuration fails explicitly. Configurations are not merged.

Keep a single `.webquark/.webquark.json` at the workspace root to share settings.
Each consumer still owns its own `.webquark/state/`, `.webquark/generated/packages/`,
package connections, and two-snapshot limit. Commands continue to identify the
consumer using its nearest `package.json`. `status` prints the exact configuration
file and resolved source directory.

Running `setup` in a child reuses inherited settings and adds only that consumer's
scripts and ignore entries; it does not create another configuration file.
Change shared settings from their owning project. Setup refuses a child request
to change an inherited source, and refuses shared-setting changes while an
affected workspace member has active state or pending recovery. If no applicable
configuration exists, setup creates one in the current consumer as before.

`preferredVersion` is copied from the consumer's first declared WebQuark dependency
(core takes precedence, then browser, tooling, Angular and React).
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
| `local` | Builds all five packages; activates snapshots of the consumer's WebQuark dependency closure |
| `build` | Builds all five packages; refreshes snapshots when this consumer is already local |
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

Tooling owns the bundled Node executables `wq-switch` and `wq-setup`; core
preserves its existing executable paths through forwarding launchers. Build them
from the current WebQuark checkout:

```powershell
bun run --cwd "D:\Dev\PurelyIT\WebQuark" switch:build
```

To exercise that exact build, invoke it directly from the consuming project:

```powershell
node "D:\Dev\PurelyIT\WebQuark\packages\tooling\dist\wq-switch\index.cjs" setup --source "D:\Dev\PurelyIT\WebQuark"
node "D:\Dev\PurelyIT\WebQuark\packages\tooling\dist\wq-switch\index.cjs" local
node "D:\Dev\PurelyIT\WebQuark\packages\tooling\dist\wq-switch\index.cjs" status
node "D:\Dev\PurelyIT\WebQuark\packages\tooling\dist\wq-switch\index.cjs" npm
```

Use the same checkout executable for subsequent commands while testing CLI
changes. Local activation also manages the selected packages' launchers in the
consumer's `node_modules/.bin`. New or renamed commands work through normal
`bun run` scripts. Existing Bun launchers with the same target and runtime are
retained; other local Windows launchers use npm's standard `cmd-shim` generator.
The bundled CLI includes these helpers, so consumers need no new dependencies.
Npm restoration restores the exact original launcher artifacts. Unrelated or
externally changed launchers stop switching before they are overwritten.
If a currently running Windows executable would need a different target or
runtime, retry through the checkout executable shown above; switching refuses
that operation before changing the consumer's active state.

## Switching and recovery

- Package snapshots are immutable. Build failure leaves active packages intact.
  Activation records a recovery journal because swapping package links and launchers
  is not globally atomic; stop and restart the consumer server when switching.
- Original npm entries are renamed beside themselves in `node_modules/@webquark/`
  to preserve relative Bun links. Hoisted packages receive removable local entries.
- Every selected internal dependency resolves to the same local snapshot set.
  Each added browser/tooling connection is restored alongside core and wrappers,
  including removable shadows over nested or hoisted packages.
- Framework peers resolve from the consumer. External runtime dependencies resolve from
  its installed package graph. Missing required dependencies stop staging; the
  switcher does not install dependencies automatically.
- Consumer and source locks remain in the OS temp directory so independent
  projects coordinate builds of the same checkout. Interrupted operations roll
  back before the next modifying command. Connections changed by another install
  are detected and are not overwritten.
- Each consumer retains at most two completed snapshots: its active generation
  and the newest remaining fallback. Successful activation, recovery, and npm
  restoration delete older generations automatically, oldest first; npm mode
  keeps the newest two. A third generation may exist temporarily while staging
  and switching. Active and recovery-journal generations are never pruned.
  Failed staging removes its partial generation. Cleanup failures fail the command
  explicitly; retry after resolving the reported filesystem error. A committed
  activation stays active even when its subsequent cleanup fails.
- Restart consumer servers after every activation. Processes using snapshots
  older than the retained fallback must be stopped before the next switch.
  After restoring npm and stopping those processes, `.webquark/generated/` can
  still be removed manually. Keep `.webquark/.webquark.json` for future use.

## Preflight checks

Prefix dev/build commands with `bun run wq-check &&` to verify
`@webquark/browser/native-content.css`, or `@webquark/core/browser/native-content.css`
for umbrella consumers, and its built file. Tooling-only consumers validate their
tooling entries without requiring browser CSS. The diagnostic
explains the separate setup and activation steps. A complete published package
needs no local checkout.

For an active local snapshot, `check` reuses `status`. It reports installed
versions separately from the release preference and fails for mixed or interrupted
activation. It does not compare snapshots with source or claim they are current.
These checks read configuration and state without changing files.

## Source and validation

`paths.ts` defines all consumer paths. `config.ts`, `state.ts`, `packages.ts`,
and `bins.ts` own configuration, transactions/locks, package snapshots and
dependency resolution, and launcher staging/ownership.
`index.ts` routes commands; `setup.ts` exposes the standalone setup executable.
Bundled files in `packages/tooling/dist/wq-switch/` are generated.

```powershell
bun run switch:build
bun run core:build
bunx vitest run --project tooling src/tooling/wq-switch/switch.unit.test.ts src/tooling/wq-switch/check.unit.test.ts
```
