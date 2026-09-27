# Component category implementation plan

Status: implemented and verified on 2026-09-25.

## Purpose and classification rule

Organize components around the situations in which developers usually use them. Give each component one primary category. Optional interaction, rendering technique, and internal implementation do not by themselves determine that category.

This plan implements the agreed placements: card and carousel in Content; form alongside the inputs; chips in Data display; and alert, conversation bubble, and toast in Communication. Other placements remain as currently documented. No Navigation category is introduced.

## Target categories

Use these labels in documentation and playground navigation. Keep `inputs` as the category key and source directory, displaying it as **Forms & inputs**. This is an implementation choice that avoids renaming all existing input paths.

| Display label | Category key | Main situation | Components |
| :--- | :--- | :--- | :--- |
| Actions | `actions` | Triggering an action or following a destination | `q-button`, `q-link` |
| Communication | `communication` | Receiving a message from the application or another participant | `q-alert`, `q-conversation-bubble`, `q-toast` |
| Content | `content` | Presenting a piece or browsable collection of content | `q-banner`, `q-card`, `q-carousel` |
| Data display | `data-display` | Reading records, values, categories, or compact summaries | `q-accordion`, `q-chip`, `q-data-table`, `q-map`, `q-pagination`, `q-syntax-box` |
| Forms & inputs | `inputs` | Entering, collecting, validating, and submitting information | `q-dropdown`, `q-form`, `q-input`, `q-quantity-selector`, `q-radio-group`, `q-textarea`, `q-toggle` |
| Indicators | `indicators` | Understanding progress or position in a process | `q-progress`, `q-step-diagram`, `q-step-diagram-item` |
| Layout | `layout` | Organizing workspace regions, controls, and related views | `q-grid`, `q-inline`, `q-navbar`, `q-panel`, `q-scrollable`, `q-section`, `q-sidepanel`, `q-stack`, `q-tabs`, `q-toolbar` |
| Media | `media` | Presenting images, icons, identities, and media galleries | `q-avatar`, `q-icon`, `q-media`, `q-reel`, `q-thumbnail` |
| Overlays | `overlays` | Showing a temporary dialog or contextual description | `q-dialog`, `q-tooltip` |

The resulting inventory has **nine categories and 41 public components**. These category descriptions are discovery guidance; they do not change implementation maturity or add capabilities to scaffolds.

## 1. Establish the migration baseline

- Record the working-tree changes before implementation and preserve the existing documentation updates.
- Record the public tag inventory, exports, generated type signatures, and discovered tests before moving files.
- Record baseline results for the required build and test checks. If a baseline check was not run and its post-migration run fails, reproduce the failure against the preserved pre-migration state before classifying it as pre-existing.
- Search authored source, tests, tooling, package wrappers, and current documentation for references to the seven directories below. Include relative imports between component directories.
- Inspect the package export map and built artifacts. The `./dist/*` export permits category-dependent paths, so folder changes cannot automatically be assumed to be invisible to consumers. Identify affected deep imports and provide compatibility exports or forwarding modules where needed; verify them from the packed package. Avoid duplicate Stencil component declarations.

## 2. Move component directories and repair dependencies

Move each complete directory, including styles, types, internals, tests, and source-adjacent README content. Paths below are relative to `src/components/`.

| Component | Existing directory | Target directory |
| :--- | :--- | :--- |
| `q-card` | `layout/card` | `content/card` |
| `q-carousel` | `layout/carousel` | `content/carousel` |
| `q-form` | `layout/form` | `inputs/form` |
| `q-chip` | `actions/chip` | `data-display/chip` |
| `q-alert` | `data-display/alert` | `communication/alert` |
| `q-conversation-bubble` | `data-display/conversation-bubble` | `communication/conversation-bubble` |
| `q-toast` | `overlays/toast` | `communication/toast` |

- Resolve every affected relative import and stylesheet reference. Directory depth stays the same, but sibling relationships can change.
- Two known repairs: in the relocated `data-display/chip/chip.tsx`, change `../action.props` to `../../actions/action.props`; in `communication/toast/test/toast.cmp.test.ts`, change the old alert import to `../../alert/alert` after both communication components move.
- Update the toast controller and type exports in `src/index.ts`, plus any other authored references found by the baseline scan.
- Preserve component tags, property defaults, event names and payloads, methods, slots, CSS hooks, and runtime behavior.
- Regenerate `src/components.d.ts`, Stencil API tables, and React/Angular output through the normal build. Preserve authored sections of source-adjacent READMEs; do not manually rewrite generated tables.
- Check tooling that derives category names from paths, including the prop-order checker. This migration does not reorder component props.

## 3. Update playground discovery

