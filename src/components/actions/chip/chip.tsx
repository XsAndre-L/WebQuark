import { Component, Event, EventEmitter, Mixin, Prop, h } from '@stencil/core';

import { withActionLabel, withActionProps } from '../action.props';
import type { QChipRemoveDetail, QChipSize, QChipTarget, QChipVariant } from './chip.types';

/**
 * Compact label, link, filter, or removable token.
 * @slot - Chip label text. If using this for visible text on a removable chip, also set `label` for the remove button accessible name.
 * @slot icon-left - Content placed before the label.
 * @slot icon-right - Content placed after the label.
 * @part chip - Root chip element.
 * @part label - Chip label wrapper.
 * @part remove-button - Remove action button.
 * @part remove-icon - Remove action icon.
 */
@Component({
  tag: 'q-chip',
  styleUrl: 'chip.css',
  shadow: {
    delegatesFocus: true,
  },
})
export class QChip extends Mixin(withActionProps, withActionLabel) {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  /** Included in `qRemove` detail. */
  @Prop() value?: string;

  @Prop({ reflect: true }) variant: QChipVariant = 'neutral';
  @Prop({ reflect: true }) size: QChipSize = 'md';

  /** Renders a native button when `href` is empty and `removable` is false. */
  @Prop({ reflect: true }) clickable: boolean = false;
  /** Adds a remove button and prevents the rest of the chip from being interactive. */
  @Prop({ reflect: true }) removable: boolean = false;

  /** Maps to `aria-current="page"` for links and `aria-pressed` for buttons. */
  @Prop({ reflect: true }) selected: boolean = false;

  @Prop() target?: QChipTarget;

  @Event() qClick!: EventEmitter<MouseEvent>;
  @Event() qRemove!: EventEmitter<QChipRemoveDetail>;
  /** Emitted when the chip action or remove button receives focus. */
  @Event() qFocus!: EventEmitter<FocusEvent>;
  /** Emitted when the chip action or remove button loses focus. */
  @Event() qBlur!: EventEmitter<FocusEvent>;

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private get hasHref(): boolean {
    return this.href !== undefined && this.href !== null && this.href.trim() !== '';
  }

  // Removable chips keep the remove button as the only interactive control so we never nest a button inside an anchor/button.
  private get usesAnchor(): boolean {
    return this.hasHref && !this.removable;
  }

  private get usesButton(): boolean {
    return this.clickable && !this.removable && !this.usesAnchor;
  }

  private get isWholeChipInteractive(): boolean {
    return this.usesAnchor || this.usesButton;
  }

  private get resolvedRel(): string | undefined {
    if (this.rel) return this.rel;
    return this.target === '_blank' ? 'noopener noreferrer' : undefined;
  }

  private get removeLabel(): string {
    const label = this.label?.trim();
    return label ? `Remove ${label}` : 'Remove chip';
  }

  private buildClassMap() {
    return {
      'chip': true,
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      'is-selected': this.selected,
      'is-disabled': this.disabled,
      'is-interactive': this.isWholeChipInteractive,
      'is-removable': this.removable,
    };
  }

  private buildRemoveDetail(): QChipRemoveDetail {
    return {
      value: this.value,
      label: this.label,
    };
  }

  private handleClick = (ev: MouseEvent) => {
    if (this.disabled) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    this.qClick.emit(ev);
  };

  private handleRemove = (ev: MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();

    if (this.disabled) return;

    this.qRemove.emit(this.buildRemoveDetail());
  };

  private handleFocus = (ev: FocusEvent) => {
    this.qFocus.emit(ev);
  };

  private handleBlur = (ev: FocusEvent) => {
    this.qBlur.emit(ev);
  };

  private renderRemoveAction() {
    if (!this.removable) return null;

    return (
      <button
        class="remove-button"
        type="button"
        aria-label={this.removeLabel}
        disabled={this.disabled}
        part="remove-button"
        onClick={this.handleRemove}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
      >
        <svg class="remove-icon" viewBox="0 0 16 16" aria-hidden="true" part="remove-icon">
          <path d="M4.5 4.5l7 7" />
          <path d="M11.5 4.5l-7 7" />
        </svg>
      </button>
    );
  }

  private renderContent() {
    return [
      <slot name="icon-left" />,
      <span class="chip-label" part="label">
        <slot>{this.label}</slot>
      </span>,
      <slot name="icon-right" />,
      this.renderRemoveAction(),
    ];
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const classes = this.buildClassMap();

    if (this.usesAnchor) {
      return (
        <a
          class={classes}
          href={this.disabled ? undefined : this.href}
          target={this.disabled ? undefined : this.target}
          rel={this.disabled ? undefined : this.resolvedRel}
          download={this.disabled ? undefined : this.download}
          aria-current={this.selected ? 'page' : undefined}
          aria-disabled={this.disabled ? 'true' : 'false'}
          tabindex={this.disabled ? -1 : undefined}
          part="chip"
          onClick={this.handleClick}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        >
          {this.renderContent()}
        </a>
      );
    }

    if (this.usesButton) {
      return (
        <button
          class={classes}
          type="button"
          disabled={this.disabled}
          aria-pressed={this.selected ? 'true' : 'false'}
          part="chip"
          onClick={this.handleClick}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        >
          {this.renderContent()}
        </button>
      );
    }

    return (
      <span class={classes} aria-disabled={this.disabled ? 'true' : undefined} part="chip">
        {this.renderContent()}
      </span>
    );
  }
}
