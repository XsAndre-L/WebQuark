import { h } from '../../dom-factory';
import { snippet } from '../../examples/snippet';
import type { ResolvedExample } from '../../examples/example';

export class PlaygroundCodePreview extends HTMLElement {
  private revision = 0;
  private box = <q-syntax-box variant="panel" heading="Example HTML" copyable={true} /> as HTMLQSyntaxBoxElement;

  connectedCallback() {
    this.replaceChildren(this.box);
  }

  async show(example: ResolvedExample) {
    const revision = ++this.revision;
    try {
      const code = await snippet(example);
      if (revision === this.revision) this.box.code = code;
    } catch (error) {
      if (revision === this.revision) this.box.code = 'Example unavailable: ' + String(error);
    }
  }
}

customElements.define('playground-code-preview', PlaygroundCodePreview);
