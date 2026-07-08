import { safeParseJson } from '../../../../utils/utils';

import type { TableColumn } from '../data-table.types';

export type DataTableItem = unknown;
export type DataTableKey = unknown;

export function parseDataTableColumns(columns: TableColumn[] | string): TableColumn[] {
  return safeParseJson<TableColumn[]>(columns, [], 'QDataTable');
}

export function parseDataTableItems(items: DataTableItem[] | string): DataTableItem[] {
  return safeParseJson<DataTableItem[]>(items, [], 'QDataTable');
}

export function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getItemKey(item: DataTableItem, index: number, keyField: string): DataTableKey {
  if (isRecord(item) && Object.prototype.hasOwnProperty.call(item, keyField)) {
    return item[keyField];
  }
  return index;
}

export function getNestedValue(item: DataTableItem, path: string): unknown {
  if (!path) return undefined;

  return path.split('.').reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, item);
}

export function getHeaderLabel(column: TableColumn): string {
  if (column.header !== undefined && column.header !== null) {
    return column.header;
  }

  const key = column.key || '';
  if (!key) return '';

  return key.charAt(0).toUpperCase() + key.slice(1).replace(/[._]/g, ' ');
}

export function renderDataTableCell(
  item: DataTableItem,
  column: TableColumn,
  onRenderError?: (error: unknown) => void
): unknown {
  if (typeof column.render === 'function') {
    try {
      return column.render(item, column);
    } catch (error) {
      onRenderError?.(error);
    }
  }

  const rawValue = getNestedValue(item, column.key);
  if (rawValue === undefined || rawValue === null) {
    return '-';
  }
  if (typeof rawValue === 'boolean') {
    return String(rawValue);
  }
  return rawValue;
}
