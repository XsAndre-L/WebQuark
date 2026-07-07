import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

import type { QChipRemoveDetail, QChipSize, QChipTarget, QChipVariant } from './chip.types';

@Component({
  tag: 'q-chip',
  styleUrl: 'chip.css',
  shadow: {
    delegatesFocus: true
  },
})
export class QChip {
  @Prop() label?: string;
  @Prop() value?: string;
  @Prop() href?: string;
  @Prop() target?: QChipTarget;
  @Prop() rel?: string;
  @Prop() download?: string;
  @Prop({ reflect: true }) variant: QChipVariant = 'neutral';
  @Prop({ reflect: true }) size: QChipSize = 'md';
  @Prop({ reflect: true }) selected: boolean = false;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) clickable: boolean = false;
  @Prop({ reflect: true }) removable: boolean = false;

  @Event() qClick!: EventEmitter<MouseEvent>;
  @Event() qRemove!: EventEmitter<QChipRemoveDetail>;
  @Event() qFocus!: EventEmitter<FocusEvent>;
  @Event() qBlur!: EventEmitter<FocusEvent>;

  private get hasHref(): boolean {
    return this.href !== undefined && this.href !== null && this.href.trim() !== '';
  }

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
    if (this.disabled || !this.isWholeChipInteractive) {
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
