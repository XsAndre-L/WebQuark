# WebQuark component quality review

> Path note, 14 October 2026: source files have moved. See the [current-path mapping](source-path-migrations.md). Recorded commands, line numbers and validation results describe the original checkout and are retained as historical evidence.

Reviewed on 2 October 2026. This report covers all **41 public components**, including the nine absent from the main playground. Three subagents examined component implementations, types, helpers, styles, documentation, and tests. The parent review checked shared contracts, framework integration, and browser reproductions.

**Conclusion:** the property naming cleanup is consistent, but the library still has material behavior, accessibility, and developer experience gaps. Passing the current tests does not establish that these gaps are absent. Eight components had no additional concrete defect identified in this review; the other 33 have defects, incomplete behavior, or integration work worth addressing.

This is a review and proposed remediation order. **Component implementations have not been changed during this audit.** Existing documented limitations are included when they force consumers to rebuild advertised functionality. Intentional application ownership of routing, remote data, and controlled selection is not itself a defect.

## Verification and evidence

- `bun run pr:verify` passed: prop order for 41 components and two mixins; core, React, and Angular production builds; 66 tooling tests; 399 unit tests.
- Browser checks used installed Chrome because the Chromium executable expected by the current Playwright installation is missing. The temporary runner did not change the normal test configuration.
- The Chrome run passed 116 checks across 12 files: 100 existing browser checks and 16 temporary audit reproductions. The reproduction checks deliberately asserted the observed faulty behavior; they are evidence of defects, not claims that those behaviors are correct.
- Targeted browser probes confirmed form validation/reset/assignment issues, dropdown interactions, missing editable syntax behavior, pending-step activation, reel focus, quantity capabilities, pagination normalization, table fallback identity, and mixed raw/escaped syntax rendering. Additional subagent browser probes checked method chaining, inherited disabling, date bounds, Enter composition, button naming, textarea resizing, and RTL toast placement.
- SVG sanitization failures were independently reproduced in a local browser. This report gives the root cause and remediation without executable payloads.
- Temporary audit runners, probes, and failure screenshots were removed after verification. The saved report is the only repository change from this review.
- Findings below distinguish browser or helper reproductions from static source conclusions. Exact source references identify the audited implementation; line numbers can move after subsequent changes.
- This review is not a guarantee of defect absence. Full device, assistive-technology, performance, CEF, Firefox, and WebKit certification was not performed.

## Review of every component

“No additional defect found” describes this review's result, rather than a claim that a component has no possible defects. Finding numbers refer to the sections below.

