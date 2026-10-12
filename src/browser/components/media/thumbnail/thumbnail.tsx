import { Component, Prop, h, Element, Event, EventEmitter } from '@stencil/core';

import type { QThumbnailMaximizeDetail } from './thumbnail.types';

/**
 * Media thumbnail that emits qMaximize for gallery and reel lightbox workflows.
 * @slot - Custom overlay content rendered above the thumbnail media.
 */
@Component({
  tag: 'q-thumbnail',
  styleUrl: 'thumbnail.css',
  shadow: true,
})
export class QThumbnail {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Prop() src: string = '';
  /** Marks the media as video and renders a decorative play indicator. */
  @Prop({ reflect: true }) video: boolean = false;
  /** Visible caption text and preferred accessible label. */
  @Prop() label?: string;
  /** Alternative text for the thumbnail image. */
  @Prop() alt: string = '';

  @Prop({ reflect: true }) highlighted: boolean = false;

  @Element() el!: HTMLElement;

  @Event() qMaximize!: EventEmitter<QThumbnailMaximizeDetail>;

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleTrigger = (e: Event) => {
    e.stopPropagation();
    this.qMaximize.emit({
      src: this.src,
      label: this.label,
      video: this.video,
      alt: this.alt,
      triggerEl: this.el,
    });
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;

    e.preventDefault();
    this.handleTrigger(e);
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    return (
      <div
        class={{
          'thumb-wrapper': true,
          'is-highlighted': this.highlighted,
          'is-video': this.video,
        }}
        onClick={this.handleTrigger}
        role="button"
        tabindex="0"
        aria-label={this.label || this.alt || 'Media item'}
        onKeyDown={this.handleKeyDown}
      >
        <div class="thumb-media-container">
          <img class="thumb-image" src={this.src} alt={this.alt} loading="lazy" />

          {this.video && (
            <div class="video-play-indicator" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}
        </div>

        {this.label && (
          <div class="thumb-caption">
            <span class="caption-text">{this.label}</span>
          </div>
        )}

        {/* Custom content overlay slot */}
        <slot />
      </div>
    );
  }
}
