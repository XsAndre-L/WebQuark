# Task05 shared form and field contract

Status: settled contracts accepted by parent review on 3 October 2026. Quantity null/model policy remains OPEN. Intended behavior for Tasks06-15 is not implemented by Task05; behavior recommendations remain open.

Sources: [P2](component-quality-plans/02-shared-form-behavior.md), [P3](component-quality-plans/03-field-behavior-and-framework-integration.md), [execution ledger](component-quality-execution-status.md), [source inventory](../../.tmp/component-quality-task05-20261003/source-inventory.json), and [native Chrome observations](../../.tmp/component-quality-task05-20261003/native-observations.json). Current component guides remain descriptions of current behavior until their implementation tasks update them.

## One field adapter and existing state

Use existing public value/checked/code props, existing per-field initial defaults and ElementInternals. Keep quantity's existing numeric value and temporary input text. q-form stores transaction metadata only; remove its aggregate initialValues snapshot. Do not create another value/default/validity store in the form or frameworks.

Proposed internal interface, not a public package export:

```ts
type FieldKind = 'text' | 'number' | 'selection' | 'radio' | 'boolean' | 'multiselect' | 'file';
type SuccessfulEntry = readonly [name: string, value: string | File];

interface FieldSnapshot {
  name: string;
  kind: FieldKind;
  disabled: boolean;
  readOnly: boolean;
  participates: boolean;
  validates: boolean;
  modelValue: QFormValue | undefined;
  entries: readonly SuccessfulEntry[];
}

interface FormFieldAdapter {
  readonly host: HTMLElement;
  nativeOwner(): HTMLFormElement | null;
  reconcile(): void;
  snapshot(): FieldSnapshot;
  prepareAssignment(value: QFormValue): () => void;
  validate(report: boolean): boolean;
  reset(): void;
  focus(): void;
}
```

Known WebQuark fields expose this private adapter through a nonenumerable versioned Symbol.for key on their host. This allows core chunks/output modes to read the same field-owned callbacks without new public @Methods or a duplicated module-local registry. Only the explicit tag allowlist is accepted. Native fields use lightweight adapters reading their actual DOM state. Resolve/await known component readiness before using adapters; a missing adapter on a ready supported field is a diagnostic failure, not a guessed fallback.

After readiness, reconcile, snapshot and validation run synchronously. Reconciliation writes current props/constraints into the actual shadow control and ElementInternals, including synchronous name/form/disabled/readonly attribute reflection where native participation requires it. Watchers and native form callbacks use the same routine. No consumer animation-frame wait or automatic syntax formatting. Public Promise methods resolve after value, validity and participation agree.

Proposed additive methods: q-form.checkValidity()/reportValidity(): Promise<boolean>; quantity.checkValidity()/reportValidity(): Promise<boolean>; quantity.focusElement()/resetValue(): Promise<void>; editor.focusElement(): Promise<void>; toggle.focusElement(): Promise<void>. quantity.resetValue() is explicitly silent and restores its field-owned initial numeric default. Existing method/event names and default q-form.preventDefault=true remain. submitForm(): Promise<void> keeps its existing signature; user activation supplies submitter metadata internally.

## Ownership and discovery

Supported field allowlist: native input, textarea and select; q-input, q-textarea, q-dropdown, q-radio-group, q-toggle and editable q-syntax-box; quantity joins in Task10. Hidden native inputs collect but do not validate/focus. Buttons/input button-reset-submit-image are actions, not fields. Fieldsets, slots, output/meter/progress/object, arbitrary named wrappers and unknown custom elements are not field adapters.

Discover validation candidates regardless of name. Collect only successful nonempty names; whitespace/dotted/prototype-like names are literal keys, not nested paths, and must be stored as safe own properties. Walk supported light-DOM/slotted layout composition in deterministic order, deduplicate nodes, and stop at nested q-form/native-form boundaries and consumer-owned shadow roots. Exclude actual slot elements, not legitimate supported fields merely placed in a named slot.

Native ownership has priority: .form for native controls, internals.form for FACE. A control associated with a different native form is excluded from this q-form. A control actually owned by its internal form is included once. Otherwise an unowned control belongs to its nearest q-form only when it has no explicit form attribute and is outside a nested native form. An unresolved/empty form= attribute expresses external ownership and is never silently adopted.

