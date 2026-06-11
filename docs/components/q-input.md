# 🧩 Component Specification: `q-input`

The `<q-input>` is a custom single-line text input component designed to match our design system. It supports floating header labels, leading prefix icons, trailing suffix controls (e.g. password visibility toggles), clear buttons, validation error messages, and keyboard focus routing.

---

## 1. Component API (Properties & Attributes)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `""` | The current text value inside the input field. |
| `type` | `'text' \| 'password' \| 'email' \| 'number' \| 'url' \| 'search'` | `'text'` | The HTML input type (defaults to `'text'`). |
| `placeholder` | `string` | `""` | Placeholder helper text, visible only when the input is empty. |
| `label` | `string` | `undefined` | Header label text displayed above the input field. |
| `disabled` | `boolean` | `false` | Disables user typing and applies a muted visual style. |
| `error` | `string` | `undefined` | Error feedback message. If populated, it overrides borders to red and displays helper text below the input. |
| `clearable` | `boolean` | `false` | When `true`, displays a small clear (X) icon on the right side if the input has text. |

---

## 2. Events

*   `qChange`: Emitted when the user commits text (on blur or pressing Enter).
*   `qInput`: Emitted on every keypress.

---

## 3. Slots

*   `prefix`: Renders elements (like icons, flags, or currency symbols) inside the input box on the left.
*   `suffix`: Renders elements (like verification badges or custom buttons) inside the input box on the right.

---

## 4. Visual Variants

The component adapts its styling to support six visual variants:

### Variant A: Standard Input (Text & Password types)
*   **Behavior**: A clean, single-line text container. If `type="password"`, it obscures text characters natively.
*   **Styling**: Employs `--q-input-bg` for background and `--q-input-border` for border outlines.

### Variant B: Floating / Focus State
*   **Behavior**: When focused, the input border shifts to the primary brand color, and the label highlights.
*   **Styling**: Transitions borders to `--q-input-border-focus` and highlights label color via `--q-color-primary`.

### Variant C: Validation Error State (`error="..."`)
*   **Behavior**: Highlights the border in red and renders a small error feedback line directly below the input box.
*   **Styling**: Forces border and label colors to `--q-color-danger`.

### Variant D: Clearable Action Input (`clearable="true"`)
*   **Behavior**: Automatically renders a small click-to-clear close icon on the right of the text when the field contains characters. Clicking it empties the field and refocuses the input.
*   **OSR Compatibility**: The close icon is built as a standard, styled `<button>` element inside the Shadow DOM to ensure CEF mouse clicks register instantly.

### Variant E: Slotted Content Layout (Prefix / Suffix)
*   **Behavior**: If the `prefix` or `suffix` slots are populated, the component automatically adds extra internal padding to the text area to prevent the user's typed text from overlapping the icons.
*   **Styling**: Inside the TSX code, we check if slots are active and dynamically apply padding classes (`has-prefix`, `has-suffix`).

### Variant F: Disabled State (`disabled="true"`)
*   **Behavior**: Prevents user interactions (clicks, keyboard inputs, tabs).
*   **Styling**: Drops overall opacity to `0.6` and applies a `not-allowed` cursor style.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family`.
*   **Header Label**:
    *   Font size: `--q-font-size-sm` (e.g., `0.875rem` / `14px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `600`).
    *   Color: Muted text color.
*   **Input Box Typed Text**:
    *   Font size: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   Font weight: `--q-font-weight-normal` (e.g., `400`).
    *   Line-height: `1.2` (restricted to single-line vertical alignment).
