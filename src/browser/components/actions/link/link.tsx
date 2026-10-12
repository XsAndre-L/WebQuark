import { Component, Event, EventEmitter, Mixin, Prop, h } from '@stencil/core';

import { withActionLabel, withActionProps } from '../action.props';
import type { QLinkTarget, QLinkUnderline, QLinkVariant } from './link.types';

/**
 * Inline link with disabled handling, external-link affordances, and optional icon slots.
 * @slot - Link text. Falls back to the `label` prop.
 * @slot icon-left - Content placed before the label.
 * @slot icon-right - Content placed after the label.
 * @part link - Native anchor element.
 * @part label - Link label wrapper.
 * @part external-icon - External-link indicator icon.
 */
@Component({
  tag: 'q-link',
  styleUrl: 'link.css',
  shadow: true,
})
export class QLink extends Mixin(withActionProps, withActionLabel) {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  @Prop({ reflect: true }) variant: QLinkVariant = 'default';
  @Prop({ reflect: true }) underline: QLinkUnderline = 'hover';

  /** @deprecated Use href. Used when href is empty or unset. */
  @Prop() url?: string;
  /** Generates a `mailto:` URL when `href` and `url` are unset. */
  @Prop() mailto?: string;
  /** Generates a `tel:` URL when higher-priority destinations are unset. */
  @Prop() tel?: string;
  @Prop() target?: QLinkTarget;
  /** Shows an external-link cue and supplies a safe default `rel`. */
  @Prop({ reflect: true }) external: boolean = false;

  /** Emitted when the link is clicked and not disabled. */
  @Event() qClick!: EventEmitter<MouseEvent>;
  @Event() qFocus!: EventEmitter<FocusEvent>;
  @Event() qBlur!: EventEmitter<FocusEvent>;

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private get resolvedHref(): string {
    if (this.href) return this.href;
    if (this.url) return this.url;
    if (this.mailto) return `mailto:${this.mailto}`;
    if (this.tel) return `tel:${this.tel}`;
    return '';
  }

  private get resolvedRel(): string | undefined {
    if (this.rel) return this.rel;
    if (this.target === '_blank' || this.external) return 'noopener noreferrer';
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

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const href = this.disabled ? undefined : this.resolvedHref || undefined;
    const showExternal = this.external || this.target === '_blank';
    const externalText = this.target === '_blank' ? 'opens in new tab' : 'external link';

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
          <span class="external-affordance">
            <svg class="external-icon" part="external-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 3h7v7" />
              <path d="M10 14L21 3" />
              <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
            <span class="visually-hidden">({externalText})</span>
          </span>
        )}
      </a>
    );
  }
}
