# 🧩 Component Specification: `q-toggle`

The `<q-toggle>` is a stateful interactive toggle control that renders either as a custom sliding switch track or a validation check box. It supports text label slotting, custom checkmark icons, validation error messages, and form association. It is built to optimize rendering in offscreen environments.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `checked` | `checked` | `boolean` | `false` | Mutable and reflected. Represents the active toggle checked state. |
| `size` | `size` | `"lg" \| "md" \| "sm"` | `'md'` | Layout size variant of the toggle element. |
| `type` | `type` | `"checkbox" \| "switch"` | `'switch'` | Control template type. Renders either as switch track or check box. |
| `label` | `label` | `string` | `undefined` | Simple text label displayed next to the toggle control. |
| `disabled` | `disabled` | `boolean` | `false` | Reflects disabled state. Locks interactions and lowers opacity. |
| `required` | `required` | `boolean` | `false` | Reflects required validation constraint state. |
| `error` | `error` | `string` | `undefined` | Custom validation error string. Overrides normal border styles to red theme warning colors. |

---

## 2. Slots

*   **Default Slot**: Slots content (e.g. text elements) inside the toggle label container. If present, it overrides the `label` property.
*   `checked-icon`: Slots custom icons inside the checkbox box when `checked` is true.
*   `unchecked-icon`: Slots custom icons inside the checkbox box when `checked` is false.

---

## 3. Events

*   `qChange`: Emitted when the checked state of the toggle is modified. Payload: `boolean`

---

## 4. Visual Variants