| Category | Component | Result |
| --- | --- | --- |
| Actions | `q-button` | Loading loses its accessible name; plain native-form integration and default contrast need attention. F06, F14, F28. |
| Actions | `q-link` | No additional concrete defect found. Disabled destinations, native link behavior, and external cues are coherent. |
| Communication | `q-alert` | No additional concrete defect found. Controlled dismissal and optional announcements are coherent. |
| Communication | `q-conversation-bubble` | Default outgoing-message contrast is insufficient. F28. |
| Communication | `q-toast` | Centered positions are incorrect in RTL. F27. |
| Content | `q-card` | No additional concrete defect found. Nested interactive controls are guarded during card activation. |
| Content | `q-carousel` | Dynamic sizing/snapping, late slide measurements, and guide drift. F16, F29. |
| Content | `q-banner` | Published height/alignment properties have no effect. F15. |
| Data display | `q-chip` | Removable slotted chips require duplicated text for a specific removal name. F30. |
| Data display | `q-data-table` | Unstable fallback selection identity; grid semantics and mouse/keyboard selection differ. F22. |
| Data display | `q-map` | Google readiness has no timeout; viewport persistence requires extra integration. F30. Provider/marker lifecycle otherwise appears robust. |
| Data display | `q-syntax-box` | Unsafe escaping, automatic source corruption, missing empty editor, unnamed actions, and inconsistent field integration. F01, F02, F07, F14, F30. |
| Data display | `q-accordion` | Public scaffold does not implement accordion behavior. F15. |
| Data display | `q-pagination` | Positive fractions below one normalize to zero. F23. |
| Forms and inputs | `q-dropdown` | Keyboard selection, disabling during an open interaction, collection parsing, and search naming. F07, F12, F13, F30. |
| Forms and inputs | `q-form` | Validation, collection, reset, repeated/grouped values, submission, and composition inconsistencies. F03–F07. |
| Forms and inputs | `q-input` | Stale validation after programmatic updates; unsupported calendar bounds; off-grid stepping; focus/field capabilities. F07, F09, F30. |
| Forms and inputs | `q-quantity-selector` | Missing normal field integration, disabling, configurable naming, and focus support. F08, F30. |
| Forms and inputs | `q-radio-group` | Wrong-shaped JSON throws; unavailable values submit differently through the wrapper. F04, F07, F13. |
| Forms and inputs | `q-textarea` | Switching resize modes retains auto-owned height. F07, F11, F30. |
| Forms and inputs | `q-toggle` | Custom error does not affect validity; fieldset disabling and shared naming/focus capabilities differ. F05, F07, F10, F30. |
| Indicators | `q-progress` | No additional concrete defect found. Value, indeterminate state, and size/tone behavior are coherent. |
| Indicators | `q-step-diagram` | Incomplete list semantics and manual final-connector work. F25. Orientation compatibility works. |
| Indicators | `q-step-diagram-item` | Pending state announces disabled but still activates. F25, F28. |
| Layout | `q-grid` | No additional concrete defect found. Responsive fitting and spacing are coherent. |
| Layout | `q-inline` | No additional concrete defect found. Wrapping/alignment and DOM focus order are coherent. |
| Layout | `q-navbar` | Mobile focus/content fallback, empty branding link, JSON handling, and guide drift. F13, F19, F29. |
| Layout | `q-panel` | Sticky mode retains competing scroll containers. F21. |
| Layout | `q-scrollable` | Visibility contract, reconnect lifecycle, and small-track metrics. F20. |
| Layout | `q-sidepanel` | Collapse dead end, variant lifecycle, empty-modal focus, no-op mode, invalid animation, and navigation capabilities. F15, F17, F18, F30. |
| Layout | `q-stack` | No additional concrete defect found. Spacing and alignment are coherent. |
| Layout | `q-section` | Published layout/reverse/columns properties have no effect. F15. |
| Layout | `q-tabs` | Wrong-shaped JSON throws; external panels need a supported accessibility association. F13, F30. Controlled selection is intentional. |
| Layout | `q-toolbar` | No additional concrete defect found. Edge layout, inherited control size, and group semantics are coherent. |
| Media | `q-avatar` | Unitless HTML sizes differ from icon/progress behavior. F28. |
| Media | `q-icon` | Unsafe URL-loaded SVG sanitization; binary URLs with queries/hashes are misclassified. F01, F30. |
| Media | `q-reel` | First-open/return focus, video source contract, and modal coordination. F18, F24, F28. |
| Media | `q-thumbnail` | Video preview/playback cannot use separate sources; themed highlight border is masked. F24, F28. |
| Media | `q-media` | Public scaffold does not render the media described by its properties. F15. |
| Overlays | `q-dialog` | Slot labeling, modal coordination, and asynchronous default confirmation need a coherent contract. F18, F30. |
| Overlays | `q-tooltip` | Dismissal, hover persistence, collision, and dynamic positioning gaps. F26. |

## Priority 1 fixes

### F01 Unsafe content can become live browser content

**`q-icon`: browser reproduced.** URL-loaded SVG uses a denylist sanitizer. Malformed XML falls back to regex replacement, which does not reliably remove incomplete blocked elements. The valid XML path also permits active SVG elements and attributes outside the static registry's safer contract. Both paths allowed script execution in local browser probes when supplied with unsafe SVG content. This affects untrusted or compromised icon sources; it is not a finding against every registered static icon.

Evidence: [SVG sanitizer](../../src/browser/components/media/icon/internals/sanitize-svg.ts), [parse-error fallback](../../src/browser/components/media/icon/internals/sanitize-svg.ts), [markup insertion](../../src/browser/components/media/icon/icon.tsx).

**Correction:** reject malformed SVG; enforce a strict element, attribute, URL, and resource allowlist consistent with registered definitions. Active navigation/animation must not pass through as an icon. Add defensive regression coverage for malformed and well-formed unsafe content.

