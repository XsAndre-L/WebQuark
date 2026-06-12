import { loadComponentResources } from '../loader-helper.js';
import { activeComponent, componentRegistry, effect, serializeComponentCode } from '../../state.js';

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
    this.codeBlockBox = this.querySelector('#codeBlockBox');

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
    if (!this.codeBlockBox || !config) return;
    const appendScript = (tag === 'q-dropdown' && config.options)
      ? `\n\n<!-- Programmatic dropdown options population script -->\n<script>\n  const dropdown = document.querySelector('${tag}');\n  dropdown.options = ${JSON.stringify(config.options, null, 2).replace(/\n/g, '\n  ')};\n</script>`
      : null;
    this.codeBlockBox.code = serializeComponentCode(tag, config.props, config.slots, appendScript);
  }

  disconnectedCallback() {
    if (this.cleanupCodeEffect) {
      this.cleanupCodeEffect();
    }
  }
}

customElements.define('playground-code-preview', PlaygroundCodePreview);
export { PlaygroundCodePreview };
