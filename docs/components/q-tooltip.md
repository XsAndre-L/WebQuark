# 🧩 Component Specification: `q-tooltip`

> Contract note: see [Current public contracts](./current-contracts.md#q-tooltip) and the [generated API](../../src/components/overlays/tooltip/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

The `<q-tooltip>` is a floating informational tooltip bubble that attaches to its parent trigger element. It calculates screen positioning dynamically on hover or focus, supporting top, bottom, left, and right placements, and automatically hides on view scroll or resize to prevent rendering orphans.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `content` | `content` | `string` | `undefined` | The text content to display inside the tooltip bubble. If omitted, uses slot. |
| `position` | `position` | `"bottom" \| "left" \| "right" \| "top"` | `'top'` | Placement position of the tooltip relative to its trigger parent. |
| `delay` | `delay` | `number` | `200` | The delay in milliseconds before the tooltip shows up. |

---

## 2. Slots

*   **Default Slot**: Slots custom HTML elements or texts inside the tooltip bubble. Used when the `content` property is empty.

---

## 3. Events

None

---

## 4. Visual Variants

*   **Placement Positions**: Placements include `top`, `bottom`, `left`, and `right`. Transition shifts align placements dynamically relative to trigger box edges.
*   **Transition Animations**: Fades in and out (`opacity`) and translates slightly closer to target boundaries when active (`is-visible`).
*   **Aesthetics**: Renders as an elevated dark bubble container with a thin boundary line and soft shadow (`0 4px 12px rgba(0, 0, 0, 0.25)`).

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Fallback font family stack mapped to `system-ui, -apple-system, sans-serif` if `--q-font-family` is not set.
*   **Tooltip bubble text**:
    *   Font size: `0.725rem`.
    *   Font weight: `500` (Medium).
    *   Line-height: `1.2`.
    *   Color: `var(--q-fg-main, var(--text-main, #f3f4f6))`.
    *   White-space: `nowrap` (Forces single-line layout).

---

## 6. CSS Variable Mapping

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-bg-surface-3` | `#1e293b` | Background bubble color of the tooltip. |
| `--q-fg-main` | `var(--text-main, #f3f4f6)` | Tooltip bubble label text color. |
| `--q-border-color` | `rgba(255, 255, 255, 0.08)` | Border boundary outline color. |
| `--q-radius-sm` | `4px` | Border rounded corner radius of the bubble. |
| `--q-font-family` | `system-ui, -apple-system, sans-serif` | Main typography font family. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **Fixed Coordinates Layout**: Tooltips use `position: fixed` in CSS and calculate coordinates using JavaScript's `getBoundingClientRect()`. This is crucial because CEF container layouts clips overflow elements.
*   **Scroll Orphan Prevention**: When viewport scrolls (especially inside scroll containers or lists), the tooltip binds listeners up the parent DOM chain, hiding the active bubble immediately to prevent floating orphan glitches.
*   **Opaque Backdrop Rendering**: Tooltips use opaque surface backgrounds (`--q-bg-surface-3` `#1e293b`) instead of transparent blur effects to prevent OSR alpha layer crashes or black backgrounds.
*   **Simple 2D Transition Offsets**: Transforms are mapped strictly to standard 2D translations to prevent browser clipping or text blur in hardware-accelerated buffers.

---

## 9. Developer Guidelines & Examples

### Example 1: Standard Button Tooltip
```html
<q-button>
  Delete Item
  <q-tooltip content="Permanently delete this entry"></q-tooltip>
</q-button>
```

### Example 2: Placement Positioning Variants
```html
<div style="display: flex; gap: 8px;">
  <q-button>
    Left Tooltip
    <q-tooltip position="left" content="Left-aligned help info"></q-tooltip>
  </q-button>
  <q-button>
    Bottom Tooltip
    <q-tooltip position="bottom" content="Bottom-aligned help info"></q-tooltip>
  </q-button>
  <q-button>
    Right Tooltip
    <q-tooltip position="right" content="Right-aligned help info"></q-tooltip>
  </q-button>
</div>
```

### Example 3: Custom Slotted HTML Content
```html
<q-button>
  View Details
  <q-tooltip position="bottom">
    <div style="display: flex; align-items: center; gap: 6px;">
      <span>ℹ️</span>
      <strong>Detailed System Logs</strong>
    </div>
  </q-tooltip>
</q-button>
```
