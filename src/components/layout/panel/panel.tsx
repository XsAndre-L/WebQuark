import { Component, Element, Prop, State, h } from '@stencil/core';
import { getSlottedElements } from '../../../utils/dom';

import type { QPanelPadding, QPanelVariant } from './panel.types';

@Component({
  tag: 'q-panel',
  styleUrl: 'panel.css',
  shadow: true,
})
export class QPanel {
  @Element() el!: HTMLElement;

  @Prop({ reflect: true }) variant: QPanelVariant = 'surface';
  @Prop({ reflect: true }) padding: QPanelPadding = 'md';
  @Prop({ reflect: true }) scrollable: boolean = false;
  @Prop({ reflect: true }) fullHeight: boolean = false;
  @Prop({ reflect: true }) stickyHeader: boolean = false;
  @Prop({ reflect: true }) stickyFooter: boolean = false;
  @Prop() ariaLabel?: string;

  @State() hasHeader: boolean = false;
  @State() hasFooter: boolean = false;

  componentDidLoad() {
    this.checkSlots();
  }

  private checkSlots = () => {
    const header = this.el.shadowRoot?.querySelector('.panel-header') as HTMLElement;
    const footer = this.el.shadowRoot?.querySelector('.panel-footer') as HTMLElement;

    this.hasHeader = header ? getSlottedElements(header).length > 0 : false;
    this.hasFooter = footer ? getSlottedElements(footer).length > 0 : false;
  };

  render() {
    return (
      <section
        class={{
          'panel': true,
          [`variant-${this.variant}`]: true,
          [`padding-${this.padding}`]: true,
          'is-scrollable': this.scrollable,
          'is-full-height': this.fullHeight,
          'has-sticky-header': this.stickyHeader,
          'has-sticky-footer': this.stickyFooter,
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
          <slot name="header" onSlotchange={this.checkSlots} />
        </div>

        <div class="panel-body" part="body">
          <slot />
        </div>

        <div
          class={{
            'panel-footer': true,
            'is-hidden': !this.hasFooter,
          }}
          part="footer"
        >
          <slot name="footer" onSlotchange={this.checkSlots} />
        </div>
      </section>
    );
  }
}