*   **Switch Mode (`type="switch"`)**: Renders a pill-shaped track with a circular thumb sliding horizontally when state switches.
*   **Checkbox Mode (`type="checkbox"`)**: Renders a rounded square border with a draw-animated checkmark inside when checked is true.
*   **Size Layouts**: Varies track/thumb/box sizes and label fonts. Supports `sm`, `md`, and `lg`.
*   **Active Checked state**: Swaps track or box background colors to the primary brand highlight `--q-toggle-bg-on` (`#60a5fa`).
*   **Focus State**: When keyboard-focused, applies a custom shadow ring `--q-toggle-focus-ring` around the toggle control.
*   **Validation Error State**: Highlighting boundaries in red. Switch mode displays red tinted track. Renders validation helper text below.
*   **Disabled State**: Drops overall layout opacity to `0.5` and blocks pointer events.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family, inherit`.
*   **Label text**:
    *   Font size: `0.95rem` (Varies: `var(--q-font-size-sm, 0.7rem)` in `sm` and `var(--q-font-size-lg, 1.125rem)` in `lg`).
    *   Font weight: `500` (Medium).
    *   Color: `var(--q-fg-base, #f9fafb)`.
*   **Error Helper text**:
    *   Font size: `0.75rem`.
    *   Color: `var(--q-toggle-error-color, #ef4444)`.

---

## 6. CSS Variable Mapping

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-toggle-width` | `44px` | Custom width of the switch track. |
| `--q-toggle-height` | `24px` | Custom height of the switch track. |
| `--q-toggle-size` | `18px` | Diameter of the sliding switch thumb. |
| `--q-toggle-box-size` | `20px` | Dimension box size for the checkbox mode. |
| `--q-toggle-bg-off` | `var(--q-bg-surface-2, #374151)` | Background track color when toggle is off. |
| `--q-toggle-bg-on` | `var(--q-color-primary, #60a5fa)` | Background track/box color when toggle is on. |
| `--q-toggle-thumb-color` | `var(--q-fg-base, #f9fafb)` | Background color of switch thumb and checkbox checkmark icons. |
| `--q-toggle-border-color` | `var(--q-border-color, #4b5563)` | Border boundary color for checkbox in standby off state. |
| `--q-toggle-border-color-on` | `var(--q-color-primary, #60a5fa)` | Border boundary color for checkbox when checked. |
| `--q-toggle-focus-ring` | `var(--q-glow-primary, 0 0 0 3px rgba(96, 165, 250, 0.4))` | Box shadow focus ring outline style. |
| `--q-toggle-error-color` | `var(--q-color-danger, #ef4444)` | Warning color for borders and error message subtext. |
| `--q-radius-xs` | `4px` | Rounded corners of checkbox boundary box. |
| `--q-transition-normal` | `200ms ease` | Transition timing function (switch uses `250ms cubic-bezier(0.4, 0, 0.2, 1)` for slider). |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-toggle',
  styleUrl: 'q-toggle.css',
  shadow: true,
  formAssociated: true
})
export class QToggle {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true, reflect: true }) checked: boolean = false;
  @Prop() size: 'sm' | 'md' | 'lg' = 'md';
  @Prop() type: 'switch' | 'checkbox' = 'switch';
  @Prop() label?: string;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() error?: string;

  @State() hasCheckedIcon: boolean = false;
  @State() hasUncheckedIcon: boolean = false;
  @State() hasDefaultSlot: boolean = false;

  @AttachInternals() internals!: ElementInternals;

  render() {
    const hasLabel = this.label !== undefined && this.label !== '';
    const showLabel = hasLabel || this.hasDefaultSlot;
    const hasError = this.error !== undefined && this.error.length > 0;

    return (
      <div class="toggle-container">
        <div
          class={{
            'toggle-wrapper': true,
            'is-checked': this.checked,
            'is-disabled': this.disabled,
            'is-required': this.required,
            'has-error': hasError,
            [`type-${this.type}`]: true,
            [`size-${this.size}`]: true,
          }}
          role="checkbox"
          aria-checked={this.checked ? 'true' : 'false'}
          aria-disabled={this.disabled ? 'true' : 'false'}
          aria-required={this.required ? 'true' : 'false'}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? 'toggle-error-msg' : undefined}
          tabindex={this.disabled ? -1 : 0}
          onClick={this.handleClick}
          onKeyDown={this.handleKeyDown}
        >
          <div class="toggle-control" part="control">
            {this.type === 'switch' ? (
              <div class="switch-track" part="track">
                <div class="switch-thumb" part="thumb" />
              </div>
            ) : (
              <div class="checkbox-box" part="box">
                <span class={{ 'icon-wrap': true, 'is-hidden': !this.checked }} part="icon-checked">
                  <slot name="checked-icon" onSlotchange={this.handleSlotChange}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="default-check-icon">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </slot>
                </span>
                <span class={{ 'icon-wrap': true, 'is-hidden': this.checked }} part="icon-unchecked">
                  <slot name="unchecked-icon" onSlotchange={this.handleSlotChange} />
                </span>
              </div>
            )}
          </div>

          <span
            class={{
              'toggle-label-text': true,
              'is-hidden': !showLabel
            }}
            part="label"
          >
            <slot onSlotchange={this.handleSlotChange}>
              {this.label}
            </slot>
          </span>
        </div>

        {hasError && (
          <span id="toggle-error-msg" class="error-msg" part="error-msg">
            {this.error}
          </span>
        )}
      </div>
    );
  }
}
```

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **Custom Form Interaction Bridge**: Game engine OSR context can drop normal `<input type="checkbox">` mouse events. The component constructs a customized container trigger displaying standard attributes (`role="checkbox"`, `tabindex="0"`) that captures direct clicks and keyboard `Space`/`Enter` keys, mapping them instantly to states.
*   **Lightweight Checkmark Draw Animation**: The checkbox checkmark animation utilizes standard CSS keyframe animation (`stroke-dashoffset` drawing path offsets) rather than continuous JS frame-by-frame draw cycles. This avoids lag spikes in CEF compositor updates.
*   **Solid Background Track Overrides**: When `error` validation highlights active switch boxes, a solid tinted background color is fallback-rendered instead of a blur mask to avoid OSR crashes.
*   **2D Translate Slider Shifts**: Switch thumb transitions map to `transform: translate()` offsets to prevent text blur or clipping inside the enclosing component canvas.

---

## 9. Developer Guidelines & Examples

### Example 1: Standard Toggle Switch
```html
<q-toggle label="Enable Notifications" checked="true"></q-toggle>
```

### Example 2: Checkbox Toggle Mode
```html
<q-toggle type="checkbox" label="Accept terms and conditions" required="true"></q-toggle>
```

### Example 3: Small and Large Size Layouts
```html
<div style="display: flex; flex-direction: column; gap: 8px;">
  <q-toggle size="sm" label="Small toggle"></q-toggle>
  <q-toggle size="lg" label="Large toggle"></q-toggle>
</div>
```

### Example 4: Validation Error Display
```html
<q-toggle 
  type="checkbox" 
  label="I agree to share telemetry data" 
  error="You must agree to telemetry storage before proceeding.">
</q-toggle>
```
