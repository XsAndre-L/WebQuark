# WebQuark component quality execution plan

Status: execution instructions prepared and independently reviewed on 3 October 2026. Component implementation has not started through this plan.

## Objective and roles

Execute the [six reviewed implementation plans](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/README.md) from start to finish, using **one implementation worker at a time**. The main agent owns the schedule, contract decisions, code/document review, integration, verification evidence, and final report. The implementation worker completes the currently assigned bounded task and returns its result before receiving another task.

Use the user's requested worker settings: **GPT-6.1 Sol, Extra High**; tool configuration is `model: "gpt-6.1-sol"`, `reasoning_effort: "xhigh"`. Keep the main agent's existing model/settings. Do not substitute a different worker model silently.

The six detailed plans remain the source of task requirements and acceptance scenarios. This document orders their slices; it does not replace their contracts with shorter summaries. Completion means implemented and verified supported behavior, consistent public/generated APIs, and current documentation. Explicitly deferred design recommendations must remain visible with reasons; they cannot be reported as implemented.

## Main agent preparation

1. Read [the repository knowledge map](D:/Dev/PurelyIT/WebQuark/.agents/README.md), applicable AGENTS instructions, the [audit](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-review-2026-10-02.md), the six plans, their ownership table, and independent review corrections. Load only relevant skills. Preserve agreed categories, orientation names, controlled-state contracts, and existing user changes.
2. Inspect the current checkout, changed files, installed tooling, test projects, and package scripts. Confirm the task's workspace before dispatch. Choose one working checkout for this sequential run; the main agent owns any necessary worktree/branch decision. Workers do not independently switch branches or create competing checkouts.
3. Create a resumable execution ledger at `D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-execution-status.md` when execution begins. This is a future execution artifact, not evidence that work is already complete. Track task ID, state, worker, changed files, accepted decisions, tests/browser engines, review corrections, blockers, and next task. Also track all 47 recommendation IDs and their subrequirements.
4. Use states `todo`, `in progress`, `needs correction`, `implemented`, `verified`, `deferred`, and `blocked`. A grouped recommendation closes only when all of its subrequirements are satisfied. A design checkpoint records a decision; it does not itself close a behavior recommendation.
5. Establish the current baseline and browser/runtime prerequisites through Task 01. The historical audit's test counts are context, not a substitute for checking the current checkout.

## Worker dispatch configuration

Spawn the implementation worker with these parameters, using the actual collaboration tool available to the main agent:

```json
{
  "task_name": "webquark_implementation",
  "model": "gpt-6.1-sol",
  "reasoning_effort": "xhigh",
  "fork_turns": "none",
  "message": "The complete worker instructions and current task assignment"
}
```

An explicit model override requires a fresh-context spawn, so the message must contain the repository path, task, relevant plan paths, accepted decisions, scope boundaries, and required checks. Reuse this worker with `followup_task` for subsequent tasks; it retains its configured model/effort. If replacement is needed, first stop the prior worker and spawn a new one with the same settings and ledger context, using a unique task name such as `webquark_implementation_02`. There must never be two implementation workers running concurrently.

Use collaboration subagents for this work. Do not create separate user-owned chats merely to dispatch subtasks. The current instruction is to prepare this execution plan; actual implementation begins when the main agent is instructed to execute it.

## Instructions included in every assignment

Give the worker this common contract plus the task-specific scope:

