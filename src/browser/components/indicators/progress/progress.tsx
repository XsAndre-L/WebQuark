import { Component, Prop, h } from '@stencil/core';

import { calculateDynamicFontSize } from '../../../utils/dom';
import type {
  QProgressSize,
  QProgressTone,
  QProgressVariant,
} from './progress.types';

const SVG_SIZE = 120;
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE_PRESETS = new Set(['sm', 'md', 'lg']);

/**
 * Progress indicator with linear and circular presentation variants.
 *
 * @part container - The element carrying progressbar semantics.
 * @part track - The inactive progress track.
 * @part fill - The determinate or indeterminate progress fill.
 * @part label - The visible circular progress label.
 */
@Component({
  tag: 'q-progress',
  styleUrl: 'progress.css',
  shadow: true,
})
export class QProgress {
  /** Percentage clamped from 0 to 100. */
  @Prop() value: number = 0;
  /** Circular labels default to the clamped percentage. */
  @Prop() label?: string;
  /** Replaces the fixed value with an indeterminate animation. */
  @Prop({ reflect: true }) indeterminate: boolean = false;
  /** Optional accessible value description, such as "2 of 6 tasks completed". */
  @Prop({ attribute: 'aria-valuetext' }) ariaValueText: string | null = null;

  @Prop({ reflect: true }) variant: QProgressVariant = 'linear';
  /** Numeric values set a custom pixel size or height. */
  @Prop({ reflect: true }) size: QProgressSize = 'md';
  @Prop({ reflect: true }) tone: QProgressTone = 'primary';

  /** Accessible name for the progressbar. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  render() {
    const finiteValue = Number.isFinite(this.value) ? this.value : 0;
    const clampedValue = Math.min(Math.max(finiteValue, 0), 100);
    const normalizedVariant =
      this.variant === 'circular' ? 'circular' : 'linear';

    return normalizedVariant === 'circular'
      ? this.renderCircular(clampedValue)
      : this.renderLinear(clampedValue);
  }

  private renderLinear(clampedValue: number) {
    return (
      <div
        class="progress-linear"
        style={this.customSizeStyle()}
        {...this.progressAttributes(
          clampedValue,
          this.ariaValueText?.trim() || `${clampedValue}%`,
        )}
        part="container track"
      >
        <span
          class={{
            'progress-linear__fill': true,
            'is-indeterminate': this.indeterminate,
          }}
          style={
            this.indeterminate
              ? undefined
              : { width: `${clampedValue}%` }
          }
          part="fill"
        />
      </div>
    );
  }

  private renderCircular(clampedValue: number) {
    const displayLabel =
      this.label !== undefined ? this.label : `${clampedValue}%`;
    const labelStyle = calculateDynamicFontSize(
      displayLabel,
      'var(--q-progress-font-size, var(--_q-progress-font-size))',
      5,
    );
    const strokeDashoffset = this.indeterminate
      ? CIRCUMFERENCE * 0.75
      : CIRCUMFERENCE - (clampedValue / 100) * CIRCUMFERENCE;

    return (
      <div
        class="progress-circular"
        style={this.customSizeStyle()}
        {...this.progressAttributes(
          clampedValue,
          this.ariaValueText?.trim() || displayLabel,
        )}
        part="container"
      >
        <svg
          class="progress-circular__svg"
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        >
          <g class="progress-circular__rings">
            <circle
              class="progress-circular__track"
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={RADIUS}
              part="track"
            />
            <circle
              class="progress-circular__fill"
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={RADIUS}
              stroke-dasharray={CIRCUMFERENCE}
              stroke-dashoffset={strokeDashoffset}
              part="fill"
            />
          </g>

          {!this.indeterminate && (
            <text
              class="progress-circular__label"
              x="50%"
              y="50%"
              style={labelStyle}
              part="label"
            >
              {displayLabel}
            </text>
          )}
        </svg>
      </div>
    );
  }

  private progressAttributes(
    clampedValue: number,
    accessibleValueText: string,
  ) {
    return {
      role: 'progressbar',
      'aria-label': this.ariaLabel?.trim() || 'Progress',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': this.indeterminate ? undefined : clampedValue,
      'aria-valuetext': this.indeterminate
        ? undefined
        : accessibleValueText,
    };
  }

  private customSizeStyle(): Record<string, string> | undefined {
    if (
      typeof this.size === 'string' &&
      SIZE_PRESETS.has(this.size)
    ) {
      return undefined;
    }

    const numericSize =
      typeof this.size === 'number' ? this.size : Number(this.size);

    if (!Number.isFinite(numericSize)) {
      return undefined;
    }

    return {
      '--_q-progress-custom-size': `${Math.max(0, numericSize)}px`,
    };
  }
}