**`q-syntax-box`: browser reproduced live markup.** `escapeHtml()` assumes the entire source is already escaped whenever it contains any `&lt;`, `&gt;`, or `&amp;`. Mixed raw/escaped source therefore bypasses escaping and is inserted using `innerHTML`. A local probe created an image node where literal code should have been displayed.

Evidence: [escaping shortcut](../../src/browser/components/data-display/syntax-box/internals/syntax.ts), [highlight insertion](../../src/browser/components/data-display/syntax-box/syntax-box.tsx).

**Correction:** always treat incoming code as literal source and escape it once. Do not infer whole-input encoding from one entity. Keep generated highlighting markup separate from source text.

### F02 The editor silently changes valid source

**Helper reproduced.** Editable initialization and unfocused updates automatically invoke the lightweight formatter. Its global whitespace/semicolon/brace replacements do not respect strings or comments. Valid JavaScript can become invalid, and a line comment can absorb the following statement. This is data corruption, not merely a formatting preference.

Evidence: [initial formatting](../../src/browser/components/data-display/syntax-box/internals/value-sync.ts), [formatter](../../src/browser/components/data-display/syntax-box/internals/formatter.ts), [value watchers](../../src/browser/components/data-display/syntax-box/syntax-box.tsx).

**Correction:** preserve source verbatim by default. Make formatting explicit and use a parser-aware formatter. Editable mode must also render an empty textarea without requiring consumers to seed `code=""`; currently an unseeded required editor renders no textarea and reports valid. That last behavior was browser reproduced.

### F03 Form validation can be bypassed by ordinary supported usage

**Unnamed fields: browser reproduced.** Validation discovers only `[name]`, so an unnamed required custom input can be invalid while `submitForm()` still emits `qSubmit`. Naming should determine submitted data, not whether a field is validated.

**Native submission mode: source confirmed.** With `preventDefault=false`, the handler starts asynchronous validation without synchronously canceling native submission. Returning on invalidity does not cancel the browser's default action. Slotted fields also lack the internal native form's ownership, so native validation cannot repair this boundary automatically.

Evidence: [control discovery](../../src/browser/components/inputs/form/internals/controls.ts), [submission/validation](../../src/browser/components/inputs/form/form.tsx).

**Correction:** distinguish all validatable controls from successful named controls. Cancel the event synchronously, validate, and deliberately perform the requested submission only after success. Test both prevented submission and native-navigation mode.

## Priority 2 behavior and consistency fixes

### F04 Form collection does not follow successful-control semantics

**Browser reproduced.** The unfiltered `[name]` search collects the internal actions slot: an empty form returns `{ actions: null }`. Disabled fieldset descendants are included because the bridge checks `.disabled` rather than effective disabled state. A radio group whose value is no longer in its options contributes no native form value, but the wrapper reads and submits the stale property anyway.

Evidence: [discovery](../../src/browser/components/inputs/form/internals/controls.ts), [collection](../../src/browser/components/inputs/form/internals/values.ts), [manual append](../../src/browser/components/inputs/form/internals/values.ts).

**Correction:** collect actual controls, honor effective disabling and successful values, and avoid reconstructing a different submission contract from raw component properties.

### F05 Reset and grouped value assignment are inconsistent

**Browser reproduced.** A reset button leaves slotted values changed while `resetForm()` restores them. `setValues()` and reset snapshot restoration reduce arrays to their first value and assign it to every matching control. Radio option values are overwritten instead of checked; multiselects lose selections. Repeated toggles overwrite earlier collected values with a final Boolean.

Evidence: [reset paths](../../src/browser/components/inputs/form/form.tsx), [reset action](../../src/browser/components/inputs/form/form.tsx), [assignment](../../src/browser/components/inputs/form/internals/values.ts).

**Correction:** use one cancelable reset path and assign according to control type. Preserve radio option values, multiselect selections, and repeated names. Define how toggle groups map to arrays and Boolean values.

### F06 Form composition requires unnecessary manual submit and Enter wiring

