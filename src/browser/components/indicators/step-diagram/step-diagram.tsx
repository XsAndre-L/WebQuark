import { Component, Prop, Element, Watch, h } from '@stencil/core';
import { syncPropertyToSlottedChildren } from '../../../utils/dom';

import type { QStepDiagramLayout, QStepDiagramOrientation } from './step-diagram.types';

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
  /** Direction of the sequence and its items. Overrides layout; defaults to vertical when both are omitted. */
  @Prop({ reflect: true }) orientation?: QStepDiagramOrientation;
  /** @deprecated Use orientation. Used only when orientation is unset. */
  @Prop({ reflect: true }) layout: QStepDiagramLayout = 'vertical';

  /** Accessible label for the step sequence. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = 'Steps';

  @Element() el!: HTMLElement;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('orientation')
  @Watch('layout')
  private handleOrientationChange(): void {
    this.propagateOrientation();
  }

  componentDidLoad() {
    this.handleOrientationChange();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleSlotChange = () => {
    this.propagateOrientation();
  };

  private propagateOrientation() {
    const orientation = this.orientation ?? this.layout;
    syncPropertyToSlottedChildren(this.el, 'q-step-diagram-item', 'orientation', orientation);
    syncPropertyToSlottedChildren(this.el, 'q-step-diagram-item', 'layout', orientation);
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const orientation = this.orientation ?? this.layout;
    return (
      <div
        class={{
          'step-diagram': true,
          [`orientation-${orientation}`]: true,
          [`layout-${orientation}`]: true,
        }}
        role="list"
        aria-label={this.ariaLabel}
      >
        <slot onSlotchange={this.handleSlotChange} />
      </div>
    );
  }
}
