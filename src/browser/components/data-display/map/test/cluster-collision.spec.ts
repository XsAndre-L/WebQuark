import { describe, expect, it } from 'vitest';

import {
  resolveMapMarkerCollisionOffsets,
  type MapMarkerCollisionItem,
} from '../internals/cluster-collision';

describe('q-map marker collision spacing', () => {
  it('uses 75% of the visible item diameter as the collision distance', () => {
    const offsets = resolveMapMarkerCollisionOffsets([
      item('stores'),
      item('merchandisers'),
    ]);
    const stores = offsets.get('stores');
    const merchandisers = offsets.get('merchandisers');
    expect(stores && merchandisers).toBeTruthy();

    const centerDistance = stores && merchandisers
      ? Math.hypot(
          merchandisers.x - stores.x,
          merchandisers.y - stores.y,
        )
      : 0;
    expect(centerDistance).toBeCloseTo(24, 1);
    expect(centerDistance).toBeLessThan(32);
  });

  it('separates every overlapping item without a group exemption', () => {
    const offsets = resolveMapMarkerCollisionOffsets([
      item('store-one'),
      item('store-two'),
    ]);

    expect(offsets.get('store-one')).not.toEqual({ x: 0, y: 0 });
    expect(offsets.get('store-two')).not.toEqual({ x: 0, y: 0 });
  });

  it('does not move items that already have enough spacing', () => {
    const offsets = resolveMapMarkerCollisionOffsets([
      item('stores'),
      { ...item('merchandisers'), x: 24 },
    ]);

    expect(offsets.get('stores')).toEqual({ x: 0, y: 0 });
    expect(offsets.get('merchandisers')).toEqual({ x: 0, y: 0 });
  });
});

function item(key: string): MapMarkerCollisionItem {
  return {
    key,
    x: 0,
    y: 0,
    diameter: 32,
  };
}
