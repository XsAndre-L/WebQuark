import { isFieldDisabled, syncFieldHost } from '../../../utils/form-field-state';
import { registerFormField } from '../../../utils/form-field-adapter';
import { fieldFeedback, feedbackStyle } from '../../shared/field';
import { Component, Prop, State, Event, EventEmitter, Element, Method, AttachInternals, Watch, h } from '@stencil/core';

import { syncRequiredBooleanValidity } from '../../../utils/form-control-validity';
import type { QToggleSize, QToggleType } from './toggle.types';
import { isToggleActivationKey } from './toggle.utils';

/**
 * Form-associated switch or checkbox toggle control.
 * @slot - Label content rendered next to the control.
 * @slot checked-icon - Custom icon shown when checkbox type is checked.
 * @slot unchecked-icon - Custom icon shown when checkbox type is unchecked.
 * @part control - Non-visual wrapper around the visual switch or checkbox.
 * @part track - Visual switch track.
 * @part thumb - Visual switch thumb.
 * @part box - Visual checkbox box.
 * @part icon-checked - Checked icon wrapper for checkbox type.
 * @part icon-unchecked - Unchecked icon wrapper for checkbox type.
 * @part label - Label text wrapper.
 * @part error-msg - Validation helper text.
 */
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

  @Prop() label?: string;
  /** Supporting text, replaced by an active error. */
  @Prop() description?: string;

  /** Keep the label accessible without displaying it. */
  @Prop() labelHidden: boolean = false;
  /** Omitted inherits the enclosing form; false cancels reservation. */
  @Prop() reserveFeedback?: boolean;
  @Prop() size: QToggleSize = 'inherit';

  /** Controls switch/checkbox visuals and semantics. */
  @Prop() type: QToggleType = 'switch';

  @Prop({ mutable: true, reflect: true }) checked: boolean = false;
  @Prop({ reflect: true }) disabled: boolean = false;

  @Prop({ reflect: true }) required: boolean = false;
  /** Validation helper text displayed when the toggle is in an error state. */
  @Prop() error?: string;

  @Prop({ reflect: true }) name?: string;

  @Event() qChange!: EventEmitter<boolean>;

  @Event() qFocus!: EventEmitter<FocusEvent>;

  @Event() qBlur!: EventEmitter<FocusEvent>;

  /** Emitted before the toggle changes due to pointer or keyboard activation. */
  @Event() qClick!: EventEmitter<MouseEvent>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() private disabledState = false;

  private get isDisabled(): boolean {
    return isFieldDisabled(this.el, this.disabled);
  }

  @State() hasDefaultSlot: boolean = false;

  private initialValue: boolean = false;
  private controlEl?: HTMLElement;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('disabled')
  @Watch('required')
  @Watch('name')
  watchConstraints() {
    this.syncValidity();
  }

  @Watch('checked')
  watchChecked(newValue: boolean) {
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(newValue ? 'true' : null);
    }
    this.syncValidity();
  }

  componentWillLoad() {
    this.initialValue = this.checked;
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.checked ? 'true' : null);
    }
    this.syncValidity();
    this.checkSlots();
  }

  formDisabledCallback() {
    this.syncValidity();
  }

  componentDidLoad() {
    registerFormField(this.el, {
      kind: 'toggle',
      owner: () => this.internals?.form ?? null,
      active: () => true,
      value: () => this.checked,
      assign: value => { this.checked = value as boolean; },
      reconcile: () => {
        this.internals?.setFormValue?.(this.checked ? 'true' : null);
        this.syncValidity();
      },
      reset: () => this.formResetCallback(),
      validate: report => report ? this.internals?.reportValidity?.() ?? true : this.internals?.checkValidity?.() ?? true,
    });
  }

  componentDidRender() {
    this.syncValidity();
  }

  formResetCallback() {
    this.checked = this.initialValue;
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.checked ? 'true' : null);
    }
    this.syncValidity();
  }

  // ============================ [4] EXPOSED METHODS ============================

  /** Programmatically toggles checked and emits qChange. */
  @Method()
  async toggle() {
    if (!this.isDisabled) {
      this.checked = !this.checked;
      this.qChange.emit(this.checked);
    }
  }

  /** Returns whether the toggle satisfies its required constraint. */
  @Method()
  async checkValidity(): Promise<boolean> {
    this.syncValidity();
    if (typeof this.internals.checkValidity === 'function') {
      return this.internals.checkValidity();
    }
    return this.isDisabled || !this.required || this.checked;
  }

  /** Reports a required constraint violation and returns whether the toggle is valid. */
  @Method()
  async reportValidity(): Promise<boolean> {
    this.syncValidity();
    if (typeof this.internals.reportValidity === 'function') {
      return this.internals.reportValidity();
    }
    return this.isDisabled || !this.required || this.checked;
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleSlotChange = () => {
    this.checkSlots();
  };

  private checkSlots() {
    const defaultSlot = this.el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;
    this.hasDefaultSlot = defaultSlot ? defaultSlot.assignedNodes({ flatten: true }).some(node => {
      if (node.nodeType === Node.ELEMENT_NODE) return true;
      if (node.nodeType === Node.TEXT_NODE) return node.textContent?.trim() !== '';
      return false;
    }) : false;
  }

  private syncValidity(): void {
    const disabled = syncFieldHost(this.el, this.disabled, this.name, this.required);
    if (this.disabledState !== disabled) this.disabledState = disabled;
    if (this.controlEl) {
      this.controlEl.setAttribute('aria-checked', String(this.checked));
      this.controlEl.setAttribute('aria-disabled', String(disabled));
      this.controlEl.setAttribute('aria-required', String(this.required));
      this.controlEl.tabIndex = disabled ? -1 : 0;
    }
    if (!this.internals) return;
    this.internals.setFormValue?.(disabled || !this.checked ? null : 'true');

    syncRequiredBooleanValidity(this.internals, {
      required: this.required,
      checked: this.checked,
      disabled: this.isDisabled,
      anchor: this.controlEl,
    });
  }

  private handleClick = (e: MouseEvent) => {
    if (this.isDisabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.qClick.emit(e);
    this.checked = !this.checked;
    this.qChange.emit(this.checked);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.isDisabled) return;
    if (isToggleActivationKey(e.key)) {
      e.preventDefault();
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
      <div class="toggle-container" style={feedbackStyle(this.reserveFeedback)}>
        <div
          ref={el => (this.controlEl = el as HTMLElement)}
          class={{
            'toggle-wrapper': true,
            'is-checked': this.checked,
            'is-disabled': this.isDisabled,
            'is-required': this.required,
            'has-error': hasError,
            [`type-${this.type}`]: true,
            [`size-${this.size}`]: true,
          }}
          role={this.type === 'switch' ? 'switch' : 'checkbox'}
          aria-checked={this.checked ? 'true' : 'false'}
          aria-disabled={this.isDisabled ? 'true' : 'false'}
          aria-required={this.required ? 'true' : 'false'}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError || this.description ? 'toggle-error-msg' : undefined}
          tabindex={this.isDisabled ? -1 : 0}
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="default-check-icon" aria-hidden="true">
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
              'q-label-hidden': this.labelHidden,
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
        {fieldFeedback('toggle-error-msg', this.error, this.description)}
      </div>
    );
  }
}
