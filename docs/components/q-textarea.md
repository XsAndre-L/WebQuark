# 🧩 Component Specification: `q-textarea`

> Contract note: see [Current public contracts](./current-contracts.md#q-textarea) and the [generated API](../../src/components/inputs/textarea/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

The `<q-textarea>` is a custom multi-line text input field supporting header labels, form association, custom resize modes, semantic validation error states, and high-performance auto-growing height options. It is optimized for seamless keyboard integration and rendering inside Unreal Engine's Webview context.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `value` | `value` | `string` | `""` | The current text value inside the text area. Mutable. |
| `placeholder` | `placeholder` | `string` | `""` | Helper placeholder text displayed when the field is empty. |
| `label` | `label` | `string` | `undefined` | The header label text displayed above the text area. |
| `ariaLabel` | `aria-label` | `string` | `undefined` | Explicit accessible name for the native textarea. |
| `rows` | `rows` | `number` | `3` | The initial visible height, measured in text rows. |
| `autoGrow` | `auto-grow` | `boolean` | `true` | Automatically expands the text area height to fit input text dynamically. |
| `resizeMode` | `resize-mode` | `"auto" \| "fixed" \| "manual"` | `'auto'` | Resizing mode constraint. `'manual'` enables vertical grab resizing. |
| `disabled` | `disabled` | `boolean` | `false` | Reflects disabled state. Locks interactions and gray-out layouts. |
| `required` | `required` | `boolean` | `false` | Reflects required state for native validation. |
| `error` | `error` | `string` | `undefined` | Reflects error string. Overrides standard borders to red theme colors. |
| `errorMessage` | `error-message` | `string` | `undefined` | Error feedback message displayed below the field. |

---

## 2. Slots

None

---

## 3. Events

*   `qChange`: Emitted when the user commits text changes (on blur). Payload: `string`
*   `qInput`: Emitted on every single keystroke. Payload: `string`
*   `qBlur`: Emitted when the textarea loses keyboard focus. Payload: `FocusEvent`
*   `qFocus`: Emitted when the textarea gains keyboard focus. Payload: `FocusEvent`

---

## 4. Visual Variants

*   **Auto-Growing Height**: In `'auto'` resize mode and with `autoGrow` set to `true`, the textarea height is automatically updated on input.
*   **Manual Resize**: In `'manual'` resize mode, shows a native vertical grab handle to allow manual resizing by users.
*   **Fixed Height**: In `'fixed'` resize mode, locks the vertical size of the textarea container to its initial row capacity.
*   **Focus State**: Animates border and label highlights to primary brand colors via `--q-color-primary` on active focus.
*   **Validation Error State**: Highlighting label and border using `--q-color-danger` when `error` or `errorMessage` properties are present. Displays error text under the input field.
*   **Disabled State**: Lowers overall layout opacity to `0.6` and overrides cursor styling to `not-allowed`.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family, inherit`.
*   **Header Label**:
    *   Font size: `var(--q-font-size-sm, 0.7rem)`.
    *   Font weight: `var(--q-font-weight-bold, 700)`.
    *   Color: `var(--q-fg-muted, #9ca3af)`. Transitioned to `--q-color-primary` on focus and `--q-color-danger` on error.
*   **TextArea Input Value**:
    *   Font size: `var(--q-font-size-base, 1rem)`.
    *   Font weight: `var(--q-font-weight-normal, 400)`.
    *   Color: `var(--q-fg-base, #f9fafb)`.
    *   Line-height: `1.5`.
*   **Error Helper Text**:
    *   Font size: `var(--q-font-size-sm, 0.7rem)`.
    *   Font weight: `var(--q-font-weight-normal, 400)`.
    *   Color: `var(--q-color-danger, #ef4444)`.

---

## 6. CSS Variable Mapping

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-font-family` | `inherit` | Main font family used in label, textarea box, and validation messages. |
| `--q-font-size-sm` | `0.7rem` | Font size used for label and error helper messages. |
| `--q-font-size-base` | `1rem` | Font size used for textarea text value. |
| `--q-font-weight-bold` | `700` | Font weight used for labels. |
| `--q-font-weight-normal` | `400` | Font weight used for text values and validation helpers. |
| `--q-fg-muted` | `#9ca3af` | Colors standby header labels. |
| `--q-fg-base` | `#f9fafb` | User entered text color. |
| `--q-input-bg` | `var(--q-bg-surface-2, #374151)` | Textarea control container background color. |
| `--q-input-border` | `var(--q-border, 1px solid var(--q-border-color, #4b5563))` | Border outline styles in standby state. |
| `--q-input-radius` | `var(--q-radius-md, 8px)` | Rounded corner radius of textarea. |
| `--q-input-padding` | `10px 14px` | Internal text padding margins. |
| `--q-color-primary` | `#60a5fa` | Highlight primary border on active focus and label highlight. |
| `--q-color-danger` | `#ef4444` | Highlight color for error state border, label, and validation text. |
| `--q-transition-fast` | `150ms ease` | Animation transition duration for focus highlights. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **Keyboard Bridge Focus Tunnels**: CEF instances inside Unreal Engine require native form elements to route keystroke bridges. Native `<textarea>` controls are nested within the shadow DOM to allow target focus registration. Content-editable elements are strictly forbidden.
*   **RequestAnimationFrame Auto-Grow**: Automatic height calculation triggers a height layout reset (`height = 'auto'`) followed by `height = scrollHeight`. Updates are wrapped in `requestAnimationFrame` blocks to prevent OSR repaint crashes.
*   **Backdrop-Filter Warnings**: No `backdrop-filter` rules are applied to the textarea or its wrapping controls. Using fallback solid or high-opacity backgrounds prevents black rendering overlays or texture crashes.
*   **GPU Box-Shadow Approximations**: GPU-intensive pixel pass shaders like `filter: drop-shadow()` are avoided in favor of browser-optimized `box-shadow` rules, keeping performance consistent during heavy text entries.

---

## 9. Developer Guidelines & Examples

### Example 1: Standard Auto-Growing Textarea
```html
<q-textarea 
  label="Comments" 
  placeholder="Type your feedback here..." 
  rows="4">
</q-textarea>
```

### Example 2: Fixed Height Textarea (No Resizing)
```html
<q-textarea 
  label="Logs" 
  resize-mode="fixed" 
  auto-grow="false" 
  rows="6" 
  value="[13:22:40] System initialization complete.">
</q-textarea>
```

### Example 3: Manual Resizable Textarea
```html
<q-textarea 
  label="Code Paste" 
  resize-mode="manual" 
  rows="5">
</q-textarea>
```

### Example 4: Form Field with Error Messaging
```html
<q-textarea 
  label="Description" 
  required
  error="Invalid input content detected." 
  error-message="Description must be at least 10 characters long.">
</q-textarea>
```
