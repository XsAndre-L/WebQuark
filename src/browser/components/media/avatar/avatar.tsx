import { Component, Element, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';

import type { QAvatarShape, QAvatarSize } from './avatar.types';

/**
 * Compact identity image with an initials or consumer-supplied fallback.
 * @slot fallback - Custom fallback content used when no image is available.
 * @part container - Avatar surface and accessible image container.
 * @part image - Native image element.
 * @part fallback - Initials or custom fallback content.
 */
@Component({
  tag: 'q-avatar',
  styleUrl: 'avatar.css',
  shadow: true,
})
export class QAvatar {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  @Element() el!: HTMLElement;

  /** Image source. An empty value renders the fallback immediately. */
  @Prop() src?: string;
  /** Explicit fallback text. Values are normalized to at most two visible characters. */
  @Prop() initials?: string;

  /** Preset, pixel number, or CSS size. */
  @Prop() size: QAvatarSize = 'md';
  @Prop({ reflect: true }) shape: QAvatarShape = 'circle';

  /** Native image loading policy. */
  @Prop() loading: 'eager' | 'lazy' = 'lazy';

  /** Name used to derive fallback initials and, unless `alt` is supplied, the accessible name. */
  @Prop() name?: string;

  /** Accessible image text. Set an explicit empty string when the avatar is decorative. */
  @Prop() alt?: string;

  @Event() qLoad!: EventEmitter<void>;

  @Event() qError!: EventEmitter<void>;

  @State() imageFailed: boolean = false;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('src')
  handleSourceChange(): void {
    this.imageFailed = false;
  }

  componentWillRender(): void {
    this.syncHostSize();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private get accessibleName(): string | undefined {
    if (this.alt !== undefined) {
      return this.alt.trim() || undefined;
    }

    return this.name?.trim() || undefined;
  }

  private get fallbackText(): string {
    const explicitInitials = this.initials?.trim();
    if (explicitInitials) {
      return Array.from(explicitInitials).slice(0, 2).join('').toUpperCase();
    }

    const parts = this.name?.trim().split(/\s+/).filter(Boolean) ?? [];
    if (parts.length === 0) return '?';
    if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();

    return `${Array.from(parts[0])[0] ?? ''}${Array.from(parts[parts.length - 1])[0] ?? ''}`.toUpperCase();
  }

  private get shouldRenderImage(): boolean {
    return Boolean(this.src?.trim()) && !this.imageFailed;
  }

  private syncHostSize(): void {
    if (typeof this.size === 'number') {
      const value = Number.isFinite(this.size) && this.size > 0 ? `${this.size}px` : '';
      this.el.style.setProperty('--q-avatar-resolved-size', value);
      return;
    }

    const value = String(this.size).trim();
    if (value && !['sm', 'md', 'lg'].includes(value)) {
      this.el.style.setProperty('--q-avatar-resolved-size', value);
    } else {
      this.el.style.removeProperty('--q-avatar-resolved-size');
    }
  }

  private handleImageLoad = (): void => {
    this.qLoad.emit();
  };

  private handleImageError = (): void => {
    this.imageFailed = true;
    this.qError.emit();
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const accessibleName = this.accessibleName;
    const preset = typeof this.size === 'string' && ['sm', 'md', 'lg'].includes(this.size)
      ? this.size
      : 'custom';

    return (
      <div
        class={{
          avatar: true,
          [`size-${preset}`]: true,
          [`shape-${this.shape}`]: true,
          'has-image': this.shouldRenderImage,
        }}
        part="container"
        role={accessibleName ? 'img' : undefined}
        aria-label={accessibleName}
        aria-hidden={accessibleName ? undefined : 'true'}
      >
        {this.shouldRenderImage ? (
          <img
            class="avatar-image"
            part="image"
            src={this.src}
            alt=""
            aria-hidden="true"
            loading={this.loading}
            referrerPolicy="no-referrer"
            onLoad={this.handleImageLoad}
            onError={this.handleImageError}
          />
        ) : (
          <span class="avatar-fallback" part="fallback" aria-hidden="true">
            <slot name="fallback">{this.fallbackText}</slot>
          </span>
        )}
      </div>
    );
  }
}
