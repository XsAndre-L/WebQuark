import { h } from '../../dom-factory';
import type { ResolvedExample } from '../../examples/example';
import type { ExampleEvent } from '../../examples/mount';
import { snippet } from '../../examples/snippet';

interface ExampleOutputOptions {
  contentHeight?: string;
  formatHtml?: (source: string) => Promise<string>;
}

function readableDetail(value: unknown) {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, item) => {
    if (item instanceof Element) return item.localName;
    if (item instanceof Event) return item.type;
    if (item instanceof FormData) return Array.from(item.entries());
    if (typeof item === 'bigint') return String(item);
    if (item && typeof item === 'object') {
      if (seen.has(item)) return '[reference]';
      seen.add(item);
    }
    return item;
  });
}

export class ExampleOutput {
  private readonly placeholder = <em>Interact with the example to see its events.</em>;
  private readonly lines = <q-stack gap="xs" role="log" aria-label="Example events">{this.placeholder}</q-stack>;
  private readonly htmlView = <q-syntax-view view-key="html" heading="Example HTML" code="" copyable /> as HTMLQSyntaxViewElement;
  private readonly eventsView = (
    <q-syntax-view view-key="events" heading="Events">
      <q-button slot="actions" type="button" variant="ghost" size="sm" aria-label="Clear event log" onClick={() => this.clearEvents()}>
        Clear
      </q-button>
      {this.lines}
    </q-syntax-view>
  ) as HTMLQSyntaxViewElement;

  readonly element = <q-syntax-box heading="Example output">{this.htmlView}{this.eventsView}</q-syntax-box>;
  private revision = 0;
  private formatted?: { source: string; result: Promise<string> };

  constructor(private readonly options: ExampleOutputOptions = {}) {
    const { contentHeight } = options;
    if (contentHeight) {
      this.htmlView.setAttribute('height', contentHeight);
      this.eventsView.setAttribute('height', contentHeight);
    }
  }

  async show(example: ResolvedExample) {
    const revision = ++this.revision;
    let code: string;
    try {
      const source = await snippet(example);
      if (revision !== this.revision || !this.element.isConnected) return;
      code = await this.formatSnippet(source);
    } catch (error) {
      code = 'Example unavailable: ' + String(error);
    }

    await customElements.whenDefined('q-syntax-view');
    if (revision === this.revision && this.element.isConnected) this.htmlView.code = code;
  }

  record({ source, name, detail }: ExampleEvent) {
    this.placeholder.remove();
    const line = document.createElement('div');
    line.textContent = source + ' · ' + name + (detail === undefined ? '' : ' ' + readableDetail(detail));
    this.lines.append(line);
    if (this.lines.childElementCount > 100) this.lines.firstElementChild?.remove();
    void this.eventsView.scrollToBottom?.();
  }

  reset() {
    this.revision++;
    this.formatted = undefined;
    if (customElements.get('q-syntax-view')) this.htmlView.code = '';
    this.clearEvents();
  }

  private formatSnippet(source: string): string | Promise<string> {
    const { formatHtml } = this.options;
    if (!formatHtml) return source;

    if (this.formatted?.source !== source) {
      this.formatted = { source, result: formatHtml(source).catch(() => source) };
    }
    return this.formatted.result;
  }

  private clearEvents() {
    this.lines.replaceChildren(this.placeholder);
  }
}
