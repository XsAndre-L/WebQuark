# 🧩 Component Specification: `q-dialog`

The `<q-dialog>` is a customizable modal dialog component. It handles overlays, keyboard tab trapping, focus management, confirmation states, and responsive entry animations. To ensure compatibility with Unreal Engine's Webview plugins, it avoids native `<dialog>` constructs in favor of robust custom Shadow DOM containers.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `open` | `open` | `boolean` | `false` | Controls the open/close state of the dialog (reflected, mutable). |
| `dialogTitle` | `dialog-title` | `string` | `undefined` | Header title string displayed in the default header slot. |
| `message` | `message` | `string` | `undefined` | Body message string displayed in the default body slot. |
| `closeOnEsc` | `close-on-esc` | `boolean` | `true` | When `true`, pressing the `Escape` key automatically cancels and closes the dialog. |
| `closeOnOverlayClick`| `close-on-overlay-click` | `boolean` | `true` | When `true`, clicking the backdrop overlay cancels and closes the dialog. |
| `backdropEffect` | `backdrop-effect` | `'blur' \| 'solid' \| 'none'` | `'blur'` | Controls the backdrop rendering mode. Use `solid` for Unreal/CEF-safe overlays. |
| `loading` | `loading` | `boolean` | `false` | When `true`, disables buttons and overlays a loading spinner on the confirm button. |
| `confirmLabel` | `confirm-label` | `string` | `'Confirm'` | Text label for the confirmation button. |
| `cancelLabel` | `cancel-label` | `string` | `'Cancel'` | Text label for the cancellation button. |
| `showCancel` | `show-cancel` | `boolean` | `true` | When `false`, hides the cancellation button in the default footer. |
| `showConfirm` | `show-confirm` | `boolean` | `true` | When `false`, hides the confirmation button in the default footer. |

### Methods

*   `show() => Promise<void>`: Programmatically opens the dialog.
*   `close() => Promise<void>`: Programmatically closes the dialog.
*   `confirm() => Promise<void>`: Programmatically triggers the confirmation action.
*   `cancel() => Promise<void>`: Programmatically triggers the cancellation action.

---

## 2. Slots

*   `header`: Custom header layout (hides the default close button and title if populated).
*   `default` (unnamed): Core body content slot. If empty, falls back to rendering the `message` property.
*   `footer`: Custom action actions layout (hides default Cancel/Confirm buttons if populated).

---

## 3. Events

*   `qConfirm`: Emitted when the user commits the dialog action (clicks Confirm).
*   `qCancel`: Emitted when the user rejects the dialog action (clicks Cancel, backdrop, or presses Esc).
*   `qClose`: Emitted immediately after the dialog has closed.

---

## 4. Visual Variants

The dialog transitions between visual configurations:

### Variant A: Transition States (`open`)
*   **Closed State**: The wrapper is set to `visibility: hidden` and `pointer-events: none`. The backdrop has `opacity: 0` and the modal content box rests scaled down and shifted (`transform: scale(0.92) translateY(16px)`).
*   **Open State**: Wrapper transitions to `visibility: visible` and `pointer-events: auto`. The backdrop fades to full opacity and the modal box translates smoothly to `transform: scale(1) translateY(0)`.

### Variant B: Confirm Loading State (`loading="true"`)
*   Temporarily disables click triggers on Cancel, Confirm, and Close buttons.
*   Converts the Confirm button label into a rotating SVG spinner (`.spinner-el`) and locks the focus trap.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family` (e.g., system font).
*   **Title (`.dialog-title`)**:
    *   Font size: `--q-font-size-lg` (e.g., `1.1rem` / `18px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `600`).
    *   Color: `--q-fg-base` (defaults to `#f9fafb`).
*   **Message (`.dialog-message` / `.dialog-body`)**:
    *   Font size: `--q-font-size-base` (e.g., `0.9rem` / `14px`).
    *   Color: `--q-fg-base` (defaults to `#f9fafb`).
    *   Line-height: `1.5`.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-bg-overlay` | `rgba(0, 0, 0, 0.85)` | Backdrop mask background color. |
| `--q-glass-blur` | `12px` | Backdrop blur filter strength (See Compatibility warnings). |
| `--q-bg-surface-1` | `#1f2937` | Background color for header, footer, and close button hover. |
| `--q-bg-base` | `#111827` | Background color for default body content. |
| `--q-border` | `1px solid var(--q-border-color, #374151)` | Outline border style for modal panels. |
| `--q-border-color` | `#374151` | Default border line color. |
| `--q-radius-lg` | `11px` | Corner rounding of the modal dialog box. |
| `--q-radius-md` | `7px` | Corner rounding of Cancel/Confirm action buttons. |
| `--q-radius-sm` | `4px` | Corner rounding of the close button. |
| `--q-shadow-high` | `0 16px 32px rgba(0, 0, 0, 0.45)` | Depth shadow under the modal container. |
| `--q-color-primary` | `#60a5fa` | Main branding color (Confirm button fill, Close button border). |
| `--q-color-primary-hover`| `#93c5fd` | Hover background fill of confirm button. |
| `--q-padding-lg` | `16px` | Vertical/horizontal padding inside header, body, and footer panels. |
| `--q-transition-normal` | `250ms cubic-bezier(0.4, 0, 0.2, 1)`| Speed of backdrop fade and scale transformations. |
| `--q-transition-fast` | `150ms ease` | Speed of hover and button state changes. |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-dialog',
  styleUrl: 'q-dialog.css',
  shadow: true,
})
export class QDialog {
  @Element() el!: HTMLElement;

