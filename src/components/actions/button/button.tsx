import { Component, Prop, Element, State, Event, EventEmitter, h } from '@stencil/core';
import type { QButtonLayout, QButtonShape, QButtonSize, QButtonType, QButtonVariant } from './button.types';

@Component({
  tag: 'q-button',
  styleUrl: 'button.css',
  shadow: {
    delegatesFocus: true,
  },
})
export class QButton {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  /** Visual style of the button. */
  @Prop() variant: QButtonVariant = 'primary';
  /** Button size. */
  @Prop() size: QButtonSize = 'md';
  /** Controls the button outline and fixed circular presentation. */
  @Prop({ reflect: true }) shape: QButtonShape = 'default';
  /** Controls whether icon and label content flow inline or stack vertically. */
  @Prop({ reflect: true }) layout: QButtonLayout = 'inline';
  /** Disables interaction and marks the control as unavailable. */
  @Prop({ reflect: true }) disabled: boolean = false;
  /** Shows a spinner and suppresses interaction while work is in progress. */
  @Prop({ reflect: true }) loading: boolean = false;
  /** Native button type used when rendering a `<button>`. */
  @Prop() type: QButtonType = 'button';
  /** Expands the button to fill its container width. */
  @Prop({ reflect: true }) expand: boolean = false;
  /** URL to render the component as a link. */
  @Prop() href?: string;
  /** Link target used when `href` is set. */
  @Prop() target?: string;
  /** Link rel value. Defaults to noopener noreferrer for target="_blank". */
  @Prop() rel?: string;
  /** Download filename or boolean download hint for link buttons. */
  @Prop() download?: string;
  /** Renders compact icon-only spacing. When unset, this is auto-detected from slotted icon content. */
  @Prop({ reflect: true }) iconOnly?: boolean;
  /** Accessible label forwarded to the inner button or anchor. Required for icon-only buttons. */
  @Prop() ariaLabel?: string;

  /** Emitted on click, unless disabled or loading. */
  @Event() qClick!: EventEmitter<MouseEvent>;
  /** Emitted when the inner control receives focus. */
  @Event() qFocus!: EventEmitter<FocusEvent>;
  /** Emitted when the inner control loses focus. */
  @Event() qBlur!: EventEmitter<FocusEvent>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() autoIconOnly: boolean = false;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentWillLoad() {
    this.checkIconOnly();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private checkIconOnly = () => {
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
      [`shape-${this.shape}`]: true,
      [`layout-${this.layout}`]: true,
      'is-disabled': isBtnDisabled,
      'is-expanded': this.expand,
      'is-icon-only': isIcon,
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
          aria-busy={this.loading ? 'true' : 'false'}
          aria-label={this.ariaLabel}
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
        aria-label={this.ariaLabel}
        onClick={this.handleClick}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
      >
        {innerContent}
      </button>
    );
  }
}

