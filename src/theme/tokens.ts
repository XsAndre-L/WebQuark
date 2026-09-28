/** Canonical theme dimensions. Rem values assume a 16px root font. */
export const spaces = { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48 } as const;
export const controls = {
  sm: { height: 28, font: 12, line: 16, padding: 8, icon: 14, radius: 5.5 },
  md: { height: 36, font: 14, line: 20, padding: 12, icon: 16, radius: 7 },
  lg: { height: 44, font: 16, line: 24, padding: 16, icon: 20, radius: 8.5 },
} as const;
export type QSpace = keyof typeof spaces;
export type QSize = keyof typeof controls;
export type QControlSize = QSize | 'inherit';
export type QPreset = 'compact' | 'comfortable';
export type QSurface = 'canvas' | 'panel' | 'card' | 'field' | 'floating' | 'transparent';
export const rem = (pixels: number): string => `${pixels / 16}rem`;
export const dimensionTokens = [
  ...Object.entries(spaces).map(([key, value]) => ({ name: `--q-space-${key}`, value: rem(value), label: `Space ${key}` })),
  ...Object.entries(controls).flatMap(([size, metrics]) => Object.entries(metrics).map(([key, value]) => ({
    name: `--q-control-${key}-${size}`, value: rem(value), label: `${size} control ${key}`,
  }))),
];

export function spaceValue(value: QSpace): string {
  return `var(--q-space-${value}, ${rem(spaces[value] ?? spaces.lg)})`;
}

/** Only scope owners publish context metrics; leaf controls never change them. */
export function controlScope(size: QControlSize): Record<string, string> {
  // Carry size intent, rather than resolved lengths, through nested preset boundaries.
  return { ...Object.fromEntries(Object.keys(controls).map(key => [
    `--_q-context-size-${key}`,
    size === 'inherit' ? '' : size === key ? '1' : '0',
  ])), ...Object.fromEntries(Object.keys(controls.md).map(metric => [
    `--q-context-control-${metric}`, size === 'inherit' ? '' : 'initial',
  ])) };
}

/** Resolve roles at the component, not at :root, to respect scoped palettes. */
export function surfaceValue(surface: QSurface): string {
  const defaults = {
    canvas: 'var(--q-bg-base, #0b0f19)',
    panel: 'var(--q-bg-surface-1, #111827)',
    card: 'var(--q-bg-surface-2, #19243b)',
    field: 'var(--q-bg-surface-3, #22304d)',
    floating: 'var(--q-bg-surface-4, #2c3a58)',
    transparent: 'transparent',
  };
  return surface === 'transparent' ? 'transparent' : `var(--q-bg-${surface}, ${defaults[surface]})`;
}

