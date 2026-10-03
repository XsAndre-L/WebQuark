# Plan 3: Field behavior and framework integration

Status: proposed implementation plan. No component changes have been implemented by this plan.

## Outcome and scope

Every supported field exposes the capabilities appropriate to its value type, forwards supported constraints to its actual control, and behaves consistently through HTML, React, and Angular. Quantity and editable code fields work without hidden inputs or custom framework adapters.

Owns F08–F13 and field/framework portions of F30; recommendation IDs **13–20, 39–40** in the [plan index](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/README.md). Depends on Plan 2's form adapter/validation/reset contract and Plan 1's empty editor. Contract design can start earlier; field implementation follows those foundations.

## Implementation locations

- [Quantity selector](D:/Dev/PurelyIT/WebQuark/src/components/inputs/quantity-selector/quantity-selector.tsx), [input](D:/Dev/PurelyIT/WebQuark/src/components/inputs/input/input.tsx), [toggle](D:/Dev/PurelyIT/WebQuark/src/components/inputs/toggle/toggle.tsx), [textarea](D:/Dev/PurelyIT/WebQuark/src/components/inputs/textarea/textarea.tsx), and [dropdown](D:/Dev/PurelyIT/WebQuark/src/components/inputs/dropdown/dropdown.tsx).
- Collection boundaries in dropdown options, radio-group utilities, navbar utilities, and tabs utilities; shared helper only if their actual normalization requirements agree.
- [Stencil framework output configuration](D:/Dev/PurelyIT/WebQuark/stencil.config.ts), Angular [generated-source preparation](D:/Dev/PurelyIT/WebQuark/packages/angular/scripts/prepare-generated.ts), [public exports](D:/Dev/PurelyIT/WebQuark/packages/angular/src/index.ts), [consumer verification](D:/Dev/PurelyIT/WebQuark/packages/angular/scripts/verify-consumer.ts), [source consumer fixture](D:/Dev/PurelyIT/WebQuark/packages/angular/consumer-tests/valid-standalone-consumer.ts), and [packed consumer fixture](D:/Dev/PurelyIT/WebQuark/packages/angular/consumer-tests/packed-consumer.ts). Include React consumer fixtures and existing field tests.

## Capability matrix to publish before adding props

| Capability | Input/textarea/editor | Dropdown/radio/toggle | Quantity |
| --- | --- | --- | --- |
| Name, effective disabled, reset, validity, focus | Required for editable fields | Required | Required |
| Visible label, accessible override, description/error association | Required | Required, adapted to group/control semantics | Required; no hardcoded shared name |
| Readonly | Where native/editable semantics are meaningful | Decide per control; do not invent checkbox/radio readonly | Supported numeric readout if editable input remains present |
| Autocomplete/inputMode | Forward only to applicable editing controls | Search hints only where relevant | Numeric hints where applicable |
| Pattern/length constraints | Text-compatible types; define editor scope explicitly | Not copied mechanically | Numeric bounds/step instead |
| Value type | Existing text/editor types retained | Selection strings or checked Boolean retained | Number retained; settle empty/invalid editing behavior |

Use current concise property names where they already mean the same thing. New properties and methods are additive proposals with documented defaults. Do not rename `orientation`, flatten native-type differences, or add capabilities that have no meaningful implementation.

## Implementation sequence

