import { Component, Prop, State, Event, EventEmitter, Element, AttachInternals, Watch, Listen, h } from '@stencil/core';
import { safeParseJson } from '../../../utils/utils';
import { safeFocus } from '../../../utils/dom';
import type { Option, QDropdownSize } from './dropdown.types';

@Component({
  tag: 'q-dropdown',
  styleUrl: 'dropdown.css',
  shadow: {
    delegatesFocus: true
  },
  formAssociated: true
})
export class QDropdown {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Prop({ mutable: true }) value: string = "";
  @Prop({ reflect: true }) name?: string;
  @Prop() label?: string;
  @Prop() placeholder: string = "Select an option...";
  @Prop() options: Option[] | string = [];
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) size: QDropdownSize = 'md';
  @Prop() searchable: boolean = false;

  @State() isOpen: boolean = false;
  @State() focusedIndex: number = -1;
  @State() searchTerm: string = "";
  @State() visibleCount: number = 20;
  @State() isScrollingLoading: boolean = false;

  private scrollTimeout: any = null;

  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  @Event() qChange!: EventEmitter<string>;
  @Event() qSelect!: EventEmitter<Option>;
  @Event() qFocus!: EventEmitter<FocusEvent>;
  @Event() qBlur!: EventEmitter<FocusEvent>;
  @Event() qClick!: EventEmitter<MouseEvent>;

  private triggerEl?: HTMLButtonElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private searchInputEl?: HTMLInputElement;
  private initialValue: string = "";

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
    this.initialValue = this.value || "";
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
    if (!this.searchTerm) {
      this.searchTerm = "";
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
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  private getFilteredOptions(): Option[] {
    const list = safeParseJson(this.options, [], 'QDropdown');

    if (this.searchable && this.searchTerm && this.searchTerm.trim() !== "") {
      const term = this.searchTerm.toLowerCase();
      return list.filter(opt => opt.label.toLowerCase().includes(term));
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
      this.searchTerm = "";
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
      this.searchTerm = "";
      this.visibleCount = 20;
      requestAnimationFrame(() => safeFocus(this.triggerEl));
    }
  };

  private handleSelect = (option: Option) => {
    this.value = option.value;
    this.isOpen = false;
    this.focusedIndex = -1;
    this.searchTerm = "";
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
    this.searchTerm = target.value || "";
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
        if (this.scrollTimeout) {
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
          this.searchTerm = "";
          this.clearScrollLoading();
          requestAnimationFrame(() => safeFocus(this.triggerEl));
        }
        break;
      case 'Tab':
        if (this.isOpen) {
          this.isOpen = false;
          this.focusedIndex = -1;
          this.searchTerm = "";
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
      this.searchTerm = "";
      this.visibleCount = 20;
      this.clearScrollLoading();
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const opts = this.parsedOptions;
    const selectedOption = this.parsedOptions.find(opt => opt.value === this.value) 
      || (typeof this.options === 'object' && Array.isArray(this.options) ? this.options.find(opt => opt.value === this.value) : undefined);
    const displayLabel = selectedOption ? selectedOption.label : this.placeholder;
    const hasSelection = selectedOption !== undefined;

    let dynamicWidth: string | undefined = undefined;
    if (this.size === 'sm') {
      if (this.searchable) {
        const labelText = selectedOption ? selectedOption.label : this.placeholder;
        const labelLength = labelText ? labelText.length : 0;
        const calculatedWidth = labelLength * 7.2 + 38;
        dynamicWidth = `${Math.ceil(Math.max(160, calculatedWidth))}px`;
      } else {
        const allOptions = safeParseJson<Option[]>(this.options, []);
        const lengths = allOptions.map(o => o.label ? o.label.length : 0);
        if (this.placeholder) {
          lengths.push(this.placeholder.length);
        }
        const maxLength = Math.max(...lengths, 0);
        const calculatedWidth = maxLength * 7.2 + 38;
        dynamicWidth = `${Math.ceil(calculatedWidth)}px`;
      }
    }

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
                    {option.label}
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
