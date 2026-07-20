'use client';

import type { EventName, StencilReactComponent } from '@stencil/react-output-target/runtime';
import { createComponent } from '@stencil/react-output-target/runtime';
import {
  getDataTableCellSlotName,
  getDataTableCellValue,
  getDataTableItemKey,
  identifyItems,
  type DataTableCellContext,
  type QDataTableCustomEvent,
  type QDataTableRowActionDetail,
  type QDataTableRowClickDetail,
  type QDataTableSelectionChangeDetail,
  type QDataTableSortChangeDetail,
  type TableColumn,
} from '@webquark/core';
import type { Components } from '@webquark/core/dist/components';
import {
  QDataTable as QDataTableElement,
  defineCustomElement as defineQDataTable,
} from '@webquark/core/dist/components/q-data-table.js';
import React from 'react';

export type QDataTableEvents = {
  onQRowClick: EventName<QDataTableCustomEvent<QDataTableRowClickDetail>>;
  onQRowAction: EventName<QDataTableCustomEvent<QDataTableRowActionDetail>>;
  onQSelectionChange: EventName<QDataTableCustomEvent<QDataTableSelectionChangeDetail>>;
  onQSearch: EventName<QDataTableCustomEvent<string>>;
  onQSortChange: EventName<QDataTableCustomEvent<QDataTableSortChangeDetail>>;
};

const QDataTableElementComponent: StencilReactComponent<
  QDataTableElement,
  QDataTableEvents,
  Components.QDataTable
> = createComponent<QDataTableElement, QDataTableEvents, Components.QDataTable>({
  tagName: 'q-data-table',
  elementClass: QDataTableElement,
  react: React,
  events: {
    onQRowClick: 'qRowClick',
    onQRowAction: 'qRowAction',
    onQSelectionChange: 'qSelectionChange',
    onQSearch: 'qSearch',
    onQSortChange: 'qSortChange',
  } as QDataTableEvents,
  defineCustomElement: defineQDataTable,
});

type QDataTableElementProps = React.ComponentProps<typeof QDataTableElementComponent>;

export interface QDataTableColumn<T = unknown> extends TableColumn<T> {
  cell?: (context: DataTableCellContext<T>) => React.ReactNode;
}

export type QDataTableProps<T = unknown> = Omit<
  QDataTableElementProps,
  'columns' | 'items' | 'keyField'
> & {
  columns?: QDataTableColumn<T>[] | string;
  items?: T[] | string;
  keyField?: string;
};

function QDataTableRender<T>(
  {
    columns = [],
    items = [],
    keyField = 'id',
    children,
    ...tableProps
  }: QDataTableProps<T>,
  ref: React.ForwardedRef<QDataTableElement>,
): React.ReactElement {
  const parsedItems = React.useMemo(() => parseItems<T>(items), [items]);
  const parsedColumns = Array.isArray(columns) ? columns : [];
  const coreColumns = React.useMemo(
    () =>
      Array.isArray(columns)
        ? columns.map(({ cell: _cell, ...column }) => column)
        : columns,
    [columns],
  );
  const identifiedRows = identifyItems(
    parsedItems,
    (row, rowIndex) =>
      getDataTableItemKey(row, rowIndex, keyField),
    { warningContext: 'q-data-table React rows' },
  );
  const identifiedColumns = identifyItems(
    parsedColumns,
    column => column.key,
    { warningContext: 'q-data-table React columns' },
  );

  return (
    <QDataTableElementComponent
      {...tableProps}
      ref={ref}
      columns={coreColumns as Components.QDataTable['columns']}
      items={items}
      keyField={keyField}
    >
      {identifiedRows.flatMap(rowEntry =>
        identifiedColumns.flatMap(columnEntry => {
          const row = rowEntry.item;
          const rowIndex = rowEntry.index;
          const column = columnEntry.item;
          if (!column.cell) return [];

          const slotName = getDataTableCellSlotName(
            columnEntry.identity,
            rowEntry.identity,
          );

          return [
            <span key={slotName} slot={slotName} style={{ display: 'contents' }}>
              {column.cell({
                row,
                value: getDataTableCellValue(row, column.key),
                rowIndex,
                column,
              })}
            </span>,
          ];
        }),
      )}
      {children}
    </QDataTableElementComponent>
  );
}

export const QDataTable = React.forwardRef(QDataTableRender) as <T = unknown>(
  props: QDataTableProps<T> & React.RefAttributes<QDataTableElement>,
) => React.ReactElement;

function parseItems<T>(items: T[] | string): T[] {
  if (Array.isArray(items)) return items;

  try {
    const parsed: unknown = JSON.parse(items);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
