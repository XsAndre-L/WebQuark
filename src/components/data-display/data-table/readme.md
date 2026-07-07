# q-data-table



## CSS Custom Properties

| Name                         | Description                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| `--q-table-dropdown-bg`      | Background color forwarded to slotted q-dropdown controls.     |
| `--q-table-dropdown-border`  | Border style forwarded to slotted q-dropdown controls.         |
| `--q-table-dropdown-fg`      | Foreground color forwarded to slotted q-dropdown controls.     |
| `--q-table-dropdown-menu-bg` | Menu background color forwarded to slotted q-dropdown controls. |
| `--q-table-dropdown-primary` | Primary color forwarded to slotted q-dropdown controls.        |
| `--q-table-max-height`       | Maximum height for the scrollable table area.                  |


<!-- Auto Generated Below -->


## Overview

Data grid with optional toolbar, search, row activation, and multi-row selection.

## Properties

| Property            | Attribute            | Description                                                                         | Type                           | Default       |
| ------------------- | -------------------- | ----------------------------------------------------------------------------------- | ------------------------------ | ------------- |
| `columns`           | `columns`            | Column definitions, or a JSON string of column definitions.                         | `TableColumn<any>[] \| string` | `[]`          |
| `items`             | `items`              | Row data, or a JSON string of row data.                                             | `any[] \| string`              | `[]`          |
| `keyField`          | `key-field`          | Row field used as the stable selection and render key. Falls back to the row index. | `string`                       | `'id'`        |
| `loading`           | `loading`            | Shows a loading state and suppresses row rendering while true.                      | `boolean`                      | `false`       |
| `searchPlaceholder` | `search-placeholder` | Placeholder text for the built-in search input.                                     | `string`                       | `'Search...'` |
| `searchValue`       | `search-value`       | Current search input value.                                                         | `string`                       | `''`          |
| `selectable`        | `selectable`         | Enables row selection checkboxes and selection state.                               | `boolean`                      | `false`       |
| `selectedKeys`      | --                   | Keys for currently selected rows.                                                   | `any[]`                        | `[]`          |
| `showSearch`        | `show-search`        | Shows the built-in toolbar search input.                                            | `boolean`                      | `false`       |
| `showToolbar`       | `show-toolbar`       | Shows the optional toolbar above the table.                                         | `boolean`                      | `false`       |
| `toolbarTitle`      | `toolbar-title`      | Title text rendered in the toolbar.                                                 | `string`                       | `undefined`   |


## Events

| Event              | Description                                                                        | Type                                                |
| ------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------- |
| `qRowClick`        | Emitted when a non-interactive row area is clicked or activated with the keyboard. | `CustomEvent<QDataTableRowClickDetail<any>>`        |
| `qSearch`          | Emitted when the built-in search input value changes.                              | `CustomEvent<string>`                               |
| `qSelectionChange` | Emitted when selected rows change.                                                 | `CustomEvent<QDataTableSelectionChangeDetail<any>>` |


## Slots

| Slot             | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `"actions"`      | Action controls displayed in the right toolbar group. |
| `"empty"`        | Empty-state content shown when no rows are available. |
| `"filters"`      | Filter controls displayed in the left toolbar group.  |
| `"footer"`       | Footer content rendered below the scrollable table.   |
| `"toolbar-left"` | Content placed before the search and filters area.    |


## Dependencies

### Depends on

- [q-input](../../inputs/input)
- [q-circular-progress](../../indicators/circular-progress)

### Graph
```mermaid
graph TD;
  q-data-table --> q-input
  q-data-table --> q-circular-progress
  style q-data-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
