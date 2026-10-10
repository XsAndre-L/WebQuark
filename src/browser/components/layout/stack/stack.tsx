import { Component, Prop, h } from '@stencil/core';
import { spaceValue, type QSpace } from '../../../theme/tokens';

/** Vertical layout without surface or landmark semantics.
 * @slot - Stack items.
 * @part layout - Layout container.
 */
@Component({ tag: 'q-stack', styleUrl: 'stack.css', shadow: true })
export class QStack {
  @Prop() gap: QSpace = 'lg';
  @Prop() align: 'stretch' | 'start' | 'center' | 'end' = 'stretch';

  render() {
    return <div part="layout" style={{ gap: spaceValue(this.gap), alignItems: this.align }}><slot /></div>;
  }
}