Standard external form= associations target a native HTMLFormElement ID in the same tree, including external FACE hosts. They do not target the q-form host ID or a shadow form ID from another tree. Add optional reflected form: string props to supported custom fields for JS/framework parity with that HTML attribute. No document-wide search to invent external q-form ownership. A q-form placed inside an outer native form cannot take that native form's fields; use one owner. Dynamic insertion/removal/reassociation is rediscovered at operations, and observers/listeners disconnect cleanly.

Actions resolve their owner with the same priority. q-button links are destinations regardless of type and do not submit/reset. Submit/reset controls with disabled/loading or inherited disabling cannot activate. No blanket q-* wrapper rule for ownership or Enter.

## Canonical values and FormData

One synchronous reconciled snapshot supplies both projections. QFormValues keeps its existing string/File/boolean/number/null/array types; native text/number inputs retain string values, and quantity is numeric. FormData contains strings/Files only, in control/option order, with activated submitter entries exactly once. Disabled fields never contribute either projection. Validation is separate from successful-entry collection: unnamed required fields can block submission.

| Field state | Intended QFormValues | Intended FormData |
| --- | --- | --- |
| Enabled text/input/textarea/editable editor, including empty text | String | One entry, including empty string; editor retains exact stored source |
| One q-toggle, unique name | Boolean, including false | Checked: `true`; unchecked: no entry |
| Repeated q-toggles, otherwise unmixed name | Boolean[] in eligible control order, retaining unchecked positions | One `true` string per checked toggle; no invented option identities |
| Native checkbox | Checked option identity; lone unchecked omitted; repeated group string[] of checked identities, possibly [] | Checked identities only; preserve explicit empty value rather than replacing it with `on` |
| Native radio group | Selected successful identity, otherwise omitted | Only checked, enabled radio; option values are never rewritten |
| q-radio-group | Enabled matching option identity, otherwise omitted | Same eligible selection; unknown/disabled selection stays in value prop but contributes no entry and fails required |
| Native select | Eligible selected value; multiple is always string[], including [] | Each selected enabled option, excluding disabled optgroups/options |
| Local q-dropdown | Matching enabled option, otherwise omitted | Same eligible selection; explicit eligible empty option contributes empty string and fails required |
| externalSearch q-dropdown | Nonempty controlled selection may survive unloaded/filtered pages; known disabled selection is unavailable | Retain its existing nonempty domain value when absent from a page; custom error remains application-controlled |
| Finite quantity with representable current draft | Number | String(number), preserving zero; no Boolean/number FormData objects |
| Quantity empty/incomplete/unusable draft | Omitted until a representable number exists | No stale previous numeric entry; see quantity policy below |
| Native file input | File, or File[] for multiple/repeated entries | Every selected original File; native empty-file placeholder when none selected |
| Activated native/q-button submitter | String value in submit detail collection | Name/value once; native image coordinates use browser-compatible pointer values or 0,0 for keyboard/programmatic activation |

Ordinary repeated scalar names produce arrays in successful control order; known repeated groups keep array shape even when only one entry succeeds. Mixed names preserve every successful entry rather than overwriting another control with a toggle Boolean. Only an otherwise-unmixed toggle name gets the Boolean-state projection. Native file placeholders remain File entries (empty name/size0), not null or fabricated path strings. File inputs with multiple/repeated names retain array shape. A native empty checkbox value is a real identity.

Unavailable selections do not get fallback entries from raw props. Preserve native validity rather than imposing a new radio algorithm: the Chrome probe shows a checked disabled native radio may satisfy its native group's required rule while submitting nothing. q-radio-group retains its existing stricter enabled-option required rule. Collection agrees in both cases. The external-search dropdown exception preserves its existing paged/controlled use case without caching a second selected-value model.

Ordinary native successful-entry details (including hidden values, dirname, empty files, disabled optgroups and activated image coordinates) belong in one native adapter path. Use browser behavior where ownership permits it; do not grow a second collection algorithm in submission. native-mode serialization may normalize wire newlines; stored/editor/copy/reset strings are not rewritten.

