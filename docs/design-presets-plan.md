# WebQuark design presets: reviewed implementation plan and token inventory

Status: historical allocation plan. Implementation now supplies both presets; see [the implemented guide](design-presets.md) and [generated compact/comfortable values](design-presets-tokens.md). The TBD entries below record the original planning decision, not the current implementation state.

## Contract

Use `data-wq-preset="compact"` or `data-wq-preset="comfortable"` on the document or a section. Omitted means inherit; at the document root the default is compact. Colour theme remains independently controlled by `data-theme`.

Presets cover typography, spacing, padding and visual sizing of controls and content components. They do not select colours, font family, font weight, border shape, motion, layering or structural layout constraints.

The compact preset must preserve every existing value and expression exactly, including units and fallback expressions. No rounding, conversion, normalization or new typography values during this migration. Comfortable must eventually implement the same preset key set, but all its values are TBD. Do not advertise or release an incomplete comfortable preset, silently substitute compact values, or put literal TBD values into production CSS.

## Review findings incorporated

1. Separate canonical defaults from component override hooks, size contexts and runtime-resolved outputs. Defining all optional hooks globally would change precedence and break existing explicit sizing.
2. Re-emit derived preset aliases at each preset boundary. Root custom-property references can resolve before inheritance: padding and sidepanel-padding aliases need explicit nested-scope tests.
3. Preserve control size choice across preset boundaries. A form/toolbar can publish already-resolved context metrics; changing a nested preset must recompute metrics for the inherited size choice. Carry size intent separately from resolved dimensions. Explicit component size wins, then nearest size scope, then md. Do not reset all nested controls to md.
4. Existing tokens alone cannot scale all text: hardcoded line heights, feedback reserved space and native heading roles need a separate mapping pass. Preserve current values before proposing comfortable values.
5. Preserve component overrides and runtime dimensions. Progress size aliases, avatar resolved size and map rendered marker size must not become preset defaults.

## Complete existing shared-token allocation

The tables below enumerate every declaration in the current generated tokens.css root block. The source of truth remains src/browser/theme/tokens.ts; do not hand-edit generated CSS.

### Inside both presets

Each row is a required key in both presets. The compact column is copied exactly from today's generated stylesheet. Comfortable values are deliberately undecided.

| Token | Compact: exact current value | Comfortable |
| --- | --- | --- |
| `--q-space-none` | `0rem` | TBD |
| `--q-space-xs` | `0.25rem` | TBD |
| `--q-space-sm` | `0.5rem` | TBD |
| `--q-space-md` | `0.75rem` | TBD |
| `--q-space-lg` | `1rem` | TBD |
| `--q-space-xl` | `1.5rem` | TBD |
| `--q-space-2xl` | `2rem` | TBD |
| `--q-space-3xl` | `3rem` | TBD |
| `--q-control-height-sm` | `1.75rem` | TBD |
| `--q-control-font-sm` | `0.75rem` | TBD |
| `--q-control-line-sm` | `1rem` | TBD |
| `--q-control-padding-sm` | `0.5rem` | TBD |
| `--q-control-icon-sm` | `0.875rem` | TBD |
| `--q-control-height-md` | `2.25rem` | TBD |
| `--q-control-font-md` | `0.875rem` | TBD |
| `--q-control-line-md` | `1.25rem` | TBD |
| `--q-control-padding-md` | `0.75rem` | TBD |
| `--q-control-icon-md` | `1rem` | TBD |
| `--q-control-height-lg` | `2.75rem` | TBD |
| `--q-control-font-lg` | `1rem` | TBD |
| `--q-control-line-lg` | `1.5rem` | TBD |
| `--q-control-padding-lg` | `1rem` | TBD |
| `--q-control-icon-lg` | `1.25rem` | TBD |
| `--q-font-size-sm` | `0.7rem` | TBD |
| `--q-font-size-base` | `0.9rem` | TBD |
| `--q-font-size-lg` | `1rem` | TBD |
| `--q-padding-sm` | `var(--q-space-sm, .5rem)` | TBD |
| `--q-padding-md` | `var(--q-space-md, .75rem)` | TBD |
| `--q-padding-lg` | `var(--q-space-lg, 1rem)` | TBD |
| `--q-step-diag-icon-size` | `32px` | TBD |
| `--q-step-diag-item-gap` | `24px` | TBD |
| `--q-reel-gap` | `12px` | TBD |
| `--q-avatar-size-sm` | `28px` | TBD |
| `--q-avatar-size-md` | `40px` | TBD |
| `--q-avatar-size-lg` | `56px` | TBD |
| `--q-carousel-gap` | `16px` | TBD |
| `--q-carousel-padding` | `24px 20px` | TBD |
| `--q-carousel-arrow-size` | `40px` | TBD |
| `--q-carousel-indicator-gap` | `8px` | TBD |
| `--q-carousel-indicator-size` | `6px` | TBD |
| `--q-progress-linear-height-sm` | `4px` | TBD |
| `--q-progress-linear-height-md` | `6px` | TBD |
| `--q-progress-linear-height-lg` | `8px` | TBD |
| `--q-progress-circular-size-sm` | `64px` | TBD |
| `--q-progress-circular-size-md` | `120px` | TBD |
| `--q-progress-circular-size-lg` | `180px` | TBD |
| `--q-progress-circular-stroke-width-sm` | `6px` | TBD |
| `--q-progress-circular-stroke-width-md` | `8px` | TBD |
| `--q-progress-circular-stroke-width-lg` | `10px` | TBD |
| `--q-btn-icon-padding-sm` | `4px` | TBD |
| `--q-btn-icon-padding-md` | `6px` | TBD |
| `--q-btn-icon-padding-lg` | `9px` | TBD |
| `--q-chip-padding-sm` | `4px 9px` | TBD |
| `--q-chip-padding-md` | `6px 11px` | TBD |
| `--q-chip-padding-lg` | `8px 14px` | TBD |
| `--q-chip-height-sm` | `24px` | TBD |
| `--q-chip-height-md` | `30px` | TBD |
| `--q-chip-height-lg` | `36px` | TBD |
| `--q-sidepanel-panel-padding` | `var(--q-padding-lg)` | TBD |
| `--q-sidepanel-panel-header-padding` | `var(--q-padding-lg)` | TBD |
| `--q-sidepanel-panel-footer-padding` | `var(--q-padding-lg)` | TBD |
| `--q-map-marker-size` | `20px` | TBD |
| `--q-map-marker-size-small` | `16px` | TBD |
| `--q-map-marker-size-medium` | `var(--q-map-marker-size)` | TBD |
| `--q-map-marker-size-large` | `24px` | TBD |
### Outside presets: shared defaults and independent colour theme

