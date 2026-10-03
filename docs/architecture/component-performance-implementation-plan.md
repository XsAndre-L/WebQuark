# Component performance implementation plan

Refined on 3 October 2026. This plan addresses the five performance findings reviewed in chat across WebQuark and the Darling Romery frontend. Execute in the order below, with a source review and relevant verification after each step. Preserve existing public component APIs and the repository's unrelated local work.

## Ownership and execution

WebQuark owns syntax highlighting, icon loading, and shared form behavior in `D:/Dev/PurelyIT/WebQuark`. Darling owns its navbar mapping and catalogue search in `D:/Dev/PurelyIT/darling-romery-website/frontend`. CMS data and schemas remain the source of truth; these changes require no backend or GraphQL schema changes.

The main agent delegates one step at a time to the implementation subagent, reviews its diff and evidence, and then dispatches the next step. The worker reads each repository's agent routing before editing it. Do not commit, publish, or activate a consumer package snapshot as an incidental side effect of an unrelated check. Final integration explicitly includes Darling's local WebQuark snapshot activation.

Use an independent verification fixture when fresh WebQuark output cannot be generated safely in the shared checkout. `.tmp/component-quality-review-fixes-20261003/fixture` is prior verification evidence, not a writable build destination for this work. Copy necessary source and configuration into a new fixture, build from the current sources, and compare hashes for the changed sources against the tested fixture. The original checkout's `dist` is stale and cannot validate the new implementation.

## Step 1 Improve HTML and JavaScript highlighting

**Owner:** WebQuark.

**Files:** `src/utils/syntax.ts`, `src/utils/syntax.unit.test.ts`, and existing built syntax-box browser tests where additional coverage is needed.

Replace the repeated suffix matching in the HTML and JavaScript branches with scanners that advance through each source region once. Consume comments, quoted strings, identifiers, numbers, and punctuation without restarting a failed lookahead from every character. Keep the existing token-class vocabulary and highlight helpers; preserve exact source slices. This remains lightweight highlighting rather than a full grammar parser.

Cover escaped strings, comments containing markup or code, Unicode, whitespace, incomplete tags and strings, long identifiers, and empty input. Identify any intended differences in classification before changing expected tests. Existing CSS and JSON behavior also remains covered.

**Acceptance:** Concatenating token text reproduces the input exactly, including incomplete edits. Existing literal-source tests pass. Highlighting remains usable while typing and pasting in a built editable syntax-box. With warmed repeated measurements at 4, 8, 16, and 32 KiB, processing grows approximately with input size rather than its square. Record runtime and median times; avoid tight machine-dependent timing assertions in ordinary correctness tests.

## Step 2 Stabilize Darling navbar items

**Owner:** Darling common navbar.

**Files:** `frontend/libs/common/src/lib/components/navbar/navbar.component.ts`, its template if necessary, and `frontend/apps/x-client/src/app/mobile-navigation.spec.ts`.

The inspected app and layout callers supply navigation through computed signals and replace arrays on content changes. Keep the existing public `@Input() navLinks` API. Update a stored mapped item array through `ngOnChanges` when that input changes, and bind the stored array rather than calling an allocating getter. Follow existing ordering and label, destination, value, and target mapping exactly. Confirm the complete set of callers before implementing; if a supported caller depends on in-place mutation, preserve that behavior deliberately rather than adding a speculative custom comparison system.

**Acceptance:** Unrelated checks and menu open/close retain the mapped array reference. Replacing links updates labels, destinations, order, and targets. Empty links, active navigation, action links, and mobile dismissal still behave correctly. Use focused existing Angular navigation tests and the relevant compile check.

## Step 3 Derive catalogue search data once

**Owner:** Darling catalogue state and content helpers.

**Files:** `frontend/libs/api-client/strapi/content/product-catalogue.ts`, `frontend/libs/api-client/strapi/components/product-catalogue-controls/product-catalogue-state.ts`, the content entry point if helper exports are needed, and `frontend/apps/x-client/src/app/product-catalogue.spec.ts`.

