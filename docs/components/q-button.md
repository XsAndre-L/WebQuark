# 🧩 Component Specification: `q-button`

The `<q-button>` is a highly customizable interactive button element. It encapsulates focus, hover, active-press transitions, and layout presets inside its Shadow DOM. Depending on its properties, it dynamically compiles to either a native `<button>` or a semantic HTML `<a>` anchor link.

---

## 1. Component API (Properties & Attributes)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'ghost' \| 'text'` | `'primary'` | The visual category/theme style of the button. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height and padding layout scale. |
| `disabled` | `boolean` | `false` | Disables user interactions and applies a grayed out visual state. |
| `loading` | `boolean` | `false` | Disables button and overlays a rotating loading spinner while hiding standard text. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Standard HTML form button behavior (only used if `href` is not set). |
| `expand` | `boolean` | `false` | When `true`, spans 100% width of its parent layout container (block display). |
| `href` | `string` | `undefined` | Target URL link. If supplied, the component renders as an `<a>` anchor tag. |
| `target` | `string` | `undefined` | Link target scope (e.g., `'_blank'`). Only used with `href`. |
| `download` | `string` | `undefined` | Triggers a file download. Only used with `href`. |

---

## 2. Slots

*   `icon-left`: Prefix slot for adding SVGs or inline icons before the button label.
*   `icon-right`: Suffix slot for adding SVGs or inline icons after the button label.
*   `default` (unnamed): Button text label content.

---

## 3. Visual Variants

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

### Variant D: Loading State (`loading="true"`)
*   Replaces the button's inner contents (text and slots) with a centered SVG loading spinner.
*   Locks the button's exact width to prevent shifting layouts on loading trigger.

---

## 4. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family`.
*   **Font Weight**: `--q-btn-font-weight` (defaults to `--q-font-weight-bold`, e.g., `600`).
*   **Font Sizes**:
    *   `size="sm"`: `--q-font-size-sm` (e.g., `0.875rem` / `14px`).
    *   `size="md"`: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   `size="lg"`: `--q-font-size-lg` (e.g., `1.125rem` / `18px`).
*   **Case Style**: Typically left to default casing but styled with centered alignment.

---

## 5. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-btn-radius` | `var(--q-radius-md)` (8px) | Corner rounding of the button. |
| `--q-btn-font-weight` | `var(--q-font-weight-bold)` (600) | Label text weight. |
| `--q-btn-font-size` | `var(--q-font-size-base)` (1rem) | Default label text size. |
| `--q-btn-transition` | `all 150ms ease` | Timing function for hover and active state changes. |
| `--q-btn-active-transform` | `scale(0.97)` | Tactile compress scale when clicked. |
| `--q-btn-padding-sm` | `6px 12px` | Horizontal and vertical padding for small size. |
| `--q-btn-padding-md` | `10px 20px` | Horizontal and vertical padding for medium size. |
| `--q-btn-padding-lg` | `14px 28px` | Horizontal and vertical padding for large size. |
| `--q-color-primary` | `#60a5fa` | Primary background color. |
| `--q-color-primary-hover`| `#93c5fd` | Primary hover background color. |
| `--q-border` | `1px solid var(--q-border-color)`| Border style for ghost variant. |
| `--q-focus-ring` | `2px solid var(--q-color-primary)`| Keyboard navigation focus indicator. |

---

## 6. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-button',
  styleUrl: 'q-button.css',
  shadow: {
    delegatesFocus: true // ◄ Auto forwards focus to internal button/anchor
  },
})
export class QButton {
  @Prop() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'text' = 'primary';
  @Prop() size: 'sm' | 'md' | 'lg' = 'md';
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) loading: boolean = false;
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';
  @Prop({ reflect: true }) expand: boolean = false;
  @Prop() href?: string;
  @Prop() target?: string;
  @Prop() download?: string;

  private handleClick = (e: MouseEvent) => {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  render() {
    const isLink = this.href !== undefined;
    const isBtnDisabled = this.disabled || this.loading;
    
    const classes = {
      'btn': true,
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      'is-loading': this.loading,
      'is-disabled': isBtnDisabled,
      'is-expanded': this.expand
    };

    const innerContent = [
      this.loading && <div class="btn-spinner" part="spinner" />,
      <span class="btn-content-wrap" style={{ visibility: this.loading ? 'hidden' : 'visible' }}>
        <slot name="icon-left" />
        <span class="btn-label"><slot /></span>
        <slot name="icon-right" />
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

## 7. Component Styling (`q-button.css`)

```css
:host {
  display: inline-block;
  box-sizing: border-box;
}

:host([expand]) {
  display: block;
  width: 100%;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  text-decoration: none;
  border-radius: var(--q-btn-radius, var(--q-radius-md, 8px));
  font-family: var(--q-font-family, inherit);
  font-weight: var(--q-btn-font-weight, var(--q-font-weight-bold, 600));
  border: 1px solid transparent;
  box-sizing: border-box;
  outline: none;
  cursor: pointer;
  
  transition: var(--q-btn-transition, all 150ms cubic-bezier(0.4, 0, 0.2, 1));
}

.btn.is-expanded {
  width: 100%;
}

/* Sizing Layouts */
.size-sm {
  padding: var(--q-btn-padding-sm, 6px 12px);
  font-size: var(--q-font-size-sm, 0.875rem);
}
.size-md {
  padding: var(--q-btn-padding-md, 10px 20px);
  font-size: var(--q-btn-font-size, var(--q-font-size-base, 1rem));
}
.size-lg {
  padding: var(--q-btn-padding-lg, 14px 28px);
  font-size: var(--q-font-size-lg, 1.125rem);
}

/* Theme Variants */
/* Primary */
.variant-primary {
  background: var(--q-color-primary, #60a5fa);
  color: var(--q-bg-base, #111827);
}
.variant-primary:hover:not(.is-disabled) {
  background: var(--q-color-primary-hover, #93c5fd);
}

/* Secondary */
.variant-secondary {
  background: var(--q-color-secondary, #4b5563);
  color: var(--q-fg-base, #f9fafb);
}
.variant-secondary:hover:not(.is-disabled) {
  opacity: 0.9;
}

/* Ghost */
.variant-ghost {
  background: transparent;
  border: var(--q-border, 1px solid var(--q-border-color, #374151));
  color: var(--q-fg-base, #f9fafb);
}
.variant-ghost:hover:not(.is-disabled) {
  /* Use color-mix with foreground base so color adjusts to light/dark themes */
  background: var(--q-btn-hover-overlay, color-mix(in srgb, var(--q-fg-base, #f9fafb) 8%, transparent));
  border-color: var(--q-color-primary, #60a5fa);
  color: var(--q-color-primary, #60a5fa);
}

/* Text */
.variant-text {
  background: transparent;
  color: var(--q-fg-base, #f9fafb);
}
.variant-text:hover:not(.is-disabled) {
  color: var(--q-color-primary, #60a5fa);
  background: var(--q-btn-hover-overlay, color-mix(in srgb, var(--q-fg-base, #f9fafb) 5%, transparent));
}

/* Tactile Active Press (Unreal safe) */
.btn:active:not(.is-disabled) {
  transform: var(--q-btn-active-transform, scale(0.97));
}

/* Keyboard Focus Indicators */
.btn:focus-visible {
  outline: var(--q-focus-ring, 2px solid var(--q-color-primary, #60a5fa));
  outline-offset: 2px;
}

/* Disabled State */
.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Spinner Styles */
.btn-spinner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}

.btn-content-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@keyframes btn-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```
