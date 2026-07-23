import { describe, expect, it } from 'vitest';

import {
  DEFAULT_VECTOR_PADDING,
  MAX_VECTOR_PADDING,
  normalizeVectorPadding,
} from '../internals/vector-padding';

describe('vector map padding', () => {
  it('preserves values in the supported range', () => {
    expect(normalizeVectorPadding(0)).toBe(0);
    expect(normalizeVectorPadding(0.35)).toBe(0.35);
    expect(normalizeVectorPadding(MAX_VECTOR_PADDING)).toBe(MAX_VECTOR_PADDING);
  });

  it('clamps finite values to the supported range', () => {
    expect(normalizeVectorPadding(-1)).toBe(0);
    expect(normalizeVectorPadding(1)).toBe(MAX_VECTOR_PADDING);
  });

  it('uses the existing default for non-finite values', () => {
    expect(normalizeVectorPadding(Number.NaN)).toBe(DEFAULT_VECTOR_PADDING);
    expect(normalizeVectorPadding(Number.POSITIVE_INFINITY)).toBe(DEFAULT_VECTOR_PADDING);
  });
});
