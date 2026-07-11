# WebQuark full component audit — 2026-07-11

## Scope

This audit covers all 26 `q-*` Stencil components, their public types, internal helpers, styles, tests, generated API pages, authored guides, component index, and the InStoreFocus consumption path. It focuses on missed performance opportunities, UX, accessibility, developer experience, and documentation accuracy.

The findings below are recommendations, not silent API decisions. Items marked **confirmed defect** are observable contradictions or broken behavior. Items marked **enhancement** need product/API judgment before implementation. Breaking changes should be released deliberately and reflected in Angular/React proxies.

### Implemented during this review

- `q-button` now has a leading `icon` shorthand, keeps slot overrides, includes the shortcut in icon-only detection, and warns once per instance in development when an icon-only control has no accessible name.
- `q-dropdown` accepts strings as concise options; `q-navbar` and `q-sidepanel` accept strings as concise navigation items. Each string normalizes to a matching label and value without removing the advanced object forms.
- Explicit `aria-label` forwarding was added to `q-input`, `q-textarea`, `q-dropdown`, `q-navbar`, `q-sidepanel`, and `q-dialog`. The existing `q-icon` label contract remains unchanged.
- Generated API pages, declarations, Angular proxies, playground specifications, authored guides, and tests were updated. Documentation examples now prefer boolean-attribute shorthand and omit default-valued booleans where practical.

## Priority model

- **P0:** security or data-integrity risk; address before broader adoption.
- **P1:** accessibility, core behavior, or public-contract defect.
- **P2:** material UX, performance, or developer-experience improvement.
- **P3:** consistency or maintainability refinement.

## Highest-priority findings

1. **P0 — `q-syntax-box` escaping can permit raw markup into `innerHTML`.** `escapeHtml()` returns the entire string unchanged if it contains any `&lt;`, `&gt;`, or `&amp;`. Mixed input such as an encoded fragment followed by raw markup therefore bypasses escaping for the raw fragment. Always escape raw input exactly once, then highlight the escaped representation; add adversarial tests for mixed encoded/raw input.
2. **P1 — required form-associated controls do not establish `ElementInternals` validity.** `q-input`, `q-textarea`, `q-toggle`, and `q-syntax-box` expose `required`, but only call `setFormValue`; they do not call `internals.setValidity`. The internal shadow field cannot be assumed to enforce the outer form’s validity. `q-dropdown` has no required/error contract. Build one shared form-control helper that synchronizes value, disabled state, reset state, and validity.
3. **P1 — `q-scrollable` auto-hide state classes do not match the CSS selectors.** Runtime applies `is-scrolling`/`is-dragging` to `<Host>`, while CSS expects `.q-scrollable-host.is-scrolling`/`.is-dragging`. Scrolling therefore does not reveal the custom track as designed, and `autoHide=false` has no always-visible rule.
4. **P1 — `q-sidepanel.mode` is a no-op.** The public `flat | grouped | tree` property is never read during rendering. Either implement the three contracts or remove/deprecate the property. Collapsed hidden navigation also leaves focusable descendants under `aria-hidden`; use `inert` or remove their tab stops.
5. **P1 — pending `q-step-diagram-item` controls still activate.** The item announces `aria-disabled=true` but pointer, Enter, and Space still emit `qItemClick`.
6. **P1 — custom dialog headers could leave `q-dialog` unnamed (accessible-name portion resolved).** `ariaLabel` now explicitly names custom-header dialogs and takes precedence over `dialogTitle`. Capturing the previously focused element for dialogs initially rendered open remains outstanding.
7. **P1 — no shared reduced-motion policy exists.** Continuous spinners/pulses and animated overlays ignore `prefers-reduced-motion`. Add a global policy and component-specific exceptions where motion conveys state.
8. **P2 — repeated icon fetch/sanitize work scales poorly.** Every `q-icon` instance independently resolves, fetches, parses, and sanitizes identical SVGs. Add a shared promise/result cache and abort superseded/disconnected requests.
9. **P2 — authored and generated documentation had diverged.** The authored index listed 20 components, only 24 authored pages existed, and many API tables omitted newer props/events/methods. This documentation change establishes a canonical-source rule, exact 26-component index, missing guides, current-contract reference, and fuller Stencil metadata.
10. **P2 — the documented test commands are unreliable on Bun/Windows.** `bun test` invokes Bun’s native runner without the Stencil DOM environment and scans built output; `bun run test` currently reaches an `npx stencil build` call that cannot resolve Bun’s Windows shim. Standardize a cross-platform test entry point and make CI use exactly that command.

