# 🧩 Component Specification: `q-carousel`

> Contract note: see [Current public contracts](./current-contracts.md#q-carousel) and the [generated API](../../src/components/layout/carousel/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

The `<q-carousel>` is a generic horizontal layout container designed to hold and slide any slotted children (such as cards, image banners, or product items). It supports smooth momentum scrolling, touch swipe gestures, horizontal scroll snapping, and optional hover-triggered navigation arrows and indicator dots.

It is engineered to run at maximum frame rates in Unreal Engine Off-Screen Rendering (OSR) browser interfaces by relying on native CSS scroll physics and lightweight 2D translation offsets rather than heavy JavaScript layout libraries.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `snapAlignment` | `snap-alignment` | `"center" \| "end" \| "none" \| "start"` | `'start'` | Defines the scroll snap target point for children. |
| `showArrows` | `show-arrows` | `boolean` | `false` | Displays floating left/right navigation arrows. |
| `showIndicators` | `show-indicators` | `boolean` | `false` | Displays active progress indicator dots underneath the carousel. |
| `repeat` | `repeat` | `boolean` | `false` | When `true`, sliding past the start/end wraps around in a loop. |
| `itemWidth` | `item-width` | `string` | `"auto"` | Forces a specific CSS width on all slotted child items (e.g. `'280px'`, `'33%'`). |

### Methods

*   `slideTo(index: number) => Promise<void>`: Scrolls programmatic focus to the item at the specified index.
*   `updateLimits() => Promise<void>`: Recalculates slide coordinates, item widths, and scrolling boundaries.

---

## 2. Slots

*   `default` (unnamed): Receives any layout elements (e.g. `<q-card>`, `<div>`, `<img>`, etc.) that should scroll horizontally.

---

## 3. Events

*   `qSlideChange`: Emitted when the viewport scrolls to a new active index. Passes `{ index: number; element: HTMLElement }` as the custom event payload.

---

## 4. Visual Variants

The carousel adapts structurally based on its properties:

### Variant A: Scroll Snapping (`snapAlignment`)
*   **`start` / `center` / `end`**: Automatically adds scroll-snapping rules to the container and its children. When a user swipes or clicks arrows, the items snap cleanly to the selected boundary.
*   **`none`**: Standard free scroll behavior.

### Variant B: Overlay Navigation (`showArrows="true"`)
*   Floating absolute-positioned arrow buttons fade into view on hover.
*   **OSR Compatibility**: The arrow buttons use solid background variables (`rgba(31, 41, 55, 0.85)`) instead of `backdrop-filter: blur()`, and utilize standard `box-shadow` to avoid performance degradation.

### Variant C: Active Slide Indicators (`showIndicators="true"`)
*   Renders a centered horizontal row of indicator dots at the bottom. The active slide dot expands horizontally (`width: 15px`) and transitions to `--q-color-primary`.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family` (e.g., system font).
*   **Pagination Elements (Indicators / Arrows)**:
    *   No text content is directly rendered, but standard SVG navigation arrow boundaries scale with `--q-carousel-arrow-size`.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-carousel-gap` | `16px` | Horizontal space separating slotted child items. |
| `--q-carousel-padding` | `4px` | Internal container padding to prevent shadow clipping on child cards. |
| `--q-carousel-arrow-bg` | `var(--q-bg-overlay, rgba(31, 41, 55, 0.85))` | Background fill of the navigation arrows. |
| `--q-carousel-arrow-border`| `var(--q-border, 1px solid var(--q-border-color, #374151))` | Outline surrounding the navigation arrows. |
| `--q-carousel-arrow-color` | `#ffffff` | Arrow icon SVG line color. |
| `--q-carousel-arrow-size` | `40px` | Width and height circle bounds for arrows. |
| `--q-carousel-indicator-gap`| `8px` | Space between indicator dots. |
| `--q-carousel-indicator-size`| `6px` | Base diameter of inactive indicator dots. |
| `--q-transition-normal` | `250ms ease` | Animation transition duration for arrows and active indicators. |
| `--q-color-primary` | `#60a5fa` | Color of active navigation indicators and arrow hover state. |
| `--q-color-secondary` | `#9ca3af` | Color of inactive navigation indicators. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **OSR Safe Overlay Controls**: The floating arrow navigation controls rely strictly on high-opacity solid background values (`rgba(31, 41, 55, 0.85)`) and standard drop shadows. No `backdrop-filter` is applied, preventing compositing errors or engine thread crashes.
*   **Scroll Snap Efficiency**: Uses native CSS scroll snapping (`scroll-snap-type: x mandatory`) combined with `overflow-x: auto`. This delegates scroll momentum and snapping directly to the browser rendering layer, bypassing main-thread JS scrolling calculations and maintaining a stable framerate.
*   **Offset Caching**: Calculated layout boundaries, offsets (`offsetLeft`), and child dimensions are cached upon resize, scroll, or slot mutations. This prevents layout thrashing and high-frequency reflows, which are extremely expensive inside OSR.
*   **ResizeObserver Support**: Safe for modern CEF environments. Recalculates limits dynamically on panel sizing changes.

---

## 9. Developer Guidelines & Examples

### Basic Image Gallery
```html
<q-carousel show-arrows show-indicators snap-alignment="center" item-width="300px">
  <img src="/img/1.jpg" alt="Scene 1" />
  <img src="/img/2.jpg" alt="Scene 2" />
  <img src="/img/3.jpg" alt="Scene 3" />
</q-carousel>
```

### Wizard / Card Stepper with Programmatic Control
```html
<q-carousel id="wizard-carousel" show-indicators>
  <q-card><h3>Step 1</h3><p>Choose your workspace setup.</p></q-card>
  <q-card><h3>Step 2</h3><p>Configure integration plugins.</p></q-card>
  <q-card><h3>Step 3</h3><p>Review and deploy.</p></q-card>
</q-carousel>

<q-button id="prev-btn">Back</q-button>
<q-button id="next-btn">Next</q-button>

<script>
  const carousel = document.getElementById('wizard-carousel');
  let currentIndex = 0;

  carousel.addEventListener('qSlideChange', (e) => {
    currentIndex = e.detail.index;
  });

  document.getElementById('next-btn').addEventListener('click', () => {
    carousel.slideTo(currentIndex + 1);
  });

  document.getElementById('prev-btn').addEventListener('click', () => {
    carousel.slideTo(currentIndex - 1);
  });
</script>
```