- Update existing entries in `src/playground/components.manifest.json` to the target category keys.
- Update `CATEGORY_LABELS` in `src/playground/components/playground-sidebar/playground-sidebar.tsx`: add Communication and Content, and display `inputs` as Forms & inputs. Use the category order in the target table.
- Keep component selection values and sandbox filenames based on their existing tags so selecting a component still loads its current example.
- Verify Card and Carousel appear under Content; Form and existing fields under Forms & inputs; Chip under Data display; Conversation Bubble and Toast under Communication.
- `q-alert` currently has neither a manifest entry nor a sandbox specification. Update its source/docs category, and describe its preview accurately as a temporary fixture. Do not create a sidebar link to a nonexistent preset. Adding a permanent alert demo is a separate enhancement.
- Allow categories with no available presets to remain hidden according to the sidebar's existing behavior. The full public inventory and playground preset inventory serve different purposes.

## 4. Align documentation and examples

- Add the classification rule and concise category definitions to `docs/components/README.md` as the maintained documentation reference.
- Update category cells and generated-API links in `docs/components.md`, `docs/components/README.md`, and `docs/components/current-contracts.md`.
- Update implementation, type, helper, and generated-API links in affected component guides and other current guidance, including foundation documents where applicable.
- Update playground directions in affected guides. All existing input guides should use the new Forms & inputs display label.
- Keep authored guide filenames and screenshot paths stable, since they are based on component tags rather than categories.
- Refine `q-chip` documentation to lead with its common display use: a status, category, or short summary. Add a complete static-chip example and a matching component screenshot under the existing documentation standard. Retain selection, link, and removal examples as additional supported uses; preserve current defaults and behavior.
- Describe Communication consistently: conversation bubbles carry participant messages, alerts provide inline application messages, and toasts provide brief notifications. Placement is secondary to their shared purpose.
- Treat dated audit references as historical evidence. Update live guidance and navigable links where appropriate without rewriting historical findings as if the new paths existed at audit time.

## 5. Build and verify

Run checks after the migration is complete, using the repository's existing scripts and test configuration.

1. Run `bun run pr:verify`. This builds core, React, and Angular, regenerates output, and runs the tooling and unit projects.
2. Run the existing relevant browser tests with `bunx vitest run --project browser` and file filters for moved components and their affected integration tests. Confirm moved tests are still discovered. Add a test only for an uncovered migration or compatibility risk.
3. Verify supported package imports and any compatibility paths from the packed output, including the exported toast controller, component types, loader registration, and framework wrappers.
4. Start the playground with `bun start`. Confirm category labels, order, membership, component selection, example loading, and the absence of new console or network errors. Exercise card activation, carousel navigation, form submission/reset, chip interaction, and notifications.
5. Validate local Markdown links, anchors, screenshot references, and the required component-guide section structure. Inspect the new static-chip screenshot for readability and agreement with its snippet.
6. Compare the final tag inventory and public signatures with the baseline. Search for stale paths, allowing only intentional historical references and tested compatibility paths. Run `git diff --check` and inspect generated changes for unrelated drift.

## Completion criteria

- All 41 public components appear exactly once in the nine-category inventory.
- The seven agreed moves match the target table across source directories and current documentation.
- Every existing playground preset belongs to its intended category and opens successfully; guides accurately distinguish presets from temporary previews.
- Chips are documented as useful display components with optional interaction.
- Public behavior and supported import contracts are preserved, with compatibility handling verified wherever source relocation affects published paths.
- Build, applicable existing tests, documentation checks, and playground smoke checks pass. Any pre-existing failures are identified against the baseline rather than reported as successful verification.

Deliver the category migration, generated output, documentation updates, and validation results together as one reviewable change.

## Implementation results

- Moved all seven component directories and repaired imports. The generated public API matches the baseline after mapping the changed source paths; 244 source/style files match the baseline apart from imports.
- Updated the category index, current contracts, guide links, playground directions, manifest, and sidebar. The public inventory contains 41 unique components in nine categories; all 32 existing playground presets remain available.
- Added package export aliases for the former collection JavaScript, stylesheet, and declaration paths. Checked published runtime/style/type path resolution from a temporary package archive, imported the root toast controller, loader, and legacy toast controller, and verified TypeScript resolution for the seven former component type paths.
- Added the static status/category/summary chip example and inspected its screenshot. Selection and removal examples remain available, with link behavior documented in the API and interaction guidance.
- `bun run pr:verify` passed before and after migration: core, React, and Angular builds; 49 tooling tests; 389 unit tests. The two affected browser suites passed all 11 tests.
- Playground smoke checks rendered all 32 presets and exercised card activation, carousel navigation, form submission/reset, chip selection, and toast display/dismissal. No page errors or failed local requests were observed.
- Documentation checks passed for guide section structure, 1,108 local references, and 102 image references. `git diff --check` passed.

The initial sandboxed verification could not read `tsconfig.json`; the authorized verification outside the sandbox completed successfully. No component behavior changes were needed for this migration.
