import { Component, Prop, Element, State, Method, Host, Event, EventEmitter, Watch, AttachInternals, h } from '@stencil/core';
import { formatCode } from '../../utils/formatter';
import { highlight as highlightSyntax } from '../../utils/syntax';

import type { QSyntaxBoxLanguage, QSyntaxBoxVariant } from './syntax-box.types';

@Component({
  tag: 'q-syntax-box',
  styleUrl: 'syntax-box.css',
  shadow: {
    delegatesFocus: true
  },
  formAssociated: true,
})
export class QSyntaxBox {
  @Element() el!: HTMLElement;

  @Prop() variant: QSyntaxBoxVariant = 'panel';
  @Prop({ reflect: true }) name?: string;
  @Prop() language: QSyntaxBoxLanguage = 'html';
  @Prop({ mutable: true }) code?: string;
  @Prop({ mutable: true }) value?: string;
  @Prop() heading?: string;
  @Prop() copyable: boolean = false;
  @Prop() height?: string;
  @Prop() editable: boolean = false;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;

  @AttachInternals() internals!: ElementInternals;

  @Event() qChange!: EventEmitter<string>;
  @Event() qInput!: EventEmitter<string>;

  private initialValue = '';

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

  formResetCallback() {
    this.code = this.initialValue;
    this.value = this.initialValue;
    this.syncFormValue(this.code);
  }

  private syncFormValue(value: string | undefined) {
    if (!this.internals || typeof this.internals.setFormValue !== 'function') return;
    this.internals.setFormValue(this.editable ? value || '' : null);
  }

  @State() copied: boolean = false;

  private scrollableEl?: any;

  @Method()
  async scrollToBottom() {
    if (this.scrollableEl && typeof this.scrollableEl.scrollToBottom === 'function') {
      await this.scrollableEl.scrollToBottom();
    }
  }

  private copyCode = () => {
    if (this.disabled) return;
    const codeToCopy = this.code !== undefined ? this.code : this.el.textContent || '';
    navigator.clipboard.writeText(codeToCopy).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 1500);
    });
  };

  private preEl?: HTMLPreElement;

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
    if (ev.key === 'Tab') {
      ev.preventDefault();
      const textarea = ev.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const spaces = '  ';
      const newValue = val.substring(0, start) + spaces + val.substring(end);
      this.code = newValue;
      this.value = newValue;
      this.qInput.emit(this.code);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      });
    }
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

  render() {
    const resolvedHeight = this.height !== undefined ? this.height : (this.variant === 'panel' ? '110px' : 'auto');
    const isScrollable = resolvedHeight !== 'auto' && resolvedHeight !== '';

    const content = this.code !== undefined ? (
      this.editable ? (
        <div class="editor-area" style={{ height: resolvedHeight }}>
          <textarea
            class="editor-textarea"
            value={this.code}
            name={this.name}
            disabled={this.disabled}
            required={this.required}
            onInput={this.handleInput}
            onChange={this.handleChange}
            onScroll={this.handleScroll}
            onKeyDown={this.handleKeyDown}
          />
          <pre class="code-body" ref={(el) => (this.preEl = el as HTMLPreElement)}>
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

    const bodyContent = (isScrollable && !this.editable) ? (
      <q-scrollable height={resolvedHeight} ref={(el) => (this.scrollableEl = el)}>
        {content}
      </q-scrollable>
    ) : (
      content
    );

    if (this.variant === 'panel') {
      return (
        <Host class={{ 'q-syntax-box-panel': true, 'is-editable': this.editable, 'is-disabled': this.disabled }}>
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
                    <q-icon slot="icon-left" lib="local" name={this.copied ? "check" : "copy"} size="sm"></q-icon>
                    <q-tooltip slot="icon-left" position="bottom" content={this.copied ? "Copied!" : "Copy"}></q-tooltip>
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
      <Host class={{ 'q-syntax-box-plain': true, 'is-editable': this.editable, 'is-disabled': this.disabled }}>
        <div class="plain-container">
          {bodyContent}
        </div>
      </Host>
    );
  }
}