1. Record the field matrix and error/validity rules in current-contracts documentation. Decide quantity empty/invalid numeric semantics, readonly behavior, editor length constraints, and event timing before writing declarations. Preserve existing event behavior, including quantity's current `qChange` on value changes during typing/stepping; do not silently redefine it as commit-only. Document input versus commit events per field, and make any new event additive. Property assignment, framework writes, and `setValues()` must not manufacture user changes. Preserve documented action-method events such as `q-toggle.toggle()` emitting `qChange`.
2. Extend quantity using Plan 2's adapter/FACE pattern: name, explicit/inherited disabled state, configurable label/ariaLabel, description/error if the shared contract supports them, reset/validity, focus, and numeric successful entries. Label decrement/increment controls meaningfully and disable them at applicable bounds. Preserve numeric value, min/max/step, and orientation.
3. Implement every accepted matrix capability, not just its documentation. Add/forward applicable readonly, autocomplete, inputMode, minLength, maxLength, and pattern constraints to input/textarea and the agreed editable-code subset. Record exact JS names and HTML attribute mappings; do not let Stencil's automatic hyphenation accidentally replace intended native spellings. Add toggle's accessible override and `focusElement()` using the sibling naming contract. Reconcile constraint/description/error changes before validation; preserve read-only successful values while suppressing disallowed edits and stepping. Avoid a new label prop where an existing domain heading already provides the supported label.
4. Widen input min/max to accept numeric and calendar/time-compatible strings. Verify Stencil attribute parsing and generated wrapper types preserve date/time strings; parse numerically only for number behavior. Use native stepping or one decimal-safe step-aligned helper. Cover off-grid starting values, negative values, min-relative step bases, fractional steps, clamping, and unusable/empty input.
5. Apply toggle custom validity whenever a nonblank shared `error` is present, and clear it when the error clears. Keep presentation, ARIA, form participation, and native validity synchronized.
6. Track textarea's auto-owned height and remove only that owned style when leaving auto growth. Reapply rows/manual sizing and preserve consumer styling. Handle resize-mode, rows, value, and container-width changes without observer leaks.
7. Fix dropdown active-option flow. Arrow keys select the intended filtered enabled option; Enter commits it. Define active selection when query/results change, including external loading. When disabled while open, close safely and guard typing, keyboard, pointer, option selection, and deferred results. Give the search field a label tied to the field and valid same-root active-descendant references.
8. Validate collection containers and item shapes before mapping them. Wrong-shaped JSON and invalid direct prop values produce the same documented safe fallback; filter invalid items without discarding valid siblings where appropriate. Do not silently coerce arbitrary objects into labels. Preserve existing normalization and stable IDs for valid items. Apply at dropdown, radio-group, navbar, and tabs boundaries with useful development diagnostics.
9. Add quantity numeric and editable syntax-box Angular value accessors through the output-target configuration, then regenerate wrappers normally. Extend prepare-generated.ts for the emitted numeric accessor file's standalone/import/template-safe event normalization; update Angular public exports, verification artifact/host-expression lists, and source/packed consumer imports. Do not stop at a configuration-only change. Settle Angular nullable-model/reset writes explicitly: the generic accessor converts null to `''`, which must not silently replace quantity's numeric value. Either provide an adapter mapping nullable writes to the documented number-only reset policy, or deliberately review a nullable field API; do not widen types accidentally. Ensure syntax display mode does not claim edit participation. Verify input/change timing, writes, disabled state, reset, and touched/blur behavior; a generated class or compilation alone does not prove an accessor works.
10. Update field guides and playground examples alongside each change. Publish the capability matrix, explicit numeric/calendar constraints, and working Angular/React form examples.

## Acceptance checks

- Quantity: two differently labeled quantities; native and q-form submit/reset; explicit and inherited disabling; min/max/step; focus; invalid/empty edit policy; numeric Angular model updates without a manual event bridge.
- Input: date, time, datetime-local, month, week, number bounds round-trip through HTML and generated types; decimal/off-grid stepping returns the intended valid value without long floating-point display artifacts.
- Toggle: nonblank error blocks validation/submission; clearing it restores validity and associations.
- Capability forwarding: HTML attributes and JavaScript props reach the real shadow control with the declared names/types; runtime readonly/constraint changes suppress edits and stepping, retain successful values, and update check/report/submit validity. Test text pattern/length constraints, autocomplete/inputMode hints, description/error references, toggle accessible override and focus, and generated wrapper signatures. Do not claim hints guarantee a particular browser keyboard/autofill UI.
- Textarea: auto-to-fixed/manual and rows changes restore expected geometry without removing consumer-owned styles; reconnect stays functional.
- Dropdown: search, ArrowDown/Up, Enter, Escape, disabled option skipping, asynchronous results, and disabled-while-open do not emit forbidden selections. Assert actual active-descendant target/name.
- All four collection consumers: invalid JSON, null/object/number/string containers, invalid items, and valid mixed collections never throw; valid public inputs retain behavior.
- Angular: clean generation and packed-consumer compilation import/use the emitted numeric accessor from the public package; its ESM imports/host expressions are normalized. Runtime two-way quantity/editor binding covers finite numeric writes, zero, initial null, `setValue(null)`, typed `number | null` model reset, invalid editing, disabled/touched, and resulting submitted values. Enforce the chosen numeric empty policy without `''` leaking into a number-only field. React: controlled writes and user events stay coherent. Plain HTML fields retain the same validation and value behavior; explicit action methods retain their documented events.

Use unit tests for normalization/arithmetic, built-component browser tests for keyboard/geometry/FACE, and a framework runtime fixture for accessors. Add the smallest maintained runtime harness if current consumer checks only compile. Run the shared verification gate.

## Dependencies and completion

Plan 2 owns shared form behavior; Plan 4 owns general focus styling and action names. This plan owns dropdown's field naming/active descendant model and collection boundary fixes, including navbar/tabs helpers. Plan 4 should integrate its navbar/tabs work after these helper changes. Plan 6 owns navigation/panel API design, not field changes.

Complete when the supported matrix matches actual controls and generated types, each acceptance scenario has evidence, framework accessors work at runtime, and no examples require redundant hidden fields or duplicated labels to use the supported contract.
