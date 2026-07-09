import { h } from '@stencil/core';

import type { DataTableItem, DataTableRowAction } from '../data-table.types';

export interface RenderDataTableRowActionsOptions {
  actions: DataTableRowAction[];
  item: DataTableItem;
  index: number;
  onRowAction: (action: DataTableRowAction, event: MouseEvent) => void;
}

export function renderDataTableRowActions(options: RenderDataTableRowActionsOptions) {
  if (options.actions.length === 0) return null;

  return (
    <td class="cell-actions" role="gridcell">
      <div class="row-actions">
        {options.actions.map(action => {
          const disabled = isDataTableRowActionDisabled(action, options.item, options.index);

          return (
            <q-button
              key={action.key}
              variant="text"
              size="sm"
              iconOnly={true}
              disabled={disabled}
              ariaLabel={action.tooltip}
              onClick={disabled ? undefined : (event: MouseEvent) => options.onRowAction(action, event)}
            >
              <q-icon slot="icon-left" name={action.icon} size="sm" />
              <q-tooltip slot="icon-left" position="top" content={action.tooltip} />
            </q-button>
          );
        })}
      </div>
    </td>
  );
}

function isDataTableRowActionDisabled(action: DataTableRowAction, item: DataTableItem, index: number): boolean {
  if (typeof action.disabled === 'function') {
    try {
      return action.disabled(item, index, action);
    } catch (error) {
      console.error('QDataTable: Row action disabled function failed', error);
      return false;
    }
  }

  return action.disabled === true;
}
