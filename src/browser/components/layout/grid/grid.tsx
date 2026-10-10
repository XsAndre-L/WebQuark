import { Component, Prop, h } from '@stencil/core';
import { spaceValue, type QSpace } from '../../../theme/tokens';

/** Container-fitting grid; data-q-span="full" spans a direct child across a row.
 * @slot - Grid items.
 * @part layout - Grid container.
 */
@Component({ tag: 'q-grid', styleUrl: 'grid.css', shadow: true })
export class QGrid {
  @Prop() columns: 1 | 2 | 3 | 4 = 2;
  @Prop() minItemWidth: string = '16rem';
  @Prop() gap: QSpace = 'lg';
  @Prop() rowGap?: QSpace;
  @Prop() columnGap?: QSpace;

  render() {
    const columns = Math.min(4, Math.max(1, Number(this.columns) || 2));
    return <div part="layout" style={{ '--_q-columns': String(columns), '--_q-min-item': this.minItemWidth, '--_q-column-gap': spaceValue(this.columnGap ?? this.gap), rowGap: spaceValue(this.rowGap ?? this.gap) }}><slot /></div>;
  }
}
