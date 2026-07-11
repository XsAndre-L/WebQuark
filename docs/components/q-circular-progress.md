# 🧩 Component Specification: `q-circular-progress`

> Contract note: see [Current public contracts](./current-contracts.md#q-circular-progress) and the [generated API](../../src/components/indicators/circular-progress/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

The `<q-circular-progress>` is an SVG-driven, reactive circular progress indicator. It displays a progress ring with smooth fill animations and a centered text label. It is built in a highly modular, lightweight fashion without heavy JavaScript charting library dependencies.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `value` | `value` | `number` | `0` | The progress percentage from `0` to `100`. |
| `label` | `label` | `string` | `undefined` | Optional centered text label. If not provided, it falls back to displaying `${value}%`. |
| `indeterminate` | `indeterminate` | `boolean` | `false` | When `true`, the progress ring spins continuously (infinite spinner state) and ignores the `value` property. |
| `size` | `size` | `"lg" \| "md" \| "sm"` | `'md'` | Selects predefined dimensions and stroke weights for the progress ring. |

---

## 2. Slots

None.

---

## 3. Events

None.

---

## 4. Visual Variants

The component adapts its styling and behavior dynamically to cover four distinct display variants:

### Variant A: Standard Percentage Ring
*   **Behavior**: Displays the progress `value` inside the center of the ring, formatted as a percentage (e.g., `"75%"`).
*   **Styling**: Employs standard brand primary fill (`--q-progress-fill-color`) and standard borders.

### Variant B: Custom Text Label
*   **Behavior**: Replaces the percentage with custom short phrases (e.g., `"Done"`, `"LOCKED"`, `"Active"`).
*   **Styling**: Automatically calculates dynamic font sizing inside the ring (`calculateDynamicFontSize`) to ensure the text remains centered and does not overflow the circular boundaries.

### Variant C: Indeterminate Spinner
*   **Behavior**: Used for loading indicators. The progress ring fills to exactly 25% and performs an infinite rotation animation.
*   **Styling**: Utilizes standard 2D keyframe rotation transforms (safe for Unreal OSR).

### Variant D: Sizing Configurations (`size`)
*   **Small (`size="sm"`)**: Size is locked to `64px`, stroke width to `6px`, and center font to `0.75rem`.
*   **Medium (`size="md"`)**: Default size of `120px`, stroke width `8px`, and center font `1.125rem`.
*   **Large (`size="lg"`)**: Size is scaled to `180px`, stroke width `10px`, and center font `1.5rem`.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family` (e.g., system font).
*   **Center Label Text**:
    *   Font size: `--q-progress-font-size` (defaults based on `size` property, e.g., `1.125rem` for medium).
    *   Font weight: `--q-progress-font-weight` (defaults to `--q-font-weight-bold`, e.g., `700`).
    *   Text Anchor: `middle` (SVG property to force perfect horizontal centering).
    *   Dominant Baseline: `central` (SVG property to force perfect vertical centering).
    *   Fill Color: Inherits `--q-fg-base` (adapts to light/dark themes).

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-progress-size` | `120px` (overridden by size attribute) | Outer width and height of the circular container. |
| `--q-progress-stroke-width` | `8px` (overridden by size attribute) | Thickness of the background track and active fill rings. |
| `--q-progress-linecap` | `round` | Line ending style (`round` for modern rounded endpoints, `butt` for sharp borders). |
| `--q-progress-track-color` | `var(--q-border-color, #374151)` | Background inactive track circle color. |
| `--q-progress-fill-color` | `var(--q-color-primary, #60a5fa)` | Active progress percentage ring color. |
| `--q-progress-font-size` | `var(--q-font-size-lg, 1.125rem)` | Font size of the central label. |
| `--q-progress-font-weight`| `var(--q-font-weight-bold, 700)` | Font weight of the central label. |
| `--q-progress-animation-duration`| `1s` | Timeline duration for the fill animation. |
| `--q-transition-normal` | `250ms ease` | Normal transition speed for text modifications. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **No Text Rotation**: In CEF OSR, rotating SVG groups that contain both paths and text elements often causes the text label to flicker, render rotated, or disappear. The `<q-circular-progress>` resolves this by isolating the rotation filter exclusively on the SVG paths group (`.progress-ring-circles`) while keeping the central text element completely unrotated.
*   **OSR Safe Spinner**: The loader spinner executes a clean 2D rotation animation on the paths layer (`@keyframes q-spin { 0% { transform: rotate(-90deg); } 100% { transform: rotate(270deg); } }`). It runs entirely on the browser's compositor thread and does not rely on canvas contexts that could conflict with Unreal's render loop.
*   **Simple Transition Physics**: Uses a simple transition style on the active progress ring (`stroke-dashoffset`), which is perfectly safe and hardware-accelerated.

---

## 9. Developer Guidelines & Examples

### Standard Percentage Progress
```html
<q-circular-progress value="60" size="md"></q-circular-progress>
```

### Small Indeterminate Spinner
```html
<q-circular-progress indeterminate size="sm"></q-circular-progress>
```

### Custom Labels & Dynamic Recalculation
```html
<q-circular-progress id="progress-indicator" value="0" size="lg" label="CONNECTING"></q-circular-progress>

<script>
  const progress = document.getElementById('progress-indicator');
  let pct = 0;
  const interval = setInterval(() => {
    pct += 10;
    if (pct > 100) {
      progress.label = "SUCCESS";
      clearInterval(interval);
    } else {
      progress.value = pct;
    }
  }, 500);
</script>
```
