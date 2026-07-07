import { Component, Prop, h } from '@stencil/core';
import { calculateDynamicFontSize } from '../../../utils/dom';
import type { QCircularProgressSize } from './circular-progress.types';

const SVG_SIZE = 120;
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular progress indicator for determinate percentages or indeterminate loading states.
 */
@Component({
  tag: 'q-circular-progress',
  styleUrl: 'circular-progress.css',
  shadow: true,
})
export class QCircularProgress {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /** Progress percentage from 0 to 100; values outside that range are clamped. */
  @Prop() value: number = 0;

  /** Optional visible center text. Defaults to the clamped percentage. */
  @Prop() label?: string;

  /** Accessible name for the progressbar. */
  @Prop() ariaLabel?: string;

  /** Shows a spinning indeterminate state instead of a fixed progress value. */
  @Prop({ reflect: true }) indeterminate: boolean = false;

  /** Visual size preset for the SVG, stroke width, and label text. */
  @Prop({ reflect: true }) size: QCircularProgressSize = 'md';

  // ===================== [6] RENDER (Visual Template Only) =====================
  render() {
    // Clamp progress value between 0 and 100
    const clampedValue = Math.min(Math.max(this.value, 0), 100);
    const strokeDashoffset = this.indeterminate
      ? CIRCUMFERENCE * 0.75 // 25% filled for spinner
      : CIRCUMFERENCE - (clampedValue / 100) * CIRCUMFERENCE;

    const displayLabel = this.label !== undefined ? this.label : `${clampedValue}%`;

    // Dynamic Font Styling
    const baseFontSize = 'var(--q-progress-font-size, var(--q-font-size-lg, 1rem))';
    const textStyle = calculateDynamicFontSize(displayLabel, baseFontSize, 5);

    return (
      <div
        class="progress-container"
        role="progressbar"
        aria-valuenow={this.indeterminate ? undefined : clampedValue}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuetext={this.indeterminate ? undefined : String(displayLabel)}
        aria-label={this.ariaLabel || 'Circular Progress'}
      >
        <svg class="progress-svg" viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
          {/* Group rotated -90deg so circles start at 12 o'clock, leaving text unrotated (OSR safe) */}
          <g class="progress-ring-circles">
            {/* Background Inactive Track */}
            <circle
              class="progress-track"
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={RADIUS}
            />
            {/* Foreground Active Ring */}
            <circle
              class="progress-fill"
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={RADIUS}
              stroke-dasharray={CIRCUMFERENCE}
              stroke-dashoffset={strokeDashoffset}
            />
          </g>
          {/* Centered Label text (rendered horizontally without rotation vectors) */}
          {!this.indeterminate && (
            <text
              class="progress-text"
              x="50%"
              y="50%"
              style={textStyle}
            >
              {displayLabel}
            </text>
          )}
        </svg>
      </div>
    );
  }
}
