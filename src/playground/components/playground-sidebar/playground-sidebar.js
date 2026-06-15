import { loadComponentResources } from '../loader-helper.js';
import { activeComponent, activeTab, fetchComponentSpec, effect } from '../../state.js';

class PlaygroundSidebar extends HTMLElement {
  async connectedCallback() {
    try {
      // Load HTML template first — this must succeed for anything to render
      const html = await loadComponentResources('playground-sidebar');
      this.innerHTML = html;

      // Load manifest separately so a fetch failure gives a clear error, not a silent empty shell
      try {
        const res = await fetch('/playground/components.manifest.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.components = await res.json();
      } catch (err) {
        console.error('[playground-sidebar] Failed to load components.manifest.json:', err);
        this.components = [];
      }

      this.init();
    } catch (err) {
      console.error('Failed to load sidebar component:', err);
    }
  }

  init() {
    this.navPanel = this.querySelector('#sidebarNav');
    this.globalStylingBtn = this.querySelector('#globalStylingBtn');

    if (!this.navPanel) return;

    // 1. Build items array for q-sidepanel
    this.navPanel.items = this.components.map(comp => ({
      label: comp.name,
      value: comp.tag,
    }));

    // 2. Handle qSelect event from q-sidepanel nav
    this.handleNavSelect = (e) => {
      const { value } = e.detail;
      activeTab.set('sandbox');
      activeComponent.set(value);
      fetchComponentSpec(value);
    };
    this.navPanel.addEventListener('qSelect', this.handleNavSelect);

    // 3. Global Styling button
    if (this.globalStylingBtn) {
      this.globalStylingBtn.addEventListener('click', () => {
        activeComponent.set('global-styling');
      });
    }

    // 4. React to Active Component changes — sync q-sidepanel value prop + global btn
    this.cleanupActiveEffect = effect(() => {
      const active = activeComponent();
      this.navPanel.value = active;

      if (this.globalStylingBtn) {
        this.globalStylingBtn.classList.toggle('active', active === 'global-styling');
      }
    });
  }

  disconnectedCallback() {
    if (this.cleanupActiveEffect) {
      this.cleanupActiveEffect();
    }
    if (this.navPanel && this.handleNavSelect) {
      this.navPanel.removeEventListener('qSelect', this.handleNavSelect);
    }
  }
}

customElements.define('playground-sidebar', PlaygroundSidebar);
export { PlaygroundSidebar };
