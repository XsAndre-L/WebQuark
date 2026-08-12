import { Component, Element, Prop, State, h } from '@stencil/core';
import { getSlottedElements } from '../../../utils/dom';

import type { QPanelPadding, QPanelVariant } from './panel.types';

/**
 * Flexible panel surface with optional header, body, and footer regions.
 *
 * @slot - Main panel body content.
 * @slot header - Optional header content.
 * @slot footer - Optional footer content.
 * @part panel - Panel container.
 * @part header - Header region.
 * @part body - Body region.
 * @part footer - Footer region.
 */
@Component({
  tag: 'q-panel',
  styleUrl: 'panel.css',
  shadow: true,
})
export class QPanel {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  @Prop({ reflect: true }) variant: QPanelVariant = 'bordered';
  /** Removes the panel border while preserving the selected variant's other styling. */
  @Prop({ reflect: true }) noBorders: boolean = false;
  @Prop({ reflect: true }) padding: QPanelPadding = 'md';
  @Prop({ reflect: true }) fullHeight: boolean = false;

  @Prop({ reflect: true }) scrollable: boolean = false;
  /** Keeps the header pinned when the panel itself is the scroll container. */
  @Prop({ reflect: true }) stickyHeader: boolean = false;
  /** Keeps the footer pinned when the panel itself is the scroll container. */
  @Prop({ reflect: true }) stickyFooter: boolean = false;

  /** Accessible label for the panel container and scrollable body region. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() hasHeader: boolean = false;
  @State() hasFooter: boolean = false;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentDidLoad() {
    this.handleSlotChange();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleSlotChange = () => {
    const header = this.el.shadowRoot?.querySelector('.panel-header') as HTMLElement;
    const footer = this.el.shadowRoot?.querySelector('.panel-footer') as HTMLElement;

    this.hasHeader = header ? getSlottedElements(header).length > 0 : false;
    this.hasFooter = footer ? getSlottedElements(footer).length > 0 : false;
  };

  private get scrollRegionLabel(): string | undefined {
    if (!this.scrollable) return undefined;
    return this.ariaLabel ? `${this.ariaLabel} content` : 'Panel content';
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    return (
      <section
        class={{
          'panel': true,
          [`variant-${this.variant}`]: true,
          'has-no-borders': this.noBorders,
          [`padding-${this.padding}`]: true,
          'is-scrollable': this.scrollable,
          'is-full-height': this.fullHeight,
          'has-sticky-header': this.stickyHeader,
          'has-sticky-footer': this.stickyFooter,
          'uses-sticky-scroll': this.scrollable && (this.stickyHeader || this.stickyFooter),
        }}
        aria-label={this.ariaLabel}
        part="panel"
      >
        <div
          class={{
            'panel-header': true,
            'is-hidden': !this.hasHeader,
          }}
          part="header"
        >
          <slot name="header" onSlotchange={this.handleSlotChange} />
        </div>

        <div
          class="panel-body"
          part="body"
          tabindex={this.scrollable ? 0 : undefined}
          role={this.scrollable ? 'region' : undefined}
          aria-label={this.scrollRegionLabel}
        >
          <slot />
        </div>

        <div
          class={{
            'panel-footer': true,
            'is-hidden': !this.hasFooter,
          }}
          part="footer"
        >
          <slot name="footer" onSlotchange={this.handleSlotChange} />
        </div>
      </section>
    );
  }
}
