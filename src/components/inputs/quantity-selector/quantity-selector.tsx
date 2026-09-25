import type { QControlSize } from '../../../theme/tokens';
import { Component, Prop, State, Event, EventEmitter, h, Watch } from '@stencil/core';

import type { QQuantitySelectorVariant } from './quantity-selector.types';
import {
  clampQuantityValue,
  getQuantityInputCharCount,
  hasQuantityBound,
  isWithinQuantityBounds,
  parseQuantityInput,
  reconcileQuantityInput,
  sanitizeQuantityInput,
  stepQuantityValue,
  toFiniteQuantity,
} from './internals/number-value';

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
  @Prop({ mutable: true }) value: number = 0;
  @Prop() min?: number;
  @Prop() max?: number;
  @Prop() step: number = 1;

  @Prop() size: QControlSize = 'inherit';
  @Prop({ reflect: true }) variant: QQuantitySelectorVariant = 'horizontal';

  @Event() qChange!: EventEmitter<number>;

  @Event() qFocus!: EventEmitter<FocusEvent>;

  /** Emitted when the input loses focus, after the value is reconciled. */
  @Event() qBlur!: EventEmitter<FocusEvent>;

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
    const charCount = getQuantityInputCharCount(this.value, { min: this.min, max: this.max });
    return `calc(${charCount} * var(--q-quantity-selector-char-width, 1ch) + var(--q-quantity-selector-input-padding, 16px))`;
  }

  private increment = () => {
    const next = stepQuantityValue(this.value, this.step, 1, { min: this.min, max: this.max });
    this.value = next;
    this.inputValue = String(next);
    this.qChange.emit(this.value);
  };

  private decrement = () => {
    const next = stepQuantityValue(this.value, this.step, -1, { min: this.min, max: this.max });
    this.value = next;
    this.inputValue = String(next);
    this.qChange.emit(this.value);
  };

  private handleInput = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    const val = sanitizeQuantityInput(target.value);

    target.value = val;
    this.inputValue = val;

    const parsed = parseQuantityInput(val);
    if (parsed !== undefined && isWithinQuantityBounds(parsed, { min: this.min, max: this.max })) {
      if (this.value !== parsed) {
        this.value = parsed;
        this.qChange.emit(this.value);
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
    } else if (ev.key === 'Home' && hasQuantityBound(this.min)) {
      ev.preventDefault();
      this.value = clampQuantityValue(this.min, { min: this.min, max: this.max });
      this.inputValue = String(this.value);
      this.qChange.emit(this.value);
    } else if (ev.key === 'End' && hasQuantityBound(this.max)) {
      ev.preventDefault();
      this.value = clampQuantityValue(this.max, { min: this.min, max: this.max });
      this.inputValue = String(this.value);
      this.qChange.emit(this.value);
    }
  };

  private reconcileValue() {
    const clamped = reconcileQuantityInput(this.inputValue, { min: this.min, max: this.max });
    this.inputValue = String(clamped);
    if (this.value !== clamped) {
      this.value = clamped;
      this.qChange.emit(this.value);
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const finiteValue = toFiniteQuantity(this.value);
    const hasFiniteValue = Number.isFinite(this.value);
    const isMinDisabled = hasFiniteValue && hasQuantityBound(this.min) && finiteValue <= this.min;
    const isMaxDisabled = hasFiniteValue && hasQuantityBound(this.max) && finiteValue >= this.max;

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
          [`size-${this.size}`]: true,
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
          aria-valuemin={hasQuantityBound(this.min) ? String(this.min) : undefined}
          aria-valuemax={hasQuantityBound(this.max) ? String(this.max) : undefined}
          aria-label="Quantity"
          style={{ width: calculatedWidth }}
          part="input"
        />
        {this.variant === 'vertical' ? decBtn : incBtn}
      </div>
    );
  }
}