```text
You are the WebQuark implementation worker for the current task only.
Repository: D:/Dev/PurelyIT/WebQuark.
Read .agents/README.md and applicable AGENTS instructions first. Read the
assigned detailed plan and the relevant source/types/styles/helpers/tests.
Load only the relevant skills. Inspect git status and preserve user changes.

Implement task <ID>: <scope and expected result>.
Detailed plan(s): <absolute paths>.
Accepted decisions and prior handoffs: <ledger summary>.
Allowed areas: <components/helpers/tooling/docs for this task>.
Dependencies already verified: <task IDs and evidence>.
Required checks: <focused tests and behavior scenarios>.

Implement the behavior, meaningful regression tests, generated outputs where
needed, and touched authored guidance/examples. Follow the repository's
documentation and prop-order standards. Preserve supported event timing and
domain-specific value types. Avoid unrelated API/category cleanup.

Do not delegate, change checkout, or start the next task. Do not publish or
merge. Keep temporary fixtures inert where content rejection is tested.
If a prerequisite is missing, report the concrete issue and make any useful
independent progress within this task; do not silently weaken acceptance.

Return: changes/files, behavior and API decisions, tests with exact results,
browser/runtime coverage, limitations, unresolved issues, and handoff notes.
Distinguish implemented behavior from proposals, skipped checks, and failures.
```

The main agent adapts allowed areas to actual dependencies; this is a scope boundary, not a prohibition on a necessary small helper or generated-file change. The worker reports justified scope changes before treating them as accepted.

## Mandatory loop between tasks

1. Select the next task below after its prerequisites are verified. Send exactly that task to the configured worker. Give it the relevant detailed plan and accepted contract decisions, not just the table row.
2. Wait for its result while providing concise progress updates. Do not dispatch the next task merely because code was written. If the worker needs a routine implementation decision, the main agent resolves it using the plans, existing API, and common use cases. Record the decision. Ask the user only for information/authorization actually needed outside that scope, after preparing a concrete result where possible.
3. Review the diff against source and the task's acceptance scenarios. Inspect public names, defaults, HTML mappings, event timing/cancellation, controlled-state behavior, lifecycle cleanup, accessibility, CEF/import compatibility, and documentation accuracy where relevant. Review generated signature changes intentionally.
4. Inspect meaningful test evidence. Re-run a targeted check when it resolves doubt, a failure, or a new correction; do not blindly rerun passed broad checks. Browser tests are required for actual form ownership, geometry, focus, and shadow relationships. Compilation alone does not prove runtime behavior.
5. Send concrete corrections to the same worker and repeat review until the task meets its requirements. The main agent remains responsible for correctness; a worker's completion message is not the acceptance gate.
6. Mark the task verified only after required evidence and review are complete. Update the ledger and recommendation status, preserving partial coverage for grouped IDs. Run integrated verification at the checkpoints below, then dispatch the next task.

Serialize shared-file work. If a task genuinely cannot proceed, record the blocker and resolve it before dependent tasks; unrelated later tasks may be brought forward one at a time with a recorded reason and preserved handoffs. Do not declare an entire plan complete because some of its tasks passed.

## Ordered task queue

P1–P6 refer to the six plans linked in the index. Recommendation IDs refer to its 47-row coverage table. Each row requires all applicable detailed-plan acceptance checks and touched documentation; the final column highlights the decisive evidence.

