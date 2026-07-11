import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

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
export class QChip {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  /** Visible label text. Also used in qRemove detail and the remove button accessible name. */
  @Prop() label?: string;
  /** Consumer-provided identifier included in qRemove detail. */
  @Prop() value?: string;
  /** URL to render the chip as a link. Ignored when removable to avoid nested interactive controls. */
  @Prop() href?: string;
  /** Link target used when `href` is set. */
  @Prop() target?: QChipTarget;
  /** Link rel value. Defaults to noopener noreferrer for target="_blank". */
  @Prop() rel?: string;
  /** Download filename or boolean download hint for link chips. */
  @Prop() download?: string;
  /** Visual style of the chip. */
  @Prop({ reflect: true }) variant: QChipVariant = 'neutral';
  /** Chip size. */
  @Prop({ reflect: true }) size: QChipSize = 'md';
  /** Marks the chip as selected. */
  @Prop({ reflect: true }) selected: boolean = false;
  /** Disables interaction and removal. */
  @Prop({ reflect: true }) disabled: boolean = false;
  /** Renders the whole chip as a button when no href is set. Ignored when removable. */
  @Prop({ reflect: true }) clickable: boolean = false;
  /** Adds a remove button. Removable chips render as non-interactive containers to avoid nested controls. */
  @Prop({ reflect: true }) removable: boolean = false;

  /** Emitted when an interactive chip is clicked. */
  @Event() qClick!: EventEmitter<MouseEvent>;
  /** Emitted when the remove button is clicked. */
  @Event() qRemove!: EventEmitter<QChipRemoveDetail>;
  /** Emitted when the interactive chip or remove button receives focus. */
  @Event() qFocus!: EventEmitter<FocusEvent>;
  /** Emitted when the interactive chip or remove button loses focus. */
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
