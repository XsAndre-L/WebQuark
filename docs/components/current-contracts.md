# Current public component contracts

This reference was reconciled against the 27 Stencil component implementations on 2026-07-15. It fills gaps in older authored specification tables while those longer design guides are progressively simplified. The generated API page linked for each component remains canonical for exact TypeScript types and defaults.

For array and object inputs, assign the JavaScript property unless the contract explicitly accepts a JSON string. Event names are case-sensitive DOM custom-event names.

## Actions

### `q-button`

- API: [generated reference](../../src/components/actions/button/readme.md)
- Properties: `variant`, `size`, `icon`, `shape`, `layout`, `disabled`, `loading`, `type`, `expand`, `href`, `target`, `rel`, `download`, `iconOnly`, `ariaLabel`.
- Events: `qClick`, `qFocus`, `qBlur`.
- Slots: default label, `icon-left`, `icon-right`.
- Behavior: renders a native `<a>` when `href` is non-empty and a native `<button>` otherwise. `icon` renders a leading default-library `q-icon`; assigned `icon-left` content replaces that fallback. `target="_blank"` receives `rel="noopener noreferrer"` unless `rel` is supplied. `loading` suppresses activation and sets `aria-busy`.
- Accessibility: visible text names the native control without a redundant `aria-label`. Set `ariaLabel` for icon-only controls; development builds warn once when it is missing. Icon names are never used as accessible names.

### `q-chip`

- API: [generated reference](../../src/components/actions/chip/readme.md)
- Properties: `label`, `value`, `href`, `target`, `rel`, `download`, `variant`, `size`, `selected`, `disabled`, `clickable`, `removable`.
- Events: `qClick`, `qRemove`, `qFocus`, `qBlur`.
- Slots: default label, `icon-left`, `icon-right`.
- Behavior: link chips use an anchor; clickable non-link chips use a button. A removable chip deliberately makes only its remove button interactive to avoid nested controls.
- Accessibility: when visible text is supplied only through the default slot, also set `label` so the remove action can be named as “Remove {label}”.

### `q-link`

- API: [generated reference](../../src/components/actions/link/readme.md)
- Properties: `href`, `url`, `mailto`, `tel`, `target`, `rel`, `download`, `label`, `variant`, `underline`, `external`, `disabled`.
- Events: `qClick`, `qFocus`, `qBlur`.
- Slots: default label, `icon-left`, `icon-right`.
- Behavior: destination precedence is `href`, `url`, `mailto`, then `tel`. `url` is a compatibility alias. Blank-target or external links receive a safe default `rel` unless overridden.
- Accessibility: `external` adds visible and screen-reader external-link context. Disabled links lose navigation and tab focus.

## Layout and navigation

### `q-card`

- API: [generated reference](../../src/components/layout/card/readme.md)
- Properties: `elevation`, `interactive`, `glass`, `lift`.
- Slots: `header`, default body.
- Behavior: `interactive` adds button semantics and Enter/Space activation; `lift` is only a visual hover/focus treatment. Numeric elevations `1`, `2`, and `3` remain legacy aliases.
- Accessibility: avoid placing nested interactive controls inside an interactive card. The header region is removed visually when its slot is empty.

### `q-carousel`

- API: [generated reference](../../src/components/layout/carousel/readme.md)
- Properties: `snapAlignment`, `showArrows`, `showIndicators`, `repeat`, `itemWidth`.
- Event: `qSlideChange` with the active zero-based index and slide element.
- Methods: `slideTo(index)`, `updateLimits()`.
- Slot: default slide content.
- Behavior: navigation uses measured slide offsets and scroll snapping. Call `updateLimits()` after layout changes that do not trigger a slot or resize observation.
- Accessibility: arrows and indicators have labels; consumers must give individual slide content meaningful names and structure.

### `q-form`

- API: [generated reference](../../src/components/layout/form/readme.md)
- Properties: `label`, `action`, `method`, `autocomplete`, `enctype`, `target`, `noValidate`, `preventDefault`, `enterBehavior`.
- Events: `qSubmit`, `qReset`.
- Methods: `getValues()`, `setValues(values)`, `resetForm()`, `submitForm()`.
- Slots: `header`, default fields/body, `actions`.
- Behavior: wraps a real form and bridges slotted `q-button` submit/reset actions across shadow boundaries. `enterBehavior` is `submit`, `focus-next`, or `none`. `qSubmit.detail` includes `values`, `formData`, the native form, and the original event.
- Forms: `preventDefault` defaults to true. Named WebQuark controls are included; read-only `q-syntax-box` elements are excluded. Toggle values are booleans in `values` and checkbox-like entries in `FormData`.

