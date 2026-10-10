# Shared changelog tooling extraction implementation plan

Status: shared source implementation, boundary review, local package-based consumer checks and representative Windows live capture/publication acceptance complete, 2026-10-10. Built on the [browser/tooling restructure](browser-tooling-restructure-implementation-plan.md). Capture execution, database operations, release preparation and publication retain their explicit authorization boundaries.

## Implementation record

The shared source and emitted JavaScript/declaration boundary now exist. The
tooling package build passed. A synthetic version-only consumer passed with
alternate manifest/changelog/release paths, a CMS mirror, omitted Cargo/Tauri/Bun
sections, configured archive links and controlled rollback. This is fixture
evidence for application release mechanics; the separate live capture trial is recorded below.

InStoreFocus scripts are compatibility delegates with explicit configuration.
Its Angular literal metadata resolver, capture registry, execution/authentication,
seed-evidence validators, runtime build helpers and demo ownership stay in the
application. Shared image codecs load on demand; the package imports no app
frontend/backend modules. [Adoption documentation](../tooling/README.md) includes
the WebAppStack version-only reference and the playground's static notes/feed
example. Source review, packed consumer checks, local switching and feed checks
passed.

The Windows extraction trial passed after Docker and the existing local
PostgreSQL dependency became available. An isolated Field Manager/API build
staged a navigation-only Profile capture as default lossless WebP and the custom
Tasks Editor capture as explicit PNG, both at 1920 × 1080. Both images were
visually reviewed. Real refresh authentication, cookie rotation, actor/query
evidence and settled browser/network gates passed. Reviewed publication saved
the exact staged bytes only into the ignored validation fixture; staged image
modification times, the closed demo-runtime report and the staging run list
were unchanged. Tracked `CHANGELOG.md` and `docs/changelog/` bytes were unchanged.

Owned database, role and storage removal passed; a separate SQL check confirmed
the reserved database/role were absent and there were no other client sessions.
The PostgreSQL dependency returned to its prior stopped state, with its container
and volume preserved. User-started Docker remained running. Local evidence lives
under InStoreFocus `frontend/build/changelog-extraction-trial/`: run
`2026-10-10T16-32-23-247Z-af91f6f9` has the passed/published schema-5 report and
closed demo-runtime report; `staged-proof.json`, `publication-proof.json` and
`infrastructure-proof.json` record the checks. Focused capture checks passed
30 tests, including the separate mocked owned-runtime lifecycle and rejection
gates; shared and consumer capture type checks also passed. This representative
Windows trial does not establish Linux or exhaustive scenario coverage.

## Approach

Extract InStoreFocus release notes, image capture and application versioning mechanics into `src/tooling/changelog`, published separately from browser components. `packages/tooling` contains the manifest and generated `dist/changelog`; approved package name is `@webquark/tooling` with import `@webquark/tooling/changelog`. Keep consumer application behavior behind explicit configuration and project-owned adapters. The user has accepted repurposing `@webquark/core` as an installation/discovery umbrella; browser runtime moves to `@webquark/browser` at `packages/browser/components`. Existing browser consumers undergo coordinated migration instead of mandatory old core import shims. Angular and React stay opt-in integrations with their current package names. An umbrella installation must not merge tooling exports into browser runtime or require both frameworks.

The Field Manager What's new viewer remains InStoreFocus application code consuming the generated feed. The playground now links static tooling documentation, fictional notes/feed data and capture setup guidance through its existing copied `views` subtree. It contains no shared viewer/component and starts no API or database.

The agreed WebQuark output relocation applies only to repository-root `dist`, now `.stencil/dist`. Tooling still emits to `packages/tooling/dist/changelog`, and all other package-owned `dist` paths remain unchanged. Playground documentation/examples build under `.stencil/dist/playground` and are staged from there if included in the umbrella sandbox. Compiler cache `.stencil/.build` remains separate; output cleanup must not delete it. This decision does not move InStoreFocus feed/staging paths or other consumer outputs.

This is architectural work with an existing capture/privacy boundary. First preserve the current InStoreFocus behavior; then prove the API can describe a second consumer. Avoid designing a general automation framework.

## Evidence and ownership

