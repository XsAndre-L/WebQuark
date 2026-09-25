# Theme tokens

Generated from `src/theme/tokens.ts`. Dimensions use rem; default root size is 16px. Optional component overrides remain unset and are documented with each component.

## Spacing & Control Sizing

| Token | Default | Light override |
| --- | --- | --- |
| `--q-space-none` | `0rem` | — |
| `--q-space-xs` | `0.25rem` | — |
| `--q-space-sm` | `0.5rem` | — |
| `--q-space-md` | `0.75rem` | — |
| `--q-space-lg` | `1rem` | — |
| `--q-space-xl` | `1.5rem` | — |
| `--q-space-2xl` | `2rem` | — |
| `--q-space-3xl` | `3rem` | — |
| `--q-control-height-sm` | `1.75rem` | — |
| `--q-control-font-sm` | `0.75rem` | — |
| `--q-control-line-sm` | `1rem` | — |
| `--q-control-padding-sm` | `0.5rem` | — |
| `--q-control-icon-sm` | `0.875rem` | — |
| `--q-control-radius-sm` | `0.34375rem` | — |
| `--q-control-height-md` | `2.25rem` | — |
| `--q-control-font-md` | `0.875rem` | — |
| `--q-control-line-md` | `1.25rem` | — |
| `--q-control-padding-md` | `0.75rem` | — |
| `--q-control-icon-md` | `1rem` | — |
| `--q-control-radius-md` | `0.4375rem` | — |
| `--q-control-height-lg` | `2.75rem` | — |
| `--q-control-font-lg` | `1rem` | — |
| `--q-control-line-lg` | `1.5rem` | — |
| `--q-control-padding-lg` | `1rem` | — |
| `--q-control-icon-lg` | `1.25rem` | — |
| `--q-control-radius-lg` | `0.53125rem` | — |

## Colors

| Token | Default | Light override |
| --- | --- | --- |
| `--q-color-primary` | `#60a5fa` | `#3b82f6` |
| `--q-color-primary-hover` | `#93c5fd` | `#2563eb` |
| `--q-color-secondary` | `#9777ea` | `#7c3aed` |
| `--q-color-success` | `#34d399` | `#10b981` |
| `--q-color-warning` | `#fbbf24` | `#f59e0b` |
| `--q-color-danger` | `#f87171` | `#ef4444` |

## Hierarchical Surfaces & Backgrounds

| Token | Default | Light override |
| --- | --- | --- |
| `--q-bg-base` | `#0b0f19` | `#ffffff` |
| `--q-bg-surface-1` | `#111827` | `#f0f3f9` |
| `--q-bg-surface-2` | `#19243b` | `#dee5f2` |
| `--q-bg-surface-3` | `#22304d` | `#c7d1e6` |
| `--q-bg-surface-4` | `#2c3a58` | `#aab8d5` |
| `--q-bg-surface-5` | `#374761` | `#8b9dc1` |
| `--q-bg-glass` | `rgba(25, 36, 59, 0.85)` | `rgba(255, 255, 255, 0.85)` |
| `--q-bg-overlay` | `rgba(0, 0, 0, 0.85)` | `rgba(0, 0, 0, 0.6)` |
| `--q-fg-base` | `#f9fafb` | `#1f2937` |
| `--q-fg-muted` | `#9ca3af` | `#4b5563` |
| `--q-border-color` | `#374151` | `#e5e7eb` |

## Shadows & OSR-safe glass surfaces

| Token | Default | Light override |
| --- | --- | --- |
| `--q-dialog-backdrop-bg` | `var(--q-bg-overlay, rgba(0, 0, 0, 0.85))` | — |
| `--q-dialog-backdrop-solid-bg` | `var(--q-bg-overlay, rgba(0, 0, 0, 0.85))` | — |
| `--q-shadow-low` | `0 2px 4px rgba(0, 0, 0, 0.2)` | `0 2px 4px rgba(0, 0, 0, 0.05)` |
| `--q-shadow-medium` | `0 8px 16px rgba(0, 0, 0, 0.3)` | `0 8px 16px rgba(0, 0, 0, 0.08)` |
| `--q-shadow-high` | `0 16px 32px rgba(0, 0, 0, 0.45)` | `0 16px 32px rgba(0, 0, 0, 0.12)` |
| `--q-glow-interactive` | `0 0 20px rgba(96, 165, 250, 0.3)` | `0 0 20px rgba(59, 130, 246, 0.3)` |

## Borders & Outlines

| Token | Default | Light override |
| --- | --- | --- |
| `--q-border-width` | `1px` | — |
| `--q-border` | `var(--q-border-width) solid var(--q-border-color)` | — |
| `--q-focus-ring` | `2px solid var(--q-color-primary)` | — |

## Typography

| Token | Default | Light override |
| --- | --- | --- |
| `--q-font-family` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | — |
| `--q-font-size-sm` | `0.7rem` | — |
| `--q-font-size-base` | `0.9rem` | — |
| `--q-font-size-lg` | `1rem` | — |
| `--q-font-weight-normal` | `400` | — |
| `--q-font-weight-bold` | `600` | — |

