import type { QInputWidth } from '../../../theme/tokens';
import { isFieldDisabled, syncFieldHost, syncNativeAttribute } from '../../../utils/form-field-state';
import { registerFormField } from '../../../utils/form-field-adapter';
import { fieldFeedback, feedbackStyle } from '../../shared/field';
import { Component, Prop, State, Event, EventEmitter, Method, Element, AttachInternals, Watch, h } from '@stencil/core';

import { syncNativeControlValidity } from '../../../utils/form-control-validity';
import type { QInputSize, QInputType } from './input.types';
import { hasAssignedSlotContent } from './input.utils';

/**
 * Form-associated input field with optional prefix/suffix slots, clear button, password visibility toggle, and numeric spinner controls.
 * @slot prefix - Content displayed before the native input.
 * @slot suffix - Content displayed after the native input when no clear or password toggle button is visible.
 * @part label - Optional field label.
 * @part control - Wrapper around the native input and inline controls.
 * @part prefix - Prefix slot container.
 * @part suffix - Suffix slot container.
 * @part spinners - Numeric spinner button container.
 * @part error-msg - Validation helper text.
 */
@Component({
  tag: 'q-input',
  styleUrl: 'input.css',
  shadow: {
    delegatesFocus: true
  },
  formAssociated: true
})
export class QInput {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) value: string = "";
  @Prop() placeholder: string = "";
  @Prop() label?: string;
  /** Accessible name for the native input when a visible label is not used. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Supporting text, replaced by an active error. */
  @Prop() description?: string;

  /** Keep the label accessible without displaying it. */
  @Prop() labelHidden: boolean = false;
  /** Omitted inherits the enclosing form; false cancels reservation. */
  @Prop() reserveFeedback?: boolean;
  @Prop() size: QInputSize = 'inherit';
  /** Opt-in horizontal width; independent of size. Omitted uses the existing full-width layout. */
  @Prop({ reflect: true }) width?: QInputWidth;

  /** Shows a clear button when the field has a value. */
  @Prop() clearable: boolean = false;

  @Prop({ reflect: true }) disabled: boolean = false;

  @Prop({ reflect: true }) required: boolean = false;
  /** Validation error text or error-state flag. */
  @Prop({ reflect: true }) error?: string;
  /** @deprecated Use error. Used when error is empty or unset. */
  @Prop() errorMessage?: string;

  @Prop({ reflect: true }) name?: string;
  /** `password` adds a visibility toggle; `number` adds spinner controls. */
  @Prop() type: QInputType = 'text';
  @Prop() min?: number;
  @Prop() max?: number;
  @Prop() step?: number = 1;

  @AttachInternals() internals!: ElementInternals;

  @State() hasPrefix: boolean = false;
  @State() hasSuffix: boolean = false;
  @State() passwordVisible: boolean = false;

  /** Emitted when the committed value changes. */
  @Event() qChange!: EventEmitter<string>;

  /** Emitted as the user types or spinner controls update the value. */
  @Event() qInput!: EventEmitter<string>;

  @Event() qBlur!: EventEmitter<FocusEvent>;

  @Event() qFocus!: EventEmitter<FocusEvent>;

  @Event() qClick!: EventEmitter<MouseEvent>;

  private inputEl?: HTMLInputElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() private disabledState = false;

  private get isDisabled(): boolean {
    return isFieldDisabled(this.el, this.disabled);
  }

  private initialValue: string = "";

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('value')
  watchValue() {
    this.syncValidity();
  }

  @Watch('disabled')
  @Watch('required')
  @Watch('name')
  @Watch('error')
  @Watch('errorMessage')
  @Watch('type')
  @Watch('min')
  @Watch('max')
  @Watch('step')
  watchConstraints() {
    this.syncValidity();
  }

  componentWillLoad() {
    this.initialValue = this.value || "";
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
  }

  formDisabledCallback() {
    this.syncValidity();
  }

  componentDidLoad() {
    registerFormField(this.el, {
      kind: 'text',
      owner: () => this.internals?.form ?? null,
      active: () => true,
      value: () => this.value,
      assign: value => { this.value = value as string; },
      reconcile: () => {
        if (this.inputEl && this.inputEl.value !== this.value) this.inputEl.value = this.value;
        this.internals?.setFormValue?.(this.value);
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
    this.value = this.initialValue;
    this.syncValidity();
  }

  // ============================ [4] EXPOSED METHODS ============================

  /** Moves focus to the native input. */
  @Method()
  async focusElement() {
    this.inputEl?.focus();
  }

  /** Clears the current value and focuses the native input. */
  @Method()
  async clearValue() {
    this.handleClear();
  }

  /** Returns whether the control satisfies native and custom constraints. */
  @Method()
  async checkValidity(): Promise<boolean> {
    this.syncValidity();
    if (typeof this.internals.checkValidity === 'function') {
      return this.internals.checkValidity();
    }
    return this.inputEl?.checkValidity?.() ?? true;
  }

  /** Reports native or custom constraint violations and returns whether the control is valid. */
  @Method()
  async reportValidity(): Promise<boolean> {
    this.syncValidity();
    if (typeof this.internals.reportValidity === 'function') {
      return this.internals.reportValidity();
    }
    return this.inputEl?.reportValidity?.() ?? true;
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handlePrefixSlotChange = (ev: Event) => {
    const slot = ev.target as HTMLSlotElement;
    this.hasPrefix = hasAssignedSlotContent(slot);
  };

  private handleSuffixSlotChange = (ev: Event) => {
    const slot = ev.target as HTMLSlotElement;
    this.hasSuffix = hasAssignedSlotContent(slot);
  };

  private syncValidity(): void {
    const disabled = syncFieldHost(this.el, this.disabled, this.name, this.required);
    if (this.disabledState !== disabled) this.disabledState = disabled;
    if (!this.inputEl || !this.internals) return;
    this.inputEl.disabled = disabled;
    this.inputEl.required = this.required;
    this.inputEl.readOnly = this.el.hasAttribute('readonly');
    this.inputEl.name = this.name ?? '';
    this.inputEl.type = this.type === 'password' && this.passwordVisible ? 'text' : this.type;
    syncNativeAttribute(this.inputEl, 'min', this.min);
    syncNativeAttribute(this.inputEl, 'max', this.max);
    syncNativeAttribute(this.inputEl, 'step', this.step);
    if (this.inputEl.value !== this.value) this.inputEl.value = this.value;
    this.internals.setFormValue?.(disabled ? null : this.value);

    syncNativeControlValidity({
      internals: this.internals,
      control: this.inputEl,
      disabled: this.isDisabled,
      customError: this.error || this.errorMessage,
    });
  }

  private handleInput = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    this.value = target.value;
    this.qInput.emit(this.value);
  };

  private handleChange = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    this.value = target.value;
    this.qChange.emit(this.value);
  };

  private resolveNumericBase(): number {
    let base = parseFloat(this.value);
    if (isNaN(base)) {
      if (this.min !== undefined && this.min !== null && this.min > 0) {
        base = this.min;
      } else if (this.max !== undefined && this.max !== null && this.max < 0) {
        base = this.max;
      } else {
        base = 0;
      }
    }
    return base;
  }

  private clampNumericValue(value: number): number {
    let clamped = value;
    if (this.min !== undefined && this.min !== null) {
      clamped = Math.max(this.min, clamped);
    }
    if (this.max !== undefined && this.max !== null) {
      clamped = Math.min(this.max, clamped);
    }
    return clamped;
  }

  private stepValue(direction: 1 | -1) {
    if (this.isDisabled) return;

    const stepVal = (this.step !== undefined && this.step !== null) ? this.step : 1;
    const newValue = this.clampNumericValue(this.resolveNumericBase() + (stepVal * direction));

    this.value = String(newValue);
    // Imperatively update the native input so the display refreshes immediately.
    // Stencil's async VDOM re-render can be skipped when this.value was already
    // set to the same string before the effect fires (SYNCBACK_MAP race).
    if (this.inputEl) this.inputEl.value = this.value;
    this.qInput.emit(this.value);
    this.qChange.emit(this.value);
  }

  private handleIncrement = () => {
    this.stepValue(1);
  };

  private handleDecrement = () => {
    this.stepValue(-1);
  };

  private handleBlur = (ev: FocusEvent) => {
    if (this.type === 'number' && this.value !== undefined && this.value !== null && this.value !== "") {
      const parsed = parseFloat(this.value);
      if (!isNaN(parsed)) {
        let clamped = parsed;
        if (this.min !== undefined && this.min !== null) {
          clamped = Math.max(this.min, clamped);
        }
        if (this.max !== undefined && this.max !== null) {
          clamped = Math.min(this.max, clamped);
        }
        if (clamped !== parsed) {
          this.value = String(clamped);
          // Force the native input to show the clamped value immediately.
          if (this.inputEl) this.inputEl.value = this.value;
          this.qInput.emit(this.value);
          this.qChange.emit(this.value);
        }
      }
    }
    this.qBlur.emit(ev);
  };

  private handleFocus = (ev: FocusEvent) => {
    this.qFocus.emit(ev);
  };

  private handleClick = (ev: MouseEvent) => {
    if (this.isDisabled) return;
    this.qClick.emit(ev);
  };

  private handleClear = (event?: Event) => {
    if (event && this.isDisabled) return;
    this.value = "";
    this.qInput.emit(this.value);
    this.qChange.emit(this.value);
    if (this.inputEl) {
      this.inputEl.focus();
    }
  };

  private handlePasswordToggle = (ev: MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (this.isDisabled || this.type !== 'password') return;

    const selectionStart = this.inputEl?.selectionStart ?? null;
    const selectionEnd = this.inputEl?.selectionEnd ?? null;

    this.passwordVisible = !this.passwordVisible;

    requestAnimationFrame(() => {
      if (!this.inputEl) return;
      this.inputEl.focus();
      if (selectionStart !== null && selectionEnd !== null) {
        this.inputEl.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  };

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (this.type !== 'number' || this.isDisabled) return;

    if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.handleIncrement();
    } else if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      this.handleDecrement();
    }
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const hasError = !!(this.error || this.errorMessage);
    const displayError = this.error || this.errorMessage;
    const showClearBtn = this.clearable && !this.isDisabled && this.value.length > 0;
    const showPasswordToggle = this.type === 'password' && !this.isDisabled;
    const inputType: QInputType = showPasswordToggle && this.passwordVisible ? 'text' : this.type;

    const showSuffixContainer = this.hasSuffix || showClearBtn || showPasswordToggle;
    const numericValue = parseFloat(this.value);
    const hasNumericValue = this.type === 'number' && !isNaN(numericValue);
    const isMinDisabled = hasNumericValue && this.min !== undefined && this.min !== null && numericValue <= this.min;
    const isMaxDisabled = hasNumericValue && this.max !== undefined && this.max !== null && numericValue >= this.max;
    const ariaLabel = this.ariaLabel?.trim() || undefined;

    return (
      <div
        style={feedbackStyle(this.reserveFeedback)}
        class={{
          'input-wrapper': true,
          'is-disabled': this.isDisabled,
          'has-error': hasError,
          [`size-${this.size}`]: true
        }}
      >
        {/* Optional Header Label linked via htmlFor */}
        {this.label && (
          <label class={{ 'input-label': true, 'q-label-hidden': this.labelHidden }} htmlFor="q-field" part="label">
            {this.label}
          </label>
        )}

        {/* Input Box Wrapper */}
        <div class="input-control" part="control">

          {/* Prefix Slot Container */}
          <span 
            class="prefix-container" 
            style={{ display: this.hasPrefix ? 'flex' : 'none' }}
            part="prefix"
          >
            <slot name="prefix" onSlotchange={this.handlePrefixSlotChange} />
          </span>

          {/* Native HTML Input */}
          <input
            key={this.type}
            ref={(el) => (this.inputEl = el as HTMLInputElement)}
            id="q-field"
            class={{
              'input-box': true,
              'has-prefix-padding': this.hasPrefix,
              'has-suffix-padding': showSuffixContainer
            }}
            type={inputType}
            name={this.name}
            value={this.value}
            placeholder={this.placeholder}
            disabled={this.isDisabled}
            required={this.required}
            min={this.min}
            max={this.max}
            step={this.step}
            onInput={this.handleInput}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            onFocus={this.handleFocus}
            onClick={this.handleClick}
            onKeyDown={this.handleKeyDown}
            role={this.type === 'number' ? 'spinbutton' : undefined}
            aria-valuenow={hasNumericValue ? String(numericValue) : undefined}
            aria-valuemin={this.type === 'number' && this.min !== undefined && this.min !== null ? String(this.min) : undefined}
            aria-valuemax={this.type === 'number' && this.max !== undefined && this.max !== null ? String(this.max) : undefined}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError || this.description ? 'q-field-error' : undefined}
            aria-label={ariaLabel}
          />

          {this.type === 'number' && !this.isDisabled && (
            <div class="input-spinners" part="spinners">
              <button class="spinner-btn spinner-up" type="button" onClick={this.handleIncrement} disabled={isMaxDisabled} aria-label="Increase value">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button class="spinner-btn spinner-down" type="button" onClick={this.handleDecrement} disabled={isMinDisabled} aria-label="Decrease value">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          )}

          {/* Suffix / Clear Button Container */}
          <span 
            class="suffix-container" 
            style={{ display: showSuffixContainer ? 'flex' : 'none' }}
            part="suffix"
          >
            {showClearBtn && (
              <button 
                class="clear-btn" 
                type="button" 
                onClick={this.handleClear}
                aria-label="Clear input"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
            {showPasswordToggle && (
              <button
                class="password-toggle-btn"
                type="button"
                onClick={this.handlePasswordToggle}
                aria-label={this.passwordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={this.passwordVisible ? 'true' : 'false'}
              >
                {this.passwordVisible ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                    <path d="M9.88 4.24A10.2 10.2 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-4.08 5.19" />
                    <path d="M6.61 6.61A18.5 18.5 0 0 0 2 12s3 8 10 8a10.7 10.7 0 0 0 5.39-1.61" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}
            <span style={{ display: !showClearBtn && this.hasSuffix ? 'block' : 'none' }}>
              <slot 
                name="suffix" 
                onSlotchange={this.handleSuffixSlotChange} 
              />
            </span>
          </span>

        </div>

        {/* Validation Helper Message */}
        {fieldFeedback('q-field-error', displayError, this.description)}
      </div>
    );
  }
}
