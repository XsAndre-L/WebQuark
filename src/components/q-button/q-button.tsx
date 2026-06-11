import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'q-button',
  styleUrl: 'q-button.css',
  shadow: {
    delegatesFocus: true
  },
})
export class QButton {
  @Prop() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'text' = 'primary';
  @Prop() size: 'sm' | 'md' | 'lg' = 'md';
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) loading: boolean = false;
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';
  @Prop({ reflect: true }) expand: boolean = false;
  @Prop() href?: string;
  @Prop() target?: string;
  @Prop() download?: string;

  private handleClick = (e: MouseEvent) => {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  render() {
    const isLink = this.href !== undefined;
    const isBtnDisabled = this.disabled || this.loading;
    
    const classes = {
      'btn': true,
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      'is-loading': this.loading,
      'is-disabled': isBtnDisabled,
      'is-expanded': this.expand
    };

    const innerContent = [
      this.loading && <div class="btn-spinner" part="spinner" />,
      <span class="btn-content-wrap" style={{ visibility: this.loading ? 'hidden' : 'visible' }}>
        <slot name="icon-left" />
        <span class="btn-label"><slot /></span>
        <slot name="icon-right" />
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
