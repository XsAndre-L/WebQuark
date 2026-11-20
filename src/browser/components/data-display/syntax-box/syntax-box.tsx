import { AttachInternals, Component, Element, Host, Mixin, forceUpdate, h } from '@stencil/core';

import type { TabItem } from '../../layout/tabs/tabs.types';
import { hasSlottedSource, syntaxBoxes, syntaxScrollRestorers, syntaxVisibility } from './internals/views';
import { withSyntaxContent } from './syntax-content';
import type { QSyntaxBoxVariant } from './syntax-box.types';

interface SyntaxView {
  element: HTMLElement;
  key?: string;
  tab: TabItem;
}

let nextBox = 0;

/**
 * Displays syntax-highlighted content and automatically adds tabs for multiple views.
 * @slot - Read-only fallback content or direct q-syntax-view children.
 * @slot actions - Additional actions for the box's own view.
 */
@Component({
  tag: 'q-syntax-box',
  styleUrl: 'syntax-box.css',
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class QSyntaxBox extends Mixin(withSyntaxContent) {
  @Element() declare el: HTMLElement;
  @AttachInternals() declare internals: ElementInternals;

  private readonly instanceId = `q-syntax-box-${++nextBox}`;
  private readonly identities = new WeakMap<HTMLElement, string>();
  private nextView = 0;
  private views: SyntaxView[] = [];
  private selected?: HTMLElement;
  private observer?: MutationObserver;
  private tabSelector?: HTMLQTabsElement;
  private focusWithin = false;
  private restoreFocus = false;
  private activeVariant?: QSyntaxBoxVariant;
  private linkFrame?: number;

  connectedCallback() {
    syntaxBoxes.set(this.el, this);
    this.el.addEventListener('focusin', this.onFocusIn);
    this.el.addEventListener('focusout', this.onFocusOut);
    this.observer = new MutationObserver(changes => {
      const changed = changes.some(change =>
        change.target === this.el || change.target.parentNode === this.el &&
        (change.type === 'characterData' || change.type === 'attributes')
      );
      if (changed && this.collectViews()) forceUpdate(this.el);
    });
    this.observer.observe(this.el, {
      childList: true, subtree: true, characterData: true, attributes: true,
      attributeFilter: ['heading', 'view-key', 'slot'],
    });
  }

  componentWillRender() {
    this.collectViews();
  }

  componentDidRender() {
    super.componentDidRender();
    if (this.activeVariant !== this.variant) {
      this.activeVariant = this.variant;
      for (const view of this.views) if (view.element !== this.el) forceUpdate(view.element);
    }
    this.syncPanels();
    if (this.linkFrame !== undefined) cancelAnimationFrame(this.linkFrame);
    this.linkFrame = requestAnimationFrame(() => {
      this.linkFrame = undefined;
      this.linkTabs();
      if (this.selected) syntaxScrollRestorers.get(this.selected)?.();
      this.recoverFocus();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    this.el.removeEventListener('focusin', this.onFocusIn);
    this.el.removeEventListener('focusout', this.onFocusOut);
    if (this.linkFrame !== undefined) cancelAnimationFrame(this.linkFrame);
  }

  visible(view: HTMLElement): boolean {
    return !this.selected || view === this.selected;
  }

  select(view: HTMLElement): void {
    if (!this.views.some(candidate => candidate.element === view) || this.selected === view) return;
    this.selected = view;
    this.syncPanels();
    forceUpdate(this.el);
  }

  private onFocusIn = () => { this.focusWithin = true; };
  private onFocusOut = (event: FocusEvent) => {
    if (event.relatedTarget instanceof Node && !this.el.contains(event.relatedTarget)) this.focusWithin = false;
  };

  private collectViews(): boolean {
    const children = Array.from(this.el.children).filter((child): child is HTMLElement => child.localName === 'q-syntax-view');
    const hostHasContent = this.code !== undefined || this.value !== undefined || this.editable || hasSlottedSource(this.el);
    const elements = hostHasContent || !children.length ? [this.el, ...children] : children;
    const views = elements.map((element, index) => this.describeView(element, index));

    const previous = this.views;
    const changed = previous.length !== views.length || views.some((view, index) =>
      previous[index]?.element !== view.element || previous[index]?.tab.label !== view.tab.label || previous[index]?.key !== view.key
    );
    if (!changed) return false;

    if (!views.some(view => view.element === this.selected)) {
      this.restoreFocus = this.selected !== undefined && this.focusWithin;
      this.selected = this.replacementView(views).element;
    }

    if (previous.length > 1 && views.length === 1 && this.el.shadowRoot?.activeElement === this.tabSelector) this.restoreFocus = true;
    for (const old of previous) {
      if (!elements.includes(old.element) && old.element.slot === old.tab.value) {
        old.element.removeAttribute('slot');
        forceUpdate(old.element);
      }
    }
    this.views = views;
    return true;
  }

  private describeView(element: HTMLElement, index: number): SyntaxView {
    let id = this.identities.get(element);
    if (!id) {
      id = `${this.instanceId}-view-${++this.nextView}`;
      this.identities.set(element, id);
    }

    const child = element !== this.el;
    if (child && element.slot !== id) {
      element.slot = id;
      if (element.shadowRoot?.childElementCount) forceUpdate(element);
    }

    const label = (child ? element.getAttribute('heading') : this.heading)?.trim() || `View ${index + 1}`;
    return {
      element,
      key: child ? element.getAttribute('view-key')?.trim() : undefined,
      tab: { label, value: id, tabId: id + '-tab', panelId: id + '-panel' },
    };
  }

  private replacementView(views: SyntaxView[]): SyntaxView {
    const index = this.views.findIndex(view => view.element === this.selected);
    if (index < 0) return views[0];

    const key = this.views[index].key;
    if (key && this.views.filter(view => view.key === key).length === 1) {
      const replacements = views.filter(view => view.key === key);
      if (replacements.length === 1) return replacements[0];
    }

    const neighbors = [...this.views.slice(index + 1), ...this.views.slice(0, index).reverse()];
    return neighbors.find(old => views.some(view => view.element === old.element)) ?? views[0];
  }

  private onTabChange = (event: CustomEvent<string>) => {
    event.stopPropagation();
    const view = this.views.find(candidate => candidate.tab.value === event.detail);
    if (view) this.select(view.element);
  };

  private panel(view: SyntaxView): HTMLElement | null | undefined {
    return this.el.shadowRoot?.getElementById(view.tab.panelId!);
  }

  private syncPanels() {
    for (const view of this.views) {
      const panel = this.panel(view);
      if (!panel) continue;
      const inactive = !this.visible(view.element);
      panel.toggleAttribute('data-inactive', inactive);
      if (inactive) panel.setAttribute('aria-hidden', 'true');
      else panel.removeAttribute('aria-hidden');
      panel.tabIndex = !inactive && this.views.length > 1 ? 0 : -1;
      syntaxVisibility.get(view.element)?.();
    }
  }

  private linkTabs() {
    for (const view of this.views) {
      const tab = this.tabSelector?.shadowRoot?.getElementById(view.tab.tabId!);
      const panel = this.panel(view);
      if (!tab || !panel) continue;
      if ('ariaControlsElements' in tab) tab.ariaControlsElements = [panel];
      if ('ariaLabelledByElements' in panel) panel.ariaLabelledByElements = [tab];
    }
  }

  private recoverFocus() {
    if (!this.restoreFocus) return;
    this.restoreFocus = false;
    const focused = this.el.ownerDocument.activeElement;
    if (focused && focused !== this.el.ownerDocument.body && focused !== this.el && !this.el.contains(focused)) return;
    const view = this.views.find(candidate => candidate.element === this.selected);
    if (!view) return;
    const tab = this.tabSelector?.shadowRoot?.getElementById(view.tab.tabId!);
    (tab ?? this.panel(view))?.focus({ preventScroll: true });
  }

  render() {
    const tabbed = this.views.length > 1;
    const panelStyle = this.variant === 'panel';
    const active = this.views.find(view => view.element === this.selected);
    const title = this.heading || (active?.element !== this.el ? active?.element.getAttribute('heading') : '');
    return (
      <Host class={{ 'q-syntax-box-panel': panelStyle, 'q-syntax-box-plain': !panelStyle }}>
        <div class={`syntax-layout ${panelStyle ? 'panel-container' : 'plain-container'}`}>
          {(panelStyle || tabbed) && <div key="header" class="panel-header">
            {tabbed
              ? <q-tabs size="sm" items={this.views.map(view => view.tab)} value={active?.tab.value} ariaLabel={this.heading || 'Syntax views'}
                  onQChange={this.onTabChange} ref={el => { this.tabSelector = el; }} />
              : <span>{title}</span>}
          </div>}
          {this.views.map(view => <div key={view.tab.value} class="view-panel" id={view.tab.panelId}
            data-inactive={this.visible(view.element) ? undefined : ''} role={tabbed ? 'tabpanel' : undefined}
            aria-hidden={this.visible(view.element) ? undefined : 'true'}
            aria-label={tabbed ? view.tab.label : undefined} tabindex={tabbed && this.visible(view.element) ? 0 : -1}>
            {view.element === this.el
              ? [panelStyle && this.renderActions(), this.renderContent(this.variant)]
              : <slot name={view.tab.value} />}
          </div>)}
        </div>
      </Host>
    );
  }
}
