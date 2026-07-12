# 🧩 Component Specification: `q-quantity-selector`

> Contract note: see [Current public contracts](./current-contracts.md#q-quantity-selector) and the [generated API](../../src/components/inputs/quantity-selector/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

The `<q-quantity-selector>` is a custom numeric input selector control allowing users to increment or decrement a value using side action buttons. It supports custom step increments, minimum/maximum boundary constraints, text field sanitation, and both horizontal and vertical layout formats.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `value` | `value` | `number` | `0` | Mutable. The current numeric quantity value. |
| `step` | `step` | `number` | `1` | The increment/decrement step amount. |
| `min` | `min` | `number` | `undefined` | Optional minimum allowed value limit. |
| `max` | `max` | `number` | `undefined` | Optional maximum allowed value limit. |
| `variant` | `variant` | `"horizontal" \| "vertical"` | `'horizontal'` | Reflects layout alignment. Stacks buttons horizontally or vertically. |

---

## 2. Slots

None

---

## 3. Events

*   `qChange`: Emitted when the quantity value changes. Payload: `number`

---

## 4. Visual Variants

*   **Horizontal Layout (`variant="horizontal"`)**: Places the decrement button on the left, the text input field in the middle, and the increment button on the right. Height is controlled by `--q-quantity-selector-height`.
*   **Vertical Layout (`variant="vertical"`)**: Stacks the increment button on top, the text input in the middle, and the decrement button at the bottom. Width is controlled by `--q-quantity-selector-width-vertical`.
*   **Button Disabled state**: Increment/decrement action buttons automatically disable and reduce opacity to `0.4` when the value hits the bounds defined by `min` or `max`.
*   **Dynamic Horizontal Input Sizing**: The input field width automatically calculates based on characters inside bounds (min/max/current length) to prevent resizing jumps.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family, inherit`.
*   **Input Box Quantity Value**:
    *   Font size: `var(--q-font-size-base, 1rem)`.
    *   Font weight: `var(--q-font-weight-normal, 400)`.
    *   Color: `var(--q-quantity-selector-input-fg, var(--q-fg-base, #f9fafb))`.
    *   Alignment: Center aligned.

---

## 6. CSS Variable Mapping

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-quantity-selector-height` | `38px` | Vertical height for horizontal layout and button height in vertical layout. |
| `--q-quantity-selector-width-vertical` | `50px` | Total width of the selector in vertical layout. |
| `--q-quantity-selector-bg` | `var(--q-bg-surface-2, #374151)` | Background color of the selector container. |
| `--q-quantity-selector-border-color` | `var(--q-border-color, #4b5563)` | Border boundary color for selector container and buttons. |
| `--q-quantity-selector-radius` | `var(--q-radius-md, 8px)` | Rounded corner border radius for the selector. |
| `--q-quantity-selector-input-bg` | `var(--q-bg-base, #111827)` | Background color of the numeric input field. |
| `--q-quantity-selector-input-fg` | `var(--q-fg-base, #f9fafb)` | Text color of the active quantity value. |
| `--q-quantity-selector-btn-bg` | `transparent` | Background color for increment/decrement buttons in standby. |
| `--q-quantity-selector-btn-bg-hover` | `var(--q-bg-surface-3, #4b5563)` | Hover background color of increment/decrement buttons. |
| `--q-quantity-selector-btn-fg` | `var(--q-fg-muted, #9ca3af)` | Icon color of buttons in standby state. |
| `--q-quantity-selector-btn-fg-hover` | `var(--q-fg-base, #f9fafb)` | Icon color of buttons during hover state. |
| `--q-quantity-selector-char-width` | `1ch` | Font character width unit for dynamic width calculations. |
| `--q-quantity-selector-input-padding` | `16px` | Inline input padding margin added to width calculation. |
| `--q-transition-fast` | `150ms ease` | Animation transition speed for button hover highlights. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **Keyboard Input Bridges**: The input is styled as a standard `<input type="text">` to receive and parse keyboard bridge events from CEF. To prevent layout explosion on invalid text keys, the component employs an event parser sanitizing inputs on every `input` callback, keeping only numerical properties (`[0-9.-]`).
*   **Dynamic Width Calculations**: In OSR, resizing components inline can cause reflow bugs. The component calculates horizontal input width via character width properties (`1ch`), resulting in static width bounds during runtimes unless min/max limits are shifted.
*   **Tabindex and Event Bubbling**: Buttons use `type="button"` and focus properties are managed to prevent gamepad cursor overlaps in webview overlays.

---

## 9. Developer Guidelines & Examples

### Example 1: Horizontal Quantity Selector with limits
```html
<q-quantity-selector min="1" max="10" value="1" step="1"></q-quantity-selector>
```

### Example 2: Vertical Quantity Selector
```html
<q-quantity-selector variant="vertical" min="0" max="100" value="50" step="5"></q-quantity-selector>
```

### Example 3: Handling quantity updates in JavaScript
```html
<q-quantity-selector id="selector" min="0" value="0"></q-quantity-selector>
<div id="price-tag">Total: $0.00</div>

<script>
  const selector = document.getElementById('selector');
  const priceTag = document.getElementById('price-tag');
  const UNIT_PRICE = 12.99;

  selector.addEventListener('qChange', (e) => {
    const qty = e.detail;
    priceTag.textContent = `Total: $${(qty * UNIT_PRICE).toFixed(2)}`;
  });
</script>
```