/** Shared defaults by purpose. Optional component overrides stay unset. */
export interface ThemeToken { name: string; value: string; light?: string; dark?: string; }
export const themeGroups: { category: string; tokens: ThemeToken[] }[] = [
  {
    "category": "Colors",
    "tokens": [
      {
        "name": "--q-color-primary",
        "value": "#60a5fa",
        "light": "#3b82f6",
        "dark": "#60a5fa"
      },
      {
        "name": "--q-color-primary-hover",
        "value": "#93c5fd",
        "light": "#2563eb",
        "dark": "#93c5fd"
      },
      {
        "name": "--q-color-secondary",
        "value": "#9777ea",
        "light": "#7c3aed",
        "dark": "#9777ea"
      },
      {
        "name": "--q-color-success",
        "value": "#34d399",
        "light": "#10b981",
        "dark": "#34d399"
      },
      {
        "name": "--q-color-warning",
        "value": "#fbbf24",
        "light": "#f59e0b",
        "dark": "#fbbf24"
      },
      {
        "name": "--q-color-danger",
        "value": "#f87171",
        "light": "#ef4444",
        "dark": "#f87171"
      }
    ]
  },
  {
    "category": "Hierarchical Surfaces & Backgrounds",
    "tokens": [
      {
        "name": "--q-bg-base",
        "value": "#0b0f19",
        "light": "#ffffff",
        "dark": "#0b0f19"
      },
      {
        "name": "--q-bg-surface-1",
        "value": "#111827",
        "light": "#f0f3f9",
        "dark": "#111827"
      },
      {
        "name": "--q-bg-surface-2",
        "value": "#19243b",
        "light": "#dee5f2",
        "dark": "#19243b"
      },
      {
        "name": "--q-bg-surface-3",
        "value": "#22304d",
        "light": "#c7d1e6",
        "dark": "#22304d"
      },
      {
        "name": "--q-bg-surface-4",
        "value": "#2c3a58",
        "light": "#aab8d5",
        "dark": "#2c3a58"
      },
      {
        "name": "--q-bg-surface-5",
        "value": "#374761",
        "light": "#8b9dc1",
        "dark": "#374761"
      },
      {
        "name": "--q-bg-glass",
        "value": "rgba(25, 36, 59, 0.85)",
        "light": "rgba(255, 255, 255, 0.85)",
        "dark": "rgba(25, 36, 59, 0.85)"
      },
      {
        "name": "--q-bg-overlay",
        "value": "rgba(0, 0, 0, 0.85)",
        "light": "rgba(0, 0, 0, 0.6)",
        "dark": "rgba(0, 0, 0, 0.85)"
      },
      {
        "name": "--q-fg-base",
        "value": "#f9fafb",
        "light": "#1f2937",
        "dark": "#f9fafb"
      },
      {
        "name": "--q-fg-muted",
        "value": "#9ca3af",
        "light": "#4b5563",
        "dark": "#9ca3af"
      },
      {
        "name": "--q-border-color",
        "value": "#374151",
        "light": "#e5e7eb",
        "dark": "#374151"
      }
    ]
  },
  {
    "category": "Shadows & OSR-safe glass surfaces",
    "tokens": [
      {
        "name": "--q-dialog-backdrop-bg",
        "value": "var(--q-bg-overlay, rgba(0, 0, 0, 0.85))"
      },
      {
        "name": "--q-dialog-backdrop-solid-bg",
        "value": "var(--q-bg-overlay, rgba(0, 0, 0, 0.85))"
      },
      {
        "name": "--q-shadow-low",
        "value": "0 2px 4px rgba(0, 0, 0, 0.2)",
        "light": "0 2px 4px rgba(0, 0, 0, 0.05)",
        "dark": "0 2px 4px rgba(0, 0, 0, 0.2)"
      },
      {
        "name": "--q-shadow-medium",
        "value": "0 8px 16px rgba(0, 0, 0, 0.3)",
        "light": "0 8px 16px rgba(0, 0, 0, 0.08)",
        "dark": "0 8px 16px rgba(0, 0, 0, 0.3)"
      },
      {
        "name": "--q-shadow-high",
        "value": "0 16px 32px rgba(0, 0, 0, 0.45)",
        "light": "0 16px 32px rgba(0, 0, 0, 0.12)",
        "dark": "0 16px 32px rgba(0, 0, 0, 0.45)"
      },
      {
        "name": "--q-glow-interactive",
        "value": "0 0 20px rgba(96, 165, 250, 0.3)",
        "light": "0 0 20px rgba(59, 130, 246, 0.3)",
        "dark": "0 0 20px rgba(96, 165, 250, 0.3)"
      }
    ]
  },
  {
    "category": "Borders & Outlines",
    "tokens": [
      {
        "name": "--q-border-width",
        "value": "1px"
      },
      {
        "name": "--q-border",
        "value": "var(--q-border-width) solid var(--q-border-color)"
      },
      {
        "name": "--q-focus-ring",
        "value": "2px solid var(--q-color-primary)"
      }
    ]
  },
  {
    "category": "Typography",
    "tokens": [
      {
        "name": "--q-font-family",
        "value": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      },
      {
        "name": "--q-font-size-sm",
        "value": "0.7rem"
      },
      {
        "name": "--q-font-size-base",
        "value": "0.9rem"
      },
      {
        "name": "--q-font-size-lg",
        "value": "1rem"
      },
      {
        "name": "--q-font-weight-normal",
        "value": "400"
      },
      {
        "name": "--q-font-weight-bold",
        "value": "600"
      }
    ]
  },
  {
    "category": "Spacing & Radii",
    "tokens": [
      {
        "name": "--q-radius-sm",
        "value": "4px"
      },
      {
        "name": "--q-radius-md",
        "value": "7px"
      },
      {
        "name": "--q-radius-lg",
        "value": "11px"
      },
      {
        "name": "--q-padding-sm",
        "value": "var(--q-space-sm, .5rem)"
      },
      {
        "name": "--q-padding-md",
        "value": "var(--q-space-md, .75rem)"
      },
      {
        "name": "--q-padding-lg",
        "value": "var(--q-space-lg, 1rem)"
      }
    ]
  },
  {
    "category": "Transitions",
    "tokens": [
      {
        "name": "--q-transition-fast",
        "value": "150ms ease"
      },
      {
        "name": "--q-transition-normal",
        "value": "250ms cubic-bezier(0.4, 0, 0.2, 1)"
      },
      {
        "name": "--q-transition-slow",
        "value": "400ms cubic-bezier(0.4, 0, 0.2, 1)"
      }
    ]
  },
  {
    "category": "Z-index",
    "tokens": [
      {
        "name": "--q-z-index-overlay",
        "value": "1000"
      },
      {
        "name": "--q-z-index-popover",
        "value": "1100"
      },
      {
        "name": "--q-z-index-toast",
        "value": "1200"
      }
    ]
  },
  {
    "category": "Global Animation Base",
    "tokens": [
      {
        "name": "--q-hover-transform",
        "value": "translateY(-4px) scale(1.02)"
      }
    ]
  },
  {
    "category": "Theme-aware hover overlays (automatically flips in light mode)",
    "tokens": [
      {
        "name": "--q-btn-hover-overlay",
        "value": "color-mix(in srgb, var(--q-fg-base) 8%, transparent)"
      }
    ]
  },
  {
    "category": "Card (q-card)",
    "tokens": [
      {
        "name": "--q-card-border",
        "value": "var(--q-border)"
      },
      {
        "name": "--q-card-hover-transform",
        "value": "var(--q-hover-transform)"
      },
      {
        "name": "--q-card-transition-duration",
        "value": "var(--q-transition-normal)"
      }
    ]
  },
  {
    "category": "Step Diagram (q-step-diagram / q-step-diagram-item)",
    "tokens": [
      {
        "name": "--q-step-diag-line",
        "value": "2px solid var(--q-border-color)"
      },
      {
        "name": "--q-step-diag-border",
        "value": "var(--q-border)"
      },
      {
        "name": "--q-step-diag-icon-size",
        "value": "32px"
      },
      {
        "name": "--q-step-diag-item-gap",
        "value": "24px"
      }
    ]
  },
  {
    "category": "Media Reel & Thumbnail (q-reel / q-thumbnail)",
    "tokens": [
      {
        "name": "--q-thumb-aspect-ratio",
        "value": "16 / 9"
      },
      {
        "name": "--q-thumb-border",
        "value": "2px solid var(--q-thumb-border-color)"
      },
      {
        "name": "--q-thumb-hover-transform",
        "value": "var(--q-hover-transform)"
      },
      {
        "name": "--q-thumb-overlay-bg",
        "value": "rgba(0, 0, 0, 0.4)"
      },
      {
        "name": "--q-thumb-radius",
        "value": "var(--q-radius-md)"
      },
      {
        "name": "--q-thumb-border-color",
        "value": "transparent"
      },
      {
        "name": "--q-thumb-glow",
        "value": "var(--q-glow-interactive)"
      },
      {
        "name": "--q-reel-gap",
        "value": "12px"
      },
      {
        "name": "--q-reel-columns-desktop",
        "value": "repeat(auto-fill, minmax(200px, 1fr))"
      },
      {
        "name": "--q-reel-columns-mobile",
        "value": "1fr"
      },
      {
        "name": "--q-lightbox-max-size",
        "value": "90vh"
      },
      {
        "name": "--q-reel-lightbox-btn-bg",
        "value": "rgba(0, 0, 0, 0.5)"
      },
      {
        "name": "--q-reel-lightbox-btn-border",
        "value": "1px solid rgba(255, 255, 255, 0.2)"
      },
      {
        "name": "--q-reel-lightbox-btn-color",
        "value": "#ffffff"
      },
      {
        "name": "--q-reel-lightbox-btn-hover-bg",
        "value": "rgba(255, 255, 255, 0.2)"
      }
    ]
  },
  {
    "category": "Avatar (q-avatar)",
    "tokens": [
      {
        "name": "--q-avatar-size-sm",
        "value": "28px"
      },
      {
        "name": "--q-avatar-size-md",
        "value": "40px"
      },
      {
        "name": "--q-avatar-size-lg",
        "value": "56px"
      },
      {
        "name": "--q-avatar-bg",
        "value": "var(--q-bg-surface-3)"
      },
      {
        "name": "--q-avatar-fg",
        "value": "var(--q-fg-base)"
      },
      {
        "name": "--q-avatar-border",
        "value": "var(--q-border)"
      }
    ]
  },
  {
    "category": "Conversation bubble (q-conversation-bubble)",
    "tokens": [
      {
        "name": "--q-conversation-incoming-bg",
        "value": "var(--q-bg-surface-2)"
      },
      {
        "name": "--q-conversation-outgoing-bg",
        "value": "var(--q-color-primary)"
      },
      {
        "name": "--q-conversation-outgoing-fg",
        "value": "#ffffff"
      },
      {
        "name": "--q-conversation-system-bg",
        "value": "transparent"
      },
      {
        "name": "--q-conversation-system-fg",
        "value": "var(--q-fg-muted)"
      }
    ]
  },
  {
    "category": "Carousel (q-carousel)",
    "tokens": [
      {
        "name": "--q-carousel-gap",
        "value": "16px"
      },
      {
        "name": "--q-carousel-padding",
        "value": "24px 20px"
      },
      {
        "name": "--q-carousel-arrow-bg",
        "value": "var(--q-bg-overlay)"
      },
      {
        "name": "--q-carousel-arrow-border",
        "value": "var(--q-border)"
      },
      {
        "name": "--q-carousel-arrow-color",
        "value": "#ffffff"
      },
      {
        "name": "--q-carousel-arrow-size",
        "value": "40px"
      },
      {
        "name": "--q-carousel-indicator-gap",
        "value": "8px"
      },
      {
        "name": "--q-carousel-indicator-size",
        "value": "6px"
      }
    ]
  },
  {
    "category": "Progress (q-progress)",
    "tokens": [
      {
        "name": "--q-progress-transition",
        "value": "var(--q-transition-normal)"
      },
      {
        "name": "--q-progress-indeterminate-duration",
        "value": "1.4s"
      },
      {
        "name": "--q-progress-linear-height-sm",
        "value": "4px"
      },
      {
        "name": "--q-progress-linear-height-md",
        "value": "6px"
      },
      {
        "name": "--q-progress-linear-height-lg",
        "value": "8px"
      },
      {
        "name": "--q-progress-linear-radius",
        "value": "999px"
      },
      {
        "name": "--q-progress-circular-size-sm",
        "value": "64px"
      },
      {
        "name": "--q-progress-circular-size-md",
        "value": "120px"
      },
      {
        "name": "--q-progress-circular-size-lg",
        "value": "180px"
      },
      {
        "name": "--q-progress-circular-stroke-width-sm",
        "value": "6px"
      },
      {
        "name": "--q-progress-circular-stroke-width-md",
        "value": "8px"
      },
      {
        "name": "--q-progress-circular-stroke-width-lg",
        "value": "10px"
      },
      {
        "name": "--q-progress-circular-linecap",
        "value": "round"
      },
      {
        "name": "--q-progress-circular-font-weight",
        "value": "var(--q-font-weight-bold)"
      }
    ]
  },
  {
    "category": "Button (q-button)",
    "tokens": [
      {
        "name": "--q-btn-font-weight",
        "value": "var(--q-font-weight-bold)"
      },
      {
        "name": "--q-btn-active-transform",
        "value": "scale(0.97)"
      },
      {
        "name": "--q-btn-transition",
        "value": "all 150ms cubic-bezier(0.4, 0, 0.2, 1)"
      },
      {
        "name": "--q-btn-icon-padding-sm",
        "value": "4px"
      },
      {
        "name": "--q-btn-icon-padding-md",
        "value": "6px"
      },
      {
        "name": "--q-btn-icon-padding-lg",
        "value": "9px"
      }
    ]
  },
  {
    "category": "Chip (q-chip)",
    "tokens": [
      {
        "name": "--q-chip-radius",
        "value": "999px"
      },
      {
        "name": "--q-chip-border",
        "value": "var(--q-border)"
      },
      {
        "name": "--q-chip-font-weight",
        "value": "var(--q-font-weight-bold)"
      },
      {
        "name": "--q-chip-padding-sm",
        "value": "4px 9px"
      },
      {
        "name": "--q-chip-padding-md",
        "value": "6px 11px"
      },
      {
        "name": "--q-chip-padding-lg",
        "value": "8px 14px"
      },
      {
        "name": "--q-chip-height-sm",
        "value": "24px"
      },
      {
        "name": "--q-chip-height-md",
        "value": "30px"
      },
      {
        "name": "--q-chip-height-lg",
        "value": "36px"
      },
      {
        "name": "--q-chip-active-transform",
        "value": "scale(0.97)"
      }
    ]
  },
  {
    "category": "Unified Form Field Variables (Borders & Radius Consistency)",
    "tokens": [
      {
        "name": "--q-field-border",
        "value": "var(--q-border)"
      },
      {
        "name": "--q-field-border-color-focus",
        "value": "var(--q-color-primary)"
      }
    ]
  },
  {
    "category": "Input & Textarea (q-input / q-textarea) mapped to unified field tokens",
    "tokens": [
      {
        "name": "--q-input-border",
        "value": "var(--q-field-border)"
      }
    ]
  },
  {
    "category": "Dropdown (q-dropdown) mapped to unified field tokens",
    "tokens": [
      {
        "name": "--q-dropdown-border",
        "value": "var(--q-field-border)"
      }
    ]
  },
  {
    "category": "Panel (q-panel)",
    "tokens": [
      {
        "name": "--q-panel-border",
        "value": "var(--q-border)"
      }
    ]
  },
  {
    "category": "Sidepanel (q-sidepanel)",
    "tokens": [
      {
        "name": "--q-sidepanel-bg",
        "value": "var(--q-bg-surface-1)",
        "light": "var(--q-bg-surface-1)",
        "dark": "var(--q-bg-surface-1)"
      },
      {
        "name": "--q-sidepanel-border",
        "value": "var(--q-border)"
      },
      {
        "name": "--q-sidepanel-shadow",
        "value": "var(--q-shadow-high)"
      },
      {
        "name": "--q-sidepanel-panel-width",
        "value": "320px"
      },
      {
        "name": "--q-sidepanel-panel-padding",
        "value": "var(--q-padding-lg)"
      },
      {
        "name": "--q-sidepanel-panel-header-padding",
        "value": "var(--q-padding-lg)"
      },
      {
        "name": "--q-sidepanel-panel-footer-padding",
        "value": "var(--q-padding-lg)"
      },
      {
        "name": "--q-sidepanel-panel-section-border",
        "value": "var(--q-border)"
      }
    ]
  },
  {
    "category": "Map (q-map)",
    "tokens": [
      {
        "name": "--q-map-height",
        "value": "100%"
      },
      {
        "name": "--q-map-min-height",
        "value": "240px"
      },
      {
        "name": "--q-map-bg",
        "value": "var(--q-bg-surface-1)"
      },
      {
        "name": "--q-map-border",
        "value": "var(--q-border)"
      },
      {
        "name": "--q-map-radius",
        "value": "var(--q-radius-lg)"
      },
      {
        "name": "--q-map-marker-size",
        "value": "20px"
      },
      {
        "name": "--q-map-marker-size-small",
        "value": "16px"
      },
      {
        "name": "--q-map-marker-size-medium",
        "value": "var(--q-map-marker-size)"
      },
      {
        "name": "--q-map-marker-size-large",
        "value": "24px"
      },
      {
        "name": "--q-map-marker-color",
        "value": "var(--q-color-primary)"
      },
      {
        "name": "--q-map-marker-success",
        "value": "var(--q-color-success)"
      },
      {
        "name": "--q-map-marker-warning",
        "value": "var(--q-color-warning)"
      },
      {
        "name": "--q-map-marker-danger",
        "value": "var(--q-color-danger)"
      },
      {
        "name": "--q-map-marker-muted",
        "value": "var(--q-fg-muted)"
      },
      {
        "name": "--q-map-marker-selected-color",
        "value": "var(--q-fg-base)"
      },
      {
        "name": "--q-map-marker-selected-shadow",
        "value": "var(--q-shadow-medium)"
      },
      {
        "name": "--q-map-attribution-bg",
        "value": "var(--q-bg-base)"
      },
      {
        "name": "--q-map-attribution-color",
        "value": "var(--q-fg-muted)"
      }
    ]
  },
  {
    "category": "Scrollbars",
    "tokens": [
      {
        "name": "--q-scrollbar-width",
        "value": "6px"
      },
      {
        "name": "--q-scrollbar-width-thin",
        "value": "thin"
      },
      {
        "name": "--q-scrollbar-track-color",
        "value": "transparent"
      },
      {
        "name": "--q-scrollbar-thumb-color",
        "value": "var(--q-border-color, #374151)"
      },
      {
        "name": "--q-scrollbar-thumb-color-hover",
        "value": "var(--q-color-primary, #60a5fa)"
      },
      {
        "name": "--q-scrollbar-radius",
        "value": "var(--q-radius-sm, 4px)"
      }
    ]
  }
];