Keep each value below in the shared theme. Existing light/dark and prefers-color-scheme overrides remain verbatim in their current theme paths; the default column below does not replace them.

Corner radii, including control-radius, stay here because shape is independent of density. Scrollbar width and scrollbar-width mode stay together as shared usability settings. Panel width, map viewport height, reel column definitions and lightbox limits remain layout constraints.

| Token | Exact current shared default |
| --- | --- |
| `--q-control-radius-sm` | `0.34375rem` |
| `--q-control-radius-md` | `0.4375rem` |
| `--q-control-radius-lg` | `0.53125rem` |
| `--q-color-primary` | `#60a5fa` |
| `--q-color-primary-hover` | `#93c5fd` |
| `--q-color-secondary` | `#9777ea` |
| `--q-color-success` | `#34d399` |
| `--q-color-warning` | `#fbbf24` |
| `--q-color-danger` | `#f87171` |
| `--q-bg-base` | `#0b0f19` |
| `--q-bg-surface-1` | `#111827` |
| `--q-bg-surface-2` | `#19243b` |
| `--q-bg-surface-3` | `#22304d` |
| `--q-bg-surface-4` | `#2c3a58` |
| `--q-bg-surface-5` | `#374761` |
| `--q-bg-glass` | `rgba(25, 36, 59, 0.85)` |
| `--q-bg-overlay` | `rgba(0, 0, 0, 0.85)` |
| `--q-fg-base` | `#f9fafb` |
| `--q-fg-muted` | `#9ca3af` |
| `--q-border-color` | `#374151` |
| `--q-dialog-backdrop-bg` | `var(--q-bg-overlay, rgba(0, 0, 0, 0.85))` |
| `--q-dialog-backdrop-solid-bg` | `var(--q-bg-overlay, rgba(0, 0, 0, 0.85))` |
| `--q-shadow-low` | `0 2px 4px rgba(0, 0, 0, 0.2)` |
| `--q-shadow-medium` | `0 8px 16px rgba(0, 0, 0, 0.3)` |
| `--q-shadow-high` | `0 16px 32px rgba(0, 0, 0, 0.45)` |
| `--q-glow-interactive` | `0 0 20px rgba(96, 165, 250, 0.3)` |
| `--q-border-width` | `1px` |
| `--q-border` | `var(--q-border-width) solid var(--q-border-color)` |
| `--q-focus-ring` | `2px solid var(--q-color-primary)` |
| `--q-font-family` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` |
| `--q-font-weight-normal` | `400` |
| `--q-font-weight-bold` | `600` |
| `--q-radius-sm` | `4px` |
| `--q-radius-md` | `7px` |
| `--q-radius-lg` | `11px` |
| `--q-transition-fast` | `150ms ease` |
| `--q-transition-normal` | `250ms cubic-bezier(0.4, 0, 0.2, 1)` |
| `--q-transition-slow` | `400ms cubic-bezier(0.4, 0, 0.2, 1)` |
| `--q-z-index-overlay` | `1000` |
| `--q-z-index-popover` | `1100` |
| `--q-z-index-toast` | `1200` |
| `--q-hover-transform` | `translateY(-4px) scale(1.02)` |
| `--q-btn-hover-overlay` | `color-mix(in srgb, var(--q-fg-base) 8%, transparent)` |
| `--q-card-border` | `var(--q-border)` |
| `--q-card-hover-transform` | `var(--q-hover-transform)` |
| `--q-card-transition-duration` | `var(--q-transition-normal)` |
| `--q-step-diag-line` | `2px solid var(--q-border-color)` |
| `--q-step-diag-border` | `var(--q-border)` |
| `--q-thumb-aspect-ratio` | `16 / 9` |
| `--q-thumb-border` | `2px solid var(--q-thumb-border-color)` |
| `--q-thumb-hover-transform` | `var(--q-hover-transform)` |
| `--q-thumb-overlay-bg` | `rgba(0, 0, 0, 0.4)` |
| `--q-thumb-radius` | `var(--q-radius-md)` |
| `--q-thumb-border-color` | `transparent` |
| `--q-thumb-glow` | `var(--q-glow-interactive)` |
| `--q-reel-columns-desktop` | `repeat(auto-fill, minmax(200px, 1fr))` |
| `--q-reel-columns-mobile` | `1fr` |
| `--q-lightbox-max-size` | `90vh` |
| `--q-reel-lightbox-btn-bg` | `rgba(0, 0, 0, 0.5)` |
| `--q-reel-lightbox-btn-border` | `1px solid rgba(255, 255, 255, 0.2)` |
| `--q-reel-lightbox-btn-color` | `#ffffff` |
| `--q-reel-lightbox-btn-hover-bg` | `rgba(255, 255, 255, 0.2)` |
| `--q-avatar-bg` | `var(--q-bg-surface-3)` |
| `--q-avatar-fg` | `var(--q-fg-base)` |
| `--q-avatar-border` | `var(--q-border)` |
| `--q-conversation-incoming-bg` | `var(--q-bg-surface-2)` |
| `--q-conversation-outgoing-bg` | `var(--q-color-primary)` |
| `--q-conversation-outgoing-fg` | `#ffffff` |
| `--q-conversation-system-bg` | `transparent` |
| `--q-conversation-system-fg` | `var(--q-fg-muted)` |
| `--q-carousel-arrow-bg` | `var(--q-bg-overlay)` |
| `--q-carousel-arrow-border` | `var(--q-border)` |
| `--q-carousel-arrow-color` | `#ffffff` |
| `--q-progress-transition` | `var(--q-transition-normal)` |
| `--q-progress-indeterminate-duration` | `1.4s` |
| `--q-progress-linear-radius` | `999px` |
| `--q-progress-circular-linecap` | `round` |
| `--q-progress-circular-font-weight` | `var(--q-font-weight-bold)` |
| `--q-btn-font-weight` | `var(--q-font-weight-bold)` |
| `--q-btn-active-transform` | `scale(0.97)` |
| `--q-btn-transition` | `all 150ms cubic-bezier(0.4, 0, 0.2, 1)` |
| `--q-chip-radius` | `999px` |
| `--q-chip-border` | `var(--q-border)` |
| `--q-chip-font-weight` | `var(--q-font-weight-bold)` |
| `--q-chip-active-transform` | `scale(0.97)` |
| `--q-field-border` | `var(--q-border)` |
| `--q-field-border-color-focus` | `var(--q-color-primary)` |
| `--q-input-border` | `var(--q-field-border)` |
| `--q-dropdown-border` | `var(--q-field-border)` |
| `--q-panel-border` | `var(--q-border)` |
| `--q-sidepanel-bg` | `var(--q-bg-surface-1)` |
| `--q-sidepanel-border` | `var(--q-border)` |
| `--q-sidepanel-shadow` | `var(--q-shadow-high)` |
| `--q-sidepanel-panel-width` | `320px` |
| `--q-sidepanel-panel-section-border` | `var(--q-border)` |
| `--q-map-height` | `100%` |
| `--q-map-min-height` | `240px` |
| `--q-map-bg` | `var(--q-bg-surface-1)` |
| `--q-map-border` | `var(--q-border)` |
| `--q-map-radius` | `var(--q-radius-lg)` |
| `--q-map-marker-color` | `var(--q-color-primary)` |
| `--q-map-marker-success` | `var(--q-color-success)` |
| `--q-map-marker-warning` | `var(--q-color-warning)` |
| `--q-map-marker-danger` | `var(--q-color-danger)` |
| `--q-map-marker-muted` | `var(--q-fg-muted)` |
| `--q-map-marker-selected-color` | `var(--q-fg-base)` |
| `--q-map-marker-selected-shadow` | `var(--q-shadow-medium)` |
| `--q-map-attribution-bg` | `var(--q-bg-base)` |
| `--q-map-attribution-color` | `var(--q-fg-muted)` |
| `--q-scrollbar-width` | `6px` |
| `--q-scrollbar-width-thin` | `thin` |
| `--q-scrollbar-track-color` | `transparent` |
| `--q-scrollbar-thumb-color` | `var(--q-border-color, #374151)` |
| `--q-scrollbar-thumb-color-hover` | `var(--q-color-primary, #60a5fa)` |
| `--q-scrollbar-radius` | `var(--q-radius-sm, 4px)` |
## Component-owned variables: outside preset declarations

