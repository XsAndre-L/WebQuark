import { describe, expect, it } from 'vitest';

import {
  createBufferedTileLayer,
  createRasterTileLayerOptions,
} from '../internals/buffered-tile-layer';
import {
  DEFAULT_TILE_PRELOAD_BUFFER,
  MAX_TILE_PRELOAD_BUFFER,
  normalizeTilePreloadBuffer,
} from '../internals/tile-preload-buffer';

describe('normalizeTilePreloadBuffer', () => {
  it('keeps supported whole tile buffers', () => {
    expect(normalizeTilePreloadBuffer(0)).toBe(0);
    expect(normalizeTilePreloadBuffer(1)).toBe(1);
    expect(normalizeTilePreloadBuffer(3)).toBe(3);
  });

  it('rounds and clamps the tile buffer', () => {
    expect(normalizeTilePreloadBuffer(1.6)).toBe(2);
    expect(normalizeTilePreloadBuffer(-1)).toBe(0);
    expect(normalizeTilePreloadBuffer(10)).toBe(MAX_TILE_PRELOAD_BUFFER);
  });

  it('uses the default for non-finite values', () => {
    expect(normalizeTilePreloadBuffer(Number.NaN)).toBe(DEFAULT_TILE_PRELOAD_BUFFER);
    expect(normalizeTilePreloadBuffer(Number.POSITIVE_INFINITY)).toBe(DEFAULT_TILE_PRELOAD_BUFFER);
  });
});

describe('createBufferedTileLayer', () => {
  it('expands requested bounds by every configured tile ring', () => {
    class TestPoint {
      constructor(
        readonly x: number,
        readonly y: number,
      ) {}

      add([x, y]: [number, number]): TestPoint {
        return new TestPoint(this.x + x, this.y + y);
      }

      subtract([x, y]: [number, number]): TestPoint {
        return new TestPoint(this.x - x, this.y - y);
      }
    }

    class TestBounds {
      constructor(
        readonly min: TestPoint,
        readonly max: TestPoint,
      ) {}
    }

    const layer = {
      _getTiledPixelBounds: () =>
        new TestBounds(new TestPoint(0, 0), new TestPoint(512, 256)),
      _initTile: () => undefined,
      getTileSize: () => new TestPoint(256, 256),
    };
    const leaflet = {
      Bounds: TestBounds,
      tileLayer: () => layer,
    };
    const bufferedLayer = createBufferedTileLayer(
      leaflet as never,
      'https://tiles.example/{z}/{x}/{y}.png',
      {},
      2,
    ) as unknown as typeof layer;

    expect(bufferedLayer._getTiledPixelBounds()).toEqual(
      new TestBounds(new TestPoint(-512, -512), new TestPoint(1024, 768)),
    );
  });

  it('keeps Leaflet mobile defaults in low mode and opts into eager quality updates', () => {
    const low = createRasterTileLayerOptions(0, 19, 0);
    const quality = createRasterTileLayerOptions(0, 19, 2);
    const progressive = createRasterTileLayerOptions(
      0,
      19,
      0,
      'progressive',
    );

    expect(low).not.toHaveProperty('updateWhenIdle');
    expect(low).not.toHaveProperty('updateWhenZooming');
    expect(low).not.toHaveProperty('updateInterval');
    expect(quality).toMatchObject({
      updateInterval: 50,
      updateWhenIdle: false,
      updateWhenZooming: true,
    });
    expect(progressive).toMatchObject({ updateWhenZooming: true });
    expect(progressive).not.toHaveProperty('updateWhenIdle');
    expect(progressive).not.toHaveProperty('updateInterval');
  });

  it('keeps a loaded parent visible when a progressive child tile fails', () => {
    const tiles: Record<string, { active: boolean; current: boolean }> = {
      parent: { active: true, current: false },
      child: { active: false, current: true },
    };
    const layer = {
      _getTiledPixelBounds: () => undefined,
      _initTile: () => undefined,
      _pruneTiles: () => {
        if (tiles.child?.active) delete tiles.parent;
      },
      _tileCoordsToKey: () => 'child',
      _tileReady: (_coords: unknown, _error: unknown, _tile: unknown) => {
        tiles.child.active = true;
        layer._pruneTiles();
      },
      _tiles: tiles,
      _updateOpacity: () => {
        tiles.child.active = true;
        layer._pruneTiles();
      },
      getTileSize: () => ({ x: 256, y: 256 }),
      onAdd: () => layer,
    };
    const leaflet = {
      tileLayer: () => layer,
    };
    const progressiveLayer = createBufferedTileLayer(
      leaflet as never,
      'https://tiles.example/{z}/{x}/{y}.png',
      {},
      0,
      'progressive',
    ) as unknown as typeof layer;
    progressiveLayer.onAdd();

    progressiveLayer._tileReady(
      { x: 0, y: 0, z: 2 } as never,
      new Error('child failed'),
      {} as never,
    );

    expect(tiles.parent).toBeDefined();
    expect(tiles.child.active).toBe(false);

    progressiveLayer._updateOpacity();

    expect(tiles.parent).toBeDefined();
    expect(tiles.child.active).toBe(false);

    progressiveLayer._tileReady(
      { x: 0, y: 0, z: 2 } as never,
      null,
      {} as never,
    );

    expect(tiles.parent).toBeUndefined();
    expect(tiles.child.active).toBe(true);

    progressiveLayer._updateOpacity();

    expect(tiles.child.active).toBe(true);
  });

  it('fails closed when Leaflet does not initialize progressive tile records', () => {
    const layer = {
      _getTiledPixelBounds: () => undefined,
      _initTile: () => undefined,
      _pruneTiles: () => undefined,
      _tileCoordsToKey: () => 'child',
      _tileReady: () => undefined,
      _updateOpacity: () => undefined,
      getTileSize: () => ({ x: 256, y: 256 }),
      onAdd: () => layer,
    };
    const leaflet = {
      tileLayer: () => layer,
    };

    const progressiveLayer = createBufferedTileLayer(
      leaflet as never,
      'https://tiles.example/{z}/{x}/{y}.png',
      {},
      0,
      'progressive',
    ) as unknown as typeof layer;

    expect(() => progressiveLayer.onAdd()).toThrow(
      'Progressive raster loading is not supported by this Leaflet tile layer.',
    );
  });
});
