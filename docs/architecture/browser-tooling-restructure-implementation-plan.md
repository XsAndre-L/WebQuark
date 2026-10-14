# Browser and tooling restructure implementation plan

Status: source implementation and boundary review complete, 2026-10-10. Package/consumer runtime acceptance remains pending coordinator verification. The linked [changelog extraction](changelog-tooling-extraction-implementation-plan.md) now implements the tooling boundary. Publication remains a separate instruction.

## Implementation record

The browser source, wrapper folders, private workspace, five package manifests,
role-aware publishing, switch dependency closure, and umbrella forwarding entries
are implemented. Tooling emits real notes/versioning/capture modules rather than
a placeholder. [Static tooling documentation and samples](../tooling/README.md)
are linked from the playground sidebar and copied through its existing `views`
tree. The source review does not establish browser, packaged sandbox, consumer
switching or live capture acceptance; those runtime gates remain pending.
The current extraction capture trial is blocked by the stopped local Docker
daemon/unavailable loopback PostgreSQL after its isolated Field Manager build; it establishes no screenshot
or image-publication acceptance.

## Approach

Separate browser source, developer tooling and publishable package folders. The user has accepted repurposing `@webquark/core` as an umbrella for installation/discovery because the existing library is not widely released. Browser components and tooling remain separately importable packages. Existing consumers undergo a coordinated dependency/import migration; old core browser imports do not require compatibility shims. Keep one repository and the existing Bun/Stencil build approach; the repository root becomes a private workspace/orchestration manifest.

The umbrella offers one installation point and a place to document compatible package versions. It does not create shared runtime ownership: browser code imports the browser package, tooling runs through its separate entry, and Angular/React integrations stay opt-in. A single root barrel must not re-export Node/Bun tooling into browser bundles. **Approved naming/layout:** `packages/core` publishes `@webquark/core`, depending exactly on same-version `@webquark/browser` and `@webquark/tooling`. `packages/browser/components` publishes the browser package. All five packages use the same prepared version and dev/stable channel; preserve the existing `1.0.2` baseline until release preparation explicitly changes it.

For isolated installs, core forwards explicit `@webquark/core/browser`, `@webquark/core/browser/components` and per-component entries, `@webquark/core/browser/loader`, `@webquark/core/browser/webquark.css`, `@webquark/core/browser/native-content.css`, and `@webquark/core/tooling/changelog`. Its own `wq-changelog` binary invokes the tooling entry; transitive bin installation is insufficient. Consumers importing direct browser/tooling names declare those packages directly. There is no root runtime barrel or old core browser compatibility surface.

**Decided root output location:** move only repository-root `dist/` to `.stencil/dist/`. Package-owned `dist/` directories remain in their package folders. The installed compiler defaults its cache directory to `.stencil` and the current cache is `.stencil/.build`; `.stencil/dist` is a separate build-artifact directory, not a replacement for that cache.

Approved source and package organization:

```text
src/
  browser/
    components/
    theme/
    assets/
    utils/
    index.ts
    components.d.ts             Stencil-generated browser declarations
    ...                         other existing browser declaration files
  playground/                   shared browser/tooling demos and documentation
  tooling/
    changelog/                  shared notes, captures and versioning
      notes/
      captures/
      config/
      cli/
      versioning/
      adapters/
      shared/
    wq-switch/                  local package switching and setup
    sandbox/                    playground HTTP server
packages/
  core/                         @webquark/core umbrella manifest
  browser/
    components/                 @webquark/browser: manifest, generated dist
    angular/                    existing handwritten/generated src, dist, manifest
    react/                      existing handwritten/generated src, dist, manifest
  tooling/                      manifest, generated changelog/switcher/sandbox outputs
examples/changelog-adoption/    standalone changelog application
scripts/                        repository build and maintenance
.stencil/
  .build/                       existing compiler cache
  dist/playground/              repository demo output (root dist relocated)
```

The browser package has no second browser source tree. Angular and React are intentional exceptions: their handwritten integrations and Stencil-generated wrappers remain together in each integration package's `src/`. Their npm names remain `@webquark/angular` and `@webquark/react`, with generated/handwritten imports targeting the browser package. `src/playground` remains a sibling with component demos and static tooling documentation. The documentation starts no API/database and supplies no packaged changelog viewer. Browser runtime exports never import capture, filesystem, database or CLI code.

