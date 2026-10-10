import { isFieldDisabled, syncFieldHost, syncNativeAttribute } from '../../../utils/form-field-state';
import { registerFormField } from '../../../utils/form-field-adapter';
import { fieldFeedback, feedbackStyle } from '../../shared/field';
import type { QControlSize } from '../../../theme/tokens';
import { Component, Prop, State, Event, EventEmitter, Method, Element, AttachInternals, Watch, h } from '@stencil/core';

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
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) value: string = "";
  @Prop() placeholder: string = "";
  @Prop() label?: string;
  /** Accessible name for the native textarea when a visible label is not used. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Supporting text, replaced by an active error. */
  @Prop() description?: string;

  @Prop() size: QControlSize = 'inherit';
  /** Keep the label accessible without displaying it. */
  @Prop() labelHidden: boolean = false;
  /** Omitted inherits the enclosing form; false cancels reservation. */
  @Prop() reserveFeedback?: boolean;

  @Prop() rows: number = 3;
  /** Grows with content when `resizeMode` is `auto`. */
  @Prop() autoGrow: boolean = true;
  /** Resize behavior: auto grows to content, manual allows vertical drag, fixed locks the height. */
  @Prop() resizeMode: QTextareaResizeMode = 'auto';

  @Prop({ reflect: true }) disabled: boolean = false;

  @Prop({ reflect: true }) required: boolean = false;
  /** Validation error text or error-state flag. */
  @Prop({ reflect: true }) error?: string;
  /** @deprecated Use error. Used when error is empty or unset. */
  @Prop() errorMessage?: string;

  @Prop({ reflect: true }) name?: string;

  @AttachInternals() internals!: ElementInternals;

  /** Emitted when the committed value changes. */
  @Event() qChange!: EventEmitter<string>;

  @Event() qInput!: EventEmitter<string>;

  @Event() qBlur!: EventEmitter<FocusEvent>;

  @Event() qFocus!: EventEmitter<FocusEvent>;

  @Event() qClick!: EventEmitter<MouseEvent>;

  private textareaEl?: HTMLTextAreaElement;
  private sizeProbeEl?: HTMLSpanElement;
  private resizeObserver?: ResizeObserver;
  private resizeFrame?: number;
  private lastGeometry = '';

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
    requestAnimationFrame(() => this.adjustHeightInternal());
  }

  @Watch('disabled')
  @Watch('required')
  @Watch('name')
  @Watch('error')
  @Watch('errorMessage')
  watchConstraints() {
    this.syncValidity();
  }

  @Watch('resizeMode')
  @Watch('autoGrow')
  @Watch('size')
  @Watch('rows')
  handleResizeModeChange() {
    requestAnimationFrame(() => this.adjustHeightInternal());
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
        if (this.textareaEl && this.textareaEl.value !== this.value) this.textareaEl.value = this.value;
        this.internals?.setFormValue?.(this.value);
        this.syncValidity();
      },
      reset: () => this.formResetCallback(),
      validate: report => report ? this.internals?.reportValidity?.() ?? true : this.internals?.checkValidity?.() ?? true,
    });

    this.adjustHeightInternal();
    this.syncValidity();
    this.observeGeometry();
  }

  connectedCallback() {
    if (this.textareaEl) this.observeGeometry();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = undefined;
    this.lastGeometry = '';
  }

  private observeGeometry() {
    if (this.resizeObserver || !this.textareaEl || !this.sizeProbeEl || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeFrame !== undefined) return;
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = undefined;
        if (!this.textareaEl || this.activeResizeMode !== 'auto') return;
        const style = getComputedStyle(this.textareaEl);
        // Exclude height: changing it is the result of auto-grow, not a new input.
        const geometry = [style.width, style.font, style.letterSpacing, style.padding, style.borderWidth, this.rows].join('|');
        if (geometry === this.lastGeometry) return;
        this.lastGeometry = geometry;
        this.adjustHeightInternal();
      });
    });
    this.resizeObserver.observe(this.textareaEl);
    this.resizeObserver.observe(this.sizeProbeEl);
  }

  componentDidRender() {
    this.syncValidity();
  }

  formResetCallback() {
    this.value = this.initialValue;
    this.syncValidity();
    this.adjustHeightInternal();
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
    if (this.isDisabled) return;
    this.qClick.emit(ev);
  };

  private syncValidity(): void {
    const disabled = syncFieldHost(this.el, this.disabled, this.name, this.required);
    if (this.disabledState !== disabled) this.disabledState = disabled;
    if (!this.textareaEl || !this.internals) return;
    this.textareaEl.disabled = disabled;
    this.textareaEl.required = this.required;
    this.textareaEl.readOnly = this.el.hasAttribute('readonly');
    this.textareaEl.name = this.name ?? '';
    syncNativeAttribute(this.textareaEl, 'rows', this.rows);
    if (this.textareaEl.value !== this.value) this.textareaEl.value = this.value;
    this.internals.setFormValue?.(disabled ? null : this.value);

    syncNativeControlValidity({
      internals: this.internals,
      control: this.textareaEl,
      disabled: this.isDisabled,
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
      const styles = getComputedStyle(this.textareaEl);
      const borderHeight =
        (Number.parseFloat(styles.borderTopWidth) || 0) +
        (Number.parseFloat(styles.borderBottomWidth) || 0);

      this.textareaEl.style.height = `${scrollHeight + borderHeight}px`;
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
        style={feedbackStyle(this.reserveFeedback)}
        class={{
          'textarea-wrapper': true,
          'is-disabled': this.isDisabled,
          'has-error': hasError,
          [`size-${this.size}`]: true
        }}
      >
        {/* A fixed-height textarea cannot report inherited font changes itself. */}
        <span class="textarea-size-probe" aria-hidden="true" ref={el => (this.sizeProbeEl = el)}>M</span>
        {/* Optional Header Label linked via htmlFor */}
        {this.label && (
          <label class={{ 'textarea-label': true, 'q-label-hidden': this.labelHidden }} htmlFor="q-field" part="label">
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
          disabled={this.isDisabled}
          required={this.required}
          onInput={this.handleInput}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          onClick={this.handleClick}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError || this.description ? 'q-field-error' : undefined}
          aria-label={ariaLabel}
        />

        {/* Validation Helper Message */}
        {fieldFeedback('q-field-error', displayError, this.description)}
      </div>
    );
  }
}
