import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';
import type {
  DataTableItem,
  DataTableKey,
  DataTableRowAction,
  DataTableRowGrouper,
  DataTableSortDirection,
  DataTableSortMode,
  QDataTableRowActionDetail,
  QDataTableRowClickDetail,
  QDataTableSelectionChangeDetail,
  QDataTableSortChangeDetail,
  TableColumn,
} from './data-table.types';
import { getItemKey, parseDataTableItems, renderDataTableCell } from './internals/data-access';
import { renderDataTableBody } from './internals/render-table-body';
import { renderDataTableHead } from './internals/render-table-head';
import { renderDataTableToolbar } from './internals/render-toolbar';
import { isInteractiveDataTableTarget } from './internals/row-events';
import { getDataTableModel } from './internals/table-model';
import { getAllItemKeys, getSelectedItems, toggleSelectedKey } from './internals/selection';

/**
 * Data grid with optional toolbar, search, row activation, and multi-row selection.
 * @slot toolbar-left - Content placed before the search and filters area.
 * @slot filters - Filter controls displayed in the left toolbar group.
 * @slot actions - Action controls displayed in the right toolbar group.
 * @slot empty - Empty-state content shown when no rows are available.
 * @slot footer - Footer content rendered below the scrollable table.
 * @cssprop --q-table-max-height - Maximum height for the scrollable table area.
 * @cssprop --q-table-group-bg - Background color for row-group divider rows.
 * @cssprop --q-table-group-fg - Text color for row-group divider rows.
 * @cssprop --q-table-group-border - Border color for row-group divider rows.
 * @cssprop --q-table-group-padding - Padding for row-group divider cells.
 * @cssprop --q-table-dropdown-bg - Background color forwarded to slotted q-dropdown controls.
 * @cssprop --q-table-dropdown-menu-bg - Menu background color forwarded to slotted q-dropdown controls.
 * @cssprop --q-table-dropdown-border - Border style forwarded to slotted q-dropdown controls.
 * @cssprop --q-table-dropdown-primary - Primary color forwarded to slotted q-dropdown controls.
 * @cssprop --q-table-dropdown-fg - Foreground color forwarded to slotted q-dropdown controls.
 */
@Component({
  tag: 'q-data-table',
  styleUrl: 'data-table.css',
  shadow: true,
})
export class QDataTable {
  /** Column definitions, or a JSON string of column definitions. */
  @Prop() columns: TableColumn[] | string = [];

  /** Row data, or a JSON string of row data. */
  @Prop() items: DataTableItem[] | string = [];

  /** Optional row-level actions rendered as trailing icon buttons. */
  @Prop() rowActions: DataTableRowAction[] | string = [];

  /** Enables full-row click and keyboard activation. */
  @Prop() rowClickable: boolean = true;

  /**
   * Optional property-only callback that groups consecutive rendered rows.
   * A divider is inserted whenever the returned group key changes.
   */
  @Prop() rowGroup?: DataTableRowGrouper;

  /** Shows a loading state and suppresses row rendering while true. */
  @Prop() loading: boolean = false;

  /** Enables row selection checkboxes and selection state. */
  @Prop() selectable: boolean = false;

  /** Keys for currently selected rows. */
  @Prop({ mutable: true }) selectedKeys: DataTableKey[] = [];

  /** Row field used as the stable selection and render key. Falls back to the row index. */
  @Prop() keyField: string = 'id';

  /** Enables sortable column headers. Columns can override this with their own sortable setting. */
  @Prop() sortable: boolean = false;

  /** Sorting behavior: 'table' sorts provided items locally, while 'external' only emits sort changes. */
  @Prop() sortMode: DataTableSortMode = 'table';

  /** Currently sorted column key. */
  @Prop({ mutable: true }) sortColumn?: string;

  /** Current sort direction for the sorted column. */
  @Prop({ mutable: true }) sortDirection?: DataTableSortDirection;

  /** Shows the optional toolbar above the table. */
  @Prop() showToolbar: boolean = false;

  /** Title text rendered in the toolbar. */
  @Prop() toolbarTitle?: string;

  /** Shows the built-in toolbar search input. */
  @Prop() showSearch: boolean = false;

  /** Placeholder text for the built-in search input. */
  @Prop() searchPlaceholder: string = 'Search...';

  /** Current search input value. */
  @Prop({ mutable: true }) searchValue: string = '';

  /** Emitted when a non-interactive row area is clicked or activated with the keyboard. */
  @Event() qRowClick!: EventEmitter<QDataTableRowClickDetail>;

  /** Emitted when a row action button is clicked. */
  @Event() qRowAction!: EventEmitter<QDataTableRowActionDetail>;

  /** Emitted when selected rows change. */
  @Event() qSelectionChange!: EventEmitter<QDataTableSelectionChangeDetail>;

  /** Emitted when the built-in search input value changes. */
  @Event() qSearch!: EventEmitter<string>;

