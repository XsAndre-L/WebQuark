import { h } from '../../dom-factory';
import { activeComponent, componentRegistry, effect, serializeComponentCode, ComponentSpec } from '../../state';
import css from './playground-code-preview.css';

class PlaygroundCodePreview extends HTMLElement {
  private codeBlockBox: any = null;
  private cleanupCodeEffect?: () => void;

  connectedCallback(): void {
    // 1. Render template via TSX
    this.innerHTML = '';
    this.appendChild(
      <q-syntax-box variant="panel" heading="LIVE RENDER MARKUP" copyable="true" id="codeBlockBox">
      </q-syntax-box>
    );

    // 2. Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'playground-code-preview-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css as any;
      document.head.appendChild(style);
    }

    this.init();
  }

  private init(): void {
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

  private updateCodeBlock(tag: string, config: ComponentSpec): void {
    if (!this.codeBlockBox || !config) return;
    const appendScript = (tag === 'q-dropdown' && config.options)
      ? `\n\n<!-- Programmatic dropdown options population script -->\n<script>\n  const dropdown = document.querySelector('${tag}');\n  dropdown.options = ${JSON.stringify(config.options, null, 2).replace(/\n/g, '\n  ')};\n</script>`
      : null;
    this.codeBlockBox.code = serializeComponentCode(tag, config.props, config.slots, appendScript);
  }

  disconnectedCallback(): void {
    if (this.cleanupCodeEffect) {
      this.cleanupCodeEffect();
    }
  }
}

customElements.define('playground-code-preview', PlaygroundCodePreview);
export { PlaygroundCodePreview };
