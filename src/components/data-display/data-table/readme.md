# q-data-table

`q-data-table` accepts framework-rendered cell content through generated named slots.
Use `getDataTableCellSlotName(columnKey, rowKey)` when working directly with the
custom element. Angular and React consumers should use the framework APIs from
`@webquark/angular` and `@webquark/react`.

Rich cells require a stable value in `keyField` (the default is `id`) so projected
content remains attached to the correct row while rows are sorted or refreshed.

Set `two-line-rows` to reserve two lines in every data cell. Plain text wraps up
to two lines with ellipsis. Set `overflowTooltip: true` on selected columns to
expose truncated plain text in a tooltip on hover and keyboard focus. Fitting
text gains no tooltip or keyboard stop. Rich slots keep their own controls and tooltips and
must fit the reserved content height. Leave this option off for tall forms,
expanded rows, or bespoke layouts. Existing tables retain automatic row sizing.

The content height defaults to `2lh`, using `--q-table-cell-line-height` (default
`1.5`), plus the existing cell padding. Override `--q-table-cell-content-height`
when a consistent rich-cell layout needs additional room. The option uses fixed
column layout, so provide column widths where their proportions matter.

Columns support `sticky: 'start'` for a left-pinned identity column.
`cellClassName` accepts either a class string or a callback that returns classes
for each row. Column and cell classes are also exposed as CSS shadow parts, so
consumers can style column alignment and row-specific states with selectors such as
`q-data-table::part(is-warning)`.

Rows, columns, row-group dividers, row actions, and rich cells use Collection
Identity. Valid unique identities preserve unchanged DOM and framework resources.
Missing, invalid, or duplicate identities warn and use a deterministic fallback,
but stable reuse is not guaranteed for those fallback items.


## CSS Custom Properties

| Name                         | Description                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| `--q-table-dropdown-bg`      | Background color forwarded to slotted q-dropdown controls.     |
| `--q-table-dropdown-border`  | Border style forwarded to slotted q-dropdown controls.         |
| `--q-table-dropdown-fg`      | Foreground color forwarded to slotted q-dropdown controls.     |
| `--q-table-dropdown-menu-bg` | Menu background color forwarded to slotted q-dropdown controls. |
| `--q-table-dropdown-primary` | Primary color forwarded to slotted q-dropdown controls.        |
| `--q-table-max-height`       | Maximum height for the scrollable table area.                  |
| `--q-table-sticky-column-bg` | Background color for body cells in a sticky start column.      |
| `--q-table-sticky-column-hover-bg` | Background color for sticky start cells in a hovered row. |
| `--q-table-sticky-column-selected-bg` | Background color for sticky start cells in a selected row. |
| `--q-table-sticky-column-selected-hover-bg` | Background color for sticky start cells in a selected, hovered row. |
| `--q-table-toolbar-padding-inline-end` | Inline-end padding for the toolbar. Defaults to `16px`. |


<!-- Auto Generated Below -->


## Overview

Data grid with optional toolbar, search, row activation, and multi-row selection.

## Properties

