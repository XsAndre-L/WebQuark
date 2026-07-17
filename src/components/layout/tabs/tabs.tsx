import { Component, Element, Event, EventEmitter, Prop, h } from '@stencil/core';

import type { QTabsOrientation, QTabsSize, QTabsVariant, TabItem, TabItemInput } from './tabs.types';
import { getTabItems } from './tabs.utils';

let tabsId = 0;

/**
 * Accessible tab selector for switching between consumer-owned tab panels.
 * @part tablist - Scrollable tab-list container.
 * @part tab - Individual tab button.
 * @part selected-tab - Currently selected tab button.
 */
@Component({
  tag: 'q-tabs',
  styleUrl: 'tabs.css',
  shadow: true,
})
export class QTabs {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  @Element() el!: HTMLElement;

  /** Tab records; strings use the same text for label and value. */
  @Prop() items: TabItemInput[] | string = [];

  /** Value of the currently selected tab. The first enabled tab is used when it does not match an item. */
  @Prop() value: string = '';

  /** Accessible name for the tab list. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string = 'Sections';

  /** Direction of the tab list and its corresponding arrow-key navigation. */
  @Prop({ reflect: true }) orientation: QTabsOrientation = 'horizontal';

  /** Visual size preset. */
  @Prop() size: QTabsSize = 'md';

  /** Visual presentation of the tabs. */
  @Prop() variant: QTabsVariant = 'underline';

  /** Makes enabled tabs share the available width evenly. */
  @Prop({ reflect: true }) stretch: boolean = false;

  /** Emitted with the selected tab value after pointer or keyboard activation. */
  @Event() qChange!: EventEmitter<string>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private readonly instanceId = `q-tabs-${++tabsId}`;

  private get parsedItems(): TabItem[] {
    return getTabItems(this.items);
  }

  private getActiveIndex(items: readonly TabItem[]): number {
    const selectedIndex = items.findIndex(item => !item.disabled && item.value === this.value);
    return selectedIndex >= 0 ? selectedIndex : items.findIndex(item => !item.disabled);
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private selectItem(item: TabItem): void {
    if (!item.disabled && item.value !== this.value) {
      this.qChange.emit(item.value);
    }
  }

  private handleKeyDown = (event: KeyboardEvent, index: number): void => {
    const items = this.parsedItems;
    const horizontal = this.orientation === 'horizontal';
    let nextIndex: number | undefined;

    if (event.key === 'Home') {
      nextIndex = findEnabledIndex(items, 0, 1);
    } else if (event.key === 'End') {
      nextIndex = findEnabledIndex(items, items.length - 1, -1);
    } else if ((horizontal && event.key === 'ArrowRight') || (!horizontal && event.key === 'ArrowDown')) {
      nextIndex = findNextEnabledIndex(items, index, 1);
    } else if ((horizontal && event.key === 'ArrowLeft') || (!horizontal && event.key === 'ArrowUp')) {
      nextIndex = findNextEnabledIndex(items, index, -1);
    }

    if (nextIndex === undefined || nextIndex < 0) {
      return;
    }

    event.preventDefault();
    const item = items[nextIndex];
    const tab = this.el.shadowRoot?.querySelector<HTMLButtonElement>(`#${this.tabId(item, nextIndex)}`);
    focusWithoutPageScroll(tab);
    this.selectItem(item);
  };

  private tabId(item: TabItem, index: number): string {
    return item.tabId?.trim() || `${this.instanceId}-tab-${index}`;
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const items = this.parsedItems;
    const activeIndex = this.getActiveIndex(items);

    return (
      <div
        class={{
          'tab-list': true,
          [`size-${this.size}`]: true,
          [`variant-${this.variant}`]: true,
        }}
        part="tablist"
        role="tablist"
        aria-label={this.ariaLabel.trim() || 'Sections'}
        aria-orientation={this.orientation}
      >
        {items.map((item, index) => {
          const selected = index === activeIndex;

          return (
            <button
              id={this.tabId(item, index)}
              class={{ 'tab': true, 'is-selected': selected }}
              type="button"
              role="tab"
              part={`tab${selected ? ' selected-tab' : ''}`}
              disabled={item.disabled}
              aria-selected={selected ? 'true' : 'false'}
              aria-controls={item.panelId}
              tabindex={selected ? 0 : -1}
              title={item.label}
              onClick={() => this.selectItem(item)}
              onKeyDown={event => this.handleKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }
}

function findEnabledIndex(items: readonly TabItem[], start: number, direction: 1 | -1): number {
  for (let index = start; index >= 0 && index < items.length; index += direction) {
    if (!items[index].disabled) {
      return index;
    }
  }

  return -1;
}

function findNextEnabledIndex(items: readonly TabItem[], currentIndex: number, direction: 1 | -1): number {
  if (items.length === 0) {
    return -1;
  }

  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (currentIndex + direction * offset + items.length) % items.length;
    if (!items[index].disabled) {
      return index;
    }
  }

  return -1;
}

function focusWithoutPageScroll(element: HTMLElement | null | undefined): void {
  if (!element) {
    return;
  }

  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
}
