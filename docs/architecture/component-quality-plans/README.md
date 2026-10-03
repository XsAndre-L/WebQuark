# Component quality implementation plans

Prepared and independently reviewed on 3 October 2026 from the [41-component audit](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-review-2026-10-02.md) and the 47 recommendations listed in chat. These are **six implementation plans**, with this index providing coverage, sequencing, and shared verification. Component code has not been changed by this planning work.

## The six plans

| Plan | Intended result | Implementation timing |
| --- | --- | --- |
| [1. Content safety and code preservation](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/01-content-safety-and-code-preservation.md) | Inert icon rendering and exact code preservation; functioning empty editor. | Start first. |
| [2. Shared form behavior](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/02-shared-form-behavior.md) | Correct validation, successful values, submission/reset, assignment, disabling, and immediate method chaining. | Start early; syntax-box edits follow Plan 1. |
| [3. Field behavior and framework integration](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/03-field-behavior-and-framework-integration.md) | Consistent meaningful field capabilities, numeric/calendar behavior, dropdown interaction, and Angular accessors. | Implement after shared form/empty-editor contracts. |
| [4. Accessibility and interaction](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/04-accessibility-and-interaction.md) | Usable focus, names, modals, navbar, tables, steps, tooltips, tabs, and slotted content. | Independent slices can start early; shared components follow handoffs below. |
| [5. Layout, media, and styling](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/05-layout-media-and-styling.md) | Live geometry, lifecycle correctness, separate video/poster sources, RTL, contrast, motion, and guide coverage. | Independent geometry slices can start early; modal/media handoffs are required. |
| [6. Component concepts and API gaps](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/06-component-concepts-and-api-gaps.md) | Functional scaffolds and deliberate navigation, confirmation, panel, and map contracts. | Design checkpoints early; capability implementation after relevant foundations. |

Each plan is a workstream, not a requirement for one oversized PR. Deliver independent slices with their tests/docs: for example, Plan 1 separates icon handling from source preservation, Plan 2 separates collection/reset from submission, and Plan 6 delivers each component concept separately. Maintain one coherent contract across slices.

For start-to-finish execution by a main agent delegating one task at a time to GPT-6.1 Sol at Extra High, use the [coordinator execution plan](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-execution-plan.md). Its queue respects the shared-file handoffs and includes review, correction, verification, and resumable status tracking.

## Scope rules

- Fix reported supported-use failures with behavior regressions. Treat API additions and ambiguous semantics as explicit design checkpoints with proposed names/defaults, examples, and compatibility notes.
- Preserve agreed categories, orientation naming, controlled selection, public exports, and existing consumer changes. No incidental category/property rename or CLI storage migration.
- Keep domains meaningful: chips remain useful data displays, carousel/card remain content, communication components retain their category, and field types need not be identical.
- No unnecessary compatibility layer or new dependency. Evaluate dependencies only where required, such as safe explicit formatting; measure bundle/runtime cost.
- An intentionally deferred capability remains tracked with a reason and owner. A proposal, guide, or passing build does not count as implementation.

## Dependencies and file ownership

Plans 1 and 2 are the first priorities. Plan 3 implements after Plan 2's adapter/field-state contract. Plan 6's **design checkpoints** can run alongside the early bug fixes; its final implementation does not block unrelated work in Plans 4–5.

| Shared area | Ownership and handoff |
| --- | --- |
| Syntax-box | Plan 1 source/empty-editor → Plan 2 form/effective state → Plan 3 Angular accessor. Plan 4 action names can follow these edits. |
| Fields/buttons | Plan 2 form/action contract → Plan 3 field capabilities → Plan 4 general names/focus. Plan 3 owns dropdown search names/active descendant. |
| Navbar/tabs collections | Plan 3 owns normalization helpers. Plan 4 integrates mobile behavior and tabs relationships afterward; Plan 5 refreshes navbar guidance. |
| Sidepanel | Plan 6 defines mode/destination semantics early. Plan 5 fixes collapse/variant geometry. Plan 4 integrates the shared modal lifecycle in one coordinated patch. Plan 6 then implements navigation modes/links on that base. |
| Dialog | Plan 4 owns modal and slot relationships. Plan 6 defines deferred confirmation early, then implements actions on that base. Plan 5 applies common motion tokens afterward. |
| Reel/thumbnail/media | Plan 5 defines and implements poster/playback sources. Plan 4 integrates reel modal focus sequentially with that change. Plan 6's q-media implementation reuses the source contract. |
| Tabs/panels | Plan 6 proves/records the association design; Plan 4 implements accessible DOM/interaction. Plan 6 completes public declarations/examples with that same implementation. One delivery slice, one state model. |
| Steps/table | Plan 4 owns activation/semantics/identity; Plan 5 owns common motion/visual tokens. Table remains entirely in Plan 4. |
| Map | Plan 6 owns readiness/view-state changes. Plan 5 may audit existing motion behavior but does not independently rewrite map lifecycle. |
| Guides/generated metadata | Each slice updates its touched docs/types. Plan 5 owns cross-guide coverage tooling. Integrate generated artifacts from the final source; do not hand-edit wrapper output. |