**Native button and layout composition: browser reproduced.** Slotted native submit buttons have no native form owner and are not bridged. `focus-next` and `none` reject Enter whenever an unrelated `q-*` layout appears in the event path, so recommended `q-grid`/`q-stack` wrappers break those policies. The default `submit` policy supplies no text-input Enter bridge; that absence is source confirmed rather than a complete real-key navigation reproduction.

Evidence: [button bridge](../../src/browser/components/inputs/form/form.tsx), [Enter policy](../../src/browser/components/inputs/form/internals/enter-behavior.ts).

**Correction:** support native and WebQuark submit/reset controls through the same boundary. Apply Enter policies based on the originating control, not layout ancestors. Separately define ordinary native `<form>` support for `q-button`; its inner native button currently does not provide that integration automatically.

### F07 Programmatic state and inherited disabling are not synchronized consistently

**Browser reproduced.** Immediately chaining `await form.setValues(...)` and `await form.submitForm()` can validate the previous native input value. `q-textarea` already updates its native control in its watcher, while `q-input` does not. Consumers should not need to await an animation frame after a public asynchronous setter.

Form-associated fields lack `formDisabledCallback`, leaving shadow controls interactive under disabled fieldsets. This affects input, textarea, dropdown, radio group, toggle, and editable syntax-box behavior.

Evidence: [input watcher](../../src/browser/components/inputs/input/input.tsx), [native validity](../../src/browser/utils/form-control-validity.ts).

**Correction:** synchronously reconcile current values before validation and implement an effective disabled state that combines the explicit property with inherited form disabling.

### F08 Quantity selector does not provide the normal field contract

**Browser reproduced and source confirmed.** It has no `disabled`, `name`, form association/reset/validity, configurable label, `ariaLabel`, or focus method. A `disabled` attribute does not prevent incrementing, and every input is permanently named “Quantity”. Multiple quantities cannot be named distinctly through the public API, and forms need hidden inputs/event bridges.

Evidence: [quantity API](../../src/browser/components/inputs/quantity-selector/quantity-selector.tsx), [hardcoded name](../../src/browser/components/inputs/quantity-selector/quantity-selector.tsx).

**Correction:** adopt the shared field contract while retaining its numeric value and orientation. Supply a visible/hidden label and accessible override, disabling, successful form value, reset, validity, and focus behavior.

### F09 Input bounds and stepping do not match the supported types

**Browser reproduced.** Number-only `min/max` cannot express calendar/time constraints despite those input types being supported. A date minimum is parsed as a number and becomes an invalid native bound. Manually adding a step to an off-grid number preserves the mismatch; decimal arithmetic also exposes long floating-point values. The latter was observed as a data/display artifact, not a validity failure in the aligned case.

Evidence: [bounds](../../src/browser/components/inputs/input/input.tsx), [manual stepping](../../src/browser/components/inputs/input/input.tsx).

**Correction:** use bounds compatible with numeric and calendar input types. Use native stepping or a decimal-safe, step-aligned shared helper for numeric controls.

### F10 Toggle error and validity disagree

**Browser reproduced.** `error` displays feedback and `aria-invalid=true`, but does not set custom validity. The same nonblank error blocks submission in sibling fields.

Evidence: [toggle validity](../../src/browser/components/inputs/toggle/toggle.tsx).

**Correction:** apply the same nonblank-error validity contract across fields. A distinct presentation-only state, if needed, should not reuse the property that means a validation error elsewhere.

### F11 Textarea keeps auto-owned height after switching modes

**Browser reproduced.** Switching from auto growth to fixed/manual mode leaves the previously generated inline height in place. Reducing `rows` does not restore the expected fixed geometry.

Evidence: [resize handling](../../src/browser/components/inputs/textarea/textarea.tsx).

**Correction:** clear auto-owned height when leaving auto mode, distinguishing it from intentional manual sizing.

### F12 Dropdown interaction has keyboard and disabled-state holes

**Browser reproduced.** Search-input ArrowDown repeatedly activates the first result; Enter chooses the first result instead of the active result. Disabling an already-open dropdown leaves clickable options that can still change the value.

Evidence: [selection guard](../../src/browser/components/inputs/dropdown/dropdown.tsx), [ArrowDown](../../src/browser/components/inputs/dropdown/dropdown.tsx), [Enter](../../src/browser/components/inputs/dropdown/dropdown.tsx).

