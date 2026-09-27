import {
  Component,
  Element,
  Event,
  EventEmitter,
  Prop,
  State,
  h,
} from '@stencil/core';

import type { QAlertAnnouncement, QAlertVariant } from './alert.types';

/**
 * Inline contextual message with opt-in announcements and controlled dismissal.
 * @slot - Alert message content.
 * @slot icon - Optional leading icon or status mark.
 * @slot actions - Optional action controls displayed after the message.
 * @part container - Outer alert container.
 * @part icon - Leading icon region.
 * @part content - Heading and message region.
 * @part heading - Optional alert heading.
 * @part message - Default message slot wrapper.
 * @part actions - Optional action region.
 * @part dismiss-button - Native dismiss button.
 */
@Component({
  tag: 'q-alert',
  styleUrl: 'alert.css',
  shadow: true,
})
export class QAlert {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  @Element() el!: HTMLElement;

  @Prop() heading?: string;

  @Prop({ reflect: true }) variant: QAlertVariant = 'info';

  @Prop() dismissible: boolean = false;
  /** Accessible label for the dismiss button. */
  @Prop({ attribute: 'dismiss-label' }) dismissLabel: string = 'Dismiss alert';

  /** Live-region behavior. Announcements are off by default to avoid noisy updates. */
  @Prop() announcement: QAlertAnnouncement = 'off';

  /** The component remains rendered after dismissal. */
  @Event() qDismiss!: EventEmitter<void>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() hasIcon: boolean = false;
  @State() hasActions: boolean = false;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentWillLoad(): void {
    this.hasIcon = this.el.querySelector('[slot="icon"]') !== null;
    this.hasActions = this.el.querySelector('[slot="actions"]') !== null;
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;

    if (slot.name === 'icon') {
      this.hasIcon = slot.assignedNodes({ flatten: true }).length > 0;
    } else if (slot.name === 'actions') {
      this.hasActions = slot.assignedNodes({ flatten: true }).length > 0;
    }
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const accessibility =
      this.announcement === 'assertive'
        ? { role: 'alert', ariaLive: 'assertive' }
        : this.announcement === 'polite'
          ? { role: 'status', ariaLive: 'polite' }
          : { role: undefined, ariaLive: undefined };

    return (
      <div
        class={{ 'alert': true, [`variant-${this.variant}`]: true }}
        part="container"
        role={accessibility.role}
        aria-live={accessibility.ariaLive}
        aria-atomic={this.announcement === 'off' ? undefined : 'true'}
      >
        <span
          class={{ 'icon': true, 'has-content': this.hasIcon }}
          part="icon"
          aria-hidden="true"
        >
          <slot name="icon" onSlotchange={this.handleSlotChange} />
        </span>

        <div class="content" part="content">
          {this.heading && (
            <div class="heading" part="heading">
              {this.heading}
            </div>
          )}
          <div class="message" part="message">
            <slot />
          </div>
        </div>

        <div
          class={{ 'actions': true, 'has-content': this.hasActions }}
          part="actions"
        >
          <slot name="actions" onSlotchange={this.handleSlotChange} />
        </div>

        {this.dismissible && (
          <button
            class="dismiss-button"
            part="dismiss-button"
            type="button"
            aria-label={this.dismissLabel.trim() || 'Dismiss alert'}
            onClick={() => this.qDismiss.emit()}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    );
  }
}
