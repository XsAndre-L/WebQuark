import { Component, Prop, Element, Watch, h } from '@stencil/core';
import { syncPropertyToSlottedChildren } from '../../utils/dom';

@Component({
  tag: 'q-step-diagram',
  styleUrl: 'step-diagram.css',
  shadow: true,
})
export class QStepDiagram {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Prop() layout: 'vertical' | 'horizontal' = 'vertical';
  @Element() el!: HTMLElement;

  @Watch('layout')
  handleLayoutChange(newLayout: 'vertical' | 'horizontal') {
    this.propagateLayout(newLayout);
  }

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentDidLoad() {
    this.propagateLayout(this.layout);
  }

  componentDidUpdate() {
    this.propagateLayout(this.layout);
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleSlotChange = () => {
    this.propagateLayout(this.layout);
  };

  private propagateLayout(layoutVal: 'vertical' | 'horizontal') {
    syncPropertyToSlottedChildren(this.el, 'q-step-diagram-item', 'layout', layoutVal);
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    return (
      <div class={{
        'step-diagram': true,
        [`layout-${this.layout}`]: true
      }}>
        <slot onSlotchange={this.handleSlotChange} />
      </div>
    );
  }
}
