# 🧩 Component Specification: `q-sidepanel`

> Contract note: see [Current public contracts](./current-contracts.md#q-sidepanel) and the [generated API](../../src/components/layout/sidepanel/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

The `<q-sidepanel>` is a customizable sidebar component. It supports two primary modes: a slide-out overlay drawer (drawer mode) and a fixed navigation sidebar (nav mode). It uses standard 2D translation transforms, thin layout structures, and lightweight backdrops to remain completely glitch-free inside Unreal Engine's Off-Screen Rendering (OSR) browser context.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `variant` | `variant` | `"drawer" \| "nav" \| "panel"` | `'nav'` | Selects overlay drawer, fixed navigation, or persistent slotted panel behavior. |
| `open` | `open` | `boolean` | `false` | Controls drawer open/close state (drawer mode only). |
| `side` | `side` | `"bottom" \| "left" \| "right" \| "top"` | `'right'` | Screen edge the drawer slides from (drawer mode only). |
| `panelSize` | `panel-size` | `string` | `'320px'` | Panel dimension – width or height depending on `side` (drawer mode only). |
| `items` | -- | `(SidepanelItem \| string)[]` | `[]` | Navigation entries passed programmatically. Strings use the same label and value. |
| `ariaLabel` | `aria-label` | `string` | `undefined` | Accessible name for the navigation, panel region, or drawer dialog. |
| `value` | `value` | `string` | `''` | Value of the currently active/selected item (nav mode only). |
| `mode` | `mode` | `"flat" \| "grouped" \| "tree"` | `'flat'` | Display mode for items: flat list, one-level groups, or deep tree. |
| `expanded` | `expanded` | `boolean` | `true` | Whether all parent groups start expanded on first render (nav mode only). |
| `accordion` | `accordion` | `boolean` | `false` | If true, opening one group collapses all sibling groups (nav mode only). |

### Navigation Item Interface (`SidepanelItem`)
```typescript
export interface SidepanelItem {
  label: string;
  value: string;
  icon?: string;
  alwaysExpanded?: boolean;
  children?: SidepanelItem[];
}
```

Set `alwaysExpanded` on a parent item to render it as a persistent category heading. Its children
remain visible, it has no collapse affordance, and it does not affect the collapsible behavior of
other navigation groups. It overrides `expanded=false` and accordion mode, applies only to the item
where it is set, and is ignored for items without children.

For a flat navigation list, the concise form is enough:

```js
sidepanel.items = ['Home', 'Reports', 'Settings'];
```

---

## 2. Slots

*   `header`: Top header section slot (drawer and nav modes).
*   `footer`: Bottom footer section slot (nav mode only).
*   `default` (unnamed): Core content container for nested elements (drawer mode only).
*   `collapse-icon`: Optional icon shown by the built-in control while expanded.
*   `expand-icon`: Optional icon shown by the built-in control while collapsed.
*   `collapse-control-adornment`: Optional non-interactive notification badge or visible label anchored over the built-in control's top-left corner. Keep `collapse-label` synchronized with meaningful content.

---

## 3. Events

*   `qClose`: Emitted when the drawer is closed (drawer mode only).
*   `qSelect`: Emitted when a leaf navigation item is clicked. The event payload carries `{ value: string; label: string; item: SidepanelItem }` (nav mode only).

---

## 4. Visual Variants

The sidepanel operates in two distinct variant layouts:

### Variant A: Slide Overlay Drawer (`variant="drawer"`)
*   **Edge Alignment (`side`)**: The panel slides in from the `left`, `right`, `top`, or `bottom` of the viewport. Left/right drawers occupy 100% viewport height and stretch to `panelSize` width. Top/bottom drawers occupy 100% viewport width and stretch to `panelSize` height.
*   **Animation Transitions**: Utilizes standard 2D translation offsets (`transform: translateX(100%)` to `translateX(0)`) for OSR-safe, hardware-accelerated drawer slides.
*   **Overlay Backdrop**: Fades in a semi-transparent dark dim overlay (`rgba(0, 0, 0, 0.5)`). Avoids `backdrop-filter: blur` to prevent rendering crashes.
*   **Mobile sheet translation**: Automatically overrides left/right panels into bottom sheets on screen widths `< 600px`.

### Variant B: Fixed Navigation Sidebar (`variant="nav"`)
*   **Menu Item States**: Supports flat lists, grouping headers, and hierarchical tree structures (nesting padding scaled via item depth).
*   **Interactive Styles**: Employs active hover backgrounds (`--q-bg-surface-2`) and selected indicator bars (`::before` border highlighted in `--q-color-primary`).
*   **Group Chevrons**: Chevron icons rotate 90 degrees when nested item directories are expanded.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family` (e.g., system font).
*   **Drawer Typography**:
    *   Header: `--q-font-size-lg` (e.g., `1.125rem`), bold (`700`).
    *   Body: `--q-font-size-base` (e.g., `1rem`), normal (`400`).
*   **Navigation Sidebar Typography**:
    *   Group Header Label: size `0.75rem`, bold (`700`), uppercase, letter-spacing `0.06em`.
    *   Leaf Item Label: size `0.875rem`, normal (`400`), line-height `1.4`.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-panel-bg` | `var(--q-bg-surface-1, #1f2937)` | Drawer background color. |
| `--q-panel-border` | `var(--q-border, 1px solid var(--q-border-color, #374151))` | Edge separator border line. |
| `--q-panel-shadow` | `var(--q-shadow-high, 0 16px 32px rgba(0,0,0,0.12))` | Shadow depth applied on the drawer border. |
| `--q-panel-transition-duration`| `var(--q-transition-normal, 250ms)` | Slide animation duration. |
| `--q-transition-normal` | `250ms ease` | Normal easing transition timing function. |
| `--q-sidepanel-bg` | `var(--bg-sidebar, #111827)` | Sidebar background color (nav variant). |
| `--q-fg-muted` | `#9ca3af` | Secondary/inactive text color. |
| `--q-fg-base` | `#f9fafb` | Primary/active text color. |
| `--q-color-primary` | `#6366f1` | Selected active item background glow & left indicator accent color. |
| `--q-bg-surface-2` | `rgba(255, 255, 255, 0.05)` | Hover state background fill. |
| `--q-fg-subtle` | `#6b7280` | Parent header/category text color. |
| `--q-sidepanel-collapse-control-adornment-top` | `0` | Adornment anchor offset from the control's top edge. |
| `--q-sidepanel-collapse-control-adornment-left` | `0` | Adornment anchor offset from the control's left edge. |
| `--q-sidepanel-collapse-control-adornment-translate-x` | `-50%` | Horizontal translation from the adornment anchor. |
| `--q-sidepanel-collapse-control-adornment-translate-y` | `-50%` | Vertical translation from the adornment anchor. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **No Backdrop Blur Filter**: Native backdrop filters (`backdrop-filter`) are excluded from `.sidepanel-backdrop` to avoid compositing crashes and opaque black backgrounds inside Unreal's Off-Screen Rendering (OSR). Uses a robust solid alpha overlay (`rgba(0, 0, 0, 0.5)`) instead.
*   **OSR Safe 2D Slide Translations**: The drawer slides utilize pure 2D translation offsets (`transform: translateX(100%)` to `translateX(0)`) rather than modifying absolute positioning (e.g. `right: -320px` to `0`), which prevents continuous layout repaints and rendering frame drops.
*   **Focus Capture Trap**: Focus trapping is fully managed via native tab trapping functions. Key events are routed safely through the Stencil shadow DOM lifecycle to prevent focus bridging issues.
*   **Custom Scrollbar**: In nav mode, the scrollbar style is customized using thin Webkit scrollbar selectors. Native mouse scroll input operates correctly under CEF.

---

## 9. Developer Guidelines & Examples

### Navigation Sidebar (Nav Mode)
```html
<q-sidepanel id="sidebar-nav" variant="nav"></q-sidepanel>

<script>
  const sidebar = document.getElementById('sidebar-nav');
  sidebar.items = [
    {
      label: 'Dashboard',
      value: 'dashboard',
      icon: 'layout-dashboard'
    },
    {
      label: 'Management',
      value: 'management',
      icon: 'settings',
      children: [
        { label: 'Users', value: 'users' },
        { label: 'System Logs', value: 'logs' }
      ]
    }
  ];
  sidebar.value = 'dashboard';

  sidebar.addEventListener('qSelect', (e) => {
    console.log('Selected menu item:', e.detail.value);
    sidebar.value = e.detail.value;
  });
</script>
```

### Overlay Slide-Out Drawer (Drawer Mode)
```html
<q-button id="open-btn">Open Settings</q-button>

<q-sidepanel id="settings-drawer" variant="drawer" side="right" panel-size="360px">
  <h2 slot="header">Settings</h2>
  <div>
    <p>Configure game options and hotkeys below.</p>
    <q-button variant="primary">Save Configuration</q-button>
  </div>
</q-sidepanel>

<script>
  const drawer = document.getElementById('settings-drawer');
  
  document.getElementById('open-btn').addEventListener('click', () => {
    drawer.open = true;
  });

  drawer.addEventListener('qClose', () => {
    drawer.open = false;
  });
</script>
```
