# 🧩 Component Specification: `q-input`

> Contract note: see [Current public contracts](./current-contracts.md#q-input) and the [generated API](../../src/components/inputs/input/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

The `<q-input>` is a custom single-line input control component supporting label headers, clear button overlays, numerical spin counters, prefix/suffix slot elements, error states, and keyboard focus routing. It is fully accessible (form-associated) and optimized for high-performance Off-Screen Rendering (OSR) in game engine webviews.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `value` | `value` | `string` | `""` | The current value of the input field. Mutable. |
| `type` | `type` | `"color" \| "email" \| "number" \| "password" \| "search" \| "text" \| "url"` | `'text'` | The native input field type. |
| `placeholder` | `placeholder` | `string` | `""` | Helper text to display when the input is empty. |
| `label` | `label` | `string` | `undefined` | Optional header label text displayed above the control. |
| `ariaLabel` | `aria-label` | `string` | `undefined` | Accessible name forwarded to the native input when no visible label is used. |
| `disabled` | `disabled` | `boolean` | `false` | Reflects disabled state. Disables interaction and user input. |
| `required` | `required` | `boolean` | `false` | Reflects required state for form validation. |
| `error` | `error` | `string` | `undefined` | Reflects custom validation error string. Overrides standard layout borders to warning colors. |
| `errorMessage` | `error-message` | `string` | `undefined` | Error feedback message displayed below the input. |
| `size` | `size` | `"lg" \| "md" \| "sm"` | `'md'` | The size of the input layout box. |
| `clearable` | `clearable` | `boolean` | `false` | Shows a clear button on the right side if input is not empty. |
| `min` | `min` | `number` | `undefined` | Minimum allowed value, relevant for number type. |
| `max` | `max` | `number` | `undefined` | Maximum allowed value, relevant for number type. |
| `step` | `step` | `number` | `1` | Increment/decrement step amount for number type. |

---

## 2. Slots

*   `prefix`: Slots an icon, currency symbol, or prefix text inside the input box on the left.
*   `suffix`: Slots an interactive button, validation indicator, or icon inside the input box on the right.

---

## 3. Events

*   `qChange`: Emitted when the user commits value change (on change event, spinner click, or clear click). Payload: `string`
*   `qInput`: Emitted on every user keystroke/input. Payload: `string`
*   `qBlur`: Emitted when the input loses keyboard focus. Payload: `FocusEvent`
*   `qFocus`: Emitted when the input gains keyboard focus. Payload: `FocusEvent`

---

## 4. Visual Variants

*   **Size Variants**: Supports three sizes: `sm` (small, compact padding and fonts), `md` (medium/standard layout), and `lg` (large layout with elevated visibility).
*   **Interactive State**: Default focus-within triggers transition highlight on border and header label with `--q-color-primary`.
*   **Validation Error State**: Highlighting label and border using `--q-color-danger` when `error` or `errorMessage` properties are present. Displays error text under the input field.
*   **Clearable Variant**: Shows standard trailing clear action button inside the suffix container when `clearable="true"` and text is present. Clicking it empties the field and refocusses it.
*   **Spinners (Number Mode)**: For `type="number"`, renders custom CSS stacked spinner buttons on the right edge of the input. Increments or decrements with the specified `step`, clamped within `min`/`max`.
*   **Disabled State**: Drops opacity to `0.6` and sets cursor to `not-allowed` on the control container. Disables pointer events.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family, inherit`.
*   **Header Label**:
    *   Font size: `var(--q-font-size-sm, 0.7rem)` (Varies: `var(--q-font-size-xs, 0.75rem)` in `sm` and `var(--q-font-size-base, 1rem)` in `lg`).
    *   Font weight: `var(--q-font-weight-bold, 700)`.
    *   Color: `var(--q-fg-muted, #9ca3af)`. Transitioned to `--q-color-primary` on focus and `--q-color-danger` on error.
*   **Input Box Typed Text**:
    *   Font size: `var(--q-font-size-base, 1rem)` (Varies: `var(--q-font-size-sm, 0.7rem)` in `sm` and `var(--q-font-size-lg, 1.125rem)` in `lg`).
    *   Font weight: `var(--q-font-weight-normal, 400)`.
    *   Color: `var(--q-fg-base, #f9fafb)`.
    *   Line-height: `1.2`.
*   **Error Subtext Helper**:
    *   Font size: `var(--q-font-size-sm, 0.7rem)`.
    *   Font weight: `var(--q-font-weight-normal, 400)`.
    *   Color: `var(--q-color-danger, #ef4444)`.

---

## 6. CSS Variable Mapping

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-font-family` | `inherit` | Main font family used in label, input box, and validation messages. |
| `--q-font-size-xs` | `0.75rem` | Font size used for label in `sm` variant. |
| `--q-font-size-sm` | `0.7rem` | Font size used for label and errors in `md` variant, and input text in `sm` variant. |
| `--q-font-size-base` | `1rem` | Font size used for input text in `md` variant and label in `lg` variant. |
| `--q-font-size-lg` | `1.125rem` | Font size used for input text in `lg` variant. |
| `--q-font-weight-bold` | `700` | Font weight used for labels. |
| `--q-font-weight-normal` | `400` | Font weight used for input text and error messages. |
| `--q-fg-muted` | `#9ca3af` | Colors labels, suffix/prefix content, clear icons, and spin buttons. |
| `--q-fg-base` | `#f9fafb` | Main color of user typed input text. |
| `--q-input-bg` | `var(--q-bg-surface-2, #374151)` | Input control container background color. |
| `--q-input-border` | `var(--q-border, 1px solid var(--q-border-color, #4b5563))` | Border styling for input in standby state. |
| `--q-input-radius` | `var(--q-radius-md, 8px)` | Rounded corner radius of input box container. |
| `--q-input-padding` | `10px 14px` | Text padding spacing inside the field. Varies by size layout. |
| `--q-color-primary` | `#60a5fa` | Border highlight color on focus-within and label highlight. |
| `--q-color-danger` | `#ef4444` | Highlight color for error state border and label, and error message text. |
| `--q-transition-fast` | `150ms ease` | Animation duration for focus and hover states. |
| `--q-btn-hover-overlay`| `color-mix(in srgb, var(--q-fg-base, #f9fafb) 8%, transparent)` | Hover background overlay color for clear button. |
| `--q-bg-surface-3` | `#4b5563` | Hover background color for number spin buttons. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **Keyboard Focus Capture Bridge**: Content-editable `<div>` elements are intentionally avoided. Wrapping a native `<input>` element within the shadow DOM guarantees keyboard event bridging between Unreal Engine's input handlers and the Chromium Embedded Framework (CEF) webview context.
*   **Backdrop-Filter Warnings**: The component does not use `backdrop-filter` for transparency or blur inside the input control container. To avoid rendering glitches or memory texture crashes in OSR mode, solid or high-opacity fallback overlays are utilized.
*   **3D Transform Rendering**: Standard 2D translations (`transform: translate()`) are implemented rather than 3D transitions. This prevents clipping inside bounding containers or text blurring in Unreal's OSR rendering queue.
*   **Drop-Shadow Processing Constraint**: The CSS property `box-shadow` is used exclusively for outlines. Expensive `filter: drop-shadow()` styles are prohibited to maintain steady frame rates on offscreen canvas passes.

---

## 9. Developer Guidelines & Examples

### Example 1: Standard Text Input
```html
<q-input 
  label="Username" 
  placeholder="Enter your username..." 
  size="md">
</q-input>
```

### Example 2: Clearable Search Field with Prefix Icon
```html
<q-input 
  type="search" 
  placeholder="Search database..." 
  clearable>
  <span slot="prefix">🔍</span>
</q-input>
```

### Example 3: Numerical Value Input with Bounds
```html
<q-input 
  type="number" 
  label="Age Limit" 
  value="18" 
  min="0" 
  max="120" 
  step="1">
</q-input>
```

### Example 4: Validation Error Handling
```html
<q-input 
  label="Email Address" 
  value="invalid-email" 
  error="Invalid email structure." 
  error-message="Please ensure email contains @ and domain.">
</q-input>
```
