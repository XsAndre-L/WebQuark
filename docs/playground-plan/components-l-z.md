# Component work from Link through Tooltip, and new playground entries

[Implementation sequence](README.md) · [Property, event and method inventory with component source links](api-coverage.md)

Each row describes work to implement and a sample to exercise it. Demo values belong to the sample. Preserve the public component default when showing what happens if an attribute is omitted. For optional booleans and numbers, make omission an explicit choice. Check each sample in the live editor, its gallery card and its copied snippet.

## Navigation, maps and surfaces

| Component | Required changes and acceptance sample |
|---|---|
| **q-link** | Add `label`, `rel`, `download`, and HTML editors for `icon-left` and `icon-right`. Demonstrate label fallback with an empty default slot. For email and telephone, clear the sample `href="/docs"` and show destination precedence (`href`, deprecated `url`, `mailto`, `tel`). Show explicit `rel`, automatic new-tab protection and a working local download. Keep the playground reachable after testing ordinary navigation. Exercise enabled click, keyboard focus/blur and disabled suppression. Verify gallery labels actually project to the unnamed slot. |
| **q-map** | Add the `vector` provider, `vectorStyleUrl`, `vectorPadding` (0.2), `tilePreloadBuffer` (0), `zoomControls` and `scrollWheelZoom` (both true). Keep `clusterMaxZoom` optional, distinguish a numeric marker ID from a string ID, and allow typed bounds/markers as well as valid serialized JSON. Supply configured raster and vector examples with attribution, and a Google configuration example using a user-supplied key. Keep key values out of shareable examples. Include the current missing-configuration and invalid-bounds cases, `empty` and `error` slots. |
| **q-map interaction** | Use one clustered dataset with same-group, separate-group and unclusterable points. Include dot, avatar, icon and image markers, sizing/anchor, fallback, ring, pulse, badge and selected/always-visible callouts with stats and status. Add controls for `fitMarkers({padding,maxZoom})` and `ensureMarkerVisible(id, occlusions)` using actual client rectangles. Show the boolean and visibility results. Log `qReady`, `qMapClick`, `qMarkerSelect`, `qClusterSelect`, `qStatusChange` and `qError` with their payloads, including fallback status. Separate external resource failures from intended empty/error examples. |
| **q-navbar** | Add `logoSrc`, `logoAlt`, `mobileLabel`, editable `brand`, `nav` and `mobile-nav` slots alongside the actions slots. Treat `messages-addon` as an example dynamic slot matched by an item's `addonSlot`. Show JSON/object items, icon-only with an accessible name, disabled and external items, logo fallback, mobile actions, open/close and selection. Bind controlled `value` to `qSelect.detail.value` and show `qMenuToggle`. Isolate deprecated `activeValue` with `value` omitted. Render constrained-parent, RTL, and optical-offset examples with their actual host style/direction. |
| **q-panel** | Add independent `headerPadding` and `footerPadding` using the shared space tokens and `ariaLabel`. Preserve optional `borderless` independently of legacy `noBorders`. Demonstrate header/footer/body slots, dividers and different paddings together. Constrain the height and provide enough content to observe scrolling and sticky header/footer. Preserve the surface, plain and bordered variants. |

## Progress, selection and scrolling

| Component | Required changes and acceptance sample |
|---|---|
| **q-progress** | Support positive numeric pixel sizes alongside sm/md/lg, and add `ariaLabel` and `ariaValueText`. Serialize the latter as `aria-valuetext`. Show the API value default of 0 separately from the 35% example, numeric sizing in both shapes, accessible determinate text, indeterminate output and existing clamping cases. |
| **q-quantity-selector** | All canonical fields exist. Keep `min` and `max` unset in an unbounded sample, with 0–100 presented as a bounded example. Enable clearing each bound and show the reconciled numeric value after manual entry, blur and stepping. Bind `qChange.detail`; record `qFocus`, `qBlur`, `qClick`. Document deprecated `variant` and the precedence of `orientation` in a compatibility sample. |
| **q-radio-group** | Promote fixed top-level `options` to editable string/object options including disabled and icon options. Serialize options in every snippet. Add `description`, `error`, `name`, `ariaLabel`, plus a legacy `errorMessage` case with `error` unset. Preserve the optional `reserveFeedback` and empty-value state. Show horizontal/vertical/responsive layout, keyboard choice, required/empty and disabled cases, actual form submission and `focusElement`, `checkValidity`, `reportValidity`. Log change, focus and blur. |
| **q-reel** | Both props are represented. Replace the remote JPEG marked as a video with a deliberate media fixture. The thumbnail currently renders an image and the lightbox renders video from the same `src`, so document the single-source limitation and verify each promised surface before publishing the video sample. Use local image fixtures for grid/carousel, empty/single/multiple items, and lightbox disabled. Demonstrate thumbnail `qMaximize`, reel `qLightboxOpen`/`qLightboxClose`, arrow navigation, Escape and focus return. |
| **q-scrollable** | All props are represented. Provide a uniquely scoped external target in native mode so the selector resolves inside the component’s root. Contrast internal custom scrolling with native scrolling on a bounded overflowing container. Show `qScroll` detail and the results of calling `scrollToPosition(top)` and `scrollToBottom()`. Check mobile native behavior and auto-hide in conditions where each applies. The 250px preview height differs from the 100% API default. |