This appendix inventories additional concrete --q-* names found in production component/theme/utility CSS and TypeScript, plus the optional surface names constructed by surfaceValue(). These names have no declaration in the current shared root block. Some are optional consumer overrides; others are locally declared defaults or runtime/context values. Keep their current declaration ownership and fallback values. A reference is evidence of use, not a guarantee that the name is a documented public API.

For all rows, do not invent an compact root value or promote the hook into both preset objects. A component's default can still respond to presets through its fallback chain. During implementation, wire density-related fallback chains to the relevant preset metrics while preserving the hook's priority. Retain local appearance and layout semantics. Runtime/context rows require ownership-aware handling rather than global values.

Private --_q-* implementation variables are outside the public preset schema. Keep them local; update their calculations only where needed to consume preset inputs. Partial template names such as --q-control- are not tokens and are excluded; existing generated size variants are covered above.

| Variable | Planned ownership | Current source reference |
| --- | --- | --- |
| `--q-alert-accent-border` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:20` |
| `--q-alert-actions-gap` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:72` |
| `--q-alert-bg` | Component-owned; preserve override/local fallback | `src/browser/components/communication/toast/toast.css:74` |
| `--q-alert-border` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:19` |
| `--q-alert-dismiss-fg` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:88` |
| `--q-alert-dismiss-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:100` |
| `--q-alert-dismiss-radius` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:90` |
| `--q-alert-dismiss-size` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:84` |
| `--q-alert-fg` | Component-owned; preserve override/local fallback | `src/browser/components/communication/toast/toast.css:79` |
| `--q-alert-gap` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:15` |
| `--q-alert-heading-fg` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:58` |
| `--q-alert-heading-gap` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:57` |
| `--q-alert-heading-size` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:59` |
| `--q-alert-heading-weight` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:60` |
| `--q-alert-message-fg` | Component-owned; preserve override/local fallback | `src/browser/components/communication/toast/toast.css:80` |
| `--q-alert-message-size` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:66` |
| `--q-alert-padding` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:18` |
| `--q-alert-radius` | Component-owned; preserve override/local fallback | `src/browser/components/communication/alert/alert.css:21` |
| `--q-avatar-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/media/avatar/avatar.css:20` |
| `--q-avatar-font-size-lg` | Component-owned; preserve override/local fallback | `src/browser/components/media/avatar/avatar.css:35` |
| `--q-avatar-font-size-sm` | Component-owned; preserve override/local fallback | `src/browser/components/media/avatar/avatar.css:29` |
| `--q-avatar-font-weight` | Component-owned; preserve override/local fallback | `src/browser/components/media/avatar/avatar.css:21` |
| `--q-avatar-radius` | Component-owned; preserve override/local fallback | `src/browser/components/media/avatar/avatar.css:48` |
| `--q-avatar-resolved-size` | Local/runtime-derived; never a preset default | `src/browser/components/media/avatar/avatar.tsx:87` |
| `--q-bg-canvas` | Optional surface override; outside presets (dynamically constructed) | `src/browser/theme/tokens.ts:42` |
| `--q-bg-panel` | Optional surface override; outside presets (dynamically constructed) | `src/browser/theme/tokens.ts:42` |
| `--q-bg-card` | Component-owned; preserve override/local fallback | `src/browser/components/content/card/card.css:34` |
| `--q-bg-field` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/textarea/textarea.css:103` |
| `--q-bg-floating` | Component-owned; preserve override/local fallback | `src/browser/components/overlays/dialog/dialog.css:251` |
| `--q-btn-circle-padding` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:75` |
| `--q-btn-circle-size` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:73` |
| `--q-btn-content-gap` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:177` |
| `--q-btn-content-gap-sm` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:181` |
| `--q-btn-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:45` |
| `--q-btn-height` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:198` |
| `--q-btn-padding` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:198` |
| `--q-btn-padding-lg` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:49` |
| `--q-btn-padding-md` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:44` |
| `--q-btn-padding-sm` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:39` |
| `--q-btn-radius` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:18` |
| `--q-btn-radius-lg` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:48` |
| `--q-btn-radius-md` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:43` |
| `--q-btn-radius-sm` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:38` |
| `--q-btn-stacked-gap` | Component-owned; preserve override/local fallback | `src/browser/components/actions/button/button.css:81` |
| `--q-card-bg` | Component-owned; preserve override/local fallback | `src/browser/components/content/card/card.css:97` |
| `--q-card-divider` | Component-owned; preserve override/local fallback | `src/browser/components/content/card/card.css:104` |
| `--q-card-footer-padding` | Component-owned; preserve override/local fallback | `src/browser/components/content/card/card.css:102` |
| `--q-card-header-padding` | Component-owned; preserve override/local fallback | `src/browser/components/content/card/card.css:100` |
| `--q-card-min-width` | Component-owned; preserve override/local fallback | `src/browser/components/content/card/card.css:3` |
| `--q-card-padding` | Component-owned; preserve override/local fallback | `src/browser/components/content/card/card.css:101` |
| `--q-carousel-item-flex` | Component-owned; preserve override/local fallback | `src/browser/components/content/carousel/carousel.css:10` |
| `--q-carousel-item-width` | Component-owned; preserve override/local fallback | `src/browser/components/content/carousel/carousel.css:11` |
| `--q-carousel-snap-align` | Component-owned; preserve override/local fallback | `src/browser/components/content/carousel/carousel.css:12` |
| `--q-chip-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:21` |
| `--q-chip-danger-selected-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:171` |
| `--q-chip-danger-selected-border-color` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:168` |
| `--q-chip-danger-selected-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:169` |
| `--q-chip-disabled-opacity` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:44` |
| `--q-chip-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:20` |
| `--q-chip-focus-offset` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:55` |
| `--q-chip-font-size-lg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:87` |
| `--q-chip-font-size-md` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:80` |
| `--q-chip-font-size-sm` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:73` |
| `--q-chip-gap-lg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:85` |
| `--q-chip-gap-md` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:78` |
| `--q-chip-gap-sm` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:71` |
| `--q-chip-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:62` |
| `--q-chip-hover-border-color` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:59` |
| `--q-chip-hover-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:60` |
| `--q-chip-primary-selected-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:148` |
| `--q-chip-removable-padding-end` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:49` |
| `--q-chip-remove-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:197` |
| `--q-chip-remove-offset` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:181` |
| `--q-chip-remove-opacity` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:188` |
| `--q-chip-remove-size` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:179` |
| `--q-chip-selected-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:144` |
| `--q-chip-selected-border-color` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:141` |
| `--q-chip-selected-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:142` |
| `--q-chip-success-selected-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:157` |
| `--q-chip-success-selected-border-color` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:154` |
| `--q-chip-success-selected-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:155` |
| `--q-chip-warning-selected-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:164` |
| `--q-chip-warning-selected-border-color` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:161` |
| `--q-chip-warning-selected-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/chip/chip.css:162` |
| `--q-context-control-font` | Size/field scope context; never a preset default | `src/browser/theme/behaviors/control-sizing.css:5` |
| `--q-context-control-height` | Size/field scope context; never a preset default | `src/browser/theme/behaviors/control-sizing.css:4` |
| `--q-context-control-icon` | Size/field scope context; never a preset default | `src/browser/theme/behaviors/control-sizing.css:8` |
| `--q-context-control-line` | Size/field scope context; never a preset default | `src/browser/theme/behaviors/control-sizing.css:6` |
| `--q-context-control-padding` | Size/field scope context; never a preset default | `src/browser/theme/behaviors/control-sizing.css:7` |
| `--q-context-control-radius` | Size/field scope context; never a preset default | `src/browser/theme/behaviors/control-sizing.css:9` |
| `--q-context-feedback-min` | Size/field scope context; never a preset default | `src/browser/theme/behaviors/field-feedback.css:15` |
| `--q-conversation-border` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:51` |
| `--q-conversation-compact-padding` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:139` |
| `--q-conversation-fg` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:5` |
| `--q-conversation-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:60` |
| `--q-conversation-footer-gap` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:69` |
| `--q-conversation-footer-margin` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:70` |
| `--q-conversation-gap` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:12` |
| `--q-conversation-header-gap` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:37` |
| `--q-conversation-header-inset` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:38` |
| `--q-conversation-line-height` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:61` |
| `--q-conversation-max-width` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:33` |
| `--q-conversation-meta-fg` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:71` |
| `--q-conversation-meta-gap` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:84` |
| `--q-conversation-meta-size` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:43` |
| `--q-conversation-mobile-avatar-max-width` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:152` |
| `--q-conversation-mobile-max-width` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:148` |
| `--q-conversation-outgoing-border` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:108` |
| `--q-conversation-outgoing-meta-fg` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:113` |
| `--q-conversation-padding` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:50` |
| `--q-conversation-radius` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:52` |
| `--q-conversation-sender-fg` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:42` |
| `--q-conversation-shadow` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:54` |
| `--q-conversation-system-border` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:132` |
| `--q-conversation-system-max-width` | Component-owned; preserve override/local fallback | `src/browser/components/communication/conversation-bubble/conversation-bubble.css:127` |
| `--q-dialog-bg` | Component-owned; preserve override/local fallback | `src/browser/components/overlays/dialog/dialog.css:251` |
| `--q-dialog-body-bg` | Component-owned; preserve override/local fallback | `src/browser/components/overlays/dialog/dialog.css:256` |
| `--q-dialog-body-padding` | Component-owned; preserve override/local fallback | `src/browser/components/overlays/dialog/dialog.css:256` |
| `--q-dialog-footer-bg` | Component-owned; preserve override/local fallback | `src/browser/components/overlays/dialog/dialog.css:257` |
| `--q-dialog-footer-padding` | Component-owned; preserve override/local fallback | `src/browser/components/overlays/dialog/dialog.css:257` |
| `--q-dialog-gutter` | Component-owned; preserve override/local fallback | `src/browser/components/overlays/dialog/dialog.css:250` |
| `--q-dialog-header-bg` | Component-owned; preserve override/local fallback | `src/browser/components/overlays/dialog/dialog.css:255` |
| `--q-dialog-header-padding` | Component-owned; preserve override/local fallback | `src/browser/components/overlays/dialog/dialog.css:255` |
| `--q-dialog-width` | Component-owned; preserve override/local fallback | `src/browser/components/overlays/dialog/dialog.css:251` |
| `--q-dropdown-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:351` |
| `--q-dropdown-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/dropdown/dropdown.css:169` |
| `--q-dropdown-height` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/dropdown/dropdown.css:315` |
| `--q-dropdown-icon-gap` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/dropdown/dropdown.css:63` |
| `--q-dropdown-menu-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:352` |
| `--q-dropdown-padding` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/dropdown/dropdown.css:37` |
| `--q-dropdown-radius` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/dropdown/dropdown.css:36` |
| `--q-fg-disabled` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:273` |
| `--q-fg-subtle` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:67` |
| `--q-field-bg` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/textarea/textarea.css:103` |
| `--q-field-feedback-font` | Component-owned; preserve override/local fallback | `src/browser/theme/behaviors/field-feedback.css:17` |
| `--q-field-label-font` | Component-owned; preserve override/local fallback | `src/browser/theme/behaviors/field-feedback.css:28` |
| `--q-field-padding` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/textarea/textarea.css:103` |
| `--q-field-radius` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/textarea/textarea.css:43` |
| `--q-font-size-2xs` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:671` |
| `--q-font-size-xs` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:75` |
| `--q-font-weight-medium` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:12` |
| `--q-form-action-gap` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/form/form.css:48` |
| `--q-form-actions-padding-top` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/form/form.css:49` |
| `--q-form-fg` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/form/form.css:11` |
| `--q-form-field-gap` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/form/form.css:39` |
| `--q-form-gap` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/form/form.css:9` |
| `--q-form-title-color` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/form/form.css:22` |
| `--q-form-title-size` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/form/form.css:23` |
| `--q-icon-stroke-width` | Component-owned; preserve override/local fallback | `src/browser/components/media/icon/icon.css:22` |
| `--q-input-bg` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/textarea/textarea.css:41` |
| `--q-input-height` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/input/input.css:156` |
| `--q-input-padding` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/textarea/textarea.css:44` |
| `--q-input-radius` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/textarea/textarea.css:43` |
| `--q-input-text-align` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/input/input.css:42` |
| `--q-link-accent-color` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:59` |
| `--q-link-color` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:9` |
| `--q-link-color-hover` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:23` |
| `--q-link-danger-color` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:63` |
| `--q-link-disabled-color` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:67` |
| `--q-link-external-icon-size` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:83` |
| `--q-link-focus-offset` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:28` |
| `--q-link-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:11` |
| `--q-link-font-weight` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:12` |
| `--q-link-gap` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:8` |
| `--q-link-muted-color` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:50` |
| `--q-link-muted-color-hover` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:55` |
| `--q-link-underline-offset` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:15` |
| `--q-map-marker-callout-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:553` |
| `--q-map-marker-callout-max-width` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:548` |
| `--q-map-marker-callout-meta-color` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:642` |
| `--q-map-marker-callout-status-accent` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:603` |
| `--q-map-marker-callout-status-max-width` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:607` |
| `--q-map-marker-callout-width` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:548` |
| `--q-map-marker-cluster-size` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.tsx:98` |
| `--q-map-marker-content-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.tsx:102` |
| `--q-map-marker-content-color` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.tsx:103` |
| `--q-map-marker-content-gap` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.tsx:101` |
| `--q-map-marker-icon-offset-x` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:400` |
| `--q-map-marker-icon-offset-y` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:401` |
| `--q-map-marker-icon-size` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.css:397` |
| `--q-map-marker-pulse-color` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.tsx:100` |
| `--q-map-marker-rendered-size` | Local/runtime-derived; never a preset default | `src/browser/components/data-display/map/map.css:278` |
| `--q-map-marker-ring-color` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.tsx:99` |
| `--q-map-tile-filter` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/map/map.tsx:106` |
| `--q-navbar-action-gap` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:160` |
| `--q-navbar-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:59` |
| `--q-navbar-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:74` |
| `--q-navbar-brand-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:144` |
| `--q-navbar-compact-height` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:99` |
| `--q-navbar-compact-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:100` |
| `--q-navbar-compact-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:114` |
| `--q-navbar-edge-compact-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:10` |
| `--q-navbar-edge-mobile-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:11` |
| `--q-navbar-edge-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:9` |
| `--q-navbar-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:58` |
| `--q-navbar-gap` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:92` |
| `--q-navbar-height` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:93` |
| `--q-navbar-item-active-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:254` |
| `--q-navbar-item-active-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:253` |
| `--q-navbar-item-bg-hover` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:244` |
| `--q-navbar-item-disabled-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:259` |
| `--q-navbar-item-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:185` |
| `--q-navbar-item-fg-hover` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:243` |
| `--q-navbar-item-gap` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:180` |
| `--q-navbar-item-icon-only-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:325` |
| `--q-navbar-item-icon-only-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:304` |
| `--q-navbar-item-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:182` |
| `--q-navbar-item-radius` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:184` |
| `--q-navbar-item-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:188` |
| `--q-navbar-item-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:170` |
| `--q-navbar-logo-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:134` |
| `--q-navbar-menu-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:343` |
| `--q-navbar-menu-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:340` |
| `--q-navbar-mobile-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:417` |
| `--q-navbar-mobile-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:369` |
| `--q-navbar-mobile-panel-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:416` |
| `--q-navbar-nav-gap` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:151` |
| `--q-navbar-nav-offset-inline` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:476` |
| `--q-navbar-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:94` |
| `--q-navbar-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:107` |
| `--q-navbar-z-index` | Component-owned; preserve override/local fallback | `src/browser/components/layout/navbar/navbar.css:5` |
| `--q-pagination-button-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:39` |
| `--q-pagination-button-border` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:37` |
| `--q-pagination-button-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:36` |
| `--q-pagination-button-height` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:34` |
| `--q-pagination-button-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:52` |
| `--q-pagination-button-hover-border` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:50` |
| `--q-pagination-button-hover-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:49` |
| `--q-pagination-button-padding` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:35` |
| `--q-pagination-button-radius` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:38` |
| `--q-pagination-controls-gap` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:29` |
| `--q-pagination-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:4` |
| `--q-pagination-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:6` |
| `--q-pagination-font-weight` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:7` |
| `--q-pagination-gap` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:15` |
| `--q-pagination-page-count-width` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/pagination/pagination.css:68` |
| `--q-panel-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:35` |
| `--q-panel-divider` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:58` |
| `--q-panel-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:21` |
| `--q-panel-footer-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:111` |
| `--q-panel-header-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:53` |
| `--q-panel-header-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:52` |
| `--q-panel-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:101` |
| `--q-panel-padding-lg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:105` |
| `--q-panel-padding-md` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:103` |
| `--q-panel-padding-sm` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:101` |
| `--q-panel-radius` | Component-owned; preserve override/local fallback | `src/browser/components/layout/panel/panel.css:41` |
| `--q-panel-shadow` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:56` |
| `--q-panel-transition-duration` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:40` |
| `--q-panel-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.tsx:390` |
| `--q-progress-bar-fill-color` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:103` |
| `--q-progress-bar-height` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:82` |
| `--q-progress-bar-indeterminate-duration` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:117` |
| `--q-progress-bar-radius` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:89` |
| `--q-progress-bar-track-color` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:93` |
| `--q-progress-bar-transition` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:108` |
| `--q-progress-circular-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:177` |
| `--q-progress-circular-font-size-lg` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:51` |
| `--q-progress-circular-font-size-md` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:13` |
| `--q-progress-circular-font-size-sm` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:38` |
| `--q-progress-circular-size` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:124` |
| `--q-progress-circular-stroke-width` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:154` |
| `--q-progress-fill-color` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:102` |
| `--q-progress-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.tsx:89` |
| `--q-progress-font-weight` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:182` |
| `--q-progress-linear-height` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:80` |
| `--q-progress-size` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:126` |
| `--q-progress-stroke-width` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:155` |
| `--q-progress-track-color` | Component-owned; preserve override/local fallback | `src/browser/components/indicators/progress/progress.css:92` |
| `--q-quantity-selector-bg` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:7` |
| `--q-quantity-selector-border-color` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:8` |
| `--q-quantity-selector-btn-bg` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:15` |
| `--q-quantity-selector-btn-bg-hover` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:16` |
| `--q-quantity-selector-btn-fg` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:17` |
| `--q-quantity-selector-btn-fg-hover` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:18` |
| `--q-quantity-selector-char-width` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:21` |
| `--q-quantity-selector-height` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:41` |
| `--q-quantity-selector-input-bg` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:11` |
| `--q-quantity-selector-input-fg` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:12` |
| `--q-quantity-selector-input-padding` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:22` |
| `--q-quantity-selector-radius` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:31` |
| `--q-quantity-selector-width-vertical` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/quantity-selector/quantity-selector.css:4` |
| `--q-radio-group-bg` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/radio-group/radio-group.css:3` |
| `--q-radio-group-border` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/radio-group/radio-group.css:4` |
| `--q-radio-group-error-color` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/radio-group/radio-group.css:9` |
| `--q-radio-group-focus-ring` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/radio-group/radio-group.css:8` |
| `--q-radio-group-option-count` | Local/runtime-derived; never a preset default | `src/browser/components/inputs/radio-group/radio-group.tsx:252` |
| `--q-radio-group-option-min-height` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/radio-group/radio-group.css:55` |
| `--q-radio-group-option-padding` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/radio-group/radio-group.css:56` |
| `--q-radio-group-radius` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/radio-group/radio-group.css:42` |
| `--q-radio-group-selected-bg` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/radio-group/radio-group.css:5` |
| `--q-radio-group-selected-color` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/radio-group/radio-group.css:7` |
| `--q-radius-xs` | Component-owned; preserve override/local fallback | `src/browser/components/actions/link/link.css:29` |
| `--q-sidepanel-collapse-control-adornment-left` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:558` |
| `--q-sidepanel-collapse-control-adornment-top` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:557` |
| `--q-sidepanel-collapse-control-adornment-translate-x` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:563` |
| `--q-sidepanel-collapse-control-adornment-translate-y` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:564` |
| `--q-sidepanel-collapse-control-block-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:571` |
| `--q-sidepanel-collapse-control-inline-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:570` |
| `--q-sidepanel-collapse-control-position` | Local/runtime-derived; never a preset default | `src/browser/components/layout/sidepanel/sidepanel.tsx:351` |
| `--q-sidepanel-collapse-control-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:201` |
| `--q-sidepanel-collapse-icon-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:638` |
| `--q-sidepanel-collapsed-header-height` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:510` |
| `--q-sidepanel-collapsed-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:199` |
| `--q-sidepanel-drawer-footer-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:158` |
| `--q-sidepanel-drawer-section-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:159` |
| `--q-sidepanel-edge-tab-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:573` |
| `--q-sidepanel-edge-tab-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:577` |
| `--q-sidepanel-edge-tab-current-bg` | Local/runtime-derived; never a preset default | `src/browser/components/layout/sidepanel/sidepanel.css:573` |
| `--q-sidepanel-edge-tab-height` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:571` |
| `--q-sidepanel-edge-tab-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:659` |
| `--q-sidepanel-edge-tab-icon-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:663` |
| `--q-sidepanel-edge-tab-radius` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:578` |
| `--q-sidepanel-edge-tab-shoulder-after-inset` | Local/runtime-derived; never a preset default | `src/browser/components/layout/sidepanel/sidepanel.css:601` |
| `--q-sidepanel-edge-tab-shoulder-after-origin` | Local/runtime-derived; never a preset default | `src/browser/components/layout/sidepanel/sidepanel.css:603` |
| `--q-sidepanel-edge-tab-shoulder-before-inset` | Local/runtime-derived; never a preset default | `src/browser/components/layout/sidepanel/sidepanel.css:592` |
| `--q-sidepanel-edge-tab-shoulder-before-origin` | Local/runtime-derived; never a preset default | `src/browser/components/layout/sidepanel/sidepanel.css:594` |
| `--q-sidepanel-edge-tab-shoulder-radius` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:572` |
| `--q-sidepanel-edge-tab-shoulder-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:572` |
| `--q-sidepanel-edge-tab-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:570` |
| `--q-sidepanel-expanded-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:198` |
| `--q-sidepanel-hidden-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:200` |
| `--q-sidepanel-nav-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:247` |
| `--q-sidepanel-nav-depth-color` | Local/runtime-derived; never a preset default | `src/browser/components/layout/sidepanel/sidepanel.css:334` |
| `--q-sidepanel-nav-depth-primary-color` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:334` |
| `--q-sidepanel-nav-depth-secondary-color` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:360` |
| `--q-sidepanel-nav-icon-opacity` | Component-owned; preserve override/local fallback | `src/browser/components/layout/sidepanel/sidepanel.css:423` |
| `--q-syntax-attr` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:9` |
| `--q-syntax-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:3` |
| `--q-syntax-border` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:4` |
| `--q-syntax-code-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:14` |
| `--q-syntax-comment` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:7` |
| `--q-syntax-compact-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:15` |
| `--q-syntax-font-mono` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:12` |
| `--q-syntax-header-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:5` |
| `--q-syntax-header-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:13` |
| `--q-syntax-number` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:11` |
| `--q-syntax-tag` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:8` |
| `--q-syntax-text` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:6` |
| `--q-syntax-value` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/syntax-box/syntax-box.css:10` |
| `--q-table-cell-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:57` |
| `--q-table-cell-padding-block` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:63` |
| `--q-table-cell-padding-inline` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:64` |
| `--q-table-dropdown-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:36` |
| `--q-table-dropdown-border` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:38` |
| `--q-table-dropdown-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:40` |
| `--q-table-dropdown-menu-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:37` |
| `--q-table-dropdown-primary` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:39` |
| `--q-table-group-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:32` |
| `--q-table-group-border` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:34` |
| `--q-table-group-fg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:33` |
| `--q-table-group-padding` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:35` |
| `--q-table-max-height` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:31` |
| `--q-table-outer-border` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:12` |
| `--q-table-outer-radius` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:13` |
| `--q-table-search-width` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:200` |
| `--q-table-sticky-column-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:41` |
| `--q-table-sticky-column-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:42` |
| `--q-table-sticky-column-selected-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:43` |
| `--q-table-sticky-column-selected-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.tsx:44` |
| `--q-table-toolbar-min-height` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:170` |
| `--q-table-toolbar-padding-block` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:171` |
| `--q-table-toolbar-padding-inline` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:171` |
| `--q-table-toolbar-padding-inline-end` | Component-owned; preserve override/local fallback | `src/browser/components/data-display/data-table/data-table.css:172` |
| `--q-tabs-active-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:20` |
| `--q-tabs-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:135` |
| `--q-tabs-button-active-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:184` |
| `--q-tabs-button-active-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:185` |
| `--q-tabs-button-active-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:186` |
| `--q-tabs-button-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:181` |
| `--q-tabs-button-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:179` |
| `--q-tabs-button-gap` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:178` |
| `--q-tabs-button-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:182` |
| `--q-tabs-button-hover-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:183` |
| `--q-tabs-button-radius` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:180` |
| `--q-tabs-enclosed-active-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:151` |
| `--q-tabs-enclosed-active-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:152` |
| `--q-tabs-enclosed-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:149` |
| `--q-tabs-enclosed-hover-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:150` |
| `--q-tabs-enclosed-radius` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:148` |
| `--q-tabs-enclosed-radius-vertical` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:242` |
| `--q-tabs-enclosed-tab-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:147` |
| `--q-tabs-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:4` |
| `--q-tabs-font-size` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:73` |
| `--q-tabs-font-size-lg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:85` |
| `--q-tabs-font-size-md` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:79` |
| `--q-tabs-font-size-sm` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:73` |
| `--q-tabs-font-weight` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:53` |
| `--q-tabs-height` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:71` |
| `--q-tabs-height-lg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:83` |
| `--q-tabs-height-md` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:77` |
| `--q-tabs-height-sm` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:71` |
| `--q-tabs-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:16` |
| `--q-tabs-hover-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:121` |
| `--q-tabs-icon-gap` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:41` |
| `--q-tabs-icon-only-width-lg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:99` |
| `--q-tabs-icon-only-width-md` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:94` |
| `--q-tabs-icon-only-width-sm` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:89` |
| `--q-tabs-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:72` |
| `--q-tabs-padding-lg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:84` |
| `--q-tabs-padding-md` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:78` |
| `--q-tabs-padding-sm` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:72` |
| `--q-tabs-pills-active-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:172` |
| `--q-tabs-pills-active-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:173` |
| `--q-tabs-pills-active-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:174` |
| `--q-tabs-pills-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:168` |
| `--q-tabs-pills-gap` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:167` |
| `--q-tabs-pills-hover-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:170` |
| `--q-tabs-pills-hover-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:171` |
| `--q-tabs-pills-radius` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:169` |
| `--q-tabs-tab-max-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:46` |
| `--q-tabs-underline-radius` | Component-owned; preserve override/local fallback | `src/browser/components/layout/tabs/tabs.css:133` |
| `--q-toast-gap` | Component-owned; preserve override/local fallback | `src/browser/components/communication/toast/toast.css:43` |
| `--q-toast-icon-size` | Component-owned; preserve override/local fallback | `src/browser/components/communication/toast/toast.css:89` |
| `--q-toast-inset` | Component-owned; preserve override/local fallback | `src/browser/components/communication/toast/toast.css:11` |
| `--q-toast-max-visible` | Component-owned; preserve override/local fallback | `src/browser/components/communication/toast/toast.tsx:352` |
| `--q-toast-shadow` | Component-owned; preserve override/local fallback | `src/browser/components/communication/toast/toast.css:84` |
| `--q-toast-width` | Component-owned; preserve override/local fallback | `src/browser/components/communication/toast/toast.css:6` |
| `--q-toggle-bg-off` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:8` |
| `--q-toggle-bg-on` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:9` |
| `--q-toggle-border-color` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:11` |
| `--q-toggle-border-color-on` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:12` |
| `--q-toggle-box-size` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:185` |
| `--q-toggle-checkbox-size` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:99` |
| `--q-toggle-error-color` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:16` |
| `--q-toggle-focus-ring` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:15` |
| `--q-toggle-height` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:181` |
| `--q-toggle-size` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:181` |
| `--q-toggle-switch-height` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:65` |
| `--q-toggle-switch-width` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:64` |
| `--q-toggle-thumb-color` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:10` |
| `--q-toggle-thumb-size` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:78` |
| `--q-toggle-width` | Component-owned; preserve override/local fallback | `src/browser/components/inputs/toggle/toggle.css:181` |
| `--q-toolbar-bg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:57` |
| `--q-toolbar-border` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:72` |
| `--q-toolbar-compact-height` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:98` |
| `--q-toolbar-compact-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:99` |
| `--q-toolbar-compact-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:114` |
| `--q-toolbar-edge-compact-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:10` |
| `--q-toolbar-edge-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:9` |
| `--q-toolbar-fg` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:56` |
| `--q-toolbar-gap` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:91` |
| `--q-toolbar-height` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:92` |
| `--q-toolbar-padding` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:93` |
| `--q-toolbar-width` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:107` |
| `--q-toolbar-z-index` | Component-owned; preserve override/local fallback | `src/browser/components/layout/toolbar/toolbar.css:5` |
## New semantic variables: names planned, values not assigned

