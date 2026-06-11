import { Component, Prop, h } from '@stencil/core';
import { calculateDynamicFontSize } from '../../utils/dom';

@Component({
  tag: 'q-circular-progress',
  styleUrl: 'q-circular-progress.css',
  shadow: true,
})
export class QCircularProgress {
  @Prop() value: number = 0;
  @Prop() label?: string;
  @Prop() indeterminate: boolean = false;

  render() {
    const size = 120; // Internal SVG viewBox size coordinate
    const radius = 52; // Center radius (leaving safety margin for stroke width)
    const circumference = 2 * Math.PI * radius;
    
    // Clamp progress value between 0 and 100
    const clampedValue = Math.min(Math.max(this.value, 0), 100);
    const strokeDashoffset = this.indeterminate 
      ? circumference * 0.75 // 25% filled for spinner
      : circumference - (clampedValue / 100) * circumference;

    const displayLabel = this.label !== undefined ? this.label : `${clampedValue}%`;

    // Dynamic Font Styling
    const baseFontSize = 'var(--q-progress-font-size, var(--q-font-size-lg, 1.125rem))';
    const textStyle = calculateDynamicFontSize(displayLabel, baseFontSize, 5);

    return (
      <div 
        class={{
          'progress-container': true,
          'is-indeterminate': this.indeterminate
        }}
        role="progressbar"
        aria-valuenow={this.indeterminate ? undefined : clampedValue}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={this.label || 'Circular Progress'}
      >
        <svg class="progress-svg" viewBox={`0 0 ${size} ${size}`}>
          {/* Group rotated -90deg so circles start at 12 o'clock, leaving text unrotated (OSR safe) */}
          <g class="progress-ring-circles">
            {/* Background Inactive Track */}
            <circle
              class="progress-track"
              cx={size / 2}
              cy={size / 2}
              r={radius}
            />
            {/* Foreground Active Ring */}
            <circle
              class="progress-fill"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke-dasharray={circumference}
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
