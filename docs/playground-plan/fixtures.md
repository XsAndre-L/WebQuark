# Slot fixtures, editor choices and preset values

[Implementation sequence](README.md)

## Slot editor checklist

Compare each sandbox slot editor with the generated Stencil slot table. Blank cells use a dash. An absent editor may already have a variant or a child fixture. Demonstrate dynamic slot patterns with real keys and show the owner markup needed to project them. Check the component chapters for runtime slots beyond the documented table.

| Component | Documented slots | Lacking a declared slot editor | Editor outside documented slots |
|---|---|---|---|
| q-accordion | `default` | `default` | — |
| q-alert | `default`, `actions`, `icon` | `default`, `actions`, `icon` | — |
| q-avatar | `fallback` | — | — |
| q-banner | `default`, `actions`, `media` | `default`, `actions`, `media` | — |
| q-button | `default`, `icon-left`, `icon-right` | — | — |
| q-card | `default`, `footer`, `header` | — | — |
| q-carousel | `default`, `controls-extra` | `controls-extra` | — |
| q-chip | `default`, `icon-left`, `icon-right` | — | — |
| q-control-group | `default` | — | — |
| q-conversation-bubble | `default`, `actions`, `avatar`, `meta` | — | — |
| q-data-table | `actions`, `empty`, `filters`, `footer`, `q-data-table-cell-*`, `q-data-table-row-gutter-*`, `toolbar-left` | `q-data-table-cell-*`, `q-data-table-row-gutter-*` | — |
| q-dialog | `default`, `footer`, `header` | — | — |
| q-divider | — | — | — |
| q-dropdown | `icon-left` | `icon-left` | — |
| q-form | `default`, `actions`, `header` | `header` | — |
| q-grid | `default` | — | — |
| q-icon | — | — | — |
| q-image-comparison | — | — | — |
| q-inline | `default` | — | — |
| q-input | `prefix`, `suffix` | — | — |
| q-link | `default`, `icon-left`, `icon-right` | `icon-left`, `icon-right` | — |
| q-map | `empty`, `error` | — | — |
| q-media | `default`, `fallback` | `default`, `fallback` | — |
| q-navbar | `actions`, `brand`, `mobile-actions`, `mobile-nav`, `nav` | `brand`, `mobile-nav`, `nav` | `messages-addon` |
| q-pagination | — | — | — |
| q-panel | `default`, `footer`, `header` | — | — |
| q-progress | — | — | — |
| q-quantity-selector | — | — | — |
| q-radio-group | — | — | — |
| q-reel | `default` | — | — |
| q-scrollable | `default` | — | — |
| q-section | `default`, `actions`, `media` | `default`, `actions`, `media` | — |
| q-sidepanel | `default`, `collapse-control-adornment`, `collapse-icon`, `expand-icon`, `footer`, `header` | `collapse-control-adornment`, `collapse-icon`, `expand-icon` | — |
| q-slider | — | — | — |
| q-stack | `default` | — | — |
| q-step-diagram | `default` | — | — |
| q-step-diagram-item | `default`, `badge`, `title` | `default`, `badge`, `title` | — |
| q-syntax-box | `default`, `actions` | `actions` | — |
| q-tabs | — | — | — |
| q-textarea | — | — | — |
| q-thumbnail | `default` | `default` | — |
| q-toast | — | — | — |
| q-toggle | `default`, `checked-icon`, `unchecked-icon` | — | — |
| q-toolbar | `default`, `end`, `start` | — | — |
| q-tooltip | `default` | `default` | — |

## Incomplete finite selects

Add date, datetime-local, month, time and week to Input type. Add vector to Map provider and panel to Sidepanel variant. For open string/number unions such as Icon and Avatar size, support custom input alongside presets. Keep the omitted state distinct from a selected empty string.

## Preset values that differ from the component default

Each entry reads **property (documented default → sandbox seed)**. A difference is often intentional. Preserve a helpful scenario, label it as a preset, and expose the actual default through an unset/reset action. Prioritize values that change semantics, such as Avatar alt, Carousel navigation, Dialog open, and inherited form feedback. Long fixture data are abbreviated. This table compares the stored declarations as text, before custom views override them. Equivalent alternative encodings, such as JSON text and a JS array, still need the appropriate editor and copy format.

