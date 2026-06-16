import { Component, Prop, Element, State, Method, Host, Event, EventEmitter, Watch, AttachInternals, h } from '@stencil/core';
import { formatCode } from '../../utils/formatter';

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

  @Prop() variant: 'panel' | 'plain' = 'panel';
  @Prop() language: 'html' | 'javascript' | 'css' | 'json' = 'html';
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
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(finalCode || '');
    }
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

    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.code || '');
    }
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
    const codeToCopy = this.code !== undefined ? this.code : this.el.textContent || '';
    navigator.clipboard.writeText(codeToCopy).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 1500);
    });
  };

  private escapeHtml(text: string): string {
    if (!text) return '';
    if (text.includes('&lt;') || text.includes('&gt;') || text.includes('&amp;')) {
      return text;
    }
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private highlightHtml(text: string): string {
    let esc = this.escapeHtml(text);
    return esc
      // Match comments: <!-- ... -->
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="code-comment">$1</span>')
      // Match attribute values: double quotes or single quotes
      .replace(/(&quot;.*?&quot;)/gi, '<span class="code-value">$1</span>')
      .replace(/(&#39;.*?&#39;)/gi, '<span class="code-value">$1</span>')
      // Match attributes: whitespace followed by name, then =
      .replace(/(\s[a-z0-9-]+)=/gi, ' <span class="code-attr">$1</span>=')
      // Match tag start: </?tagname
      .replace(/(&lt;\/?[a-z0-9-]+)/gi, '<span class="code-tag">$1</span>')
      // Match close tags: >
      .replace(/(&gt;)/g, '<span class="code-tag">&gt;</span>');
  }

  private highlightJavascript(text: string): string {
    let esc = this.escapeHtml(text);
    const tokenRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|export|import|from|new|this|typeof|instanceof|try|catch|finally|throw|async|await|null|undefined|true|false)\b)|(\b\d+\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b(?=\s*\())/g;

    return esc.replace(tokenRegex, (match, comment, str, keyword, num, fn) => {
      if (comment) {
        return `<span class="code-comment">${comment}</span>`;
      }
      if (str) {
        return `<span class="code-value">${str}</span>`;
      }
      if (keyword) {
        return `<span class="code-tag">${keyword}</span>`;
      }
      if (num) {
        return `<span class="code-number">${num}</span>`;
      }
      if (fn) {
        return `<span class="code-attr">${fn}</span>`;
      }
      return match;
    });
  }

  private highlightCss(text: string): string {
    let esc = this.escapeHtml(text);
    const tokenRegex = /(\/\*[\s\S]*?\*\/)|((?:^|\})[^{]*\{)|(\b[a-zA-Z\-]+\b\s*:)|(:\s*[^;\}]+)|("[^"]*"|'[^']*')/g;

    return esc.replace(tokenRegex, (match, comment, selectorRule, property, value, str) => {
      if (comment) {
        return `<span class="code-comment">${comment}</span>`;
      }
      if (selectorRule) {
        const braceIdx = selectorRule.indexOf('{');
        const selector = selectorRule.slice(0, braceIdx);
        return `<span class="code-tag">${selector}</span>{`;
      }
      if (property) {
        const propName = property.replace(':', '').trim();
        return `<span class="code-attr">${propName}</span>:`;
      }
      if (value) {
        const valText = value.slice(1);
        return `:<span class="code-value">${valText}</span>`;
      }
      if (str) {
        return `<span class="code-value">${str}</span>`;
      }
      return match;
    });
  }

  private highlightJson(text: string): string {
    let esc = this.escapeHtml(text);
    const tokenRegex = /("[^"]*")\s*:|(:\s*"[^"]*")|("[^"]*")|(\b(?:true|false|null|\d+(?:\.\d+)?)\b)/g;

    return esc.replace(tokenRegex, (match, key, valWithColon, standaloneStr, literal) => {
      if (key) {
        return `<span class="code-tag">${key}</span>:`;
      }
      if (valWithColon) {
        const val = valWithColon.slice(valWithColon.indexOf(':') + 1).trim();
        return `: <span class="code-value">${val}</span>`;
      }
      if (standaloneStr) {
        return `<span class="code-value">${standaloneStr}</span>`;
      }
      if (literal) {
        return `<span class="code-attr">${literal}</span>`;
      }
      return match;
    });
  }

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
    if (this.code) {
      const formatted = formatCode(this.code, this.language);
      this.code = formatted;
      this.value = formatted;
      this.qInput.emit(formatted);
      this.qChange.emit(formatted);
    }
  };

  private highlight(text: string, language: 'html' | 'javascript' | 'css' | 'json'): string {
    if (!text) return '';
    switch (language) {
      case 'html':
        return this.highlightHtml(text);
      case 'javascript':
        return this.highlightJavascript(text);
      case 'css':
        return this.highlightCss(text);
      case 'json':
        return this.highlightJson(text);
      default:
        return this.escapeHtml(text);
    }
  }

  render() {
    const resolvedHeight = this.height !== undefined ? this.height : (this.variant === 'panel' ? '110px' : 'auto');
    const isScrollable = resolvedHeight !== 'auto' && resolvedHeight !== '';

    const content = this.code !== undefined ? (
      this.editable ? (
        <div class="editor-area" style={{ height: resolvedHeight }}>
          <textarea
            class="editor-textarea"
            value={this.code}
            disabled={this.disabled}
            required={this.required}
            onInput={this.handleInput}
            onChange={this.handleChange}
            onScroll={this.handleScroll}
            onKeyDown={this.handleKeyDown}
          />
          <pre class="code-body" ref={(el) => (this.preEl = el as HTMLPreElement)}>
            <code innerHTML={this.highlight(this.code, this.language)}></code>
          </pre>
        </div>
      ) : (
        <pre class="code-body">
          <code innerHTML={this.highlight(this.code, this.language)}></code>
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
        <Host class={{ 'q-syntax-box-panel': true, 'is-editable': this.editable }}>
          <div class="panel-container">
            <div class="panel-header">
              <span>{this.heading}</span>
              <div class="panel-actions">
                <slot name="actions"></slot>
                {this.editable && (
                  <q-button class="format-btn" variant="ghost" size="sm" onClick={this.handleFormat}>
                    <q-icon slot="icon-left" lib="local" name="sparkles" size="sm"></q-icon>
                    <q-tooltip slot="icon-left" content="Format Code"></q-tooltip>
                  </q-button>
                )}
                {this.copyable && (
                  <q-button variant="ghost" size="sm" onClick={this.copyCode}>
                    <q-icon slot="icon-left" lib="local" name={this.copied ? "check" : "copy"} size="sm"></q-icon>
                    <q-tooltip slot="icon-left" content={this.copied ? "Copied!" : "Copy"}></q-tooltip>
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
      <Host class={{ 'q-syntax-box-plain': true, 'is-editable': this.editable }}>
        <div class="plain-container">
          {bodyContent}
        </div>
      </Host>
    );
  }
}