## Spacing & Radii

| Token | Default | Light override |
| --- | --- | --- |
| `--q-radius-sm` | `4px` | — |
| `--q-radius-md` | `7px` | — |
| `--q-radius-lg` | `11px` | — |
| `--q-padding-sm` | `var(--q-space-sm, .5rem)` | — |
| `--q-padding-md` | `var(--q-space-md, .75rem)` | — |
| `--q-padding-lg` | `var(--q-space-lg, 1rem)` | — |

## Transitions

| Token | Default | Light override |
| --- | --- | --- |
| `--q-transition-fast` | `150ms ease` | — |
| `--q-transition-normal` | `250ms cubic-bezier(0.4, 0, 0.2, 1)` | — |
| `--q-transition-slow` | `400ms cubic-bezier(0.4, 0, 0.2, 1)` | — |

## Z-index

| Token | Default | Light override |
| --- | --- | --- |
| `--q-z-index-overlay` | `1000` | — |
| `--q-z-index-popover` | `1100` | — |
| `--q-z-index-toast` | `1200` | — |

## Global Animation Base

| Token | Default | Light override |
| --- | --- | --- |
| `--q-hover-transform` | `translateY(-4px) scale(1.02)` | — |

## Theme-aware hover overlays (automatically flips in light mode)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-btn-hover-overlay` | `color-mix(in srgb, var(--q-fg-base) 8%, transparent)` | — |

## Card (q-card)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-card-border` | `var(--q-border)` | — |
| `--q-card-hover-transform` | `var(--q-hover-transform)` | — |
| `--q-card-transition-duration` | `var(--q-transition-normal)` | — |

## Step Diagram (q-step-diagram / q-step-diagram-item)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-step-diag-line` | `2px solid var(--q-border-color)` | — |
| `--q-step-diag-border` | `var(--q-border)` | — |
| `--q-step-diag-icon-size` | `32px` | — |
| `--q-step-diag-item-gap` | `24px` | — |

## Media Reel & Thumbnail (q-reel / q-thumbnail)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-thumb-aspect-ratio` | `16 / 9` | — |
| `--q-thumb-border` | `2px solid var(--q-thumb-border-color)` | — |
| `--q-thumb-hover-transform` | `var(--q-hover-transform)` | — |
| `--q-thumb-overlay-bg` | `rgba(0, 0, 0, 0.4)` | — |
| `--q-thumb-radius` | `var(--q-radius-md)` | — |
| `--q-thumb-border-color` | `transparent` | — |
| `--q-thumb-glow` | `var(--q-glow-interactive)` | — |
| `--q-reel-gap` | `12px` | — |
| `--q-reel-columns-desktop` | `repeat(auto-fill, minmax(200px, 1fr))` | — |
| `--q-reel-columns-mobile` | `1fr` | — |
| `--q-lightbox-max-size` | `90vh` | — |
| `--q-reel-lightbox-btn-bg` | `rgba(0, 0, 0, 0.5)` | — |
| `--q-reel-lightbox-btn-border` | `1px solid rgba(255, 255, 255, 0.2)` | — |
| `--q-reel-lightbox-btn-color` | `#ffffff` | — |
| `--q-reel-lightbox-btn-hover-bg` | `rgba(255, 255, 255, 0.2)` | — |

## Avatar (q-avatar)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-avatar-size-sm` | `28px` | — |
| `--q-avatar-size-md` | `40px` | — |
| `--q-avatar-size-lg` | `56px` | — |
| `--q-avatar-bg` | `var(--q-bg-surface-3)` | — |
| `--q-avatar-fg` | `var(--q-fg-base)` | — |
| `--q-avatar-border` | `var(--q-border)` | — |

## Conversation bubble (q-conversation-bubble)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-conversation-incoming-bg` | `var(--q-bg-surface-2)` | — |
| `--q-conversation-outgoing-bg` | `var(--q-color-primary)` | — |
| `--q-conversation-outgoing-fg` | `#ffffff` | — |
| `--q-conversation-system-bg` | `transparent` | — |
| `--q-conversation-system-fg` | `var(--q-fg-muted)` | — |

## Carousel (q-carousel)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-carousel-gap` | `16px` | — |
| `--q-carousel-padding` | `24px 20px` | — |
| `--q-carousel-arrow-bg` | `var(--q-bg-overlay)` | — |
| `--q-carousel-arrow-border` | `var(--q-border)` | — |
| `--q-carousel-arrow-color` | `#ffffff` | — |
| `--q-carousel-arrow-size` | `40px` | — |
| `--q-carousel-indicator-gap` | `8px` | — |
| `--q-carousel-indicator-size` | `6px` | — |

