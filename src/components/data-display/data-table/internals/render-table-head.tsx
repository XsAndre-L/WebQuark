import { h } from '@stencil/core';

import { getHeaderLabel } from './data-access';
import type { DataTableModel } from './table-model';

export interface RenderDataTableHeadOptions {
  model: DataTableModel;
  onSelectAllChange: (event: Event) => void;
}

export function renderDataTableHead({ model, onSelectAllChange }: RenderDataTableHeadOptions) {
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
          if (column.width) {
            style.width = column.width;
          }

          return (
            <th style={style} class={column.className || ''} role="columnheader">
              {getHeaderLabel(column)}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
