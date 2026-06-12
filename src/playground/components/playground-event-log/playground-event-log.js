import { loadComponentResources } from '../loader-helper.js';

class PlaygroundEventLog extends HTMLElement {
  async connectedCallback() {
    try {
      const html = await loadComponentResources('playground-event-log');
      this.innerHTML = html;
      this.init();
    } catch (err) {
      console.error('Failed to load event log component:', err);
    }
  }

  init() {
    const clearBtn = this.querySelector('#clearLogBtn');
    this.logBody = this.querySelector('#eventLogBody');
    this.scrollable = this.querySelector('#eventLogScrollable');

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearLog());
    }

    // Bind log listener on window
    this.handleEventLog = (e) => {
      this.logEvent(e.detail.name, e.detail.detail);
    };

    window.addEventListener('playground:event-dispatched', this.handleEventLog);
  }

  logEvent(name, detail) {
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

    // Scroll to bottom
    if (this.scrollable && typeof this.scrollable.scrollToBottom === 'function') {
      this.scrollable.scrollToBottom();
    }
  }

  clearLog() {
    if (this.logBody) {
      this.logBody.innerHTML = '<span class="log-placeholder">Interactive events will appear here in real-time...</span>';
    }
  }

  disconnectedCallback() {
    window.removeEventListener('playground:event-dispatched', this.handleEventLog);
  }
}

customElements.define('playground-event-log', PlaygroundEventLog);
export { PlaygroundEventLog };
