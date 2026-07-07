import { Component, Prop, Element, Watch, h } from '@stencil/core';
import { syncPropertyToSlottedChildren } from '../../../utils/dom';

import type { QStepDiagramLayout } from './step-diagram.types';

/**
 * Groups step diagram items into a vertical or horizontal sequence.
 * @slot - Accepts one or more q-step-diagram-item elements.
 */
@Component({
  tag: 'q-step-diagram',
  styleUrl: 'step-diagram.css',
  shadow: true,
})
export class QStepDiagram {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /** Controls whether step items are stacked vertically or arranged horizontally. */
  @Prop({ reflect: true }) layout: QStepDiagramLayout = 'vertical';

  /** Accessible label for the step sequence. */
  @Prop() ariaLabel: string = 'Steps';

  @Element() el!: HTMLElement;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('layout')
  private handleLayoutChange(newLayout: QStepDiagramLayout): void {
    this.propagateLayout(newLayout);
  }

  componentDidLoad() {
    this.handleLayoutChange(this.layout);
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleSlotChange = () => {
    this.propagateLayout(this.layout);
  };

  private propagateLayout(layoutVal: QStepDiagramLayout) {
    syncPropertyToSlottedChildren(this.el, 'q-step-diagram-item', 'layout', layoutVal);
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    return (
      <div
        class={{
          'step-diagram': true,
          [`layout-${this.layout}`]: true,
        }}
        role="list"
        aria-label={this.ariaLabel}
      >
        <slot onSlotchange={this.handleSlotChange} />
      </div>
    );
  }
}