## Sidepanels, ranges and layout

| Component | Required changes and acceptance sample |
|---|---|
| **q-sidepanel** | Add `panel` to the variant options, and actual nav, panel and drawer samples. The source defaults to nav with `open=false`; the live spec starts with an open drawer. Add `items` as a JS array property (strings or nested objects) and `value`; support flat, grouped and tree modes with icons, badges, always-expanded and selected items. Show `qSelect.detail.value`, `qClose`, `qCollapsedChange.detail.collapsed`. Only drawer scenarios need the open/close helper. Keep all actions scoped to their own instance. |
| **q-sidepanel collapse** | Add `collapsible`, `collapsed`, `collapseControl` (none/header/footer/edge), `collapseControlStyle` (icon-button/edge-tab), `collapseControlPosition`, `collapseMode` (rail/hidden), `collapseLabel`. Add `collapse-icon`, `expand-icon` and `collapse-control-adornment` alongside header/footer/default. Show an externally controlled panel and a built-in edge tab. Exercise deprecated `panelSize`, `expanded`, `collapseControlAppearance` separately with their replacements `drawerSize`, `defaultGroupsExpanded`, `collapseControlStyle` omitted. |
| **q-slider** | Add `showValue`, `name`, `ariaLabel`. Demonstrate hidden value badge, suffix, fractional steps, keyboard/drag, omitted value (uses minimum), and disabled form control. Show numeric `qInput` during changes and `qChange` on commit. Add `focusElement()` and keep current value and copied markup in sync. |
| **q-stack** | Both props, the default slot and their enum options are covered. Retain the basic example. Use children of unequal intrinsic widths to demonstrate alignment and two or more children for gap. Migrate the long-content sample from the alternate `slot` key to the shared unnamed-slot representation so editor, card and snippet agree. |
| **q-step-diagram** | Add `ariaLabel` (default “Steps”), a compatibility sample for deprecated `layout`, and a child-specific page for `q-step-diagram-item`. Preserve direct item children when rendering or copying HTML. Show the parent propagating orientation when it changes, single/multiple items, title/body/custom badge and item clicks. |

## Editing, feedback and tools

| Component | Required changes and acceptance sample |
|---|---|
| **q-syntax-box** | Expose `value` as a synchronized editor value, `name`, `ariaLabel`, and panel-header `actions`. Omit `code` in the read-only fallback slot example (an explicit empty string selects the code path). Treat height, heading and enabled copy button as demo settings. Show panel/plain, editable/disabled/required form behavior, copy and supported formatting, escaped source, `qInput`/`qChange`, `checkValidity()`, `reportValidity()` and `scrollToBottom()` with overflowing code. |
| **q-textarea** | Add `description`, `ariaLabel` and `name`; identify `errorMessage` as deprecated in favor of `error`. Check omitted width/feedback, labeled and visually hidden cases, error, disabled, multiline form/reset and auto/manual/fixed sizing. Show string `qInput`/`qChange`, click/focus/blur, `focusElement()`, `adjustHeight()`, `checkValidity()`, `reportValidity()`. |
| **q-toast** | Both host props are present. Replace the single error action with a single shared host and explicit `info`, `success`, `warning`, `danger` and `error` (danger alias) calls. Expose title, description, duration and dismissible, display the returned ID, call `dismiss(id)` and `clear()` and display their return values. Exercise queue promotion with `maxVisible=1`, timed and persistent items, and all six positions. Copy a working controller or awaited element-method example. |
| **q-toggle** | Add `description` and `name`. Retain switch/checkbox and all three slots; show custom icons specifically in checkbox mode. Exercise inherited feedback spacing, keyboard toggle, disabled and required form states and reset. Show boolean `qChange`, focus/blur/click, `toggle()`, `checkValidity()`, `reportValidity()`. |
| **q-toolbar** | Add the shared `gap` scale (default sm) and `wrap` (default true). Include start/default/end slots and a narrow host with enough children to distinguish wrapping. Show horizontal/vertical edges, sticky in a scrolling parent, and size inherited by a child control. |

