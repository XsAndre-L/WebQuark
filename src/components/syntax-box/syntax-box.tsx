import { Component, Prop, Element, State, Method, Host, h } from '@stencil/core';

@Component({
  tag: 'q-syntax-box',
  styleUrl: 'syntax-box.css',
  shadow: true,
})
export class QSyntaxBox {
  @Element() el!: HTMLElement;

  @Prop() variant: 'panel' | 'plain' = 'panel';
  @Prop() language: 'html' | 'javascript' | 'css' | 'json' = 'html';
  @Prop() code?: string;
  @Prop() heading?: string;
  @Prop() copyable: boolean = false;
  @Prop() height?: string;

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
      <pre class="code-body">
        <code innerHTML={this.highlight(this.code, this.language)}></code>
      </pre>
    ) : (
      <slot></slot>
    );

    const bodyContent = isScrollable ? (
      <q-scrollable height={resolvedHeight} ref={(el) => (this.scrollableEl = el)}>
        {content}
      </q-scrollable>
    ) : (
      content
    );

    if (this.variant === 'panel') {
      return (
        <Host class="q-syntax-box-panel">
          <div class="panel-container">
            <div class="panel-header">
              <span>{this.heading}</span>
              <div class="panel-actions">
                <slot name="actions"></slot>
                {this.copyable && (
                  <q-button variant="ghost" size="sm" onClick={this.copyCode}>
                    <q-icon name={this.copied ? "check" : "copy"} size="sm"></q-icon>
                    <q-tooltip content={this.copied ? "Copied!" : "Copy"}></q-tooltip>
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
      <Host class="q-syntax-box-plain">
        <div class="plain-container">
          {bodyContent}
        </div>
      </Host>
    );
  }
}
