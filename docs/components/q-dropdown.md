# 🧩 Component Specification: `q-dropdown`

> Contract note: see [Current public contracts](./current-contracts.md#q-dropdown) and the [generated API](../../src/components/inputs/dropdown/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

The `<q-dropdown>` is a custom select dropdown menu. It allows selecting from a structured list of option objects. To render correctly in Unreal Engine's Off-Screen Rendering (OSR) environment, it avoids native HTML select overlays, drawing the menu layout directly inside the Webview canvas using custom Shadow DOM elements. It supports keyboard navigation, search filtering, dynamic sizing, and infinite scroll pagination.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `value` | `value` | `string` | `""` | The value of the currently selected option. Mutable. |
| `label` | `label` | `string` | `undefined` | Header label text displayed above the dropdown container. |
| `ariaLabel` | `aria-label` | `string` | `undefined` | Accessible name forwarded to the trigger and option list. |
| `placeholder` | `placeholder` | `string` | `"Select an option..."` | Helper text displayed in the trigger box when no option is selected. |
| `options` | `options` | `(Option \| string)[] \| string` | `[]` | Strings use the same label and value; objects allow separate values. The attribute accepts JSON. |
| `disabled` | `disabled` | `boolean` | `false` | Reflects disabled state. Locks interactions and dropdown toggle. |
| `size` | `size` | `"lg" \| "md" \| "sm"` | `'md'` | Reflects the component layout size variant. |
| `searchable` | `searchable` | `boolean` | `false` | Enables an input search box inside the dropdown menu to filter options. |

---

## 2. Slots

None

---

## 3. Events

*   `qChange`: Emitted when selection changes. Passes the selected `value` (`string`).
*   `qSelect`: Emitted simultaneously. Passes the full selected `Option` object (`{ label: string; value: string; }`).

---

## 4. Visual Variants

*   **Size Layouts**: Supports `sm` (small, dynamic width calculated inline to prevent layout shift), `md` (standard full-width), and `lg` (large, prominent layout).
*   **Standby state (Closed)**: Displays the clickable trigger box showing the active choice (or placeholder) and a trailing chevron icon.
*   **Open state**: Displays the dropdown menu as an absolute overlay directly below the trigger, rotating the chevron 180 degrees.
*   **Searchable Mode**: Displays an inline input field at the top of the menu, allowing users to type and filter options in real time.
*   **Item Selection & Focus**: Selected items show a colored left border and bold text. Active focused item (keyboard hover) changes its background to `--q-color-primary`.
*   **Infinite Scroll Pagination**: The options list features a scroll container that loads items in batches of 20. Reaching the bottom triggers a loading spinner and appends next batch of items.
*   **Disabled State**: Trigger box drops to `0.6` opacity, pointer events are blocked, and click menu toggling is locked.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family, inherit`.
*   **Header Label**:
    *   Font size: `var(--q-font-size-sm, 0.7rem)` (Varies: `var(--q-font-size-xs, 0.75rem)` in `sm` and `var(--q-font-size-base, 1rem)` in `lg`).
    *   Font weight: `var(--q-font-weight-bold, 700)`.
    *   Color: `var(--q-fg-muted, #9ca3af)`.
*   **Active Trigger & Option Items**:
    *   Font size: `var(--q-font-size-base, 1rem)` (Varies: `var(--q-font-size-sm, 0.7rem)` in `sm` and `var(--q-font-size-lg, 1.125rem)` in `lg`).
    *   Font weight: `var(--q-font-weight-normal, 400)`.
    *   Color: `var(--q-fg-base, #f9fafb)`.
    *   Line-height: `1.2`.
*   **Selected Option Text**:
    *   Font weight: `var(--q-font-weight-bold, 700)`.
*   **Muted Placeholder**:
    *   Color: `var(--q-fg-muted, #9ca3af)` with lower opacity.

---

## 6. CSS Variable Mapping

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-font-family` | `inherit` | Main font family used in label, trigger text, and menu item texts. |
| `--q-font-size-xs` | `0.75rem` | Font size used for label in `sm` variant. |
| `--q-font-size-sm` | `0.7rem` | Font size used for label in `md` variant, and item text in `sm` variant. |
| `--q-font-size-base` | `1rem` | Font size used for item text in `md` variant and label in `lg` variant. |
| `--q-font-size-lg` | `1.125rem` | Font size used for item text in `lg` variant. |
| `--q-font-weight-bold` | `700` | Font weight used for labels and selected option items. |
| `--q-font-weight-normal` | `400` | Font weight used for option item text. |
| `--q-fg-muted` | `#9ca3af` | Colors labels, chevrons, placeholders, loading text, and search borders. |
| `--q-fg-base` | `#f9fafb` | Color of active trigger text, search input text, and menu item text. |
| `--q-dropdown-bg` | `var(--q-bg-surface-2, #374151)` | Trigger box background color. |
| `--q-dropdown-border` | `var(--q-border, 1px solid var(--q-border-color, #4b5563))` | Border outline styles for trigger box and dropdown menu. |
| `--q-dropdown-radius` | `var(--q-radius-md, 8px)` | Rounded corner radius for trigger box and dropdown menu. |
| `--q-dropdown-padding` | `var(--q-field-padding, 10px 14px)` | Inside padding for trigger box and menu options. |
| `--q-dropdown-menu-bg` | `var(--q-bg-surface-3, #4b5563)` | Background color for overlay option menu. |
| `--q-dropdown-border-color` | `var(--q-border-color, #4b5563)` | Border color dividing search section and options. |
| `--q-color-primary` | `#60a5fa` | Accent color for selected option highlights and keyboard hover. |
| `--q-shadow-medium` | `0 8px 16px rgba(0,0,0,0.3)` | Shadow overlay under the absolute dropdown menu. |
| `--q-transition-fast` | `150ms ease` | Animation transition duration for chevron rotation and hover effects. |
| `--q-bg-surface-2` | `#374151` | Background color for the search input box. |
| `--q-radius-sm` | `4px` | Border radius for search input box. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **No Native HTML `<select>` elements**: Native select elements attempt to open OS-level popover containers which fail to render or detach in Off-Screen Rendering (OSR) modes. Custom buttons and overlay `<ul>` lists are drawn directly into the DOM to fix compatibility.
*   **Search Box Focus Capturing**: When `searchable="true"` is set, focus is dynamically routed to the nested `<input>` using `requestAnimationFrame`. This guarantees that keystrokes bridge properly from Unreal Engine's input handlers.
*   **Backdrop-Filter Warnings**: The popup menu does not apply `backdrop-filter` or blur styles. Falling back to solid backgrounds (`--q-dropdown-menu-bg` Surface-3) prevents OSR rendering thread crashes or black blocks.
*   **Keyboard Handling Support**: The component implements a custom WAI-ARIA compliant listbox key down handler (supporting `ArrowDown`, `ArrowUp`, `Enter`, `Space`, `Escape`, `Home`, `End`, and `Tab`) ensuring accessibility and gamepad routing.

---

## 9. Developer Guidelines & Examples

### Example 1: Standard Dropdown using JavaScript Options Array
```html
<q-dropdown id="dropdown-country" label="Select Country" placeholder="Select destination..."></q-dropdown>

<script>
  const dropdown = document.getElementById('dropdown-country');
  dropdown.options = [
    { label: 'United States', value: 'US' },
    { label: 'Germany', value: 'DE' },
    { label: 'South Africa', value: 'ZA' }
  ];
  
  dropdown.addEventListener('qChange', (e) => {
    console.log('Selected country code:', e.detail);
  });
</script>
```

For simple options, use strings; each string becomes both the visible label and emitted value:

```html
<q-dropdown id="status" label="Status"></q-dropdown>
<script>
  document.getElementById('status').options = ['Draft', 'Published', 'Archived'];
</script>
```

### Example 2: Searchable Dropdown with inline JSON string options
```html
<q-dropdown 
  label="Select Language" 
  searchable
  options='[{"label":"English","value":"EN"},{"label":"Spanish","value":"ES"},{"label":"French","value":"FR"},{"label":"Japanese","value":"JA"}]'
  value="EN">
</q-dropdown>
```

### Example 3: Small Inline Dropdown
```html
<div style="display: flex; align-items: center; gap: 8px;">
  <span>Filter by:</span>
  <q-dropdown 
    size="sm" 
    placeholder="Priority" 
    options='[{"label":"High","value":"H"},{"label":"Medium","value":"M"},{"label":"Low","value":"L"}]'>
  </q-dropdown>
</div>
```