  @Prop({ reflect: true, mutable: true }) open: boolean = false;
  @Prop() dialogTitle?: string;
  @Prop() message?: string;
  @Prop() closeOnEsc: boolean = true;
  @Prop() closeOnOverlayClick: boolean = true;
  @Prop() loading: boolean = false;
  @Prop() confirmLabel: string = 'Confirm';
  @Prop() cancelLabel: string = 'Cancel';
  @Prop() showCancel: boolean = true;
  @Prop() showConfirm: boolean = true;

  @Event() qConfirm!: EventEmitter<void>;
  @Event() qCancel!: EventEmitter<void>;
  @Event() qClose!: EventEmitter<void>;

  @State() isVisible: boolean = false;
  @State() isAnimatedOpen: boolean = false;

  render() {
    const classes = {
      'dialog-wrapper': true,
      'is-open': this.isAnimatedOpen,
      'is-visible': this.isVisible,
    };

    return (
      <div class={classes} onKeyDown={this.handleKeyDown} inert={!this.open ? true : undefined}>
        {/* Backdrop Mask */}
        <div class="dialog-backdrop" onClick={this.handleBackdropClick} part="backdrop" />

        {/* Modal Box */}
        <div 
          ref={el => (this.dialogEl = el)}
          class="dialog-modal" 
          part="modal" 
          role="dialog" 
          aria-modal="true" 
          aria-hidden={this.open ? 'false' : 'true'}
          tabindex="-1"
        >
          {/* Header */}
          <header class="dialog-header" part="header">
            <slot name="header">
              {this.dialogTitle && <h2 class="dialog-title">{this.dialogTitle}</h2>}
            </slot>
            <button class="dialog-close-btn" onClick={this.handleCloseButton} aria-label="Close dialog" disabled={this.loading} part="close-btn">
              <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          {/* Body */}
          <div class="dialog-body" part="body">
            <slot>
              {this.message && <p class="dialog-message">{this.message}</p>}
            </slot>
          </div>

          {/* Footer */}
          <footer class="dialog-footer" part="footer">
            <slot name="footer">
              <div class="dialog-actions">
                {this.showCancel && (
                  <button class="btn-cancel" onClick={this.handleCancel} disabled={this.loading} part="cancel-btn">
                    {this.cancelLabel}
                  </button>
                )}
                {this.showConfirm && (
                  <button class="btn-confirm" onClick={this.handleConfirm} disabled={this.loading} aria-busy={this.loading ? 'true' : 'false'} part="confirm-btn">
                    {this.loading && <span class="spinner-el" />}
                    <span class="btn-label">{this.confirmLabel}</span>
                  </button>
                )}
              </div>
            </slot>
          </footer>
        </div>
      </div>
    );
  }
}
```

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **No Native `<dialog>` Element**: Standard HTML `<dialog>` elements suffer from centering overlays, bounds calculations, and click handling glitches in OSR, frequently causing rendering lockups or black screens. `<q-dialog>` constructs a custom Shadow DOM overlay with standard absolute `div` layers.
*   **Backdrop Effect Control**: `backdrop-effect="blur"` is the default for standard browser UI. In Unreal/CEF Off-Screen Rendering, use `backdrop-effect="solid"` so the overlay uses a high-opacity color without `backdrop-filter`. `backdrop-effect="none"` keeps the invisible click layer but removes visual dimming.
*   **WAI-ARIA Focus Loop Bridge**: Employs built-in tab trapping that handles focus restrictions inside the active modal container. This ensures key inputs correct register on CEF interfaces without keyboard bridge focus failures.

---

## 9. Developer Guidelines & Examples

### Standard Alert Modal
```html
<q-dialog 
  id="alert-dialog" 
  dialog-title="Warning Alert" 
  message="Are you sure you want to discard your unsaved work?"
  confirm-label="Discard"
></q-dialog>

<q-button id="trigger-btn">Discard Changes</q-button>

<script>
  const dialog = document.getElementById('alert-dialog');

  document.getElementById('trigger-btn').addEventListener('click', () => {
    dialog.open = true;
  });

  dialog.addEventListener('qConfirm', () => {
    console.log('User discarded modifications!');
  });
</script>
```

### Unreal/CEF Safe Modal
```html
<q-dialog
  backdrop-effect="solid"
  dialog-title="Confirm Action"
  message="This modal uses a solid overlay instead of backdrop blur."
></q-dialog>
```
### Async Confirm Action Modal (Loader Integration)
```html
<q-dialog 
  id="async-dialog" 
  dialog-title="Execute Update" 
  message="Download updates for components."
></q-dialog>

<script>
  const dialog = document.getElementById('async-dialog');
  dialog.addEventListener('qConfirm', async (e) => {
    dialog.loading = true;
    
    // Simulate server commit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    dialog.loading = false;
    dialog.open = false; // programmatically close after done
  });
</script>
```

