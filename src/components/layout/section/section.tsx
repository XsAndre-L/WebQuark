import { Component, Host, Prop, h } from '@stencil/core';
import type { QSectionLayout } from './section.types';

/**
 * Generic section shell. Layout properties are reserved for the presentation pass.
 * @slot - Consumer-owned content.
 * @slot media - Media content.
 * @slot actions - Action content.
 */
@Component({ tag: 'q-section', styleUrl: 'section.css', shadow: true })
export class QSection {
  @Prop({ reflect: true }) layout: QSectionLayout = 'full';
  @Prop({ reflect: true }) reverse: boolean = false;
  @Prop({ reflect: true }) columns: number = 1;

  render() {
    return <Host><slot name="media" /><slot /><slot name="actions" /></Host>;
  }
}
