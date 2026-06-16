import { Component, Prop, State, Event, EventEmitter, Element, Method, AttachInternals, Watch, h } from '@stencil/core';

@Component({
  tag: 'q-input',
  styleUrl: 'q-input.css',
  shadow: {
    delegatesFocus: true
  },
  formAssociated: true
})
export class QInput {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Prop({ mutable: true }) value: string = "";
  @Prop() type: 'text' | 'password' | 'email' | 'number' | 'url' | 'search' | 'color' = 'text';
  @Prop() placeholder: string = "";
  @Prop() label?: string;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop({ reflect: true }) error?: string;
  @Prop() errorMessage?: string;
  @Prop() size: 'sm' | 'md' | 'lg' = 'md';
  @Prop() clearable: boolean = false;
  @Prop() min?: number;
  @Prop() max?: number;
  @Prop() step?: number = 1;

  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  @State() hasPrefix: boolean = false;
  @State() hasSuffix: boolean = false;

  @Event() qChange!: EventEmitter<string>;
  @Event() qInput!: EventEmitter<string>;
  @Event() qBlur!: EventEmitter<FocusEvent>;
  @Event() qFocus!: EventEmitter<FocusEvent>;

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

  formResetCallback() {
    this.value = this.initialValue;
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
  }

  // ============================ [4] EXPOSED METHODS ============================

  @Method()
  async focusElement() {
    this.inputEl?.focus();
  }

  @Method()
  async clearValue() {
    this.handleClear();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handlePrefixSlotChange = (ev: Event) => {
    const slot = ev.target as HTMLSlotElement;
    this.hasPrefix = slot.assignedNodes({ flatten: true }).length > 0;
  };

  private handleSuffixSlotChange = (ev: Event) => {
    const slot = ev.target as HTMLSlotElement;
    this.hasSuffix = slot.assignedNodes({ flatten: true }).length > 0;
  };

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

  private handleIncrement = () => {
    if (this.disabled) return;
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
    const stepVal = (this.step !== undefined && this.step !== null) ? this.step : 1;
    let newValue = base + stepVal;
    if (this.max !== undefined && this.max !== null) {
      newValue = Math.min(this.max, newValue);
    }
    if (this.min !== undefined && this.min !== null) {
      newValue = Math.max(this.min, newValue);
    }
    this.value = String(newValue);
    // Imperatively update the native input so the display refreshes immediately.
    // Stencil's async VDOM re-render can be skipped when this.value was already
    // set to the same string before the effect fires (SYNCBACK_MAP race).
    if (this.inputEl) this.inputEl.value = this.value;
    this.qInput.emit(this.value);
    this.qChange.emit(this.value);
  };

  private handleDecrement = () => {
    if (this.disabled) return;
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
    const stepVal = (this.step !== undefined && this.step !== null) ? this.step : 1;
    let newValue = base - stepVal;
    if (this.min !== undefined && this.min !== null) {
      newValue = Math.max(this.min, newValue);
    }
    if (this.max !== undefined && this.max !== null) {
      newValue = Math.min(this.max, newValue);
    }
    this.value = String(newValue);
    // Same imperative update as handleIncrement — see comment there.
    if (this.inputEl) this.inputEl.value = this.value;
    this.qInput.emit(this.value);
    this.qChange.emit(this.value);
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

  private handleClear = () => {
    this.value = "";
    this.qInput.emit(this.value);
    this.qChange.emit(this.value);
    if (this.inputEl) {
      this.inputEl.focus();
    }
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const hasError = (this.error !== undefined && this.error.length > 0) || (this.errorMessage !== undefined && this.errorMessage.length > 0);
    const displayError = this.error || this.errorMessage;
    const showClearBtn = this.clearable && !this.disabled && this.value.length > 0;

    const showSuffixContainer = this.hasSuffix || showClearBtn;

    return (
      <div 
        class={{
          'input-wrapper': true,
          'is-disabled': this.disabled,
          'has-error': hasError,
          [`size-${this.size}`]: true
        }}
      >
        {/* Optional Header Label linked via htmlFor */}
        {this.label && (
          <label class="input-label" htmlFor="q-field" part="label">
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
            type={this.type}
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
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? 'q-field-error' : undefined}
          />

          {this.type === 'number' && !this.disabled && (
            <div class="input-spinners" part="spinners">
              <button class="spinner-btn spinner-up" type="button" onClick={this.handleIncrement} tabindex="-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button class="spinner-btn spinner-down" type="button" onClick={this.handleDecrement} tabindex="-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <span style={{ display: showClearBtn ? 'none' : 'block' }}>
              <slot 
                name="suffix" 
                onSlotchange={this.handleSuffixSlotChange} 
              />
            </span>
          </span>

        </div>

        {/* Validation Helper Message */}
        {hasError && (
          <span id="q-field-error" class="error-msg" part="error-msg">
            {displayError}
          </span>
        )}
      </div>
    );
  }
}
