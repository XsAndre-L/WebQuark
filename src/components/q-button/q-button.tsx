import { Component, Prop, Element, State, h } from '@stencil/core';

@Component({
  tag: 'q-button',
  styleUrl: 'q-button.css',
  shadow: {
    delegatesFocus: true
  },
})
export class QButton {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  @Prop() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'text' = 'primary';
  @Prop() size: 'sm' | 'md' | 'lg' = 'md';
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) loading: boolean = false;
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';
  @Prop({ reflect: true }) expand: boolean = false;
  @Prop() href?: string;
  @Prop() target?: string;
  @Prop() download?: string;
  @Prop({ reflect: true }) iconOnly?: boolean;

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
    }
  };

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
          download={this.download}
          tabindex={isBtnDisabled ? -1 : undefined}
          aria-disabled={isBtnDisabled ? 'true' : 'false'}
          onClick={this.handleClick}
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
      >
        {innerContent}
      </button>
    );
  }
}
