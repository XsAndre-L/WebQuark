import { Component, Prop, State, Element, Listen, Event, EventEmitter, Watch, h } from '@stencil/core';
import { getSlottedElements, handleTabTrap, safeFocus } from '../../../utils/dom';

import type { QThumbnailMaximizeDetail } from '../thumbnail/thumbnail.types';
import type { QReelLayout } from './reel.types';

const LIGHTBOX_FOCUS_DELAY_MS = 50;
type QReelThumbnailElement = HTMLElement & Pick<QThumbnailMaximizeDetail, 'src' | 'label' | 'video' | 'alt'>;

/**
 * Gallery layout for q-thumbnail children with an optional modal lightbox.
 * @slot - One or more q-thumbnail elements.
 */
@Component({
  tag: 'q-reel',
  styleUrl: 'reel.css',
  shadow: true,
})
export class QReel {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /** Layout used for slotted q-thumbnail items. */
  @Prop() layout: QReelLayout = 'grid';
  /** Enables the built-in fullscreen lightbox when thumbnails emit qMaximize. */
  @Prop() lightbox: boolean = true;

  /** Emitted when the lightbox opens. */
  @Event() qLightboxOpen!: EventEmitter<void>;
  /** Emitted when the lightbox closes. */
  @Event() qLightboxClose!: EventEmitter<void>;
  @Element() el!: HTMLElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() activeMedia: QThumbnailMaximizeDetail | null = null;
  private closeButtonRef?: HTMLButtonElement;
  private focusTimer?: ReturnType<typeof setTimeout>;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  disconnectedCallback() {
    this.clearFocusTimer();
  }

  @Watch('lightbox')
  handleLightboxChange(lightbox: boolean) {
    if (!lightbox) {
      this.closeLightbox();
    }
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private getThumbnails(): QReelThumbnailElement[] {
    const slotted = getSlottedElements(this.el, 'q-thumbnail') as QReelThumbnailElement[];
    if (slotted.length > 0) return slotted;

    return Array.from(this.el.querySelectorAll('q-thumbnail')) as QReelThumbnailElement[];
  }

  @Listen('qMaximize')
  handleThumbnailMaximize(event: CustomEvent<QThumbnailMaximizeDetail>) {
    if (!this.lightbox) return;
    this.activeMedia = event.detail;
    this.qLightboxOpen.emit();
    this.scheduleFocus(this.closeButtonRef);
  }

  @Listen('keydown', { target: 'window' })
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (!this.activeMedia) return;
    this.handleLightboxKeyDown(event);
  }

  private closeLightbox = () => {
    if (!this.activeMedia) return;

    const originalTrigger = this.activeMedia?.triggerEl;
    this.activeMedia = null;
    this.qLightboxClose.emit();
    this.scheduleFocus(originalTrigger);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.handleLightboxKeyDown(e);
  };

  private handleLightboxKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.closeLightbox();
      return;
    }

    if (e.key === 'Tab') {
      const overlay = this.el.shadowRoot?.querySelector('.lightbox-overlay') as HTMLElement;
      if (overlay) {
        handleTabTrap(e, overlay);
        e.stopPropagation();
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      const currentIdx = this.getActiveIndex();
      if (currentIdx > 0) {
        this.navigateMedia(currentIdx - 1);
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      const thumbnails = this.getThumbnails();
      const currentIdx = this.getActiveIndex(thumbnails);
      if (currentIdx !== -1 && currentIdx < thumbnails.length - 1) {
        this.navigateMedia(currentIdx + 1);
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
  }

  private handleCloseButtonClick = (e: MouseEvent) => {
    e.stopPropagation();
    this.closeLightbox();
  };

  private handlePreviousClick = (e: MouseEvent) => {
    e.stopPropagation();
    const currentIdx = this.getActiveIndex();
    if (currentIdx > 0) {
      this.navigateMedia(currentIdx - 1);
    }
  };

  private handleNextClick = (e: MouseEvent) => {
    e.stopPropagation();
    const thumbnails = this.getThumbnails();
    const currentIdx = this.getActiveIndex(thumbnails);
    if (currentIdx !== -1 && currentIdx < thumbnails.length - 1) {
      this.navigateMedia(currentIdx + 1);
    }
  };

  private getActiveIndex(thumbnails = this.getThumbnails()): number {
    if (!this.activeMedia) return -1;
    return thumbnails.findIndex(thumbnail => thumbnail === this.activeMedia!.triggerEl);
  }

  private navigateMedia(index: number) {
    const thumbnails = this.getThumbnails();
    if (index >= 0 && index < thumbnails.length) {
      const thumb = thumbnails[index];
      this.activeMedia = {
        src: thumb.src,
        label: thumb.label,
        video: thumb.video,
        alt: thumb.alt,
        triggerEl: thumb,
      };

      this.scheduleFocus(this.closeButtonRef);
    }
  }

  private clearFocusTimer() {
    if (this.focusTimer) {
      clearTimeout(this.focusTimer);
      this.focusTimer = undefined;
    }
  }

  private scheduleFocus(element: HTMLElement | null | undefined) {
    this.clearFocusTimer();
    this.focusTimer = setTimeout(() => {
      this.focusTimer = undefined;
      safeFocus(element);
    }, LIGHTBOX_FOCUS_DELAY_MS);
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const thumbnails = this.getThumbnails();
    const currentIdx = this.getActiveIndex(thumbnails);
    const hasPrev = currentIdx > 0;
    const hasNext = currentIdx !== -1 && currentIdx < thumbnails.length - 1;

    return (
      <div
        class={{
          'reel-container': true,
          [`layout-${this.layout}`]: true,
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
            tabindex="-1"
          >
            <button class="lightbox-close" onClick={this.handleCloseButtonClick} aria-label="Close viewer" ref={(el) => (this.closeButtonRef = el)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {hasPrev && (
              <button class="lightbox-prev" onClick={this.handlePreviousClick} aria-label="Previous media">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            {hasNext && (
              <button class="lightbox-next" onClick={this.handleNextClick} aria-label="Next media">
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
