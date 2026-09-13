import { Component, Host, Prop, h } from '@stencil/core';
import type { QBannerHeight, QBannerAlignment } from './banner.types';

/**
 * Generic banner shell. The media, copy and actions are supplied through slots; final layout is deferred.
 * @slot - Consumer-owned content.
 * @slot media - Media content.
 * @slot actions - Action content.
 */
@Component({ tag: 'q-banner', styleUrl: 'banner.css', shadow: true })
export class QBanner {
  @Prop({ reflect: true }) height: QBannerHeight = 'auto';
  @Prop({ reflect: true }) alignment: QBannerAlignment = 'center';

  render() {
    return <Host><slot name="media" /><slot /><slot name="actions" /></Host>;
  }
}
