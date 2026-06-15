import { Component, Prop, Element, Event, EventEmitter, h } from '@stencil/core';

export interface TableColumn {
  key: string;
  header?: string;
  width?: string;
  className?: string;
  render?: (item: any, column: TableColumn) => any;
}

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

@Component({
  tag: 'q-data-table',
  styleUrl: 'q-data-table.css',
  shadow: true,
})
export class QDataTable {
  @Element() el!: HTMLElement;

  @Prop() columns: TableColumn[] | string = [];
  @Prop() items: any[] | string = [];
  @Prop() selectable: boolean = false;
  @Prop({ mutable: true }) selectedKeys: any[] = [];
  @Prop() keyField: string = 'id';
  @Prop() showToolbar: boolean = false;
  @Prop() toolbarTitle?: string;
  @Prop() showSearch: boolean = false;
  @Prop() searchPlaceholder: string = 'Search...';
  @Prop({ mutable: true }) searchValue: string = '';

  @Event() qRowClick!: EventEmitter<{ item: any; index: number; originalEvent: MouseEvent | KeyboardEvent }>;
  @Event() qSelectionChange!: EventEmitter<{ selectedKeys: any[]; selectedItems: any[] }>;
  @Event() qSearch!: EventEmitter<string>;

  private getParsedColumns(): TableColumn[] {
    if (typeof this.columns === 'string') {
      try {
        return JSON.parse(this.columns);
      } catch (e) {
        console.error('QDataTable: Failed to parse columns prop', e);
        return [];
      }
    }
    return this.columns || [];
  }

  private getParsedItems(): any[] {
    if (typeof this.items === 'string') {
      try {
        return JSON.parse(this.items);
      } catch (e) {
        console.error('QDataTable: Failed to parse items prop', e);
        return [];
      }
    }
    return this.items || [];
  }

  private getItemKey(item: any, index: number): any {
    if (item && this.keyField in item) {
      return item[this.keyField];
    }
    return index;
  }

  private getSelectionState() {
    const items = this.getParsedItems();
    if (items.length === 0) {
      return { checked: false, indeterminate: false };
    }
    const currentKeys = this.selectedKeys || [];
    const selectedCount = items.filter((item, index) => {
      const key = this.getItemKey(item, index);
      return currentKeys.includes(key);
    }).length;

    const checked = selectedCount === items.length;
    const indeterminate = selectedCount > 0 && selectedCount < items.length;
    return { checked, indeterminate };
  }

  private toggleRowSelection(item: any, index: number, event: Event) {
    event.stopPropagation();
    const key = this.getItemKey(item, index);
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

  private toggleAllSelection(event: Event) {
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

  private emitSelectionChange() {
    const items = this.getParsedItems();
    const currentKeys = this.selectedKeys || [];
    const selectedItems = items.filter((item, index) => {
      const key = this.getItemKey(item, index);
      return currentKeys.includes(key);
    });
    this.qSelectionChange.emit({
      selectedKeys: [...currentKeys],
      selectedItems,
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

  private handleSearchInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.searchValue = input.value;
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
        const key = this.getItemKey(item, index);
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
    const currentKeys = this.selectedKeys || [];

    return (
      <div class="table-container" role="grid">
        {this.showToolbar && (
          <div class="table-toolbar">
            <div class="toolbar-left">
              {this.toolbarTitle && <span class="toolbar-title">{this.toolbarTitle}</span>}
              <slot name="toolbar-left" />
              {this.showSearch && (
                <div class="search-box">
                  <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    class="search-input"
                    placeholder={this.searchPlaceholder}
                    value={this.searchValue}
                    onInput={this.handleSearchInput}
                  />
                </div>
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
                    onChange={e => this.toggleAllSelection(e)}
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
                  <th
                    style={style}
                    class={col.className || ''}
                    role="columnheader"
                  >
                    {this.getHeaderLabel(col)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr role="row">
                <td
                  colSpan={columns.length + (this.selectable ? 1 : 0)}
                  class="empty-cell"
                  role="gridcell"
                >
                  <slot name="empty">No data available</slot>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const key = this.getItemKey(item, index);
                const isSelected = currentKeys.includes(key);

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
                          onChange={e => this.toggleRowSelection(item, index, e)}
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
