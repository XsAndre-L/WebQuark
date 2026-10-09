# Plan 2: Shared form behavior

Status: proposed implementation plan. No component changes have been implemented by this plan.

## Outcome and scope

Developers can validate, collect, submit, reset, and assign values through one predictable form contract. Slotted layout wrappers do not break ordinary buttons or Enter behavior. Public methods are safe to chain immediately, and disabled fieldsets disable their fields effectively.

Owns F03–F07; recommendation IDs **5–12** in the [plan index](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/README.md). Establish this contract before Plan 3 adds field capabilities. Form work can start while Plan 1 works on icon/code rendering; syntax-box edits must follow Plan 1.

## Implementation locations

- [Form component](D:/Dev/PurelyIT/WebQuark/src/components/inputs/form/form.tsx), [control discovery](D:/Dev/PurelyIT/WebQuark/src/components/inputs/form/internals/controls.ts), [value handling](D:/Dev/PurelyIT/WebQuark/src/components/inputs/form/internals/values.ts), [Enter policy](D:/Dev/PurelyIT/WebQuark/src/components/inputs/form/internals/enter-behavior.ts), and [form types](D:/Dev/PurelyIT/WebQuark/src/components/inputs/form/form.types.ts).
- [Shared validity](D:/Dev/PurelyIT/WebQuark/src/utils/form-control-validity.ts), all existing form-associated fields, editable syntax-box, and [button](D:/Dev/PurelyIT/WebQuark/src/components/actions/button/button.tsx).
- Extend form unit/browser suites and field/button suites; add behavior tests for discovery, typed assignment, event ordering, and inherited disabling.

## Shared contract

1. **Ownership/discovery:** identify supported native fields and WebQuark field adapters, including unnamed validatable fields. Exclude arbitrary named wrappers, named slots, nested form contents, read-only syntax displays, and controls owned by another form. Define explicit external form association separately; do not accidentally claim it through a descendant query.
2. **Successful values:** build wrapper values and FormData from the same canonical control state. Validate eligible unnamed fields but submit only successful named controls. Honor inherited disabling, unchecked native checkboxes/radios, unavailable selections, selected options, and file values. Preserve the existing lone-toggle Boolean value contract while defining repeated toggle/checkbox groups explicitly. FormData continues to use browser-compatible string/File entries rather than Boolean entries.
3. **Assignment/reset:** assign according to type. Radio/checkbox option values are identities, not writable group state. Preserve multiselects and repeated names; document scalar-versus-array rules and missing-name behavior. Arbitrary File assignment is unsupported; clearing a file control is supported. Capture/reset each field's declared default, including dynamically introduced fields. Both reset buttons and `resetForm()` use one cancelable path with one reset event.
4. **Submission:** synchronously cancel the triggering submit, reconcile current field state, validate, emit the documented event, and only then perform native submission when requested. Respect cancellation, submitter data/overrides, and the submitted FormData. Use a guarded transaction to prevent recursive or duplicate submission. Invalidity or cancellation must prevent navigation.
5. **State synchronization:** `await setValues()` resolves only after fields' values, validity, and form participation agree. Public validation/submission also reconcile current controlled props, including direct property assignment. Effective disabling combines explicit state and inherited form disabling without rewriting the consumer's property.

Before implementation, settle and document the exact repeated-value rules, event cancellation order, reset baseline policy, and native submission bridge. These are proposed decisions, not pre-existing guarantees. Explicitly resolve `method="dialog"`: the internal form cannot silently promise native dialog submission outside a native dialog; preserve the public type while either supporting a tested path or documenting/rejecting the unsupported configuration.

## Implementation sequence

1. Define a small internal adapter interface for validity, effective disabling, successful entries, assignment, reset, and focus. Prefer existing ElementInternals/native behavior where ownership permits it; do not create a second divergent field state store.
2. Separate validation discovery from collection discovery. Build ownership-aware traversal across the supported slotted composition and layout wrappers. Add native/custom mixed-form fixtures before replacing `[name]` discovery.
3. Implement canonical collection and type-aware assignment. Explicitly cover duplicate names, radio groups, multiselect, lone and repeated toggles, empty/unavailable selections, and file clearing. Never flatten arrays to the first item implicitly.
4. Unify reset handling and cancellation, including native and WebQuark reset-action bridging in q-form and ordinary native-form q-button reset behavior. Avoid duplicate native/FACE reset callbacks and restore paths. Verify button/method parity, defaults, and effective validity update before the public method resolves.
5. Implement the submission transaction. Choose and test how the internal native form receives slotted/custom successful entries without duplicate hidden inputs, leaked stale values, or overwritten submitter fields. Preserve action/method/enctype/target and submitter overrides where supported. Avoid `form.submit` name shadowing and avoid validating twice through a recursive bridge.
6. Complete native and WebQuark submit-control bridging in `q-form` and ordinary native `<form>` support for `q-button`, building on the reset-action bridge from step 4. Enter decisions follow the originating field: ignore IME composition and multiline editing, preserve component-owned popup keys, and allow layout wrappers. Cover submit, focus-next, and none without double activation.
7. Implement inherited disabling and synchronous state reconciliation in input, textarea, dropdown, radio-group, toggle, and editable syntax-box. Preserve explicit disabled props, ensure newly re-enabled fields restore their correct state, and make unavailable radios consistent in native and wrapper collection.
8. Update the form guide and each touched field's participation/reset documentation. Include a composed form example with native/custom controls and immediate setValues/submit chaining.

## Acceptance checks

| Scenario | Required result |
| --- | --- |
| Unnamed required field; empty form with actions slot | Invalid field prevents submission; empty collected values are `{}`. |
| Disabled fieldset, including its first-legend exception and explicit disabled child | Native-equivalent effective disabling; no unintended submitted entries; explicit state retained on re-enable. |
| Repeated names, radio options, multiselect, toggles, unavailable radio value, file clear | Documented typed values; matching successful FormData entries; option identities preserved. |
| Native reset button, q-button reset, resetForm, canceled reset | Same restored defaults and event count; cancellation leaves values unchanged. |
| Immediate setValues then check/report/submit; direct controlled prop update then submit | Current value is validated/collected without consumer animation-frame waits. |
| Invalid/canceled/valid native-mode submission | Zero navigation for invalid/canceled; one valid submission with exact entries and submitter overrides. Use an intercepted local endpoint, not external navigation. |
| Native/q-button submit under q-grid/q-stack; Enter policies | One expected action; IME and textarea Enter remain intact; popup keys are not stolen. |
| Nested forms, controls belonging elsewhere, disconnect/reconnect, dynamic controls | Ownership is respected; resources/events are cleaned up; defaults stay coherent. |

Run helper/field/form tests and built-component browser tests for native ownership, FACE, and keyboard behavior. Include a React controlled-prop fixture and a plain HTML native-form fixture. Run the shared gate after integration.

## Dependencies and completion

This plan owns form contracts and shared adapters. Plan 3 extends those adapters for quantity and framework accessors; it must not introduce a second collection/reset contract. Plan 4 changes button/editor names after action/form edits. Plan 1 owns source preservation. No component category or orientation changes are included.

Complete when each accepted contract has implementation, regression evidence, guide examples, and consistent native/custom participation. Native navigation and reset must be proven in the browser, not inferred from synthetic event-only tests.