## Type-aware setValues

setValues is a partial update: missing/unknown names are ignored. Use owned controls, including disabled/readOnly controls, for programmatic assignment. First prepare and validate every assignment; only then apply and reconcile. Bad shape/unsupported File assignment rejects with TypeError before partial mutation. No qInput/qChange or native input/change events.

- Text scalar: string, finite number or Boolean converted explicitly to text; null clears to ''. Repeated scalar fields preserve existing scalar broadcast. A provided array maps positionally and must match owned logical-field count; never flatten to its first item.
- Native radio: scalar identity selects the first matching option without changing any option value identities; null clears. q-radio-group/dropdown: string or null-to-empty string, retaining their selection availability/required rules.
- Native checkboxes: Boolean shortcut is supported for a lone checkbox; identity string or string[] selects by identities, including empty identity. Repeated checkbox groups take identities, not Boolean broadcasts. null/[] clears the group. q-toggle keeps the existing lone Boolean coercion; repeated q-toggles require a positional Boolean[] matching the owned toggle count.
- Native multiselect: string[] selects all matching identities; scalar string is a one-item selection; null/[] clears. Do not alter option identities or defaultSelected.
- Quantity: finite number assigns silently; null invokes the numeric default reset policy. Do not feed '' or Boolean values into its number prop.
- Files: null, '' or [] clears every matched file input. Arbitrary File/FileList/nonempty File[] assignment is unsupported. Files cannot be round-tripped through setValues as if they were ordinary scalar values.

Homogeneous scalar native/custom duplicates can mix. Mixed toggle/checkbox/radio-group/multiselect/file container kinds under one name collect successfully, but ambiguous setValues shapes reject rather than invent mappings outside QFormValue's flat arrays. Positional assignment targets all owned fields; successful collection can omit disabled/unavailable fields. getValues is therefore a submission projection, not a universal reversible editing model. This distinction and strict group arity need parent acceptance below.

## Defaults and one cancelable reset

Native controls retain their native live defaults: defaultValue/defaultChecked/defaultSelected and native file clearing. Do not snapshot their current values at form mount. Each custom field captures its resolved initial value/checked/source once at first initialization, before any form-level setValues; dynamically added custom fields capture their own initial state. Later property/model writes and movement between forms do not replace that default; reconnect of the same element retains it. Custom fields do not acquire native dirty-default semantics or new defaultValue props in this batch. Native reset restores all owned fields, including disabled/readOnly ones.

resetForm, native reset buttons and q-button reset use HTMLFormElement.prototype.reset on the resolved form. q-form emits one cancelable qReset during the native reset event, before restoration; qReset.preventDefault forwards to that native event. A canceled native/qReset event leaves every value and FACE callback unchanged.

Do not reset unowned slotted controls inside an early reset listener: a later native listener can still cancel. Complete that part after event dispatch, checking defaultPrevented. Let native reset call natively owned FACE callbacks exactly once; manually reset only logically owned fields lacking that native owner, once through their adapter. Reconcile afterwards; await resetForm resolves only then. No duplicate callbacks, second reset event or reapplication of a captured form-wide values record. Ordinary native forms keep their native reset event/FACE behavior; q-button supplies the missing activation bridge.

## Submission, cancellation and native transport

Every triggering native submit is synchronously canceled before any await, regardless of preventDefault prop. For button bridges, also cancel the triggering click's default action. After readiness, one synchronous reconciliation/validation/snapshot phase obtains current state. noValidate or the originating submitter's formnovalidate skips interactive validation, not ownership or successful-entry rules. Emit one qSubmit for valid/bypassed submissions with the existing details and optional additive submitter: HTMLElement | null.

qSubmit cancellation prevents native navigation. preventDefault=true remains event-only; false permits exactly one native delivery only after successful validation and uncanceled qSubmit. Listeners cancel synchronously; async application work cancels first and submits explicitly later. Do not use originalEvent.defaultPrevented as the final decision because the wrapper itself must set it. Already-canceled activation is respected. Busy/reentrant submit attempts join or are ignored by the active transaction; disconnect invalidates pending delivery.