Parallel work is appropriate for separate source areas such as icon, carousel, scrollable, table, tooltip, and scaffold design. Serialize shared-file changes or give one implementer the integration slice. Whole-plan completion is not a prerequisite where only a named contract is needed; this avoids a Plan 4/5/6 dependency cycle.

## Recommendation coverage

IDs reproduce the order of the recommendations supplied in chat. “Design” identifies an early checkpoint; the primary owner remains responsible for closure.

| ID | Recommendation | Primary owner | Related handoff |
| --- | --- | --- | --- |
| 1 | Strict SVG allowlist; reject malformed content | 1 | — |
| 2 | Escape syntax as literal source | 1 | — |
| 3 | Preserve code; explicit safe formatter | 1 | — |
| 4 | Empty editable syntax field and required validity | 1 | 2 field state |
| 5 | Validate unnamed fields | 2 | — |
| 6 | Cancel native submit before async validation | 2 | — |
| 7 | Successful controls and effective disabled/unavailable values | 2 | — |
| 8 | Unified cancelable reset | 2 | — |
| 9 | Type-aware grouped/repeated assignment | 2 | — |
| 10 | Native/q-button actions and composed Enter behavior | 2 | 4 names/focus |
| 11 | Immediate programmatic validation | 2 | 3 field extensions |
| 12 | Inherited fieldset disabling | 2 | 3 quantity |
| 13 | Quantity adopts the normal field contract | 3 | 2 adapter |
| 14 | Input numeric/calendar min/max | 3 | — |
| 15 | Decimal-safe step alignment | 3 | — |
| 16 | Toggle custom error affects validity | 3 | 2 shared validity |
| 17 | Textarea auto-height cleanup | 3 | — |
| 18 | Dropdown search/keyboard active-option flow | 3 | — |
| 19 | Guard interactions when an open dropdown becomes disabled | 3 | 2 effective state |
| 20 | Safe collection JSON/type boundaries | 3 | 4 navbar/tabs |
| 21 | Loading button and editor action names | 4 | 1–3 shared files |
| 22 | Visible focus indicators | 4 | 3 quantity/fields |
| 23 | Implement incomplete component scaffolds | 6 | 5 media source |
| 24 | Meaningful sidepanel modes | 6 | 5 geometry; 4 semantics |
| 25 | Carousel runtime styles and slide measurements | 5 | — |
| 26 | Sidepanel reachable collapse, variant lifecycle, transitions | 5 | 4 modal integration |
| 27 | Shared modal focus/layers/inertness/scroll lifecycle | 4 | 5 variant/media handoff |
| 28 | Navbar mobile focus, slot fallback, optional brand | 4 | 3 parsing; 5 guide |
| 29 | Scrollable visibility/reconnect/track geometry | 5 | — |
| 30 | One panel scroll container | 5 | — |
| 31 | Table stable identity and selection parity | 4 | — |
| 32 | Table/grid semantics match keyboard support | 4 | — |
| 33 | Positive finite pagination normalization | 5 | — |
| 34 | Separate video and poster sources | 5 | 4 reel modal; 6 media |
| 35 | Steps disabled semantics, list structure, final connector | 4 | 5 motion |
| 36 | Tooltip Escape/hover/collision/reposition | 4 | — |
| 37 | RTL toast centering | 5 | — |
| 38 | Shared contrast, sizing, thumbnail border, motion | 5 | 4 focus/lifecycle |
| 39 | Native field capability matrix | 3 | 2 contract |
| 40 | Quantity/editor Angular accessors | 3 | 1–2 editor |
| 41 | Sidepanel native destinations/disabled/original event | 6 | 4 accessible interaction |
| 42 | Supported tabs/panel association | 4 | 6 design/declarations |
| 43 | Async dialog confirmation and slot ARIA | 6 actions; 4 slot ARIA | One coordinated delivery |
| 44 | Derive chip removal names from slotted content | 4 | — |
| 45 | Icon URL pathname classification | 1 | — |
| 46 | Map readiness timeout and view integration decision | 6 | — |
| 47 | Current guides and API coverage checking | 5 tooling; all touched guides | Every delivery slice |

