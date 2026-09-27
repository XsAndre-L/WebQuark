import { Component, Element, Prop, State, h } from '@stencil/core';

import type { QConversationBubbleVariant } from './conversation-bubble.types';

/**
 * Semantic conversation message with optional identity, metadata, and actions.
 * @slot avatar - Optional avatar or identity mark.
 * @slot - Message body.
 * @slot meta - Additional metadata displayed beside the timestamp.
 * @slot actions - Optional message actions.
 * @part container - Outer message article.
 * @part avatar - Avatar region.
 * @part content - Header and bubble content column.
 * @part header - Sender heading region.
 * @part sender - Sender text.
 * @part bubble - Message surface.
 * @part body - Message body.
 * @part footer - Timestamp, metadata, and actions.
 * @part timestamp - Timestamp text.
 * @part meta - Slotted metadata region.
 * @part actions - Slotted actions region.
 */
@Component({
  tag: 'q-conversation-bubble',
  styleUrl: 'conversation-bubble.css',
  shadow: true,
})
export class QConversationBubble {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  @Element() el!: HTMLElement;

  /** Visible sender name. */
  @Prop() sender?: string;
  /** Visible timestamp or short temporal description. */
  @Prop() timestamp?: string;

  @Prop({ reflect: true }) variant: QConversationBubbleVariant = 'incoming';
  /** Reduces spacing for dense conversations. */
  @Prop({ reflect: true }) compact: boolean = false;

  /** Overrides the generated accessible message label. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  @State() hasAvatar: boolean = false;
  @State() hasMeta: boolean = false;
  @State() hasActions: boolean = false;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentWillLoad(): void {
    this.hasAvatar = this.el.querySelector('[slot="avatar"]') !== null;
    this.hasMeta = this.el.querySelector('[slot="meta"]') !== null;
    this.hasActions = this.el.querySelector('[slot="actions"]') !== null;
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    const hasContent = slot.assignedNodes({ flatten: true }).some(node =>
      node.nodeType === Node.ELEMENT_NODE || Boolean(node.textContent?.trim()),
    );

    if (slot.name === 'avatar') this.hasAvatar = hasContent;
    if (slot.name === 'meta') this.hasMeta = hasContent;
    if (slot.name === 'actions') this.hasActions = hasContent;
  };

  private get accessibleName(): string {
    const explicit = this.ariaLabel?.trim();
    if (explicit) return explicit;

    const sender = this.sender?.trim();
    const timestamp = this.timestamp?.trim();
    if (sender && timestamp) return `Message from ${sender}, ${timestamp}`;
    if (sender) return `Message from ${sender}`;
    if (timestamp) return `Message, ${timestamp}`;
    return this.variant === 'system' ? 'System message' : 'Message';
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const sender = this.sender?.trim();
    const timestamp = this.timestamp?.trim();
    const hasFooter = Boolean(timestamp || this.hasMeta || this.hasActions);

    return (
      <article
        class={{
          conversation: true,
          [`variant-${this.variant}`]: true,
          'is-compact': this.compact,
          'has-avatar': this.hasAvatar,
        }}
        part="container"
        role="group"
        aria-label={this.accessibleName}
      >
        <div
          class="avatar"
          part="avatar"
          aria-hidden={!this.hasAvatar || this.variant === 'system' ? 'true' : undefined}
        >
          <slot name="avatar" onSlotchange={this.handleSlotChange} />
        </div>

        <div class="content" part="content">
          {sender && (
            <header class="header" part="header">
              <span class="sender" part="sender">{sender}</span>
            </header>
          )}

          <div class="bubble" part="bubble">
            <div class="body" part="body">
              <slot />
            </div>

            <footer class={{ footer: true, 'has-content': hasFooter }} part="footer">
              <div class="message-meta">
                {timestamp && <time class="timestamp" part="timestamp">{timestamp}</time>}
                <span class={{ meta: true, 'has-content': this.hasMeta }} part="meta">
                  <slot name="meta" onSlotchange={this.handleSlotChange} />
                </span>
              </div>
              <span class={{ actions: true, 'has-content': this.hasActions }} part="actions">
                <slot name="actions" onSlotchange={this.handleSlotChange} />
              </span>
            </footer>
          </div>
        </div>
      </article>
    );
  }
}
