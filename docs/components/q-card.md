# 🧩 Component Specification: `q-card`

The `<q-card>` is a layout container panel that encapsulates visual styling (backgrounds, borders, shadows, and hover dynamics) inside its Shadow DOM. It is designed to host any custom content dynamically via slots.

---

## 1. Component API (Properties & Attributes)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `elevation` | `'low' \| 'medium' \| 'high'` | `'medium'` | Determines the shadow depth and visual hierarchy level. |
| `interactive` | `boolean` | `false` | When `true`, enables active hover animations, hover lift, and click-press dynamics. |
| `glass` | `boolean` | `false` | Enables translucent glass background styling with OSR-safe backdrop support. |

---

## 2. Slots

*   `header`: Top title/control section (automatically styles headers with larger, bolder font weights).
*   `default` (unnamed): Core body content container.

---

## 3. Visual Variants

The component behaves differently based on the combination of `elevation` and `interactive` properties:

### Variant A: Static Cards (`interactive="false"`)
*   **Low Elevation (`elevation="low"`)**: Blends into background layers. Best used for nested panels inside sidebars (Surface Level 2).
*   **Medium Elevation (`elevation="medium"`)**: Floating dashboard panels. Best used for core tools, graphs, or widgets (Surface Level 1).
*   **High Elevation (`elevation="high"`)**: Prominent foreground dialogs, popups, or overlays closest to the user.

### Variant B: Interactive Cards (`interactive="true"`)
*   When hovered, the card lifts up using `--q-card-hover-transform` and displays a glowing interactive reflection border using `--q-glow-interactive`.
*   Supports keyboard focus triggers (`:focus-within`) for accessibility.
*   Enforces a tactile scale-down press effect (`active: scale(0.99)`) when clicked.

---

## 4. Typography & Font Styles

To ensure absolute modularity, `<q-card>` inherits its font styling from the host container but enforces strict hierarchical text sizes for its slotted elements:

*   **Global Font Stack**: Inherits `--q-font-family` (e.g., `-apple-system, Segoe UI, Roboto`).
*   **Header Slot Text**:
    *   Font size: `--q-font-size-lg` (e.g., `1.125rem` / `18px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `600`).
    *   Line-height: `1.4`.
*   **Body Content (Default Slot)**:
    *   Font size: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   Font weight: `--q-font-weight-normal` (e.g., `400`).
    *   Line-height: `1.5`.

---

## 5. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value (Dark Mode) | Purpose |
| :--- | :--- | :--- |
| `--q-card-border` | `1px solid #374151` | Complete card border contour outline (color, width, style). |
| `--q-radius-lg` | `12px` | Corner rounding of the card. |
| `--q-padding-lg` | `24px` | Internal content padding spacing. |
| `--q-card-min-width`| `280px` | Sizing boundary constraint to prevent layout collapse. |
| `--q-bg-card` | `#1f2937` | Matte base background color (fallback if glass filter is absent). |
| `--q-bg-glass` | `rgba(31, 41, 55, 0.85)` | High-opacity glass color (OSR/Unreal WebUI safe fallback). |
| `--q-glass-blur` | `12px` | Backdrop blur intensity. |
| `--q-shadow-low` | `0 2px 4px rgba(0,0,0,0.2)` | Shadow definition for `'low'` elevation. |
| `--q-shadow-medium`| `0 8px 16px rgba(0,0,0,0.3)` | Shadow definition for `'medium'` elevation. |
| `--q-shadow-high` | `0 16px 32px rgba(0,0,0,0.45)`| Shadow definition for `'high'` elevation. |
| `--q-card-hover-transform` | `translateY(-4px) scale(1.02)` | Lift animation translation blueprint. |
| `--q-card-transition-duration` | `250ms cubic-bezier(...)` | Timeline speed of state transitions. |
| `--q-glow-interactive` | `0 0 20px rgba(96,165,250,0.3)`| Shadow glow when hovered/focused. |

---

## 6. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-card',
  styleUrl: 'q-card.css',
  shadow: true, // ◄ Enables Shadow DOM encapsulation
})
export class QCard {
  @Prop({ reflect: true }) elevation: 'low' | 'medium' | 'high' = 'medium';
  @Prop({ reflect: true }) interactive: boolean = false;
  @Prop() glass: boolean = false;

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).click();
    }
  };

  render() {
    return (
      <div 
        class={{
          'card-container': true,
          [`elevation-${this.elevation}`]: true,
          'is-interactive': this.interactive,
          'is-glass': this.glass
        }}
        tabindex={this.interactive ? 0 : undefined}
        role={this.interactive ? 'button' : undefined}
        onKeyDown={this.interactive ? this.handleKeyDown : undefined}
      >
        {/* Header Slot container (if header content is present) */}
        <div class="card-header" part="header">
          <slot name="header" />
        </div>
        
        {/* Body Slot Container */}
        <div class="card-body" part="body">
          <slot />
        </div>
      </div>
    );
  }
}
```

---

## 7. Component Styling (`q-card.css`)

```css
:host {
  display: block;
  min-width: var(--q-card-min-width, 280px);
  box-sizing: border-box;
}

.card-container {
  display: flex;
  flex-direction: column;
  border-radius: var(--q-radius-lg, 12px);
  padding: var(--q-padding-lg, 24px);
  border: var(--q-card-border, 1px solid var(--q-border-color, #374151));
  box-sizing: border-box;
  
  /* Unreal Engine OSR safe fallback: Enforces high-opacity base background */
  background: var(--q-bg-card, var(--q-bg-surface-1, #1f2937));
  
  transition: transform var(--q-card-transition-duration, 250ms ease), 
              box-shadow var(--q-card-transition-duration, 250ms ease), 
              border-color var(--q-card-transition-duration, 250ms ease);
}

/* Glassmorphism support where supported */
.card-container.is-glass {
  background: var(--q-bg-glass, rgba(31, 41, 55, 0.85));
}

@supports (backdrop-filter: blur(0px)) {
  .card-container.is-glass {
    backdrop-filter: blur(var(--q-glass-blur, 12px));
  }
}

/* Elevation Levels */
.elevation-low {
  box-shadow: var(--q-shadow-low, 0 2px 4px rgba(0,0,0,0.2));
}
.elevation-medium {
  box-shadow: var(--q-shadow-medium, 0 8px 16px rgba(0,0,0,0.3));
}
.elevation-high {
  box-shadow: var(--q-shadow-high, 0 16px 32px rgba(0,0,0,0.45));
}

/* Interactive States */
.is-interactive:hover,
.is-interactive:focus-visible {
  transform: var(--q-card-hover-transform, translateY(-4px) scale(1.02));
  box-shadow: var(--q-shadow-high, 0 16px 32px rgba(0,0,0,0.45)), var(--q-glow-interactive, 0 0 20px rgba(96,165,250,0.3));
  border-color: var(--q-color-primary, #60a5fa);
  outline: none;
  cursor: pointer;
}

.is-interactive:active {
  transform: scale(0.99);
}

/* Header Slot Typography */
.card-header {
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-lg, 1.125rem);
  font-weight: var(--q-font-weight-bold, 700);
  line-height: 1.4;
  margin-bottom: var(--q-padding-sm, 12px);
}

/* Body Slot Typography */
.card-body {
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-base, 1rem);
  font-weight: var(--q-font-weight-normal, 400);
  line-height: 1.5;
}
```