Preserve submitter name/value and effective action/method/enctype/target/formnovalidate. q-button needs additive name/value/form/formAction/formMethod/formEnctype/formTarget/formNoValidate props with native attribute spellings (formaction, formmethod, formenctype, formtarget, formnovalidate). It emits qClick first; only after event dispatch finishes does the form-action bridge inspect qClick/original-click cancellation. One owner handles the action; qClick plus the bubbled native click cannot start two transactions.

For q-form native delivery, retain its existing internal form. Install a transaction-scoped formdata bridge before consumer handlers; replace its transport entries with the approved detail.formData entries. Apply effective submitter overrides for that transaction, invoke HTMLFormElement.prototype.submit.call(formEl) exactly once (avoiding name-shadowing and another validation/submit event), and restore temporary attributes/listeners/guards in finally. Do not add permanent hidden inputs, reparent user controls or replace navigation with fetch. Preserve Files for multipart serialization.

Synchronous qSubmit listener modifications to detail.formData are the intended transport payload; detail.values remains the original typed snapshot. Later ordinary formdata listener modifications follow native behavior. Control changes made inside qSubmit are not silently recollected; cancel/retry or mutate formData explicitly. Unintercepted getValues collection must not accidentally activate a pending transport bridge. Browser tests must intercept a local endpoint and assert actual navigation/payload, not merely spy on submit.

For q-button in an ordinary native form, a transaction-lived native submit-button proxy may be required for requestSubmit because its shadow button has no outer native owner. Copy submitter attributes and remove the proxy after the synchronous request completes. It is a submitter bridge, not a hidden value input; no persistent duplicate entries. Native SubmitEvent.submitter is this temporary native button; q-form's additive detail.submitter identifies the real author-facing control. This distinction must be documented/tested.

Keep method='dialog' in the public union. Recommended native-mode support: when the q-form host has an actual native dialog ancestor, run the same valid/uncanceled transaction and close that dialog once with submitter value; no network. Without such an ancestor, fail closed with a documented NotSupportedError (public Promise rejects; event path reports a development diagnostic), rather than silently posting or claiming support. preventDefault=true stays event-only. q-dialog's role-based overlay is not a native dialog. This choice requires parent review; native platform itself silently does nothing in the no-ancestor case.

## Enter and focus

Resolve the originating supported field from composedPath, not from layout tags. Ignore already-handled/defaultPrevented keys, IME composition/keyCode229, modifier chords, contenteditable, textarea/editor multiline input, native select, radio/toggle/button/link activation and dropdown popup/search keys. q-grid/q-stack wrappers do not suppress a text field's Enter.

For eligible single-line native inputs/q-input and the quantity text editor: submit requests one transaction with the first enabled submit action in owner order when available; a disabled default submitter blocks implicit activation as in native behavior. With no submit action, eligible text Enter submits once without submitter, retaining q-form's wrapper-level policy. focus-next moves through visible enabled focusable single-line fields; Shift+Enter reverses, and forward-at-end submits as current behavior does. none prevents only eligible single-line Enter. Controls owning Enter are untouched. ReadOnly single-line fields may still focus/submit; they cannot edit/step. No global key handler or arbitrary nested-shadow traversal.

## Current versus intended field capabilities

