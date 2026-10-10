import { Component, Host, Prop, h } from '@stencil/core';
import type { QMediaKind, QMediaLoading } from './media.types';

/**
 * Generic media API scaffold. Native media rendering is deferred; consumers should continue using their existing media renderer.
 * @slot - Consumer-owned content.
 * @slot fallback - Placeholder content.
 */
@Component({ tag: 'q-media', styleUrl: 'media.css', shadow: true })
export class QMedia {
  @Prop() src: string = '';
  @Prop({ reflect: true }) kind: QMediaKind = 'image';

  @Prop() loading: QMediaLoading = 'lazy';

  @Prop() alt: string = '';

  render() {
    return <Host><slot /><slot name="fallback" /></Host>;
  }
}
