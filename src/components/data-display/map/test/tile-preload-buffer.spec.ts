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

    expect(low).not.toHaveProperty('updateWhenIdle');
    expect(low).not.toHaveProperty('updateWhenZooming');
    expect(low).not.toHaveProperty('updateInterval');
    expect(quality).toMatchObject({
      updateInterval: 50,
      updateWhenIdle: false,
      updateWhenZooming: true,
    });
  });
});
