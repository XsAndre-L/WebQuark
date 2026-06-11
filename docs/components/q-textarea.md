# 🧩 Component Specification: `q-textarea`

The `<q-textarea>` is a custom multi-line text input field designed to match our design system. It handles floating/static header labels, semantic validation error states, keyboard focus, and optional automatic height growth (auto-grow) as the user types.

---

## 1. Component API (Properties & Attributes)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `""` | The current text value inside the text area. |
| `placeholder` | `string` | `""` | Helper placeholder text displayed when the field is empty. |
| `label` | `string` | `undefined` | The header label text displayed above the text area. |
| `rows` | `number` | `3` | The initial visible height, measured in text rows. |
| `autoGrow` | `boolean` | `true` | Automatically expands the text area height to fit input text dynamically. |
| `disabled` | `boolean` | `false` | Disables text entry and applies a grayed-out layout. |
| `error` | `string` | `undefined` | Error feedback message. If populated, it overrides the border to red and displays helper text below the textarea. |

---

## 2. Events

*   `qChange`: Emitted when the user commits text changes (on blur or Enter).
*   `qInput`: Emitted on every single keystroke.

---

## 3. Visual Variants

The component dynamically adjusts its layout to support five visual states:

### Variant A: Default (Standby)
*   **Behavior**: Displays the textarea container with standard matte styling and subtle boundaries.
*   **Styling**: Uses `--q-input-bg` for background and `--q-input-border` for outlines.

### Variant B: Active Focus State
*   **Behavior**: When a user clicks or tabs into the textarea, the border transforms.
*   **Styling**: Smoothly transitions the border style to `--q-input-border-focus` (using the primary brand color) and scales shadow elevation.

### Variant C: Validation Error State (`error="..."`)
*   **Behavior**: Overrides standby styles with warning highlights and displays a small helper message block directly below the field.
*   **Styling**: Forces border color to `--q-color-danger` (red) and renders the subtext in the same color.

### Variant D: Disabled State (`disabled="true"`)
*   **Behavior**: Prevents user clicks, typing, and tab-focus.
*   **Styling**: Decreases opacity to `0.6` and applies a `not-allowed` mouse cursor.

### Variant E: Auto-Grow Height (`autoGrow="true"`)
*   **Behavior**: Expands vertically as typing wraps lines, avoiding vertical scrollbars inside the component.
*   **OSR Safe Implementation**: Utilizes a lightweight Javascript event handler on the `input` event that sets `height = 'auto'` and then applies `height = scrollHeight + 'px'`. This avoids heavy ResizeObservers which can lag CEF thread passes.

---