*   **Error Subtext Helper**:
    *   Font size: `--q-font-size-sm` (e.g., `0.875rem` / `14px`).
    *   Font weight: `--q-font-weight-normal` (e.g., `400`).
    *   Color: `--q-color-danger` (red).

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-input-bg` | `var(--q-bg-surface-2)` | Input text container background color. |
| `--q-input-border` | `var(--q-border)` | Standby border outline styles. |
| `--q-input-border-focus`| `1px solid var(--q-color-primary)`| Highlight border style when active. |
| `--q-input-radius` | `var(--q-radius-md)` (8px) | Corner rounding radius of the input container. |
| `--q-input-padding` | `10px 14px` | Internal vertical and horizontal text padding. |
| `--q-color-danger` | `#ef4444` | Highlight color for validation warnings. |
| `--q-transition-fast` | `150ms ease` | Timing function for border changes. |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-input',
  styleUrl: 'q-input.css',
  shadow: {
    delegatesFocus: true
  },
})
export class QInput {
  @Prop({ mutable: true }) value: string = "";
  @Prop() type: 'text' | 'password' | 'email' | 'number' | 'url' | 'search' = 'text';
  @Prop() placeholder: string = "";
  @Prop() label?: string;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) error?: string;
  @Prop() clearable: boolean = false;

  @Element() el!: HTMLElement;

  @Event() qChange: EventEmitter<string>;
  @Event() qInput: EventEmitter<string>;

  private inputEl?: HTMLInputElement;
  private static idCounter = 0;
  private inputId: string;

  componentWillLoad() {
    if (!this.inputId) {
      QInput.idCounter++;
      this.inputId = `q-input-${QInput.idCounter}`;
    }
  }

  @Method()
  async focusElement() {
    this.inputEl?.focus();
  }

  @Method()
  async clearValue() {
    this.handleClear();
  }

  private handleInput = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    this.value = target.value;
    this.qInput.emit(this.value);
  };

  private handleChange = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    this.value = target.value;
    this.qChange.emit(this.value);
  };

  private handleClear = () => {
    this.value = "";
    this.qInput.emit(this.value);
    this.qChange.emit(this.value);
    if (this.inputEl) {
      this.inputEl.focus();
    }
  };

  render() {
    const hasError = this.error !== undefined && this.error.length > 0;
    const showClearBtn = this.clearable && !this.disabled && this.value.length > 0;
    
    // Check if slots are populated to prevent empty margin boxes
    const hasPrefix = !!this.el.querySelector('[slot="prefix"]');
    const hasSuffix = !!this.el.querySelector('[slot="suffix"]') || showClearBtn;

    return (
      <div 
        class={{
          'input-wrapper': true,
          'is-disabled': this.disabled,
          'has-error': hasError
        }}
      >
        {/* Optional Header Label linked via htmlFor */}
        {this.label && (
          <label class="input-label" htmlFor={this.inputId} part="label">
            {this.label}
          </label>
        )}

        {/* Input Box Wrapper */}
        <div class="input-control" part="control">
          
          {/* Prefix Slot Container rendered conditionally */}
          {hasPrefix && (
            <span class="prefix-container" part="prefix">
              <slot name="prefix" />
            </span>
          )}

          {/* Native HTML Input */}
          <input
            ref={(el) => (this.inputEl = el as HTMLInputElement)}
            id={this.inputId}
            class={{
              'input-box': true,
              'has-prefix-padding': hasPrefix,
              'has-suffix-padding': hasSuffix
            }}
            type={this.type}
            value={this.value}
            placeholder={this.placeholder}
            disabled={this.disabled}
            onInput={this.handleInput}
            onChange={this.handleChange}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${this.inputId}-error` : undefined}
          />

          {/* Suffix / Clear Button Container rendered conditionally */}
          {hasSuffix && (
            <span class="suffix-container" part="suffix">
              {showClearBtn ? (
                <button 
                  class="clear-btn" 
                  type="button" 
                  onClick={this.handleClear}
                  aria-label="Clear input"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <slot name="suffix" />
              )}
            </span>
          )}

        </div>

        {/* Validation Helper Message */}
        {hasError && (
          <span id={`${this.inputId}-error`} class="error-msg" part="error-msg">
            {this.error}
          </span>
        )}
      </div>
    );
  }
}
```

---

## 8. Component Styling (`q-input.css`)

```css
:host {
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

/* Header Label Typography */
.input-label {
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-sm, 0.875rem);
  font-weight: var(--q-font-weight-bold, 700);
  color: var(--q-color-secondary, #9ca3af);
  margin-bottom: 6px;
  
  transition: color var(--q-transition-fast, 150ms ease);
}

/* Input Control Flex Box */
.input-control {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  background: var(--q-input-bg, var(--q-bg-surface-2, #374151));
  /* Standard static border limits size shifts on focus overlays */
  border: var(--q-input-border, var(--q-border, 1px solid var(--q-border-color, #4b5563)));
  border-radius: var(--q-input-radius, var(--q-radius-md, 8px));
  box-sizing: border-box;
  
  transition: border-color var(--q-transition-fast, 150ms ease), 
              box-shadow var(--q-transition-fast, 150ms ease);
}

/* Native Input Box */
.input-box {
  width: 100%;
  background: transparent;
  border: none;
  padding: var(--q-input-padding, 10px 14px);
  
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-base, 1rem);
  font-weight: var(--q-font-weight-normal, 400);
  color: var(--q-fg-base, #f9fafb);
  
  outline: none;
  box-sizing: border-box;
}

/* Slot & Button Positioning inside the Flex Control */
.prefix-container,
.suffix-container {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: var(--q-color-secondary, #9ca3af);
}

.prefix-container {
  padding-right: 0;
}

.suffix-container {
  padding-left: 0;
}

/* Focused State triggers color update, keeping width constant */
.input-control:focus-within {
  border-color: var(--q-color-primary, #60a5fa);
  box-shadow: 0 0 0 1px var(--q-color-primary, #60a5fa);
}

.input-wrapper:focus-within .input-label {
  color: var(--q-color-primary, #60a5fa);
}

/* Validation Error State Specificity Overrides */
.has-error .input-control {
  border-color: var(--q-color-danger, #ef4444) !important;
  box-shadow: none;
}

.has-error.input-wrapper:focus-within .input-label,
.has-error .input-label {
  color: var(--q-color-danger, #ef4444) !important;
}

.error-msg {
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-sm, 0.875rem);
  font-weight: var(--q-font-weight-normal, 400);
  color: var(--q-color-danger, #ef4444);
  margin-top: 6px;
}

/* Clear Button Sizing */
.clear-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-color-secondary, #9ca3af);
  border-radius: 50%;
  outline: none;
  transition: background var(--q-transition-fast, 150ms ease), color var(--q-transition-fast, 150ms ease);
}

.clear-btn:hover {
  background: var(--q-btn-hover-overlay, color-mix(in srgb, var(--q-fg-base, #f9fafb) 8%, transparent));
  color: var(--q-fg-base, #f9fafb);
}

.clear-btn svg {
  width: 14px;
  height: 14px;
}

/* Disabled State Visual Styling */
.is-disabled {
  opacity: 0.6;
}
.is-disabled .input-control {
  cursor: not-allowed;
  pointer-events: none;
}
```
