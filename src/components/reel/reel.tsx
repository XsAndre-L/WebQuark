import { Component, Prop, State, Element, Listen, Event, EventEmitter, h } from '@stencil/core';
import { getSlottedElements, handleTabTrap, safeFocus } from '../../utils/dom';

import type { QReelLayout, QReelMedia } from './reel.types';

@Component({
  tag: 'q-reel',
  styleUrl: 'reel.css',
  shadow: true,
})
export class QReel {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Prop() layout: QReelLayout = 'grid';
  @Prop() lightbox: boolean = true;

  @State() activeMedia: QReelMedia | null = null;

  @Event() qLightboxOpen: EventEmitter<void>;
  @Event() qLightboxClose: EventEmitter<void>;
  @Element() el!: HTMLElement;

  private closeButtonRef?: HTMLButtonElement;

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private getThumbnails(): HTMLElement[] {
    return getSlottedElements(this.el, 'q-thumbnail');
  }

  @Listen('qMaximize')
  handleThumbnailMaximize(event: CustomEvent<QReelMedia>) {
    if (!this.lightbox) return;
    this.activeMedia = event.detail;
    this.qLightboxOpen.emit();

    // Defer focus shift to overlay close button
    setTimeout(() => {
      safeFocus(this.closeButtonRef);
    }, 50);
  }

  @Listen('keydown', { target: 'window' })
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (this.activeMedia && event.key === 'Escape') {
      this.closeLightbox();
    }
  }

  private closeLightbox = () => {
    const originalTrigger = this.activeMedia?.triggerEl;
    this.activeMedia = null;
    this.qLightboxClose.emit();

    // Restore focus to thumbnail
    setTimeout(() => safeFocus(originalTrigger), 50);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.closeLightbox();
      e.preventDefault();
      return;
    }

    if (e.key === 'Tab') {
      const overlay = this.el.shadowRoot?.querySelector('.lightbox-overlay') as HTMLElement;
      if (overlay) {
        handleTabTrap(e, overlay);
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      const thumbnails = this.getThumbnails();
      const currentIdx = this.activeMedia && this.activeMedia.triggerEl 
        ? thumbnails.indexOf(this.activeMedia.triggerEl) 
        : -1;
      if (currentIdx > 0) {
        this.navigateMedia(currentIdx - 1);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      const thumbnails = this.getThumbnails();
      const currentIdx = this.activeMedia && this.activeMedia.triggerEl 
        ? thumbnails.indexOf(this.activeMedia.triggerEl) 
        : -1;
      if (currentIdx !== -1 && currentIdx < thumbnails.length - 1) {
        this.navigateMedia(currentIdx + 1);
        e.preventDefault();
      }
      return;
    }
  };

  private navigateMedia(index: number) {
    const thumbnails = this.getThumbnails();
    if (index >= 0 && index < thumbnails.length) {
      const thumb = thumbnails[index] as any;
      this.activeMedia = {
        src: thumb.src,
        label: thumb.label,
        video: thumb.video,
        alt: thumb.alt,
        triggerEl: thumb
      };

      // Keep focus on close button or media when navigating
      setTimeout(() => {
        safeFocus(this.closeButtonRef);
      }, 50);
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const thumbnails = this.getThumbnails();
    const currentIdx = this.activeMedia && this.activeMedia.triggerEl 
      ? thumbnails.indexOf(this.activeMedia.triggerEl) 
      : -1;
    const hasPrev = currentIdx > 0;
    const hasNext = currentIdx !== -1 && currentIdx < thumbnails.length - 1;

    return (
      <div 
        class={{
          'reel-container': true,
          [`layout-${this.layout}`]: true
        }}
      >
        {/* Render Slotted Thumbnails */}
        <slot />

        {/* Custom Lightbox Overlay (OSR/CEF Safe & WAI-ARIA Compliant) */}
        {this.activeMedia && (
          <div 
            class="lightbox-overlay" 
            onClick={this.closeLightbox}
            onKeyDown={this.handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={this.activeMedia.label || 'Media Viewer'}
          >
            <button 
              class="lightbox-close" 
              onClick={this.closeLightbox} 
              aria-label="Close viewer"
              ref={(el) => (this.closeButtonRef = el)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {hasPrev && (
              <button 
                class="lightbox-prev" 
                onClick={(e) => { e.stopPropagation(); this.navigateMedia(currentIdx - 1); }} 
                aria-label="Previous media"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            {hasNext && (
              <button 
                class="lightbox-next" 
                onClick={(e) => { e.stopPropagation(); this.navigateMedia(currentIdx + 1); }} 
                aria-label="Next media"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            <div class="lightbox-content" onClick={(e) => e.stopPropagation()}>
              {this.activeMedia.video ? (
                <video class="lightbox-media" src={this.activeMedia.src} controls autoplay loop />
              ) : (
                <img class="lightbox-media" src={this.activeMedia.src} alt={this.activeMedia.alt} />
              )}

              {this.activeMedia.label && (
                <div class="lightbox-caption">
                  {this.activeMedia.label}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
