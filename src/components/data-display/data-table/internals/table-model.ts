import type {
  DataTableItem,
  DataTableKey,
  DataTableRowAction,
  DataTableSortDirection,
  DataTableSortMode,
  TableColumn,
} from '../data-table.types';
import {
  getItemKey,
  parseDataTableColumns,
  parseDataTableItems,
  parseDataTableRowActions,
} from './data-access';
import { getSelectedKeySet, getSelectionState, type DataTableSelectionState } from './selection';
import { isDataTableColumnSortable, sortDataTableItems } from './sort';

export interface DataTableRowModel {
  item: DataTableItem;
  index: number;
  key: DataTableKey;
  renderKey: string | number;
  selected: boolean;
}

export interface DataTableModel {
  columns: TableColumn[];
  items: DataTableItem[];
  rows: DataTableRowModel[];
  rowActions: DataTableRowAction[];
  hasRowActions: boolean;
  selectionState: DataTableSelectionState;
  columnSpan: number;
  selectable: boolean;
  sortable: boolean;
  sortColumn?: string;
  sortDirection?: DataTableSortDirection;
}

export interface GetDataTableModelOptions {
  columns: TableColumn[] | string;
  items: DataTableItem[] | string;
  rowActions: DataTableRowAction[] | string;
  selectedKeys: readonly DataTableKey[] | undefined;
  selectable: boolean;
  keyField: string;
  sortable: boolean;
  sortMode: DataTableSortMode;
  sortColumn?: string;
  sortDirection?: DataTableSortDirection;
}

export function getDataTableModel(options: GetDataTableModelOptions): DataTableModel {
  const columns = parseDataTableColumns(options.columns);
  const parsedItems = parseDataTableItems(options.items);
  const items = getRenderableDataTableItems(parsedItems, columns, options);
  const rowActions = parseDataTableRowActions(options.rowActions);
  const hasRowActions = rowActions.length > 0;
  const selectedKeySet = getSelectedKeySet(options.selectedKeys);
  const rows = items.map((item, index) => {
    const key = getItemKey(item, index, options.keyField);

    return {
      item,
      index,
      key,
      renderKey: getDataTableRenderKey(key),
      selected: selectedKeySet.has(key),
    };
  });

  return {
    columns,
    items,
    rows,
    rowActions,
    hasRowActions,
    selectionState: getSelectionState(items, selectedKeySet, options.keyField),
    columnSpan: columns.length + (options.selectable ? 1 : 0) + (hasRowActions ? 1 : 0) || 1,
    selectable: options.selectable,
    sortable: options.sortable,
    sortColumn: options.sortColumn,
    sortDirection: options.sortDirection,
  };
}

export function getDataTableRenderKey(key: DataTableKey): string | number {
  return typeof key === 'string' || typeof key === 'number' ? key : String(key);
}

function getRenderableDataTableItems(
  items: DataTableItem[],
  columns: TableColumn[],
  options: GetDataTableModelOptions
): DataTableItem[] {
  if (options.sortMode !== 'table' || !options.sortColumn || !isSortDirection(options.sortDirection)) {
    return items;
  }

  const sortColumn = columns.find(column => column.key === options.sortColumn);
  if (!sortColumn || !isDataTableColumnSortable(sortColumn, options.sortable)) {
    return items;
  }

  return sortDataTableItems(items, sortColumn, options.sortDirection);
}

function isSortDirection(direction: DataTableSortDirection | undefined): direction is DataTableSortDirection {
  return direction === 'asc' || direction === 'desc';
}