| Property            | Attribute            | Description                                                                                 | Type                                         | Default       |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------- |
| `ariaLabel`         | `aria-label`         | Accessible name for the grid; falls back to `toolbarTitle`, then "Data table".              | `string`                                     | `null`        |
| `columns`           | `columns`            | Column definitions or a JSON-encoded array.                                                 | `TableColumn<unknown>[] \| string`           | `[]`          |
| `items`             | `items`              | Row data or a JSON-encoded array.                                                           | `string \| unknown[]`                        | `[]`          |
| `keyField`          | `key-field`          | Row field used as the stable selection and render key. Falls back to the row index.         | `string`                                     | `'id'`        |
| `loading`           | `loading`            | Shows a loading state and suppresses row rendering while true.                              | `boolean`                                    | `false`       |
| `rowActions`        | `row-actions`        | Row actions rendered as trailing icon buttons.                                              | `DataTableRowAction<unknown>[] \| string`    | `[]`          |
| `rowClickable`      | `row-clickable`      | Enables full-row click and keyboard activation.                                             | `boolean`                                    | `true`        |
| `rowGroup`          | --                   | Inserts a divider whenever the returned group key changes.                                  | `T`                                          | `undefined`   |
| `rowGutter`         | `row-gutter`         | Structural leading cell: blank by default, numbers, custom row slots, or none.              | `"blank" \| "custom" \| "none" \| "numbers"` | `'blank'`     |
| `rowNumberOffset`   | `row-number-offset`  | Numbering offset; invalid, negative or non-safe-integer values fall back to zero.           | `number`                                     | `0`           |
| `searchPlaceholder` | `search-placeholder` |                                                                                             | `string`                                     | `'Search...'` |
| `searchValue`       | `search-value`       |                                                                                             | `string`                                     | `''`          |
| `selectable`        | `selectable`         | Enables row selection checkboxes and selection state.                                       | `boolean`                                    | `false`       |
| `selectedKeys`      | --                   |                                                                                             | `unknown[]`                                  | `[]`          |
| `showSearch`        | `show-search`        |                                                                                             | `boolean`                                    | `false`       |
| `showToolbar`       | `show-toolbar`       |                                                                                             | `boolean`                                    | `false`       |
| `sortColumn`        | `sort-column`        |                                                                                             | `string`                                     | `undefined`   |
| `sortDirection`     | `sort-direction`     |                                                                                             | `"asc" \| "desc"`                            | `undefined`   |
| `sortMode`          | `sort-mode`          | `table` sorts locally; `external` only emits sort changes.                                  | `"external" \| "table"`                      | `'table'`     |
| `sortable`          | `sortable`           | Enables sortable column headers. Columns can override this with their own sortable setting. | `boolean`                                    | `false`       |
| `toolbarTitle`      | `toolbar-title`      |                                                                                             | `string`                                     | `undefined`   |
| `twoLineRows`       | `two-line-rows`      | Reserves two text lines per data cell; rich cells must fit the same content height.         | `boolean`                                    | `false`       |


## Events

| Event              | Description                                                                        | Type                                                    |
| ------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `qRowAction`       |                                                                                    | `CustomEvent<QDataTableRowActionDetail<unknown>>`       |
| `qRowClick`        | Emitted when a non-interactive row area is clicked or activated with the keyboard. | `CustomEvent<QDataTableRowClickDetail<unknown>>`        |
| `qSearch`          |                                                                                    | `CustomEvent<string>`                                   |
| `qSelectionChange` |                                                                                    | `CustomEvent<QDataTableSelectionChangeDetail<unknown>>` |
| `qSortChange`      |                                                                                    | `CustomEvent<QDataTableSortChangeDetail>`               |


## Slots

| Slot                          | Description                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| `"actions"`                   | Action controls displayed in the right toolbar group.              |
| `"empty"`                     | Empty-state content shown when no rows are available.              |
| `"filters"`                   | Filter controls displayed in the left toolbar group.               |
| `"footer"`                    | Footer content rendered below the scrollable table.                |
| `"q-data-table-cell-*"`       | Framework adapter cell content keyed by column and stable row key. |
| `"q-data-table-row-gutter-*"` | Custom row gutter content keyed by stable row identity.            |
| `"toolbar-left"`              | Content placed before the search and filters area.                 |


## Dependencies

### Depends on

- [q-progress](../../indicators/progress)
- [q-tooltip](../../overlays/tooltip)
- [q-button](../../actions/button)
- [q-icon](../../media/icon)
- [q-input](../../inputs/input)

### Graph
```mermaid
graph TD;
  q-data-table --> q-progress
  q-data-table --> q-tooltip
  q-data-table --> q-button
  q-data-table --> q-icon
  q-data-table --> q-input
  q-button --> q-icon
  style q-data-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
