import { Component, Host, Prop, h } from '@stencil/core';
import { spaceValue, type QSpace } from '../../../theme/tokens';

/** Static, container-relative separator.
 * @part line - The visible separator line.
 */
@Component({ tag: 'q-divider', styleUrl: 'divider.css', shadow: true })
export class QDivider {
  /** Physical direction of the separator. */
  @Prop({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';
  /** CSS length or percentage, capped to the allocated extent minus endpoint insets. */
  @Prop() length: string = 'auto';
  /** Symmetric external spacing perpendicular to the line. */
  @Prop() spacing: QSpace = 'lg';

  /** Hide a purely visual separator from assistive technology. */
  @Prop() decorative: boolean = false;

  render() {
    return <Host role={this.decorative ? undefined : 'separator'} aria-orientation={this.decorative ? undefined : this.orientation} aria-hidden={this.decorative ? 'true' : undefined} style={{ '--_q-divider-length': this.length === 'auto' ? '100%' : this.length, '--_q-divider-spacing': spaceValue(this.spacing) }}><span part="line" aria-hidden="true" /></Host>;
  }
}
