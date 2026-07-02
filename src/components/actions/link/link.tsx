import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

import type { QLinkTarget, QLinkUnderline, QLinkVariant } from './link.types';

@Component({
  tag: 'q-link',
  styleUrl: 'link.css',
  shadow: true,
})
export class QLink {
  @Prop() href?: string;
  @Prop() url?: string;
  @Prop() mailto?: string;
  @Prop() tel?: string;
  @Prop() target?: QLinkTarget;
  @Prop() rel?: string;
  @Prop() download?: string;
  @Prop() label?: string;
  @Prop({ reflect: true }) variant: QLinkVariant = 'default';
  @Prop({ reflect: true }) underline: QLinkUnderline = 'hover';
  @Prop({ reflect: true }) external: boolean = false;
  @Prop({ reflect: true }) disabled: boolean = false;

  @Event() qClick!: EventEmitter<MouseEvent>;
  @Event() qFocus!: EventEmitter<FocusEvent>;
  @Event() qBlur!: EventEmitter<FocusEvent>;

  private get resolvedHref(): string {
    if (this.href) return this.href;
    if (this.url) return this.url;
    if (this.mailto) return `mailto:${this.mailto}`;
    if (this.tel) return `tel:${this.tel}`;
    return '';
  }

  private get resolvedRel(): string | undefined {
    if (this.rel) return this.rel;
    if (this.target === '_blank') return 'noopener noreferrer';
    return undefined;
  }

  private handleClick = (ev: MouseEvent) => {
    if (this.disabled || !this.resolvedHref) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    this.qClick.emit(ev);
  };

  private handleFocus = (ev: FocusEvent) => {
    this.qFocus.emit(ev);
  };

  private handleBlur = (ev: FocusEvent) => {
    this.qBlur.emit(ev);
  };

  render() {
    const href = this.disabled ? undefined : this.resolvedHref || undefined;
    const showExternal = this.external || this.target === '_blank';

    return (
      <a
        class={{
          'link': true,
          [`variant-${this.variant}`]: true,
          [`underline-${this.underline}`]: true,
          'is-disabled': this.disabled,
        }}
        href={href}
        target={this.disabled ? undefined : this.target}
        rel={this.disabled ? undefined : this.resolvedRel}
        download={this.disabled ? undefined : this.download}
        aria-disabled={this.disabled ? 'true' : 'false'}
        tabindex={this.disabled ? -1 : undefined}
        part="link"
        onClick={this.handleClick}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
      >
        <slot name="icon-left" />
        <span class="link-label" part="label">
          <slot>{this.label}</slot>
        </span>
        <slot name="icon-right" />
        {showExternal && (
          <svg class="external-icon" part="external-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 3h7v7" />
            <path d="M10 14L21 3" />
            <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
          </svg>
        )}
      </a>
    );
  }
}