## 4. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family`.
*   **Header Label**:
    *   Font size: `--q-font-size-sm` (e.g., `0.875rem` / `14px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `600`).
    *   Color: Muted text color.
*   **TextArea Input Value**:
    *   Font size: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   Font weight: `--q-font-weight-normal` (e.g., `400`).
    *   Line-height: `1.5`.
*   **Error Helper Text**:
    *   Font size: `--q-font-size-sm` (e.g., `0.875rem` / `14px`).
    *   Font weight: `--q-font-weight-normal` (e.g., `400`).
    *   Color: `--q-color-danger` (red).

---

## 5. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-input-bg` | `var(--q-bg-surface-2)` | Main text box background color. |
| `--q-input-border` | `var(--q-border)` | Standby border outline details. |
| `--q-input-border-focus`| `1px solid var(--q-color-primary)`| Highlight border style when active. |
| `--q-input-radius` | `var(--q-radius-md)` (8px) | Corner rounding of the text area box. |
| `--q-input-padding` | `10px 14px` | Internal text padding margins. |
| `--q-color-danger` | `#ef4444` | Highlight color for error states. |
| `--q-transition-fast` | `150ms ease` | Border transition speed. |
| `--q-font-family` | `system-ui, sans-serif` | Core font typography family. |

---

## 6. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-textarea',
  styleUrl: 'q-textarea.css',
  shadow: {
    delegatesFocus: true
  },
})
export class QTextarea {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) value: string = "";
  @Prop() placeholder: string = "";
  @Prop() label?: string;
  @Prop() rows: number = 3;
  @Prop() autoGrow: boolean = true;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) error?: string;

  @Event() qChange: EventEmitter<string>;
  @Event() qInput: EventEmitter<string>;

  private textareaEl?: HTMLTextAreaElement;
  private static idCounter = 0;
  private inputId: string;

  componentWillLoad() {
    if (!this.inputId) {
      QTextarea.idCounter++;
      this.inputId = `q-textarea-${QTextarea.idCounter}`;
    }
    this.adjustHeightInternal();
  }

  @Method()
  async focusElement() {
    this.textareaEl?.focus();
  }

  @Method()
  async adjustHeight() {
    this.adjustHeightInternal();
  }

  private handleInput = (ev: Event) => {
    const target = ev.target as HTMLTextAreaElement;
    this.value = target.value;
    this.qInput.emit(this.value);
    this.adjustHeightInternal();
  };

  private handleChange = (ev: Event) => {
    const target = ev.target as HTMLTextAreaElement;
    this.value = target.value;
    this.qChange.emit(this.value);
  };

  private adjustHeightInternal() {
    if (!this.autoGrow || !this.textareaEl) return;
    
    // OSR Safe calculation: reset height to recalculate scrollHeight
    this.textareaEl.style.height = 'auto';
    
    const scrollHeight = this.textareaEl.scrollHeight;
    if (scrollHeight > 0) {
      this.textareaEl.style.height = `${scrollHeight}px`;
    } else {
      // Fallback if textarea is initialized inside a hidden container (zero-height bug)
      this.textareaEl.style.height = '';
    }
  }

  render() {
    const hasError = this.error !== undefined && this.error.length > 0;
    
    return (
      <div 
        class={{
          'textarea-wrapper': true,
          'is-disabled': this.disabled,
          'has-error': hasError
        }}
      >
        {/* Optional Header Label linked via htmlFor */}
        {this.label && (
          <label class="textarea-label" htmlFor={this.inputId} part="label">
            {this.label}
          </label>
        )}
        
        {/* Core Textarea Box */}
        <textarea
          ref={(el) => (this.textareaEl = el as HTMLTextAreaElement)}
          id={this.inputId}
          class="textarea-box"
          part="textarea"
          value={this.value}
          placeholder={this.placeholder}
          rows={this.rows}
          disabled={this.disabled}
          onInput={this.handleInput}
          onChange={this.handleChange}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${this.inputId}-error` : undefined}
        />
        
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

## 7. Component Styling (`q-textarea.css`)

```css
:host {
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.textarea-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

/* Header Label Typography */
.textarea-label {
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-sm, 0.875rem);
  font-weight: var(--q-font-weight-bold, 700);
  color: var(--q-color-secondary, #9ca3af);
  margin-bottom: 6px;
  
  transition: color var(--q-transition-fast, 150ms ease);
}

/* Core Input Area */
.textarea-box {
  width: 100%;
  box-sizing: border-box;
  background: var(--q-input-bg, var(--q-bg-surface-2, #374151));
  border: var(--q-input-border, var(--q-border, 1px solid var(--q-border-color, #4b5563)));
  border-radius: var(--q-input-radius, var(--q-radius-md, 8px));
  padding: var(--q-input-padding, 10px 14px);
  
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-base, 1rem);
  font-weight: var(--q-font-weight-normal, 400);
  line-height: 1.5;
  color: var(--q-fg-base, #f9fafb);
  
  resize: none; /* Disables manual sizing grab handle */
  outline: none;
  transition: border-color var(--q-transition-fast, 150ms ease), 
              box-shadow var(--q-transition-fast, 150ms ease);
}

/* Focused State maps color only to prevent border jumps */
.textarea-box:focus {
  border-color: var(--q-color-primary, #60a5fa);
  box-shadow: 0 0 0 1px var(--q-color-primary, #60a5fa);
}

.textarea-wrapper:focus-within .textarea-label {
  color: var(--q-color-primary, #60a5fa);
}

/* Validation Error State Overrides */
.has-error .textarea-box {
  border-color: var(--q-color-danger, #ef4444) !important;
  box-shadow: none;
}

.has-error.textarea-wrapper:focus-within .textarea-label,
.has-error .textarea-label {
  color: var(--q-color-danger, #ef4444) !important;
}

/* Error message text below textarea */
.error-msg {
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-sm, 0.875rem);
  font-weight: var(--q-font-weight-normal, 400);
  color: var(--q-color-danger, #ef4444);
  margin-top: 6px;
}

/* Disabled State Visual styling */
.is-disabled {
  opacity: 0.6;
}
.is-disabled .textarea-box {
  cursor: not-allowed;
  pointer-events: none;
}
```
