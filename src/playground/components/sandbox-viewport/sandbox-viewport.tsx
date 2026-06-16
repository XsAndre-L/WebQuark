import { h } from '../../dom-factory';
import { activeComponent, activeTab, componentRegistry, effect, ComponentSpec } from '../../state';
import './viewport-tabs';
import './sandbox-panel';
import './variant-card';
import css from './sandbox-viewport.css';

function emptyState(msg: string): string {
  return `<div class="grid-empty-state">${msg}</div>`;
}

class SandboxViewport extends HTMLElement {
  private variantsGrid: HTMLElement | null = null;
  private edgecasesGrid: HTMLElement | null = null;
  private cleanupEffect?: () => void;

  connectedCallback() {
    this.innerHTML = '';

    // Render components using custom TSX elements
    this.appendChild(<viewport-tabs></viewport-tabs>);

    this.appendChild(
      <div class="stage-content-wrapper">
        {/* 1. Sandbox */}
        <sandbox-panel class="tab-content active" id="content-sandbox"></sandbox-panel>

        {/* 2. Variants */}
        <div class="tab-content" id="content-variants">
          <q-scrollable height="100%">
            <div class="variants-grid" id="variantsGrid"></div>
          </q-scrollable>
        </div>

        {/* 3. Edge Cases */}
        <div class="tab-content" id="content-edgecases">
          <q-scrollable height="100%">
            <div class="variants-grid" id="edgecasesGrid"></div>
          </q-scrollable>
        </div>

        {/* 4. Global Styling Designer */}
        <div class="tab-content" id="content-global-styling">
          <q-scrollable height="100%">
            <theme-designer></theme-designer>
          </q-scrollable>
        </div>
      </div>
    );

    // Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'sandbox-viewport-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css as any;
      document.head.appendChild(style);
    }

    this.init();
  }

  private init() {
    this.variantsGrid = this.querySelector('#variantsGrid');
    this.edgecasesGrid = this.querySelector('#edgecasesGrid');

    // Centralized Click Event Handler via Event Bubbling
    this.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // A. Close drawer / dialog inside Sandbox Panel
      if (target.id === 'closePanelBtn') {
        const panel = this.querySelector('q-sidepanel') as any;
        if (panel) {
          panel.open = false;
          const registry = componentRegistry();
          if (registry['q-sidepanel'] && registry['q-sidepanel'].props) {
            registry['q-sidepanel'].props.open.currentValue = false;
            componentRegistry.set({ ...registry });
          }
        }
      }
      if (target.id === 'stageOpenPanelBtn') {
        const panel = this.querySelector('q-sidepanel') as any;
        if (panel) {
          panel.open = true;
          const registry = componentRegistry();
          if (registry['q-sidepanel'] && registry['q-sidepanel'].props) {
            registry['q-sidepanel'].props.open.currentValue = true;
            componentRegistry.set({ ...registry });
          }
        }
      }
      if (target.id === 'stageOpenDialogBtn') {
        const dialog = this.querySelector('q-dialog') as any;
        if (dialog) {
          dialog.open = true;
          const registry = componentRegistry();
          if (registry['q-dialog'] && registry['q-dialog'].props) {
            registry['q-dialog'].props.open.currentValue = true;
            componentRegistry.set({ ...registry });
          }
        }
      }

      // B. Trigger overlay buttons inside Variant Cards
      if (target.classList.contains('var-open-panel-btn')) {
        const card = target.closest('.variant-card');
        if (card) {
          const panel = card.querySelector('q-sidepanel') as any;
          if (panel) panel.open = true;
        }
      }
      if (target.classList.contains('var-open-dialog-btn')) {
        const card = target.closest('.variant-card');
        if (card) {
          const dialog = card.querySelector('q-dialog') as any;
          if (dialog) dialog.open = true;
        }
      }
    });

    // Reactive routing & visibility rendering loop
    this.cleanupEffect = effect(() => {
      const active = activeComponent();
      const tab = activeTab();
      const registry = componentRegistry();
      const spec = registry[active];

      this.setAttribute('active-component', active);

      // Toggle tab-content views
      this.querySelectorAll('.stage-content-wrapper > .tab-content').forEach(c => {
        if (active === 'global-styling') {
          c.classList.toggle('active', c.id === 'content-global-styling');
        } else {
          c.classList.toggle('active', c.id === `content-${tab}`);
        }
      });

      // Render grids conditionally based on selected tab
      if (active !== 'global-styling' && spec) {
        if (tab === 'variants') {
          this.renderVariantsMatrix(active, spec);
        } else if (tab === 'edgecases') {
          this.renderEdgeCases(active, spec);
        }
      }
    });
  }

  private renderVariantsMatrix(tag: string, config: ComponentSpec) {
    if (!this.variantsGrid) return;
    this.variantsGrid.innerHTML = '';

    const variants = (config as any).variants;
    if (!variants || variants.length === 0) {
      this.variantsGrid.innerHTML = emptyState('No variant matrix defined for this component.');
      return;
    }

    variants.forEach((variant: any) => {
      const card = document.createElement('variant-card') as any;
      card.tag = tag;
      card.item = variant;
      this.variantsGrid!.appendChild(card);
    });
  }

  private renderEdgeCases(tag: string, config: ComponentSpec) {
    if (!this.edgecasesGrid) return;
    this.edgecasesGrid.innerHTML = '';

    const edgeCases = (config as any).edgeCases;
    if (!edgeCases || edgeCases.length === 0) {
      this.edgecasesGrid.innerHTML = emptyState('No stress-test layout edge cases defined for this component.');
      return;
    }

    edgeCases.forEach((edge: any) => {
      const card = document.createElement('variant-card') as any;
      card.tag = tag;
      card.item = edge;
      this.edgecasesGrid!.appendChild(card);
    });
  }

  disconnectedCallback() {
    if (this.cleanupEffect) {
      this.cleanupEffect();
    }
  }
}

customElements.define('sandbox-viewport', SandboxViewport);
export { SandboxViewport };
