import { Component, Prop, Element, Watch, h } from '@stencil/core';
import { syncPropertyToSlottedChildren } from '../../utils/dom';

@Component({
  tag: 'q-step-diagram',
  styleUrl: 'q-step-diagram.css',
  shadow: true,
})
export class QStepDiagram {
  @Prop() layout: 'vertical' | 'horizontal' = 'vertical';
  @Element() el!: HTMLElement;

  @Watch('layout')
  handleLayoutChange(newLayout: 'vertical' | 'horizontal') {
    this.propagateLayout(newLayout);
  }

  componentDidLoad() {
    this.propagateLayout(this.layout);
  }

  componentDidUpdate() {
    this.propagateLayout(this.layout);
  }

  private handleSlotChange = () => {
    this.propagateLayout(this.layout);
  };

  private propagateLayout(layoutVal: 'vertical' | 'horizontal') {
    syncPropertyToSlottedChildren(this.el, 'q-step-diagram-item', 'layout', layoutVal);
  }

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
