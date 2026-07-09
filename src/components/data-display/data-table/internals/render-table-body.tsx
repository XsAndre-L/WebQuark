import { h } from '@stencil/core';

import type { DataTableItem, DataTableRowAction, TableColumn } from '../data-table.types';
import { renderDataTableRowActions } from './render-row-actions';
import type { DataTableModel, DataTableRowModel } from './table-model';

export interface RenderDataTableBodyOptions {
  model: DataTableModel;
  loading: boolean;
  onRowClick: (item: DataTableItem, index: number, event: MouseEvent) => void;
  onRowKeyDown: (item: DataTableItem, index: number, event: KeyboardEvent) => void;
  onRowCheckboxChange: (item: DataTableItem, index: number, event: Event) => void;
  onRowAction: (item: DataTableItem, index: number, action: DataTableRowAction, event: MouseEvent) => void;
  renderCell: (item: DataTableItem, column: TableColumn) => unknown;
}

export function renderDataTableBody(options: RenderDataTableBodyOptions) {
  const { model } = options;

  return (
    <tbody>
      {options.loading ? (
        <tr role="row">
          <td colSpan={model.columnSpan} class="loading-placeholder-cell" role="gridcell">
            <div class="table-loading-state">
              <q-circular-progress indeterminate={true} size="sm" />
            </div>
          </td>
        </tr>
      ) : model.items.length === 0 ? (
        <tr role="row">
          <td colSpan={model.columnSpan} class="empty-cell" role="gridcell">
            <slot name="empty">No data available</slot>
          </td>
        </tr>
      ) : (
        model.rows.map(row => renderDataTableRow(row, options))
      )}
    </tbody>
  );
}

function renderDataTableRow(row: DataTableRowModel, options: RenderDataTableBodyOptions) {
  const { model } = options;

  return (
    <tr
      key={row.renderKey}
      class={{
        'row-el': true,
        'is-selected': row.selected,
      }}
      tabindex="0"
      role="row"
      aria-selected={row.selected ? 'true' : 'false'}
      onClick={event => options.onRowClick(row.item, row.index, event)}
      onKeyDown={event => options.onRowKeyDown(row.item, row.index, event)}
    >
      {model.selectable && (
        <td class="cell-selection" role="gridcell">
          <input
            type="checkbox"
            class="checkbox-input"
            checked={row.selected}
            onChange={event => options.onRowCheckboxChange(row.item, row.index, event)}
            aria-label={`Select row ${row.index + 1}`}
          />
        </td>
      )}
      {model.columns.map(column => (
        <td class={column.className || ''} role="gridcell">
          {options.renderCell(row.item, column)}
        </td>
      ))}
      {renderDataTableRowActions({
        actions: model.rowActions,
        onRowAction: (action, event) => options.onRowAction(row.item, row.index, action, event),
      })}
    </tr>
  );
}