**Correction:** retain input focus while moving the active option correctly, commit the active option, and guard/cancel all selection paths when disabled. Define whether external search retains its query on reopen or emits a reset; silently clearing only the displayed query can leave stale remote results.

### F13 Collection parsers reject syntax errors but crash on valid wrong-shaped data

**Helper reproduced.** Dropdown, radio-group, navbar, and tabs call array methods on parsed JSON without checking its shape. Valid JSON values such as an object or null throw, although invalid JSON safely falls back.

Evidence: [JSON helper](../../src/browser/utils/utils.ts), [dropdown options](../../src/browser/components/inputs/dropdown/internals/options.ts), [radio options](../../src/browser/components/inputs/radio-group/radio-group.utils.ts), [navbar items](../../src/browser/components/layout/navbar/navbar.utils.ts), [tab items](../../src/browser/components/layout/tabs/tabs.utils.ts).

**Correction:** validate arrays and item shapes at collection boundaries, with consistent fallback and useful diagnostics. Include non-array values in collection tests.

### F14 Built-in actions lose or omit accessible names

**Button: browser reproduced.** Loading uses `visibility:hidden` on the label, removing “Save” from the native button's accessible name. Syntax-box Format and Copy controls are icon-only without explicit action names; a tooltip does not substitute for a button name.

Evidence: [loading content](../../src/browser/components/actions/button/button.tsx), [editor actions](../../src/browser/components/data-display/syntax-box/syntax-box.tsx).

**Correction:** preserve the existing accessible label while loading and explicitly name built-in icon actions. Restore visible focus indicators for input auxiliary controls and quantity inputs rather than requiring consumer CSS.

### F15 Published concepts include silent no-op properties

**Source confirmed.** `q-banner.height/alignment`, `q-section.layout/reverse/columns`, `q-accordion.mode`, and `q-media.src/alt/kind/loading` do not implement their advertised behavior. Media and fallback content can both be projected. `q-sidepanel.mode` is never read, so flat/grouped/tree have no distinct behavior.

Evidence: [banner](../../src/browser/components/content/banner/banner.tsx), [section](../../src/browser/components/layout/section/section.tsx), [accordion](../../src/browser/components/data-display/accordion/accordion.tsx), [media](../../src/browser/components/media/media/media.tsx), [sidepanel mode](../../src/browser/components/layout/sidepanel/sidepanel.tsx).

**Correction:** implement a deliberately defined contract or remove these from the stable usable API until ready. A property should not require consumers to recreate all of its behavior. The guides already acknowledge the scaffolds; that disclosure does not make them complete.

### F16 Carousel styles and measurements become stale

**Source confirmed.** Runtime `itemWidth`/`snapAlignment` changes do not resynchronize the host variables. Only the viewport is observed, so late image loading or changing natural slide widths can leave cached offsets and arrow states stale without a viewport resize or slot change.

Evidence: [style synchronization](../../src/browser/components/content/carousel/carousel.tsx), [observer](../../src/browser/components/content/carousel/carousel.tsx).

**Correction:** watch the style properties; observe slotted slide geometry; resynchronize before recalculating navigation metrics.

### F17 Supported sidepanel configurations can create dead ends

**Source confirmed.** Hidden persistent panels place header/footer collapse controls inside hidden inert content, disabling their own reopen controls. Switching variants does not synchronize drawer visibility with `open`. Default transition declarations append an easing function to a token that already includes one, making the transition invalid.

Evidence: [persistent controls](../../src/browser/components/layout/sidepanel/sidepanel.tsx), [drawer lifecycle](../../src/browser/components/layout/sidepanel/sidepanel.tsx), [transition](../../src/browser/components/layout/sidepanel/sidepanel.css).

**Correction:** keep reopening controls reachable, synchronize lifecycle when entering/leaving drawer mode, and use a transition token with one duration/easing pair.

### F18 Modal focus and coordination need one shared lifecycle

**Reel first open: browser reproduced.** It captures the close-button reference before rendering, so focus does not move into the first viewer. Closing attempts to focus a thumbnail host rather than its actual focusable trigger. Empty sidepanel/dialog traps return when there are no focusable descendants; source inspection shows Tab can escape the intended trap.

