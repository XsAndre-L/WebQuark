import { Component, Prop, State, Element, h, Host } from '@stencil/core';

import type { QTooltipPosition } from './tooltip.types';

@Component({
  tag: 'q-tooltip',
  styleUrl: 'tooltip.css',
  shadow: true,
})
export class QTooltip {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el: HTMLElement;

  /**
   * The text content to display inside the tooltip.
   */
  @Prop() content: string;

  /**
   * The placement position of the tooltip relative to its trigger parent.
   * Options: 'top', 'bottom', 'left', 'right'
   */
  @Prop() position: QTooltipPosition = 'top';

  /**
   * The delay in milliseconds before the tooltip shows up.
   */
  @Prop() delay: number = 200;

  @State() visible: boolean = false;

  private showTimer: any;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private parentEl: HTMLElement | null = null;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  connectedCallback() {
    this.parentEl = this.el.parentElement;
    if (this.parentEl) {
      this.parentEl.addEventListener('mouseenter', this.show);
      this.parentEl.addEventListener('mouseleave', this.hide);
      this.parentEl.addEventListener('focusin', this.show);
      this.parentEl.addEventListener('focusout', this.hide);
    }
  }

  disconnectedCallback() {
    if (this.parentEl) {
      this.parentEl.removeEventListener('mouseenter', this.show);
      this.parentEl.removeEventListener('mouseleave', this.hide);
      this.parentEl.removeEventListener('focusin', this.show);
      this.parentEl.removeEventListener('focusout', this.hide);
    }
    this.removeScrollListeners();
    clearTimeout(this.showTimer);
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private getContainingBlock = (el: HTMLElement): HTMLElement | null => {
    let current: Node | null = el;
    while (current) {
      // 1. Cross shadow DOM boundary if parentElement is null but parentNode exists
      let parent: any = current.parentElement;
      if (!parent && current.parentNode) {
        const node = current.parentNode;
        if (node.nodeType === 11 && (node as any).host) { // DOCUMENT_FRAGMENT_NODE (ShadowRoot)
          parent = (node as any).host;
        } else {
          parent = node;
        }
      }

      // 2. Stop traversing if we reach the document root or an invalid node
      if (!parent || parent.nodeType !== 1) { // ELEMENT_NODE
        current = parent;
        continue;
      }

      // 3. Inspect computed styles for elements that override position: fixed
      const style = window.getComputedStyle(parent);
      if (style) {
        const transform = style.transform;
        const perspective = style.perspective;
        const filter = style.filter;
        const backdropFilter = style.backdropFilter || (style as any).webkitBackdropFilter;
        const willChange = style.willChange;
        const contain = style.contain;

        if (
          (transform && transform !== 'none') ||
          (perspective && perspective !== 'none') ||
          (filter && filter !== 'none') ||
          (backdropFilter && backdropFilter !== 'none') ||
          (willChange && (
            willChange.includes('transform') ||
            willChange.includes('perspective') ||
            willChange.includes('filter') ||
            willChange.includes('backdrop-filter')
          )) ||
          (contain && (
            contain.includes('paint') ||
            contain.includes('contain') ||
            contain.includes('layout') ||
            contain.includes('content') ||
            contain.includes('strict')
          ))
        ) {
          return parent;
        }
      }
      current = parent;
    }
    return null;
  };

  private updatePosition = () => {
    if (!this.parentEl) return;
    const parentRect = this.parentEl.getBoundingClientRect();
    
    let offsetLeft = 0;
    let offsetTop = 0;
    const container = this.getContainingBlock(this.el);
    if (container) {
      const containerRect = container.getBoundingClientRect();
      offsetLeft = containerRect.left;
      offsetTop = containerRect.top;
    }

    let top = 0;
    let left = 0;

    switch (this.position) {
      case 'top':
        left = parentRect.left + parentRect.width / 2 - offsetLeft;
        top = parentRect.top - offsetTop;
        break;
      case 'bottom':
        left = parentRect.left + parentRect.width / 2 - offsetLeft;
        top = parentRect.bottom - offsetTop;
        break;
      case 'left':
        left = parentRect.left - offsetLeft;
        top = parentRect.top + parentRect.height / 2 - offsetTop;
        break;
      case 'right':
        left = parentRect.right - offsetLeft;
        top = parentRect.top + parentRect.height / 2 - offsetTop;
        break;
    }

    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
  };

  private show = () => {
    clearTimeout(this.showTimer);
    this.showTimer = setTimeout(() => {
      this.visible = true;
      this.updatePosition();
      this.addScrollListeners();
    }, this.delay);
  };

  private hide = () => {
    clearTimeout(this.showTimer);
    if (this.visible) {
      this.visible = false;
      this.removeScrollListeners();
    }
  };

  private handleScroll = () => {
    this.hide();
  };

  private addScrollListeners() {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('resize', this.handleScroll);
    let parent = this.parentEl;
    while (parent) {
      parent.addEventListener('scroll', this.handleScroll, { passive: true });
      parent = parent.parentElement;
    }
  }

  private removeScrollListeners() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleScroll);
    let parent = this.parentEl;
    while (parent) {
      parent.removeEventListener('scroll', this.handleScroll);
      parent = parent.parentElement;
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    return (
      <Host
        class={{
          'is-visible': this.visible,
        }}
        position={this.position}
        aria-hidden="true"
        role="tooltip"
      >
        <div class="tooltip-bubble">
          {this.content || <slot></slot>}
        </div>
      </Host>
    );
  }
}