### `q-navbar`

- API: [generated reference](../../src/components/layout/navbar/readme.md)
- Properties: `brand`, `logoSrc`, `logoAlt`, `brandHref`, `items`, `activeValue`, `ariaLabel`, `mobileLabel`, `edge`, `mobileMode`, `sticky`, `compact`, `transparent`, `bordered`.
- Events: `qSelect`, `qMenuToggle`.
- Slots: `brand`, `nav`, `actions`, `mobile-nav`, `mobile-actions`.
- Behavior: `items` accepts an array or JSON string; string entries normalize to matching labels and values. At narrow top/bottom layouts, `mobileMode="menu"` uses a dismissible menu; `mobileMode="inline"` keeps navigation inline. `edge` also controls sizing/orientation styles.
- Accessibility: `logoAlt` is required for a logo-only brand. Icon-only items should supply `ariaLabel`; disabled items do not navigate or emit selection.

### `q-panel`

- API: [generated reference](../../src/components/layout/panel/readme.md)
- Properties: `variant`, `padding`, `scrollable`, `fullHeight`, `stickyHeader`, `stickyFooter`, `ariaLabel`.
- Slots: `header`, default body, `footer`.
- Behavior: empty header/footer regions collapse. Sticky regions take effect when the panel owns scrolling.
- Accessibility: a scrollable body becomes a keyboard-focusable region. Use `ariaLabel` to replace the generic “Panel content” name.

### `q-scrollable`

- API: [generated reference](../../src/components/layout/scrollable/readme.md)
- Properties: `height`, `maxHeight`, `autoHide`, `nativeOnMobile`, `mode`, `target`.
- Event: `qScroll` with `scrollTop`, `scrollHeight`, and `clientHeight`.
- Methods: `scrollToBottom()`, `scrollToPosition(top)`.
- Slot: default scroll content.
- Behavior: `custom` mode renders a vertical draggable thumb; `native` mode uses browser scrollbars. `target` optionally styles another scroll container in the same document or shadow root. Coarse pointers use native scrollbars when `nativeOnMobile` is true.
- Limitations: the custom scrollbar is vertical only. Treat `target` as a selector, not an element reference.

### `q-sidepanel`

- API: [generated reference](../../src/components/layout/sidepanel/readme.md)
- Properties: `variant`, `open`, `side`, `panelSize`, `items`, `ariaLabel`, `value`, `mode`, `expanded`, `accordion`, `collapsible`, `collapsed`, `collapseControl`, `collapseControlAppearance`, `collapseControlPosition`, `collapseMode`, `collapseLabel`.
- Events: `qClose`, `qSelect`, `qCollapsedChange`.
- Slots: `header`, default body, `footer`, `collapse-icon`, `expand-icon`, `collapse-control-adornment`.
- Behavior: `drawer` is modal, `panel` is persistent slotted content, and `nav` renders item trees. Top-level string items normalize to matching labels and values. An item-level `alwaysExpanded` value of `true` turns a parent into a persistent, non-interactive category heading; it overrides `expanded=false` and accordion mode, is not inherited, and is ignored for leaf items. The built-in collapse control mutates `collapsed` and emits `qCollapsedChange`; direct consumer assignments do not emit it. `collapse-control-adornment` provides a non-interactive visual badge or label anchored over the control's top-left corner.
- Accessibility: the drawer traps focus and restores it after closing. Use `ariaLabel` to name the navigation, panel region, or drawer dialog. Keep `collapseLabel` synchronized with meaningful visual adornment content.
- Known limitation: `mode` is exposed but currently does not change rendering; do not depend on distinct `flat`, `grouped`, or `tree` behavior until that contract is implemented.

### `q-toolbar`

- API: [generated reference](../../src/components/layout/toolbar/readme.md)
- Properties: `edge`, `sticky`, `compact`, `transparent`, `bordered`, `ariaLabel`.
- Slots: `start`, default content, `end`.
- Behavior: WebQuark owns layout and edge styling; consumers own every control and action.
- Accessibility: providing `ariaLabel` currently gives the container `role="group"`. Consumers must preserve a logical tab order among slotted controls.

## Form controls

### `q-input`

