import { Component, Prop, h } from '@stencil/core';
import { spaceValue, type QSpace } from '../../../theme/tokens';

/** Wrapping action/content row.
 * @slot - Row items.
 * @part layout - Layout container.
 */
@Component({ tag: 'q-inline', styleUrl: 'inline.css', shadow: true })
export class QInline {
  @Prop() gap: QSpace = 'sm';
  @Prop() align: 'stretch' | 'start' | 'center' | 'end' = 'center';
  @Prop() justify: 'start' | 'center' | 'end' | 'between' = 'start';
  @Prop() wrap: boolean = true;

  render() {
    return <div part="layout" style={{ gap: spaceValue(this.gap), alignItems: this.align, justifyContent: this.justify === 'between' ? 'space-between' : this.justify, flexWrap: this.wrap ? 'wrap' : 'nowrap' }}><slot /></div>;
  }
}