Paths prefixed `InStoreFocus:` and `WebAppStack:` are relative to those repository roots; unprefixed paths are relative to WebQuark. WebAppStack was inspected read-only and is not an authorized edit target.

| Existing owner | Shared mechanism | Consumer ownership that must remain explicit |
| --- | --- | --- |
| InStoreFocus: `scripts/release/notes/*` | Summary parsing, visuals/crops/framing, asset validation/hashing, feed staging and preview checks | Field Manager output path, app identities, Angular route/navigation/permission/component metadata and build hooks |
| InStoreFocus: `scripts/release/captures/*` | Configuration validation, selected-job orchestration, image encoding, staging/reporting, response evidence, publication locks and rollback | Scenario registry, GraphQL operations/subscriptions, actor names, real browser authentication, routes, map/seed facts and UI actions |
| InStoreFocus: `scripts/release/demo/*` | Reusable child/environment/owned-resource helpers only where they are independent of the application | PostgreSQL reserved identities, API build/migration/seed/package commands, protected resources, credentials and local/dev-server startup/recovery |
| InStoreFocus: `scripts/release/versioning/core/*` | SemVer checks, manifest/lock synchronization, archive preflight, snapshot/restore and status | Root source manifest, mirror/workspace lists, Cargo package identity, Tauri reference and release paths |
| InStoreFocus: backend demo seed and frontend runtime helpers | None by copying application modules | Remain app-owned; adapter passes bounded typed facts and environment/build results |

The pre-extraction notes generator derived root from its module location and hardcoded Field Manager output; metadata admitted only `field-manager`/`merchandiser`; capture policies, runtime generation and reviewed publication referenced application modules. These assumptions now reside in consumer configuration/adapters. The shared package emits consistent JavaScript/declarations with no source `.ts` or application checkout imports; app-owned mixed `.ts`/`.mjs` scenario code remains outside the package.

WebAppStack: `scripts/versioning/core.ts` supplies the same general release lifecycle, but includes `backend/apps/cms/package.json` and `backend/apps/cms` as JSON/Bun mirrors and uses `webappstack_shell` rather than `instorefocus_shell`. Its app identities are WebAppStack/Client/Manager, not Field Manager/Merchandiser. Its startup includes a separate CMS and its local fresh-database command is destructive. This confirms configuration is needed; it does **not** establish a supported WebAppStack capture environment. Do not invoke those startup/reset commands or promise capture support before its adapter and fictional seed contract exist.

## Implemented configuration and API contract

The public entry is `@webquark/tooling/changelog`, also forwarded separately at
`@webquark/core/tooling/changelog`.

- `ChangelogConfig`: explicit consumer `root`, source manifest, changelog, releases directory and active Unreleased directory. Metadata, feed output/public prefix and capture staging are optional until used. `NotesConfig` and `CaptureContentConfig` describe those required feature fields. Path validation rejects traversal/aliases; package imports never infer a project from their installed module directory. Capture defaults belong to the reviewed adapter.
- `VersioningConfig`: JSON manifest mirror list, Bun workspace list/lock path, optional Cargo manifest/lock/package identity and optional Tauri config/version-reference contract. Configure lists explicitly; do not recursively discover every package. InStoreFocus lists retain their current three JSON mirrors; WebAppStack's example adds CMS. Both keep root `package.json` as the app version source, `CHANGELOG.md`, `docs/changelog/unreleased` and the `../../package.json` Tauri reference.
- `VisualMetadataAdapter` supplies reviewed application IDs and literal metadata resolution. `CaptureAdapter<Job>` supplies identity/revision, configuration/projection, source/package fingerprint inputs, preparation/execution and mandatory reviewed-evidence validation. `OwnedCaptureRuntime<Job>` holds expiry, current-state verification, capture and cleanup; private credentials/resources stay inside this app-owned handle. Project code is trusted and source-reviewed; content JSON selects registered IDs without importing scripts or granting actions.
- API: `generateWhatsNew(config, options)`, `checkVersions(config)`, `versionStatus(config)`, `prepareRelease(config, options)`, `stageCaptures(config, adapter, options)` and `publishReviewedRun(config, adapter, runId)`. Release command runner/date remain injectable for fixtures. Capture failures retain redacted diagnostics and block publication. Credentials are absent from feed/report/config snapshots.
- CLI: one tooling binary, `wq-changelog`, with notes/version/capture subcommands calling the same API. Thin existing InStoreFocus scripts retain `version:check`, `version:status`, `release`, `release:capture`, frontend `prepare:whats-new` and refresh aliases. Scripts pass configuration explicitly so root and frontend working directories behave identically. Importing the API has no CLI execution, process startup or capture side effects.