- API: [generated reference](../../src/components/inputs/input/readme.md)
- Properties: `value`, `name`, `type`, `placeholder`, `label`, `ariaLabel`, `disabled`, `required`, `error`, `errorMessage`, `size`, `clearable`, `min`, `max`, `step`.
- Events: `qChange`, `qInput`, `qBlur`, `qFocus`, `qClick`.
- Methods: `focusElement()`, `clearValue()`.
- Slots: `prefix`, `suffix`.
- Forms: form-associated; value and initial reset value are synchronized through `ElementInternals`. Number mode adds custom step buttons and clamps on blur.
- UX: the suffix slot is hidden while the clear action is visible. Password mode adds a visibility toggle and preserves selection where supported.

### `q-textarea`

- API: [generated reference](../../src/components/inputs/textarea/readme.md)
- Properties: `value`, `name`, `placeholder`, `label`, `ariaLabel`, `rows`, `autoGrow`, `resizeMode`, `disabled`, `required`, `error`, `errorMessage`.
- Events: `qChange`, `qInput`, `qBlur`, `qFocus`, `qClick`.
- Methods: `focusElement()`, `adjustHeight()`.
- Forms: form-associated and reset-aware. `resizeMode` is `auto`, `manual`, or `fixed`; setting `autoGrow=false` makes `auto` behave as fixed.
- Accessibility: when no visible label exists, the placeholder is used as a fallback accessible name. A durable label is preferred.

### `q-dropdown`

- API: [generated reference](../../src/components/inputs/dropdown/readme.md)
- Properties: `value`, `name`, `label`, `ariaLabel`, `placeholder`, `options`, `disabled`, `size`, `searchable`.
- Events: `qChange`, `qSelect`, `qFocus`, `qBlur`, `qClick`.
- Slot: `icon-left`.
- Forms: form-associated and reset-aware. `options` accepts strings or `{ label, value }` records in a JavaScript array or JSON string. A string becomes both its label and value.
- Keyboard: supports Arrow keys, Home, End, Enter, Space, Escape, and Tab. Search filters labels case-insensitively and incrementally renders 20 options at a time.
- Limitations: options cannot currently be disabled and search/loading/empty strings are not configurable.

### `q-quantity-selector`

- API: [generated reference](../../src/components/inputs/quantity-selector/readme.md)
- Properties: `value`, `step`, `min`, `max`, `variant`.
- Events: `qChange`, `qFocus`, `qBlur`, `qClick`.
- Behavior: supports direct editing, step buttons, Arrow Up/Down, and bounded Home/End shortcuts. Invalid or incomplete text is reconciled on change/blur.
- Forms: this component is not currently form-associated and has no `name`, `disabled`, `required`, or error contract.

### `q-radio-group`

- API: [generated reference](../../src/components/inputs/radio-group/readme.md)
- Properties: `value`, `name`, `label`, `ariaLabel`, `options`, `size`, `orientation`, `disabled`, `required`, `error`, `errorMessage`.
- Events: `qChange`, `qFocus`, `qBlur`.
- Methods: `focusElement()`, `checkValidity()`, `reportValidity()`.
- Forms: form-associated and reset-aware. A selected enabled option contributes its string value; required groups report `valueMissing` until one is selected.
- Accessibility: native same-name radio inputs preserve Tab, Arrow-key, Space, fieldset, and legend semantics.

### `q-toggle`

- API: [generated reference](../../src/components/inputs/toggle/readme.md)
- Properties: `checked`, `name`, `size`, `type`, `label`, `disabled`, `required`, `error`.
- Events: `qChange`, `qFocus`, `qBlur`, `qClick`.
- Method: `toggle()`.
- Slots: default label, `checked-icon`, `unchecked-icon`.
- Forms: form-associated. Checked contributes the string `true`; unchecked contributes no FormData entry, matching native checkbox behavior. Reset restores the initial checked state.
- Accessibility: renders switch or checkbox semantics according to `type`; the default slot or `label` should name the control.

## Data display and indicators

### `q-conversation-bubble`

- API: [generated reference](../../src/components/data-display/conversation-bubble/readme.md)
- Properties: `variant`, `sender`, `timestamp`, `ariaLabel`, `compact`.
- Slots: `avatar`, default message body, `meta`, `actions`.
- Behavior: `incoming`, `outgoing`, and `system` control alignment and appearance without owning message state. Message body text wraps and preserves line breaks.
- Accessibility: renders a named message group without an automatic live region. Consumers own restrained announcement behavior for newly arriving messages.

### `q-data-table`