Keep reusable text normalization in the content-helper layer. Keep the search index and normalized query as computed state owned by the catalogue instance. Derive searchable text from current groups and product objects when CMS content changes; do not use a process-wide cache or product-ID-only index. Normalize words once per query. Preserve current locale normalization, all-word substring matching, titles, descriptions, headings, available-size labels, category rules, result ordering, and product object identity.

Retain `productMatches(item, query)` for existing consumers, implemented using the same normalization helpers. For an empty normalized query, return the eligible group's original items directly. Filter buttons continue to show labels without counts; the accessible result summary remains functional.

**Acceptance:** Existing catalogue and anchor tests pass. Add meaningful coverage for replacing CMS products, changed descriptions or sizes, removed categories, repeated IDs across different groups, and clearing the query. Search text is not rebuilt on every keystroke, and query tokenization occurs once per query change in the catalogue path. Use representative data and a larger synthetic fixture for recorded before/after benchmarks, clearly labeling each.

## Step 4 Share icon requests and bound cached results

**Owner:** WebQuark icon internals.

**Files:** `src/components/media/icon/icon.tsx`, `internals/fetch-icon.ts`, a focused internal loading module, and existing icon unit/browser tests and authored icon documentation.

Deliver concurrent request sharing first, then add completed-result caching. Keep the registered-definition path synchronous. Share URL loading only within the same owner document and equivalent request context. Key by the resolved URL and the actual request options; do not merge different request contexts or rewrite caller URLs.

Each consumer owns its deadline and cancellation. Changing source or disconnecting releases that consumer. A released, expired, or superseded consumer receives no result. The shared transport is aborted when no consumers remain; one consumer's short timeout must not terminate another consumer's longer request. Clean timers, readers, listeners, and failed pending entries on every exit. Preserve the existing bounded streaming, fatal decoding, SVG policy, sanitization, and no-browser-globals import behavior.

Retain response metadata in the internal fetch result before deciding cache eligibility; the current string-only helper discards the required headers. Keep the current two-argument helper's behavior for existing consumers if it remains in use.

**Chosen completed-cache policy:** Per-document LRU, at most 64 successful entries and 4 MiB of UTF-8 sanitized SVG text. A single entry still obeys the existing SVG size limit. Cache completed results only for readable HTTP(S) responses with explicit `public` and positive `max-age`, excluding `no-store`, `no-cache`, and `private`. Lifetime is at most 60 seconds and no longer than remaining server freshness after `Age` and elapsed response time. Treat missing, invalid, or contradictory metadata conservatively as ineligible. Other URL schemes and ineligible responses may share concurrent work but are not retained as completed entries. Do not cache failures or retain a parallel raw-SVG cache. Document these internal limits; introduce no public cache props.

**Acceptance:** Twenty equivalent concurrent URL icons produce one fetch and one sanitization. A subsequent eligible cache hit produces neither, while expiration or an ineligible response fetches again. Cover different documents, timeout durations, consumer release, superseded source, all-consumer cancellation, failure/retry, size and entry eviction, and cache restrictions with controlled metadata and clocks. Existing registry, sanitizer, URL, stream-bound, and icon rendering tests pass.

## Step 5 Reduce duplicate form work

**Owner:** WebQuark shared form internals.

**Files:** `src/components/inputs/form/form.tsx`, `internals/controls.ts`, `internals/field-state.ts`, `internals/values.ts`, and field reconciliation helpers only where duplication is confirmed.

Start with one control-discovery result per synchronous phase and eliminate duplicate reconciliation. Refresh after asynchronous waits and after consumer callbacks that can mutate values, ownership, disabling, or the DOM. Native validation can invoke an `invalid` listener synchronously, so an absence of `await` does not by itself make an earlier snapshot reusable. Do not introduce a persistent control cache or a second authoritative value store.

