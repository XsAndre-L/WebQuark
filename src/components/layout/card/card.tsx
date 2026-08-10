import { Component, Prop, Element, State, h } from '@stencil/core';
import { getSlottedElements } from '../../../utils/dom';
import type { QCardElevation } from './card.types';
import { normalizeCardElevation, shouldActivateCardFromKey } from './card.utils';

/**
 * Flexible content card with optional header slot, elevation, glass, lift, and interactive button semantics.
 * @slot header - Optional header content, hidden automatically when empty.
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

  /** Numeric values remain supported as legacy elevation aliases. */
  @Prop({ reflect: true }) elevation: QCardElevation = 'medium';
  /** Applies translucent glass styling without backdrop-filter. */
  @Prop({ reflect: true }) glass: boolean = false;
  /** Applies a visual hover/focus lift without adding interactive semantics. */
  @Prop({ reflect: true }) lift: boolean = false;

  /** Adds button semantics and keyboard activation to the card container. */
  @Prop({ reflect: true }) interactive: boolean = false;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() hasHeader: boolean = false;

  private checkHeaderSlot = () => {
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
        class={{
          'card-container': true,
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
      </div>
    );
  }
}