| Component | Current actual contract | Intended additions/repairs |
| --- | --- | --- |
| q-input | FACE; string value; label/ariaLabel/description/error; name/disabled/required/focus/check/report; min/max number only; no readOnly/hints/pattern/length props | Shared reconciliation/fieldset state; readOnly, autocomplete, inputMode, pattern, minLength/maxLength where the native type supports them; numeric/calendar min/max; form association |
| q-textarea | FACE; string; label/name/error/description/focus/check/report; auto growth; no readOnly/hints/length props | Same state/ownership; readOnly, autocomplete, inputMode, minLength/maxLength; remove only auto-owned height; form |
| q-syntax-box | FACE only participates while editable; exact code/value aliases; heading/ariaLabel/required; check/report; no focus method/readonly/length hints | readOnly editable mode, minLength/maxLength and focusElement; form/inherited disabling. No new label, pattern or autocomplete/inputMode props in this batch; heading is its existing label. Preserve literal source and explicit JSON Format |
| q-dropdown | FACE string; label/ariaLabel/description/error/focus/check/report; search; value not tied to currently loaded options; no typed disabled option | Shared state; local versus external selection policy; additive Option.disabled; labeled search/active descendant; guard disabled-while-open; form. No synthetic readOnly or unrelated text constraints/hints |
| q-radio-group | FACE string; valid enabled-option selection; label/ariaLabel/error/description/focus/check/report | Shared state/ownership/fieldset and collection boundaries; form. No readOnly/text constraints/hints |
| q-toggle | FACE Boolean checked; label/description/error; required validity only; no ariaLabel/focus method | Custom error validity, ariaLabel and focusElement; shared state/form. Keep toggle() action qChange; no invented readOnly or option-value prop |
| q-quantity-selector | Number value and qChange during typing/stepping/reconciliation; min/max/step/orientation; text spinbutton named Quantity; no FACE/name/disabled/label/validity/accessor | FACE and shared adapter; name/form/disabled/required; label/ariaLabel/description/error/labelHidden/reserveFeedback; readOnly numeric readout; focus/check/report/silent resetValue; numeric hints; numeric Angular accessor |

Exact new spellings: readOnly ↔ readonly (false); autocomplete ↔ autocomplete (undefined); inputMode ↔ inputmode (undefined; quantity may default decimal); minLength/maxLength ↔ minlength/maxlength (undefined); pattern ↔ pattern (undefined); form ↔ form (undefined, reflected); ariaLabel ↔ aria-label (null). Quantity's added name/label/description/error default undefined; required/disabled/readOnly/labelHidden default false; reserveFeedback undefined. No new editor label/error store. Editor length is the native textarea API-value UTF-16 length, including its LF presentation boundary, and never truncates supplied source.

Forward constraints/hints to the actual editing control, not just the custom host. Native constraint semantics remain, including minlength/maxlength behavior for programmatic values; the probe confirms a programmatic short value is not automatically tooShort. pattern applies only to native pattern-compatible q-input types, not textarea/editor/numeric/calendar/color. ReadOnly on q-input color is an unsupported combination; diagnose it rather than promising native color-readonly semantics. A FACE host readonly attribute itself excludes native validation, so unsupported combinations must not be advertised as fully validatable controls. Input min/max accepts number | string; preserve calendar/time strings through Stencil attributes and generated types, converting only in number behavior. Task11 uses decimal-safe min-relative step alignment for q-input; quantity step remains its existing increment amount, not a new fractional-entry rejection.

Effective disabled is explicit consumer state OR actual disabled-fieldset ancestry with first-legend exceptions. Never overwrite disabled to represent inheritance. FACE callbacks notify reconciliation; derive inherited disabling from the actual host tree to avoid retaining an obsolete callback value that also included explicit disabled. Native adapters use browser disabled semantics. Inner controls/actions and form values/validity agree immediately; re-enable restores explicit state and value. Observe legend/fieldset structure where callbacks alone are insufficient and clean up on disconnect.

ReadOnly applies only to editing input/textarea/editor/quantity. It suppresses typing/clear/Format/stepping, keeps focus/copy/successful values, and follows native read-only constraint-validation exclusion; programmatic value writes remain allowed. Dropdown/radio/toggle get no readOnly prop. Nonblank errors use custom validity where validation applies, and clearing errors restores it. Labels/description/error references resolve to actual same-shadow-root targets. Existing action-method user events remain; silent property/framework/setValues/reset writes do not manufacture them.

## Quantity and framework writes

Keep value: number = 0 and qChange<number>. Finite in-bounds user parsing updates value and qChange at its existing timing; partial/out-of-range temporary text keeps the prior numeric value while draft validity/participation reflects what is being edited. Empty optional draft is valid but contributes no value; required empty draft has valueMissing; incomplete/unusable numeric text has badInput; out-of-bounds draft has range flags. No stale prior number is submitted for those drafts. Change/blur preserves existing reconciliation: empty/incomplete → min when present, otherwise min(0,max), otherwise0, then clamp min/max; numeric reconciliation emits qChange only as currently supported. Preserve existing sanitizer and orientation/variant behavior.

