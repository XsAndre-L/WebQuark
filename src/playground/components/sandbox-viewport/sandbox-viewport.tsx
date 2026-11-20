import { h } from '../../dom-factory';
import { activeComponent, activeTab, componentRegistry, effect, fetchComponentSpec, specErrors } from '../../state';
import { VariantCard } from './variant-card';
import { viewportTabs } from './viewport-tabs';
import './sandbox-panel';
import css from './sandbox-viewport.css';

class SandboxViewport extends HTMLElement {
  private cleanup?: () => void;

  connectedCallback() {
    if (!document.getElementById('sandbox-viewport-style')) {
      const style = document.createElement('style');
      style.id = 'sandbox-viewport-style';
      style.textContent = css;
      document.head.append(style);
    }

    const panels = new Map(viewportTabs.map(({ value, panelId, label }) => [
      value,
      <div id={panelId} class="stage-content-wrapper" role="tabpanel" aria-label={label} tabIndex={0} hidden />,
    ]));
    panels.set('global-styling', <div id="content-global-styling" class="stage-content-wrapper" hidden />);
    this.replaceChildren(<viewport-tabs />, ...panels.values());
    let route = '';
    let displayedSpec: unknown;
    let displayedError = '';

    this.cleanup = effect(() => {
      const tag = activeComponent();
      const tab = tag === 'global-styling' ? tag : activeTab();
      const next = tag + '/' + tab;
      const spec = componentRegistry()[tag];
      const error = specErrors()[tag];
      if (route === next && (tab === 'sandbox' || (spec === displayedSpec && error === displayedError))) return;
      route = next;
      displayedSpec = spec;
      displayedError = error;
      this.setAttribute('active-component', tag);

      let content: HTMLElement;
      if (tab === 'sandbox') content = document.createElement('sandbox-panel');
      else if (tab === 'global-styling') content = <div><q-scrollable height="100%"><theme-designer /></q-scrollable></div>;
      else {
        const grid = <div class="variants-grid" />;
        content = <div><q-scrollable height="100%">{grid}</q-scrollable></div>;
        const examples = tab === 'variants' ? spec?.variants : spec?.edgeCases;
        if (!spec) {
          grid.textContent = error ? 'Could not load ' + tag + '. ' : 'Loading…';
          if (error) grid.append(<q-button type="button" size="sm" onClick={() => fetchComponentSpec(tag)}>Retry</q-button>);
        } else if (examples?.length) {
          for (const item of examples) {
            const card = new VariantCard();
            card.spec = spec;
            card.item = item;
            grid.append(card);
          }
        } else grid.textContent = tab === 'variants' ? 'No variants defined.' : 'No edge cases defined.';
      }

      content.className = 'tab-content active';
      for (const [view, panel] of panels) {
        panel.hidden = view !== tab;
        if (view === tab) panel.replaceChildren(content);
        else if (panel.hasChildNodes()) panel.replaceChildren();
      }
    });
  }

  disconnectedCallback() { this.cleanup?.(); }
}

customElements.define('sandbox-viewport', SandboxViewport);
