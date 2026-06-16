# 🧩 Component Specification: `q-data-table`

The `<q-data-table>` is a robust data grid component designed for rendering large tabular datasets. It supports row selection, inline search, custom column templates, loading overlays, empty states, and standard navigation layouts. It is fully optimized for performant keyboard accessibility and rendering inside Unreal Engine CEF webviews.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `columns` | `columns` | `TableColumn[] \| string` | `[]` | Array of column blueprints or a JSON string. |
| `items` | `items` | `any[] \| string` | `[]` | Array of row data objects or a JSON string. |
| `loading` | `loading` | `boolean` | `false` | When `true`, displays a loading spinner overlay over the table content. |
| `selectable` | `selectable` | `boolean` | `false` | When `true`, prepends a checkbox column enabling row selection. |
| `selectedKeys` | -- | `any[]` | `[]` | Array of row keys that are currently selected. |
| `keyField` | `key-field` | `string` | `'id'` | The item object field used as the unique identifier key for selection. |
| `showToolbar` | `show-toolbar` | `boolean` | `false` | When `true`, displays the top toolbar container. |
| `toolbarTitle` | `toolbar-title` | `string` | `undefined` | The header text displayed inside the toolbar. |
| `showSearch` | `show-search` | `boolean` | `false` | When `true`, embeds a search input field in the toolbar. |
| `searchPlaceholder` | `search-placeholder` | `string` | `'Search...'` | Input placeholder label for the toolbar search field. |
| `searchValue` | `search-value` | `string` | `''` | Bindable value of the toolbar search input. |

### Column Definition Interface (`TableColumn`)
```typescript
export interface TableColumn {
  key: string;            // The data object path key (supports nested dot notation, e.g., 'user.name')
  header?: string;        // Column title. Falls back to capitalized key.
  width?: string;         // Custom CSS width column constraint (e.g. '120px', '25%')
  className?: string;     // Additional classes applied to cells in this column
  render?: (item: any, column: TableColumn) => any; // Custom render function for dynamic content
}
```

---

## 2. Slots

*   `toolbar-left`: Additional actions on the left side of the toolbar (after title).
*   `filters`: Additional filter controls inside the toolbar.
*   `actions`: Quick action controls on the right side of the toolbar.
*   `empty`: Custom empty state layout shown when `items` is empty.
*   `footer`: Custom pagination/footer panel at the bottom of the table.

---

## 3. Events

*   `qRowClick`: Emitted when a row is clicked (excluding interactive child button clicks). Payload: `{ item: any; index: number; originalEvent: KeyboardEvent | MouseEvent }`.
*   `qSelectionChange`: Emitted when row selections change. Payload: `{ selectedKeys: any[]; selectedItems: any[] }`.
*   `qSearch`: Emitted when the user types into the toolbar search input. Payload: `string`.

---

## 4. Visual Variants

The data table supports state transitions and custom layouts:

### Variant A: Row Selection Mode (`selectable="true"`)
*   Prepends selection check columns. Rows feature selected background blends (`.is-selected`) using `--q-color-primary` color mixes.
*   The header checkbox supports the `indeterminate` state when some, but not all, rows are selected.

### Variant B: Toolbar & Search Integrations
*   Enabling `showToolbar` wraps search fields (`q-input`) and custom slot controls into a unified dashboard header.
*   Includes built-in SVG magnifying glass indicators.

