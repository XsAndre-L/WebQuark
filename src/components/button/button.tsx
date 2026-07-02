import { Component, Prop, Element, State, Event, EventEmitter, h } from '@stencil/core';
import type { QButtonSize, QButtonType, QButtonVariant } from './button.types';

@Component({
  tag: 'q-button',
  styleUrl: 'button.css',
  shadow: {
    delegatesFocus: true
  },
})
export class QButton {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  @Prop() variant: QButtonVariant = 'primary';
  @Prop() size: QButtonSize = 'md';
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) loading: boolean = false;
  @Prop() type: QButtonType = 'button';
  @Prop({ reflect: true }) expand: boolean = false;
  @Prop() href?: string;
  @Prop() target?: string;
  @Prop() rel?: string;
  @Prop() download?: string;
  @Prop({ reflect: true }) iconOnly?: boolean;

  @Event() qClick!: EventEmitter<MouseEvent>;
  @Event() qFocus!: EventEmitter<FocusEvent>;
  @Event() qBlur!: EventEmitter<FocusEvent>;

  @State() autoIconOnly: boolean = false;

  componentWillLoad() {
    this.checkIconOnly();
  }

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentWillUpdate() {
    this.checkIconOnly();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private checkIconOnly = () => {
    if (!this.el) return;
    const text = this.el.textContent ? this.el.textContent.trim() : '';
    const hasIcon = this.el.querySelector('q-icon') !== null ||
                    this.el.querySelector('[slot="icon-left"]') !== null ||
                    this.el.querySelector('[slot="icon-right"]') !== null;
    this.autoIconOnly = text === '' && hasIcon;
  };

  private handleSlotChange = () => {
    this.checkIconOnly();
  };

  private handleClick = (e: MouseEvent) => {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.qClick.emit(e);
  };

  private handleFocus = (ev: FocusEvent) => {
    this.qFocus.emit(ev);
  };

  private handleBlur = (ev: FocusEvent) => {
    this.qBlur.emit(ev);
  };

  private getResolvedRel(): string | undefined {
    if (this.rel) return this.rel;
    return this.target === '_blank' ? 'noopener noreferrer' : undefined;
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const isLink = this.href !== undefined && this.href !== null && this.href !== '';
    const isBtnDisabled = this.disabled || this.loading;
    const isIcon = this.iconOnly !== undefined ? this.iconOnly : this.autoIconOnly;

    const classes = {
      'btn': true,
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      'is-loading': this.loading,
      'is-disabled': isBtnDisabled,
      'is-expanded': this.expand,
      'is-icon-only': isIcon
    };

    const innerContent = [
      this.loading && <div class="btn-spinner" part="spinner" />,
      <span class="btn-content-wrap" style={{ visibility: this.loading ? 'hidden' : 'visible' }}>
        <slot name="icon-left" onSlotchange={this.handleSlotChange} />
        <span class="btn-label"><slot onSlotchange={this.handleSlotChange} /></span>
        <slot name="icon-right" onSlotchange={this.handleSlotChange} />
      </span>
    ];

    if (isLink) {
      return (
        <a
          class={classes}
          href={this.href}
          target={this.target}
          rel={this.getResolvedRel()}
          download={this.download}
          tabindex={isBtnDisabled ? -1 : undefined}
          aria-disabled={isBtnDisabled ? 'true' : 'false'}
          onClick={this.handleClick}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        >
          {innerContent}
        </a>
      );
    }

    return (
      <button
        class={classes}
        type={this.type}
        disabled={isBtnDisabled}
        aria-busy={this.loading ? 'true' : 'false'}
        onClick={this.handleClick}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
      >
        {innerContent}
      </button>
    );
  }
}

