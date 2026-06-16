# 🧩 Component Specification: `q-card`

The `<q-card>` is a layout container panel that encapsulates visual styling (backgrounds, borders, shadows, and hover dynamics) inside its Shadow DOM. It is designed to host any custom content dynamically via slots.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `elevation` | `elevation` | `"high" \| "low" \| "medium" \| 1 \| 2 \| 3` | `'medium'` | Determines the shadow depth and visual hierarchy level. |
| `interactive` | `interactive` | `boolean` | `false` | When `true`, enables active hover animations, keyboard focus indicators, and click-press dynamics. |
| `glass` | `glass` | `boolean` | `false` | Enables translucent glass background styling. (See Compatibility Notes). |
| `lift` | `lift` | `boolean` | `false` | When `true`, applies the hover translation offset lift animation on the card container. |

---

## 2. Slots

*   `header`: Top title/control section. Slotted elements are hidden if empty.
*   `default` (unnamed): Core body content container.

---

## 3. Events

None.

---

## 4. Visual Variants

The component adapts its styling based on properties and active states:

### Variant A: Elevation Levels (`elevation`)
*   **Low / Level 1 (`elevation="low" \| 1`)**: Subtle shadow outline. Best used for nested panels inside sidebars.
*   **Medium / Level 2 (`elevation="medium" \| 2`)**: Standard card floating shadow depth. Default layout style for dashboards.
*   **High / Level 3 (`elevation="high" \| 3`)**: Intense shadow depth for foreground overlays, popups, and focus alerts.

### Variant B: Interactive Cards (`interactive="true"`)
*   When hovered or focused-within, the card lifts up (`translateY(-4px) scale(1.02)`) and glows with a primary border accent.
*   Enables standard focus outlines (`outline: none; focus-visible`) and triggers tactile scale down press effects (`scale(0.99)`) on click/active states.
*   Sets accessibility rules (`role="button" tabindex="0"`).

### Variant C: Lift Cards (`lift="true"`)
*   Lifts the card upwards on hover/focus-within (`translateY(-4px) scale(1.02)`) to imply depth without adding the full interactive pointer dynamics or scale down clicks.

### Variant D: Glassmorphism (`glass="true"`)
*   Applies a translucent background overlay. Under supporting browsers, backdrop filters are evaluated.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family` (e.g., system font).
*   **Header Slot Text**:
    *   Font size: `--q-font-size-lg` (e.g., `1.125rem` / `18px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `700`).
    *   Line-height: `1.4`.
*   **Body Content (Default Slot)**:
    *   Font size: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   Font weight: `--q-font-weight-normal` (e.g., `400`).
    *   Line-height: `1.5`.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-card-min-width`| `280px` | Sizing boundary constraint to prevent layout collapse. |
| `--q-card-border` | `1px solid var(--q-border-color, #374151)` | Card border contour outline. |
| `--q-radius-lg` | `12px` | Corner rounding of the card. |
| `--q-padding-lg` | `24px` | Internal content padding spacing. |
| `--q-padding-sm` | `12px` | Spacing margin between header and body. |
| `--q-bg-card` | `var(--q-bg-surface-1, #1f2937)` | Matte base background color fallback. |
| `--q-bg-glass` | `rgba(31, 41, 55, 0.85)` | Glass translucent color. |
| `--q-glass-blur` | `12px` | Backdrop blur intensity inside supporting viewports. |
| `--q-shadow-low` | `0 2px 4px rgba(0, 0, 0, 0.2)` | Shadow definition for low elevation (1). |
| `--q-shadow-medium`| `0 8px 16px rgba(0, 0, 0, 0.3)` | Shadow definition for medium elevation (2). |
| `--q-shadow-high` | `0 16px 32px rgba(0, 0, 0, 0.45)`| Shadow definition for high elevation (3). |
| `--q-card-hover-transform` | `translateY(-4px) scale(1.02)` | Lift animation translation blueprint. |
| `--q-card-transition-duration` | `250ms ease` | Speed of state transitions. |
| `--q-glow-interactive` | `0 0 20px rgba(96, 165, 250, 0.3)`| Shadow glow when hovered/focused. |
| `--q-color-primary` | `#60a5fa` | Primary border glow color. |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-card',
  styleUrl: 'q-card.css',
  shadow: true,
})
export class QCard {
  @Element() el!: HTMLElement;

  @Prop({ reflect: true }) elevation: 'low' | 'medium' | 'high' | 1 | 2 | 3 = 'medium';
  @Prop({ reflect: true }) interactive: boolean = false;
  @Prop({ reflect: true }) glass: boolean = false;
  @Prop({ reflect: true }) lift: boolean = false;

  @State() hasHeader: boolean = false;

  render() {
    return (
      <div
        class={{
          'card-container': true,
          [`elevation-${this.elevation}`]: true,
          'is-interactive': this.interactive,
          'is-glass': this.glass,
          'has-lift': this.lift,
        }}
        tabindex={this.interactive ? 0 : undefined}
        role={this.interactive ? 'button' : undefined}
        onKeyDown={this.interactive ? this.handleKeyDown : undefined}
      >
        <div
          class={{
            'card-header': true,
            'is-hidden': !this.hasHeader,
          }}
          part="header"
        >
          <slot name="header" onSlotchange={this.checkHeaderSlot} />
        </div>

        <div class="card-body" part="body">
          <slot />
        </div>
      </div>
    );
  }
}
```

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **Glassmorphism Performance/Crash Warning**: In Unreal Engine Off-Screen Rendering (OSR) modes, the browser compositor cannot retrieve the game viewport coordinates beneath the webview overlay. Therefore, setting `glass="true"` will either fail to render, display as an opaque dark block, or trigger an engine render thread crash. For Unreal webviews, keep `glass` set to `false`.
*   **Safe 2D Transitions**: The active/hover transforms (`scale` and `translateY`) are fully supported under Chromium Embedded Framework (CEF) OSR, avoiding flickering or layer clip boundaries.
*   **Focus Management**: Focus within interactive cards is captured cleanly using CSS `:focus-within` selectors.

---

## 9. Developer Guidelines & Examples

### Static Dashboard Panel
```html
<q-card elevation="low">
  <span slot="header">System Metrics</span>
  <p>CPU Usage: 42%</p>
  <p>Memory Usage: 8.4 GB / 16 GB</p>
</q-card>
```

### Interactive Action Card
```html
<q-card interactive="true" elevation="medium" id="btn-card">
  <h3 slot="header">Launch Application</h3>
  <p>Click here to start the deployment pipeline dashboard tool.</p>
</q-card>

<script>
  document.getElementById('btn-card').addEventListener('click', () => {
    alert('Launching deployment!');
  });
</script>
```

### Lift-Only Product Card
```html
<q-card lift="true" elevation="high">
  <img src="/assets/preview.jpg" alt="Preview" style="width: 100%; border-radius: 8px;" />
  <h3>Modern Workspace</h3>
  <p>Standard developer workspace workspace configuration.</p>
</q-card>
```
