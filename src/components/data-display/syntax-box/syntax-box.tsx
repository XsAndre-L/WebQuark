import { AttachInternals, Component, Element, Event, EventEmitter, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import { formatCode } from '../../../utils/formatter';
import { highlight as highlightSyntax } from '../../../utils/syntax';

import type { QSyntaxBoxLanguage, QSyntaxBoxVariant } from './syntax-box.types';
import { getSyntaxBoxEditorKeyAction } from './syntax-box.utils';

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

  /** Visual presentation for the code box. */
  @Prop() variant: QSyntaxBoxVariant = 'panel';

  /** Form field name used when the component is editable. */
  @Prop({ reflect: true }) name?: string;

  /** Syntax language used for highlighting and formatting. */
  @Prop() language: QSyntaxBoxLanguage = 'html';

  /** Code content to display or edit. Kept in sync with `value`; prefer `code` for domain usage. */
  @Prop({ mutable: true }) code?: string;

  /** Form value alias for `code`. Set either `code` or `value`; the component mirrors them for compatibility. */
  @Prop({ mutable: true }) value?: string;

  /** Optional header text shown in the panel variant. */
  @Prop() heading?: string;

  /** Shows a copy action in the panel header. */
  @Prop() copyable: boolean = false;

  /** Explicit content height. Panel mode defaults to 110px; plain mode defaults to auto. */
  @Prop() height?: string;

  /** Enables the editable textarea overlay. */
  @Prop({ reflect: true }) editable: boolean = false;

  /** Disables editing and panel actions. */
  @Prop({ reflect: true }) disabled: boolean = false;

  /** Marks the editable textarea as required for form validation. */
  @Prop({ reflect: true }) required: boolean = false;

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
    let finalCode = newCode;
    const textarea = this.el.shadowRoot?.querySelector('textarea');
    const isFocused = textarea && this.el.shadowRoot?.activeElement === textarea;

    if (this.editable && newCode && !isFocused) {
      const formatted = formatCode(newCode, this.language);
      if (formatted !== newCode) {
        finalCode = formatted;
        this.code = formatted;
      }
    }

    if (this.value !== finalCode) {
      this.value = finalCode;
    }
    this.syncFormValue(finalCode);
  }

  @Watch('value')
  watchValue(newValue: string) {
    let finalVal = newValue;
    const textarea = this.el.shadowRoot?.querySelector('textarea');
    const isFocused = textarea && this.el.shadowRoot?.activeElement === textarea;

    if (this.editable && newValue && !isFocused) {
      const formatted = formatCode(newValue, this.language);
      if (formatted !== newValue) {
        finalVal = formatted;
        this.value = formatted;
      }
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
    if (this.value !== undefined && this.code === undefined) {
      this.code = this.value;
    } else if (this.code !== undefined && this.value === undefined) {
      this.value = this.code;
    }

    if (this.editable && this.code) {
      const formatted = formatCode(this.code, this.language);
      this.code = formatted;
      this.value = formatted;
    }

    this.initialValue = this.code || '';
    this.syncFormValue(this.code);
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

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================
  private syncFormValue(value: string | undefined) {
    if (!this.internals || typeof this.internals.setFormValue !== 'function') return;
    this.internals.setFormValue(this.editable ? value || '' : null);
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

    const codeToCopy = this.code !== undefined ? this.code : this.el.textContent || '';
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        throw new Error('Clipboard API unavailable');
      }

      await navigator.clipboard.writeText(codeToCopy);
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
                    <q-icon slot="icon-left" lib="local" name="braces" size="sm"></q-icon>
                    <q-tooltip slot="icon-left" position="bottom" content="Format Code"></q-tooltip>
                  </q-button>
                )}
                {this.copyable && (
                  <q-button variant="ghost" size="sm" onClick={this.copyCode} disabled={this.disabled}>
                    <q-icon slot="icon-left" lib="local" name={this.copied ? 'check' : 'copy'} size="sm"></q-icon>
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
