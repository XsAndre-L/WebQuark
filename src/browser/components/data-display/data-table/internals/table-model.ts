import {
  identifyItems,
  type CollectionIdentity,
} from '../../../../utils/collection-identity';

import { getDataTableItemKey } from '../data-table-cell';
import type {
  DataTableItem,
  DataTableKey,
  DataTableRowAction,
  DataTableRowGroup,
  DataTableRowGrouper,
  DataTableRowGutter,
  DataTableSortDirection,
  DataTableSortMode,
  TableColumn,
} from '../data-table.types';
import { getItemKey, parseDataTableColumns, parseDataTableItems, parseDataTableRowActions } from './data-access';
import { getSelectedKeySet, getSelectionState, type DataTableSelectionState } from './selection';
import { isDataTableColumnSortable, sortDataTableItems } from './sort';

export interface DataTableColumnModel {
  column: TableColumn;
  identity: CollectionIdentity;
  renderKey: string;
}

export interface DataTableRowActionModel {
  action: DataTableRowAction;
  identity: CollectionIdentity;
  renderKey: string;
}

export interface DataTableRowModel {
  item: DataTableItem;
  index: number;
  key: DataTableKey;
  identity: CollectionIdentity;
  renderKey: string;
  selected: boolean;
  group?: DataTableRowGroup;
  startsGroup: boolean;
}

export interface DataTableModel {
  columns: DataTableColumnModel[];
  items: DataTableItem[];
  rows: DataTableRowModel[];
  rowActions: DataTableRowActionModel[];
  hasRowActions: boolean;
  rowClickable: boolean;
  rowGutter: DataTableRowGutter;
  rowNumberOffset: number;
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
  rowClickable: boolean;
  rowGutter?: DataTableRowGutter;
  rowNumberOffset?: number;
  rowGroup?: DataTableRowGrouper;
  selectedKeys: readonly DataTableKey[] | undefined;
  selectable: boolean;
  keyField: string;
  sortable: boolean;
  sortMode: DataTableSortMode;
  sortColumn?: string;
  sortDirection?: DataTableSortDirection;
}

export function getDataTableModel(options: GetDataTableModelOptions): DataTableModel {
  const parsedColumns = parseDataTableColumns(options.columns);
  const parsedItems = parseDataTableItems(options.items);
  const items = getRenderableDataTableItems(parsedItems, parsedColumns, options);
  const columns = identifyItems(
    parsedColumns,
    column => column.key,
    { warningContext: 'q-data-table columns' },
  ).map(entry => ({
    column: entry.item,
    identity: entry.identity,
    renderKey: entry.key,
  }));
  const rowActions = identifyItems(
    parseDataTableRowActions(options.rowActions),
    action => action.key,
    { warningContext: 'q-data-table row actions' },
  ).map(entry => ({
    action: entry.item,
    identity: entry.identity,
    renderKey: entry.key,
  }));
  const hasRowActions = rowActions.length > 0;
  const rowGutter = normalizeRowGutter(options.rowGutter);
  const rowNumberOffset = Number.isSafeInteger(options.rowNumberOffset) && options.rowNumberOffset! >= 0
    ? options.rowNumberOffset! : 0;
  const selectedKeySet = getSelectedKeySet(options.selectedKeys);
  let previousGroupKey: string | number | undefined;
  let previousRowWasGrouped = false;
  const rows = identifyItems(
    items,
    (item, index) => getDataTableItemKey(item, index, options.keyField),
    { warningContext: 'q-data-table rows' },
  ).map(entry => {
    const { item, index, identity, key: renderKey } = entry;
    const key = getItemKey(item, index, options.keyField);
    const group = resolveDataTableRowGroup(options.rowGroup, item, index);
    const startsGroup = Boolean(group && (!previousRowWasGrouped || group.key !== previousGroupKey));

    previousGroupKey = group?.key;
    previousRowWasGrouped = Boolean(group);

    return {
      item,
      index,
      key,
      identity,
      renderKey,
      selected: selectedKeySet.has(key),
      group,
      startsGroup,
    };
  });

  return {
    columns,
    items,
    rows,
    rowActions,
    hasRowActions,
    rowClickable: options.rowClickable,
    rowGutter,
    rowNumberOffset,
    selectionState: getSelectionState(items, selectedKeySet, options.keyField),
    columnSpan: parsedColumns.length + (rowGutter !== 'none' ? 1 : 0) + (options.selectable ? 1 : 0) + (hasRowActions ? 1 : 0) || 1,
    selectable: options.selectable,
    sortable: options.sortable,
    sortColumn: options.sortColumn,
    sortDirection: options.sortDirection,
  };
}

function normalizeRowGutter(mode: unknown): DataTableRowGutter {
  return mode === 'none' || mode === 'numbers' || mode === 'custom' ? mode : 'blank';
}

function resolveDataTableRowGroup(rowGroup: DataTableRowGrouper | undefined, item: DataTableItem, index: number): DataTableRowGroup | undefined {
  if (!rowGroup) return undefined;

  try {
    const group = rowGroup(item, index);
    const label = group?.label?.trim();

    if (!group || !label) return undefined;

    return { key: group.key, label };
  } catch (error) {
    console.error('QDataTable: Row grouping function failed', error);
    return undefined;
  }
}

function getRenderableDataTableItems(items: DataTableItem[], columns: TableColumn[], options: GetDataTableModelOptions): DataTableItem[] {
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
