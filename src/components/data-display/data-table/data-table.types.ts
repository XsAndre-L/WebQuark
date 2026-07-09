export type DataTableItem = unknown;
export type DataTableKey = unknown;
export type DataTableSortDirection = 'asc' | 'desc';
export type DataTableSortMode = 'table' | 'external';

export interface TableColumn<T = unknown> {
  key: string;
  header?: string;
  width?: string;
  className?: string;
  sortable?: boolean;
  sortKey?: string;
  render?: (item: T, column: TableColumn<T>) => unknown;
}

export interface DataTableRowAction {
  key: string;
  icon: string;
  tooltip: string;
}

export interface QDataTableRowClickDetail<T = unknown> {
  item: T;
  index: number;
  originalEvent: MouseEvent | KeyboardEvent;
}

export interface QDataTableRowActionDetail<T = unknown> {
  action: DataTableRowAction;
  item: T;
  index: number;
  originalEvent: MouseEvent;
}

export interface QDataTableSortChangeDetail {
  columnKey?: string;
  direction?: DataTableSortDirection;
}

export interface QDataTableSelectionChangeDetail<T = unknown> {
  selectedKeys: unknown[];
  selectedItems: T[];
}