All F01–F30 audit groups and all 47 recommendations have an owner. The eight components with no additional concrete defect in the audit (`q-link`, `q-alert`, `q-card`, `q-progress`, `q-grid`, `q-inline`, `q-stack`, `q-toolbar`) need no speculative rewrite; retain their existing checks and smoke-check them when shared foundations affect them.

## Shared implementation verification gate

1. Inspect/preserve the worktree and record baseline checks relevant to the slice. Turn the reported trigger into a regression expecting corrected behavior; do not retain an audit reproduction that expects faulty behavior.
2. Run focused helper/component tests using the existing [Vitest projects](D:/Dev/PurelyIT/WebQuark/vitest.config.mts). `bunx vitest run --project unit <test-file>` and `bunx vitest run --project tooling <test-file>` are targeted paths. Tests requiring actual CSS/geometry, form ownership, focus, or shadow accessibility belong in the browser project and must include built custom elements/production styles when needed.
3. Run relevant browser files with `bunx vitest run --project browser <test-file>`. For carousel transitions use `bun run test:carousel:browsers` as well. Browser binaries are prerequisites; if the expected executable is unavailable, use an explicit installed-browser configuration where suitable and record it. Do not label unavailable engines as passed.
4. Run `bun run pr:verify` for each integrated delivery: prop ordering, core/React/Angular builds, tooling and unit checks. This script does **not** run the browser projects or prove Angular runtime accessor behavior; those checks are additional. Regenerate Stencil declarations, source-adjacent API tables, and wrappers through the build, preserving authored README sections.
5. New/changed props must follow the [prop-order skill](D:/Dev/PurelyIT/WebQuark/.agents/skills/organize-stencil-props/SKILL.md) and deliberate classification in its checker config. A reorder-only subpatch uses before/after fingerprints; intentional API additions/changes require reviewed signature differences, not a false claim of fingerprint equality.
6. Update touched guides to the [documentation standard](D:/Dev/PurelyIT/WebQuark/docs/components/README.md): existing five sections, complete runnable examples, actual component screenshots where examples change, effective API tables, and reviewed links. Independently review the changed guidance alongside behavior; reviews of these plans do not replace future implementation/doc review.
7. Honor the [CEF compatibility guidance](D:/Dev/PurelyIT/WebQuark/docs/unreal_compatibility.md), especially overlays, dropdowns, transforms, responsive layout, and media codecs. Record what was actually checked; installed Chrome is not CEF certification. Keep non-browser import/server paths functional.
8. Run `git diff --check`, inspect source/generated/package changes for unintended API drift, and record tests, browser engines, limitations, and any deferred decisions in the delivery. Do not repeat broad tests after they pass unless subsequent changes justify it.

This planning-only task needs document coverage/link/consistency checks and independent reviews; component build/browser gates above apply when implementing the plans.

## Independent plan reviews

Three separate subagents independently reviewed all six plans and the index and rechecked their revisions. Review C supplied a fresh review after A/B's corrections and also reviewed the coordinator execution plan:

- Review A: recommendation coverage, scope, API consistency, ownership, and sequencing.
- Review B: technical feasibility, regression risks, test adequacy, framework/shadow DOM/CEF concerns.
- Review C: fresh source comparison, hidden source-preservation/media regressions, and coordinator sequencing/configuration.

| Review | Findings incorporated | Recheck result |
| --- | --- | --- |
| A: coverage, API consistency, sequencing | Plan 3 explicitly implements/tests the capability matrix; property/framework writes are distinguished from documented action-method events; Plans 5–6 have unambiguous geometry/modal/media handoffs. | All findings resolved; no remaining material coverage or ownership inconsistency found. |
| B: technical feasibility and verification | Plan 3 includes Angular generated-source preparation, exports, artifact checks, source/packed consumers, and numeric null/reset policy tests. Plan 6 bounds both owned Google script loading and application-owned importLibrary, with generation guards and namespace preservation. | All findings resolved; no remaining material technical issue found. |
| C: fresh source, acceptance, and execution review | Plan 1 requires literal/member-preserving formatting, token-aware JSON checks, and rendered-source equality for every supported highlighting language. Plan 5 covers poster preservation throughout mixed-gallery navigation while preserving first/last boundaries. Plan 2 and the coordinator put reset-action bridging before its parity checks; sequential worker settings are explicit. | All findings resolved and rechecked; no remaining material issues in the six plans or coordinator plan found. |

The parent pass also clarified stored-source versus native textarea newline normalization in Plan 1 and authored versus generated theme-token ownership in Plan 5. Document checks confirmed exactly six plans, all 47 recommendation IDs present once in the coverage table, existing local link targets, and no trailing whitespace. These reviews assess the plans; implementation and future behavior verification remain to be done.
