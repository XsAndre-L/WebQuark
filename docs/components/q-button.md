# 🧩 Component Specification: `q-button`

The `<q-button>` is a highly customizable interactive button element. It encapsulates focus, hover, active-press transitions, and layout presets inside its Shadow DOM. Depending on its properties, it dynamically compiles to either a native `<button>` or a semantic HTML `<a>` anchor link.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `variant` | `variant` | `"danger" \| "ghost" \| "primary" \| "secondary" \| "success" \| "text"` | `'primary'` | The visual category/theme style of the button. |
| `size` | `size` | `"lg" \| "md" \| "sm"` | `'md'` | Height and padding layout scale. |
| `disabled` | `disabled` | `boolean` | `false` | Disables user interactions and applies a grayed out visual state. |
| `loading` | `loading` | `boolean` | `false` | Disables button and overlays a rotating loading spinner while hiding standard text. |
| `type` | `type` | `"button" \| "reset" \| "submit"` | `'button'` | Standard HTML form button behavior (only used if `href` is not set). |
| `expand` | `expand` | `boolean` | `false` | When `true`, spans 100% width of its parent layout container (block display). |
| `href` | `href` | `string` | `undefined` | Target URL link. If supplied, the component renders as an `<a>` anchor tag. |
| `target` | `target` | `string` | `undefined` | Link target scope (e.g., `'_blank'`). Only used with `href`. |
| `download` | `download` | `string` | `undefined` | Triggers a file download. Only used with `href`. |
| `iconOnly` | `icon-only` | `boolean` | `undefined` | Forces the button to use icon-only padding and sizing overrides. If undefined, it auto-detects based on slotted children. |

---

## 2. Slots

*   `icon-left`: Prefix slot for adding SVGs or inline icons before the button label.
*   `icon-right`: Suffix slot for adding SVGs or inline icons after the button label.
*   `default` (unnamed): Button text label content.

---

## 3. Events

*   `qClick`: Emitted when the button is clicked. The event payload is the standard `MouseEvent`.

---

## 4. Visual Variants

The component supports a variety of visual variants that map directly to the global design tokens:

### Variant A: Type Rendering (Semantic Element Swapping)
*   **Action Button (`href="undefined"`)**: Compiles to `<button type="...">` to ensure full HTML form integration.
*   **Navigation Link (`href="..."`)**: Compiles to `<a href="..." target="..." download="...">` to preserve native anchor capabilities, search-engine indexing, and routing.

### Variant B: Visual Themes (`variant`)
*   **Primary**: High-end electric blue canvas (`--q-color-primary`) with glowing hover states.
*   **Secondary**: Matte slate surface (`--q-color-secondary`).
*   **Success / Danger**: Standard status colors (`--q-color-success` / `--q-color-danger`) for positive commits or destructive deletes.
*   **Ghost**: Transparent background with a border (`--q-border`). Glows and fills on hover.
*   **Text**: Completely transparent border and background. Only changes text color on hover.

### Variant C: Sizing Layouts (`size`)
*   **Small (`size="sm"`)**: Compact padding (`--q-btn-padding-sm`), small typography (`--q-font-size-sm`).
*   **Medium (`size="md"`)**: Default padding (`--q-btn-padding-md`), standard typography (`--q-font-size-base`).
*   **Large (`size="lg"`)**: Generous padding (`--q-btn-padding-lg`), large typography (`--q-font-size-lg`).

### Variant D: Icon-Only State (`icon-only="true"`)
*   Removes labels and applies uniform padding (`--q-btn-icon-padding-sm/md/lg`) for circular/square action icons.

### Variant E: Loading State (`loading="true"`)
*   Replaces the button's inner contents (text and slots) with a centered SVG loading spinner (`.btn-spinner`).
*   Locks the button's exact width to prevent shifting layouts on loading trigger.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family` (e.g., system font).
*   **Font Weight**: `--q-btn-font-weight` (defaults to `--q-font-weight-bold`, e.g., `600`).
*   **Font Sizes**:
    *   `size="sm"`: `--q-font-size-sm` (e.g., `0.7rem`).
    *   `size="md"`: `--q-font-size-base` (e.g., `0.9rem`).
    *   `size="lg"`: `--q-font-size-lg` (e.g., `1rem`).