- API: [generated reference](../../src/components/data-display/data-table/readme.md)
- Properties: `columns`, `items`, `rowActions`, `rowClickable`, `loading`, `selectable`, `selectedKeys`, `keyField`, `sortable`, `sortMode`, `sortColumn`, `sortDirection`, `showToolbar`, `toolbarTitle`, `showSearch`, `searchPlaceholder`, `searchValue`.
- Events: `qRowClick`, `qRowAction`, `qSelectionChange`, `qSearch`, `qSortChange`.
- Slots: `toolbar-left`, `filters`, `actions`, `empty`, `footer`.
- Behavior: columns, rows, and row actions accept arrays or JSON strings. `sortMode="table"` sorts locally; `external` emits state without reordering. Search is controlled/event-driven and does not filter rows automatically.
- DX: use a stable primitive `keyField`; index fallback becomes unstable when sorting or replacing rows. Callback-based cell renderers and disabled predicates require JavaScript property assignment.
- Performance: rows are not virtualized; paginate or window large datasets outside the component.

### `q-map`

- API: [generated reference](../../src/components/data-display/map/readme.md)
- Properties: `provider`, `tileUrl`, `tilePreloadBuffer`, `rasterTileLoadingPolicy`, `vectorStyleUrl`, `vectorPadding`, `googleApiKey`, `googleMapType`, `attribution`, `attributionUrl`, `centerLatitude`, `centerLongitude`, `zoom`, `minZoom`, `maxZoom`, `maxBounds`, `maxBoundsViscosity`, `markers`, `selectedMarkerId`, `ariaLabel`.
- Events: `qReady`, `qMarkerSelect`, `qStatusChange`, `qError`.
- Slots: `empty` replaces missing provider configuration; `error` replaces the visible failure message when no requested or fallback provider can be activated.
- Shadow parts: `surface`, `canvas`, `marker`, `attribution`, `empty`, `error`.
- Behavior: wraps Leaflet behind a framework-neutral Web Component contract. Provider swaps are transactional, preserve the previous working layer until replacement succeeds, discard stale async results, and report serializable status/errors. Raster replacements wait for the full initial batch by default; the opt-in `progressive` loading policy commits after the first successful tile and preserves loaded parent tiles while finer children remain pending or fail. The `tiles` provider uses a consumer-supplied URL and attribution; the optional `google` provider loads the official Maps JavaScript API through GoogleMutant, preserves Google's legal controls, and falls back to `tileUrl` when configured. `maxBounds` accepts an object or JSON string; malformed non-empty updates emit `qError` and preserve the last valid boundary. Assign `markers` as a JavaScript array of records containing a stable type-sensitive `id`, finite coordinates, a `label`, and an optional visual `variant`. Marker selection is controlled through `selectedMarkerId`; activation emits `qMarkerSelect` without mutating application data.
- Accessibility: `ariaLabel` names the map region and markers are keyboard operable. Important locations and actions must also be available outside the map because a spatial canvas is not an accessible replacement for structured content.
- Performance: marker layers are reconciled by stable ID and map sizing follows its host container. Paginate, cluster, or otherwise limit very large marker collections in the consuming application.
- Limitations: consumers provide and license the imagery service, API key and CSP where applicable, attribution, location data, real-time transport, geocoding, routing, clustering, and domain-specific popups. `q-map` does not call an application backend. Google imagery is network-only and GoogleMutant's legal controls require visual validation in each supported runtime.

### `q-syntax-box`

- API: [generated reference](../../src/components/data-display/syntax-box/readme.md)
- Properties: `variant`, `name`, `language`, `code`, `value`, `heading`, `copyable`, `height`, `editable`, `disabled`, `required`.
- Events: `qChange`, `qInput`.
- Method: `scrollToBottom()`.
- Slots: default fallback code/content, `actions`.
- Behavior: `code` and `value` are mirrored compatibility aliases. Editable mode provides formatting and form participation; read-only mode does not contribute a form value. Escape leaves the editor and Tab inserts two spaces.
- Limitations: languages are `html`, `javascript`, `css`, and `json`; highlighting is regex-based, not a validating parser.

### `q-circular-progress`

- API: [generated reference](../../src/components/indicators/circular-progress/readme.md)
- Properties: `value`, `label`, `ariaLabel`, `indeterminate`, `size`.
- Behavior: finite determinate values are clamped to 0–100. `label` controls visible/value text; `ariaLabel` names the progressbar. Indeterminate mode suppresses value attributes and center text.
- Accessibility: use a task-specific `ariaLabel`; the default “Circular Progress” is intentionally generic.

### `q-step-diagram`

- API: [generated reference](../../src/components/indicators/step-diagram/readme.md)
- Properties: `layout`, `ariaLabel`.
- Slot: default `q-step-diagram-item` children.
- Behavior: propagates `layout` to slotted step items on load, property change, and slot change.
- Accessibility: the container uses list semantics and should receive a workflow-specific `ariaLabel`.