## Cross-cutting opportunities

### Form control contract

Create a small shared form-associated helper for value/reset/disabled/validity behavior. Standardize `name`, `disabled`, `required`, `error`, `errorMessage`, `ariaLabel`, `focusElement()`, and the meaning of `qInput` versus `qChange`. Preserve checkbox-like omission semantics for unchecked toggles.

### Localization and consumer text

Many accessible and visible strings are hard-coded: search, empty/loading text, increment/decrement, carousel navigation, panel/navigation labels, lightbox controls, and tooltip status. Add label props or a library-level messages provider. Defaults can remain English.

### Motion and rendering cost

Add `prefers-reduced-motion` handling, replace `transition: all` with explicit properties, and avoid artificial delays that imitate remote loading. For scroll/resize paths, batch DOM reads before writes and store/cancel animation-frame callbacks.

### Controlled-state consistency

Mutable props currently mix controlled and uncontrolled patterns. Document which user actions mutate `value`, `checked`, `open`, `collapsed`, selection, and sort state, and which events fire only for user actions versus all changes. Avoid events that silently omit programmatic updates unless explicitly documented.

### Documentation lifecycle

Generated source-adjacent API pages are canonical. Authored guides should explain behavior, usage, accessibility, styling, platform constraints, examples, and limitations without embedding full source snapshots. A CI documentation check should compare the `@Component` inventory against both indexes and authored guide filenames.

## Component-by-component findings

### 1. `q-button`

- **P2 confirmed defect:** `href` checks only `!== ''`; whitespace-only values render an anchor, unlike `q-chip`, which trims. Normalize destination checks across link-capable components.
- **P2 DX:** `download` is typed as `string`, although its JSDoc says “filename or boolean download hint.” Align the type and documentation.
- **Resolved UX/a11y:** development builds warn once per instance for icon-only buttons without visible text or `ariaLabel`; icon names are never inferred as names.
- **P3 performance:** slot scanning queries the whole host on each relevant slot change. The cost is small, but assigned-node inspection would be more precise.
- Documentation corrected: shape/layout, safe `rel`, accessible label, focus/blur events, slot and spinner-part metadata.

### 2. `q-chip`

- **P2 a11y/DX:** removable chips cannot derive the remove action name from arbitrary slotted text. Add `removeLabel` or robust assigned-text derivation; keep `label` as the stable event value.
- **P2 UX:** selected anchors always expose `aria-current="page"`, which is not correct for every tag/filter use case. Add a selected semantics option or reserve `aria-current` for navigation variants.
- **P3 API:** clarify that `clickable` and `href` are ignored when `removable` to prevent nested controls; the current implementation is sound.
- Documentation corrected: focus/blur events, safe link behavior, removable interaction model, and all shadow parts.

### 3. `q-link`

- **P2 DX:** formally deprecate `url` in TypeScript/JSDoc and publish a removal window; it duplicates `href`.
- **P2 a11y:** add `ariaLabel` for icon-only/custom-slot links and document the requirement.
- **P3 consistency:** use the same whitespace-normalization and target/rel/download types as `q-button` and `q-chip`.
- Documentation corrected: full destination precedence, `rel`, `download`, fallback `label`, events, slots, and parts.

### 4. `q-card`

- **P1 a11y enhancement:** an interactive card uses a focusable `div role=button`. Prefer a native activation element or explicitly document nested-control restrictions and click ownership.
- **P2 UX:** add `disabled` and an accessible-name option if interactive cards are a supported first-class pattern.
- **P3 API:** numeric elevation aliases prolong duplicated CSS and type complexity. Deprecate them before removal.
- Documentation verified and supplemented with the interactive/nested-control limitation.

### 5. `q-carousel`