Dialog, reel, and drawer behavior also lack shared topmost-modal coordination and background inertness. Multiple global Escape/Tab listeners can compete. Focus discovery needs to exclude inaccessible ancestor subtrees consistently.

Evidence: [reel open/focus](../../src/browser/components/media/reel/reel.tsx), [shared trap](../../src/browser/utils/dom.ts), [drawer keyboard](../../src/browser/components/layout/sidepanel/sidepanel.tsx).

**Correction:** share modal registration, active-layer keyboard handling, focus capture/restore, empty-surface trapping, and background/scroll policy. Resolve rendered focus targets after rendering.

### F19 Navbar mobile behavior creates hidden focus and duplicated content

**Source confirmed.** Escape restores focus only in the collision path, while the ordinary small-screen path can hide the focused menu item. Custom desktop navigation/actions disappear at the mobile breakpoint without fallback, requiring duplicated content even when no mobile override exists. Optional empty branding still renders an unnamed focusable anchor.

Evidence: [Escape](../../src/browser/components/layout/navbar/navbar.tsx), [mobile slots](../../src/browser/components/layout/navbar/navbar.css), [brand rendering](../../src/browser/components/layout/navbar/navbar.tsx).

**Correction:** restore focus whenever closing hides the current target; reuse original slot content unless explicitly replaced; omit branding links without meaningful content.

### F20 Scrollable visibility and reconnect behavior are unreliable

**Source confirmed; metrics helper reproduced.** The scrolling class is on the custom-element host, but CSS looks for it on the inner wrapper. `autoHide=false` lacks a persistent visibility rule, and keyboard focus can remain on a transparent thumb. Disconnect cleans up observers and target styling without a corresponding reconnect initializer. In short viewports, the minimum thumb exceeds its track and cannot move.

Evidence: [host state](../../src/browser/components/layout/scrollable/scrollable.tsx), [visibility selectors](../../src/browser/components/layout/scrollable/scrollable.css), [cleanup](../../src/browser/components/layout/scrollable/scrollable.tsx), [metrics](../../src/browser/components/layout/scrollable/internals/metrics.ts).

**Correction:** bind visibility to actual state and focus, restore resources on reconnect, and cap proportional thumb geometry to the usable track.

### F21 Panel sticky mode has competing scroll containers

**Source confirmed.** A later `.is-scrollable .panel-body` rule overrides sticky mode's `overflow:visible`, so both the panel and body can own scrolling. Sticky header/footer flags cannot reliably select the intended container.

Evidence: [sticky scrolling](../../src/browser/components/layout/panel/panel.css), [later body scrolling](../../src/browser/components/layout/panel/panel.css).

**Correction:** choose one scroll container per mode and apply keyboard scrolling/focus to that container.

### F22 Table identity and interaction semantics need stronger guarantees

**Wrong selection: helper and browser reproduced.** Index fallback keys are assigned after sorting, but selected items are resolved against original input order. Without stable IDs, selecting the first displayed sorted row can return another record. Correctly keyed rows are unaffected; warnings and a documented ID recommendation do not make the fallback safe.

The wrapper also declares a grid without implementing grid cell keyboard navigation, and keyboard row activation toggles selection while equivalent pointer activation does not.

Evidence: [row model](../../src/browser/components/data-display/data-table/internals/table-model.ts), [selection detail](../../src/browser/components/data-display/data-table/data-table.tsx), [row keyboard](../../src/browser/components/data-display/data-table/data-table.tsx).

**Correction:** establish identity before sorting, or reject unsupported combinations clearly. Match native table semantics to the actual keyboard model, and define pointer/keyboard selection consistently.

### F23 Pagination normalization can produce zero and infinity

**Browser reproduced.** Positive fractions below one are floored to zero. A fractional page size can produce an infinite page count and an inverted item range; a fractional current page can produce zero.

Evidence: [integer normalization](../../src/browser/components/data-display/pagination/pagination.tsx).

**Correction:** clamp the normalized integer to at least one after flooring, and use the same effective values for summaries and events.

### F24 Video preview and playback share an impossible source contract

