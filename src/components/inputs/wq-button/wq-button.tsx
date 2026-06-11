import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'wq-button',
  styleUrl: 'wq-button.css',
  shadow: true,
})
export class WqButton {
  /**
   * The button text label
   */
  @Prop() label: string = 'Click me';

  render() {
    return (
      <button type="button">
        {this.label}
      </button>
    );
  }
}