- **P1 a11y:** unavailable arrows use only `aria-disabled`; they remain focusable buttons. Use the native `disabled` attribute and keep visual state aligned.
- **P1 a11y enhancement:** expose `ariaLabel`, give the indicators group semantics, and document slide naming/`aria-roledescription` expectations.
- **P2 UX:** implement keyboard previous/next behavior on the focused viewport, not only indicator dots.
- **P2 motion:** smooth programmatic scrolling should honor reduced motion.
- **P2 DX:** observe relevant child/content mutations or clearly require `updateLimits()` after non-resize layout changes.
- Documentation corrected: `slideTo()`, `updateLimits()`, event detail, repeat behavior, and consumer slide responsibilities.

### 6. `q-form`

- **P1 correctness:** validity depends on child controls correctly setting `ElementInternals` validity; current required controls do not.
- **P2 DX:** emit/retain a `SubmitEvent` and submitter where supported; the fallback currently dispatches a generic `Event`.
- **P2 DX:** expose `checkValidity()` and `reportValidity()` methods.
- **P2 state:** the `componentDidLoad` initial-value snapshot may precede asynchronous consumer value assignment. Define when reset baselines are captured and provide an explicit baseline method if necessary.
- **P3 maintainability:** keep the q-button shadow-boundary bridge, but centralize duplicate named-control traversal and value conversion.
- Documentation corrected: `enterBehavior`, four public methods, q-button bridging, value encoding, slots, and event detail.

### 7. `q-navbar`

- **Resolved performance:** item input is normalized once per render and reused by both responsive navigation branches.
- **P1 mobile UX/a11y:** opening the menu does not move focus into it; closing via Escape/outside click does not explicitly restore focus. Add focus policy and `aria-hidden`/`inert` alignment.
- **Partially resolved DX:** `ariaLabel` configures both responsive navigation labels. Per-item `rel`/`download` and stable keys remain outstanding.
- **P2 composition:** a custom `brand` slot is always wrapped by an anchor, which can produce nested links. Provide a consumer-owned brand mode or document the restriction.
- Documentation corrected: logo/mobile labels, edge/mobile modes, item icon accessibility, and both events.

### 8. `q-panel`

- **P2 a11y:** `ariaLabel` names both the outer section and a derived inner scroll region. Review duplicate announcements and consider separate `ariaLabel`/`scrollAriaLabel` props.
- **P2 UX:** sticky header/footer props have meaning only with the component’s scroll ownership; warn when used without `scrollable`.
- **P3 DX:** the empty-slot handling is a good reference pattern and should be shared with other structural components.
- Documentation corrected: `ariaLabel`, scrolling semantics, empty regions, and sticky behavior.

### 9. `q-scrollable`

- **P1 confirmed defect:** runtime host classes and CSS state selectors do not match; auto-hide reveal is broken during scroll.
- **P1 confirmed defect:** `autoHide=false` lacks a CSS rule that keeps the custom track visible.
- **P2 correctness:** multiple instances targeting the same external element share an attribute, but disconnecting one removes it for all. Reference-count or uniquely scope external target styling.
- **P2 resilience:** invalid `target` selectors can throw from `querySelector`; fail safely and emit a useful diagnostic once.
- **P2 performance:** `componentDidUpdate()` forces scrollbar measurement after every state update, including scroll-driven updates. Restrict measurement to size/content changes.
- **P2 DX/a11y:** expose labels for the viewport and scrollbar; explicitly document vertical-only custom mode.
- Documentation corrected: methods, target semantics, mobile/native behavior, limitations, and current state defect.

### 10. `q-sidepanel`

- **P1 confirmed defect:** `mode` is never consumed.
- **P1 a11y:** hidden-collapse mode leaves focusable navigation descendants under `aria-hidden`. Apply `inert` or remove tab stops while hidden.
- **Resolved a11y:** `ariaLabel` names drawer dialogs, persistent panel regions, and navigation regions.
- **P2 API/UX:** `SidepanelItem` lacks disabled and native link fields; all navigation is a generic `div role=button` and requires consumer routing.
- **P2 state:** watch `expanded` changes after initialization and define how externally replaced item trees retain expansion.
- **Partially resolved localization:** navigation and drawer naming is configurable through `ariaLabel`; close-on-Escape/backdrop policy props remain outstanding.
- Documentation corrected: collapse props/event, three variants, no-op mode limitation, slots, and all parts.

