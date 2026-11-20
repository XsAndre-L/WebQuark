import { Event, EventEmitter, Method, Prop, State, Watch, h, type MixedInCtor } from '@stencil/core';
import { renderSyntaxActions, renderSyntaxScroller } from './syntax-ui';

import { registerFormField } from '../../../utils/form-field-adapter';
import { isFieldDisabled, syncFieldHost } from '../../../utils/form-field-state';
import { syncNativeControlValidity } from '../../../utils/form-control-validity';
import { getSyntaxBoxCopyText, writeClipboardText } from './internals/clipboard';
import { getSyntaxBoxEditorKeyAction } from './internals/editor-key-action';
import { formatSource, isFormatSupported } from './internals/formatters/formatter';
import { tokenizeSyntax } from './internals/syntax';
import { normalizeSyntaxBoxValue, resolveInitialSyntaxBoxValue } from './internals/value-sync';

import type { QSyntaxBoxLanguage, QSyntaxBoxVariant } from './syntax-box.types';
import { ownContentNodes, revealSyntaxEditor, syntaxOwner, syntaxScrollRestorers, syntaxVisibility } from './internals/views';

export interface SyntaxContentLifecycle {
  componentDidRender(): void;
  disconnectedCallback(): void;
}

export const withSyntaxContent = <T extends MixedInCtor>(Base: T) => {
  class SyntaxContent extends Base {
    declare el: HTMLElement;
    declare internals: ElementInternals;

    /** Mirrored with `value`; prefer `code` for domain usage. */
    @Prop({ mutable: true }) code?: string;
    /** Form-value alias mirrored with `code` for compatibility. */
    @Prop({ mutable: true }) value?: string;
    /** Title in panel mode and tab label for a composed view. */
    @Prop({ reflect: true }) heading?: string;
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

    private initialValue?: string;
    private scrollPending = false;
    private copyRevision = 0;
    private copiedTimeoutId?: ReturnType<typeof setTimeout>;
    private scrollableEl?: HTMLQScrollableElement;
    private preEl?: HTMLPreElement;
    private contentEl?: HTMLElement;
    private actionsEl?: HTMLElement;
    private validationAnchor?: HTMLElement;

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
      this.initialValue = initial.code;
      this.syncFormValue(this.code);
    }

    formDisabledCallback() {
      this.syncValidity();
    }

    componentDidLoad() {
      syntaxScrollRestorers.set(this.el, () => this.resumeScroll());
      syntaxVisibility.set(this.el, () => this.syncVisibility());
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
        validate: report => this.validate(report),
      });
    }

    componentDidRender() {
      this.syncVisibility();
      this.syncLogSpacing();
    }

    private syncLogSpacing = () => {
      const slot = this.el.shadowRoot?.querySelector<HTMLSlotElement>('.slotted-body > slot');
      const hasLog = slot?.assignedElements().some(element => element.getAttribute('role') === 'log');
      this.el.classList.toggle('q-syntax-log-content', Boolean(hasLog));
    };

    private syncVisibility() {
      const inactive = syntaxOwner(this.el)?.visible(this.el) === false;
      if (this.contentEl) this.contentEl.inert = inactive;
      if (this.actionsEl) this.actionsEl.inert = inactive;
      if (this.validationAnchor) this.validationAnchor.hidden = !inactive;
      this.syncValidity();
    }

    disconnectedCallback() {
      this.copyRevision++;
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
      const owner = syntaxOwner(this.el);
      this.scrollPending = Boolean(owner && !owner.visible(this.el));
      if (!this.scrollPending) await this.scrollableEl?.scrollToBottom();
    }

    private resumeScroll() {
      if (this.scrollPending) void this.scrollToBottom();
    }

    /** Returns whether editable content satisfies native constraints. */
    @Method()
    async checkValidity(): Promise<boolean> {
      return this.validate(false);
    }

    /** Reports editable constraint violations and reveals the editor in its owning box. */
    @Method()
    async reportValidity(): Promise<boolean> {
      return this.validate(true);
    }

    private validate(report: boolean): boolean {
      this.syncValidity();
      const textarea = this.el.shadowRoot?.querySelector('textarea');
      if (report && this.editable && textarea?.validity.valid === false) {
        revealSyntaxEditor(this.el);
        textarea.focus({ preventScroll: true });
      }
      return report
        ? this.internals?.reportValidity?.() ?? textarea?.reportValidity?.() ?? true
        : this.internals?.checkValidity?.() ?? textarea?.checkValidity?.() ?? true;
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
        anchor: this.validationAnchor && !this.validationAnchor.hidden ? this.validationAnchor : textarea,
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

      const revision = ++this.copyRevision;
      const fallback = ownContentNodes(this.el).map(node => node.textContent ?? '').join('');
      const codeToCopy = getSyntaxBoxCopyText(this.code, fallback);
      try {
        await writeClipboardText(codeToCopy);
        if (!this.el.isConnected || revision !== this.copyRevision) return;

        this.copied = true;
        this.copyFailed = false;
      } catch {
        if (!this.el.isConnected || revision !== this.copyRevision) return;

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
    renderContent(variant: QSyntaxBoxVariant) {
      const resolvedHeight = this.height !== undefined ? this.height : variant === 'panel' ? '110px' : 'auto';
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
          <div class="slotted-body"><slot onSlotchange={this.syncLogSpacing} /></div>
        );

      const bodyContent = isScrollable && !this.editable
        ? renderSyntaxScroller(content, resolvedHeight, el => { this.scrollableEl = el; })
        : content;

      return [
        this.editable && <span class="validation-anchor" tabindex={-1}
          ref={el => { this.validationAnchor = el; }}
          onFocus={() => {
            revealSyntaxEditor(this.el);
            this.el.shadowRoot?.querySelector('textarea')?.focus({ preventScroll: true });
          }} />,
        <div class="view-content" ref={el => { this.contentEl = el; }}>
          {variant === 'panel' && formatFeedback && <div class="format-feedback" role="status">{formatFeedback}</div>}
          {bodyContent}
        </div>,
      ];
    }

    renderActions() {
      return renderSyntaxActions({
        editable: this.editable,
        copyable: this.copyable,
        disabled: this.isDisabled,
        formatSupported: isFormatSupported(this.language),
        copied: this.copied,
        copyFeedback: this.getCopyTooltipContent(),
        onFormat: this.handleFormat,
        onCopy: this.copyCode,
        ref: el => { this.actionsEl = el; },
      });
    }
  }

  // An exported anonymous mixin cannot include private fields in its emitted declaration.
  return SyntaxContent as MixedInCtor<{
    [Member in Exclude<keyof SyntaxContent, keyof SyntaxContentLifecycle>]: SyntaxContent[Member]
  } & SyntaxContentLifecycle>;
};