**Current CLI placement (14 October 2026):** `src/tooling/wq-switch/` and `src/tooling/sandbox/` own CLI implementation. Tooling builds the switcher bundles and sandbox module. Core retains its package-relative `scripts/` launchers, forwarding to tooling; `wq-switch`, `wq-setup` and `wq-sandbox` remain available. Core owns the packaged playground assets and passes their directory to the sandbox server. The playground bundle is generated directly in `.stencil/dist/playground/`. See the [source-path migration record](source-path-migrations.md) for previous locations.

## Pre-migration contracts that constrain the move

All paths in this document are relative to the WebQuark repository root unless stated otherwise.
The following table records the original ownership that drove the implemented
move; its old paths describe the pre-migration checkout.

| Pre-migration owner | Consequence for migration |
| --- | --- |
| Root `package.json` | It is currently `@webquark/core`, contains browser exports, runtime dependencies, bins and workspace scripts. Split published package metadata from private workspace orchestration; retain build dependencies where the compiler resolves them. |
| `stencil.config.ts` | Uses default `src`, `src/theme/theme.css`, root `dist`, `dist/components`, `dist/playground`, and wrapper outputs under `packages/angular` and `packages/react`. Narrow compiler discovery to browser source and retarget all output/copy paths together. |
| Root core exports | Today consumers use root utilities/types, components, dist, CSS, loader and legacy category redirects. Map supported consumer usages to deliberate browser-package entries; do not copy historical redirects or promise old core imports by default. |
| `scripts/start-playground.ts` | Prebuilds a bundle in source and watches root `dist/playground/playground.js`. Point the watch bundle and Stencil site output to `.stencil/dist/playground` together. |
| `scripts/webquark-serve.ts` | Currently resolves `../dist/playground` from its script. Checkout serving must use `.stencil/dist/playground`; a packaged server resolves its staged package-owned `dist/playground` instead. |
| `.github/scripts/publishing/release-utils.ts` | Core directory is the repository root; wrappers have old directories. Release preparation, verification and publishing use this list. |
| Publishing preparation/publisher | Non-core packages are treated as wrappers requiring core dependencies. Introduce umbrella/browser/wrapper/tooling roles: wrappers depend on the browser package; tooling never depends on the umbrella. |
| `scripts/wq-switch/config.ts`, `packages.ts` | Source discovery assumes the root manifest is core; snapshot staging assumes root core and old wrapper paths. Update repository detection and package mapping together, retaining `.webquark/` storage behavior. |
| Wrapper scripts | Angular helpers derive the repository root using `../..`, pack root core, and inspect consumer paths. Nesting wrappers one level deeper changes those calculations. |
| Theme, prop-order and verification scripts | Theme generation hardcodes `src/theme`; prop-order checker/config hardcode `src/components`; Vitest aliases root `dist` and uses old component paths. These are consequential path consumers, not separate redesign work. |

## Ordered work

1. **Create coherent package ownership.** Browser source lives in `src/browser`; wrappers live in `packages/browser/angular` and `packages/browser/react`; browser and umbrella manifests have separate owners. Root workspaces enumerate all five packages, including buildable tooling. Browser runtime dependencies/license and deliberate exports belong to the browser manifest; umbrella owns installation/discovery and the approved utility bins. An umbrella install pulls browser/tooling without requiring Angular and React or their peers. Package versions/dependency ranges are explicit metadata rather than inferred from root identity. Acceptance: one canonical source home per subsystem, independently installable browser/tooling entries and no published root workspace.

