import { Component, Host, Prop, h } from '@stencil/core';
import type { QAccordionMode } from './accordion.types';

/**
 * Accordion API scaffold. Disclosure behavior and item coordination are deferred.
 * @slot - Consumer-owned content.
 */
@Component({ tag: 'q-accordion', styleUrl: 'accordion.css', shadow: true })
export class QAccordion {
  @Prop({ reflect: true }) mode: QAccordionMode = 'single';

  render() {
    return <Host><slot /></Host>;
  }
}
