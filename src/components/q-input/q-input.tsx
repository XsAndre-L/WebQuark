import { Component, Prop, Event, EventEmitter, Element, Method, AttachInternals, Watch, h } from '@stencil/core';
import { getSlottedElements } from '../../utils/dom';

@Component({
  tag: 'q-input',
  styleUrl: 'q-input.css',
  shadow: {
    delegatesFocus: true
  },
  formAssociated: true
})
export class QInput {
  @Prop({ mutable: true }) value: string = "";
  @Prop() type: 'text' | 'password' | 'email' | 'number' | 'url' | 'search' = 'text';
  @Prop() placeholder: string = "";
  @Prop() label?: string;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop({ reflect: true }) error?: string;
  @Prop() errorMessage?: string;
  @Prop() clearable: boolean = false;

  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  @Event() qChange!: EventEmitter<string>;
  @Event() qInput!: EventEmitter<string>;
  @Event() qBlur!: EventEmitter<FocusEvent>;
  @Event() qFocus!: EventEmitter<FocusEvent>;

  private inputEl?: HTMLInputElement;
  private initialValue: string = "";

  @Watch('value')
  watchValue(newValue: string) {
    this.internals.setFormValue(newValue);
  }

  componentWillLoad() {
    this.initialValue = this.value || "";
    this.internals.setFormValue(this.value);
  }

  formResetCallback() {
    this.value = this.initialValue;
    this.internals.setFormValue(this.value);
  }

  @Method()
  async focusElement() {
    this.inputEl?.focus();
  }

  @Method()
  async clearValue() {
    this.handleClear();
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

  private handleBlur = (ev: FocusEvent) => {
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

  render() {
    const hasError = (this.error !== undefined && this.error.length > 0) || (this.errorMessage !== undefined && this.errorMessage.length > 0);
    const displayError = this.error || this.errorMessage;
    const showClearBtn = this.clearable && !this.disabled && this.value.length > 0;
    
    // Check if slots are populated to prevent empty margin boxes, using DOM helper
    const lightChildren = getSlottedElements(this.el);
    const hasPrefix = lightChildren.some(el => el.getAttribute('slot') === 'prefix');
    const hasSuffix = lightChildren.some(el => el.getAttribute('slot') === 'suffix') || showClearBtn;

    return (
      <div 
        class={{
          'input-wrapper': true,
          'is-disabled': this.disabled,
          'has-error': hasError
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
          
          {/* Prefix Slot Container rendered conditionally */}
          {hasPrefix && (
            <span class="prefix-container" part="prefix">
              <slot name="prefix" />
            </span>
          )}

          {/* Native HTML Input */}
          <input
            ref={(el) => (this.inputEl = el as HTMLInputElement)}
            id="q-field"
            class={{
              'input-box': true,
              'has-prefix-padding': hasPrefix,
              'has-suffix-padding': hasSuffix
            }}
            type={this.type}
            value={this.value}
            placeholder={this.placeholder}
            disabled={this.disabled}
            required={this.required}
            onInput={this.handleInput}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            onFocus={this.handleFocus}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? 'q-field-error' : undefined}
          />

          {/* Suffix / Clear Button Container rendered conditionally */}
          {hasSuffix && (
            <span class="suffix-container" part="suffix">
              {showClearBtn ? (
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
              ) : (
                <slot name="suffix" />
              )}
            </span>
          )}

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