Keep serialization optimization as a separately measured substep. The observed 200-field `getValues()` operation took roughly 6 ms while allocating 200 detached forms. First assess reusing one transaction-local detached container, cleaning it between fields and in `finally`, without moving consumer controls. Batch compatible fields only if benchmarks show a material improvement and existing browser behavior remains identical. Never merge native radio groups with different owners or tree roots merely because clones share a detached form. Preserve duplicate-name order, `dirname`, datalist participation, files, selected-option disabling, newline conversion, and custom Boolean projections.

**Acceptance:** Existing collection, assignment, immediate property updates, reset cancellation/coalescing, readiness, native/FACE ownership, validation, submitter, and transport suites pass against fresh built output. Add coverage for synchronous validation listeners changing state if current suites lack it. Record control scans, reconciliations, detached allocations, and median timing on representative small forms and a 200-field fixture. Retain only optimizations with verified benefit; report the serialization substep as deliberately deferred if its complexity outweighs the measured gain.

## Verification and integration

Keep correctness tests deterministic. Use controlled clocks for cache expiration and timeout cases. For performance measurements, use the same runtime/build, warm up, record the median of multiple samples, and distinguish synthetic fixture results from actual page behavior. Assert deterministic request, parse, scan, and allocation reductions where practical. Read the complete result of every check; a recorded prior pass does not verify new source.

After relevant WebQuark changes, run the prop-order checker, targeted unit and fresh-output browser suites, production build, and required package verification. Broaden verification for shared modules according to the actual diff. Reuse successful unchanged checks where justified; do not repeatedly rebuild without a new reason.

After Darling changes, run focused Angular navigation/catalogue tests and its frontend build using the repository commands. Inspect the build diff because branding and code generation may write files. Preserve unrelated work.

For final consumer integration, inspect the current `.webquark/` local-package state and the supported `wq-switch build` workflow before activation. Build and activate the verified local WebQuark source snapshot, confirm core and Angular snapshot consistency, restart any running consumer dev server as required, and verify Darling's menu and products page against that snapshot. Keep generated snapshot packaging distinct from edits to WebQuark's original checkout. Do not publish packages or deploy the site.

The worker reports changed files, contract decisions, tests and build results, comparable performance evidence, source-to-fixture matching, and any deliberate deferral to the main agent. The main agent reviews those results before dispatching the next step and records final consumer verification separately from implementation checks.

## Execution record

Implementation and review on 3 October 2026:

| Step | Status | Reviewed evidence |
| --- | --- | --- |
| 1 Highlighting | Complete and accepted | Forward HTML/JavaScript scans; unchanged source slices; 567 unit, 66 tooling and 58 built browser tests; core/framework builds and consumers; changed source hashes match independent output fixture. |
| 2 Navbar | Complete and accepted | Stable mapped array across menu/unrelated updates; replacement-input mapping; 7 navigation tests and Darling production build; unchanged styling files. |
| 3 Product search | Complete and accepted | State-local index and query normalization; 14 catalogue/preview-anchor tests and Darling production build; repeat-query medians 0.030 to 0.0036 ms on 19 authored products and 2.46 to 0.149 ms on 1,900 synthetic products; identical query results and matching source hashes. |
| 4 Icons | Implementation in progress | Concurrent sharing, independent consumer cancellation and bounded eligible-result cache. |
| 5 Forms | Pending | Reduce discovery/reconciliation and measure transaction-local serialization. |
| Darling integration | Pending | Activate matching core/Angular snapshot, restart the verified frontend and check live published menu/products. |

Darling's additional branding test has an existing expectation that the CMS logo is passed to the shared navbar input. Its current template instead projects the logo through the banner shape. This unrelated test/source was left unchanged. The frontend build currently passes with initial-bundle and navbar-CSS size budget warnings.