| Task | Assignment | Detailed plan / recommendations | Exit evidence and handoff |
| --- | --- | --- | --- |
| 01 | Inventory the current public components, worktree, APIs, test/tooling baseline, browser prerequisites, and framework runtime harness. Propose the execution ledger baseline. | All plans | Main accepts current baseline, unrelated changes, required harness work, and test limitations. Do not rewrite healthy components. |
| 02 | Implement shared strict icon policy, malformed rejection, bounded resources, and pathname-based image URL classification. | P1 / 1, 45 | Positive icons preserved; inert rejection fixtures; query/hash image URLs; non-browser import. |
| 03 | Fix literal syntax escaping/highlighting, exact source synchronization, and the unseeded editable field. Preserve existing code/value aliases. | P1 / 2, 4; preservation part of 3 | Rendered text equality in all four languages, stored/copy/reset equality, CRLF boundary, required empty editor. |
| 04 | Settle and implement explicit safe formatting. Preserve literal values/comments/member structure; leave unsupported input unchanged or clearly disable unsupported Format. | P1 / remaining 3 | Token-aware JSON precision/duplicate/order checks; invalid input intact; measured dependency/bundle impact if added. **Checkpoint A.** |
| 05 | Settle form adapter, ownership, repeated-value, reset/default, cancellation/submission, and field-capability decisions before implementation. Include quantity empty/null policy requirements. | P2, P3 / design for 5–20, 39–40 | Concrete contract matrix and tests to implement; no second field-state model. Design alone closes no behavior IDs. |
| 06 | Implement supported-control discovery, unnamed validation, canonical successful values/FormData, and type-aware grouped/repeated assignment. | P2 / 5, 7, 9 | Mixed native/custom forms; slots excluded; unavailable selections; radio identities; repeated toggles/multiselect/files. |
| 07 | Unify cancelable reset and bridge native/q-button reset actions in q-form and ordinary native forms; synchronize value/validity and explicit plus inherited disabling across existing fields/editor. | P2 / 8, 11, 12; reset part of 10 | Button/method reset parity is proven here, not before reset actions exist; immediate chaining/direct writes; fieldset/legend semantics; no duplicate callbacks. |
| 08 | Implement guarded submit/native navigation, native/q-button submit participation, and originating-control Enter policies. Resolve method=dialog support explicitly. | P2 / 6; remaining 10 | Invalid/canceled submissions cannot navigate; exact successful payload/submitter behavior; native form and composed layouts; IME/popup/multiline keys preserved; Task 07's reset bridge remains intact. **Checkpoint B.** |
| 09 | Implement the accepted native-field capability matrix and forwarding, toggle accessible override/focus, and coherent constraint/readonly behavior. | P3 / 39 except quantity additions | Real shadow-control attributes/props and validity; naming/description references; correct generated signatures; preserve explicit action-method events. |
| 10 | Bring quantity into the shared field contract, retaining its numeric/orientation behavior and accepted empty/null/read-only policy. | P3 / 13; quantity part of 39 | Label/focus/disabled/reset/validity/native and q-form submission; bounds and original qChange timing. |
| 11 | Implement calendar/time-compatible input bounds and decimal-safe, step-aligned numeric behavior. | P3 / 14–15 | HTML/JS/type round-trip for supported types; off-grid, fractional, negative, empty, and min-relative stepping. |
| 12 | Fix toggle custom-error validity and textarea auto-owned height cleanup. | P3 / 16–17 | Error blocks/clears validation; auto-to-fixed/manual/rows transitions preserve consumer styles and reconnect behavior. |
| 13 | Fix dropdown filtered active-option keyboard flow, search naming, and disabled-while-open guarding. | P3 / 18–19 | Real keyboard/pointer/search/external-result cases; valid active descendant; no forbidden selection when disabled. |
| 14 | Validate collection shapes/items at dropdown, radio, navbar, and tabs boundaries. | P3 / 20 | Wrong-shaped JSON/direct values do not throw; valid siblings and existing IDs/normalization survive. |
| 15 | Implement quantity/editor Angular accessors, generation preparation, exports, package/consumer checks, and runtime binding. | P3 / 40 | Clean regeneration, public/packed imports, numeric nullable/reset writes, editor mode, disabled/touched/events; plain HTML/React parity. **Checkpoint C.** |
| 16 | Fix loading/action accessible names and visible focus for buttons, editor actions, and field/quantity auxiliary controls. | P4 / 21–22 | Actual browser names/focus; loading semantics and action/form behavior preserved. |
| 17 | Record sidepanel mode/destination design, then fix persistent collapse/reopening, variant/open/collapsed geometry, and valid transitions. | P5 / 26; P6 early design for 24, 41 | Every variant transition has defined state; controls remain reachable. Geometry precedes shared-modal integration; navigation implementation stays in Task 34. |
| 18 | Finalize separate poster/playback sources and implement thumbnail/reel propagation, initial maximize, and gallery navigation. | P5 / 34; P6 media checkpoint | Mixed image/video previous/next/reopen retains media/poster; preserve existing first/last boundaries; independent resource failures; types/docs agree. |
| 19 | Implement the shared modal lifecycle and integrate dialog, reel, and sidepanel drawer sequentially on Tasks 17–18's base. | P4 / 27 | Empty/first/nested/repeated modal focus; topmost keys; usable restored opener; balanced inert/scroll cleanup, disconnect and interrupted motion. |
| 20 | Fix navbar small-screen/collision focus, desktop-slot reuse, and empty branding behavior. | P4 / 28 | One live content instance; resize/close fallback focus; no empty focusable branding; valid parsed collections from Task 14. |
| 21 | Fix table source identity and pointer/keyboard selection parity; align semantics with implemented navigation. | P4 / 31–32 | Correct record after sort/filter/page; explicit replacement-data/duplicate-ID rules; nested controls unaffected; browser semantics. |
| 22 | Implement step activation/disabled policy, complete list structure, and automatic final connectors. | P4 / 35 | Dynamic items/wrappers/nested diagrams; status and actionability agree; orientation and controlled behavior preserved. |
| 23 | Implement tooltip dismissal, hover/focus persistence, collision, live reposition, and cleanup. | P4 / 36 | Real trigger/content/scroll/resize/edge cases; Escape does not also close the modal; content remains noninteractive. |
| 24 | Prototype and select tabs/panel association, then implement one supported accessible/controlled contract and its public examples/types. | P6 design + P4 implementation / 42 | Browser accessibility relationships resolve across chosen shadow/slot structure; no duplicate panel-selection store; consumer compilation. |
| 25 | Implement actual dialog slot labeling and the explicit canceled/deferred confirmation contract on the shared modal base. | P4 + P6 / 43 | Default synchronous behavior, canceled confirmation, async success/error/retry/loading, one close event, correct rendered names/relationships. |
| 26 | Derive chip removal names from actual slotted text while honoring explicit overrides. | P4 / 44 | No duplicate required label; text/slot updates and keyboard removal retain supported behavior. **Checkpoint D.** |
| 27 | Fix carousel runtime style synchronization and actual slide/content measurements. | P5 / 25 | Late loading, dynamic widths/slots, arrows/snapping/events, RTL/reconnect/transitions; relevant multi-engine tests. |
| 28 | Fix scrollable visibility, focus, small-track/reconnect/target lifecycle, and panel's single-scroller ownership. | P5 / 29–30 | Real production CSS/geometry, drag/keyboard, sticky combinations and integration; no leaked observers/styles. |
| 29 | Normalize pagination to finite valid effective integers consistently. | P5 / 33 | Fractional/nonfinite/zero/large/out-of-range inputs; finite ranges/events; defined empty data behavior. |
| 30 | Implement shared default contrast/motion, numeric/CSS sizing, thumbnail state borders, and correct RTL toast centering. | P5 / 37–38 | Author token definitions then generate; preset/state measurements; explicit overrides; reduced-motion completion/focus; size and RTL geometry. **Checkpoint E.** |
| 31 | Implement banner and section's existing layout properties with explicit responsive/slot/reading-order contracts. | P6 / part of 23 | Every enum/runtime change has observable behavior; overflow, empty/custom slots, reverse and invalid columns; actual component demos. |
| 32 | Implement the chosen accordion item/controller contract. | P6 / part of 23 | Single/multiple, initial/controlled/dynamic/disabled items, keyboard/relationships; update inventory if a new public tag is introduced. |
| 33 | Implement q-media resource rendering, source/slot precedence, kind-specific loading, and exclusive fallback using Task 18's source contract. | P6 / remaining 23 | Image/video/file; override and resource states; source/kind/reconnect cleanup; accessible native media behavior. |
| 34 | Implement sidepanel flat/grouped/tree behavior and native destination capabilities on its repaired lifecycle. | P6 / 24, 41 | Nested identities/selection persist; native modifier/context-menu links, disabled leaves, originalEvent/cancellation, separate group expansion. |
| 35 | Bound both Google provider loading routes and preserve shared attempts/namespace ownership/fallbacks. | P6 / readiness part of 46 | Script/import hangs, late resolution/rejection/retry/concurrency/provider changes/disconnect; fake clocks and no production credentials. |
| 36 | Settle the map view-state use case; implement the accepted settled event/getter, or explicitly record a justified deferral. | P6 / view-state decision part of 46 | Serializable finite state, ready/user/programmatic timing, no property/event loop; recommendation cannot be called implemented if deferred. |
| 37 | Add authored guide/public-metadata coverage tooling; finish current carousel/navbar drift and cross-guide/public inventory alignment. | P5 + touched plans / 47 | Missing coverage fails; explicit exclusions; existing guide structure preserved; no stale scaffold claims. Earlier tasks already updated touched docs. **Checkpoint F.** |
| 38 | Review integrated behavior across all current public components, frameworks, themes, and composed scenarios. Correct any interactions within the accepted scope. | All plans / integration | No missed shared-field, modal/media, navigation/slot, motion or generated-package interaction; healthy components smoke-checked when foundations changed. |
| 39 | Run final integrated verification, reconcile the ledger's 47 IDs and any added component inventory, and prepare the final reviewable delivery/report. | All plans / closure | Required checks and review pass; implementation versus deferrals/platform limitations stated accurately; no unresolved required failure marked verified. |