**Source confirmed.** Thumbnail always uses `src` for an image, while the video viewer uses that same URL for video. A conventional video URL is not also a thumbnail image URL, so the public contract cannot express an ordinary video poster plus playable source.

Evidence: [thumbnail image](../../src/browser/components/media/thumbnail/thumbnail.tsx), [viewer media](../../src/browser/components/media/reel/reel.tsx).

**Correction:** expose separate media and poster/preview sources and carry both through maximize events. Include loading/failure behavior for each.

### F25 Step states and structural semantics disagree

**Pending activation: browser reproduced.** Pending items announce `aria-disabled=true` but still emit activation on click and keyboard. The parent declares a list, but children do not declare list items. Consumers manually remove the final connector.

Evidence: [item activation](../../src/browser/components/indicators/step-diagram-item/step-diagram-item.tsx), [item disabled state](../../src/browser/components/indicators/step-diagram-item/step-diagram-item.tsx), [parent list](../../src/browser/components/indicators/step-diagram/step-diagram.tsx).

**Correction:** enforce the disabled contract or separate pending from disabling, establish complete list semantics, and let the parent determine connector termination.

### F26 Tooltip behavior falls short of its interaction contract

**Source confirmed.** There is no Escape dismissal, it immediately hides when leaving the trigger and cannot remain hovered, placement can overflow, and visible position changes do not recalculate coordinates.

Evidence: [trigger listeners](../../src/browser/components/overlays/tooltip/tooltip.tsx), [positioning](../../src/browser/components/overlays/tooltip/tooltip.tsx), [pointer behavior](../../src/browser/components/overlays/tooltip/tooltip.css).

**Correction:** implement coordinated hover/focus persistence, Escape dismissal, collision handling, and recalculation for live property/geometry changes. Keep content noninteractive.

### F27 Centered toasts break in RTL

**Browser stylesheet reproduced.** Logical `inset-inline-start:50%` is combined with physical `translateX(-50%)`. In RTL this shifts the toast away from the center and can clip it outside the viewport.

Evidence: [centering](../../src/browser/components/communication/toast/toast.css).

**Correction:** use physical centering or direction-aware translation; preserve logical start/end positioning elsewhere.

### F28 Visual and motion contracts differ unnecessarily

- **Contrast:** outgoing conversation text is white on the default primary blue, with a calculated contrast of about 2.54:1. Primary actions share a similar palette issue. Use a shared accessible on-accent pairing and check themes and states. [Bubble styles](../../src/browser/components/communication/conversation-bubble/conversation-bubble.css), [palette](../../src/browser/theme/tokens.css).
- **Sizing:** `q-avatar size="48"` becomes invalid unitless CSS, while icon/progress normalize it to pixels. Share normalization for numeric and CSS-length sizes. [Avatar sizing](../../src/browser/components/media/avatar/avatar.tsx).
- **Thumbnail highlighting:** the theme's border shorthand resolves a transparent root color before local hover/highlight changes, masking the requested border. Resolve state colors locally while preserving explicit border overrides. [Thumbnail border](../../src/browser/components/media/thumbnail/thumbnail.css).
- **Reduced motion:** toast/map/progress have handling, but dialog/reel/step animations do not consistently honor it. Adopt one motion policy and test default and reduced-motion behavior.

These are source-confirmed findings; contrast is calculated from current default colors. They are not claims about arbitrary consumer theme overrides.

### F29 Main guides lag current APIs

**Source/documentation comparison.** The carousel guide omits `transition`, `transitionDuration`, newer transition behavior and `controls-extra`, and its reduced-motion statement contradicts the current implementation. The navbar guide omits `navAlign`, `navCenterWithin`, and collision behavior. Generated API pages cover these additions, but developers following the primary guides miss useful capabilities.

Evidence: [carousel guide](../components/q-carousel.md), [navbar guide](../components/q-navbar.md), [carousel API](../../src/browser/components/content/carousel/readme.md), [navbar API](../../src/browser/components/layout/navbar/readme.md).

**Correction:** update examples and behavior guidance with API additions, and automatically check property/slot coverage against generated metadata without replacing authored explanations with generated tables.

## Contract decisions to settle

### F30 Developer experience improvements that need a deliberate shared design