| Component | Differences to classify |
|---|---|
| q-avatar | `name (unset → Maya Dlamini)`, `src (unset → "")`, `initials (unset → "")`, `alt (unset → "")` |
| q-button | `icon (unset → "")`, `ariaLabel (null → "")`, `href (unset → "")`, `target (unset → "")` |
| q-carousel | `itemWidth (auto → 280px)`, `showArrows (unset → true)`, `showIndicators (unset → true)` |
| q-chip | `href (unset → "")`, `target (unset → "")` |
| q-control-group | `ariaLabel (null → Sync interval)` |
| q-conversation-bubble | `sender (unset → Assistant)`, `timestamp (unset → Just now)`, `ariaLabel (null → "")` |
| q-data-table | `sortColumn (unset → "")`, `sortDirection (unset → "")`, `toolbarTitle (unset → "")`, `columns ([] → [ { "key": "id", "header": "ID", "width…)`, `items ([] → [ { "id": "1", "name": "Administrator A…)` |
| q-dialog | `closeOnEscape (unset → true)`, `closeOnBackdropClick (unset → true)`, `heading (unset → Perform Operations)`, `message (unset → Are you sure you want to proceed with t…)`, `confirmLabel (Confirm → Confirm Action)`, `cancelLabel (Cancel → Dismiss)`, `open (false → true)` |
| q-dropdown | `width (unset → "")`, `label (unset → Environment Server)`, `ariaLabel (null → "")`, `placeholder (Select an option... → Select profile...)`, `value ("" → staging)` |
| q-form | `label (unset → Profile)` |
| q-icon | `name (unset → settings)`, `library (unset → lucide)` |
| q-image-comparison | `beforeSrc ("" → assets/comparison-before.svg)`, `afterSrc ("" → assets/comparison-after.svg)`, `beforeAlt ("" → Illustrated workspace with a dark blue …)`, `afterAlt ("" → Illustrated workspace with a green back…)`, `aspectRatio (unset → 1.7777777778)`, `ariaLabel (Image comparison → Compare workspace illustrations)` |
| q-input | `width (unset → "")`, `clearable (false → true)`, `label (unset → Credential Login)`, `placeholder ("" → Enter text here...)`, `error (unset → "")` |
| q-link | `href (unset → /docs)`, `mailto (unset → "")`, `tel (unset → "")`, `target (unset → "")` |
| q-map | `maxBounds (unset → "")`, `clusterMaxZoom (unset → 18)`, `selectedMarkerId (unset → "")` |
| q-navbar | `brand (unset → WebQuark)`, `value (unset → docs)`, `ariaLabel (null → "")`, `items ([] → [{"label":"Docs","value":"docs","href":…)` |
| q-panel | `borderless (unset → false)` |
| q-progress | `label (unset → "")`, `value (0 → 35)` |
| q-quantity-selector | `orientation (unset → horizontal)`, `min (unset → 0)`, `max (unset → 100)` |
| q-radio-group | `label (unset → Sign-in fields)`, `value ("" → both)` |
| q-scrollable | `height (100% → 250px)` |
| q-sidepanel | `variant (nav → drawer)`, `drawerSize (unset → 320px)`, `ariaLabel (null → "")`, `defaultGroupsExpanded (unset → true)`, `open (false → true)` |
| q-slider | `value (unset → 25)`, `label (unset → Value)` |
| q-step-diagram | `orientation (unset → vertical)` |
| q-syntax-box | `height (unset → 110px)`, `copyable (false → true)`, `heading (unset → CODE PREVIEW)`, `code (unset → "")` |
| q-textarea | `width (unset → "")`, `label (unset → Review comments)`, `placeholder ("" → Write feedback...)`, `error (unset → "")` |
| q-toggle | `label (unset → Toggle Label)`, `error (unset → "")` |
| q-toolbar | `ariaLabel (null → Page toolbar)` |
| q-tooltip | `content (unset → This is a premium tooltip)` |
