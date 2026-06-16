import html from './playground-event-log.html';
import css from './playground-event-log.css';

class PlaygroundEventLog extends HTMLElement {
  private logBody: HTMLElement | null = null;
  private syntaxBox: any = null;
  private handleEventLog?: (e: CustomEvent) => void;

  connectedCallback(): void {
    // 1. Inject template HTML
    this.innerHTML = html;

    // 2. Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'playground-event-log-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css;
      document.head.appendChild(style);
    }

    this.init();
  }

  private init(): void {
    const clearBtn = this.querySelector('#clearLogBtn') as HTMLElement | null;
    this.logBody = this.querySelector('#eventLogBody');
    this.syntaxBox = this.querySelector('#eventLogBox');

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearLog());
    }

    // Bind log listener on window
    this.handleEventLog = (e: CustomEvent) => {
      this.logEvent(e.detail.name, e.detail.detail);
    };

    window.addEventListener('playground:event-dispatched', this.handleEventLog as EventListener);
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
    if (this.handleEventLog) {
      window.removeEventListener('playground:event-dispatched', this.handleEventLog as EventListener);
    }
  }
}

customElements.define('playground-event-log', PlaygroundEventLog);
export { PlaygroundEventLog };
