/**
 * @fileoverview Mathematical utility functions for WebQuark.
 */

/**
 * Clamps a number value between an optional minimum and maximum range boundary.
 * @param value The value to clamp.
 * @param min The optional lower bound limit.
 * @param max The optional upper bound limit.
 */
export function clamp(value: number, min?: number, max?: number): number {
  let clamped = value;
  if (min !== undefined && min !== null) {
    clamped = Math.max(min, clamped);
  }
  if (max !== undefined && max !== null) {
    clamped = Math.min(max, clamped);
  }
  return clamped;
}
