import { describe, expect, it, vi } from 'vitest';

import {
  applyMapBounds,
  getInitialLeafletMapBounds,
  getMapBoundsViscosity,
  resolveMapBounds,
} from '../internals/bounds';

const JOHANNESBURG_BOUNDS = {
  southLatitude: -26.65,
  westLongitude: 27.54,
  northLatitude: -25.75,
  eastLongitude: 28.55,
};

describe('q-map bounds', () => {
  it('accepts object and JSON inputs with the same normalized Leaflet bounds', () => {
    const objectResult = resolveMapBounds(JOHANNESBURG_BOUNDS);
    const jsonResult = resolveMapBounds(JSON.stringify(JOHANNESBURG_BOUNDS));

    expect(objectResult).toEqual(jsonResult);
    expect(objectResult).toMatchObject({ kind: 'valid', bounds: JOHANNESBURG_BOUNDS });
    expect(getInitialLeafletMapBounds(objectResult)).toEqual([
      [JOHANNESBURG_BOUNDS.southLatitude, JOHANNESBURG_BOUNDS.westLongitude],
      [JOHANNESBURG_BOUNDS.northLatitude, JOHANNESBURG_BOUNDS.eastLongitude],
    ]);
  });

  it.each([undefined, '', '   '])('treats an absent input %# as an intentional clear', input => {
    const result = resolveMapBounds(input);
    expect(result).toEqual({ kind: 'clear' });
    expect(getInitialLeafletMapBounds(result)).toBeUndefined();
  });

  it.each([
    '{',
    '{}',
    { ...JOHANNESBURG_BOUNDS, southLatitude: Number.NaN },
    { ...JOHANNESBURG_BOUNDS, eastLongitude: 181 },
    { ...JOHANNESBURG_BOUNDS, southLatitude: JOHANNESBURG_BOUNDS.northLatitude },
    { ...JOHANNESBURG_BOUNDS, westLongitude: JOHANNESBURG_BOUNDS.eastLongitude },
  ])('distinguishes malformed non-empty input %# from a clear', input => {
    const result = resolveMapBounds(input);
    expect(result.kind).toBe('invalid');
    expect(getInitialLeafletMapBounds(result)).toBeUndefined();
  });

  it('preserves the last applied boundary when a runtime update is invalid', () => {
    const setMaxBounds = vi.fn();
    const map = { options: {}, setMaxBounds };

    expect(applyMapBounds(map, resolveMapBounds(JOHANNESBURG_BOUNDS), 1)).toBe(true);
    expect(applyMapBounds(map, resolveMapBounds('{'), 0.25)).toBe(false);

    expect(setMaxBounds).toHaveBeenCalledTimes(1);
    expect(setMaxBounds).toHaveBeenCalledWith([
      [JOHANNESBURG_BOUNDS.southLatitude, JOHANNESBURG_BOUNDS.westLongitude],
      [JOHANNESBURG_BOUNDS.northLatitude, JOHANNESBURG_BOUNDS.eastLongitude],
    ]);
    expect(map.options).toEqual({ maxBoundsViscosity: 0.25 });
  });

  it('removes the boundary only for an intentional clear', () => {
    const setMaxBounds = vi.fn();
    const map = { options: {}, setMaxBounds };

    applyMapBounds(map, resolveMapBounds(undefined), 1);
    expect(setMaxBounds).toHaveBeenCalledWith(undefined);
  });

  it.each([
    [-1, 0],
    [0, 0],
    [0.5, 0.5],
    [1, 1],
    [2, 1],
    [Number.NaN, 1],
  ])('normalizes a viscosity of %s to %s', (value, expected) => {
    expect(getMapBoundsViscosity(value)).toBe(expected);
  });
});
