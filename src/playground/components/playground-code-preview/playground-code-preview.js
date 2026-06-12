import { loadComponentResources } from '../loader-helper.js';
import { activeComponent, componentRegistry, effect } from '../../state.js';

function highlightHTML(htmlText) {
  let esc = htmlText;
  if (!esc.includes('&lt;')) {
    esc = esc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return (
    esc
      // Match comments
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="code-comment">$1</span>')
      // Match attribute value strings
      .replace(/(&quot;.*?&quot;)/gi, '<span class="code-value">$1</span>')
      .replace(/(&#39;.*?&#39;)/gi, '<span class="code-value">$1</span>')
      // Match attribute parameters
      .replace(/(\s[a-z0-9-]+)=/gi, ' <span class="code-attr">$1</span>=')
      // Match tag elements
      .replace(/(&lt;\/?[a-z0-9-]+)/gi, '<span class="code-tag">$1</span>')
      // Match close brackets
      .replace(/(&gt;)/g, '<span class="code-tag">&gt;</span>')
  );
}

class PlaygroundCodePreview extends HTMLElement {
  async connectedCallback() {
    try {
      const html = await loadComponentResources('playground-code-preview');
      this.innerHTML = html;
      this.init();
    } catch (err) {
      console.error('Failed to load code preview component:', err);
    }
  }

  init() {
    const copyBtn = this.querySelector('#copyBtn');
    this.codeBlock = this.querySelector('#codeBlock');

    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyCode());
    }

    // React to spec value modifications (Angular-style Signal Effect)
    this.cleanupCodeEffect = effect(() => {
      const active = activeComponent();
      const registry = componentRegistry();
      const config = registry[active];

      if (config) {
        this.updateCodeBlock(active, config);
      }
    });
  }

  updateCodeBlock(tag, config) {
    if (!this.codeBlock || !config) return;

    let code = `<${tag}`;

    // 1. Attributes
    if (config.props) {
      Object.keys(config.props).forEach(propName => {
        const prop = config.props[propName];
        const val = prop.currentValue;
        if (prop.type === 'boolean') {
          if (val) code += ` ${propName}`;
        } else {
          if (val !== undefined && val !== null && val !== '') {
            code += ` ${propName}="${val}"`;
          }
        }
      });
    }

    code += '>';

    // 2. Slots
    let slotContent = '';
    if (config.slots) {
      Object.keys(config.slots).forEach(slotName => {
        const slot = config.slots[slotName];
        const content = slot.currentValue;
        if (content) {
          if (slotName === 'default') {
            slotContent += `\n  ${content.replace(/\n/g, '\n  ')}\n`;
          } else {
            slotContent += `\n  <span slot="${slotName}">${content.replace(/\n/g, '\n  ')}</span>\n`;
          }
        }
      });
    }

    if (slotContent) {
      code += slotContent + `</${tag}>`;
    } else {
      code += `</${tag}>`;
    }

    // Programmatic options population representation for q-dropdown
    if (tag === 'q-dropdown') {
      const optsJson = JSON.stringify(config.options, null, 2);
      code += `\n\n&lt;!-- Programmatic dropdown options population script --&gt;\n&lt;script&gt;\n  const dropdown = document.querySelector('q-dropdown');\n  dropdown.options = ${optsJson.replace(/\n/g, '\n  ')};\n&lt;/script&gt;`;
    }

    this.codeBlock.innerHTML = highlightHTML(code);
  }

  copyCode() {
    if (!this.codeBlock) return;
    const codeText = this.codeBlock.innerText;
    navigator.clipboard.writeText(codeText).then(() => {
      const copyBtn = this.querySelector('#copyBtn');
      if (copyBtn) {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 1500);
      }
    });
  }

  disconnectedCallback() {
    if (this.cleanupCodeEffect) {
      this.cleanupCodeEffect();
    }
  }
}

customElements.define('playground-code-preview', PlaygroundCodePreview);
export { PlaygroundCodePreview };
