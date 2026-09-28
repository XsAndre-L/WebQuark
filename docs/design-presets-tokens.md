# Design preset values

Generated from `src/theme/tokens.ts`. Compact preserves existing defaults; new semantic roles are opt-in.

| Token | Compact | Comfortable |
| --- | --- | --- |
| `--q-space-none` | `0rem` | `0rem` |
| `--q-space-xs` | `0.25rem` | `0.375rem` |
| `--q-space-sm` | `0.5rem` | `0.75rem` |
| `--q-space-md` | `0.75rem` | `1rem` |
| `--q-space-lg` | `1rem` | `1.5rem` |
| `--q-space-xl` | `1.5rem` | `2rem` |
| `--q-space-2xl` | `2rem` | `3rem` |
| `--q-space-3xl` | `3rem` | `4rem` |
| `--q-control-height-sm` | `1.75rem` | `2.25rem` |
| `--q-control-font-sm` | `0.75rem` | `0.875rem` |
| `--q-control-line-sm` | `1rem` | `1.25rem` |
| `--q-control-padding-sm` | `0.5rem` | `0.75rem` |
| `--q-control-icon-sm` | `0.875rem` | `1rem` |
| `--q-control-height-md` | `2.25rem` | `2.75rem` |
| `--q-control-font-md` | `0.875rem` | `1rem` |
| `--q-control-line-md` | `1.25rem` | `1.5rem` |
| `--q-control-padding-md` | `0.75rem` | `1rem` |
| `--q-control-icon-md` | `1rem` | `1.25rem` |
| `--q-control-height-lg` | `2.75rem` | `3.25rem` |
| `--q-control-font-lg` | `1rem` | `1.125rem` |
| `--q-control-line-lg` | `1.5rem` | `1.75rem` |
| `--q-control-padding-lg` | `1rem` | `1.25rem` |
| `--q-control-icon-lg` | `1.25rem` | `1.5rem` |
| `--q-font-size-sm` | `0.7rem` | `0.875rem` |
| `--q-font-size-base` | `0.9rem` | `1.125rem` |
| `--q-font-size-lg` | `1rem` | `1.5rem` |
| `--q-padding-sm` | `var(--q-space-sm, .5rem)` | `var(--q-space-sm, .75rem)` |
| `--q-padding-md` | `var(--q-space-md, .75rem)` | `var(--q-space-md, 1rem)` |
| `--q-padding-lg` | `var(--q-space-lg, 1rem)` | `var(--q-space-lg, 1.5rem)` |
| `--q-step-diag-icon-size` | `32px` | `40px` |
| `--q-step-diag-item-gap` | `24px` | `32px` |
| `--q-reel-gap` | `12px` | `24px` |
| `--q-avatar-size-sm` | `28px` | `32px` |
| `--q-avatar-size-md` | `40px` | `48px` |
| `--q-avatar-size-lg` | `56px` | `64px` |
| `--q-carousel-gap` | `16px` | `24px` |
| `--q-carousel-padding` | `24px 20px` | `32px 24px` |
| `--q-carousel-arrow-size` | `40px` | `44px` |
| `--q-carousel-indicator-gap` | `8px` | `12px` |
| `--q-carousel-indicator-size` | `6px` | `8px` |
| `--q-progress-linear-height-sm` | `4px` | `6px` |
| `--q-progress-linear-height-md` | `6px` | `8px` |
| `--q-progress-linear-height-lg` | `8px` | `10px` |
| `--q-progress-circular-size-sm` | `64px` | `80px` |
| `--q-progress-circular-size-md` | `120px` | `144px` |
| `--q-progress-circular-size-lg` | `180px` | `200px` |
| `--q-progress-circular-stroke-width-sm` | `6px` | `8px` |
| `--q-progress-circular-stroke-width-md` | `8px` | `10px` |
| `--q-progress-circular-stroke-width-lg` | `10px` | `12px` |
| `--q-btn-icon-padding-sm` | `4px` | `6px` |
| `--q-btn-icon-padding-md` | `6px` | `8px` |
| `--q-btn-icon-padding-lg` | `9px` | `12px` |
| `--q-chip-padding-sm` | `4px 9px` | `6px 12px` |
| `--q-chip-padding-md` | `6px 11px` | `8px 16px` |
| `--q-chip-padding-lg` | `8px 14px` | `10px 20px` |
| `--q-chip-height-sm` | `24px` | `32px` |
| `--q-chip-height-md` | `30px` | `40px` |
| `--q-chip-height-lg` | `36px` | `48px` |
| `--q-sidepanel-panel-padding` | `var(--q-padding-lg)` | `var(--q-padding-lg)` |
| `--q-sidepanel-panel-header-padding` | `var(--q-padding-lg)` | `var(--q-padding-lg)` |
| `--q-sidepanel-panel-footer-padding` | `var(--q-padding-lg)` | `var(--q-padding-lg)` |
| `--q-map-marker-size` | `20px` | `24px` |
| `--q-map-marker-size-small` | `16px` | `20px` |
| `--q-map-marker-size-medium` | `var(--q-map-marker-size)` | `var(--q-map-marker-size)` |
| `--q-map-marker-size-large` | `24px` | `28px` |
| `--q-text-body-size` | `var(--q-font-size-base)` | `var(--q-font-size-base)` |
| `--q-text-body-line-height` | `1.5` | `1.6` |
| `--q-text-small-size` | `var(--q-font-size-sm)` | `var(--q-font-size-sm)` |
| `--q-text-small-line-height` | `1.5` | `1.5` |
| `--q-heading-display-size` | `var(--q-font-size-lg)` | `clamp(2.5rem, 1.75rem + 3vw, 4rem)` |
| `--q-heading-display-line-height` | `1.3` | `1.1` |
| `--q-heading-1-size` | `var(--q-font-size-lg)` | `clamp(27px, 1.5rem + 2vw, 36px)` |
| `--q-heading-2-size` | `var(--q-font-size-lg)` | `clamp(1.75rem, 1.375rem + 1.5vw, 2.5rem)` |
| `--q-heading-3-size` | `var(--q-font-size-lg)` | `clamp(1.5rem, 1.25rem + 1vw, 2rem)` |
| `--q-heading-4-size` | `var(--q-font-size-lg)` | `1.375rem` |
| `--q-heading-5-size` | `var(--q-font-size-lg)` | `1.25rem` |
| `--q-heading-6-size` | `var(--q-font-size-lg)` | `1.125rem` |
| `--q-heading-1-line-height` | `1.3` | `1.2` |
| `--q-heading-2-line-height` | `1.3` | `1.2` |
| `--q-heading-3-line-height` | `1.3` | `1.3` |
| `--q-heading-4-line-height` | `1.3` | `1.3` |
| `--q-heading-5-line-height` | `1.3` | `1.3` |
| `--q-heading-6-line-height` | `1.3` | `1.3` |
| `--q-content-paragraph-gap` | `var(--q-padding-lg)` | `1.5rem` |
| `--q-content-heading-gap` | `var(--q-padding-lg)` | `1.5rem` |
| `--q-content-section-gap` | `var(--q-space-2xl)` | `clamp(3rem, 2rem + 4vw, 6rem)` |
| `--q-content-padding` | `var(--q-padding-lg)` | `clamp(1.5rem, 1rem + 2vw, 3rem)` |
| `--q-field-text-size` | `.75rem` | `.875rem` |
| `--q-field-text-line` | `1rem` | `1.25rem` |
| `--q-toolbar-height` | `0px` | `72px` |
| `--q-toolbar-compact-height` | `0px` | `60px` |
| `--q-font-size-xs` | `0.7rem` | `0.8125rem` |
| `--q-font-size-2xs` | `0.625rem` | `0.75rem` |
| `--q-btn-circle-size` | `120px` | `144px` |
| `--q-btn-circle-padding` | `12px` | `16px` |
| `--q-table-toolbar-padding-block` | `12px` | `16px` |
| `--q-table-toolbar-padding-inline` | `16px` | `24px` |
| `--q-bar-edge-padding` | `24px` | `32px` |
| `--q-bar-edge-compact-padding` | `16px` | `24px` |
| `--q-table-cell-padding-block` | `4.5px` | `10px` |
| `--q-table-cell-padding-inline` | `8px` | `14px` |
| `--q-dropdown-option-padding` | `10px 14px` | `12px 18px` |
| `--q-tooltip-padding` | `6px 10px` | `8px 14px` |
| `--q-syntax-padding` | `16px` | `24px` |
| `--q-syntax-compact-padding` | `10px` | `16px` |
| `--q-syntax-header-padding` | `4px 16px` | `8px 24px` |
| `--q-sidepanel-nav-font` | `0.875rem` | `1rem` |
| `--q-sidepanel-nav-small-font` | `0.75rem` | `0.875rem` |
| `--q-sidepanel-nav-badge-font` | `0.65rem` | `0.75rem` |
| `--q-navbar-item-height` | `36px` | `44px` |
| `--q-navbar-gap` | `20px` | `28px` |
| `--q-navbar-height` | `64px` | `72px` |
| `--q-navbar-compact-height` | `52px` | `60px` |
| `--q-navbar-logo-size` | `32px` | `40px` |
| `--q-navbar-brand-size` | `1rem` | `1.25rem` |
| `--q-navbar-nav-gap` | `6px` | `10px` |
| `--q-navbar-action-gap` | `8px` | `12px` |
| `--q-navbar-item-gap` | `8px` | `12px` |
| `--q-navbar-item-padding` | `7px 10px` | `10px 14px` |
| `--q-navbar-item-size` | `0.9rem` | `1rem` |
| `--q-navbar-item-icon-only-size` | `40px` | `44px` |
| `--q-navbar-item-icon-only-padding` | `8px` | `10px` |
| `--q-navbar-mobile-panel-padding` | `8px 16px 16px` | `12px 24px 24px` |
| `--q-avatar-font-size` | `0.8rem` | `1rem` |
| `--q-avatar-font-size-sm` | `0.65rem` | `0.75rem` |
| `--q-avatar-font-size-lg` | `1rem` | `1.25rem` |
| `--q-conversation-gap` | `10px` | `16px` |
| `--q-conversation-header-gap` | `4px` | `6px` |
| `--q-conversation-header-inset` | `4px` | `6px` |
| `--q-conversation-padding` | `11px 13px` | `16px 20px` |
| `--q-conversation-footer-gap` | `10px` | `16px` |
| `--q-conversation-footer-margin` | `6px` | `10px` |
| `--q-conversation-meta-gap` | `6px` | `10px` |
| `--q-conversation-compact-padding` | `7px 10px` | `10px 14px` |
| `--q-alert-padding` | `12px 14px` | `16px 20px` |
| `--q-alert-gap` | `10px` | `16px` |
| `--q-alert-actions-gap` | `8px` | `12px` |
| `--q-pagination-button-height` | `30px` | `44px` |
| `--q-pagination-button-padding` | `5px 8px` | `8px 12px` |