Keep `notes/`, `captures/`, `versioning/`, `config/`, `cli/`, `adapters/`, `shared/` under that one changelog source home. `adapters/` defines interfaces and genuinely generic helpers; InStoreFocus implementation stays under its `scripts/release/` adapter/config boundary and imports application code there. Do not publish the application's credentials, seed data modules, runtime configuration readers or backend-specific SQL as generic package behavior.

The initial runtime is Bun 1.4.2 or later; Node compatibility remains unverified. Sharp `0.34.5` is a tooling runtime dependency and loads when image/capture support is selected. Playwright remains the consumer adapter's dependency; browser binaries require explicit setup and are never installed as a package side effect. Tooling has no umbrella/browser/framework runtime dependency. The umbrella depends exactly on same-version browser/tooling; all five packages share version and dev/stable channel lockstep, preserving the current `1.0.2` baseline until explicit release preparation. Publishing is dependency-first: browser/tooling before core and browser before integrations. Role-aware publication does not add core peers or framework dependencies to tooling. Core forwards `@webquark/core/tooling/changelog` and its own `wq-changelog` binary for isolated umbrella installations.

## Capture and content contracts to preserve

1. **Generic page and custom scenarios.** Generic capture navigates only to a reviewed profile with a named root, readiness evidence, source revision and expected seed facts. Custom scenarios keep reviewed app-specific actions, focus targets and network policies. `--scenario` selects configured jobs; it cannot enable arbitrary routes/selectors/actions. Dynamic route templates bind only to verified fictional seed-manifest records, including the current chat/task cases. Reject guessed record IDs, arbitrary query/fragment values and unregistered profiles.
2. **Auth, environment and privacy.** Preserve fresh browser contexts, real app authentication/refresh-cookie rotation and actor checks through adapters. Keep local/dev-server targets explicit and reject production environments. Owned loopback API/proxy, operation/read/subscription allowances and genuine response evidence must survive extraction; no generic unrestricted remote URL escape hatch. Project adapters own reserved databases/roles, protected-path/database exclusions, fictional seeding, clocks and exact resource ownership/recovery. Do not fall back to application databases or genuine customer data. Redact secrets and dispose sessions/proxy observations/resources on success and failure.
3. **Image/publication behavior.** Default remains lossless WebP; PNG is selectable by `format: "png"` and must match the output extension. Inspect final encoded bytes/dimensions/hash. Preserve immutable Before files, unique canonical After destinations, active-Unreleased ownership, symlink/hardlink protections, source/config/profile/tool/seed fingerprints, report revision and expiry checks, cleanup gating, staged-byte identity and transactional publication/rollback under the release-content lock. Generic jobs always stage for review first. Keep explicit reviewed publication separate from capture, and reject old reports when their provenance is no longer valid.
4. **Notes/feed compatibility.** Retain Added/Changed/Fixed/Removed summaries; Markdown image-relative paths; `visuals.json` standalone images/comparisons; optional location/subject/guidance and summary anchors; canonical crop output and framing-only refresh behavior. Keep `{ releases }`, existing entry/visual shapes, content-hashed feed/image URLs and generated `feed-url.ts` contract for Field Manager. Feed generation validates inputs before replacing only its owned output directory. Production/prod-rehearsal excludes Unreleased even if a preview flag is present. Preserve capture-preview exclusions for screenshots of the viewer itself, avoiding recursive/stale visual inputs.
5. **Application release behavior.** Status/check stay read-only. Explicit release preparation synchronizes configured mirrors, preserves lock/line-ending behavior, validates Tauri references, archives Unreleased and recreates it, with snapshots restoring all declared mutations on failure. It still performs no commit, tag, publication, packaging or deployment. Do not confuse this app release API with WebQuark's npm publisher.