These are additions, not existing set values. Do not include invented values in the initial compact migration. First record the current computed value at each intended consumer; introduce semantic mapping only when it can preserve those defaults. Different existing consumers must not be forced into one value if that changes their appearance.

- --q-text-body-size and --q-text-body-line-height
- --q-text-small-size and --q-text-small-line-height
- --q-heading-display-size and --q-heading-display-line-height
- --q-heading-1-size through --q-heading-6-size, with matching --q-heading-1-line-height through --q-heading-6-line-height
- --q-content-paragraph-gap, --q-content-heading-gap, --q-content-section-gap and --q-content-padding

Also audit field label/feedback line heights and reserved feedback height. Current field-feedback.css and form/shared field logic contain fixed dimensions that must stay compatible. Choose any new semantic names only after mapping those consumers; do not change their existing optional font overrides into global defaults.

## Implementation sequence

### 1. Capture compatibility baseline

Record current computed font sizes, line heights, paddings, gaps, dimensions and wrapping for components and their variants. Include no global stylesheet (component fallback behaviour), default theme, scoped token overrides, explicit sizes and sm/md/lg/inherit. Use the current inventory as a reviewed migration manifest; fail validation for duplicate, missing or unclassified root keys.

### 2. Model presets without duplicating ownership

In src/browser/theme/tokens.ts define a typed manifest of the 65 existing preset keys, exact compact values and shared ownership of the other 115 keys. Keep existing exported helpers/types compatible. Export QPreset = 'compact' | 'comfortable' when the public feature is complete. A comfortable design draft can use TBD in documentation only; production definitions must be complete and valid before release.