### 11. `q-toolbar`

- **P2 semantics:** a named toolbar currently receives `role="group"`; evaluate `role="toolbar"` and the associated arrow-key/roving-focus expectations.
- **P3 layout:** consider collapsing empty start/end regions or document how their flex sizing behaves.
- **P3 DX:** align edge/sticky/compact token naming with `q-navbar` through shared layout tokens where practical.
- Documentation verified and supplemented with consumer-owned focus/order responsibilities.

### 12. `q-input`

- **P1 correctness:** synchronize required/custom-error state into `ElementInternals.setValidity`.
- **Partially resolved DX:** explicit `ariaLabel` forwarding is implemented. `autocomplete`, `inputMode`, `pattern`, `minLength`, `maxLength`, and `readOnly` remain outstanding.
- **P2 UX:** the consumer suffix disappears while clear is visible. Support simultaneous suffix + clear or document the replacement policy prominently.
- **P2 localization:** expose clear, password visibility, and numeric step button labels.
- **P3 maintainability:** share numeric parsing/clamping with `q-quantity-selector` and the form lifecycle with sibling fields.
- Documentation corrected: `name`, click event, methods, suffix behavior, form/reset behavior, and numeric controls.

### 13. `q-textarea`

- **P1 correctness:** synchronize required/custom-error state into `ElementInternals` validity.
- **P2 API consistency:** add the shared `size` contract or explicitly explain why textarea density is controlled differently from input/dropdown.
- **Partially resolved DX:** explicit `ariaLabel` forwarding is implemented. `maxLength`, `minLength`, `readOnly`, and `autocomplete` remain outstanding.
- **P2 performance:** track/cancel scheduled animation frames and avoid duplicate auto-grow recalculations from the input handler plus value watcher.
- Documentation corrected: `name`, click event, methods, resize interactions, form/reset behavior, and accessible-name fallback.

### 14. `q-dropdown`

- **P1 a11y:** the search input is nested inside the element with `role=listbox`; restructure into a combobox controlling a sibling listbox, with options as valid descendants.
- **P1 form UX:** add required, error, error-message, validity, and disabled-option contracts.
- **P2 performance:** options are repeatedly JSON-parsed, filtered, and sliced across getters and render/event paths. Normalize once per property/search change.
- **P2 UX confirmed issue:** local incremental rendering adds an artificial 800 ms loading delay even though no I/O occurs. Append immediately or schedule through an animation/idle frame without fake latency.
- **Partially resolved localization:** `ariaLabel` configures the trigger and listbox name. Search placeholder, empty text, and loading text remain outstanding.
- **P2 DX:** add disabled options and stable option IDs; document that Enter in search selects the first result.
- Documentation corrected: `name`, focus/blur/click events, form/reset and keyboard behavior, option shape, and limitations.

### 15. `q-quantity-selector`

- **P1 contract gap:** make the control form-associated and add `name`, `disabled`, `required`, label/error state, reset behavior, and focus method.
- **P2 input UX:** add `inputmode="decimal"`, configurable accessible labels, and clearer `qInput` versus committed `qChange` semantics.
- **P2 validation:** define behavior for `min > max`, zero/negative/non-finite `step`, and programmatic out-of-range values.
- **P3 maintainability:** reuse numeric helpers with `q-input`.
- Documentation corrected: all events, keyboard behavior, current form limitation, and bound reconciliation.

### 16. `q-toggle`

- **P1 correctness:** required checked-state validity is not set through `ElementInternals`.
- **P2 API consistency:** align error state with input/textarea (`error` state plus `errorMessage`) and reflect a stable state attribute rather than reflecting message text.
- **P2 event DX:** keyboard activation fabricates a `MouseEvent` for `qClick`; prefer an activation-detail type that accurately represents pointer or keyboard origin.
- **P2 a11y:** add explicit `ariaLabel` support for icon-only toggles.
- Documentation corrected: `name`, focus/blur/click events, `toggle()`, boolean/FormData encoding, and reset behavior.

### 17. `q-data-table`

