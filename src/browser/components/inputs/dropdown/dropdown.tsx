import { isFieldDisabled, syncFieldHost } from '../../../utils/form-field-state';
import { registerFormField } from '../../../utils/form-field-adapter';
import { fieldFeedback, feedbackStyle } from '../../shared/field';
import { Component, Prop, State, Event, EventEmitter, Element, AttachInternals, Watch, Listen, Method, h } from '@stencil/core';
import { identifyItems } from '../../../utils/collection-identity';
import type { DropdownOptionInput, Option, QDropdownPlacement, QDropdownSize } from './dropdown.types';
import { getDropdownOptions, getFilteredOptions, getOptionLabel, getSelectedOption, getVisibleOptions } from './internals/options';
import { computeDropdownPosition } from './internals/position';

const MENU_OFFSET = 4;

/**
 * Form-associated dropdown/select control with optional search, incremental option rendering,
 * and externally loaded option pages.
 * @slot icon-left - Optional leading content rendered inside the trigger.
 * @part label - Optional field label.
 * @part trigger - Active input or button that opens the option menu.
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
  @Prop() label?: string;
  /** Accessible name for the trigger and option list when no visible label is available. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Supporting text, replaced by an active error. */
  @Prop() description?: string;
  @Prop() placeholder: string = 'Select an option...';
  /** Options to render; strings use the same text for label and value, while objects allow separate values. */
  @Prop() options: DropdownOptionInput[] | string = [];
  @Prop({ mutable: true }) value: string = '';

  /** Keep the label accessible without displaying it. */
  @Prop() labelHidden: boolean = false;
  /** Omitted inherits the enclosing form; false cancels reservation. */
  @Prop() reserveFeedback?: boolean;
  @Prop({ reflect: true }) size: QDropdownSize = 'inherit';

  @Prop() searchable: boolean = false;
  /** Search in the main editable control (default) or a separate menu field. Applies only when searchable. */
  @Prop() searchMode: 'default' | 'menu' = 'default';
  /** Delegates filtering and pagination to the consumer. */
  @Prop() externalSearch: boolean = false;
  /** Indicates another externally loaded option page is available. */
  @Prop() hasMore: boolean = false;
  @Prop() loading: boolean = false;

  /** `auto` uses a side with sufficient viewport space. */
  @Prop() placement: QDropdownPlacement = 'auto';
  /** Minimum distance maintained between the open menu and viewport edges. */
  @Prop() collisionPadding: number = 8;

  @Prop({ reflect: true }) disabled: boolean = false;

  @Prop({ reflect: true }) required: boolean = false;
  /** Custom validation error; independent of currently loaded options. */
  @Prop() error?: string;

  @Prop({ reflect: true }) name?: string;

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

  /** Emitted with the current search term when a searchable dropdown uses external search. */
  @Event() qSearch!: EventEmitter<string>;

  /** Emitted when an externally loaded option list reaches its scroll boundary. */
  @Event() qLoadMore!: EventEmitter<void>;

  @Event() qFocus!: EventEmitter<FocusEvent>;

  @Event() qBlur!: EventEmitter<FocusEvent>;

  /** Emitted before the trigger toggles the menu. */
  @Event() qClick!: EventEmitter<MouseEvent>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() private disabledState = false;

  private get isDisabled(): boolean {
    return isFieldDisabled(this.el, this.disabled);
  }

  private triggerEl?: HTMLButtonElement | HTMLInputElement;
  private searchInputEl?: HTMLInputElement;
  private menuEl?: HTMLDivElement;
  private itemsListEl?: HTMLUListElement;
  private initialValue: string = '';
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private positionFrame: number | null = null;
  private floatingCleanup?: () => void;
  private floatingResizeObserver?: ResizeObserver;
  @State() private draftEdited = false;
  @State() private selectedLabelCache?: { value: string; label: string };
  private composing = false;
  private lastSearchValue?: string;

  private get editableSearch(): boolean { return this.searchable && this.searchMode !== 'menu'; }

  private reconcileSelectedLabel(): void {
    const selected = this.getSelectedOption();
    if (selected) this.selectedLabelCache = { value: this.value, label: this.getOptionLabel(selected) };
    else if (!this.value || !this.externalSearch || this.selectedLabelCache?.value !== this.value) this.selectedLabelCache = undefined;
  }

  private closeMenu(): void {
    this.isOpen = false;
    this.focusedIndex = -1;
    this.searchTerm = '';
    this.lastSearchValue = undefined;
    this.draftEdited = false;
    this.composing = false;
    this.visibleCount = 20;
    this.clearScrollLoading();
    if (this.triggerEl?.tagName === 'INPUT') {
      const selected = this.getSelectedOption();
      this.triggerEl.value = this.getOptionLabel(selected) || (this.externalSearch && this.selectedLabelCache?.value === this.value ? this.selectedLabelCache.label : '');
    }
  }

  @Watch('searchMode')
  @Watch('searchable')
  watchSearchMode(): void {
    const hadFocus = Boolean(this.el.shadowRoot?.activeElement);
    this.closeMenu();
    this.searchInputEl = undefined;
    if (hadFocus) requestAnimationFrame(() => focusWithoutScroll(this.triggerEl));
  }

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  disconnectedCallback() {
    this.clearScrollLoading();
    this.stopFloatingUpdates();
  }

  formDisabledCallback() {
    this.syncValidity();
  }

  componentDidLoad() {
    registerFormField(this.el, {
      kind: 'selection',
      owner: () => this.internals?.form ?? null,
      active: () => true,
      value: () => this.getFormSelection(),
      assign: value => { this.value = value as string; },
      reconcile: () => {
        this.syncValidity();
      },
      reset: () => this.formResetCallback(),
      validate: report => report ? this.internals?.reportValidity?.() ?? true : this.internals?.checkValidity?.() ?? true,
    });
  }

  componentDidRender() {
    this.syncValidity();
    if (this.isOpen) {
      this.openFloatingMenu();
      return;
    }

    this.stopFloatingUpdates();
  }

  @Watch('value')
  watchValue(newValue: string) {
    this.reconcileSelectedLabel();
    this.closeMenu();
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(newValue);
    }
    this.syncValidity();
  }

  @Watch('name')
  @Watch('externalSearch')
  @Watch('required')
  @Watch('error')
  @Watch('disabled')
  syncValidity(): void {
    const disabled = syncFieldHost(this.el, this.disabled, this.name, this.required);
    if (this.disabledState !== disabled) this.disabledState = disabled;
    if (this.triggerEl) this.triggerEl.disabled = disabled;
    if (this.searchInputEl) this.searchInputEl.disabled = disabled;
    if (disabled && this.isOpen) {
      this.closeMenu();
      this.stopFloatingUpdates();
    }
    const selected = this.getFormSelection();
    this.internals?.setFormValue?.(disabled ? null : selected);
    if (typeof this.internals?.setValidity !== 'function') return;
    const message = this.isDisabled ? '' : this.error?.trim() || (this.required && (!this.value || selected === null) ? 'Please select an option.' : '');
    this.internals.setValidity(message ? this.error?.trim() ? { customError: true } : { valueMissing: true } : {}, message, this.triggerEl);
  }

  @Method()
  async checkValidity(): Promise<boolean> {
    this.syncValidity();
    return this.isDisabled || !(this.error?.trim() || (this.required && (!this.value || this.getFormSelection() === null)));
  }

  @Method()
  async reportValidity(): Promise<boolean> {
    const valid = await this.checkValidity();
    if (!valid) {
      this.triggerEl?.focus();
      this.internals?.reportValidity?.();
    }
    return valid;
  }

  @Method()
  async focusElement(): Promise<void> {
    this.triggerEl?.focus();
  }

  @Watch('options')
  watchOptions() {
    this.reconcileSelectedLabel();
    this.focusedIndex = -1;
    this.syncValidity();
    if (this.externalSearch) {
      this.isScrollingLoading = false;
    }
  }

  @Watch('loading')
  watchLoading(newValue: boolean) {
    if (!newValue) {
      this.isScrollingLoading = false;
    }
  }

  componentWillLoad() {
    this.reconcileSelectedLabel();
    this.initialValue = this.value || '';
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
    if (!this.searchTerm) {
      this.searchTerm = '';
    }
    this.syncValidity();
  }

  formResetCallback() {
    this.closeMenu();
    this.value = this.initialValue;
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
    this.syncValidity();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private getFormSelection(): string | null {
    const selected = getSelectedOption(getDropdownOptions(this.options), this.value);
    if (selected && (selected as Option & { disabled?: boolean }).disabled !== true) return selected.value;
    return this.externalSearch && !selected && this.value ? this.value : null;
  }

  private clearScrollLoading() {
    this.isScrollingLoading = false;
    if (this.scrollTimeout !== null) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  private getOptionLabel(option: Partial<Option> | undefined): string {
    return getOptionLabel(option);
  }

  private getAllOptions(): Option[] {
    return getDropdownOptions(this.options);
  }

  private getSelectedOption(options = this.getAllOptions()): Option | undefined {
    return getSelectedOption(options, this.value);
  }

  private getFilteredOptions(): Option[] {
    if (this.externalSearch) {
      return this.getAllOptions();
    }

    return getFilteredOptions(this.getAllOptions(), this.searchTerm, this.searchable);
  }

  private get parsedOptions(): Option[] {
    if (this.externalSearch) {
      return this.getFilteredOptions();
    }

    return getVisibleOptions(this.getFilteredOptions(), this.visibleCount);
  }

  private toggleMenu = () => {
    if (this.isDisabled) return;
    this.isOpen = !this.isOpen;
    this.clearScrollLoading();
    if (this.isOpen) {
      this.searchTerm = '';
      this.visibleCount = 20;
      if (this.searchable) {
        this.focusedIndex = -1;
        requestAnimationFrame(() => focusWithoutScroll(this.editableSearch ? this.triggerEl : this.searchInputEl));
      } else {
        const activeIdx = this.parsedOptions.findIndex(opt => opt.value === this.value);
        const nextIdx = activeIdx >= 0 ? activeIdx : 0;
        this.updateFocusedIndex(nextIdx);
      }
    } else {
      this.closeMenu();
      requestAnimationFrame(() => focusWithoutScroll(this.triggerEl));
    }
  };

  private handleSelect = (option: Option) => {
    if (this.isDisabled) return;
    this.value = option.value;
    this.selectedLabelCache = { value: option.value, label: this.getOptionLabel(option) };
    this.closeMenu();
    this.qChange.emit(option.value);
    this.qSelect.emit(option);
    requestAnimationFrame(() => focusWithoutScroll(this.triggerEl));
  };

  private handleFocus = (ev: FocusEvent) => {
    this.qFocus.emit(ev);
  };

  private handleBlur = (ev: FocusEvent) => {
    this.qBlur.emit(ev);
  };

  private handleFocusOut = (ev: FocusEvent) => {
    const next = ev.relatedTarget as Node | null;
    if (!next || (!this.el.contains(next) && !this.el.shadowRoot?.contains(next))) this.closeMenu();
  };

  private handleEditableClick = (ev: MouseEvent) => {
    if (this.isDisabled) return;
    this.qClick.emit(ev);
    if (!this.isOpen) this.toggleMenu();
  };

  private handleCompositionStart = () => { this.composing = true; };
  private handleCompositionEnd = (ev: CompositionEvent) => {
    this.composing = false;
    this.handleSearchInput(ev);
  };

  private handleTriggerClick = (ev: MouseEvent) => {
    if (this.isDisabled) return;
    this.qClick.emit(ev);
    this.toggleMenu();
  };

  private handleSearchInput = (ev: Event) => {
    if (this.isDisabled) return;
    const target = ev.target as HTMLInputElement;
    if (this.composing || (ev as InputEvent).isComposing) return;
    this.draftEdited = true;
    this.searchTerm = target.value || '';
    this.isOpen = true;
    this.focusedIndex = -1;
    this.visibleCount = 20;
    this.clearScrollLoading();

    if (this.externalSearch && this.searchTerm !== this.lastSearchValue) {
      this.lastSearchValue = this.searchTerm;
      this.qSearch.emit(this.searchTerm);
    }
  };

  private handleScroll = (ev: Event) => {
    const listEl = ev.target as HTMLElement;
    if (!listEl) return;

    const threshold = 5;
    const isAtBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight <= threshold;

    if (isAtBottom && !this.isScrollingLoading) {
      if (this.externalSearch) {
        if (this.hasMore && !this.loading) {
          this.isScrollingLoading = true;
          this.qLoadMore.emit();
        }

        return;
      }

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
    requestAnimationFrame(() => this.scrollFocusedOptionInsideList());
  }

  private scrollFocusedOptionInsideList() {
    const list = this.itemsListEl;
    if (!list || this.focusedIndex < 0 || !this.isOpen) {
      return;
    }

    const option = this.el.shadowRoot?.querySelector<HTMLElement>(
      `#q-field-item-${this.focusedIndex}`,
    );
    if (!option) {
      return;
    }

    const optionTop = option.offsetTop;
    const optionBottom = optionTop + option.offsetHeight;
    const visibleTop = list.scrollTop;
    const visibleBottom = visibleTop + list.clientHeight;

    if (optionTop < visibleTop) {
      list.scrollTop = optionTop;
    } else if (optionBottom > visibleBottom) {
      list.scrollTop = optionBottom - list.clientHeight;
    }
  }

  private openFloatingMenu() {
    if (!this.menuEl || !this.triggerEl) {
      return;
    }

    showPopoverIfSupported(this.menuEl);
    this.startFloatingUpdates();
    this.scheduleMenuPosition();
  }

  private startFloatingUpdates() {
    if (this.floatingCleanup || !this.menuEl || !this.triggerEl) {
      return;
    }

    const update = () => this.scheduleMenuPosition();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    if (typeof ResizeObserver !== 'undefined') {
      this.floatingResizeObserver = new ResizeObserver(update);
      this.floatingResizeObserver.observe(this.triggerEl);
      this.floatingResizeObserver.observe(this.menuEl);
    }

    this.floatingCleanup = () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      this.floatingResizeObserver?.disconnect();
      this.floatingResizeObserver = undefined;
    };
  }

  private stopFloatingUpdates() {
    if (this.positionFrame !== null) {
      cancelAnimationFrame(this.positionFrame);
      this.positionFrame = null;
    }

    this.floatingCleanup?.();
    this.floatingCleanup = undefined;

    if (this.menuEl) {
      hidePopoverIfOpen(this.menuEl);
      this.menuEl = undefined;
    }
    this.itemsListEl = undefined;
  }

  private scheduleMenuPosition() {
    if (this.positionFrame !== null) {
      return;
    }

    this.positionFrame = requestAnimationFrame(() => {
      this.positionFrame = null;
      this.positionFloatingMenu();
    });
  }

  private positionFloatingMenu() {
    const trigger = this.triggerEl;
    const menu = this.menuEl;
    if (!this.isOpen || !trigger || !menu) {
      return;
    }

    showPopoverIfSupported(menu);
    const triggerRect = trigger.getBoundingClientRect();
    menu.style.visibility = 'hidden';
    menu.style.left = '0px';
    menu.style.top = '0px';
    menu.style.width = `${triggerRect.width}px`;
    menu.style.maxHeight = 'none';

    const menuHeight = menu.getBoundingClientRect().height;
    const position = computeDropdownPosition({
      trigger: triggerRect,
      menuHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      placement: this.placement,
      collisionPadding: this.collisionPadding,
      offset: MENU_OFFSET,
    });

    menu.dataset['placement'] = position.placement;
    menu.style.left = `${position.left}px`;
    menu.style.top = `${position.top}px`;
    menu.style.width = `${position.width}px`;
    menu.style.maxHeight = `${position.maxHeight}px`;
    menu.style.visibility = 'visible';
  }

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (this.isDisabled || this.composing || ev.isComposing || ev.keyCode === 229) return;
    const isInput = (ev.target as HTMLElement)?.tagName?.toLowerCase() === 'input';
    const maxIndex = this.parsedOptions.length - 1;
    switch (ev.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        ev.preventDefault();
        const opening = !this.isOpen;
        this.isOpen = true;
        if (opening && this.searchable && !this.editableSearch) {
          this.focusedIndex = -1;
          requestAnimationFrame(() => focusWithoutScroll(this.searchInputEl));
        } else if (ev.key === 'ArrowDown') {
          const selected = opening && !isInput ? this.parsedOptions.findIndex(option => option.value === this.value) : -1;
          this.updateFocusedIndex(selected >= 0 ? selected : Math.min(this.focusedIndex + 1, maxIndex));
        } else {
          this.updateFocusedIndex(this.focusedIndex < 0 ? maxIndex : Math.max(-1, this.focusedIndex - 1));
        }
        break;
      }
      case 'Home':
      case 'End':
        if (this.isOpen && !isInput) {
          ev.preventDefault();
          this.updateFocusedIndex(ev.key === 'Home' ? 0 : maxIndex);
        }
        break;
      case 'Enter':
        if (isInput) {
          if (this.isOpen) {
            ev.preventDefault();
            if (this.focusedIndex >= 0 && this.focusedIndex <= maxIndex) this.handleSelect(this.parsedOptions[this.focusedIndex]);
          }
        } else {
          ev.preventDefault();
          if (this.isOpen && this.focusedIndex >= 0 && this.focusedIndex <= maxIndex) this.handleSelect(this.parsedOptions[this.focusedIndex]);
          else this.toggleMenu();
        }
        break;
      case ' ':
        if (!isInput) {
          ev.preventDefault();
          if (this.isOpen && this.focusedIndex >= 0 && this.focusedIndex <= maxIndex) this.handleSelect(this.parsedOptions[this.focusedIndex]);
          else this.toggleMenu();
        }
        break;
      case 'Escape':
        if (this.isOpen || this.draftEdited) {
          ev.preventDefault();
          this.closeMenu();
          requestAnimationFrame(() => focusWithoutScroll(this.triggerEl));
        }
        break;
      case 'Tab':
        this.closeMenu();
        break;
    }
  };
  // Close dropdown if user clicks outside of the element
  @Listen('click', { target: 'window' })
  handleClickOutside(ev: MouseEvent) {
    const path = ev.composedPath();
    if (this.el && !path.includes(this.el)) {
      this.closeMenu();
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const allOptions = this.getAllOptions();
    const opts = this.parsedOptions;
    const identifiedOptions = identifyItems(opts, option => option.value, {
      warningContext: 'q-dropdown options',
    });
    const selectedOption = this.getSelectedOption(allOptions);
    const selectedLabel = this.getOptionLabel(selectedOption) || (this.externalSearch && this.selectedLabelCache?.value === this.value ? this.selectedLabelCache.label : '');
    const displayLabel = selectedLabel || this.placeholder;
    const hasSelection = selectedOption !== undefined || Boolean(this.externalSearch && this.selectedLabelCache?.value === this.value);
    const ariaLabel = this.ariaLabel?.trim() || undefined;

    return (
      <div
        style={feedbackStyle(this.reserveFeedback)}
        class={{
          'dropdown-wrapper': true,
          'is-open': this.isOpen,
          'is-disabled': this.isDisabled,
          [`size-${this.size}`]: true
        }}
        onKeyDown={this.handleKeyDown}
        onFocusout={this.handleFocusOut}
      >
        {/* Optional Header Label */}
        {this.label && (
          <label class={{ 'dropdown-label': true, 'q-label-hidden': this.labelHidden }} htmlFor="q-field" part="label">
            {this.label}
          </label>
        )}

        {/* Custom Trigger Box (Renders as standard button for click stability) */}
        {this.editableSearch ? <div class={{ 'editable-trigger': true, 'has-leading-icon': Boolean(this.el.querySelector('[slot="icon-left"]')) }}>
          <span class="editable-leading"><slot name="icon-left" /></span>
          <input
            ref={el => (this.triggerEl = el)}
            id="q-field"
            class="dropdown-trigger dropdown-main-input"
            part="trigger"
            type="text"
            role="combobox"
            autocomplete="off"
            disabled={this.isDisabled}
            value={this.composing ? this.triggerEl?.value ?? selectedLabel : this.draftEdited ? this.searchTerm : selectedLabel}
            placeholder={this.placeholder}
            onClick={this.handleEditableClick}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            onInput={this.handleSearchInput}
            onCompositionstart={this.handleCompositionStart}
            onCompositionend={this.handleCompositionEnd}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-required={this.required ? 'true' : 'false'}
            aria-invalid={this.error || (this.required && !this.value) ? 'true' : 'false'}
            aria-describedby={this.error || this.description ? 'q-field-error' : undefined}
            aria-label={ariaLabel}
            aria-expanded={this.isOpen ? 'true' : 'false'}
            aria-controls={this.isOpen ? 'q-field-menu' : undefined}
            aria-activedescendant={this.isOpen && this.focusedIndex >= 0 ? `q-field-item-${this.focusedIndex}` : undefined}
          />
          <svg class="chevron-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
        </div> : <button
          ref={(el) => (this.triggerEl = el)}
          id="q-field"
          class="dropdown-trigger"
          part="trigger"
          type="button"
          disabled={this.isDisabled}
          onClick={this.handleTriggerClick}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          aria-haspopup="listbox"
          aria-required={this.required ? 'true' : 'false'}
          aria-invalid={this.error || (this.required && !this.value) ? 'true' : 'false'}
          aria-describedby={this.error || this.description ? 'q-field-error' : undefined}
          aria-label={ariaLabel}
          aria-expanded={this.isOpen ? 'true' : 'false'}
          aria-controls={this.isOpen ? 'q-field-menu' : undefined}
          aria-activedescendant={this.isOpen && this.focusedIndex >= 0 ? `q-field-item-${this.focusedIndex}` : undefined}
        >
          <span class="trigger-content">
            <slot name="icon-left" />
            <span class={{ 'trigger-text': true, 'is-placeholder': !hasSelection }}>
              {displayLabel}
            </span>
          </span>
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>}

        {fieldFeedback('q-field-error', this.error, this.description)}

        {/* Viewport-positioned menu promoted to the browser top layer when supported. */}
        {this.isOpen && (
          <div 
            ref={(el) => (this.menuEl = el)}
            id="q-field-menu"
            class="dropdown-menu" 
            part="menu" 
            role="listbox"
            popover="manual"
            aria-label={ariaLabel || this.label || 'Options'}
          >
            {this.searchable && !this.editableSearch && (
              <div class="dropdown-search-container">
                <input
                  ref={(el) => (this.searchInputEl = el)}
                  type="text"
                  class="dropdown-search-input"
                  placeholder="Search..."
                  value={this.searchTerm}
                  onInput={this.handleSearchInput}
                  onCompositionstart={this.handleCompositionStart}
                  onCompositionend={this.handleCompositionEnd}
                  aria-label={ariaLabel || this.label || 'Search options'}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="q-field-menu"
                  aria-expanded={this.isOpen ? 'true' : 'false'}
                  aria-activedescendant={this.focusedIndex >= 0 ? `q-field-item-${this.focusedIndex}` : undefined}
                />
              </div>
            )}
            <ul
              ref={(el) => (this.itemsListEl = el)}
              class="dropdown-items-list"
              onScroll={this.handleScroll}
            >
              {opts.length === 0 && !this.loading ? (
                <li class="menu-item is-empty">No matches found</li>
              ) : (
                identifiedOptions.map(({ item: option, index, key }) => (
                  <li
                    key={key}
                    id={`q-field-item-${index}`}
                    class={{
                      'menu-item': true,
                      'is-selected': option.value === this.value,
                      'is-focused': index === this.focusedIndex
                    }}
                    tabindex={-1}
                    part={`item ${option.value === this.value ? 'selected-item' : ''} ${index === this.focusedIndex ? 'focused-item' : ''}`}
                    role="option"
                    aria-selected={option.value === this.value ? 'true' : 'false'}
                    onClick={() => this.handleSelect(option)}
                    onMouseDown={ev => ev.preventDefault()}
                  >
                    {this.getOptionLabel(option)}
                  </li>
                ))
              )}
              {(this.loading || this.isScrollingLoading) && (
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

type PopoverElement = HTMLElement & {
  hidePopover?: () => void;
  showPopover?: () => void;
};

function focusWithoutScroll(element: HTMLElement | null | undefined): void {
  if (!element || typeof element.focus !== 'function') {
    return;
  }

  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
}

function showPopoverIfSupported(element: PopoverElement): void {
  if (typeof element.showPopover !== 'function') {
    return;
  }

  try {
    if (!element.matches(':popover-open')) {
      element.showPopover();
    }
  } catch {
    // Fixed positioning remains the fallback when the top-layer API is unavailable.
  }
}

function hidePopoverIfOpen(element: PopoverElement): void {
  if (typeof element.hidePopover !== 'function') {
    return;
  }

  try {
    if (element.matches(':popover-open')) {
      element.hidePopover();
    }
  } catch {
    // Removing the rendered menu also removes it from the top layer.
  }
}
