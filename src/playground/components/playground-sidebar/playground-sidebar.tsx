import { h } from '../../dom-factory';
import { activeComponent, activeTab, fetchComponentSpec, effect } from '../../state';
import { setButtonState } from '../button-accessibility';
import css from './playground-sidebar.css';

interface ComponentManifestItem {
  category: string;
  name: string;
  tag: string;
}

interface SidebarNavItem {
  label: string;
  value: string;
  children?: SidebarNavItem[];
}

const CATEGORY_LABELS: Record<string, string> = {
  actions: 'Actions',
  communication: 'Communication',
  content: 'Content',
  'data-display': 'Data display',
  inputs: 'Forms & inputs',
  indicators: 'Indicators',
  layout: 'Layout',
  media: 'Media',
  overlays: 'Overlays',
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

class PlaygroundSidebar extends HTMLElement {
  private components: ComponentManifestItem[] = [];
  private navPanel: any = null;
  private globalStylingBtn: HTMLQButtonElement | null = null;
  private handleNavSelect?: (e: CustomEvent) => void;
  private cleanupActiveEffect?: () => void;

  private request?: AbortController;

  async connectedCallback(): Promise<void> {
    this.request?.abort();
    const request = this.request = new AbortController();
    let loadFailed = false;
    try {
      const res = await fetch('/playground/components.manifest.json', { signal: request.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.components = (await res.json()) as ComponentManifestItem[];
    } catch (err) {
      if (request.signal.aborted) return;
      loadFailed = true;
      console.error('[playground-sidebar] Failed to load components.manifest.json:', err);
      this.components = [];
    }

    if (request.signal.aborted || !this.isConnected) return;
    this.innerHTML = '';
    this.appendChild(
      <q-sidepanel id="sidebarNav" aria-label="Component navigation" variant="nav" mode="tree">
        <div slot="footer" class="sidebar-footer-actions">
          {loadFailed && <div role="status">Component list could not load. <q-button type="button" size="sm" onClick={() => {
            this.disconnectedCallback();
            void this.connectedCallback();
          }}>Retry</q-button></div>}
          <q-button
            id="globalStylingBtn"
            variant="primary"
            expand
            type="button"
            onClick={() => {
              activeComponent.set('global-styling');
              this.dispatchEvent(new Event('playground-navigation', { bubbles: true }));
            }}
          >
            <q-icon slot="icon-left" name="globe" library="lucide" size="16"></q-icon>
            Global Styling
          </q-button>
          <q-button variant="primary" expand href="./views/tooling/tooling.html">
            <q-icon slot="icon-left" name="file-text" library="lucide" size="16"></q-icon>
            Changelog Tooling
          </q-button>
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

    this.navPanel.items = this.buildNavItems();

    // 2. Handle qSelect event from q-sidepanel nav
    this.handleNavSelect = (e: CustomEvent) => {
      const { value } = e.detail;
      activeTab.set('sandbox');
      activeComponent.set(value);
      void fetchComponentSpec(value);
      this.dispatchEvent(new Event('playground-navigation', { bubbles: true }));
    };
    this.navPanel.addEventListener('qSelect', this.handleNavSelect as EventListener);

    // 3. React to Active Component changes — sync q-sidepanel value prop + global btn
    this.cleanupActiveEffect = effect(() => {
      const active = activeComponent();
      if (this.navPanel) {
        this.navPanel.value = active;
      }

      if (this.globalStylingBtn) {
        void setButtonState(this.globalStylingBtn, 'aria-pressed', active === 'global-styling');
      }
    });
  }

  private buildNavItems(): SidebarNavItem[] {
    const grouped = new Map<string, ComponentManifestItem[]>();

    this.components.forEach(component => {
      const category = component.category || 'other';
      const components = grouped.get(category) ?? [];
      components.push(component);
      grouped.set(category, components);
    });

    const orderedCategories = [
      ...CATEGORY_ORDER,
      ...Array.from(grouped.keys()).filter(category => !CATEGORY_LABELS[category]).sort(),
    ];

    return orderedCategories
      .filter(category => grouped.has(category))
      .map(category => ({
        label: CATEGORY_LABELS[category] ?? this.toTitleCase(category),
        value: `category:${category}`,
        children: grouped.get(category)!.map(component => ({
          label: component.name,
          value: component.tag,
        })),
      }));
  }

  private toTitleCase(value: string): string {
    return value
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  disconnectedCallback(): void {
    this.request?.abort();
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