Keep controls metadata compatible with controlScope, control-sizing.css generation and rem-based helpers. Splitting radius ownership must not drop radius from existing control APIs. Keep actual numeric compact controls and the generated CSS equivalent to today's values.

### 3. Generate styles and documentation

Extend scripts/generate-theme.ts to emit src/browser/theme/token-presets.css. Move preset-controlled root defaults out of generated tokens.css so one source owns them. Import tokens.css then token-presets.css in src/browser/theme/theme.css. Preserve all colour rules and outside defaults verbatim. Generate compact at :root and explicit [data-wq-preset='compact']; emit complete comfortable only after its design values are defined.

Generate the token matrix and usage documentation. Verify deterministic regeneration and package inclusion. Use selector specificity and stylesheet order that allow consumer overrides; document that an explicit nested preset resets its complete key set.

### 4. Integrate component fallback chains

Audit every sizing-related hook listed above and every hardcoded dimension that represents density. Retain explicit public overrides and properties first; then use preset-aware defaults; then preserve existing component fallbacks. Avoid replacing structural widths, offsets, aspect ratios or layout algorithms merely because they contain lengths.

Cover actions, form fields, navigation, tables, content containers, indicators, media controls and reading content. Audit JS-calculated dimensions (especially maps and controls) against their CSS defaults; do not overwrite runtime outputs.