## Ordered work

1. **Freeze the contracts and configure the current consumer.** Define the small public types above from the existing implementation, move hardcoded paths/identities into InStoreFocus config/adapters, and record existing generated feed and representative capture-report expectations. Start with version mirror/Cargo identity and note metadata; these expose hidden checkout assumptions cheaply. Acceptance: shared tooling interfaces contain no InStoreFocus union types or path constants, while existing consumer schemas/aliases remain valid. Smallest proof: focused type check and a fixture comparison of generated feed structure; no real release.
2. **Extract notes and versioning first.** Implement their shared mechanics under `src/tooling/changelog`, emit JS/declarations in `packages/tooling/dist/changelog`, and route InStoreFocus thin scripts to the package. Pass explicit roots and preserve frontend generated-output hooks. Acceptance: generation and read-only version commands work without locating package source in the consumer; controlled release-fixture failure restores files. Smallest proof: packed-package import smoke, representative notes assets and existing affected version/notes checks with injected runners. Do not run a real app release to verify the extraction.
3. **Extract capture mechanics with the adapter seam intact.** Separate generic orchestration/image/publication logic from auth/policies/scenarios/build/demo specifics. Keep InStoreFocus owned demo preparation and seed code in the app, passing trusted handles/facts to the shared lifecycle. Compile mixed-module imports and include required generic assets; consumer fixtures stay consumer-owned. Revise report/tool revision deliberately and require restaging where the extraction invalidates fingerprints. Acceptance: no published tooling import reaches InStoreFocus frontend/backend files; rejection gates remain effective. Smallest proof: existing affected capture/publication checks and one reviewed generic page plus one custom/dynamic InStoreFocus capture, when implementation capture execution is explicitly authorized; include a PNG fixture alongside default WebP.
4. **Prove reuse, document adoption and finish publication wiring.** Add a WebQuark example configuration describing WebAppStack's extra CMS mirror and Cargo identity without editing WebAppStack. Use a small synthetic consumer for packed version/notes execution; document its unresolved capture prerequisites. Add playground documentation/sample feed for tooling alongside component demos, without live API/DB startup. Enable actual tooling package publication only after a real artifact exists, preserving role-aware release behavior from the first plan. Acceptance: tooling can be installed/imported directly without umbrella/browser packages; umbrella installation discovers the offerings without creating a combined runtime barrel or mandatory framework peers; consumers provide their own adapters/version lists; sample notes generation proves alternate paths. A later authorized WebAppStack adoption is a separate change.

## Verification boundary, rollback and remaining decisions

Source implementation and focused local package/Windows capture acceptance are complete. Existing relevant coverage remains consumer-owned; no exhaustive repository audit, framework upgrade or new test program is implied. Linux dev-server capture acceptance is still open in InStoreFocus documentation and is not established by this extraction.

Keep old consumer entry scripts as thin compatibility delegates and preserve pre-migration local behavior until the packed package is proven. Roll back by restoring consumer imports/config wiring and the package dependency; do not overwrite user notes/images or unrelated edits. Release and publication failures must restore only their declared outputs. Resolve, hash and watch active packaged browser/tooling artifacts, including local snapshots, together with project adapter inputs. The current capture fingerprint must migrate from core/app-local shared-script assumptions. Existing staged capture reports may require restaging after these fingerprint changes; do not weaken validation to accept them.

Emission uses ESM JavaScript and declarations with an explicit Bun CLI; capture codecs and orchestration load on demand through a lightweight facade. Capture reports now use schema `5` and revision `webquark-managed-capture-v5`, so old staged reports require restaging. Fingerprints resolve installed core browser-forwarding, browser/tooling/Angular package trees, including local snapshots, and adapter source inputs. Remaining gates are separately authorized npm publication/clean CI installation and WebAppStack's unimplemented capture adapter/fictional environment. Local consumer migration uses temporary artifacts and snapshots with no checked-in archives; clean CI waits for coordinated npm publication at the consumer's declared `1.1.0` version. A generic packaged viewer, unrelated CLI relocation and app-specific demo environment standardization remain outside scope.
