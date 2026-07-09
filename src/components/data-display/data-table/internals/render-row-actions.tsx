import { h } from '@stencil/core';

import type { DataTableRowAction } from '../data-table.types';

export interface RenderDataTableRowActionsOptions {
  actions: DataTableRowAction[];
  onRowAction: (action: DataTableRowAction, event: MouseEvent) => void;
}

export function renderDataTableRowActions(options: RenderDataTableRowActionsOptions) {
  if (options.actions.length === 0) return null;

  return (
    <td class="cell-actions" role="gridcell">
      <div class="row-actions">
        {options.actions.map(action => (
          <q-button
            key={action.key}
            variant="ghost"
            size="sm"
            iconOnly={true}
            ariaLabel={action.tooltip}
            onClick={(event: MouseEvent) => options.onRowAction(action, event)}
          >
            <q-icon slot="icon-left" name={action.icon} size="sm" />
            <q-tooltip slot="icon-left" position="top" content={action.tooltip} />
          </q-button>
        ))}
      </div>
    </td>
  );
}
