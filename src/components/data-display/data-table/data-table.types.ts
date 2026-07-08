export type DataTableItem = unknown;
export type DataTableKey = unknown;

export interface TableColumn<T = unknown> {
  key: string;
  header?: string;
  width?: string;
  className?: string;
  render?: (item: T, column: TableColumn<T>) => unknown;
}

export interface QDataTableRowClickDetail<T = unknown> {
  item: T;
  index: number;
  originalEvent: MouseEvent | KeyboardEvent;
}

export interface QDataTableSelectionChangeDetail<T = unknown> {
  selectedKeys: unknown[];
  selectedItems: T[];
}

