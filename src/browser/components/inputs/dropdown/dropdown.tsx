import type { QInputWidth } from '../../../theme/tokens';
import { isFieldDisabled, syncFieldHost } from '../../../utils/form-field-state';
import { registerFormField } from '../../../utils/form-field-adapter';
import { fieldFeedback, feedbackStyle } from '../../shared/field';
import { Component, Prop, State, Event, EventEmitter, Element, AttachInternals, Watch, Listen, Method, Fragment, h } from '@stencil/core';
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
  /** Select several options. Uses values/qValuesChange instead of value/qChange. */
  @Prop({ reflect: true }) multiple: boolean = false;
  /** Selected identities in multiple mode. Replace the array to update selections. */
  @Prop({ mutable: true }) values: string[] = [];

  /** Keep the label accessible without displaying it. */
  @Prop() labelHidden: boolean = false;
  /** Omitted inherits the enclosing form; false cancels reservation. */
  @Prop() reserveFeedback?: boolean;
  @Prop({ reflect: true }) size: QDropdownSize = 'inherit';
  /** Opt-in horizontal width; fit-options sizes to loaded option labels. Omitted keeps the full-width layout. */
  @Prop({ reflect: true }) width?: QInputWidth | 'fit-options';

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

  /** Complete selected identities after an add or removal in multiple mode. */
  @Event() qValuesChange!: EventEmitter<string[]>;

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
  private fitOptionsMeasure?: HTMLElement;
  private fitOptionsObserver?: ResizeObserver;
  @State() private draftEdited = false;
  @State() private selectedLabelCache?: { value: string; label: string };
  private composing = false;
  private lastSearchValue?: string;
  private initialValues: string[] = [];
  private multipleLabels = new Map<string, string>();
  private multipleFrame?: HTMLElement;
  private chipMeasure?: HTMLElement;
  private multipleObserver?: ResizeObserver;
  @State() private visibleChips = 0;
  @State() private selectedPanel = false;

  private get editableSearch(): boolean { return this.multiple || this.searchable && this.searchMode !== 'menu'; }

  private get selectedValues(): string[] {
    return Array.isArray(this.values) ? [...new Set(this.values.filter(value => typeof value === 'string'))] : [];
  }

  private reconcileSelectedLabel(): void {
    const selected = this.getSelectedOption();
    if (selected) this.selectedLabelCache = { value: this.value, label: this.getOptionLabel(selected) };
    else if (!this.value || !this.externalSearch || this.selectedLabelCache?.value !== this.value) this.selectedLabelCache = undefined;
  }

  private closeMenu(): void {
    this.isOpen = false;
    this.selectedPanel = false;
    this.focusedIndex = -1;
    this.searchTerm = '';
    this.lastSearchValue = undefined;
    this.draftEdited = false;
    this.composing = false;
    this.visibleCount = 20;
    this.clearScrollLoading();
    if (this.triggerEl?.tagName === 'INPUT') {
      const selected = this.getSelectedOption();
      this.triggerEl.value = this.multiple ? '' : this.getOptionLabel(selected) || (this.externalSearch && this.selectedLabelCache?.value === this.value ? this.selectedLabelCache.label : '');
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

  connectedCallback() {
    this.observeFitOptions();
  }

  disconnectedCallback() {
    this.clearScrollLoading();
    this.stopFloatingUpdates();
    this.fitOptionsObserver?.disconnect();
    this.multipleObserver?.disconnect();
  }

  formDisabledCallback() {
    this.syncValidity();
  }

  componentDidLoad() {
    const dropdown = this;
    registerFormField(this.el, {
      get kind() { return dropdown.multiple ? 'multiselect' : 'selection'; },
      owner: () => this.internals?.form ?? null,
      active: () => true,
      value: () => this.multiple ? this.getMultipleFormSelection() : this.getFormSelection(),
      assign: value => {
        if (this.multiple) this.values = Array.isArray(value) ? [...value] : [];
        else this.value = value as string;
      },
      reconcile: () => {
        this.syncValidity();
      },
      reset: () => this.formResetCallback(),
      validate: report => report ? this.internals?.reportValidity?.() ?? true : this.internals?.checkValidity?.() ?? true,
    });
  }

  componentDidRender() {
    this.syncValidity();
    this.observeFitOptions();
    this.observeMultipleLayout();
    if (this.isOpen) {
      this.openFloatingMenu();
      return;
    }

    this.stopFloatingUpdates();
  }

  private observeFitOptions = () => {
    this.fitOptionsObserver?.disconnect();
    if (this.width !== 'fit-options' || !this.fitOptionsMeasure) {
      this.el.style.removeProperty('--_q-dropdown-options-width');
      return;
    }

    this.fitOptionsObserver ??= new ResizeObserver(this.updateFitOptionsWidth);
    this.fitOptionsObserver.observe(this.fitOptionsMeasure, { box: 'border-box' });
    for (const icon of Array.from(this.el.querySelectorAll('[slot="icon-left"]'))) {
      this.fitOptionsObserver.observe(icon);
    }
    this.updateFitOptionsWidth();
  };

  private updateFitOptionsWidth = () => {
    if (this.width !== 'fit-options' || !this.fitOptionsMeasure || !this.triggerEl) return;

    const icons = Array.from(this.el.querySelectorAll<HTMLElement>('[slot="icon-left"]'));
    const triggerStyle = getComputedStyle(this.triggerEl);
    const gap = parseFloat(triggerStyle.columnGap) || 0;
    const leadingWidth = icons.reduce((total, icon) => {
      const style = getComputedStyle(icon);
      return total + icon.getBoundingClientRect().width + (parseFloat(style.marginInlineStart) || 0) + (parseFloat(style.marginInlineEnd) || 0);
    }, 0);
    const labelWidth = this.fitOptionsMeasure.querySelector('.fit-options-labels')!.getBoundingClientRect().width;
    const arrowWidth = this.fitOptionsMeasure.querySelector('.chevron-icon')!.getBoundingClientRect().width;
    const frameWidth = (['paddingInlineStart', 'paddingInlineEnd', 'borderInlineStartWidth', 'borderInlineEndWidth'] as const)
      .reduce((total, property) => total + (parseFloat(triggerStyle[property]) || 0), 0);
    const adornmentWidth = this.editableSearch ? 0 : arrowWidth + gap + leadingWidth + (leadingWidth ? gap : 0);
    const width = `${Math.ceil(labelWidth + frameWidth + adornmentWidth)}px`;
    if (this.el.style.getPropertyValue('--_q-dropdown-options-width') !== width) {
      this.el.style.setProperty('--_q-dropdown-options-width', width);
    }
  };

  @Watch('value')
  watchValue(newValue: string) {
    if (this.multiple) return;
    this.reconcileSelectedLabel();
    this.closeMenu();
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(newValue);
    }
    this.syncValidity();
  }

  @Watch('values')
  watchValues(): void {
    this.reconcileMultipleLabels();
    this.focusedIndex = -1;
    this.syncValidity();
  }

  @Watch('multiple')
  watchMultiple(): void {
    this.closeMenu();
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
    const selectedValues = this.getMultipleFormSelection();
    const data = new FormData();
    if (this.name) for (const value of selectedValues) data.append(this.name, value);
    this.internals?.setFormValue?.(disabled ? null : this.multiple ? data : selected);
    if (typeof this.internals?.setValidity !== 'function') return;
    const missing = this.multiple ? !selectedValues.length : !this.value || selected === null;
    const message = this.isDisabled ? '' : this.error?.trim() || (this.required && missing ? 'Please select an option.' : '');
    this.internals.setValidity(message ? this.error?.trim() ? { customError: true } : { valueMissing: true } : {}, message, this.triggerEl);
  }

  @Method()
  async checkValidity(): Promise<boolean> {
    this.syncValidity();
    const missing = this.multiple ? !this.getMultipleFormSelection().length : !this.value || this.getFormSelection() === null;
    return this.isDisabled || !(this.error?.trim() || (this.required && missing));
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
    this.reconcileMultipleLabels();
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
    this.reconcileMultipleLabels();
    this.initialValue = this.value || '';
    this.initialValues = [...this.selectedValues];
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
    this.values = [...this.initialValues];
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

  private getMultipleFormSelection(): string[] {
    const options = this.getAllOptions();
    return this.selectedValues.filter(value => {
      const option = getSelectedOption(options, value);
      return option ? (option as Option & { disabled?: boolean }).disabled !== true : this.externalSearch;
    });
  }

  private reconcileMultipleLabels(): void {
    const next = new Map<string, string>();
    for (const value of this.selectedValues) {
      const option = getSelectedOption(this.getAllOptions(), value);
      next.set(value, option ? this.getOptionLabel(option) : this.multipleLabels.get(value) ?? value);
    }
    this.multipleLabels = next;
  }

  private removeValue = (value: string, event?: Event) => {
    event?.stopPropagation();
    if (this.isDisabled) return;
    this.values = this.selectedValues.filter(selected => selected !== value);
    this.qValuesChange.emit([...this.values]);
    if (!this.values.length) this.closeMenu();
    requestAnimationFrame(() => focusWithoutScroll(this.selectedPanel
      ? this.menuEl?.querySelector<HTMLElement>('q-chip')?.shadowRoot?.querySelector<HTMLElement>('button') ?? this.triggerEl
      : this.triggerEl));
  };

  private observeMultipleLayout(): void {
    this.multipleObserver?.disconnect();
    if (!this.multiple || !this.multipleFrame || !this.chipMeasure) return;
    this.multipleObserver ??= new ResizeObserver(this.measureMultipleLayout);
    this.multipleObserver.observe(this.multipleFrame);
    this.multipleObserver.observe(this.chipMeasure);
    this.measureMultipleLayout();
  }

  private measureMultipleLayout = () => {
    if (!this.multipleFrame || !this.chipMeasure) return;
    const style = getComputedStyle(this.multipleFrame);
    const gap = parseFloat(style.columnGap) || 0;
    const frame = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth']
      .reduce((sum, key) => sum + (parseFloat(style.getPropertyValue(key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()))) || 0), 0);
    const searchWidth = parseFloat(getComputedStyle(this.triggerEl!).minWidth) || 64;
    const iconWidth = this.multipleFrame.querySelector('.chevron-icon')?.getBoundingClientRect().width ?? 16;
    const leadingWidth = Array.from(this.el.querySelectorAll<HTMLElement>('[slot="icon-left"]')).reduce((sum, node) => sum + node.getBoundingClientRect().width + gap, 0);
    const available = this.multipleFrame.getBoundingClientRect().width - frame - searchWidth - iconWidth - leadingWidth - gap * 2;
    const chips = Array.from(this.chipMeasure.querySelectorAll('q-chip'));
    const widths = chips.map(chip => chip.getBoundingClientRect().width + gap);
    const overflowWidth = this.chipMeasure.querySelector('.multiple-more')!.getBoundingClientRect().width + gap;
    const allFit = widths.reduce((sum, width) => sum + width, 0) <= available;
    let remaining = available - (allFit ? 0 : overflowWidth);
    let count = 0;
    for (const width of widths) {
      if (width > remaining) break;
      count++;
      remaining -= width;
    }
    if (count !== this.visibleChips) this.visibleChips = count;
  };

  private openSelectedPanel = (event: MouseEvent) => {
    event.stopPropagation();
    if (this.isDisabled) return;
    this.closeMenu();
    this.selectedPanel = true;
    this.isOpen = true;
    requestAnimationFrame(() => focusWithoutScroll(this.menuEl?.querySelector<HTMLElement>('q-chip')?.shadowRoot?.querySelector<HTMLElement>('button')));
  };

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
    const available = this.multiple ? this.getAllOptions().filter(option => !this.selectedValues.includes(option.value)) : this.getAllOptions();
    if (this.externalSearch) {
      return available;
    }

    return getFilteredOptions(available, this.searchTerm, this.multiple || this.searchable);
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
      if (this.multiple || this.searchable) {
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
    if (this.multiple) {
      if (this.selectedValues.includes(option.value)) return;
      this.values = [...this.selectedValues, option.value];
      this.multipleLabels.set(option.value, this.getOptionLabel(option));

      this.searchTerm = '';
      if (this.triggerEl instanceof HTMLInputElement) {
        this.triggerEl.value = '';
      }
      this.draftEdited = false;
      this.focusedIndex = -1;
      this.qValuesChange.emit([...this.values]);
      this.qSelect.emit(option);
      if (this.externalSearch && this.lastSearchValue) this.qSearch.emit('');
      this.lastSearchValue = '';
      requestAnimationFrame(() => focusWithoutScroll(this.triggerEl));
      return;
    }
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
    if (this.selectedPanel) this.closeMenu();
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
    this.selectedPanel = false;
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
      this.floatingResizeObserver.observe(this.multiple ? this.multipleFrame! : this.triggerEl);
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
    const trigger = this.multiple ? this.multipleFrame : this.triggerEl;
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
    const source = ev.composedPath()[0];
    if (this.multiple && source !== this.triggerEl && ev.key !== 'Escape') return;
    if (this.multiple && ev.key === 'Backspace' && !this.searchTerm && this.selectedValues.length && source === this.triggerEl) {
      ev.preventDefault();
      this.removeValue(this.selectedValues[this.selectedValues.length - 1]);
      return;
    }
    const isInput = (ev.target as HTMLElement)?.tagName?.toLowerCase() === 'input';
    const maxIndex = this.parsedOptions.length - 1;
    switch (ev.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        ev.preventDefault();
        this.selectedPanel = false;
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
        {this.width === 'fit-options' && (
          <span class="fit-options-clip" aria-hidden="true">
            <span class="dropdown-trigger fit-options-measure" ref={el => (this.fitOptionsMeasure = el)}>
              <span class="fit-options-labels">
                {(allOptions.length ? allOptions.map(option => this.getOptionLabel(option)) : [selectedLabel || this.placeholder]).map(text => <span>{text}</span>)}
              </span>
              <span class="chevron-icon" />
            </span>
          </span>
        )}
        {this.multiple ? <div class="dropdown-trigger multiple-trigger" part="trigger" ref={el => this.multipleFrame = el}>
          <slot name="icon-left" onSlotchange={this.measureMultipleLayout} />
          {this.selectedValues.slice(0, this.visibleChips).map(value =>
            <q-chip key={value} size="sm" removable label={this.multipleLabels.get(value) ?? value} value={value}
              disabled={this.isDisabled} onQRemove={event => this.removeValue(value, event)} />)}
          {this.visibleChips < this.selectedValues.length && <button type="button" class="multiple-more"
            disabled={this.isDisabled} aria-haspopup="dialog" aria-expanded={this.selectedPanel && this.isOpen ? 'true' : 'false'}
            aria-controls={this.selectedPanel && this.isOpen ? 'q-field-menu' : undefined}
            aria-label={`${this.selectedValues.length - this.visibleChips} more selected options`}
            onClick={this.openSelectedPanel}>+{this.selectedValues.length - this.visibleChips} more</button>}
          <input ref={el => this.triggerEl = el} id="q-field" class="multiple-input" type="text" role="combobox"
            autocomplete="off" disabled={this.isDisabled}
            value={this.searchTerm} placeholder={this.selectedValues.length ? 'Search…' : this.placeholder}
            onClick={this.handleEditableClick} onInput={this.handleSearchInput}
            onFocus={this.handleFocus} onBlur={this.handleBlur}
            onCompositionstart={this.handleCompositionStart} onCompositionend={this.handleCompositionEnd}
            aria-label={ariaLabel} aria-autocomplete="list" aria-haspopup="listbox"
            aria-required={this.required ? 'true' : 'false'}
            aria-invalid={this.error || this.required && !this.getMultipleFormSelection().length ? 'true' : 'false'}
            aria-describedby={this.error || this.description ? 'q-field-error' : undefined}
            aria-expanded={this.isOpen && !this.selectedPanel ? 'true' : 'false'}
            aria-controls={this.isOpen && !this.selectedPanel ? 'q-field-menu' : undefined}
            aria-activedescendant={this.isOpen && !this.selectedPanel && this.focusedIndex >= 0 ? `q-field-item-${this.focusedIndex}` : undefined} />
          <svg class="chevron-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
          <span class="multiple-measure" aria-hidden="true" inert ref={el => this.chipMeasure = el}>
            {this.selectedValues.map(value => <q-chip key={value} size="sm" removable label={this.multipleLabels.get(value) ?? value} />)}
            <button type="button" class="multiple-more" tabindex={-1}>+{this.selectedValues.length} more</button>
          </span>
        </div> : this.editableSearch ? <div class={{ 'editable-trigger': true, 'has-leading-icon': Boolean(this.el.querySelector('[slot="icon-left"]')) }}>
          <span class="editable-leading"><slot name="icon-left" onSlotchange={this.observeFitOptions} /></span>
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
            <slot name="icon-left" onSlotchange={this.observeFitOptions} />
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
            role={this.selectedPanel ? 'dialog' : 'listbox'}
            popover="manual"
            aria-label={this.selectedPanel ? 'Selected options' : ariaLabel || this.label || 'Options'}
            aria-multiselectable={this.multiple && !this.selectedPanel ? 'true' : undefined}
          >
            {this.selectedPanel ? <div class="selected-options">
              <strong>Selected options</strong>
              {this.selectedValues.map(value => <q-chip key={value} size="sm" removable label={this.multipleLabels.get(value) ?? value}
                value={value} disabled={this.isDisabled} onQRemove={event => this.removeValue(value, event)} />)}
              <button type="button" class="multiple-more" onClick={() => { this.closeMenu(); focusWithoutScroll(this.triggerEl); }}>Done</button>
            </div> : <Fragment>
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
                      'is-selected': !this.multiple && option.value === this.value,
                      'is-focused': index === this.focusedIndex
                    }}
                    tabindex={-1}
                    part={`item ${!this.multiple && option.value === this.value ? 'selected-item' : ''} ${index === this.focusedIndex ? 'focused-item' : ''}`}
                    role="option"
                    aria-selected={!this.multiple && option.value === this.value ? 'true' : 'false'}
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
            </Fragment>}
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
