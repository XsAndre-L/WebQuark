import { h } from '../../dom-factory';
import { playgroundBus } from '../../events';
import css from './playground-event-log.css';

class PlaygroundEventLog extends HTMLElement {
  private logBody: HTMLElement | null = null;
  private syntaxBox: any = null;
  private unsubscribeBus?: () => void;

  connectedCallback(): void {
    // 1. Render template via TSX
    this.innerHTML = '';
    this.appendChild(
      <q-syntax-box variant="panel" heading="Event Dispatches Log" id="eventLogBox">
        <q-button slot="actions" variant="ghost" size="sm" id="clearLogBtn" onClick={() => this.clearLog()}>
          <q-icon slot="icon-left" lib="local" name="trash-2" size="sm"></q-icon>
          <q-tooltip slot="icon-left" position="bottom" content="Clear Log"></q-tooltip>
        </q-button>
        <div id="eventLogBody" class="event-log-body">
          <span class="log-placeholder">Interactive events will appear here in real-time...</span>
        </div>
      </q-syntax-box>
    );

    // 2. Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'playground-event-log-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css as any;
      document.head.appendChild(style);
    }

    this.init();
  }

  private init(): void {
    this.logBody = this.querySelector('#eventLogBody');
    this.syntaxBox = this.querySelector('#eventLogBox');

    // Bind log listener via typed event bus
    this.unsubscribeBus = playgroundBus.on('event-dispatched', data => {
      this.logEvent(data.name, data.detail);
    });
  }

  private logEvent(name: string, detail: any): void {
    if (!this.logBody) return;

    const placeholder = this.logBody.querySelector('.log-placeholder');
    if (placeholder) placeholder.remove();

    const now = new Date();
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const timeStr = now.toTimeString().split(' ')[0] + '.' + ms;

    const line = document.createElement('div');
    line.className = 'log-item';
    line.innerHTML = `
      <span class="log-item-time">[${timeStr}]</span>
      <strong>${name}</strong>: ${detail !== undefined ? JSON.stringify(detail) : '<em>(void detail)</em>'}
    `;

    this.logBody.appendChild(line);

    // Scroll to bottom using q-syntax-box scrollToBottom method
    if (this.syntaxBox && typeof this.syntaxBox.scrollToBottom === 'function') {
      this.syntaxBox.scrollToBottom();
    }
  }

  private clearLog(): void {
    if (this.logBody) {
      this.logBody.innerHTML = '<span class="log-placeholder">Interactive events will appear here in real-time...</span>';
    }
  }

  disconnectedCallback(): void {
    if (this.unsubscribeBus) {
      this.unsubscribeBus();
    }
  }
}

customElements.define('playground-event-log', PlaygroundEventLog);
export { PlaygroundEventLog };
