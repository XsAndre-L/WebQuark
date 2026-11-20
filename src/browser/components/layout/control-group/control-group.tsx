import { Component, Element, Host, Prop, h } from '@stencil/core';
import { controlScope, type QControlSize } from '../../../theme/tokens';

const supportedControls = new Set(['Q-INPUT', 'Q-DROPDOWN', 'Q-TOGGLE', 'Q-QUANTITY-SELECTOR', 'Q-BUTTON']);
const marker = 'data-q-control-group';
const ownership = new WeakMap<HTMLElement, { owner: HTMLElement; original: string | null }>();

/**
 * Visually joined controls with consumer-owned values and interactions.
 * @slot - Direct input, dropdown, toggle, quantity selector or button children.
 * @part group - Layout container; each child retains its own control surface.
 */
@Component({ tag: 'q-control-group', styleUrl: 'control-group.css', shadow: true })
export class QControlGroup {
  @Element() el!: HTMLElement;

  @Prop() size: QControlSize = 'inherit';
  @Prop({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** Name of the group; each child still needs its own accessible name. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  private observer?: MutationObserver;
  private managedChildren = new Set<HTMLElement>();

  connectedCallback() {
    this.observer = new MutationObserver(() => this.updateChildren());
    this.observer.observe(this.el, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'slot'] });
    this.updateChildren();
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    for (const child of this.managedChildren) this.restoreChild(child);
  }

  private restoreChild(child: HTMLElement) {
    const previous = ownership.get(child);
    if (previous?.owner === this.el) {
      if (previous.original === null) child.removeAttribute(marker);
      else child.setAttribute(marker, previous.original);
      ownership.delete(child);
    }
    this.managedChildren.delete(child);
  }

  private updateChildren = () => {
    const controls = Array.from(this.el.children).filter((child): child is HTMLElement =>
      child instanceof HTMLElement && supportedControls.has(child.tagName) && !child.hidden && !child.slot);
    for (const child of this.managedChildren) {
      if (!controls.includes(child)) this.restoreChild(child);
    }
    controls.forEach((child, index) => {
      if (!this.managedChildren.has(child)) {
        const previous = ownership.get(child);
        ownership.set(child, { owner: this.el, original: previous ? previous.original : child.getAttribute(marker) });
        this.managedChildren.add(child);
      }
      child.setAttribute(marker, controls.length === 1 ? 'only' : index === 0 ? 'first' : index === controls.length - 1 ? 'last' : 'middle');
    });
  };

  render() {
    return (
      <Host style={controlScope(this.size)}>
        <div part="group" role="group" aria-label={this.ariaLabel || undefined}>
          <slot onSlotchange={this.updateChildren} />
        </div>
      </Host>
    );
  }
}
