# 🧩 Component Specification: `q-step-diagram`

> Contract note: see [Current public contracts](./current-contracts.md#q-step-diagram), the [generated API](../../src/components/indicators/step-diagram/readme.md), and the separate [q-step-diagram-item guide](./q-step-diagram-item.md). Generated API wins if an older design note below differs.

The `<q-step-diagram>` component acts as a generic connected-path progress flow diagram. It displays chronological activity logs, sequential configuration steps (wizards), or project milestones. It supports both vertical and horizontal layouts, dynamic line styles, and semantic state colors, rendering smoothly in Unreal Engine's Off-Screen Rendering (OSR) browser mode.

---

## 1. Component API (Properties & Attributes)

### A. Parent Container: `<q-step-diagram>`

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `layout` | `layout` | `"vertical" \| "horizontal"` | `'vertical'` | The direction of the progress flow path. |

### B. Child Item: `<q-step-diagram-item>`

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `status` | `"pending" \| "active" \| "completed" \| "success" \| "warning" \| "danger"` | `'completed'` | The semantic status of the step. Updates the colors of the node circle and the trailing path line. |
| `lineStyle` | `line-style` | `"solid" \| "dashed" \| "dotted" \| "none"` | `'solid'` | The stroke style of the path line leading to the next step. |
| `layout` | `layout` | `"vertical" \| "horizontal"` | `'vertical'` | Inherited layout direction (propagated from parent `<q-step-diagram>`). |

---

## 2. Slots (on `<q-step-diagram-item>`)

*   `badge`: Custom marker displayed inside the node circle (e.g. step numbers `1`, `2`, `3`, checkmark icons, or glowing dots).
*   `title`: Header section for timestamps, dates, or milestone headings.
*   `default` (unnamed): Core content container for step descriptions, logs, or nested cards.

---

## 3. Events (on `<q-step-diagram-item>`)

*   `qItemClick`: Emitted when the step content card is clicked.

---

## 4. Visual Variants

The component uses parent-child attribute propagation to support multiple layout configurations:

### Variant A: Layout Alignment (`layout`)
*   **Vertical Flow (`layout="vertical"`)**: Standard chronological timeline. The connecting line runs vertically down the left side, and content boxes align on the right.
*   **Horizontal Flow (`layout="horizontal"`)**: Stepper wizard format. The connecting line runs horizontally across the top, and content boxes align below the nodes.

### Variant B: Line Connections (`lineStyle`)
*   **Solid**: Standard completed or active paths.
*   **Dashed / Dotted**: Future/pending paths or optional intermediate steps.
*   **None**: Removes the connecting line. Best used for the final step in a sequence.

### Variant C: Semantic Node Statuses (`status`)
*   **`completed` / `success`**: Represents a completed milestone. Node is filled with `--q-color-success` (green) and text color shifts to dark base.
*   **`active`**: Represents the current task. Node is highlighted with `--q-color-primary` (electric blue) and features a hardware-safe pulsating animation.
*   **`pending`**: Represents future tasks. Node is styled with a light border and transparent background.
*   **`warning` / `danger`**: Represents warnings or failed steps. Node is highlighted in orange or red (`--q-color-danger`).

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family` (e.g., system font).
*   **Step Title (Title Slot)**:
    *   Font size: `--q-font-size-sm` (e.g., `0.875rem` / `14px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `700`).
    *   Color: `--q-color-primary` (defaults to `#60a5fa`).
*   **Body Content (Default Slot)**:
    *   Font size: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   Font weight: `--q-font-weight-normal` (e.g., `400`).
    *   Color: `--q-fg-base` (defaults to `#f9fafb`).
    *   Line-height: `1.5`.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-step-diag-line` | `2px solid var(--q-border-color)` | Shorthand styling for the connecting path line. |
| `--q-step-diag-border` | `var(--q-border, 1px solid var(--q-border-color))` | Border outline style for step content boxes. |
| `--q-step-diag-icon-size`| `32px` | Height and width of the circle badge node. |
| `--q-step-diag-item-gap` | `24px` | Spacing gap separating adjacent steps. |
| `--q-color-success` | `#34d399` | Green status fill color. |
| `--q-color-primary` | `#60a5fa` | Blue accent color for active items. |
| `--q-color-danger` | `#ef4444` | Red status fill color. |
| `--q-border-color` | `#4b5563` | Fallback border line color. |
| `--q-radius-lg` | `12px` | Border radius rounding of step content boxes. |
| `--q-padding-md` | `16px` | Content box internal padding. |
| `--q-transition-normal` | `250ms ease` | Timing of line/status animations. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **OSR Safe Pulse Animation**: Active steps use a pseudo-element (`::after`) to render a pulsating halo indicator. To prevent CPU lag and frame rate drops inside Unreal Engine CEF OSR, this pulse animation is optimized using GPU-accelerated 2D transforms (`transform: scale()`) and opacity properties (`@keyframes active-pulse-gpu { 0% { transform: scale(0.95); opacity: 0.8; } 100% { transform: scale(1.35); opacity: 0; } }`) rather than costly box-shadow transitions or SVG filter updates.
*   **Accessibility Hierarchy**: Keyboard focus is bound strictly to the content box (`.step-content`, `tabindex="0"`), while the decorative badge is hidden from accessibility trees (`aria-hidden="true"`). This avoids focus duplication bugs that can cause keyboard navigation lockups in game UIs.
*   **2D Hover Animations**: Content hover translations rely on standard 2D offsets (`transform: translateY(-2px)`), avoiding z-fighting or clipping errors on offscreen canvas surfaces.

---

## 9. Developer Guidelines & Examples

### Vertical Activity Timeline
```html
<q-step-diagram layout="vertical">
  <q-step-diagram-item status="completed">
    <span slot="badge">✓</span>
    <span slot="title">Project Created</span>
    <p>Repository initialized and basic branch policies configured.</p>
  </q-step-diagram-item>
  
  <q-step-diagram-item status="active">
    <span slot="badge">⚡</span>
    <span slot="title">Unit Testing</span>
    <p>Running automated quality testing suites across components.</p>
  </q-step-diagram-item>

  <q-step-diagram-item status="pending" line-style="none">
    <span slot="badge">○</span>
    <span slot="title">Production Release</span>
    <p>Deploy artifacts to cloud staging targets.</p>
  </q-step-diagram-item>
</q-step-diagram>
```

### Horizontal Wizard Steps (Interactive)
```html
<q-step-diagram layout="horizontal" id="wizard-stepper">
  <q-step-diagram-item id="step-1" status="active">
    <span slot="badge">1</span>
    <span slot="title">Account Details</span>
  </q-step-diagram-item>
  <q-step-diagram-item id="step-2" status="pending">
    <span slot="badge">2</span>
    <span slot="title">Security Config</span>
  </q-step-diagram-item>
  <q-step-diagram-item id="step-3" status="pending" line-style="none">
    <span slot="badge">3</span>
    <span slot="title">All Done</span>
  </q-step-diagram-item>
</q-step-diagram>

<script>
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');

  step1.addEventListener('qItemClick', () => {
    console.log('User clicked step 1!');
  });
</script>
```
