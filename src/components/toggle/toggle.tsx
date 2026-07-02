import { Component, Prop, State, Event, EventEmitter, Element, Method, AttachInternals, Watch, h } from '@stencil/core';

import type { QToggleSize, QToggleType } from './toggle.types';

@Component({
  tag: 'q-toggle',
  styleUrl: 'toggle.css',
  shadow: true,
  formAssociated: true
})
export class QToggle {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  @Prop({ mutable: true, reflect: true }) checked: boolean = false;
  @Prop({ reflect: true }) name?: string;
  @Prop() size: QToggleSize = 'md';
  @Prop() type: QToggleType = 'switch';
  @Prop() label?: string;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() error?: string;

  @State() hasCheckedIcon: boolean = false;
  @State() hasUncheckedIcon: boolean = false;
  @State() hasDefaultSlot: boolean = false;

  @Event() qChange!: EventEmitter<boolean>;
  @Event() qFocus!: EventEmitter<FocusEvent>;
  @Event() qBlur!: EventEmitter<FocusEvent>;
  @Event() qClick!: EventEmitter<MouseEvent>;

  private initialValue: boolean = false;

  // ========================= [2] INTERNAL STATE & REFS =========================

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('checked')
  watchChecked(newValue: boolean) {
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(newValue ? 'true' : null);
    }
  }

  componentWillLoad() {
    this.initialValue = this.checked;
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.checked ? 'true' : null);
    }
    this.checkSlots();
  }

  formResetCallback() {
    this.checked = this.initialValue;
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.checked ? 'true' : null);
    }
  }

  /**
   * Programmatically set checked state without emitting qChange.
   * Use this from external controllers (e.g. playground) to avoid
   * the SYNCBACK_MAP â†’ registry â†’ effect â†’ prop-set feedback loop.
   */
  // ============================ [4] EXPOSED METHODS ============================

  @Method()
  async toggle() {
    if (!this.disabled) {
      this.checked = !this.checked;
      this.qChange.emit(this.checked);
    }
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleSlotChange = () => {
    this.checkSlots();
  };

  private checkSlots() {
    const defaultSlot = this.el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;
    this.hasDefaultSlot = defaultSlot ? defaultSlot.assignedNodes({ flatten: true }).some(node => {
      if (node.nodeType === 1) return true; // element node
      if (node.nodeType === 3) return node.textContent?.trim() !== ''; // text node
      return false;
    }) : false;

    const checkedSlot = this.el.shadowRoot?.querySelector('slot[name="checked-icon"]') as HTMLSlotElement;
    this.hasCheckedIcon = checkedSlot ? checkedSlot.assignedNodes({ flatten: true }).length > 0 : false;

    const uncheckedSlot = this.el.shadowRoot?.querySelector('slot[name="unchecked-icon"]') as HTMLSlotElement;
    this.hasUncheckedIcon = uncheckedSlot ? uncheckedSlot.assignedNodes({ flatten: true }).length > 0 : false;
  }

  private handleClick = (e: MouseEvent) => {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.qClick.emit(e);
    this.checked = !this.checked;
    this.qChange.emit(this.checked);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      // Dispatch qClick programmatically for keyboard activation
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      this.qClick.emit(clickEvent);
      this.checked = !this.checked;
      this.qChange.emit(this.checked);
    }
  };

  private handleFocus = (ev: FocusEvent) => {
    this.qFocus.emit(ev);
  };

  private handleBlur = (ev: FocusEvent) => {
    this.qBlur.emit(ev);
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const hasLabel = this.label !== undefined && this.label !== '';
    const showLabel = hasLabel || this.hasDefaultSlot;
    const hasError = !!this.error;

    return (
      <div class="toggle-container">
        <div
          class={{
            'toggle-wrapper': true,
            'is-checked': this.checked,
            'is-disabled': this.disabled,
            'is-required': this.required,
            'has-error': hasError,
            [`type-${this.type}`]: true,
            [`size-${this.size}`]: true,
          }}
          role="checkbox"
          aria-checked={this.checked ? 'true' : 'false'}
          aria-disabled={this.disabled ? 'true' : 'false'}
          aria-required={this.required ? 'true' : 'false'}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? 'toggle-error-msg' : undefined}
          tabindex={this.disabled ? -1 : 0}
          onClick={this.handleClick}
          onKeyDown={this.handleKeyDown}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        >
          {/* Toggle control */}
          <div class="toggle-control" part="control">
            {this.type === 'switch' ? (
              <div class="switch-track" part="track">
                <div class="switch-thumb" part="thumb" />
              </div>
            ) : (
              <div class="checkbox-box" part="box">
                <span class={{ 'icon-wrap': true, 'is-hidden': !this.checked }} part="icon-checked">
                  <slot name="checked-icon" onSlotchange={this.handleSlotChange}>
                    {/* Default animated checkmark SVG */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="default-check-icon">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </slot>
                </span>
                <span class={{ 'icon-wrap': true, 'is-hidden': this.checked }} part="icon-unchecked">
                  <slot name="unchecked-icon" onSlotchange={this.handleSlotChange} />
                </span>
              </div>
            )}
          </div>

          {/* Label container */}
          <span
            class={{
              'toggle-label-text': true,
              'is-hidden': !showLabel
            }}
            part="label"
          >
            <slot onSlotchange={this.handleSlotChange}>
              {this.label}
            </slot>
          </span>
        </div>

        {/* Error message */}
        {hasError && (
          <span id="toggle-error-msg" class="error-msg" part="error-msg">
            {this.error}
          </span>
        )}
      </div>
    );
  }
}