### Variant C: Loading Overlay
*   When `loading="true"`, a full container overlay (`.table-loading-overlay`) is drawn directly over the table body.
*   Embeds a small `<q-circular-progress>` spinner.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family` (e.g., system font).
*   **Header Cells (`<th>`)**:
    *   Font size: `--q-font-size-xs` (e.g., `0.7rem`).
    *   Font weight: `--q-font-weight-bold` (e.g., `700`).
    *   Casing: Uppercase (`text-transform: uppercase`).
    *   Letter-spacing: `0.05em`.
*   **Row Cells (`<td>`)**:
    *   Font size: `--q-font-size-base` (e.g., `0.9rem`).
    *   Font weight: Normal (`400`).
    *   Color: `--q-fg-base` (defaults to `#f9fafb`).

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-border` | `1px solid var(--q-border-color, #374151)` | Table container outer boundary outline. |
| `--q-border-color` | `#374151` | Default row divider line color. |
| `--q-radius-lg` | `11px` | Corner rounding of the table container card. |
| `--q-bg-base` | `#111827` | Base background color of the table body rows. |
| `--q-bg-surface-1` | `#1f2937` | Background color for table headers and toolbars. |
| `--q-bg-surface-2` | `#374151` | Background color of input checkboxes. |
| `--q-fg-base` | `#f9fafb` | Primary text color. |
| `--q-fg-muted` | `#9ca3af` | Header column and secondary text color. |
| `--q-color-primary` | `#60a5fa` | Selection checkbox fill and selected row hover color. |
| `--q-color-primary-hover`| `#93c5fd` | Confirm states/hover styles. |
| `--q-table-max-height` | `100%` | Vertical scrollable viewport constraint boundary. |
| `--q-padding-md` | `12px 16px` | Vertical and horizontal table cell padding. |
| `--q-padding-lg` | `16px` | Spacing padding inside toolbars and empty slot cells. |
| `--q-transition-fast` | `150ms ease` | State transition timing for hovers and checkboxes. |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-data-table',
  styleUrl: 'q-data-table.css',
  shadow: true,
})
export class QDataTable {
  @Element() el!: HTMLElement;

  @Prop() columns: TableColumn[] | string = [];
  @Prop() items: any[] | string = [];
  @Prop() loading: boolean = false;
  @Prop() selectable: boolean = false;
  @Prop({ mutable: true }) selectedKeys: any[] = [];
  @Prop() keyField: string = 'id';
  @Prop() showToolbar: boolean = false;
  @Prop() toolbarTitle?: string;
  @Prop() showSearch: boolean = false;
  @Prop() searchPlaceholder: string = 'Search...';
  @Prop({ mutable: true }) searchValue: string = '';

  @Event() qRowClick!: EventEmitter<{ item: any; index: number; originalEvent: MouseEvent | KeyboardEvent }>;
  @Event() qSelectionChange!: EventEmitter<{ selectedKeys: any[]; selectedItems: any[] }>;
  @Event() qSearch!: EventEmitter<string>;

