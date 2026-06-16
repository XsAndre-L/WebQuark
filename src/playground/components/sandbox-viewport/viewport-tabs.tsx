import { h } from '../../dom-factory';
import { activeComponent, activeTab, effect } from '../../state';

export class ViewportTabs extends HTMLElement {
  private cleanupEffect?: () => void;

  connectedCallback() {
    this.innerHTML = '';
    
    this.appendChild(
      <div class="tabs-bar" id="tabsBar">
        <div class="tab-buttons">
          <button class="tab-btn" data-tab="sandbox">Sandbox</button>
          <button class="tab-btn" data-tab="variants">Variants</button>
          <button class="tab-btn" data-tab="edgecases">Edge Cases</button>
        </div>
        <div class="active-component-badge" id="activeCompBadge">q-button</div>
      </div>
    );

    const tabsBar = this.querySelector('#tabsBar') as HTMLElement;
    const activeCompBadge = this.querySelector('#activeCompBadge') as HTMLElement;
    const tabBtns = this.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextTab = (btn as HTMLElement).dataset.tab;
        if (nextTab) {
          activeTab.set(nextTab);
        }
      });
    });

    this.cleanupEffect = effect(() => {
      const active = activeComponent();
      const tab = activeTab();

      if (activeCompBadge) {
        activeCompBadge.innerText = active === 'global-styling' ? 'Global Styling' : active;
      }

      if (tabsBar) {
        tabsBar.style.display = active === 'global-styling' ? 'none' : '';
      }

      tabBtns.forEach(btn => {
        btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === tab);
      });
    });
  }

  disconnectedCallback() {
    if (this.cleanupEffect) {
      this.cleanupEffect();
    }
  }
}

customElements.define('viewport-tabs', ViewportTabs);