The two-component small fixes in Tasks 12, 28, and 31 may be returned as separate patches within the same task. The main agent can split a task further if the result becomes difficult to review; both pieces remain sequential and mapped to the same acceptance requirements. Do not combine unrelated tasks into a broad cleanup.

## Integrated verification checkpoints

At A–F, review the completed source/API/doc changes and run `bun run pr:verify` for that integrated delivery. Run relevant browser files separately; this script does not cover browser projects. Include the actual Angular runtime fixture at C, multi-browser carousel checks at E/F where available, and guide-coverage tooling once introduced. Build/generate when a focused test uses built output so it cannot test stale components.

Task 39 runs the final gate after Task 38's corrections and all remaining changes. Reuse already valid evidence only when nothing relevant changed; new corrections require the affected checks. Keep native ownership/focus/geometry and framework runtime evidence alongside unit/tooling/build results. Record unavailable engines/platform checks honestly; a missing required check blocks verified status until resolved, while unperformed optional certification remains a disclosed limitation.

Follow the prop-order skill for new/changed API declarations and distinguish intended signatures from reorder-only fingerprints. Regenerate public declarations, wrapper output, theme output, and source-adjacent API tables normally; never repair generated output with an untracked one-off edit. Keep CEF and non-browser import requirements in every relevant task. The main agent independently reviews implementation and authored guidance; the earlier plan reviews do not replace this.

