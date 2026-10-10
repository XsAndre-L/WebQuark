import type { DataTableItem, DataTableSortDirection, TableColumn } from '../data-table.types';
import { getNestedValue } from './data-access';

const DATA_TABLE_SORT_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export function isDataTableColumnSortable(column: TableColumn, tableSortable: boolean): boolean {
  return column.sortable ?? tableSortable;
}

export function sortDataTableItems(
  items: DataTableItem[],
  column: TableColumn,
  direction: DataTableSortDirection
): DataTableItem[] {
  const sortPath = column.sortKey || column.key;

  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const valueCompare = compareDataTableSortValues(
        getNestedValue(left.item, sortPath),
        getNestedValue(right.item, sortPath),
        direction
      );

      return valueCompare || left.index - right.index;
    })
    .map(entry => entry.item);
}

function compareDataTableSortValues(leftValue: unknown, rightValue: unknown, direction: DataTableSortDirection): number {
  const left = normalizeDataTableSortValue(leftValue);
  const right = normalizeDataTableSortValue(rightValue);
  const leftMissing = left === undefined;
  const rightMissing = right === undefined;

  if (leftMissing && rightMissing) return 0;
  if (leftMissing) return 1;
  if (rightMissing) return -1;

  const valueCompare = compareNormalizedSortValues(left, right);
  return direction === 'asc' ? valueCompare : -valueCompare;
}

function normalizeDataTableSortValue(value: unknown): number | string | undefined {
  if (value === undefined || value === null) return undefined;

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? undefined : time;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  return String(value);
}

function compareNormalizedSortValues(left: number | string, right: number | string): number {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return DATA_TABLE_SORT_COLLATOR.compare(String(left), String(right));
}
