import type { DataTableItem, DataTableKey, TableColumn } from '../data-table.types';
import { getItemKey, parseDataTableColumns, parseDataTableItems } from './data-access';
import { getSelectedKeySet, getSelectionState, type DataTableSelectionState } from './selection';

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
  selectionState: DataTableSelectionState;
  columnSpan: number;
  selectable: boolean;
}

export interface GetDataTableModelOptions {
  columns: TableColumn[] | string;
  items: DataTableItem[] | string;
  selectedKeys: readonly DataTableKey[] | undefined;
  selectable: boolean;
  keyField: string;
}

export function getDataTableModel(options: GetDataTableModelOptions): DataTableModel {
  const columns = parseDataTableColumns(options.columns);
  const items = parseDataTableItems(options.items);
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
    selectionState: getSelectionState(items, selectedKeySet, options.keyField),
    columnSpan: columns.length + (options.selectable ? 1 : 0) || 1,
    selectable: options.selectable,
  };
}

export function getDataTableRenderKey(key: DataTableKey): string | number {
  return typeof key === 'string' || typeof key === 'number' ? key : String(key);
}