Finite controlled writes retain their supplied number and report bounds validity rather than auto-clamping or emitting changes. Existing nonfinite direct values retain their fallback display without a new successful entry; applications should supply finite values. Capture a finite initial numeric reset default verbatim, even if out of bounds; a nonfinite initial value uses zero as its reset baseline without rewriting the current value before reset. Finite ordered bounds and a positive finite step are supported; invalid configurations diagnose/disable stepping rather than publishing nonfinite numeric changes or rewriting consumer props. Valid fractional typing remains accepted even with step1; step is an action increment. ReadOnly removes user stepping/editing but retains a numeric readout and successful finite value.

Quantity null handling remains an open user decision. Alternative A retains number-only value/qChange and treats null at setValues/Angular boundaries as a silent reset to the captured numeric default. A nullable Angular model would stay null while view/submission becomes that number: explicit acknowledgment is required and this projection is not accepted. Alternative B widens value/qChange to number|null and represents null as an empty view and omitted successful entry, with required validity. Its public types, event consumers, defaults and editing behavior carry compatibility risks. Neither alternative may be implemented before the decision. Existing empty-edit fallback is a separate user-edit behavior.

Configure the installed Angular output target with type:'number', event:'qChange', targetAttr:'value' for quantity. The installed template emits number-value-accessor.ts containing NumericValueAccessor, but it inherits ValueAccessor.writeValue(null)→''; configuration alone is insufficient. Add a deterministic quantity-specific write hook to prepare-generated.ts (or a checked-in hook called by that generated class), together with standalone/import/host normalization, declaration/host verification lists, public NumericValueAccessor export and source/packed consumer imports. Finite/zero writes stay numeric; null calls core resetValue without onChange. Pre-upgrade/latest-write handling must not replay an obsolete reset. No independently captured Angular field default.

Under alternative A, a CVA must not emit onChange from writeValue: null model/non-null default view and submission persist until user qChange. Under alternative B, null stays null in model/core with an empty view and omitted submission. Both need examples and actual runtime tests. The resetValue and quantity write hook proposals above are conditional and not authorized until the choice.

Add editor text accessor through configuration for q-syntax-box[editable], qInput/value. An [editable] presence selector alone is not proof of editable=true (`editable="false"` is possible); guard actual mode at runtime. Forms examples keep editable=true, using readOnly for a frozen participating field. Display-only mode without an editor binding gets no edit accessor. Switching to display mode suppresses edit notifications/native participation; applications remove its Angular forms binding when switching that view. Null text writes become ''. qInput/qChange Format must not double-notify the model; writes/reset stay silent; existing focusout touched behavior is verified rather than globally changed.

Task15 adds the smallest maintained Angular runtime fixture using installed Angular/browser tooling, plus public packed-consumer compilation. Runtime cases include initial null, setValue(null), typed model reset, zero/finite values, invalid draft, disabled/touched, actual submission/reset and editor mode. React controlled writes/events and plain HTML must share core behavior; no hidden value inputs or handwritten application event bridge.

## Proposed implementation tree and acceptance handoff

```text
src/utils/
  form-field-adapter.ts          private host protocol and snapshot types
  form-control-state.ts          shared synchronization/disabled/readonly helpers
  form-owner.ts                  owner rules shared by fields/form/actions
  form-control-validity.ts        reuse existing validity functions
src/components/inputs/form/
  form.tsx, form.types.ts
  internals/controls.ts, values.ts, enter-behavior.ts
  internals/native-control.ts, reset.ts, submission.ts
  test/                          mixed owned fields, defaults, actual navigation
src/components/actions/button/internals/form-action.ts
src/components/inputs/{input,textarea,dropdown,radio-group,toggle,quantity-selector}/
src/components/data-display/syntax-box/
stencil.config.ts
packages/angular/
  scripts/prepare-generated.ts, verify-consumer.ts, verify-angular-compatibility.ts
  src/quantity-model-write.ts     only if a maintained generation hook is needed
  src/index.ts, consumer-tests/, runtime-tests/
packages/react/consumer-tests/ and focused controlled runtime fixture
docs/components/current-contracts.md, touched guides and playground presets
```

This is a proposed tree, not files created by Task05. Consolidate tiny helpers when that preserves these boundaries; do not introduce a new framework/service/dependency just to match the tree.

