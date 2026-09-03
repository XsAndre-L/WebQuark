import { AttachInternals, Component, Element, Event, EventEmitter, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import { Braces, Check, Copy } from '@lucide/icons';
import { formatCode } from '../../../utils/formatter';
import { syncNativeControlValidity } from '../../../utils/form-control-validity';
import { highlight as highlightSyntax } from '../../../utils/syntax';

import type { QSyntaxBoxLanguage, QSyntaxBoxVariant } from './syntax-box.types';
import { getSyntaxBoxCopyText, writeClipboardText } from './internals/clipboard';
import { getSyntaxBoxEditorKeyAction } from './internals/editor-key-action';
import { normalizeSyntaxBoxValue, resolveInitialSyntaxBoxValue } from './internals/value-sync';

/**
 * Displays and optionally edits syntax-highlighted code, with form association in editable mode.
 * @slot - Fallback content rendered when `code` is not provided.
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
  @State() copied: boolean = false;

  @State() copyFailed: boolean = false;

  private initialValue = '';
  private copiedTimeoutId?: ReturnType<typeof setTimeout>;
  private scrollableEl?: HTMLQScrollableElement;
  private preEl?: HTMLPreElement;

  // ========================= [3] LIFECYCLE & WATCHERS =========================
  @Watch('code')
  watchCode(newCode: string) {
    const textarea = this.el.shadowRoot?.querySelector('textarea');
    const isFocused = textarea && this.el.shadowRoot?.activeElement === textarea;
    const finalCode = normalizeSyntaxBoxValue(newCode, {
      editable: this.editable,
      language: this.language,
      shouldFormat: !isFocused,
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
  watchValue(newValue: string) {
    const textarea = this.el.shadowRoot?.querySelector('textarea');
    const isFocused = textarea && this.el.shadowRoot?.activeElement === textarea;
    const finalVal = normalizeSyntaxBoxValue(newValue, {
      editable: this.editable,
      language: this.language,
      shouldFormat: !isFocused,
    });

    if (finalVal !== newValue) {
      this.value = finalVal;
    }

    if (this.code !== finalVal) {
      this.code = finalVal;
    }

    this.syncFormValue(finalVal);
  }

  @Watch('editable')
  watchEditable() {
    this.syncFormValue(this.code);
  }

  componentWillLoad() {
    const initial = resolveInitialSyntaxBoxValue({
      code: this.code,
      value: this.value,
      editable: this.editable,
      language: this.language,
    });

    this.code = initial.code;
    this.value = initial.value;
    this.initialValue = initial.initialValue;
    this.syncFormValue(this.code);
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
  }

  private syncValidity(): void {
    const textarea = this.el.shadowRoot?.querySelector('textarea');
    if (!this.internals || !textarea || !this.editable) {
      if (typeof this.internals?.setValidity === 'function') {
        this.internals.setValidity({});
      }
      return;
    }

    syncNativeControlValidity({
      internals: this.internals,
      control: textarea,
      disabled: this.disabled,
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
    if (this.disabled) return;

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
    if (this.disabled) return;
    if (this.code) {
      const formatted = formatCode(this.code, this.language);
      this.code = formatted;
      this.value = formatted;
      this.qInput.emit(formatted);
      this.qChange.emit(formatted);
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

    const content =
      this.code !== undefined ? (
        this.editable ? (
          <div class="editor-area" style={{ height: resolvedHeight }}>
            <span id="syntax-box-keyboard-help" class="visually-hidden">
              Press Escape to leave the code editor. Press Tab to insert two spaces.
            </span>
            <textarea
              class="editor-textarea"
              value={this.code}
              name={this.name}
              disabled={this.disabled}
              required={this.required}
              aria-label={this.ariaLabel?.trim() || this.heading?.trim() || `${this.language.toUpperCase()} code editor`}
              aria-describedby="syntax-box-keyboard-help"
              onInput={this.handleInput}
              onChange={this.handleChange}
              onScroll={this.handleScroll}
              onKeyDown={this.handleKeyDown}
            />
            <pre class="code-body" ref={el => (this.preEl = el as HTMLPreElement)}>
              <code innerHTML={highlightSyntax(this.code, this.language)}></code>
            </pre>
          </div>
        ) : (
          <pre class="code-body">
            <code innerHTML={highlightSyntax(this.code, this.language)}></code>
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
                  <q-button class="format-btn" variant="ghost" size="sm" onClick={this.handleFormat} disabled={this.disabled}>
                    <q-icon slot="icon-left" definition={Braces} name="braces" size="sm"></q-icon>
                    <q-tooltip slot="icon-left" position="bottom" content="Format Code"></q-tooltip>
                  </q-button>
                )}
                {this.copyable && (
                  <q-button variant="ghost" size="sm" onClick={this.copyCode} disabled={this.disabled}>
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
