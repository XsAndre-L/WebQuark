import { h } from '@stencil/core';

import type { DataTableSortDirection } from '../data-table.types';

export interface RenderDataTableSortIndicatorOptions {
  direction?: DataTableSortDirection;
}

export function renderDataTableSortIndicator({ direction }: RenderDataTableSortIndicatorOptions) {
  return (
    <span class="sort-indicator" aria-hidden="true">
      <span class={{ 'sort-arrow': true, 'is-active': direction === 'asc' }}>
        <q-icon name="chevron-up" size="10px" />
      </span>
      <span class={{ 'sort-arrow': true, 'is-active': direction === 'desc' }}>
        <q-icon name="chevron-down" size="10px" />
      </span>
    </span>
  );
}
