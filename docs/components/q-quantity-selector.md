# 🧩 Component Specification: `q-quantity-selector`

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

## 7. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-quantity-selector',
  styleUrl: 'q-quantity-selector.css',
  shadow: true
})
export class QQuantitySelector {
  @Prop({ mutable: true }) value: number = 0;
  @Prop() step: number = 1;
  @Prop() min?: number;
  @Prop() max?: number;
  @Prop({ reflect: true }) variant: 'horizontal' | 'vertical' = 'horizontal';

  @State() inputValue: string = '0';

  private inputEl?: HTMLInputElement;

  render() {
    const isMinDisabled = this.min !== undefined && this.min !== null && this.value <= this.min;
    const isMaxDisabled = this.max !== undefined && this.max !== null && this.value >= this.max;

    const decBtn = (
      <button
        type="button"
        class="quantity-btn quantity-btn-decrement"
        onClick={this.decrement}
        disabled={isMinDisabled}
        aria-label="Decrement quantity"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    );

    const incBtn = (
      <button
        type="button"
        class="quantity-btn quantity-btn-increment"
        onClick={this.increment}
        disabled={isMaxDisabled}
        aria-label="Increment quantity"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    );

    const calculatedWidth = this.variant === 'horizontal' ? this.getCalculatedWidth() : '100%';

    return (
      <div
        class={{
          'quantity-selector': true,
          [`variant-${this.variant}`]: true
        }}
      >
        {this.variant === 'vertical' ? incBtn : decBtn}
        <input
          ref={(el) => (this.inputEl = el as HTMLInputElement)}
          type="text"
          class="quantity-input"
          value={this.inputValue}
          onInput={this.handleInput}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          style={{ width: calculatedWidth }}
          part="input"
        />
        {this.variant === 'vertical' ? decBtn : incBtn}
      </div>
    );
  }
}
```

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