/** Comfortable overrides for the existing density tokens. Compact values stay in their canonical catalog above. */
export const comfortablePreset = {
  '--q-space-none': '0rem', '--q-space-xs': '0.375rem', '--q-space-sm': '0.75rem',
  '--q-space-md': '1rem', '--q-space-lg': '1.5rem', '--q-space-xl': '2rem',
  '--q-space-2xl': '3rem', '--q-space-3xl': '4rem',
  '--q-control-height-sm': '2.25rem', '--q-control-font-sm': '0.875rem',
  '--q-control-line-sm': '1.25rem', '--q-control-padding-sm': '0.75rem', '--q-control-icon-sm': '1rem',
  '--q-control-height-md': '2.75rem', '--q-control-font-md': '1rem',
  '--q-control-line-md': '1.5rem', '--q-control-padding-md': '1rem', '--q-control-icon-md': '1.25rem',
  '--q-control-height-lg': '3.25rem', '--q-control-font-lg': '1.125rem',
  '--q-control-line-lg': '1.75rem', '--q-control-padding-lg': '1.25rem', '--q-control-icon-lg': '1.5rem',
  '--q-font-size-sm': '0.875rem', '--q-font-size-base': '1.125rem', '--q-font-size-lg': '1.5rem',
  '--q-padding-sm': 'var(--q-space-sm, .75rem)', '--q-padding-md': 'var(--q-space-md, 1rem)',
  '--q-padding-lg': 'var(--q-space-lg, 1.5rem)',
  '--q-step-diag-icon-size': '40px', '--q-step-diag-item-gap': '32px', '--q-reel-gap': '24px',
  '--q-avatar-size-sm': '32px', '--q-avatar-size-md': '48px', '--q-avatar-size-lg': '64px',
  '--q-carousel-gap': '24px', '--q-carousel-padding': '32px 24px', '--q-carousel-arrow-size': '44px',
  '--q-carousel-indicator-gap': '12px', '--q-carousel-indicator-size': '8px',
  '--q-progress-linear-height-sm': '6px', '--q-progress-linear-height-md': '8px', '--q-progress-linear-height-lg': '10px',
  '--q-progress-circular-size-sm': '80px', '--q-progress-circular-size-md': '144px', '--q-progress-circular-size-lg': '200px',
  '--q-progress-circular-stroke-width-sm': '8px', '--q-progress-circular-stroke-width-md': '10px', '--q-progress-circular-stroke-width-lg': '12px',
  '--q-btn-icon-padding-sm': '6px', '--q-btn-icon-padding-md': '8px', '--q-btn-icon-padding-lg': '12px',
  '--q-chip-padding-sm': '6px 12px', '--q-chip-padding-md': '8px 16px', '--q-chip-padding-lg': '10px 20px',
  '--q-chip-height-sm': '32px', '--q-chip-height-md': '40px', '--q-chip-height-lg': '48px',
  '--q-sidepanel-panel-padding': 'var(--q-padding-lg)',
  '--q-sidepanel-panel-header-padding': 'var(--q-padding-lg)', '--q-sidepanel-panel-footer-padding': 'var(--q-padding-lg)',
  '--q-map-marker-size': '24px', '--q-map-marker-size-small': '20px',
  '--q-map-marker-size-medium': 'var(--q-map-marker-size)', '--q-map-marker-size-large': '28px',
} as const satisfies Record<`--q-${string}`, string>;

