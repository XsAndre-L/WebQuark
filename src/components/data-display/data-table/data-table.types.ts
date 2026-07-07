export interface TableColumn<T = any> {
  key: string;
  header?: string;
  width?: string;
  className?: string;
  render?: (item: T, column: TableColumn<T>) => any;
}

export interface QDataTableRowClickDetail<T = any> {
  item: T;
  index: number;
  originalEvent: MouseEvent | KeyboardEvent;
}

export interface QDataTableSelectionChangeDetail<T = any> {
  selectedKeys: any[];
  selectedItems: T[];
}