| Task | Required proof after parent accepts the design |
| --- | --- |
| 06 | Allowlist/unnamed validation; nested/external owners; safe literal keys; exact successful entries incl disabled legend/options/files; typed groups and atomic setters; no first-item flattening |
| 07 | One cancelable reset/native+q-button parity; dynamic per-field defaults; exact FACE callback count; inherited versus explicit disabled/legend transitions; immediate controlled writes and awaited methods; React/native forms |
| 08 | Always synchronous cancellation; invalid/canceled zero navigation; one actual local native payload; submitter/overrides/image/Files/formdata mutation/name-shadowing; ordinary native q-button; Enter/IME/wrappers; approved dialog choice; CheckpointB |
| 09-12 | Forwarded native capability names/types/validity/readOnly; quantity contract; calendar strings and decimal input stepping; toggle error; owned textarea height cleanup |
| 13-14 | Filtered enabled active options, valid search naming/active descendant, disabled asynchronous results; nonarray/invalid item containers at dropdown/radio/navbar/tabs with valid sibling IDs preserved |
| 15 | Clean generated numeric/editor accessors, ESM/standalone/host preparation, public packed imports and strict consumers; actual Angular/React/HTML runtime null/reset/value/disabled/touched/mode/submit proof; CheckpointC |

No design row closes recommendations5-20/39-40. Actual ownership, FACE, keyboard, focus and transport need built-component browser tests; compile-only evidence cannot certify them. Firefox/WebKit/CEF/manual AT remain current gaps, not solved here.

## Parent decisions required before implementation

1. **Value/assignment compatibility:** approve omission of unsuccessful native/custom selections, stable repeated arrays/Boolean[] toggle groups, identity-aware checkbox assignment, strict positional arity and atomic TypeError for ambiguous mixed/file payloads. These correct first-item flattening/Boolean overwrites but change observable buggy legacy behavior. Scalar broadcast, missing-name no-op and the lone-toggle Boolean contract are preserved. Local unavailable dropdown selection is omitted; externalSearch retains unloaded domain values.
2. **Reset/cancellation compatibility:** approve actual qReset/qSubmit cancellation and field-owned defaults instead of the form's post-mount value snapshot. Native live defaults versus custom initial-prop defaults are deliberate; dynamic fields/reconnect do not redefine them. Default event-only submission is unchanged.
3. **Quantity/framework policy: OPEN.** Choose the number-only reset projection with explicit acknowledgment of null model/non-null view and submission, or the nullable API with its compatibility risks. No quantity API, null mapper, resetValue or accessor implementation until resolved.
4. **Dialog/additive API:** approve the explicit native-dialog close bridge and no-ancestor NotSupportedError, or choose the plan-permitted documented rejection of native dialog mode entirely. Also approve the additive form/validation/focus/capability/button metadata props/methods listed above. q-form id is not an external native form target.

Parent accepted decisions1/2 and additive standard field capabilities. Decision4 is settled: validated uncanceled submission closes an actual native ancestor dialog without navigation; unsupported placement rejects. Implementation belongs to Task08. Readonly controls remain successful; only disabled and other native unsuccessful rules omit them. Boolean-state toggle projection deliberately differs from native successful FormData. Reset must honor cancellation from every listener and avoid duplicate FACE callbacks (Task07).

Task06 is authorized only for ownership, unnamed validation, successful collection and typed assignment (P2 IDs5/7/9), excluding quantity. This dependency exception permits Task06 while decision3 remains open; Tasks10/15 await that choice. Design acceptance closes no behavior ID.

## Native and framework references

Native associations, resets and entry serialization follow the [HTML form-control infrastructure](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html); custom participation uses [ElementInternals/FACE](https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements). The Chrome observations above independently record the relevant cases; they are native design probes, not WebQuark implementation tests. ReadOnly/type applicability follows the [HTML input contract](https://html.spec.whatwg.org/multipage/input.html#the-readonly-attribute). Angular's view-write/change/touched/disabled boundary follows [ControlValueAccessor](https://angular.dev/api/forms/ControlValueAccessor), cross-checked with the actual installed generated templates and repository preparation/export scripts.