*   **Line Height**: Centered and set to `1.2`.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-btn-radius` | `var(--q-radius-md, 8px)` | Corner rounding of the button. |
| `--q-btn-radius-sm` | `var(--q-radius-sm, 4px)` | Corner rounding of the button (small size). |
| `--q-btn-radius-md` | `var(--q-radius-md, 8px)` | Corner rounding of the button (medium size). |
| `--q-btn-radius-lg` | `var(--q-radius-lg, 12px)` | Corner rounding of the button (large size). |
| `--q-btn-font-weight` | `var(--q-font-weight-bold, 600)` | Label text weight. |
| `--q-btn-font-size` | `var(--q-font-size-base, 0.9rem)` | Default label text size. |
| `--q-btn-transition` | `all 150ms cubic-bezier(0.4, 0, 0.2, 1)` | Timing function for hover and active state changes. |
| `--q-btn-active-transform` | `scale(0.97)` | Tactile compress scale when clicked. |
| `--q-btn-padding-sm` | `6px 10px` | Horizontal and vertical padding for small size. |
| `--q-btn-padding-md` | `4px 6px` | Horizontal and vertical padding for medium size. |
| `--q-btn-padding-lg` | `8px 12px` | Horizontal and vertical padding for large size. |
| `--q-btn-icon-padding-sm` | `4px` | Padding for small icon-only buttons. |
| `--q-btn-icon-padding-md` | `6px` | Padding for medium icon-only buttons. |
| `--q-btn-icon-padding-lg` | `9px` | Padding for large icon-only buttons. |
| `--q-color-primary` | `#60a5fa` | Primary background color. |
| `--q-color-primary-hover`| `#93c5fd` | Primary hover background color. |
| `--q-color-secondary` | `#4b5563` | Secondary background color. |
| `--q-color-success` | `#34d399` | Success background color. |
| `--q-color-danger` | `#f87171` | Danger background color. |
| `--q-border` | `1px solid var(--q-border-color, #374151)`| Border style for ghost variant. |
| `--q-focus-ring` | `2px solid var(--q-color-primary, #60a5fa)`| Keyboard navigation focus indicator. |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-button',
  styleUrl: 'q-button.css',
  shadow: {
    delegatesFocus: true
  },
})
export class QButton {
  @Element() el!: HTMLElement;

  @Prop() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'text' = 'primary';
  @Prop() size: 'sm' | 'md' | 'lg' = 'md';
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) loading: boolean = false;
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';
  @Prop({ reflect: true }) expand: boolean = false;
  @Prop() href?: string;
  @Prop() target?: string;
  @Prop() download?: string;
  @Prop({ reflect: true }) iconOnly?: boolean;

  @State() autoIconOnly: boolean = false;
  @State() hasDefaultContent: boolean = false;

  @Event() qClick!: EventEmitter<MouseEvent>;

  render() {
    const isLink = this.href !== undefined && this.href !== null && this.href.trim() !== "";
    const isBtnDisabled = this.disabled || this.loading;
    const isIcon = this.iconOnly !== undefined ? this.iconOnly : this.autoIconOnly;
    
    const classes = {
      'btn': true,
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      'is-loading': this.loading,
      'is-disabled': isBtnDisabled,
      'is-expanded': this.expand,
      'is-icon-only': isIcon
    };

    const innerContent = [
      this.loading && <div class="btn-spinner" part="spinner" />,
      <span class="btn-content-wrap" style={{ visibility: this.loading ? 'hidden' : 'visible' }}>
        <slot name="icon-left" onSlotchange={this.handleSlotChange} />
        {this.hasDefaultContent && (
          <span class="btn-label"><slot onSlotchange={this.handleSlotChange} /></span>
        )}
        <slot name="icon-right" onSlotchange={this.handleSlotChange} />
      </span>
    ];

    if (isLink) {
      return (
        <a
          class={classes}
          href={this.href}
          target={this.target}
          download={this.download}
          tabindex={isBtnDisabled ? -1 : undefined}
          aria-disabled={isBtnDisabled ? 'true' : 'false'}
          onClick={this.handleClick}
        >
          {innerContent}
        </a>
      );
    }

    return (
      <button
        class={classes}
        type={this.type}
        disabled={isBtnDisabled}
        aria-busy={this.loading ? 'true' : 'false'}
        onClick={this.handleClick}
      >
        {innerContent}
      </button>
    );
  }
}
```

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **No Backdrop Filters**: The component is entirely free from `backdrop-filter` or `mix-blend-mode` dependencies, preventing black box rendering glitches or WebUI/CEF engine crashes.
*   **Tactile 2D Animations**: Focus, hover, and press transforms utilize standard 2D operations (`transform: scale(0.97)`), which are safe and performant in Off-Screen Rendering (OSR) modes.
*   **Focus Delegation**: Utilizes Stencil's `delegatesFocus: true` inside the Shadow DOM options. This ensures that keyboard and mouse focus correctly bypasses the shadow host and binds to the underlying native `<button>` or `<a>` tag, avoiding focus bridge failure inside CEF.
*   **Loading Spinner**: The loader spinner `.btn-spinner` is styled using CSS Keyframe 2D transforms (`@keyframes btn-spin { transform: rotate(360deg); }`), which does not cause frame-rate drops.

---

## 9. Developer Guidelines & Examples

### Standard Action Button
```html
<q-button variant="primary" size="md">Save Changes</q-button>
```

### Button with Left Icon
```html
<q-button variant="secondary" size="md">
  <span slot="icon-left">💾</span>
  Save
</q-button>
```

### Navigation Link Button
```html
<q-button variant="ghost" href="https://example.com" target="_blank">
  Visit Website
</q-button>
```

### Loading State and Event Handling
```html
<q-button id="my-button" variant="success">Submit</q-button>

<script>
  const btn = document.getElementById('my-button');
  btn.addEventListener('qClick', (e) => {
    btn.loading = true;
    setTimeout(() => {
      btn.loading = false;
    }, 2000);
  });
</script>
```
