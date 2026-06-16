import { Component, Prop, h, Element, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'q-thumbnail',
  styleUrl: 'thumbnail.css',
  shadow: true,
})
export class QThumbnail {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Prop() src: string = "";
  @Prop({ reflect: true }) video: boolean = false;
  @Prop() label?: string;
  @Prop() alt: string = "";
  @Prop({ reflect: true }) highlighted: boolean = false;

  @Element() el!: HTMLElement;

  @Event() qMaximize: EventEmitter<{ src: string; label?: string; video: boolean; alt: string; triggerEl: HTMLElement }>;

  private handleTrigger = (e: Event) => {
    e.stopPropagation();
    this.qMaximize.emit({
      src: this.src,
      label: this.label,
      video: this.video,
      alt: this.alt,
      triggerEl: this.el
    });
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    return (
      <div 
        class={{
          'thumb-wrapper': true,
          'is-highlighted': this.highlighted,
          'is-video': this.video
        }}
        onClick={this.handleTrigger}
        role="button"
        tabindex="0"
        aria-label={this.label || this.alt || 'Media item'}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') this.handleTrigger(e); }}
      >
        <div class="thumb-media-container">
          <img class="thumb-image" src={this.src} alt={this.alt} loading="lazy" />

          {this.video && (
            <div class="video-play-indicator">
              <svg viewBox="0 0 24 24" fill="currentColor">
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