/** New reading roles. Compact preserves the existing native-client text conventions. */
export const semanticPresetTokens: Record<string, Record<QPreset, string>> = {
  '--q-text-body-size': { compact: 'var(--q-font-size-base)', comfortable: 'var(--q-font-size-base)' },
  '--q-text-body-line-height': { compact: '1.5', comfortable: '1.6' },
  '--q-text-small-size': { compact: 'var(--q-font-size-sm)', comfortable: 'var(--q-font-size-sm)' },
  '--q-text-small-line-height': { compact: '1.5', comfortable: '1.5' },
  '--q-heading-display-size': { compact: 'var(--q-font-size-lg)', comfortable: 'clamp(2.5rem, 1.75rem + 3vw, 4rem)' },
  '--q-heading-display-line-height': { compact: '1.3', comfortable: '1.1' },
  '--q-heading-1-size': { compact: 'var(--q-font-size-lg)', comfortable: 'clamp(27px, 1.5rem + 2vw, 36px)' },
  '--q-heading-2-size': { compact: 'var(--q-font-size-lg)', comfortable: 'clamp(1.75rem, 1.375rem + 1.5vw, 2.5rem)' },
  '--q-heading-3-size': { compact: 'var(--q-font-size-lg)', comfortable: 'clamp(1.5rem, 1.25rem + 1vw, 2rem)' },
  '--q-heading-4-size': { compact: 'var(--q-font-size-lg)', comfortable: '1.375rem' },
  '--q-heading-5-size': { compact: 'var(--q-font-size-lg)', comfortable: '1.25rem' },
  '--q-heading-6-size': { compact: 'var(--q-font-size-lg)', comfortable: '1.125rem' },
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map(level => [
    `--q-heading-${level}-line-height`, { compact: '1.3', comfortable: level <= 2 ? '1.2' : '1.3' },
  ])),
  '--q-content-paragraph-gap': { compact: 'var(--q-padding-lg)', comfortable: '1.5rem' },
  '--q-content-heading-gap': { compact: 'var(--q-padding-lg)', comfortable: '1.5rem' },
  '--q-content-section-gap': { compact: 'var(--q-space-2xl)', comfortable: 'clamp(3rem, 2rem + 4vw, 6rem)' },
  '--q-content-padding': { compact: 'var(--q-padding-lg)', comfortable: 'clamp(1.5rem, 1rem + 2vw, 3rem)' },
  '--q-field-text-size': { compact: '.75rem', comfortable: '.875rem' },
  '--q-field-text-line': { compact: '1rem', comfortable: '1.25rem' },
};

