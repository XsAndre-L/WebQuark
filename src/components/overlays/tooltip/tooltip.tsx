import { Component, Prop, State, Element, h, Host } from '@stencil/core';

import type { QTooltipPosition } from './tooltip.types';
import { ensureTooltipDescribedBy, removeTooltipDescribedBy } from './internals/aria';
import { getTooltipPosition } from './internals/positioning';
import { addTooltipScrollListeners, removeTooltipScrollListeners } from './internals/scroll-listeners';

let tooltipId = 0;

/**
 * Non-interactive tooltip attached to its immediate parent element.
 * @slot - Tooltip content used when `content` is not supplied.
 */
@Component({
  tag: 'q-tooltip',
  styleUrl: 'tooltip.css',
  shadow: true,
})
export class QTooltip {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  /**
   * The text content to display inside the tooltip.
   */
  @Prop() content?: string;

  /**
   * The placement position of the tooltip relative to its trigger parent.
   * Options: 'top', 'bottom', 'left', 'right'
   */
  @Prop({ reflect: true }) position: QTooltipPosition = 'top';

  /**
   * The delay in milliseconds before the tooltip shows up.
   */
  @Prop() delay: number = 200;

  @State() visible: boolean = false;

  private showTimer?: ReturnType<typeof setTimeout>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private parentEl: HTMLElement | null = null;
  private describedByAdded = false;
  private tooltipId = '';

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  connectedCallback() {
    this.parentEl = this.el.parentElement;
    if (this.parentEl) {
      this.syncAriaDescribedBy();
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
      this.removeAriaDescribedBy();
    }
    this.removeScrollListeners();
    clearTimeout(this.showTimer);
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private updatePosition = () => {
    if (!this.parentEl) return;
    const { left, top } = getTooltipPosition(this.el, this.parentEl, this.position);

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

  private syncAriaDescribedBy() {
    if (!this.parentEl) return;

    const result = ensureTooltipDescribedBy({
      host: this.el,
      trigger: this.parentEl,
      fallbackId: `q-tooltip-${++tooltipId}`,
    });
    this.tooltipId = result.tooltipId;
    this.describedByAdded = result.added;
  }

  private removeAriaDescribedBy() {
    removeTooltipDescribedBy({
      trigger: this.parentEl,
      tooltipId: this.tooltipId,
      added: this.describedByAdded,
    });
    this.describedByAdded = false;
  }

  private addScrollListeners() {
    addTooltipScrollListeners(this.parentEl, this.handleScroll);
  }

  private removeScrollListeners() {
    removeTooltipScrollListeners(this.parentEl, this.handleScroll);
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    return (
      <Host
        class={{
          'is-visible': this.visible,
        }}
        aria-hidden={this.visible ? 'false' : 'true'}
        role="tooltip"
      >
        <div class="tooltip-bubble">
          {this.content || <slot></slot>}
        </div>
      </Host>
    );
  }
}
