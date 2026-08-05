import { Component, Prop, Event, EventEmitter, Method, AttachInternals, Watch, h } from '@stencil/core';

import { syncNativeControlValidity } from '../../../utils/form-control-validity';
import type { QTextareaResizeMode } from './textarea.types';

/**
 * Form-associated textarea with optional auto-grow behavior and validation messaging.
 * @part label - Optional field label.
 * @part textarea - Native textarea field.
 * @part error-msg - Validation helper text.
 */
@Component({
  tag: 'q-textarea',
  styleUrl: 'textarea.css',
  shadow: {
    delegatesFocus: true
  },
  formAssociated: true
})
export class QTextarea {
  // ======== [1] STENCIL API (Props, Events, AttachInternals) =========
  /** Current textarea value. */
  @Prop({ mutable: true }) value: string = "";

  /** Native form field name. */
  @Prop({ reflect: true }) name?: string;

  /** Placeholder text shown when the field is empty. */
  @Prop() placeholder: string = "";

  /** Optional label rendered above the textarea. */
  @Prop() label?: string;

  /** Accessible name for the native textarea when a visible label is not used. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  /** Visible row count used by the native textarea. */
  @Prop() rows: number = 3;

  /** Enables automatic height growth when resizeMode is auto. */
  @Prop() autoGrow: boolean = true;

  /** Resize behavior: auto grows to content, manual allows vertical drag, fixed locks the height. */
  @Prop() resizeMode: QTextareaResizeMode = 'auto';

  /** Disables textarea interaction. */
  @Prop({ reflect: true }) disabled: boolean = false;

  /** Marks the field as required for native forms. */
  @Prop({ reflect: true }) required: boolean = false;

  /** Validation error text or error-state flag. */
  @Prop({ reflect: true }) error?: string;

  /** Validation helper text displayed when the field is in an error state. */
  @Prop() errorMessage?: string;

  @AttachInternals() internals!: ElementInternals;

  /** Emitted when the committed value changes. */
  @Event() qChange!: EventEmitter<string>;

  /** Emitted as the user types. */
  @Event() qInput!: EventEmitter<string>;

  /** Emitted when the native textarea loses focus. */
  @Event() qBlur!: EventEmitter<FocusEvent>;

  /** Emitted when the native textarea receives focus. */
  @Event() qFocus!: EventEmitter<FocusEvent>;

  /** Emitted when the native textarea is clicked. */
  @Event() qClick!: EventEmitter<MouseEvent>;

  private textareaEl?: HTMLTextAreaElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private initialValue: string = "";

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('value')
  watchValue(newValue: string) {
    const value = newValue ?? "";

    if (this.textareaEl && this.textareaEl.value !== value) {
      this.textareaEl.value = value;
    }

    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(value);
    }
    requestAnimationFrame(() => this.adjustHeightInternal());
  }

  @Watch('resizeMode')
  @Watch('autoGrow')
  handleResizeModeChange() {
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
    this.syncValidity();
  }

  componentDidRender() {
    this.syncValidity();
  }

  formResetCallback() {
    this.value = this.initialValue;
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.value);
    }
    requestAnimationFrame(() => this.adjustHeightInternal());
  }

  // ============================ [4] EXPOSED METHODS ============================

  /** Moves focus to the native textarea. */
  @Method()
  async focusElement() {
    this.textareaEl?.focus();
  }

  /** Recalculates the auto-grow height when resizeMode is auto. */
  @Method()
  async adjustHeight() {
    this.adjustHeightInternal();
  }

  /** Returns whether the control satisfies native and custom constraints. */
  @Method()
  async checkValidity(): Promise<boolean> {
    this.syncValidity();
    if (typeof this.internals.checkValidity === 'function') {
      return this.internals.checkValidity();
    }
    return this.textareaEl?.checkValidity?.() ?? true;
  }

  /** Reports native or custom constraint violations and returns whether the control is valid. */
  @Method()
  async reportValidity(): Promise<boolean> {
    this.syncValidity();
    if (typeof this.internals.reportValidity === 'function') {
      return this.internals.reportValidity();
    }
    return this.textareaEl?.reportValidity?.() ?? true;
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

  private syncValidity(): void {
    if (!this.textareaEl || !this.internals) return;

    syncNativeControlValidity({
      internals: this.internals,
      control: this.textareaEl,
      disabled: this.disabled,
      customError: this.error || this.errorMessage,
    });
  }

  private get activeResizeMode(): QTextareaResizeMode {
    if (!this.autoGrow && this.resizeMode === 'auto') {
      return 'fixed';
    }
    return this.resizeMode;
  }

  private adjustHeightInternal() {
    if (this.activeResizeMode !== 'auto' || !this.textareaEl) return;

    // OSR safe calculation: reset height to recalculate scrollHeight.
    this.textareaEl.style.height = 'auto';

    const scrollHeight = this.textareaEl.scrollHeight;
    if (scrollHeight > 0) {
      this.textareaEl.style.height = `${scrollHeight}px`;
    } else {
      this.textareaEl.style.height = '';
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const hasError = !!(this.error || this.errorMessage);
    const displayError = this.error || this.errorMessage;
    const ariaLabel = this.ariaLabel?.trim() || (!this.label && this.placeholder ? this.placeholder : undefined);

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
          class={{
            'textarea-box': true,
            'resize-manual': this.activeResizeMode === 'manual'
          }}
          part="textarea"
          value={this.value}
          name={this.name}
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
          aria-label={ariaLabel}
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
