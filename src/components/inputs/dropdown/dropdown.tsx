import { Component, Prop, State, Event, EventEmitter, Element, AttachInternals, Watch, Listen, h } from '@stencil/core';
import { safeParseJson } from '../../../utils/utils';
import { safeFocus } from '../../../utils/dom';
import type { Option, QDropdownSize } from './dropdown.types';

const AVG_CHAR_WIDTH_PX = 7.2;
const WIDTH_CHROME_PX = 38;
const MIN_SEARCHABLE_SM_WIDTH_PX = 160;

/**
 * Form-associated dropdown/select control with optional search and incremental option rendering.
 * @part label - Optional field label.
 * @part trigger - Button that opens the option menu.
 * @part menu - Floating option menu.
 */
@Component({
  tag: 'q-dropdown',
  styleUrl: 'dropdown.css',
  shadow: {
    delegatesFocus: true,
  },
  formAssociated: true,
})
export class QDropdown {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /** Selected option value. */
  @Prop({ mutable: true }) value: string = '';

  /** Form field name. */
  @Prop({ reflect: true }) name?: string;

  /** Optional label rendered above the trigger. */
  @Prop() label?: string;

  /** Placeholder text shown when no option is selected. */
  @Prop() placeholder: string = 'Select an option...';

  /** Options to render; accepts an array or a JSON string of { label, value } objects. */
  @Prop() options: Option[] | string = [];

  /** Disables the trigger and prevents selection changes. */
  @Prop({ reflect: true }) disabled: boolean = false;

  /** Visual size preset. */
  @Prop({ reflect: true }) size: QDropdownSize = 'md';

  /** Shows a search input inside the menu. */
  @Prop() searchable: boolean = false;

  @State() isOpen: boolean = false;
  @State() focusedIndex: number = -1;
  @State() searchTerm: string = '';
  @State() visibleCount: number = 20;
  @State() isScrollingLoading: boolean = false;

  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  /** Emitted with the selected option value when selection changes. */
  @Event() qChange!: EventEmitter<string>;

  /** Emitted with the selected option object when selection changes. */
  @Event() qSelect!: EventEmitter<Option>;

  /** Emitted when the trigger receives focus. */
  @Event() qFocus!: EventEmitter<FocusEvent>;

  /** Emitted when the trigger loses focus. */
  @Event() qBlur!: EventEmitter<FocusEvent>;

  /** Emitted before the trigger toggles the menu. */
  @Event() qClick!: EventEmitter<MouseEvent>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private triggerEl?: HTMLButtonElement;
  private searchInputEl?: HTMLInputElement;
  private initialValue: string = '';
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  disconnectedCallback() {
    this.clearScrollLoading();
  }