// Internal size defaults keep generic and size-specific tab overrides independent.
export const internalPresetTokens: Record<string, Record<QPreset, string>> = {
  '--_q-preset-tabs-height-sm': { compact: '34px', comfortable: '40px' },
  '--_q-preset-tabs-height-md': { compact: '42px', comfortable: '48px' },
  '--_q-preset-tabs-height-lg': { compact: '50px', comfortable: '56px' },
  '--_q-preset-tabs-padding-sm': { compact: '6px 10px', comfortable: '8px 14px' },
  '--_q-preset-tabs-padding-md': { compact: '9px 16px', comfortable: '12px 20px' },
  '--_q-preset-tabs-padding-lg': { compact: '14px 18px', comfortable: '16px 24px' },
};

export const componentPresetTokens: Record<string, Record<QPreset, string>> = {
  '--q-toolbar-height': { compact: '0px', comfortable: '72px' },
  '--q-toolbar-compact-height': { compact: '0px', comfortable: '60px' },
  '--q-font-size-xs': { compact: '0.7rem', comfortable: '0.8125rem' },
  '--q-font-size-2xs': { compact: '0.625rem', comfortable: '0.75rem' },
  '--q-btn-circle-size': { compact: '120px', comfortable: '144px' },
  '--q-btn-circle-padding': { compact: '12px', comfortable: '16px' },
  '--q-table-toolbar-padding-block': { compact: '12px', comfortable: '16px' },
  '--q-table-toolbar-padding-inline': { compact: '16px', comfortable: '24px' },
  '--q-bar-edge-padding': { compact: '24px', comfortable: '32px' },
  '--q-bar-edge-compact-padding': { compact: '16px', comfortable: '24px' },
  '--q-table-cell-padding-block': { compact: '4.5px', comfortable: '10px' },
  '--q-table-cell-padding-inline': { compact: '8px', comfortable: '14px' },
  '--q-dropdown-option-padding': { compact: '10px 14px', comfortable: '12px 18px' },
  '--q-tooltip-padding': { compact: '6px 10px', comfortable: '8px 14px' },
  '--q-syntax-padding': { compact: '16px', comfortable: '24px' },
  '--q-syntax-compact-padding': { compact: '10px', comfortable: '16px' },
  '--q-syntax-header-padding': { compact: '4px 16px', comfortable: '8px 24px' },
  '--q-sidepanel-nav-font': { compact: '0.875rem', comfortable: '1rem' },
  '--q-sidepanel-nav-small-font': { compact: '0.75rem', comfortable: '0.875rem' },
  '--q-sidepanel-nav-badge-font': { compact: '0.65rem', comfortable: '0.75rem' },
  '--q-navbar-item-height': { compact: '36px', comfortable: '44px' },
  '--q-navbar-gap': { compact: '20px', comfortable: '28px' },
  '--q-navbar-height': { compact: '64px', comfortable: '72px' },
  '--q-navbar-compact-height': { compact: '52px', comfortable: '60px' },
  '--q-navbar-logo-size': { compact: '32px', comfortable: '40px' },
  '--q-navbar-brand-size': { compact: '1rem', comfortable: '1.25rem' },
  '--q-navbar-nav-gap': { compact: '6px', comfortable: '10px' },
  '--q-navbar-action-gap': { compact: '8px', comfortable: '12px' },
  '--q-navbar-item-gap': { compact: '8px', comfortable: '12px' },
  '--q-navbar-item-padding': { compact: '7px 10px', comfortable: '10px 14px' },
  '--q-navbar-item-size': { compact: '0.9rem', comfortable: '1rem' },
  '--q-navbar-item-icon-only-size': { compact: '40px', comfortable: '44px' },
  '--q-navbar-item-icon-only-padding': { compact: '8px', comfortable: '10px' },
  '--q-navbar-mobile-panel-padding': { compact: '8px 16px 16px', comfortable: '12px 24px 24px' },
  '--q-avatar-font-size': { compact: '0.8rem', comfortable: '1rem' },
  '--q-avatar-font-size-sm': { compact: '0.65rem', comfortable: '0.75rem' },
  '--q-avatar-font-size-lg': { compact: '1rem', comfortable: '1.25rem' },
  '--q-conversation-gap': { compact: '10px', comfortable: '16px' },
  '--q-conversation-header-gap': { compact: '4px', comfortable: '6px' },
  '--q-conversation-header-inset': { compact: '4px', comfortable: '6px' },
  '--q-conversation-padding': { compact: '11px 13px', comfortable: '16px 20px' },
  '--q-conversation-footer-gap': { compact: '10px', comfortable: '16px' },
  '--q-conversation-footer-margin': { compact: '6px', comfortable: '10px' },
  '--q-conversation-meta-gap': { compact: '6px', comfortable: '10px' },
  '--q-conversation-compact-padding': { compact: '7px 10px', comfortable: '10px 14px' },
  '--q-alert-padding': { compact: '12px 14px', comfortable: '16px 20px' },
  '--q-alert-gap': { compact: '10px', comfortable: '16px' },
  '--q-alert-actions-gap': { compact: '8px', comfortable: '12px' },
  '--q-pagination-button-height': { compact: '30px', comfortable: '44px' },
  '--q-pagination-button-padding': { compact: '5px 8px', comfortable: '8px 12px' },
};

export const presetTokens = Object.entries(comfortablePreset).map<{ name: string; compact: string; comfortable: string }>(([name, comfortable]) => {
  const token = [...dimensionTokens, ...themeGroups.flatMap(group => group.tokens)].find(token => token.name === name);
  if (!token) throw new Error(`Preset token has no compact default: ${name}`);
  return { name, compact: token.value, comfortable };
}).concat(Object.entries({ ...semanticPresetTokens, ...componentPresetTokens }).map(([name, values]) => ({ name, ...values })));
