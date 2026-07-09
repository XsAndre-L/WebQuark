import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';
import type {
  DataTableItem,
  DataTableKey,
  QDataTableRowClickDetail,
  QDataTableSelectionChangeDetail,
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

  /** Shows a loading state and suppresses row rendering while true. */
  @Prop() loading: boolean = false;

  /** Enables row selection checkboxes and selection state. */
  @Prop() selectable: boolean = false;

  /** Keys for currently selected rows. */
  @Prop({ mutable: true }) selectedKeys: DataTableKey[] = [];

  /** Row field used as the stable selection and render key. Falls back to the row index. */
  @Prop() keyField: string = 'id';

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

  /** Emitted when selected rows change. */
  @Event() qSelectionChange!: EventEmitter<QDataTableSelectionChangeDetail>;

  /** Emitted when the built-in search input value changes. */
  @Event() qSearch!: EventEmitter<string>;

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
    if (isInteractiveDataTableTarget(event)) return;

    this.qRowClick.emit({
      item,
      index,
      originalEvent: event,
    });
  }

  private handleSearchInput = (event: CustomEvent<string>) => {
    this.searchValue = event.detail;
    this.qSearch.emit(this.searchValue);
  };

  private handleRowKeyDown(item: DataTableItem, index: number, event: KeyboardEvent) {
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
      selectedKeys: this.selectedKeys,
      selectable: this.selectable,
      keyField: this.keyField,
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
            })}
            {renderDataTableBody({
              model,
              loading: this.loading,
              onRowClick: (item, index, event) => this.handleRowClick(item, index, event),
              onRowKeyDown: (item, index, event) => this.handleRowKeyDown(item, index, event),
              onRowCheckboxChange: (item, index, event) => this.handleRowCheckboxChange(item, index, event),
              renderCell: (item, column) => this.renderCell(item, column),
            })}
          </table>
        </div>
        <slot name="footer" />
      </div>
    );
  }
}
