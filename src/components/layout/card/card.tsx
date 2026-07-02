import { Component, Prop, Element, State, h } from '@stencil/core';
import { getSlottedElements } from '../../../utils/dom';
import type { QCardElevation } from './card.types';

@Component({
  tag: 'q-card',
  styleUrl: 'card.css',
  shadow: true,
})
export class QCard {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  @Prop({ reflect: true }) elevation: QCardElevation = 'medium';
  @Prop({ reflect: true }) interactive: boolean = false;
  @Prop({ reflect: true }) glass: boolean = false;
  @Prop({ reflect: true }) lift: boolean = false;

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
    if (this.interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).click();
    }
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    return (
      <div
        class={{
          'card-container': true,
          [`elevation-${this.elevation}`]: true,
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
