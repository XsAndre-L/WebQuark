import { safeParseJson } from '../../../../utils/utils';

import { getDataTableCellValue, getDataTableItemKey } from '../data-table-cell';
import type { DataTableItem, DataTableKey, DataTableRowAction, TableColumn } from '../data-table.types';

export function parseDataTableColumns(columns: TableColumn[] | string): TableColumn[] {
  return safeParseJson<TableColumn[]>(columns, [], 'QDataTable');
}

export function parseDataTableItems(items: DataTableItem[] | string): DataTableItem[] {
  return safeParseJson<DataTableItem[]>(items, [], 'QDataTable');
}

export function parseDataTableRowActions(rowActions: DataTableRowAction[] | string): DataTableRowAction[] {
  return safeParseJson<DataTableRowAction[]>(rowActions, [], 'QDataTable');
}

export function getItemKey(item: DataTableItem, index: number, keyField: string): DataTableKey {
  const key = getDataTableItemKey(item, index, keyField);
  return key === undefined ? index : key;
}

export const getNestedValue = getDataTableCellValue;

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
