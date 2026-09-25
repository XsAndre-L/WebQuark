import { spaceValue, surfaceValue, type QSpace, type QSurface } from '../../../theme/tokens';
import { Component, Prop, Element, State, h } from '@stencil/core';
import { getSlottedElements } from '../../../utils/dom';
import type { QCardElevation } from './card.types';
import { normalizeCardElevation, shouldActivateCardFromKey } from './card.utils';

/**
 * Flexible content card with optional header slot, elevation, glass, lift, and interactive button semantics.
 * @slot header - Optional header content, hidden automatically when empty.
 * @slot footer - Optional footer content, hidden automatically when empty.
 * @part container - Card surface.
 * @part footer - Footer slot container.
 * @slot - Main card body content.
 * @part header - Header slot container.
 * @part body - Body slot container.
 */
@Component({
  tag: 'q-card',
  styleUrl: 'card.css',
  shadow: true,
})
export class QCard {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  /** Explicit surface; omitted preserves the variant's role. */
  @Prop() surface?: QSurface;
  @Prop() headerPadding?: QSpace;
  @Prop() footerPadding?: QSpace;
  @Prop() dividers: boolean = false;
  @Prop() padding: QSpace = 'lg';
  /** Numeric values remain supported as legacy elevation aliases. */
  @Prop({ reflect: true }) elevation: QCardElevation = 'low';
  /** Applies translucent glass styling without backdrop-filter. */
  @Prop({ reflect: true }) glass: boolean = false;
  /** Applies a visual hover/focus lift without adding interactive semantics. */
  @Prop({ reflect: true }) lift: boolean = false;

  /** Adds button semantics and keyboard activation to the card container. */
  @Prop({ reflect: true }) interactive: boolean = false;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() hasHeader: boolean = false;
  @State() hasFooter: boolean = false;

  private checkHeaderSlot = () => {
    const footer = this.el.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="footer"]');
    this.hasFooter = !!footer?.assignedNodes({ flatten: true }).some(node => node.nodeType === 1 || !!node.textContent?.trim());
    const headerContainer = this.el.shadowRoot?.querySelector('.card-header') as HTMLElement;
    if (headerContainer) {
      const elements = getSlottedElements(headerContainer);
      this.hasHeader = elements.length > 0;
    } else {
      this.hasHeader = false;
    }
  };

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentDidLoad() {
    this.checkHeaderSlot();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleKeyDown = (e: KeyboardEvent) => {
    if (shouldActivateCardFromKey(this.interactive, e.key, e.target, e.currentTarget)) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).click();
    }
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const elevationClass = normalizeCardElevation(this.elevation);

    return (
      <div
        part="container"
        style={{ '--_q-surface': surfaceValue(this.surface ?? 'card'), '--_q-body-padding': spaceValue(this.padding), '--_q-header-padding': spaceValue(this.headerPadding ?? this.padding), '--_q-footer-padding': spaceValue(this.footerPadding ?? this.padding) }}
        class={{
          'card-container': true,
          'has-dividers': this.dividers,
          [`elevation-${elevationClass}`]: true,
          'is-interactive': this.interactive,
          'is-glass': this.glass,
          'has-lift': this.lift,
        }}
        tabindex={this.interactive ? 0 : undefined}
        role={this.interactive ? 'button' : undefined}
        onKeyDown={this.interactive ? this.handleKeyDown : undefined}
      >
        <div
          class={{
            'card-header': true,
            'is-hidden': !this.hasHeader,
          }}
          part="header"
        >
          <slot name="header" onSlotchange={this.checkHeaderSlot} />
        </div>

        <div class="card-body" part="body">
          <slot />
        </div>
        <div class={{ 'card-footer': true, 'is-hidden': !this.hasFooter }} part="footer"><slot name="footer" onSlotchange={this.checkHeaderSlot} /></div>
      </div>
    );
  }
}
