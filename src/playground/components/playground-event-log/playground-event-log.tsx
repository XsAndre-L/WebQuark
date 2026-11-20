import { h } from '../../dom-factory';
import type { ExampleEvent } from '../../examples/mount';
import css from './playground-event-log.css';

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

export class PlaygroundEventLog extends HTMLElement {
  private lines = document.createElement('div');

  connectedCallback() {
    if (!document.getElementById('event-log-style')) {
      const style = document.createElement('style');
      style.id = 'event-log-style';
      style.textContent = css;
      document.head.append(style);
    }
    this.lines.className = 'event-log-body';
    this.lines.setAttribute('aria-label', 'Example events');
    this.clear();
    this.replaceChildren(
      <q-syntax-box variant="panel" heading="Events" height="95px">
        <q-button slot="actions" variant="ghost" size="sm" aria-label="Clear event log" onClick={() => this.clear()}>Clear</q-button>
        {this.lines}
      </q-syntax-box>
    );
  }

  clear() {
    const empty = document.createElement('span');
    empty.className = 'log-placeholder';
    empty.textContent = 'Interact with the example to see its events.';
    this.lines.replaceChildren(empty);
  }

  record({source, name, detail}: ExampleEvent) {
    this.lines.querySelector('.log-placeholder')?.remove();
    const line = document.createElement('div');
    line.className = 'log-item';
    line.textContent = source + ' · ' + name + (detail === undefined ? '' : ' ' + readableDetail(detail));
    this.lines.append(line);
    if (this.lines.childElementCount > 100) this.lines.firstElementChild?.remove();
    void this.querySelector('q-syntax-box')?.scrollToBottom?.();
  }
}

customElements.define('playground-event-log', PlaygroundEventLog);
