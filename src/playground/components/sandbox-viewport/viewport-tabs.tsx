import { h } from '../../dom-factory';
import { activeComponent, activeTab, effect } from '../../state';

export const viewportTabs = [
  { value: 'sandbox', label: 'Sandbox', tabId: 'tab-sandbox', panelId: 'content-sandbox' },
  { value: 'variants', label: 'Variants', tabId: 'tab-variants', panelId: 'content-variants' },
  { value: 'edgecases', label: 'Edge Cases', tabId: 'tab-edgecases', panelId: 'content-edgecases' },
];

export class ViewportTabs extends HTMLElement {
  private cleanupEffect?: () => void;

  connectedCallback(): void {
    const selector = Object.assign(
      <q-tabs aria-label="Example views" onQChange={(event: CustomEvent<string>) => activeTab.set(event.detail)} />,
      { items: viewportTabs },
    ) as HTMLQTabsElement;
    const badge = <div class="active-component-badge" />;
    const bar = <div class="tabs-bar">{selector}{badge}</div>;
    this.replaceChildren(bar);
    void this.linkPanels(selector);

    this.cleanupEffect = effect(() => {
      const active = activeComponent();
      const tab = activeTab();
      bar.style.display = active === 'global-styling' ? 'none' : '';
      badge.textContent = active;
      selector.value = tab;
    });
  }

  private async linkPanels(selector: HTMLQTabsElement): Promise<void> {
    if (!('ariaControlsElements' in Element.prototype)) return;
    await customElements.whenDefined('q-tabs');
    await selector.componentOnReady();
    if (!selector.isConnected) return;

    for (const { tabId, panelId } of viewportTabs) {
      const tab = selector.shadowRoot?.getElementById(tabId);
      const panel = document.getElementById(panelId);
      if (tab && panel) tab.ariaControlsElements = [panel];
    }
  }

  disconnectedCallback(): void {
    this.cleanupEffect?.();
  }
}

customElements.define('viewport-tabs', ViewportTabs);