These recommendations are integration/capability gaps, rather than interchangeable rename suggestions. Choose behavior before adding more properties.

| Area | Current burden | Recommended contract |
| --- | --- | --- |
| Field capabilities | Input/textarea lack common native constraints and hints; host attributes do not reach shadow controls. Toggle lacks the same `ariaLabel`/focus API as siblings; quantity is substantially less complete. | Define a supported native-field capability matrix: label/accessible override, description/error, focus, disabling, readonly where meaningful, autocomplete/input mode, string/length/pattern constraints, reset, and validity. Keep domain-appropriate value types. |
| Angular forms | Value accessors cover input/textarea, dropdown/radio, and toggle; quantity and editable syntax boxes require custom adapters. | Add supported numeric/editor accessors and consumer compilation/interaction tests. [Configuration](../../stencil.config.ts). |
| Search naming | Dropdown search is not explicitly named consistently with the field. | Use a coherent select-combobox naming and active-descendant model. [Search input](../../src/browser/components/inputs/dropdown/dropdown.tsx). |
| Sidepanel navigation | Leaf records lack native destinations, target, disabled state, and original event detail; consumers implement routing manually and lose native link affordances. | Align navigation leaf capabilities with navbar where applicable, keeping group expansion separate. [Item contract](../../src/browser/components/layout/sidepanel/sidepanel.types.ts). |
| Tabs and panels | Internal tab IDs/ARIA strings cannot by themselves establish relationships with consumer panels outside the shadow root. | Provide a supported panel association strategy or companion panels; validate it in browser accessibility checks. Continue to support intentional controlled selection. [Tab rendering](../../src/browser/components/layout/tabs/tabs.tsx). |
| Asynchronous confirmation | Default dialog confirmation closes immediately and cannot defer or honor cancellation. Apps rebuild a footer despite the existing confirmation/loading API. | Decide on an explicit controlled/deferred confirmation contract and keep built-in actions usable for async work. [Confirmation](../../src/browser/components/overlays/dialog/dialog.tsx). |
| Dialog slots | Custom header/body content can replace fallback nodes while ARIA still references their IDs, requiring duplicated naming and cleared fallback properties. | Track actual rendered slot/fallback content and avoid dangling references. [Dialog relationships](../../src/browser/components/overlays/dialog/dialog.tsx). |
| Chip removal | Specific remove names require repeating slotted text in `label`; otherwise controls use generic names. | Derive a meaningful name from content when possible and offer an explicit override. [Removal label](../../src/browser/components/data-display/chip/chip.tsx). |
| Icon URLs | Image URLs with a query/hash are classified by the complete string, fetched as SVG text, and fail. | Classify the pathname while preserving the full load URL. [URL classification](../../src/browser/components/media/icon/internals/url.ts). |
| Map readiness | Google provider loading has no readiness timeout, unlike other readiness paths. | Add bounded readiness with an actionable error and preserve the existing transactional provider replacement. [Google loader](../../src/browser/components/data-display/map/internals/google-maps.ts). |
| Map view state | Consumers cannot receive or read the public viewport state for persistence or viewport-based data queries. | Consider one viewport-change event and view getter if this use case is supported; avoid exposing internal Leaflet objects as the default integration. |

## Recommended implementation order

1. **Content safety and data preservation:** F01–F02. Preserve code verbatim; prevent active content from entering icon/code rendering.
2. **Form correctness:** F03–F13. Establish successful-control, validation, reset, disabling, immediate method chaining, and keyboard contracts before extending more field capabilities.
3. **Accessibility and interaction:** F14, F17–F19, F22, F25–F28. Share modal behavior, fix focus/names/contrast, and resolve input-modality inconsistencies.
4. **Runtime property and lifecycle behavior:** F11, F16, F20–F24. Test property changes, late content, reattachment, boundaries, and media source separation.
5. **API maturity and developer guidance:** F15, F29–F30. Resolve no-op components, align framework adapters and navigation capabilities, and update the primary guides.

Each fix should have a behavior-focused regression covering the reported trigger. Existing naming aliases, controlled state, and category decisions should not be changed opportunistically. The goal is predictable supported usage with fewer consumer workarounds, rather than identical properties on components that serve different roles.
