import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';
import { safeParseJson } from '../../../utils/utils';
import type { QDataTableRowClickDetail, QDataTableSelectionChangeDetail, TableColumn } from './data-table.types';

function getNestedValue<T extends Record<string, any>>(obj: T, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

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
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /** Column definitions, or a JSON string of column definitions. */
  @Prop() columns: TableColumn[] | string = [];

  /** Row data, or a JSON string of row data. */
  @Prop() items: any[] | string = [];

  /** Shows a loading state and suppresses row rendering while true. */
  @Prop() loading: boolean = false;

  /** Enables row selection checkboxes and selection state. */
  @Prop() selectable: boolean = false;

  /** Keys for currently selected rows. */
  @Prop({ mutable: true }) selectedKeys: any[] = [];

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

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private getParsedColumns(): TableColumn[] {
    return safeParseJson<TableColumn[]>(this.columns, [], 'QDataTable');
  }

  private getParsedItems(): any[] {
    return safeParseJson<any[]>(this.items, [], 'QDataTable');
  }

  private getItemKey(item: any, index: number): any {
    if (item && typeof item === 'object' && this.keyField in item) {
      return item[this.keyField];
    }
    return index;
  }

  private getSelectedKeySet(): Set<any> {
    return new Set(this.selectedKeys || []);
  }

  private getSelectedItems(items = this.getParsedItems(), selectedKeys = this.getSelectedKeySet()): any[] {
    return items.filter((item, index) => selectedKeys.has(this.getItemKey(item, index)));
  }

  private getSelectionState() {
    const items = this.getParsedItems();
    if (items.length === 0) {
      return { checked: false, indeterminate: false };
    }

    const selectedCount = this.getSelectedItems(items).length;
    const checked = selectedCount === items.length;
    const indeterminate = selectedCount > 0 && selectedCount < items.length;
    return { checked, indeterminate };
  }

  private toggleKeyInSelection(key: any) {
    const currentKeys = [...(this.selectedKeys || [])];
    const keyIndex = currentKeys.indexOf(key);

    if (keyIndex > -1) {
      currentKeys.splice(keyIndex, 1);
    } else {
      currentKeys.push(key);
    }

    this.selectedKeys = currentKeys;
    this.emitSelectionChange();
  }

  private handleSelectAllChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;

    if (isChecked) {
      const items = this.getParsedItems();
      this.selectedKeys = items.map((item, index) => this.getItemKey(item, index));
    } else {
      this.selectedKeys = [];
    }
    this.emitSelectionChange();
  }

  private handleRowCheckboxChange(item: any, index: number, event: Event) {
    event.stopPropagation();
    this.toggleKeyInSelection(this.getItemKey(item, index));
  }

  private emitSelectionChange() {
    const currentKeys = this.selectedKeys || [];
    this.qSelectionChange.emit({
      selectedKeys: [...currentKeys],
      selectedItems: this.getSelectedItems(this.getParsedItems(), new Set(currentKeys)),
    });
  }

  private handleRowClick(item: any, index: number, event: MouseEvent) {
    const path = event.composedPath();
    const isInteractive = path.some((target: any) => {
      if (!target || !target.tagName) return false;
      const tagName = target.tagName.toLowerCase();
      return tagName === 'input' || tagName === 'button' || tagName === 'a' || target.getAttribute('role') === 'button';
    });
    if (isInteractive) return;

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

  private handleRowKeyDown(item: any, index: number, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.qRowClick.emit({
        item,
        index,
        originalEvent: event,
      });

      if (this.selectable) {
        this.toggleKeyInSelection(this.getItemKey(item, index));
      }
    }
  }

  private getHeaderLabel(column: TableColumn): string {
    if (column.header !== undefined && column.header !== null) {
      return column.header;
    }
    const key = column.key || '';
    if (!key) return '';
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/[._]/g, ' ');
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  private renderCell(item: any, column: TableColumn) {
    if (typeof column.render === 'function') {
      try {
        return column.render(item, column);
      } catch (e) {
        console.error('QDataTable: Render function failed', e);
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

  render() {
    const columns = this.getParsedColumns();
    const items = this.getParsedItems();
    const { checked, indeterminate } = this.getSelectionState();
    const selectedKeySet = this.getSelectedKeySet();
    const columnSpan = columns.length + (this.selectable ? 1 : 0) || 1;

    return (
      <div class="table-container" role="grid">
        {this.showToolbar && (
          <div class="table-toolbar">
            <div class="toolbar-left">
              {this.toolbarTitle && <span class="toolbar-title">{this.toolbarTitle}</span>}
              <slot name="toolbar-left" />
              {this.showSearch && (
                <q-input
                  class="search-input"
                  placeholder={this.searchPlaceholder}
                  value={this.searchValue}
                  onQInput={this.handleSearchInput}
                  size="sm"
                >
                  <svg slot="prefix" class="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style={{ width: '14px', height: '14px' }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </q-input>
              )}
              <slot name="filters" />
            </div>
            <div class="toolbar-right">
              <slot name="actions" />
            </div>
          </div>
        )}
        <div class="table-scroll-area">
          <table class="table-el">
            <thead>
              <tr role="row">
                {this.selectable && (
                  <th class="col-selection" role="columnheader">
                    <input
                      type="checkbox"
                      class="checkbox-input"
                      checked={checked}
                      ref={el => {
                        if (el) el.indeterminate = indeterminate;
                      }}
                      onChange={e => this.handleSelectAllChange(e)}
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map(col => {
                  const style: Record<string, string> = {};
                  if (col.width) {
                    style.width = col.width;
                  }
                  return (
                    <th style={style} class={col.className || ''} role="columnheader">
                      {this.getHeaderLabel(col)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {this.loading ? (
                <tr role="row">
                  <td colSpan={columnSpan} class="loading-placeholder-cell" role="gridcell">
                    <div class="table-loading-state">
                      <q-circular-progress indeterminate={true} size="sm" />
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr role="row">
                  <td colSpan={columnSpan} class="empty-cell" role="gridcell">
                    <slot name="empty">No data available</slot>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const key = this.getItemKey(item, index);
                  const isSelected = selectedKeySet.has(key);

                  return (
                    <tr
                      key={key}
                      class={{
                        'row-el': true,
                        'is-selected': isSelected,
                      }}
                      tabindex="0"
                      role="row"
                      aria-selected={isSelected ? 'true' : 'false'}
                      onClick={e => this.handleRowClick(item, index, e)}
                      onKeyDown={e => this.handleRowKeyDown(item, index, e)}
                    >
                      {this.selectable && (
                        <td class="cell-selection" role="gridcell">
                          <input
                            type="checkbox"
                            class="checkbox-input"
                            checked={isSelected}
                            onChange={e => this.handleRowCheckboxChange(item, index, e)}
                            aria-label={`Select row ${index + 1}`}
                          />
                        </td>
                      )}
                      {columns.map(col => (
                        <td class={col.className || ''} role="gridcell">
                          {this.renderCell(item, col)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <slot name="footer" />
      </div>
    );
  }
}
