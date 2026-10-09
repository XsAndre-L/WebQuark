import { isFieldDisabled, syncFieldHost } from '../../../utils/form-field-state';
import { registerFormField } from '../../../utils/form-field-adapter';
import { AttachInternals, Component, Element, Event, EventEmitter, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import { Braces, Check, Copy } from '@lucide/icons';
import { formatSource, isFormatSupported } from '../../../utils/formatter';
import { syncNativeControlValidity } from '../../../utils/form-control-validity';
import { tokenizeSyntax } from '../../../utils/syntax';

import type { QSyntaxBoxLanguage, QSyntaxBoxVariant } from './syntax-box.types';
import { getSyntaxBoxCopyText, writeClipboardText } from './internals/clipboard';
import { getSyntaxBoxEditorKeyAction } from './internals/editor-key-action';
import { normalizeSyntaxBoxValue, resolveInitialSyntaxBoxValue } from './internals/value-sync';

/**
 * Displays and optionally edits syntax-highlighted code, with form association in editable mode.
 * @slot - Read-only fallback content rendered when `code` is not provided.
 * @slot actions - Additional actions rendered in the panel header.
 */
@Component({
  tag: 'q-syntax-box',
  styleUrl: 'syntax-box.css',
  shadow: {
    delegatesFocus: true,
  },
  formAssociated: true,
})
export class QSyntaxBox {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  /** Mirrored with `value`; prefer `code` for domain usage. */
  @Prop({ mutable: true }) code?: string;
  /** Form-value alias mirrored with `code` for compatibility. */
  @Prop({ mutable: true }) value?: string;
  /** Shown only in the panel variant. */
  @Prop() heading?: string;
  /** Accessible name for the editor; falls back to `heading`, then the language. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  @Prop() variant: QSyntaxBoxVariant = 'panel';
  /** Explicit content height. Panel mode defaults to 110px; plain mode defaults to auto. */
  @Prop() height?: string;

  @Prop() copyable: boolean = false;
  @Prop({ reflect: true }) editable: boolean = false;
  /** Form field name used when the component is editable. */
  @Prop({ reflect: true }) name?: string;
  /** Marks the editable textarea as required for form validation. */
  @Prop({ reflect: true }) required: boolean = false;

  @Prop() language: QSyntaxBoxLanguage = 'html';

  /** Disables editing and panel actions. */
  @Prop({ reflect: true }) disabled: boolean = false;

  /** Emitted when editable content is committed by the native change event or by formatting. */
  @Event() qChange!: EventEmitter<string>;

  /** Emitted on each editable content input and after formatting. */
  @Event() qInput!: EventEmitter<string>;

  // ======================== [2] INTERNAL STATE & REFS ========================

  @State() private disabledState = false;

  private get isDisabled(): boolean {
    return isFieldDisabled(this.el, this.disabled);
  }
  @State() copied: boolean = false;

  @State() copyFailed: boolean = false;

  @State() formatMessage?: string;

  private initialValue = '';
  private copiedTimeoutId?: ReturnType<typeof setTimeout>;
  private scrollableEl?: HTMLQScrollableElement;
  private preEl?: HTMLPreElement;

  // ========================= [3] LIFECYCLE & WATCHERS =========================
  @Watch('code')
  watchCode(newCode: string | undefined) {
    this.formatMessage = undefined;
    const finalCode = normalizeSyntaxBoxValue(newCode, {
      editable: this.editable,
    });

    if (finalCode !== newCode) {
      this.code = finalCode;
    }

    if (this.value !== finalCode) {
      this.value = finalCode;
    }
    this.syncFormValue(finalCode);
  }

  @Watch('value')
  watchValue(newValue: string | undefined) {
    this.formatMessage = undefined;
    const finalVal = normalizeSyntaxBoxValue(newValue, {
      editable: this.editable,
    });

    if (finalVal !== newValue) {
      this.value = finalVal;
    }

    if (this.code !== finalVal) {
      this.code = finalVal;
    }

    this.syncFormValue(finalVal);
  }

  @Watch('disabled')
  @Watch('required')
  @Watch('name')
  watchConstraints() {
    this.syncValidity();
  }

  @Watch('editable')
  watchEditable() {
    if (this.editable) this.watchCode(this.code);
    this.syncFormValue(this.code);
  }

  componentWillLoad() {
    const initial = resolveInitialSyntaxBoxValue({
      code: this.code,
      value: this.value,
      editable: this.editable,
    });

    this.code = initial.code;
    this.value = initial.value;
    this.initialValue = initial.initialValue;
    this.syncFormValue(this.code);
  }

  formDisabledCallback() {
    this.syncValidity();
  }

  componentDidLoad() {
    registerFormField(this.el, {
      kind: 'text',
      owner: () => this.internals?.form ?? null,
      active: () => this.editable,
      value: () => this.code ?? '',
      assign: value => { this.value = value as string; },
      reconcile: () => {
        const textarea = this.el.shadowRoot?.querySelector('textarea');
        if (textarea && textarea.value !== (this.code ?? '')) textarea.value = this.code ?? '';
        this.syncFormValue(this.code);
        this.syncValidity();
      },
      reset: () => this.formResetCallback(),
      validate: report => report ? this.internals?.reportValidity?.() ?? true : this.internals?.checkValidity?.() ?? true,
    });
  }

  componentDidRender() {
    this.syncValidity();
  }

  disconnectedCallback() {
    this.clearCopiedTimeout();
  }

  formResetCallback() {
    this.code = this.initialValue;
    this.value = this.initialValue;
    this.syncFormValue(this.code);
    this.syncValidity();
  }

  // ========================== [4] EXPOSED METHODS ==========================
  /** Programmatically scrolls the read-only code body to the bottom when it is wrapped by q-scrollable. */
  @Method()
  async scrollToBottom() {
    await this.scrollableEl?.scrollToBottom();
  }

  /** Returns whether editable content satisfies native constraints. */
  @Method()
  async checkValidity(): Promise<boolean> {
    this.syncValidity();
    if (typeof this.internals.checkValidity === 'function') {
      return this.internals.checkValidity();
    }
    return this.el.shadowRoot?.querySelector('textarea')?.checkValidity?.() ?? true;
  }

  /** Reports editable constraint violations and returns whether the control is valid. */
  @Method()
  async reportValidity(): Promise<boolean> {
    this.syncValidity();
    if (typeof this.internals.reportValidity === 'function') {
      return this.internals.reportValidity();
    }
    return this.el.shadowRoot?.querySelector('textarea')?.reportValidity?.() ?? true;
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================
  private syncFormValue(value: string | undefined) {
    if (!this.internals || typeof this.internals.setFormValue !== 'function') return;
    this.internals.setFormValue(this.editable ? value || '' : null);
    this.syncValidity();
  }

  private syncValidity(): void {
    const disabled = syncFieldHost(this.el, this.disabled, this.name, this.required);
    if (this.disabledState !== disabled) this.disabledState = disabled;
    const textarea = this.el.shadowRoot?.querySelector('textarea');
    if (textarea) {
      textarea.disabled = disabled;
      textarea.required = this.required;
      textarea.readOnly = this.el.hasAttribute('readonly');
      if (textarea.value !== (this.code ?? '')) textarea.value = this.code ?? '';
    }
    this.internals?.setFormValue?.(this.editable && !disabled ? this.code ?? '' : null);
    if (!this.internals || !textarea || !this.editable) {
      if (typeof this.internals?.setValidity === 'function') {
        this.internals.setValidity({});
      }
      return;
    }

    syncNativeControlValidity({
      internals: this.internals,
      control: textarea,
      disabled: this.isDisabled,
    });
  }

  private clearCopiedTimeout() {
    if (this.copiedTimeoutId !== undefined) {
      clearTimeout(this.copiedTimeoutId);
      this.copiedTimeoutId = undefined;
    }
  }

  private scheduleCopyStateReset() {
    this.clearCopiedTimeout();
    this.copiedTimeoutId = setTimeout(() => {
      this.copied = false;
      this.copyFailed = false;
      this.copiedTimeoutId = undefined;
    }, 1500);
  }

  private copyCode = async () => {
    if (this.isDisabled) return;

    const codeToCopy = getSyntaxBoxCopyText(this.code, this.el.textContent);
    try {
      await writeClipboardText(codeToCopy);
      if (!this.el.isConnected) return;

      this.copied = true;
      this.copyFailed = false;
    } catch {
      if (!this.el.isConnected) return;

      this.copied = false;
      this.copyFailed = true;
    }

    this.scheduleCopyStateReset();
  };

  private handleScroll = (e: Event) => {
    const textarea = e.target as HTMLTextAreaElement;
    if (this.preEl) {
      this.preEl.scrollLeft = textarea.scrollLeft;
      this.preEl.scrollTop = textarea.scrollTop;
    }
  };

  private handleInput = (ev: Event) => {
    const target = ev.target as HTMLTextAreaElement;
    this.code = target.value;
    this.value = target.value;
    this.qInput.emit(this.code);
  };

  private handleChange = (ev: Event) => {
    const target = ev.target as HTMLTextAreaElement;
    this.code = target.value;
    this.value = target.value;
    this.qChange.emit(this.code);
  };

  private handleKeyDown = (ev: KeyboardEvent) => {
    const textarea = ev.target as HTMLTextAreaElement;
    const action = getSyntaxBoxEditorKeyAction(ev, textarea.value, textarea.selectionStart, textarea.selectionEnd);

    if (action.type === 'none') {
      return;
    }

    if (action.type === 'blur') {
      textarea.blur();
      return;
    }

    ev.preventDefault();
    this.code = action.value;
    this.value = action.value;
    this.qInput.emit(this.code);

    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = action.caret;
    });
  };

  private handleFormat = () => {
    if (this.isDisabled || !isFormatSupported(this.language)) return;
    if (this.code) {
      const result = formatSource(this.code, this.language);
      this.code = result.code;
      this.value = result.code;
      this.formatMessage = result.status === 'invalid' ? 'Invalid JSON; source unchanged.'
        : result.status === 'unsupported' ? 'JSON formatting limit reached; source unchanged.' : undefined;
      this.qInput.emit(result.code);
      this.qChange.emit(result.code);
    }
  };

  private getCopyTooltipContent() {
    if (this.copyFailed) return 'Copy failed';
    if (this.copied) return 'Copied!';
    return 'Copy';
  }

  // ===================== [6] RENDER (Visual Template Only) =====================
  render() {
    const resolvedHeight = this.height !== undefined ? this.height : this.variant === 'panel' ? '110px' : 'auto';
    const isScrollable = resolvedHeight !== 'auto' && resolvedHeight !== '';
    const formatSupported = isFormatSupported(this.language);
    const formatFeedback = this.editable ? formatSupported ? this.formatMessage : 'Formatting is available for JSON only.' : undefined;
    const highlighted = tokenizeSyntax(this.code ?? '', this.language).map(token =>
      token.className ? <span class={token.className}>{token.text}</span> : token.text
    );

    const content =
      this.editable || this.code !== undefined ? (
        this.editable ? (
          <div class="editor-area" style={{ height: resolvedHeight }}>
            <span id="syntax-box-keyboard-help" class="visually-hidden">
              Press Escape to leave the code editor. Press Tab to insert two spaces.
            </span>
            <textarea
              class="editor-textarea"
              value={this.code ?? ''}
              name={this.name}
              disabled={this.isDisabled}
              required={this.required}
              aria-label={this.ariaLabel?.trim() || this.heading?.trim() || `${this.language.toUpperCase()} code editor`}
              aria-describedby="syntax-box-keyboard-help"
              onInput={this.handleInput}
              onChange={this.handleChange}
              onScroll={this.handleScroll}
              onKeyDown={this.handleKeyDown}
            />
            <pre class="code-body" ref={el => (this.preEl = el as HTMLPreElement)}>
              <code>{highlighted}</code>
            </pre>
          </div>
        ) : (
          <pre class="code-body">
            <code>{highlighted}</code>
          </pre>
        )
      ) : (
        <slot></slot>
      );

    const bodyContent =
      isScrollable && !this.editable ? (
        <q-scrollable height={resolvedHeight} ref={el => (this.scrollableEl = el as HTMLQScrollableElement)}>
          {content}
        </q-scrollable>
      ) : (
        content
      );

    if (this.variant === 'panel') {
      return (
        <Host class={{ 'q-syntax-box-panel': true }}>
          <div class="panel-container">
            <div class="panel-header">
              <span>{this.heading}</span>
              <div class="panel-actions">
                <slot name="actions"></slot>
                {this.editable && (
                  <q-button class="format-btn" variant="ghost" size="sm" onClick={this.handleFormat} disabled={this.isDisabled || !formatSupported}>
                    <q-icon slot="icon-left" definition={Braces} name="braces" size="sm"></q-icon>
                    <q-tooltip slot="icon-left" position="bottom" content={formatSupported ? 'Format JSON' : 'Formatting is available for JSON only.'}></q-tooltip>
                  </q-button>
                )}
                {this.copyable && (
                  <q-button variant="ghost" size="sm" onClick={this.copyCode} disabled={this.isDisabled}>
                    <q-icon
                      slot="icon-left"
                      definition={this.copied ? Check : Copy}
                      name={this.copied ? 'check' : 'copy'}
                      size="sm"
                    ></q-icon>
                    <q-tooltip slot="icon-left" position="bottom" content={this.getCopyTooltipContent()}></q-tooltip>
                  </q-button>
                )}
              </div>
            </div>
            {formatFeedback && <div class="format-feedback" role="status">{formatFeedback}</div>}
            {bodyContent}
          </div>
        </Host>
      );
    }

    return (
      <Host class={{ 'q-syntax-box-plain': true }}>
        <div class="plain-container">{bodyContent}</div>
      </Host>
    );
  }
}
