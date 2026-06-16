# 🎨 WebQuark CSS Theme Variables Reference

This document catalogs all the CSS custom properties (variables) available in WebQuark. Developers can override these variables globally (at `:root` or inside a theme class) or inline on specific component instances to customize colors, spacing, borders, shadows, typography, and animations.

> [!NOTE]
> **Default Theme Configuration**: WebQuark is styled in **Dark Mode** by default. Light mode is treated as an override and will be triggered automatically if the system preference is light, or manually if `data-theme="light"` is set on the root element.

> [!IMPORTANT]
> **Unreal Engine Webview & WebUI Compatibility**:
> In Unreal Engine (CEF/WebUI) environments, standard browser Off-Screen Rendering (OSR) is used to draw the browser interface to a 3D texture. OSR environments **cannot capture back-buffer pixels to apply real-time blurs**, which makes CSS `backdrop-filter: blur()` completely fail or glitch (rendering as fully transparent or black boxes).
> To prevent invisible panels or broken layouts inside Unreal, WebQuark components enforce a high-opacity glass fallback (`--q-bg-glass: rgba(..., 0.85)`) so backgrounds remain perfectly visible and readable even if backdrop blur fails. Avoid changing `--q-bg-glass` opacity below `0.7` when deploying inside Unreal.

### 🌑 Default Dark Theme Palette
![WebQuark Default Dark Theme Color Palette](file:///C:/Users/ahlou/.gemini/antigravity/brain/41286b01-1e59-4481-a407-e7f283b1c70f/default_dark_theme_palette_1781198853550.png)

### ☀️ Default Light Theme Palette
![WebQuark Default Light Theme Color Palette](file:///C:/Users/ahlou/.gemini/antigravity/brain/41286b01-1e59-4481-a407-e7f283b1c70f/default_light_theme_palette_1781198888142.png)

---

## 1. Brand & Status Colors
Used for text highlights, progress bars, active statuses, timeline event markers, and interactive states.

| Variable Name | Default Value (Light) | Default Value (Dark) | Description |
| :--- | :--- | :--- | :--- |
| `--q-color-primary` | `#3b82f6` (Blue) | `#60a5fa` | Main brand/accent color. |
| `--q-color-primary-hover` | `#2563eb` | `#93c5fd` | Hover state for primary actions/links. |
| `--q-color-secondary` | `#4b5563` | `#9ca3af` | Secondary/muted accent color. |
| `--q-color-success` | `#10b981` (Green) | `#34d399` | Success indicator (e.g., healthy timeline events). |
| `--q-color-warning` | `#f59e0b` (Orange) | `#fbbf24` | Warning indicator. |
| `--q-color-danger` | `#ef4444` (Red) | `#f87171` | Danger/Error indicator. |

---

## 2. Surfaces & Backgrounds
Defines the canvas background, card faces, and hierarchical container backdrops (designed for complex multi-layered interfaces like Blender or Figma).

### 🗺️ Visual Stacking Layers

```
  ┌─────────────────────────────────────────────────────────┐
  │  viewport base / main canvas ( --q-bg-base )            │
  │                                                         │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │  sidebars / shelves / panel workspace ( surface-1 )│  │
  │  │                                                   │  │
  │  │  ┌─────────────────────────────────────────────┐  │  │
  │  │  │  nested cards / properties grid ( surface-2 )│  │  │
  │  │  │                                             │  │  │
  │  │  │  ┌───────────────────────────────────────┐  │  │  │
  │  │  │  │ dropdowns / popovers / tips (surface-3)│  │  │  │
  │  │  │  └───────────────────────────────────────┘  │  │  │
  │  │  └─────────────────────────────────────────────┘  │  │
  │  └───────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────┘
```

| Variable Name | Default Value (Light) | Default Value (Dark) | Description |
| :--- | :--- | :--- | :--- |
| `--q-bg-base` | `#ffffff` | `#111827` | Lowest canvas / viewport background (e.g., Blender grid/3D viewport). |
| `--q-bg-surface-1` | `#f3f4f6` | `#1f2937` | Level 1 Surface Panel background (e.g., sidebars, properties shelves, outliners). |
| `--q-bg-surface-2` | `#e5e7eb` | `#374151` | Level 2 Surface Panel background (e.g., nested dialogs, inner tabs, toolbar sections). |
| `--q-bg-surface-3` | `#d1d5db` | `#4b5563` | Level 3 Surface Panel background (e.g., dropdowns, tooltips, popovers closest to screen). |
| `--q-bg-card` | `var(--q-bg-surface-1)`| `var(--q-bg-surface-1)`| The fallback card surface background. |
| `--q-bg-glass` | `rgba(255, 255, 255, 0.85)` | `rgba(31, 41, 55, 0.85)` | High-opacity glass surface background (OSR safe). |
| `--q-bg-overlay` | `rgba(0, 0, 0, 0.6)` | `rgba(0, 0, 0, 0.85)` | Lightbox modal / full-screen cover layer. |

---

## 3. Glassmorphism & Shadows
Controls the premium visual effects (blur intensity, shadows, and reflection glow).

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `--q-glass-blur` | `12px` | Backdrop blur intensity for glass cards. |
| `--q-shadow-low` | `0 2px 4px rgba(0,0,0,0.05)` | Elevation low shadow. |
| `--q-shadow-medium` | `0 8px 16px rgba(0,0,0,0.08)` | Elevation medium shadow. |
| `--q-shadow-high` | `0 16px 32px rgba(0,0,0,0.12)` | Elevation high shadow. |
| `--q-glow-interactive` | `0 0 20px rgba(59,130,246,0.3)` | Shadow/glow color on card hover or active status. |
| `--q-hover-transform` | `translateY(-4px) scale(1.02)` | Lift animation transform translation blueprint. |

---

## 4. Borders & Outlines
Ensures consistent borders and accessibility focus rings.

| Variable Name | Default Value (Light) | Default Value (Dark) | Description |
| :--- | :--- | :--- | :--- |
| `--q-border-color` | `#e5e7eb` | `#374151` | Subtle container/card border color. |
| `--q-border-width` | `1px` | `1px` | Border thickness. |
| `--q-border` | `1px solid var(--q-border-color)` | `1px solid var(--q-border-color)` | Composite global shorthand border definition. |
| `--q-focus-ring` | `2px solid #3b82f6` | `2px solid #60a5fa` | Accessibility outline style when focused. |

---

## 5. Typography
Allows customized fonts, weights, and scaling factors.

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `--q-font-family` | `system-ui, -apple-system, sans-serif` | The font family used across all elements. |
| `--q-font-size-sm` | `0.875rem` (14px) | Smaller text (timeline times, labels). |
| `--q-font-size-base` | `1rem` (16px) | Body text. |
| `--q-font-size-lg` | `1.25rem` (20px) | Subheadings & headers. |
| `--q-font-weight-normal`| `400` | Regular font weight. |
| `--q-font-weight-bold` | `600` | Highlight/header font weight. |

---

## 6. Border Radiuses & Spacing
Determines how rounded elements are and their padding defaults.

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `--q-radius-sm` | `4px` | Small roundings (badges, status indicators). |
| `--q-radius-md` | `8px` | Medium roundings (thumbnails, reel frames). |
| `--q-radius-lg` | `12px` | Large roundings (cards, modalled views). |
| `--q-padding-sm` | `12px` | Compact component inner spacing. |
| `--q-padding-md` | `16px` | Standard spacing. |
| `--q-padding-lg` | `24px` | Generous card and header spacing. |

---

## 7. Animations & Transitions
Ensures micro-animations feel smooth and matching in speed.

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `--q-transition-fast` | `150ms ease` | Simple hover fade states. |
| `--q-transition-normal` | `250ms cubic-bezier(0.4, 0, 0.2, 1)` | Slide/expansion transitions (reel & progress). |
| `--q-transition-slow` | `400ms cubic-bezier(0.4, 0, 0.2, 1)` | Lightbox overlay fades. |

---

## 8. Component-Specific Tuning
Exposes variables specialized for fine-tuning specific complex components.

### A. Card (`q-card`)
*   `--q-card-min-width`: `280px` — Prevents cards from squishing on small screens.
*   `--q-card-border`: `var(--q-border)` — Composite border shorthand (border-width, style, color).
*   `--q-card-hover-transform`: `var(--q-hover-transform)` — Lifting shift transform on interactive hover.
*   `--q-card-transition-duration`: `var(--q-transition-normal)` — Transition speed for animations.

### B. Step Diagram (`q-step-diagram` & `q-step-diagram-item`)
*   `--q-step-diag-line`: `2px solid var(--q-border-color)` — Composite connecting path line stroke.
*   `--q-step-diag-border`: `var(--q-border)` — Outer border outline for the step content boxes.
*   `--q-step-diag-icon-size`: `32px` — Sizing height/width of the step node badge circles.
*   `--q-step-diag-item-gap`: `24px` — Spacing gap between successive steps.

### C. Media Reel & Thumbnail (`q-media-reel` / `q-media-thumbnail`)
*   `--q-thumb-aspect-ratio`: `16 / 9` — Rigid crop structure for screenshots.
*   `--q-thumb-border`: `var(--q-border)` — Border shorthand for the media thumbnail.
*   `--q-thumb-hover-transform`: `var(--q-hover-transform)` — Scale-up transform on hover.
*   `--q-thumb-overlay-bg`: `rgba(0, 0, 0, 0.4)` — Hover overlay tint.
*   `--q-reel-gap`: `12px` — Grid spacing inside the media reel.
*   `--q-reel-columns-desktop`: `repeat(auto-fill, minmax(200px, 1fr))` — Desktop grid distribution.
*   `--q-reel-columns-mobile`: `1fr` — Mobile grid column distribution.
*   `--q-lightbox-max-size`: `90vh` — Constraint on maximized media overlay.

### D. Circular Progress (`q-circular-progress`)
*   `--q-progress-size`: `120px` — Width and height of the SVG circular frame.
*   `--q-progress-stroke-width`: `8px` — Thickness of the progress track.
*   `--q-progress-linecap`: `round` — Progress line cap ending style (`round` or `butt`).
*   `--q-progress-track-color`: `var(--q-border-color)` — Background circle color.
*   `--q-progress-fill-color`: `var(--q-color-primary)` — Active percentage ring color.
*   `--q-progress-font-size`: `var(--q-font-size-lg)` — Text size of percentage label.
*   `--q-progress-font-weight`: `var(--q-font-weight-bold)` — Text weight of percentage label.
*   `--q-progress-animation-duration`: `1s` — Animation fill duration.

### E. Button (`q-button`)
*   `--q-btn-radius`: `var(--q-radius-md)` — Corner rounding for the button.
*   `--q-btn-font-size`: `var(--q-font-size-base)` — Typographic text size of label.
*   `--q-btn-font-weight`: `var(--q-font-weight-bold)` — Label weight.
*   `--q-btn-active-transform`: `scale(0.97)` — Press down scale on click.
*   `--q-btn-transition`: `all 150ms cubic-bezier(0.4, 0, 0.2, 1)` — Interactive state transition definition.
*   `--q-btn-padding-sm`: `6px 12px` — Layout padding for small size.
*   `--q-btn-padding-md`: `10px 20px` — Layout padding for medium size.
*   `--q-btn-padding-lg`: `14px 28px` — Layout padding for large size.

### F. Input & Textarea (`q-input` / `q-textarea`)
*   `--q-input-bg`: `var(--q-bg-surface-2)` — Input field internal background.
*   `--q-input-border`: `var(--q-border)` — Standby border outline.
*   `--q-input-border-focus`: `1px solid var(--q-color-primary)` — Focused border style.
*   `--q-input-radius`: `var(--q-radius-md)` — Border radius.
*   `--q-input-padding`: `10px 14px` — Interior text padding.

### G. Dropdown (`q-dropdown`)
*   `--q-dropdown-bg`: `var(--q-bg-surface-2)` — Closed dropdown trigger box background.
*   `--q-dropdown-menu-bg`: `var(--q-bg-surface-3)` — Popover select menu surface.
*   `--q-dropdown-border`: `var(--q-border)` — Menu border line.
*   `--q-dropdown-radius`: `var(--q-radius-md)` — Border rounding.

### H. Sidepanel (`q-sidepanel`)
*   `--q-panel-bg`: `var(--q-bg-surface-1)` — Main side panel canvas background.
*   `--q-panel-border`: `var(--q-border)` — Edge separating line.
*   `--q-panel-shadow`: `var(--q-shadow-high)` — Floating shadow depth.

---

## Usage Example

### Global Custom Theme
```css
/* Apply a cyber/neon theme globally in your application's global stylesheet */
:root {
  --q-color-primary: #ff007f;
  --q-bg-base: #0a0a16;
  --q-fg-base: #00ffcc;
  --q-bg-card: rgba(18, 18, 36, 0.7);
  --q-border-color: #3d0066;
  
  --q-font-family: 'Courier New', monospace;
  --q-radius-lg: 0px; /* Sharp retro corners */
}
```

### Instance Custom Override
```html
<!-- Customize a single card instance inline -->
<q-card style="--q-bg-card: #fffdf5; --q-radius-lg: 24px;">
  <h3>Special Cozy Card</h3>
</q-card>
```

### Hierarchical Layering (Blender-style Workspace)
For complex multi-pane applications, nest components and override the surface variable so nested containers automatically lighten (or change brightness) to establish visual depth.

```html
<!-- Base Sidebar Workspace Panel (Dark: #1f2937) -->
<div class="workspace-sidebar" style="background: var(--q-bg-surface-1); padding: var(--q-padding-md);">
  
  <!-- Nested properties card (automatically lightens to #374151 inside) -->
  <q-card style="--q-bg-card: var(--q-bg-surface-2);">
    <h4>Transform Controls</h4>
    
    <!-- Deepest nested tool selection container (lightens to #4b5563) -->
    <div class="tool-grid" style="background: var(--q-bg-surface-3); border-radius: var(--q-radius-sm); padding: var(--q-padding-sm);">
      <button>Translate</button>
      <button>Rotate</button>
    </div>
  </q-card>
</div>
```

---

## 9. Managing Light & Dark Themes

WebQuark components support two modes of theme management: **Automatic (System-based)** and **Manual (Toggle-based)**.

### Method A: Automatic Theme Switching (OS Preferences)
By default, the library includes media query declarations inside `global.css` that automatically swap variables depending on the user's operating system preferences:

```css
:root {
  /* Light mode defaults */
  --q-bg-base: #ffffff;
  --q-fg-base: #1f2937;
  --q-bg-surface-1: #f3f4f6;
  --q-bg-surface-2: #e5e7eb;
  --q-bg-surface-3: #d1d5db;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode overrides */
    --q-bg-base: #111827;
    --q-fg-base: #f9fafb;
    --q-bg-surface-1: #1f2937;
    --q-bg-surface-2: #374151;
    --q-bg-surface-3: #4b5563;
  }
}
```

### Method B: Manual Theme Selector (Toggle Switch)
If your app has a button to let the user manually choose their theme, it is best practice to toggle a `.dark` or `data-theme="dark"` attribute on the `<html>` or `<body>` element. 

#### 1. Define variables for both theme scopes in your stylesheet:
```css
/* Light Theme (Default) */
:root, [data-theme="light"] {
  --q-bg-base: #ffffff;
  --q-fg-base: #1f2937;
  --q-bg-surface-1: #f3f4f6;
  --q-bg-surface-2: #e5e7eb;
  --q-bg-surface-3: #d1d5db;
}

/* Dark Theme Override */
[data-theme="dark"] {
  --q-bg-base: #111827;
  --q-fg-base: #f9fafb;
  --q-bg-surface-1: #1f2937;
  --q-bg-surface-2: #374151;
  --q-bg-surface-3: #4b5563;
}
```

#### 2. Toggle the theme in JavaScript/TypeScript:
```javascript
// Simple event handler for a theme toggle button
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Set attribute on HTML tag (all WebQuark components update instantly)
  document.documentElement.setAttribute('data-theme', targetTheme);
  
  // Save preference in localStorage
  localStorage.setItem('theme', targetTheme);
}
```

---

## 10. Overwriting Both Themes (Custom Light & Dark Example)

If a developer wants to completely replace our default light and dark themes with their own custom light/dark design system (e.g., an **Emerald Eco** theme), they would declare the variables in their global stylesheet like this:

```css
/* ==========================================================================
   1. CUSTOM EMERALD LIGHT THEME (Applied by default)
   ========================================================================== */
:root, [data-theme="light"] {
  /* Brand Accent Colors */
  --q-color-primary: #059669;          /* Emerald Green */
  --q-color-primary-hover: #047857;
  --q-color-secondary: #4b5563;
  --q-color-success: #10b981;
  --q-color-warning: #f59e0b;
  --q-color-danger: #e11d48;

  /* Surfaces & Hierarchical Backgrounds */
  --q-bg-base: #f0fdf4;                 /* Soft Mint White Base */
  --q-bg-surface-1: #ffffff;            /* Pure White Panels */
  --q-bg-surface-2: #dcfce7;            /* Nested Light Green Panels */
  --q-bg-surface-3: #bbf7d0;            /* Highlighted Nested Panels */
  --q-bg-card: var(--q-bg-surface-1);
  --q-bg-glass: rgba(255, 255, 255, 0.6);
  --q-bg-overlay: rgba(6, 78, 59, 0.4); /* Green tinted backdrop overlay */

  /* Borders & Shadows */
  --q-border-color: #a7f3d0;            /* Soft mint borders */
  --q-border-width: 1.5px;
  --q-shadow-medium: 0 4px 20px rgba(4, 120, 87, 0.08);
  --q-radius-lg: 16px;                  /* Softer rounded cards */
}

/* ==========================================================================
   2. CUSTOM EMERALD DARK THEME (Applied on toggle)
   ========================================================================== */
[data-theme="dark"] {
  /* Brand Accent Colors (optimized for dark contrast) */
  --q-color-primary: #34d399;          /* Lighter Emerald */
  --q-color-primary-hover: #6ee7b7;
  --q-color-secondary: #9ca3af;

  /* Surfaces & Hierarchical Backgrounds */
  --q-bg-base: #022c22;                 /* Very Deep Forest Green Canvas */
  --q-bg-surface-1: #064e3b;            /* Dark Emerald Panels */
  --q-bg-surface-2: #065f46;            /* Lighter green nested panel */
  --q-bg-surface-3: #047857;            /* Even lighter green nested panel */
  --q-bg-card: var(--q-bg-surface-1);
  --q-bg-glass: rgba(6, 78, 59, 0.45);
  --q-bg-overlay: rgba(2, 44, 34, 0.85);

  /* Borders & Shadows */
  --q-border-color: #065f46;
  --q-shadow-medium: 0 10px 30px rgba(0, 0, 0, 0.35);
}
```
