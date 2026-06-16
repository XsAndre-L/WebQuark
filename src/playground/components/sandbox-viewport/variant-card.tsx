import { h } from '../../dom-factory';
import { serializeComponentCode, componentRegistry } from '../../state';
import { ElementWithHelpers, setElementProperties } from '../../utils';

export class VariantCard extends HTMLElement {
  public tag?: string;
  public item?: any;
  private resizeObserver?: ResizeObserver;

  connectedCallback() {
    if (!this.tag || !this.item) return;
    const tag = this.tag;
    const item = this.item;

    const registry = componentRegistry();
    const config = registry[tag];
    if (!config) return;

    this.className = 'variant-card';
    this.innerHTML = '';

    const titleRow = (
      <div class="variant-title-row">
        <h4 class="variant-card-title">{item.name}</h4>
      </div>
    );
    this.appendChild(titleRow);

    const stage = (
      <div class="variant-card-stage">
        <span class="variant-card-dimensions">0px &times; 0px</span>
      </div>
    ) as HTMLElement;

    const el = document.createElement(tag) as ElementWithHelpers;
    setElementProperties(el, item.props);

    const defaultSlot = item.slot !== undefined ? item.slot : config.slots?.default?.default || '';
    if (defaultSlot !== undefined && defaultSlot !== '') {
      el.innerHTML = defaultSlot;
    }
    if (item.slots) {
      Object.keys(item.slots).forEach(slotName => {
        const wrapper = document.createElement('span');
        wrapper.setAttribute('slot', slotName);
        wrapper.innerHTML = item.slots[slotName];
        el.appendChild(wrapper);
      });
    } else if (config.slots) {
      Object.keys(config.slots).forEach(slotName => {
        if (slotName !== 'default' && config.slots[slotName].default) {
          const wrapper = document.createElement('span');
          wrapper.setAttribute('slot', slotName);
          wrapper.innerHTML = config.slots[slotName].default;
          el.appendChild(wrapper);
        }
      });
    }

    stage.appendChild(el);
    this.appendChild(stage);

    const dimensionsBadge = stage.querySelector('.variant-card-dimensions') as HTMLElement;
    if (typeof ResizeObserver !== 'undefined' && dimensionsBadge) {
      this.resizeObserver = new ResizeObserver(() => {
        const rect = el.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        dimensionsBadge.innerText = `${width}px × ${height}px`;
      });
      this.resizeObserver.observe(el);
    }

    if (config.options) {
      el.options = config.options;
    }

    if (tag === 'q-sidepanel') {
      const btn = (
        <q-button variant="secondary" size="sm" class="var-open-panel-btn">Trigger Drawer Panel</q-button>
      );
      this.appendChild(btn);
    }
    if (tag === 'q-dialog') {
      const btn = (
        <q-button variant="secondary" size="sm" class="var-open-dialog-btn">Trigger Dialog Overlay</q-button>
      );
      this.appendChild(btn);
    }

    const slots: Record<string, string> = { default: defaultSlot };
    if (item.slots) {
      Object.assign(slots, item.slots);
    }

    const appendScript = (tag === 'q-dropdown' && config.options)
      ? `\n\n<!-- Programmatic dropdown options population script -->\n<script>\n  const dropdown = document.querySelector('q-dropdown');\n  dropdown.options = ${JSON.stringify(config.options, null, 2).replace(/\n/g, '\n  ')};\n</script>`
      : null;
    const codeText = serializeComponentCode(tag, item.props, slots, appendScript);
    
    const syntaxBox = (
      <q-syntax-box variant="plain" code={codeText} class="variant-card-code" />
    );
    this.appendChild(syntaxBox);
  }

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

customElements.define('variant-card', VariantCard);
