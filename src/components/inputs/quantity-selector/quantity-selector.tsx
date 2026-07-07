import { Component, Prop, State, Event, EventEmitter, h, Watch } from '@stencil/core';

import type { QQuantitySelectorVariant } from './quantity-selector.types';

/**
 * Numeric quantity control with increment/decrement buttons and a bounded editable value.
 * @part input - Editable numeric value field.
 */
@Component({
  tag: 'q-quantity-selector',
  styleUrl: 'quantity-selector.css',
  shadow: true,
})
export class QQuantitySelector {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /** The current quantity value. */
  @Prop({ mutable: true }) value: number = 0;

  /** The increment/decrement step amount. */
  @Prop() step: number = 1;

  /** Minimum allowed value limit (optional). */
  @Prop() min?: number;

  /** Maximum allowed value limit (optional). */
  @Prop() max?: number;

  /** Layout alignment variants: 'horizontal' or 'vertical'. */
  @Prop({ reflect: true }) variant: QQuantitySelectorVariant = 'horizontal';

  /** Emitted when the quantity value changes. */
  @Event() qChange!: EventEmitter<number>;

  /** Emitted when the input receives focus. */
  @Event() qFocus!: EventEmitter<FocusEvent>;

  /** Emitted when the input loses focus, after the value is reconciled. */
  @Event() qBlur!: EventEmitter<FocusEvent>;

  /** Emitted when the quantity selector is clicked. */
  @Event() qClick!: EventEmitter<MouseEvent>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() inputValue: string = '0';

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('value')
  watchValue(newValue: number) {
    if (newValue !== parseFloat(this.inputValue)) {
      this.inputValue = Number.isFinite(newValue) ? String(newValue) : '0';
    }
  }

  componentWillLoad() {
    this.inputValue = Number.isFinite(this.value) ? String(this.value) : '0';
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private getCalculatedWidth(): string {
    const hasMin = this.min !== undefined && this.min !== null;
    const hasMax = this.max !== undefined && this.max !== null;

    let charCount = 3;

    if (hasMin || hasMax) {
      charCount = Math.max(
        3,
        this.min?.toString().length ?? 0,
        this.max?.toString().length ?? 0
      );
    } else {
      charCount = Math.max(3, this.value?.toString().length ?? 0);
    }

    return `calc(${charCount} * var(--q-quantity-selector-char-width, 1ch) + var(--q-quantity-selector-input-padding, 16px))`;
  }

  private increment = () => {
    const current = Number.isFinite(this.value) ? this.value : 0;
    let next = current + this.step;
    if (this.max !== undefined && this.max !== null) {
      next = Math.min(this.max, next);
    }
    if (this.min !== undefined && this.min !== null) {
      next = Math.max(this.min, next);
    }
    this.value = next;
    this.inputValue = String(next);
    this.qChange.emit(this.value);
  };

  private decrement = () => {
    const current = Number.isFinite(this.value) ? this.value : 0;
    let next = current - this.step;
    if (this.min !== undefined && this.min !== null) {
      next = Math.max(this.min, next);
    }
    if (this.max !== undefined && this.max !== null) {
      next = Math.min(this.max, next);
    }
    this.value = next;
    this.inputValue = String(next);
    this.qChange.emit(this.value);
  };

  private handleInput = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    let val = target.value;

    // Sanitize input to only allow numbers, minus sign, and decimal point
    val = val.replace(/[^0-9.-]/g, '');

    // Handle minus sign position
    if (val.startsWith('-')) {
      val = '-' + val.slice(1).replace(/-/g, '');
    } else {
      val = val.replace(/-/g, '');
    }

    // Handle decimal points
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }

    target.value = val;
    this.inputValue = val;

    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      const isAboveMin = this.min === undefined || this.min === null || parsed >= this.min;
      const isBelowMax = this.max === undefined || this.max === null || parsed <= this.max;
      if (isAboveMin && isBelowMax) {
        if (this.value !== parsed) {
          this.value = parsed;
          this.qChange.emit(this.value);
        }
      }
    }
  };

  private handleBlur = (ev: FocusEvent) => {
    this.reconcileValue();
    this.qBlur.emit(ev);
  };

  private handleFocus = (ev: FocusEvent) => {
    this.qFocus.emit(ev);
  };

  private handleClick = (ev: MouseEvent) => {
    this.qClick.emit(ev);
  };

  private handleChange = () => {
    this.reconcileValue();
  };

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.increment();
    } else if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      this.decrement();
    } else if (ev.key === 'Home' && this.min !== undefined && this.min !== null) {
      ev.preventDefault();
      this.value = this.min;
      this.inputValue = String(this.min);
      this.qChange.emit(this.value);
    } else if (ev.key === 'End' && this.max !== undefined && this.max !== null) {
      ev.preventDefault();
      this.value = this.max;
      this.inputValue = String(this.max);
      this.qChange.emit(this.value);
    }
  };

  private reconcileValue() {
    let parsed = parseFloat(this.inputValue);
    if (isNaN(parsed)) {
      if (this.min !== undefined && this.min !== null) {
        parsed = this.min;
      } else if (this.max !== undefined && this.max !== null) {
        parsed = Math.min(0, this.max);
      } else {
        parsed = 0;
      }
    }

    let clamped = parsed;
    if (this.min !== undefined && this.min !== null) {
      clamped = Math.max(this.min, clamped);
    }
    if (this.max !== undefined && this.max !== null) {
      clamped = Math.min(this.max, clamped);
    }

    this.inputValue = String(clamped);
    if (this.value !== clamped) {
      this.value = clamped;
      this.qChange.emit(this.value);
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const hasFiniteValue = Number.isFinite(this.value);
    const isMinDisabled = hasFiniteValue && this.min !== undefined && this.min !== null && this.value <= this.min;
    const isMaxDisabled = hasFiniteValue && this.max !== undefined && this.max !== null && this.value >= this.max;

    const decBtn = (
      <button type="button" class="quantity-btn quantity-btn-decrement" onClick={this.decrement} disabled={isMinDisabled} aria-label="Decrement quantity">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    );

    const incBtn = (
      <button type="button" class="quantity-btn quantity-btn-increment" onClick={this.increment} disabled={isMaxDisabled} aria-label="Increment quantity">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    );

    const calculatedWidth = this.variant === 'horizontal' ? this.getCalculatedWidth() : '100%';

    return (
      <div
        class={{
          'quantity-selector': true,
          [`variant-${this.variant}`]: true,
        }}
        onClick={this.handleClick}
      >
        {this.variant === 'vertical' ? incBtn : decBtn}
        <input
          type="text"
          class="quantity-input"
          value={this.inputValue}
          onInput={this.handleInput}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          role="spinbutton"
          aria-valuenow={hasFiniteValue ? String(this.value) : undefined}
          aria-valuemin={this.min !== undefined && this.min !== null ? String(this.min) : undefined}
          aria-valuemax={this.max !== undefined && this.max !== null ? String(this.max) : undefined}
          aria-label="Quantity"
          style={{ width: calculatedWidth }}
          part="input"
        />
        {this.variant === 'vertical' ? decBtn : incBtn}
      </div>
    );
  }
}
