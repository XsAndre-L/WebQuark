import { h } from '@stencil/core';

import type { DataTableSortDirection, TableColumn } from '../data-table.types';
import { getHeaderLabel } from './data-access';
import { renderDataTableSortIndicator } from './render-sort-indicator';
import { isDataTableColumnSortable } from './sort';
import type { DataTableModel } from './table-model';

export interface RenderDataTableHeadOptions {
  model: DataTableModel;
  onSelectAllChange: (event: Event) => void;
  onSortToggle: (column: TableColumn) => void;
}

export function renderDataTableHead({ model, onSelectAllChange, onSortToggle }: RenderDataTableHeadOptions) {
  const { checked, indeterminate } = model.selectionState;

  return (
    <thead>
      <tr role="row">
        {model.selectable && (
          <th class="col-selection" role="columnheader">
            <input
              type="checkbox"
              class="checkbox-input"
              checked={checked}
              ref={el => {
                if (el) el.indeterminate = indeterminate;
              }}
              onChange={event => onSelectAllChange(event)}
              aria-label="Select all rows"
            />
          </th>
        )}
        {model.columns.map(column => {
          const style: Record<string, string> = {};
          const sortable = isDataTableColumnSortable(column, model.sortable);
          const sortDirection = getColumnSortDirection(model, column, sortable);
          const headerClass = [
            column.className || '',
            sortable ? 'is-sortable' : '',
            sortDirection ? 'is-sorted' : '',
          ].filter(Boolean).join(' ');

          if (column.width) {
            style.width = column.width;
          }

          return (
            <th style={style} class={headerClass} role="columnheader" aria-sort={sortable ? getAriaSort(sortDirection) : undefined}>
              {sortable ? (
                <button type="button" class="column-sort-button" onClick={() => onSortToggle(column)}>
                  <span class="column-sort-label">{getHeaderLabel(column)}</span>
                  {renderDataTableSortIndicator({ direction: sortDirection })}
                </button>
              ) : (
                getHeaderLabel(column)
              )}
            </th>
          );
        })}
        {model.hasRowActions && <th class="col-actions" role="columnheader" aria-label="Row actions"></th>}
      </tr>
    </thead>
  );
}

function getColumnSortDirection(model: DataTableModel, column: TableColumn, sortable: boolean): DataTableSortDirection | undefined {
  if (!sortable || model.sortColumn !== column.key) return undefined;
  return model.sortDirection;
}

function getAriaSort(direction: DataTableSortDirection | undefined): 'ascending' | 'descending' | 'none' {
  if (direction === 'asc') return 'ascending';
  if (direction === 'desc') return 'descending';
  return 'none';
}
