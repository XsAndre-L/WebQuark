import { h } from '../../dom-factory';
import { resolveExample } from '../../examples/example';
import { mountExample } from '../../examples/mount';
import { ExampleOutput } from './example-output';
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
    const output = new ExampleOutput();
    this.replaceChildren(<div class="variant-title-row"><h4>{this.item.name}</h4>{size}</div>, stage, controls, output.element);
    const example = resolveExample(this.spec, this.item);
    this.preview = mountExample(stage, controls, example, event => output.record(event));
    void output.show(example);
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
