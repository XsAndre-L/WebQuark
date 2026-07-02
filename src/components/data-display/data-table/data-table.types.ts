export interface TableColumn {
  key: string;
  header?: string;
  width?: string;
  className?: string;
  render?: (item: any, column: TableColumn) => any;
}

export interface QDataTableRowClickDetail {
  item: any;
  index: number;
  originalEvent: MouseEvent | KeyboardEvent;
}

export interface QDataTableSelectionChangeDetail {
  selectedKeys: any[];
  selectedItems: any[];
}

