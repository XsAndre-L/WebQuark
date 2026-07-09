import { h } from '@stencil/core';

export interface RenderDataTableToolbarOptions {
  showToolbar: boolean;
  toolbarTitle?: string;
  showSearch: boolean;
  searchPlaceholder: string;
  searchValue: string;
  onSearchInput: (event: CustomEvent<string>) => void;
}

export function renderDataTableToolbar(options: RenderDataTableToolbarOptions) {
  if (!options.showToolbar) return null;

  return (
    <div class="table-toolbar">
      <div class="toolbar-left">
        {options.toolbarTitle && <span class="toolbar-title">{options.toolbarTitle}</span>}
        <slot name="toolbar-left" />
        {options.showSearch && (
          <q-input
            class="search-input"
            placeholder={options.searchPlaceholder}
            value={options.searchValue}
            onQInput={options.onSearchInput}
            size="sm"
          >
            <svg
              slot="prefix"
              class="search-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              style={{ width: '14px', height: '14px' }}
            >
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
  );
}