At nested boundaries recompute aliases and control context from the current size intent. Check attributes on both normal HTML containers and custom-element hosts. Test same-element compact/comfortable theme and size combinations. Invalid preset values should not erase inherited valid values.

### 5. Handle overlays and native content

Inspect where each overlay is actually rendered. Normal descendants inherit automatically; overlays moved outside their source subtree need an explicit preset propagation mechanism that respects local override, runtime changes and cleanup. Do not assume all overlays are portaled or add a global observer without a concrete need.

Add an optional native typography/content stylesheet with an explicit package export and nested-scope tests. It consumes semantic values without resetting page background or body margin. Applications can instead keep their own native mappings. Section-gap tokens require explicit layout consumers; tokens alone do not insert layout spacing.

### 6. Define comfortable values as a separate design step

After the compact baseline is proven, select and review comfortable values for every required preset key and approved semantic addition. Both completed presets use exactly the same keys; values may be equal where appropriate. Keep --q-space-none zero. Use coordinated control dimensions and responsive heading sizes, not one blanket multiplier. This plan intentionally supplies no new comfortable values.

### 7. Validate the complete feature

Generator checks: complete keys, valid values, unchanged compact manifest, unchanged outside values/light/dark rules, deterministic generation and packaged stylesheet exports.

Browser checks: no-preset baseline, explicit compact, comfortable, compact-inside-comfortable and comfortable-inside-compact, runtime switch, scoped overrides, same-host attributes, shadow DOM, slots, inherited size contexts and overlays. Use distinct temporary fixture values to expose inheritance defects before comfortable design values exist; these are test inputs, not shipped defaults.

Check mobile/narrow parents, long text, zoom, focus visibility, control hit areas, feedback reserve, navbar collision/sticky behaviour, map marker geometry and dialog overflow. Confirm no repeated responsive oscillation after dimensions change.

Run focused affected tests and package builds, then Angular/React smoke checks using the attribute. No Stencil property or generated framework input is required. Update README/theme guide/playground with side-by-side and nested examples. Do not change release versions or publish during implementation.

## Completion and follow-ups

The default/compact allocation can be implemented without changing any current set value. Full comfortable mode is not complete until its values and semantic consumer mapping are decided and verified. Publishing matching packages and opting XFrontend into comfortable remain separate follow-ups. No XFrontend or XContent application files are changed by this plan.

## Inventory verification

- Current shared root definitions: 180.
- Inside preset schema: 65.
- Outside preset schema: 115.
- Additional component/theme/utility names, including dynamic surface expansions: 446.
- Every current root definition appears exactly once in the allocation tables.