## Completion and final handoff

The main agent verifies that every task and every recommendation has evidence or an explicit unresolved/deferred disposition. Report exact verified behavior, affected APIs, framework support, tests/browser engines, intentional compatibility changes, and remaining limitations. Include links to the maintained ledger, component guides, and final changed files. Deliver the implementation in the agreed checkout with a reviewable diff; publish/merge only if separately authorized.

On interruption or context compaction, resume from the ledger and current worktree. Verify any task previously in progress before dispatching the next one. Preserve prior decisions and corrections; do not restart the audit or skip ahead because a worker lost context.

## Copyable instruction for the main agent

The fresh subagent review confirmed the six plans and this queue retain all 47 recommendations and the requested worker settings. Its corrections are incorporated: reset-action bridging precedes reset-button parity checks, and media navigation checks preserve the reel's existing first/last boundaries. A final recheck found no remaining material issues. This reviews the execution design, not completed component behavior.

```text
Read D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-execution-plan.md
and execute it from start to finish. Use one GPT-6.1 Sol implementation subagent
at Extra High: model gpt-6.1-sol, reasoning_effort xhigh, fork_turns none.
Give it one bounded task at a time. Review its work, require corrections and
the specified evidence, update the execution ledger, then dispatch the next
task. Follow all six detailed plans and their accepted review corrections.
Continue through final integration and verification; do not stop after a plan,
proposal, or partial implementation. Record justified deferrals honestly.
```
