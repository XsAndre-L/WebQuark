import { fieldFeedback, feedbackStyle } from '../../shared/field';
import { Component, Prop, State, Event, EventEmitter, Method, AttachInternals, Watch, h } from '@stencil/core';

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

  /** Shows a clear button when the field has a value. */
  @Prop() clearable: boolean = false;

  @Prop({ reflect: true }) disabled: boolean = false;

  @Prop({ reflect: true }) required: boolean = false;
  /** Validation error text or error-state flag. */
  @Prop({ reflect: true }) error?: string;
  /** Validation helper text displayed when the field is in an error state. */
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

  private initialValue: string = "";

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

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
  }

  componentDidRender() {
    this.syncValidity();
  }

  formResetCallback() {
    this.value = this.initialValue;
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
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
    if (!this.inputEl || !this.internals) return;

    syncNativeControlValidity({
      internals: this.internals,
      control: this.inputEl,
      disabled: this.disabled,
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
    if (this.disabled) return;

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
    if (this.disabled) return;
    this.qClick.emit(ev);
  };

  private handleClear = () => {
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
    if (this.disabled || this.type !== 'password') return;

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
    if (this.type !== 'number' || this.disabled) return;

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
    const showClearBtn = this.clearable && !this.disabled && this.value.length > 0;
    const showPasswordToggle = this.type === 'password' && !this.disabled;
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
          'is-disabled': this.disabled,
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
            disabled={this.disabled}
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

          {this.type === 'number' && !this.disabled && (
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
