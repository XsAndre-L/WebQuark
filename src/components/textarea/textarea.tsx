import { Component, Prop, Event, EventEmitter, Element, Method, AttachInternals, Watch, h } from '@stencil/core';

@Component({
  tag: 'q-textarea',
  styleUrl: 'textarea.css',
  shadow: {
    delegatesFocus: true
  },
  formAssociated: true
})
export class QTextarea {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) value: string = "";
  @Prop() placeholder: string = "";
  @Prop() label?: string;
  @Prop() rows: number = 3;
  @Prop() autoGrow: boolean = true;
  @Prop() resizeMode: 'auto' | 'manual' | 'fixed' = 'auto';
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop({ reflect: true }) error?: string;
  @Prop() errorMessage?: string;

  @AttachInternals() internals!: ElementInternals;

  @Event() qChange!: EventEmitter<string>;
  @Event() qInput!: EventEmitter<string>;
  @Event() qBlur!: EventEmitter<FocusEvent>;
  @Event() qFocus!: EventEmitter<FocusEvent>;
  @Event() qClick!: EventEmitter<MouseEvent>;

  private textareaEl?: HTMLTextAreaElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private initialValue: string = "";

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('value')
  watchValue(newValue: string) {
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(newValue);
    }
    requestAnimationFrame(() => this.adjustHeightInternal());
  }

  componentWillLoad() {
    this.initialValue = this.value || "";
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
  }

  componentDidLoad() {
    this.adjustHeightInternal();
  }

  formResetCallback() {
    this.value = this.initialValue;
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
    requestAnimationFrame(() => this.adjustHeightInternal());
  }

  // ============================ [4] EXPOSED METHODS ============================

  @Method()
  async focusElement() {
    this.textareaEl?.focus();
  }

  @Method()
  async adjustHeight() {
    this.adjustHeightInternal();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleInput = (ev: Event) => {
    const target = ev.target as HTMLTextAreaElement;
    this.value = target.value;
    this.qInput.emit(this.value);
    this.adjustHeightInternal();
  };

  private handleChange = (ev: Event) => {
    const target = ev.target as HTMLTextAreaElement;
    this.value = target.value;
    this.qChange.emit(this.value);
  };

  private handleBlur = (ev: FocusEvent) => {
    this.qBlur.emit(ev);
  };

  private handleFocus = (ev: FocusEvent) => {
    this.qFocus.emit(ev);
  };

  private handleClick = (ev: MouseEvent) => {
    if (this.disabled) return;
    this.qClick.emit(ev);
  };

  private get activeResizeMode(): 'auto' | 'manual' | 'fixed' {
    if (!this.autoGrow && this.resizeMode === 'auto') {
      return 'fixed';
    }
    return this.resizeMode;
  }

  private adjustHeightInternal() {
    if (this.activeResizeMode !== 'auto' || !this.textareaEl) return;

    // OSR Safe calculation: reset height to recalculate scrollHeight
    this.textareaEl.style.height = 'auto';

    const scrollHeight = this.textareaEl.scrollHeight;
    if (scrollHeight > 0) {
      this.textareaEl.style.height = `${scrollHeight}px`;
    } else {
      // Fallback if textarea is initialized inside a hidden container (zero-height bug)
      this.textareaEl.style.height = '';
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const hasError = !!(this.error || this.errorMessage);
    const displayError = this.error || this.errorMessage;

    return (
      <div 
        class={{
          'textarea-wrapper': true,
          'is-disabled': this.disabled,
          'has-error': hasError
        }}
      >
        {/* Optional Header Label linked via htmlFor */}
        {this.label && (
          <label class="textarea-label" htmlFor="q-field" part="label">
            {this.label}
          </label>
        )}

        {/* Core Textarea Box */}
        <textarea
          ref={(el) => (this.textareaEl = el as HTMLTextAreaElement)}
          id="q-field"
          class="textarea-box"
          style={{ resize: this.activeResizeMode === 'manual' ? 'vertical' : 'none' }}
          part="textarea"
          value={this.value}
          placeholder={this.placeholder}
          rows={this.rows}
          disabled={this.disabled}
          required={this.required}
          onInput={this.handleInput}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          onClick={this.handleClick}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? 'q-field-error' : undefined}
        />

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