  @Watch('value')
  watchValue(newValue: string) {
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(newValue);
    }
  }

  componentWillLoad() {
    this.initialValue = this.value || '';
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
    if (!this.searchTerm) {
      this.searchTerm = '';
    }
  }

  formResetCallback() {
    this.value = this.initialValue;
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private clearScrollLoading() {
    this.isScrollingLoading = false;
    if (this.scrollTimeout !== null) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  private getOptionLabel(option: Partial<Option> | undefined): string {
    return typeof option?.label === 'string' ? option.label : '';
  }

  private getAllOptions(): Option[] {
    return safeParseJson<Option[]>(this.options, [], 'QDropdown').filter((opt): opt is Option => Boolean(opt) && typeof opt === 'object' && typeof opt.value === 'string');
  }

  private getSelectedOption(options = this.getAllOptions()): Option | undefined {
    return options.find(opt => opt.value === this.value);
  }

  private getFilteredOptions(): Option[] {
    const list = this.getAllOptions();

    if (this.searchable && this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      return list.filter(opt => this.getOptionLabel(opt).toLowerCase().includes(term));
    }
    return list;
  }

  private get parsedOptions(): Option[] {
    return this.getFilteredOptions().slice(0, this.visibleCount);
  }

  private toggleMenu = () => {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    this.clearScrollLoading();
    if (this.isOpen) {
      this.searchTerm = '';
      this.visibleCount = 20;
      if (this.searchable) {
        this.focusedIndex = -1;
        requestAnimationFrame(() => safeFocus(this.searchInputEl));
      } else {
        const activeIdx = this.parsedOptions.findIndex(opt => opt.value === this.value);
        const nextIdx = activeIdx >= 0 ? activeIdx : 0;
        this.updateFocusedIndex(nextIdx);
      }
    } else {
      this.focusedIndex = -1;
      this.searchTerm = '';
      this.visibleCount = 20;
      requestAnimationFrame(() => safeFocus(this.triggerEl));
    }
  };

  private handleSelect = (option: Option) => {
    this.value = option.value;
    this.isOpen = false;
    this.focusedIndex = -1;
    this.searchTerm = '';
    this.clearScrollLoading();
    this.qChange.emit(option.value);
    this.qSelect.emit(option);
    requestAnimationFrame(() => this.triggerEl?.focus());
  };

  private handleFocus = (ev: FocusEvent) => {
    this.qFocus.emit(ev);
  };

  private handleBlur = (ev: FocusEvent) => {
    this.qBlur.emit(ev);
  };

  private handleTriggerClick = (ev: MouseEvent) => {
    if (this.disabled) return;
    this.qClick.emit(ev);
    this.toggleMenu();
  };

  private handleSearchInput = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    this.searchTerm = target.value || '';
    this.focusedIndex = -1;
    this.visibleCount = 20;
    this.clearScrollLoading();
  };

  private handleScroll = (ev: Event) => {
    const listEl = ev.target as HTMLElement;
    if (!listEl) return;

    const threshold = 5;
    const isAtBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight <= threshold;

    if (isAtBottom && !this.isScrollingLoading) {
      const totalCount = this.getFilteredOptions().length;
      if (this.visibleCount < totalCount) {
        this.isScrollingLoading = true;
        if (this.scrollTimeout !== null) {
          clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
          this.visibleCount = Math.min(this.visibleCount + 20, totalCount);
          this.isScrollingLoading = false;
          this.scrollTimeout = null;
        }, 800);
      }
    }
  };

  private updateFocusedIndex(index: number) {
    this.focusedIndex = index;
    requestAnimationFrame(() => this.focusCurrentOption());
  }

  private focusCurrentOption() {
    if (this.focusedIndex >= 0 && this.isOpen) {
      const listElement = this.el.shadowRoot?.querySelector(`#q-field-item-${this.focusedIndex}`) as HTMLElement;
      listElement?.focus();
    }
  }

  private calculateWidthFromLength(labelLength: number, minWidth = 0): string {
    const calculatedWidth = labelLength * AVG_CHAR_WIDTH_PX + WIDTH_CHROME_PX;
    return `${Math.ceil(Math.max(minWidth, calculatedWidth))}px`;
  }

  private computeDynamicWidth(allOptions: Option[], selectedOption?: Option): string | undefined {
    if (this.size !== 'sm') return undefined;

    if (this.searchable) {
      const labelText = selectedOption ? this.getOptionLabel(selectedOption) : this.placeholder;
      return this.calculateWidthFromLength(labelText ? labelText.length : 0, MIN_SEARCHABLE_SM_WIDTH_PX);
    }

    const lengths = allOptions.map(option => this.getOptionLabel(option).length);
    if (this.placeholder) {
      lengths.push(this.placeholder.length);
    }
    return this.calculateWidthFromLength(Math.max(...lengths, 0));
  }

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (this.disabled) return;

    const target = ev.target as HTMLElement;
    const isInput = target && target.tagName && target.tagName.toLowerCase() === 'input';
    const maxIndex = this.parsedOptions.length - 1;

    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        if (!this.isOpen) {
          this.isOpen = true;
          if (this.searchable) {
            this.focusedIndex = -1;
            requestAnimationFrame(() => this.searchInputEl?.focus());
          } else {
            const activeIdx = this.parsedOptions.findIndex(opt => opt.value === this.value);
            const nextIdx = activeIdx >= 0 ? activeIdx : 0;
            this.updateFocusedIndex(nextIdx);
          }
        } else {
          if (isInput) {
            if (maxIndex >= 0) {
              this.updateFocusedIndex(0);
            }
          } else {
            const nextIdx = Math.min(this.focusedIndex + 1, maxIndex);
            this.updateFocusedIndex(nextIdx);
          }
        }
        break;
      case 'ArrowUp':
        ev.preventDefault();
        if (!this.isOpen) {
          this.isOpen = true;
          const activeIdx = this.parsedOptions.findIndex(opt => opt.value === this.value);
          const nextIdx = activeIdx >= 0 ? activeIdx : maxIndex;
          this.updateFocusedIndex(nextIdx);
        } else {
          if (this.focusedIndex === 0 && this.searchable) {
            this.focusedIndex = -1;
            requestAnimationFrame(() => safeFocus(this.searchInputEl));
          } else if (this.focusedIndex > 0) {
            const nextIdx = this.focusedIndex - 1;
            this.updateFocusedIndex(nextIdx);
          }
        }
        break;
      case 'Home':
        if (this.isOpen && !isInput) {
          ev.preventDefault();
          this.updateFocusedIndex(0);
        }
        break;
      case 'End':
        if (this.isOpen && !isInput) {
          ev.preventDefault();
          this.updateFocusedIndex(maxIndex);
        }
        break;
      case 'Enter':
        if (isInput) {
          if (this.parsedOptions.length > 0) {
            ev.preventDefault();
            this.handleSelect(this.parsedOptions[0]);
          }
        } else {
          ev.preventDefault();
          if (this.isOpen && this.focusedIndex >= 0 && this.focusedIndex < this.parsedOptions.length) {
            this.handleSelect(this.parsedOptions[this.focusedIndex]);
          } else {
            this.toggleMenu();
          }
        }
        break;
      case ' ':
        if (!isInput) {
          ev.preventDefault();
          if (this.isOpen && this.focusedIndex >= 0 && this.focusedIndex < this.parsedOptions.length) {
            this.handleSelect(this.parsedOptions[this.focusedIndex]);
          } else {
            this.toggleMenu();
          }
        }
        break;
      case 'Escape':
        if (this.isOpen) {
          ev.preventDefault();
          this.isOpen = false;
          this.focusedIndex = -1;
          this.searchTerm = '';
          this.clearScrollLoading();
          requestAnimationFrame(() => safeFocus(this.triggerEl));
        }
        break;
      case 'Tab':
        if (this.isOpen) {
          this.isOpen = false;
          this.focusedIndex = -1;
          this.searchTerm = '';
          this.clearScrollLoading();
        }
        break;
    }
  };

  // Close dropdown if user clicks outside of the element
  @Listen('click', { target: 'window' })
  handleClickOutside(ev: MouseEvent) {
    const path = ev.composedPath();
    if (this.el && !path.includes(this.el)) {
      this.isOpen = false;
      this.focusedIndex = -1;
      this.searchTerm = '';
      this.visibleCount = 20;
      this.clearScrollLoading();
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const allOptions = this.getAllOptions();
    const opts = this.parsedOptions;
    const selectedOption = this.getSelectedOption(allOptions);
    const selectedLabel = this.getOptionLabel(selectedOption);
    const displayLabel = selectedOption && selectedLabel ? selectedLabel : this.placeholder;
    const hasSelection = selectedOption !== undefined;
    const dynamicWidth = this.computeDynamicWidth(allOptions, selectedOption);

    return (
      <div 
        class={{
          'dropdown-wrapper': true,
          'is-open': this.isOpen,
          'is-disabled': this.disabled,
          [`size-${this.size}`]: true
        }}
        style={dynamicWidth ? { width: dynamicWidth, 'max-width': '100%' } : undefined}
        onKeyDown={this.handleKeyDown}
      >
        {/* Optional Header Label */}
        {this.label && (
          <label class="dropdown-label" htmlFor="q-field" part="label">
            {this.label}
          </label>
        )}

        {/* Custom Trigger Box (Renders as standard button for click stability) */}
        <button
          ref={(el) => (this.triggerEl = el)}
          id="q-field"
          class="dropdown-trigger"
          part="trigger"
          type="button"
          disabled={this.disabled}
          onClick={this.handleTriggerClick}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          aria-haspopup="listbox"
          aria-expanded={this.isOpen ? 'true' : 'false'}
          aria-controls={this.isOpen ? 'q-field-menu' : undefined}
          aria-activedescendant={this.isOpen && this.focusedIndex >= 0 ? `q-field-item-${this.focusedIndex}` : undefined}
        >
          <span class={{ 'trigger-text': true, 'is-placeholder': !hasSelection }}>
            {displayLabel}
          </span>
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Options List Menu (Absolute Overlay inside Webview Canvas) */}
        {this.isOpen && (
          <div 
            id="q-field-menu"
            class="dropdown-menu" 
            part="menu" 
            role="listbox"
            aria-label={this.label || 'Options'}
          >
            {this.searchable && (
              <div class="dropdown-search-container">
                <input
                  ref={(el) => (this.searchInputEl = el)}
                  type="text"
                  class="dropdown-search-input"
                  placeholder="Search..."
                  value={this.searchTerm}
                  onInput={this.handleSearchInput}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="q-field-menu"
                  aria-expanded={this.isOpen ? 'true' : 'false'}
                  aria-activedescendant={this.focusedIndex >= 0 ? `q-field-item-${this.focusedIndex}` : undefined}
                />
              </div>
            )}
            <ul class="dropdown-items-list" onScroll={this.handleScroll}>
              {opts.length === 0 ? (
                <li class="menu-item is-empty">No matches found</li>
              ) : (
                opts.map((option, index) => (
                  <li
                    id={`q-field-item-${index}`}
                    class={{
                      'menu-item': true,
                      'is-selected': option.value === this.value,
                      'is-focused': index === this.focusedIndex
                    }}
                    tabindex={index === this.focusedIndex ? 0 : -1}
                    part={`item ${option.value === this.value ? 'selected-item' : ''} ${index === this.focusedIndex ? 'focused-item' : ''}`}
                    role="option"
                    aria-selected={option.value === this.value ? 'true' : 'false'}
                    onClick={() => this.handleSelect(option)}
                  >
                    {this.getOptionLabel(option)}
                  </li>
                ))
              )}
              {this.isScrollingLoading && (
                <li class="menu-item is-loading-more">
                  <span class="spinner-circle"></span>
                  <span>Loading...</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
}
