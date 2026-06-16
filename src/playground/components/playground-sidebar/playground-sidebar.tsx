import { h } from '../../dom-factory';
import { activeComponent, activeTab, fetchComponentSpec, effect } from '../../state';
import css from './playground-sidebar.css';

interface ComponentManifestItem {
  name: string;
  tag: string;
}

class PlaygroundSidebar extends HTMLElement {
  private components: ComponentManifestItem[] = [];
  private navPanel: any = null;
  private globalStylingBtn: HTMLElement | null = null;
  private handleNavSelect?: (e: CustomEvent) => void;
  private cleanupActiveEffect?: () => void;

  async connectedCallback(): Promise<void> {
    // Load manifest
    try {
      const res = await fetch('/playground/components.manifest.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.components = (await res.json()) as ComponentManifestItem[];
    } catch (err) {
      console.error('[playground-sidebar] Failed to load components.manifest.json:', err);
      this.components = [];
    }

    // Render template via TSX
    this.innerHTML = '';
    this.appendChild(
      <q-sidepanel id="sidebarNav" variant="nav" mode="flat">
        <div slot="footer">
          <button
            id="globalStylingBtn"
            class="global-styling-btn"
            type="button"
            onClick={() => activeComponent.set('global-styling')}
          >
            <q-icon name="globe" lib="lucide" size="16"></q-icon>
            <span>Global Styling</span>
          </button>
        </div>
      </q-sidepanel>
    );

    // Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'playground-sidebar-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css as any;
      document.head.appendChild(style);
    }

    this.init();
  }

  private init(): void {
    this.navPanel = this.querySelector('#sidebarNav');
    this.globalStylingBtn = this.querySelector('#globalStylingBtn');

    if (!this.navPanel) return;

    // 1. Build items array for q-sidepanel
    this.navPanel.items = this.components.map(comp => ({
      label: comp.name,
      value: comp.tag,
    }));

    // 2. Handle qSelect event from q-sidepanel nav
    this.handleNavSelect = (e: CustomEvent) => {
      const { value } = e.detail;
      activeTab.set('sandbox');
      activeComponent.set(value);
      fetchComponentSpec(value);
    };
    this.navPanel.addEventListener('qSelect', this.handleNavSelect as EventListener);

    // 3. React to Active Component changes — sync q-sidepanel value prop + global btn
    this.cleanupActiveEffect = effect(() => {
      const active = activeComponent();
      if (this.navPanel) {
        this.navPanel.value = active;
      }

      if (this.globalStylingBtn) {
        this.globalStylingBtn.classList.toggle('active', active === 'global-styling');
      }
    });
  }

  disconnectedCallback(): void {
    if (this.cleanupActiveEffect) {
      this.cleanupActiveEffect();
    }
    if (this.navPanel && this.handleNavSelect) {
      this.navPanel.removeEventListener('qSelect', this.handleNavSelect as EventListener);
    }
  }
}

customElements.define('playground-sidebar', PlaygroundSidebar);
export { PlaygroundSidebar };
