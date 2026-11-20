import { h } from '../../dom-factory';
import { resolveExample } from '../../examples/example';
import { mountExample } from '../../examples/mount';
import { PlaygroundEventLog } from '../playground-event-log/playground-event-log';
import { PlaygroundCodePreview } from '../playground-code-preview/playground-code-preview';
import type { ComponentSpec, Example } from '../../state';

export class VariantCard extends HTMLElement {
  spec!: ComponentSpec;
  item!: Example;
  private preview?: ReturnType<typeof mountExample>;
  private observer?: ResizeObserver;

  connectedCallback() {
    this.className = 'variant-card';
    const stage = <div class="variant-card-stage" />;
    const controls = <div class="demo-actions" hidden />;
    const size = <span class="example-dimensions" />;
    const log = new PlaygroundEventLog();
    const code = new PlaygroundCodePreview();
    this.replaceChildren(<div class="variant-title-row"><h4>{this.item.name}</h4>{size}</div>, stage, controls, log, code);
    const example = resolveExample(this.spec, this.item);
    this.preview = mountExample(stage, controls, example, event => log.record(event));
    code.show(example);
    customElements.whenDefined(this.spec.tag).then(() => {
      const element = stage.querySelector(this.spec.tag);
      if (!this.isConnected || !element) return;
      this.observer = new ResizeObserver(([entry]) => {
        size.textContent = Math.round(entry.contentRect.width) + ' × ' + Math.round(entry.contentRect.height);
      });
      this.observer.observe(element);
    });
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.preview?.dispose();
  }
}

customElements.define('variant-card', VariantCard);
