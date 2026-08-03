import { describe, expect, it } from 'vitest';

import {
  resolveMapClusterCollisionOffsets,
  type MapClusterCollisionItem,
} from '../internals/cluster-collision';

describe('q-map cross-group cluster collision spacing', () => {
  it('uses 75% of the visible cluster diameter as the collision distance', () => {
    const offsets = resolveMapClusterCollisionOffsets([
      cluster('stores'),
      cluster('merchandisers'),
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

  it('does not separate clusters from the same group', () => {
    const offsets = resolveMapClusterCollisionOffsets([
      cluster('store-one', 'stores'),
      cluster('store-two', 'stores'),
    ]);

    expect(offsets.get('store-one')).toEqual({ x: 0, y: 0 });
    expect(offsets.get('store-two')).toEqual({ x: 0, y: 0 });
  });

  it('does not move different groups that already have enough spacing', () => {
    const offsets = resolveMapClusterCollisionOffsets([
      cluster('stores'),
      { ...cluster('merchandisers'), x: 24 },
    ]);

    expect(offsets.get('stores')).toEqual({ x: 0, y: 0 });
    expect(offsets.get('merchandisers')).toEqual({ x: 0, y: 0 });
  });
});

function cluster(key: string, clusterGroup = key): MapClusterCollisionItem {
  return {
    key,
    clusterGroup,
    x: 0,
    y: 0,
    diameter: 32,
  };
}