### Tooltip

| Component | Required changes and acceptance sample |
|---|---|
| **q-tooltip** | All props exist. Add the unnamed bubble content slot and omit `content` to exercise it. Put the tooltip inside a focusable trigger in the editor, cards and snippets. It observes its parent’s hover/focus. Demonstrate all four positions including left, immediate/delayed display, scroll-to-hide and the parent’s `aria-describedby` association. The generic stage parent offers no keyboard trigger. |

## Nine new standalone entries

Register every tag below in the playground manifest and supply a corresponding spec. Two child components also need links from their parent component pages. Respect the source’s implementation status when naming samples.

### Implemented interactions

| Component | API and first working samples |
|---|---|
| **q-alert** | `heading`, `variant` (info/success/warning/danger), `announcement` (off/polite/assertive), `dismissible` (false) and `dismissLabel` (“Dismiss alert”). Default message plus `icon` and `actions` slots. Show inline and dismissible alerts. The component emits `qDismiss`; wire the consumer to hide/remove that instance and allow resetting the example. |
| **q-pagination** | `page=1`, `pageSize=10`, `totalItems=0`, `showSummary=true`, `itemLabel="items"`, `disabled=false`, `ariaLabel="Pagination"`. Populate multiple pages. Apply numeric `qPageChange.detail` to the controlled page and visible dataset. Show empty, first, middle, final partial page, disabled and hidden-summary cases. |
| **q-tabs** | `items=[]` as strings or objects, `value=""`, `orientation` (horizontal/vertical), `size` (sm/md/lg), `variant` (underline/enclosed/pills/button), `stretch=false`, `ariaLabel="Sections"`. Show controlled `qChange.detail` updating both value and a consumer-owned panel. Provide tab/panel IDs, disabled and icon-only items, and keyboard arrows/Home/End. Defaults are horizontal, md, underline. |
| **q-step-diagram-item** | `status` (pending/active/completed/success/warning/danger, default completed), `lineStyle` (solid/dashed/dotted/none, default solid), optional `orientation` (vertical/horizontal), legacy `layout` (vertical fallback). Edit default body, `title` and `badge` slots. Show standalone and parent-managed orientation and observe `qItemClick`. |
| **q-thumbnail** | `src`, `alt`, optional `label`, `highlighted=false`, `video=false`, and unnamed overlay slot. Use an accessible local image. Show caption and overlay, decoration, click and Enter/Space activation. Inspect `qMaximize.detail` (src, label, video, alt, triggerEl) and link to the reel lightbox. |

### Scaffold and slot projection

| Component | Current API and observable sample |
|---|---|
| **q-accordion** | `mode` single/multiple (default single) and unnamed slot. Show projected content. If illustrating a disclosure with native details/summary, identify it as consumer-owned. The component’s disclosure and item coordination are deferred. |
| **q-banner** | `height` auto/full/half/narrow (default auto), `alignment` start/center/end (default center), with media/default/actions slots. Show locally supplied media, copy and action in projected order. The final layout is deferred. |
| **q-media** | `src=""`, `kind` image/video/file (default image), `loading` lazy/eager (default lazy), `alt=""`, default and fallback slots. Demonstrate consumer-rendered content. The scaffold projects both slots and leaves native media loading and fallback selection to the consumer. |
| **q-section** | `layout` full/split/sidebar/columns (default full), `reverse=false`, `columns=1`, and media/default/actions slots. Show slot projection and reflected layout/reverse controls. The presentation pass owns implementation of the proposed layout behavior. |