- **P1 a11y:** `role=grid` implies a composite keyboard interaction model, but every clickable row is independently tabbable and Arrow-key grid navigation is absent. Either implement grid navigation or retain native table semantics without claiming grid behavior.
- **P1 UX:** Space on a selectable clickable row emits row click and toggles selection, while pointer row click does not toggle selection. Make activation semantics consistent.
- **P1 data integrity:** index fallback keys are unstable after local sorting; object keys stringify to collisions such as `[object Object]`. Require/warn on stable primitive keys for selection/sorting.
- **P2 performance:** no virtualization exists despite older “large dataset” claims. Memoize parsed/model data and recommend pagination/windowing above a documented threshold.
- **P2 a11y:** expose table label/caption, `aria-busy`, and status/live-region text for loading and empty states.
- **P2 DX:** preserve generic row types through event detail types and document callback props as property-only inputs.
- Documentation corrected: row actions, row click policy, sorting props/event/modes, search non-filtering behavior, stable-key and virtualization limitations.

### 18. `q-syntax-box`

- **P0 security:** remove the mixed-encoding escape bypass described above and add XSS regression tests.
- **P1 a11y:** format/copy icon-only q-buttons lack `ariaLabel`; tooltip descriptions do not reliably provide a control name.
- **P1 correctness:** set required validity through `ElementInternals` in editable mode.
- **P2 performance/DX:** retire the bidirectional mutable `code`/`value` watcher loop through a formal deprecation and single canonical state path.
- **P2 UX:** provide an explicit editor accessible label and configurable Tab behavior/indent size.
- **P2 performance:** avoid formatting external values on every watcher update unless explicitly requested; regex highlighting can be memoized by code/language.
- Documentation corrected: editable/form contract, name/value alias, events, `scrollToBottom()`, keyboard model, supported languages, and security limitation.

### 19. `q-circular-progress`

- **P1 correctness:** `NaN`/non-finite `value` is not normalized by `Math.min/Math.max` and can produce invalid SVG/ARIA values. Normalize finite input first.
- **P2 a11y/localization:** replace the generic default label with a required or context-aware accessible name policy; document visible label versus progress value semantics.
- **P2 motion:** indeterminate rotation must honor reduced motion while remaining perceptible.
- Documentation corrected: `ariaLabel`, clamping, indeterminate ARIA behavior, and size presets.

### 20. `q-step-diagram`

- **P1 a11y:** the container uses `role=list`, but step items do not expose `listitem` semantics. Add semantics at the item host/wrapper.
- **P2 composition:** define whether wrapped/nested items are supported; the propagation helper first targets direct slotted children and only falls back to a broad query when none are direct.
- **P2 DX:** consider a controlled current-step/value contract if application navigation routinely needs it.
- Documentation corrected: `ariaLabel`, layout propagation, required child type, and sequence semantics.

### 21. `q-step-diagram-item`

- **P1 confirmed defect:** suppress pointer and keyboard activation while pending/disabled.
- **P1 semantics:** expose `role=listitem` while retaining a separate native button or activation element.
- **P2 event DX:** include original event, status, and a consumer value/id in `qItemClick` detail.
- **P2 API:** add explicit `interactive`/`disabled` rather than deriving availability only from visual status.
- **P2 motion:** active pulse and broad `transition: all` need reduced-motion and explicit properties.
- Documentation added: this component previously had no standalone authored guide.

### 22. `q-icon`

- **P2 performance:** add shared request/sanitized-SVG caching and abort superseded/disconnected requests.
- **P2 DX:** emit load/error events and allow a controlled fallback slot or fallback icon.
- **P2 URL correctness:** binary detection should ignore query strings/fragments; local path resolution should normalize or reject traversal-like names.
- **P3 maintainability:** `syncHostState()` runs across multiple lifecycle hooks and within load paths. Render host attributes/classes declaratively where possible.
- **P2 offline UX:** document local icons as the recommended CEF/offline mode and remote CDN policy explicitly.
- Documentation corrected: version override, timeout, meaningful/decorative labeling, library resolution, and parts.

### 23. `q-reel`

