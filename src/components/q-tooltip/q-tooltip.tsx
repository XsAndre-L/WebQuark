import { Component, Prop, State, Element, h, Host } from '@stencil/core';

@Component({
  tag: 'q-tooltip',
  styleUrl: 'q-tooltip.css',
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
  @Prop() position: 'top' | 'bottom' | 'left' | 'right' = 'top';

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

  private updatePosition = () => {
    if (!this.parentEl) return;
    const parentRect = this.parentEl.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (this.position) {
      case 'top':
        left = parentRect.left + parentRect.width / 2;
        top = parentRect.top;
        break;
      case 'bottom':
        left = parentRect.left + parentRect.width / 2;
        top = parentRect.bottom;
        break;
      case 'left':
        left = parentRect.left;
        top = parentRect.top + parentRect.height / 2;
        break;
      case 'right':
        left = parentRect.right;
        top = parentRect.top + parentRect.height / 2;
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
