# Dropdown search mode implementation plan

Status: implemented after independent review. Library and both wrappers build; focused unit/tooling and real Chromium dropdown/form regressions pass. Customer Assignments/Hierarchy migration and official consumer snapshot activation are complete; final affected app checks are recorded in the task handoff.

## Accepted review refinements

- Public names are default/menu. Existing qSearch is immediate: emit once per completed user edit, suppress IME intermediates; opening/cancel/reset emits none, genuine user clear emits an empty string.
- Clearing committed value clears the selected-label cache. Local option removal preserves existing invalid-selection policy without synthetic qChange. Remote replacement retains cache only for the same committed value; external value changes never display stale labels.
- Actual active input/control anchors validity, focusElement/reportValidity, disabled state and floating positioning; remove button-only assumptions.
- Option commitment emits qChange and qSelect exactly once each. Draft edits emit neither. No new readonly API; preserve actual supported disabled behavior.

## Public contract

Add `searchMode: 'default' | 'menu' = 'default'` in the features/behavior prop group next to `searchable`. It applies only when searchable is true. Non-searchable dropdown behavior remains unchanged. Default mode uses the main editable combobox field to filter results and never renders a second menu search field. Menu mode preserves the current button trigger and search field in the menu. Values remain option-only; typing never creates or commits a value.

## State and interaction

Keep committed value/selected option label distinct from draft search query. On focus/open, show the selected label until the user edits; editing updates query and opens/filters results without qChange. Choice commits value and emits existing qChange once. Escape, Tab, outside click and focus leaving without choice close the popup, clear the draft and restore selected label. Preserve a selected label across external search result replacement; an external value/options change must reconcile the label without treating a query as a selection. Define behavior for clearing value and for a previously selected option removed by local options updates.

Input owns keyboard focus and active-descendant in default mode. Arrow keys open and move enabled options; Enter commits only an active option; Escape cancels; Tab retains natural navigation. During IME composition do not interpret Enter/arrows as selection or prematurely commit; filter and emit search from the final composed input. Preserve current disabled/readonly contracts (inspect actual supported props, add no unapproved input). Pointer option activation must survive blur timing without preventing ordinary outside-focus movement. Switching mode/searchable while open cancels draft and closes/reconciles focus safely.

Use existing externalSearch/qSearch and load-more logic. Draft input emits immediate qSearch under the established event contract (no debounce), retains selected remote label and supports empty/loading/more states. Local mode filters existing options. Preserve scroll, popup portal/positioning, option highlighting and current spacing regression fixes.

## Rendering, accessibility, forms

Inspect dropdown source and existing shared form helpers before editing. Use native input with combobox role, aria-expanded/controls/autocomplete/activedescendant, existing visible/hidden label and aria-label resolution. Keep popup one listbox and options semantic; menu mode keeps existing semantics. Internal editable draft has no submitted name; existing committed-value form association/hidden input remains authoritative. Preserve required/validation/reset behavior and supported form submission paths. No free-text values or duplicate named fields.

## Ordered implementation and evidence

1. Independent reviewer resolves edge cases and accessibility before source edits; sole implementing agent applies accepted decisions.
2. Capture current prop fingerprint, deliberately classify searchMode next to searchable in prop-order config, implement minimal state/render changes and existing keyboard/blur integration.
3. Extend focused unit and real Chromium tests: both modes, unchanged nonsearchable, filtering without commit, choice, Escape/blur/Tab restoration, keyboard and IME, option pointer blur race, disabled/readonly, mode toggles, externally selected labels/results, qSearch debounce and pagination/loading, accessible names/active descendant, native form committed values/reset. Preserve existing dropdown spacing tests.
4. Update component guide/source README, playground knobs and explicit menu/default examples. Run prop-order/tooling checks, focused tests and packages:build for generated declarations plus Angular/React wrappers.
5. Refresh InStoreFocus through official frontend wq-switch build/check. Customer Assignments and both Hierarchy selectors use searchable with the new default; no duplicate search UI or moved controls. Focused affected tests, Field Manager lint/build; report real browser evidence separately from mocked Angular tests.

Temporary evidence belongs in build/.tmp/dropdown-search-mode (frontend equivalent for consumer checks). Preserve unrelated work, especially webquark-serve.js and existing dropdown CSS/browser spacing tests. No commits, publishing or unrelated server restarts.