  render() {
    const columns = this.getParsedColumns();
    const items = this.getParsedItems();
    const { checked, indeterminate } = this.getSelectionState();
    const currentKeys = this.selectedKeys || [];

    return (
      <div class="table-container" role="grid">
        {this.showToolbar && (
          <div class="table-toolbar">
            <div class="toolbar-left">
              {this.toolbarTitle && <span class="toolbar-title">{this.toolbarTitle}</span>}
              <slot name="toolbar-left" />
              {this.showSearch && (
                <q-input
                  class="search-input"
                  placeholder={this.searchPlaceholder}
                  value={this.searchValue}
                  onQInput={this.handleSearchInput}
                  size="sm"
                >
                  <svg slot="prefix" class="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </q-input>
              )}
              <slot name="filters" />
            </div>
            <div class="toolbar-right">
              <slot name="actions" />
            </div>
          </div>
        )}
        <div class="table-scroll-area">
          <table class="table-el">
            <thead>
              <tr role="row">
                {this.selectable && (
                  <th class="col-selection" role="columnheader">
                    <input
                      type="checkbox"
                      class="checkbox-input"
                      checked={checked}
                      ref={el => { if (el) el.indeterminate = indeterminate; }}
                      onChange={e => this.toggleAllSelection(e)}
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map(col => (
                  <th style={col.width ? { width: col.width } : {}} class={col.className || ''} role="columnheader">
                    {this.getHeaderLabel(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {this.loading ? (
                <tr role="row">
                  <td colSpan={columns.length + (this.selectable ? 1 : 0)} class="loading-placeholder-cell" role="gridcell" />
                </tr>
              ) : items.length === 0 ? (
                <tr role="row">
                  <td colSpan={columns.length + (this.selectable ? 1 : 0)} class="empty-cell" role="gridcell">
                    <slot name="empty">No data available</slot>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const key = this.getItemKey(item, index);
                  const isSelected = currentKeys.includes(key);

                  return (
                    <tr
                      key={key}
                      class={{ 'row-el': true, 'is-selected': isSelected }}
                      tabindex="0"
                      role="row"
                      aria-selected={isSelected ? 'true' : 'false'}
                      onClick={e => this.handleRowClick(item, index, e)}
                      onKeyDown={e => this.handleRowKeyDown(item, index, e)}
                    >
                      {this.selectable && (
                        <td class="cell-selection" role="gridcell">
                          <input
                            type="checkbox"
                            class="checkbox-input"
                            checked={isSelected}
                            onChange={e => this.toggleRowSelection(item, index, e)}
                            aria-label={`Select row ${index + 1}`}
                          />
                        </td>
                      )}
                      {columns.map(col => (
                        <td class={col.className || ''} role="gridcell">
                          {this.renderCell(item, col)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {this.loading && (
            <div class="table-loading-overlay">
              <q-circular-progress indeterminate={true} size="sm" />
            </div>
          )}
        </div>
        <slot name="footer" />
      </div>
    );
  }
}
```

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **No Backdrop Blur Filters**: The `.table-loading-overlay` avoids `backdrop-filter` rules, drawing an opaque backdrop color (`var(--q-bg-base, #111827)`) to cover rows and prevent rendering crashes in Unreal OSR.
*   **Performance Optimization (DOM Nodes)**: The scrollable view utilizes a standard native `<table>` construct inside `.table-scroll-area`, avoiding thousands of heavy absolute nested `div` containers. This reduces DOM node counts and composite repaints inside CEF.
*   **Checkbox Inputs**: Utilizes standard HTML `<input type="checkbox">` elements. Focus ring styling relies on standard outlines which are supported inside OSR.
*   **Nested Components**: Table depends on `<q-input>` (search) and `<q-circular-progress>` (loading) which must be registered and whitelisted.

---

## 9. Developer Guidelines & Examples

### Basic Static Data Table
```html
<q-data-table id="users-table"></q-data-table>

<script>
  const table = document.getElementById('users-table');
  table.columns = [
    { key: 'name', header: 'User Name' },
    { key: 'role', header: 'System Role', className: 'text-muted' },
    { key: 'status', header: 'Account Status' }
  ];
  table.items = [
    { id: 1, name: 'Alice Smith', role: 'Administrator', status: 'Active' },
    { id: 2, name: 'Bob Johnson', role: 'Developer', status: 'Offline' }
  ];
</script>
```

### Full-Featured Selectable & Searchable Grid
```html
<q-data-table 
  id="devices-grid" 
  show-toolbar="true" 
  toolbar-title="Connected Devices" 
  show-search="true" 
  selectable="true"
></q-data-table>

<script>
  const grid = document.getElementById('devices-grid');
  grid.columns = [
    { key: 'id', header: 'ID', width: '60px' },
    { key: 'device', header: 'Device' },
    { key: 'ip', header: 'IP Address' },
    { 
      key: 'actions', 
      header: 'Actions', 
      render: (item) => `<button onclick="alert('Pinging ${item.ip}')">Ping</button>`
    }
  ];
  grid.items = [
    { id: 'dev-01', device: 'Main Router', ip: '192.168.1.1' },
    { id: 'dev-02', device: 'Workstation', ip: '192.168.1.50' }
  ];

  grid.addEventListener('qSelectionChange', (e) => {
    console.log('Selected Keys:', e.detail.selectedKeys);
  });

  grid.addEventListener('qSearch', (e) => {
    console.log('User searched for:', e.detail);
  });
</script>
```