### `q-step-diagram-item`

- API: [generated reference](../../src/components/indicators/step-diagram-item/readme.md)
- Properties: `status`, `lineStyle`, `layout`.
- Event: `qItemClick`.
- Slots: `badge`, `title`, default body.
- Behavior: the parent normally controls `layout`. Enter, Space, or pointer activation emits `qItemClick`. `status` controls visuals and current-step semantics.
- Known limitation: `pending` is exposed as `aria-disabled` but currently still activates; consumers must ignore the event until that implementation is corrected.

## Media

### `q-avatar`

- API: [generated reference](../../src/components/media/avatar/readme.md)
- Properties: `src`, `name`, `initials`, `alt`, `size`, `shape`, `loading`.
- Events: `qLoad`, `qError`.
- Slot: `fallback`.
- Behavior: reserves its dimensions and replaces a missing or failed image with explicit initials, initials derived from `name`, or slotted fallback content.
- Accessibility: `alt` takes precedence over `name`; an explicit empty `alt` makes the avatar decorative. Fallback content is visual and does not duplicate the accessible name.

### `q-icon`

- API: [generated reference](../../src/components/media/icon/readme.md)
- Properties: `name`, `lib`, `size`, `color`, `localPath`, `libVersion`, `fetchTimeout`, `label`.
- Behavior: `lucide` and `font-awesome` resolve pinned CDN URLs; `local` resolves from `localPath`; custom libraries may be base URLs or `{name}` templates. SVG is fetched, sanitized, and inlined without blocking component or parent hydration; the sized host renders first and fills when the request completes. Common raster formats use `<img>`.
- Accessibility: icons without `label` are decorative. Supplying `label` gives the host `role="img"` and an accessible name.
- CEF/offline: prefer `lib="local"` for offline, deterministic, or restricted webviews.

### `q-reel`

- API: [generated reference](../../src/components/media/reel/readme.md)
- Properties: `layout`, `lightbox`.
- Events: `qLightboxOpen`, `qLightboxClose`.
- Slot: default `q-thumbnail` children.
- Behavior: thumbnail activation opens the built-in lightbox when enabled. Escape closes; Arrow Left/Right navigates; Tab is trapped inside the open overlay.
- UX: video items currently autoplay and loop in the lightbox. Disable the built-in lightbox and provide a custom viewer if that policy is inappropriate.

### `q-thumbnail`

- API: [generated reference](../../src/components/media/thumbnail/readme.md)
- Properties: `src`, `video`, `label`, `alt`, `highlighted`.
- Event: `qMaximize` with source, label, video flag, alt text, and trigger element.
- Slot: default overlay content.
- Behavior: pointer, Enter, and Space activation emit `qMaximize`. Images lazy-load; `video` adds a decorative play indicator but `src` is still rendered as an image/poster.
- Accessibility: `label`, then `alt`, then “Media item” names the interactive wrapper. Supply meaningful `alt` even when a visible caption exists.

## Overlays

### `q-dialog`

- API: [generated reference](../../src/components/overlays/dialog/readme.md)
- Properties: `open`, `dialogTitle`, `ariaLabel`, `message`, `closeOnEsc`, `closeOnOverlayClick`, `loading`, `confirmLabel`, `cancelLabel`, `closeLabel`, `showCancel`, `showConfirm`, `backdropEffect`.
- Events: `qConfirm`, `qCancel`, `qClose`.
- Methods: `show()`, `close()`, `confirm()`, `cancel()`.
- Slots: `header`, default body, `footer`.
- Behavior: traps focus while open and restores prior focus after an animated close. `loading` blocks built-in actions and dismissal. CEF-safe `solid` is the default backdrop; `none` keeps only the click layer.
- Accessibility: `dialogTitle` and `message` wire `aria-labelledby`/`aria-describedby`. Set `ariaLabel` when a custom header does not provide `dialogTitle`; an explicit label takes naming precedence.

### `q-tooltip`

- API: [generated reference](../../src/components/overlays/tooltip/readme.md)
- Properties: `content`, `position`, `delay`.
- Slot: default content fallback.
- Behavior: attaches to its immediate parent, updates that trigger’s `aria-describedby`, and shows on mouse hover or descendant focus. Scrolling or resizing hides it.
- Limitations: tooltips are non-interactive, do not collision-flip at viewport edges, and do not currently expose touch/click or Escape dismissal behavior.