## Progress (q-progress)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-progress-transition` | `var(--q-transition-normal)` | — |
| `--q-progress-indeterminate-duration` | `1.4s` | — |
| `--q-progress-linear-height-sm` | `4px` | — |
| `--q-progress-linear-height-md` | `6px` | — |
| `--q-progress-linear-height-lg` | `8px` | — |
| `--q-progress-linear-radius` | `999px` | — |
| `--q-progress-circular-size-sm` | `64px` | — |
| `--q-progress-circular-size-md` | `120px` | — |
| `--q-progress-circular-size-lg` | `180px` | — |
| `--q-progress-circular-stroke-width-sm` | `6px` | — |
| `--q-progress-circular-stroke-width-md` | `8px` | — |
| `--q-progress-circular-stroke-width-lg` | `10px` | — |
| `--q-progress-circular-linecap` | `round` | — |
| `--q-progress-circular-font-weight` | `var(--q-font-weight-bold)` | — |

## Button (q-button)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-btn-font-weight` | `var(--q-font-weight-bold)` | — |
| `--q-btn-active-transform` | `scale(0.97)` | — |
| `--q-btn-transition` | `all 150ms cubic-bezier(0.4, 0, 0.2, 1)` | — |
| `--q-btn-icon-padding-sm` | `4px` | — |
| `--q-btn-icon-padding-md` | `6px` | — |
| `--q-btn-icon-padding-lg` | `9px` | — |

## Chip (q-chip)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-chip-radius` | `999px` | — |
| `--q-chip-border` | `var(--q-border)` | — |
| `--q-chip-font-weight` | `var(--q-font-weight-bold)` | — |
| `--q-chip-padding-sm` | `4px 9px` | — |
| `--q-chip-padding-md` | `6px 11px` | — |
| `--q-chip-padding-lg` | `8px 14px` | — |
| `--q-chip-height-sm` | `24px` | — |
| `--q-chip-height-md` | `30px` | — |
| `--q-chip-height-lg` | `36px` | — |
| `--q-chip-active-transform` | `scale(0.97)` | — |

## Unified Form Field Variables (Borders & Radius Consistency)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-field-border` | `var(--q-border)` | — |
| `--q-field-border-color-focus` | `var(--q-color-primary)` | — |

## Input & Textarea (q-input / q-textarea) mapped to unified field tokens

| Token | Default | Light override |
| --- | --- | --- |
| `--q-input-border` | `var(--q-field-border)` | — |

## Dropdown (q-dropdown) mapped to unified field tokens

| Token | Default | Light override |
| --- | --- | --- |
| `--q-dropdown-border` | `var(--q-field-border)` | — |

## Panel (q-panel)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-panel-border` | `var(--q-border)` | — |

## Sidepanel (q-sidepanel)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-sidepanel-bg` | `var(--q-bg-surface-1)` | `var(--q-bg-surface-1)` |
| `--q-sidepanel-border` | `var(--q-border)` | — |
| `--q-sidepanel-shadow` | `var(--q-shadow-high)` | — |
| `--q-sidepanel-panel-width` | `320px` | — |
| `--q-sidepanel-panel-padding` | `var(--q-padding-lg)` | — |
| `--q-sidepanel-panel-header-padding` | `var(--q-padding-lg)` | — |
| `--q-sidepanel-panel-footer-padding` | `var(--q-padding-lg)` | — |
| `--q-sidepanel-panel-section-border` | `var(--q-border)` | — |

## Map (q-map)

| Token | Default | Light override |
| --- | --- | --- |
| `--q-map-height` | `100%` | — |
| `--q-map-min-height` | `240px` | — |
| `--q-map-bg` | `var(--q-bg-surface-1)` | — |
| `--q-map-border` | `var(--q-border)` | — |
| `--q-map-radius` | `var(--q-radius-lg)` | — |
| `--q-map-marker-size` | `20px` | — |
| `--q-map-marker-size-small` | `16px` | — |
| `--q-map-marker-size-medium` | `var(--q-map-marker-size)` | — |
| `--q-map-marker-size-large` | `24px` | — |
| `--q-map-marker-color` | `var(--q-color-primary)` | — |
| `--q-map-marker-success` | `var(--q-color-success)` | — |
| `--q-map-marker-warning` | `var(--q-color-warning)` | — |
| `--q-map-marker-danger` | `var(--q-color-danger)` | — |
| `--q-map-marker-muted` | `var(--q-fg-muted)` | — |
| `--q-map-marker-selected-color` | `var(--q-fg-base)` | — |
| `--q-map-marker-selected-shadow` | `var(--q-shadow-medium)` | — |
| `--q-map-attribution-bg` | `var(--q-bg-base)` | — |
| `--q-map-attribution-color` | `var(--q-fg-muted)` | — |

## Scrollbars

| Token | Default | Light override |
| --- | --- | --- |
| `--q-scrollbar-width` | `6px` | — |
| `--q-scrollbar-width-thin` | `thin` | — |
| `--q-scrollbar-track-color` | `transparent` | — |
| `--q-scrollbar-thumb-color` | `var(--q-border-color, #374151)` | — |
| `--q-scrollbar-thumb-color-hover` | `var(--q-color-primary, #60a5fa)` | — |
| `--q-scrollbar-radius` | `var(--q-radius-sm, 4px)` | — |
