import { h } from '@stencil/core';

import { getDataTableCellSlotName } from '../data-table-cell';
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
        model.rows.flatMap(row =>
          row.startsGroup && row.group ? [renderDataTableGroupRow(row, model.columnSpan), renderDataTableRow(row, options)] : [renderDataTableRow(row, options)],
        )
      )}
    </tbody>
  );
}

function renderDataTableGroupRow(row: DataTableRowModel, columnSpan: number) {
  if (!row.group) return null;

  return (
    <tr key={`group:${row.renderKey}`} class="row-group" role="row" aria-label={row.group.label}>
      <td class="row-group-cell" colSpan={columnSpan} role="gridcell">
        {row.group.label}
      </td>
    </tr>
  );
}

function renderDataTableRow(row: DataTableRowModel, options: RenderDataTableBodyOptions) {
  const { model } = options;

  return (
    <tr
      key={row.renderKey}
      class={{
        'row-el': true,
        'is-clickable': model.rowClickable,
        'is-selected': row.selected,
      }}
      tabindex={model.rowClickable ? '0' : undefined}
      role="row"
      aria-selected={row.selected ? 'true' : 'false'}
      onClick={model.rowClickable ? event => options.onRowClick(row.item, row.index, event) : undefined}
      onKeyDown={model.rowClickable ? event => options.onRowKeyDown(row.item, row.index, event) : undefined}
    >
      {model.selectable && (
        <td key="selection" class="cell-selection" role="gridcell">
          <input
            type="checkbox"
            class="checkbox-input"
            checked={row.selected}
            onChange={event => options.onRowCheckboxChange(row.item, row.index, event)}
            aria-label={`Select row ${row.index + 1}`}
          />
        </td>
      )}
      {model.columns.map(columnModel => (
        <td key={columnModel.renderKey} class={columnModel.column.className || ''} part="cell" role="gridcell">
          <slot name={getDataTableCellSlotName(columnModel.identity, row.identity)}>
            {options.renderCell(row.item, columnModel.column)}
          </slot>
        </td>
      ))}
      {renderDataTableRowActions({
        actions: model.rowActions,
        item: row.item,
        index: row.index,
        onRowAction: (action, event) => options.onRowAction(row.item, row.index, action, event),
      })}
    </tr>
  );
}