  /** Emitted when a sortable column header changes sort state. */
  @Event() qSortChange!: EventEmitter<QDataTableSortChangeDetail>;

  private getParsedItems(): DataTableItem[] {
    return parseDataTableItems(this.items);
  }

  private getItemKey(item: DataTableItem, index: number): DataTableKey {
    return getItemKey(item, index, this.keyField);
  }

  private getSelectedItems(items = this.getParsedItems(), selectedKeys = new Set(this.selectedKeys || [])): DataTableItem[] {
    return getSelectedItems(items, selectedKeys, this.keyField);
  }

  private handleSelectionKeyToggle(key: DataTableKey) {
    this.selectedKeys = toggleSelectedKey(this.selectedKeys, key);
    this.emitSelectionChange();
  }

  private handleSelectAllChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;

    if (isChecked) {
      const items = this.getParsedItems();
      this.selectedKeys = getAllItemKeys(items, this.keyField);
    } else {
      this.selectedKeys = [];
    }
    this.emitSelectionChange();
  }

  private handleRowCheckboxChange(item: DataTableItem, index: number, event: Event) {
    event.stopPropagation();
    this.handleSelectionKeyToggle(this.getItemKey(item, index));
  }

  private emitSelectionChange() {
    const currentKeys = this.selectedKeys || [];
    this.qSelectionChange.emit({
      selectedKeys: [...currentKeys],
      selectedItems: this.getSelectedItems(this.getParsedItems(), new Set(currentKeys)),
    });
  }

  private handleRowClick(item: DataTableItem, index: number, event: MouseEvent) {
    if (!this.rowClickable) return;
    if (isInteractiveDataTableTarget(event)) return;

    this.qRowClick.emit({
      item,
      index,
      originalEvent: event,
    });
  }

  private handleRowAction(item: DataTableItem, index: number, action: DataTableRowAction, event: MouseEvent) {
    event.stopPropagation();
    this.qRowAction.emit({
      action,
      item,
      index,
      originalEvent: event,
    });
  }

  private handleSearchInput = (event: CustomEvent<string>) => {
    this.searchValue = event.detail;
    this.qSearch.emit(this.searchValue);
  };

  private handleSortToggle = (column: TableColumn) => {
    const nextDirection = this.getNextSortDirection(column.key);

    this.sortColumn = nextDirection ? column.key : undefined;
    this.sortDirection = nextDirection;
    this.qSortChange.emit({
      columnKey: this.sortColumn,
      direction: this.sortDirection,
    });
  };

  private getNextSortDirection(columnKey: string): DataTableSortDirection | undefined {
    if (this.sortColumn !== columnKey) return 'asc';
    if (this.sortDirection === 'asc') return 'desc';
    if (this.sortDirection === 'desc') return undefined;
    return 'asc';
  }

  private handleRowKeyDown(item: DataTableItem, index: number, event: KeyboardEvent) {
    if (!this.rowClickable) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.qRowClick.emit({
        item,
        index,
        originalEvent: event,
      });

      if (this.selectable) {
        this.handleSelectionKeyToggle(this.getItemKey(item, index));
      }
    }
  }

  private renderCell(item: DataTableItem, column: TableColumn) {
    return renderDataTableCell(item, column, error => {
      console.error('QDataTable: Render function failed', error);
    });
  }

  render() {
    const model = getDataTableModel({
      columns: this.columns,
      items: this.items,
      rowActions: this.rowActions,
      rowClickable: this.rowClickable,
      rowGroup: this.rowGroup,
      selectedKeys: this.selectedKeys,
      selectable: this.selectable,
      keyField: this.keyField,
      sortable: this.sortable,
      sortMode: this.sortMode,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
    });

    return (
      <div class="table-container" role="grid">
        {renderDataTableToolbar({
          showToolbar: this.showToolbar,
          toolbarTitle: this.toolbarTitle,
          showSearch: this.showSearch,
          searchPlaceholder: this.searchPlaceholder,
          searchValue: this.searchValue,
          onSearchInput: this.handleSearchInput,
        })}
        <div class="table-scroll-area">
          <table class="table-el">
            {renderDataTableHead({
              model,
              onSelectAllChange: event => this.handleSelectAllChange(event),
              onSortToggle: column => this.handleSortToggle(column),
            })}
            {renderDataTableBody({
              model,
              loading: this.loading,
              onRowClick: (item, index, event) => this.handleRowClick(item, index, event),
              onRowKeyDown: (item, index, event) => this.handleRowKeyDown(item, index, event),
              onRowCheckboxChange: (item, index, event) => this.handleRowCheckboxChange(item, index, event),
              onRowAction: (item, index, action, event) => this.handleRowAction(item, index, action, event),
              renderCell: (item, column) => this.renderCell(item, column),
            })}
          </table>
        </div>
        <slot name="footer" />
      </div>
    );
  }
}
