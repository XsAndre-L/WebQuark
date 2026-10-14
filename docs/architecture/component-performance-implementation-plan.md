# Component performance implementation plan

> Path note, 14 October 2026: source files have moved. See the [current-path mapping](source-path-migrations.md). Recorded commands, line numbers and validation results describe the original checkout and are retained as historical evidence.

Refined on 3 October 2026. This plan covers WebQuark syntax highlighting, icon loading, and shared form performance.

## Ownership and execution

Use an independent verification fixture when fresh WebQuark output cannot be generated safely in the shared checkout. `.tmp/component-quality-review-fixes-20261003/fixture` is prior verification evidence, not a writable build destination for this work. Copy necessary source and configuration into a new fixture, build from the current sources, and compare hashes for the changed sources against the tested fixture. The original checkout's `dist` is stale and cannot validate the new implementation.

## Step 1 Improve HTML and JavaScript highlighting

**Owner:** WebQuark.

**Files:** `src/utils/syntax.ts`, `src/utils/syntax.unit.test.ts`, and existing built syntax-box browser tests where additional coverage is needed.

Replace the repeated suffix matching in the HTML and JavaScript branches with scanners that advance through each source region once. Consume comments, quoted strings, identifiers, numbers, and punctuation without restarting a failed lookahead from every character. Keep the existing token-class vocabulary and highlight helpers; preserve exact source slices. This remains lightweight highlighting rather than a full grammar parser.

Cover escaped strings, comments containing markup or code, Unicode, whitespace, incomplete tags and strings, long identifiers, and empty input. Identify any intended differences in classification before changing expected tests. Existing CSS and JSON behavior also remains covered.

**Acceptance:** Concatenating token text reproduces the input exactly, including incomplete edits. Existing literal-source tests pass. Highlighting remains usable while typing and pasting in a built editable syntax-box. With warmed repeated measurements at 4, 8, 16, and 32 KiB, processing grows approximately with input size rather than its square. Record runtime and median times; avoid tight machine-dependent timing assertions in ordinary correctness tests.

## Step 2 Share icon requests and bound cached results

**Owner:** WebQuark icon internals.

**Files:** `src/components/media/icon/icon.tsx`, `internals/fetch-icon.ts`, a focused internal loading module, and existing icon unit/browser tests and authored icon documentation.

Deliver concurrent request sharing first, then add completed-result caching. Keep the registered-definition path synchronous. Share URL loading only within the same owner document and equivalent request context. Key by the resolved URL and the actual request options; do not merge different request contexts or rewrite caller URLs.

Each consumer owns its deadline and cancellation. Changing source or disconnecting releases that consumer. A released, expired, or superseded consumer receives no result. The shared transport is aborted when no consumers remain; one consumer's short timeout must not terminate another consumer's longer request. Clean timers, readers, listeners, and failed pending entries on every exit. Preserve the existing bounded streaming, fatal decoding, SVG policy, sanitization, and no-browser-globals import behavior.

Retain response metadata in the internal fetch result before deciding cache eligibility; the current string-only helper discards the required headers. Keep the current two-argument helper's behavior for existing consumers if it remains in use.

**Chosen completed-cache policy:** Per-document LRU, at most 64 successful entries and 4 MiB of UTF-8 sanitized SVG text. A single entry still obeys the existing SVG size limit. Cache completed results only for readable HTTP(S) responses with explicit `public` and positive `max-age`, excluding `no-store`, `no-cache`, and `private`. Lifetime is at most 60 seconds and no longer than remaining server freshness after `Age` and elapsed response time. Treat missing, invalid, or contradictory metadata conservatively as ineligible. Other URL schemes and ineligible responses may share concurrent work but are not retained as completed entries. Do not cache failures or retain a parallel raw-SVG cache. Document these internal limits; introduce no public cache props.

**Acceptance:** Twenty equivalent concurrent URL icons produce one fetch and one sanitization. A subsequent eligible cache hit produces neither, while expiration or an ineligible response fetches again. Cover different documents, timeout durations, consumer release, superseded source, all-consumer cancellation, failure/retry, size and entry eviction, and cache restrictions with controlled metadata and clocks. Existing registry, sanitizer, URL, stream-bound, and icon rendering tests pass.

## Step 3 Reduce duplicate form work

**Owner:** WebQuark shared form internals.

**Files:** `src/components/inputs/form/form.tsx`, `internals/controls.ts`, `internals/field-state.ts`, `internals/values.ts`, and field reconciliation helpers only where duplication is confirmed.

Start with one control-discovery result per synchronous phase and eliminate duplicate reconciliation. Refresh after asynchronous waits and after consumer callbacks that can mutate values, ownership, disabling, or the DOM. Native validation can invoke an `invalid` listener synchronously, so an absence of `await` does not by itself make an earlier snapshot reusable. Do not introduce a persistent control cache or a second authoritative value store.

Keep serialization optimization as a separately measured substep. The observed 200-field `getValues()` operation took roughly 6 ms while allocating 200 detached forms. First assess reusing one transaction-local detached container, cleaning it between fields and in `finally`, without moving consumer controls. Batch compatible fields only if benchmarks show a material improvement and existing browser behavior remains identical. Never merge native radio groups with different owners or tree roots merely because clones share a detached form. Preserve duplicate-name order, `dirname`, datalist participation, files, selected-option disabling, newline conversion, and custom Boolean projections.

**Acceptance:** Existing collection, assignment, immediate property updates, reset cancellation/coalescing, readiness, native/FACE ownership, validation, submitter, and transport suites pass against fresh built output. Add coverage for synchronous validation listeners changing state if current suites lack it. Record control scans, reconciliations, detached allocations, and median timing on representative small forms and a 200-field fixture. Retain only optimizations with verified benefit; report the serialization substep as deliberately deferred if its complexity outweighs the measured gain.

## Verification and integration

Keep correctness tests deterministic. Use controlled clocks for cache expiration and timeout cases. For performance measurements, use the same runtime/build, warm up, record the median of multiple samples, and distinguish synthetic fixture results from actual page behavior. Assert deterministic request, parse, scan, and allocation reductions where practical. Read the complete result of every check; a recorded prior pass does not verify new source.

After relevant WebQuark changes, run the prop-order checker, targeted unit and fresh-output browser suites, production build, and required package verification. Broaden verification for shared modules according to the actual diff. Reuse successful unchanged checks where justified; do not repeatedly rebuild without a new reason.

The worker reports changed files, contract decisions, tests and build results, comparable performance evidence, source-to-fixture matching, and any deliberate deferral to the main agent. The main agent reviews those results before dispatching the next step and records final consumer verification separately from implementation checks.

## Execution record

Implementation and review on 3 October 2026:

| Step | Status | Reviewed evidence |
| --- | --- | --- |
| 1 Highlighting | Complete and accepted | Forward HTML/JavaScript scans; unchanged source slices; 567 unit, 66 tooling and 58 built browser tests; core/framework builds and consumers; changed source hashes match independent output fixture. |
| 2 Icons | Implementation in progress | Concurrent sharing, independent consumer cancellation and bounded eligible-result cache. |
| 3 Forms | Pending | Reduce discovery/reconciliation and measure transaction-local serialization. |
