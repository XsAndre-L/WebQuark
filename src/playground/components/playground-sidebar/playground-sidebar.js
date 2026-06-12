import { loadComponentResources } from '../loader-helper.js';
import { activeComponent, activeTab, fetchComponentSpec, effect } from '../../state.js';

const COMPONENTS = [
  { tag: 'q-button', name: 'Button' },
  { tag: 'q-toggle', name: 'Toggle' },
  { tag: 'q-card', name: 'Card' },
  { tag: 'q-carousel', name: 'Carousel' },
  { tag: 'q-circular-progress', name: 'Circular Progress' },
  { tag: 'q-dropdown', name: 'Dropdown' },
  { tag: 'q-input', name: 'Input' },
  { tag: 'q-textarea', name: 'Textarea' },
  { tag: 'q-reel', name: 'Reel' },
  { tag: 'q-sidepanel', name: 'Sidepanel' },
  { tag: 'q-step-diagram', name: 'Step Diagram' },
  { tag: 'q-scrollable', name: 'Scrollable' },
  { tag: 'q-icon', name: 'Icon' },
  { tag: 'q-tooltip', name: 'Tooltip' }
];

class PlaygroundSidebar extends HTMLElement {
  async connectedCallback() {
    try {
      const html = await loadComponentResources('playground-sidebar');
      this.innerHTML = html;
      this.init();
    } catch (err) {
      console.error('Failed to load sidebar component:', err);
    }
  }

  init() {
    const nav = this.querySelector('#sidebarNav');
    const globalStylingBtn = this.querySelector('#globalStylingBtn');

    // 1. Render sidebar component navigation links
    nav.innerHTML = '';
    COMPONENTS.forEach(comp => {
      const item = document.createElement('div');
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.className = 'sidebar-item';
      item.dataset.tag = comp.tag;
      item.innerHTML = `
        <span>${comp.name}</span>
        <q-tooltip content="&lt;${comp.tag}&gt;" position="right" delay="100"></q-tooltip>
      `;

      const select = async () => {
        activeTab.set('sandbox'); // Reset to sandbox tab
        await fetchComponentSpec(comp.tag);
        activeComponent.set(comp.tag);
        this.closeMobileSidebar();
      };

      item.addEventListener('click', select);
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      });

      nav.appendChild(item);
    });

    // 2. Global Styling button click listener
    if (globalStylingBtn) {
      const selectGlobal = () => {
        activeComponent.set('global-styling');
        this.closeMobileSidebar();
      };

      globalStylingBtn.addEventListener('click', selectGlobal);
      globalStylingBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectGlobal();
        }
      });
    }

    // 3. React to Active Component changes (Angular-style Signal Effect)
    this.cleanupActiveEffect = effect(() => {
      const active = activeComponent();

      // Update active highlights on sidebar items
      this.querySelectorAll('.sidebar-nav .sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tag === active);
      });

      // Update active highlight on Global Styling footer button
      if (globalStylingBtn) {
        globalStylingBtn.classList.toggle('active', active === 'global-styling');
      }
    });
  }

  closeMobileSidebar() {
    this.classList.remove('open');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) backdrop.classList.remove('active');
    const hamburger = document.getElementById('hamburgerMenu');
    if (hamburger) hamburger.classList.remove('open');
  }

  disconnectedCallback() {
    if (this.cleanupActiveEffect) {
      this.cleanupActiveEffect();
    }
  }
}

customElements.define('playground-sidebar', PlaygroundSidebar);
export { PlaygroundSidebar };