2. **Retarget build and playground as one slice.** Stencil explicitly selects browser source, emits dist/loader/custom-element/CSS artifacts into the browser package folder, and generates integrations into their new package locations using the browser package name. Browser `tsconfig` inclusion excludes tooling, which has its own compiler/build configuration. Theme generation, component discovery, playground browser imports, test globs and local dist aliases use the new paths. Sibling playground copies/index paths follow the compiler's actual resolution; documentation outputs remain beside browser components.

   Produce the repository playground at `.stencil/dist/playground`. Any other output retained at repository scope uses `.stencil/dist`; package outputs continue using their package-owned `dist`. For the umbrella-owned `wq-sandbox`, stage that one generated site from `.stencil/dist/playground` into `packages/core/dist/playground` for its server binary. Make checkout-versus-packaged static roots explicit rather than applying a global `dist` replacement. This is artifact copying, not duplicated source or a second demo build. Keep source prebundle as a temporary build detail if needed; eliminating it is optional and must not expand this migration.

   Scope `empty`/cleanup to the specific output target or `.stencil/dist`, never the entire `.stencil` directory: compiler cache `.stencil/.build` has a separate lifecycle. Update watch bundle destinations, checkout sandbox static paths and root-output aliases/copy readers. Retain the existing `.stencil/` ignore and package-output exclusions; avoid watching either output/cache tree as source or deleting live watch output during staging. Acceptance: development watch and both checkout/packaged sandbox modes load components/theme/icons without stale root `dist` reads; output cleanup leaves `.stencil/.build` intact; package manifests/export paths still use their package-relative `dist`; a browser build never compiles changelog tooling.

3. **Coordinate consumers, switching and release paths.** Update root scripts, ignore rules, wrapper metadata/helpers, release directories and switch discovery/staging. Inventory and migrate current consumer package dependencies, imports, styles/loader paths and direct checkout references together; the umbrella cannot masquerade as the old browser runtime. Start with InStoreFocus and document migration requirements for other known consumers; changing WebAppStack requires a separate authorized task. Keep all five packages lockstep with exact internal ranges and existing dev/stable tags. Publish browser/tooling before core and browser before wrappers. Wrappers depend on and peer with browser; core depends on browser/tooling; no general package rule injects framework peers. Local switching includes core → browser/tooling and wrapper → browser dependency closure, and restores all affected identities on switch-back. Independent browser/tooling consumers are supported. Preserve workflow environment gates. Adapt `wq-switch` package selection and native-content diagnostics to the new browser identity and opt-in wrappers, avoiding a broad switching rewrite. Keep current `.webquark/` storage only. Acceptance: private root is never packed/published, migrated consumers resolve one browser runtime, and snapshots select the correct packages.

4. **Implement the tooling boundary.** The [extraction record](changelog-tooling-extraction-implementation-plan.md) builds shared notes, versioning and capture mechanics from `src/tooling/changelog` into `packages/tooling/dist/changelog`, exposed through `@webquark/tooling/changelog` and the separate umbrella forwarding entry. Tooling has its own compiler boundary and Sharp runtime dependency; Playwright belongs to the consumer's capture adapter. Acceptance: packed tooling functions independently of browser exports and wrapper dependencies. Runtime acceptance remains pending.

## Focused acceptance and rollback

During implementation, use one normal browser package build, pack listings for changed packages, existing affected wrapper consumer checks, and one playground/sandbox smoke check. Exercise one local switch-to-snapshot/switch-back round trip. Verify the umbrella installs the selected offerings without requiring both frameworks, and a browser import never loads tooling. Review migrated loader/custom-element/style/utility imports and Angular's data-table-cell entry against packed artifacts. These prove the changed contracts; a full component audit and every browser suite are not migration requirements. Existing release verification includes broader suites; this plan does not authorize removing established release gates or running them during planning.

Before publication, preserve the last working package artifacts and implement the migration in a reviewable commit. On failure, revert the path/manifest/build slice together and restore consumer switching to npm before discarding local snapshots. Do not revert unrelated edits. Publication needs its own explicit instruction; an already published npm version cannot be rolled back by moving repository folders.

## Approved decisions and remaining verification

Names, dependencies, forwarding entries, CLI placement, single playground staging and all-five version/channel lockstep are implemented above. Remaining runtime checks cover Stencil declaration/copy output, compiler-cache preservation, checkout/packaged sandbox behavior, packed forwarding resolution and umbrella-only CLI exposure. Consumer integration uses temporary packed artifacts and local snapshots before npm publication; no archives are checked in. InStoreFocus declares the intended `1.1.0` migration dependencies while local snapshots currently provide the built baseline. Clean registry-based CI waits for coordinated publication of the new package identities at that declared version.

## Out of scope

Component APIs, framework upgrades, a new build orchestrator, unrelated CLI rewrites, viewer extraction, deployment changes, executing release preparation or publishing, and exhaustive checks.