- **P1 UX/a11y:** lightbox video unconditionally autoplays and loops. Make both opt-in props and respect reduced motion/data preferences.
- **P1 modal behavior:** focus is trapped, but background content is not made inert and document scrolling is not locked. Use a shared overlay manager.
- **P2 event DX:** open/close events should include media, index, trigger, and close reason; navigation should emit a change event.
- **P2 API:** add close-on-overlay, close-on-Escape, start index, and media-label controls or document custom-lightbox composition.
- **P3 timing:** replace the fixed 50 ms focus timeout with post-render scheduling.
- Documentation corrected: slot contract, keyboard navigation, focus behavior, event limitations, and autoplay policy.

### 24. `q-thumbnail`

- **P1 semantics enhancement:** prefer a native button activation surface when composition allows it, or document why a `div role=button` is necessary.
- **P2 UX:** add disabled/loading/error states and image load/error events.
- **P2 media contract:** rename/document `video` as poster/video-affordance state; it does not render a video.
- **P2 a11y:** verify duplicate label/alt announcements and forbid nested interactive overlay content.
- Documentation added: this component previously had no standalone authored guide.

### 25. `q-dialog`

- **P1 a11y:** add an accessible name path for custom header slots.
- **P1 focus:** an initially open dialog focuses content without capturing the previously active element, so later restoration has no target.
- **P1 overlay coordination:** every open dialog listens at window level; Escape can close multiple stacked dialogs. Introduce a shared topmost-overlay manager.
- **P2 event DX:** include close reason and original event; consider cancelable confirm/cancel events for validation workflows.
- **P2 modal behavior:** make the rest of the document inert and manage scroll lock while open.
- **P2 composition:** loading only disables default actions, not slotted footer controls; expose context/state or document consumer responsibility.
- Documentation corrected: methods, `closeLabel`, slot responsibilities, parts, safe backdrop behavior, and custom-header limitation.

### 26. `q-tooltip`

- **P1 UX/a11y:** add Escape dismissal and touch/click/long-press behavior or explicitly limit the component to hover/focus-capable devices.
- **P2 positioning:** implement viewport collision detection, flip/shift behavior, and max-width wrapping; current fixed positioning can clip at edges.
- **P2 performance:** each visible tooltip attaches window plus every ancestor scroll listener. A shared overlay/listener service would scale better.
- **P2 API:** add an explicit target/`for` option, configurable offset, show/hide methods, and perhaps open state for controlled usage.
- **P3 resilience:** clamp negative delays and resynchronize `aria-describedby` if the immediate parent changes.
- Documentation corrected: parent attachment, slot, described-by behavior, non-interactive contract, and known positioning/input limitations.

## Documentation corrections completed in this pass

- Established an exact 26-component index and documentation standard in `docs/components/README.md`.
- Rebuilt `docs/components.md` so every source component appears in the status matrix.
- Added authored guides for `q-thumbnail` and `q-step-diagram-item`.
- Added `docs/components/current-contracts.md` with current props, events, methods, slots, form behavior, accessibility notes, and known limitations for all 26 components.
- Added missing source JSDoc metadata for button/chip/link slots and parts, sidepanel slots and parts, icon parts, reel slot, dialog slots and parts, and tooltip slot.
- Documented newer APIs previously absent from authored tables, including data-table sorting/row actions, form methods/Enter behavior, sidepanel collapse controls, field methods/events, icon version/timeout/label, and carousel methods.
- Made the generated source-adjacent API the canonical contract and prohibited copied full implementation snapshots in future authored guides.

## Recommended implementation sequence

1. Fix the syntax escaping issue and add adversarial tests.
2. Repair form validity through one shared helper and migrate all form-associated controls.
3. Fix `q-scrollable` state selectors/auto-hide behavior, `q-sidepanel` hidden focusability/no-op mode, and pending step activation.
4. Add dialog custom naming, initial-open focus restoration, and shared overlay coordination.
5. Add reduced-motion coverage and replace `transition: all`.
6. Address data-table semantics/stable keys and dropdown ARIA/performance/fake delay.
7. Add icon caching/abort/events and then the remaining component-specific DX improvements.
8. Replace the cross-platform test launcher, add docs-inventory CI, and correct package repository metadata.
