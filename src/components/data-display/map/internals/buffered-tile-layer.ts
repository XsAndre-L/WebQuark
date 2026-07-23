import type * as Leaflet from 'leaflet';

type LeafletModule = typeof import('leaflet');

interface TileLayerWithPrivateBounds extends Leaflet.TileLayer {
  _getTiledPixelBounds(center: Leaflet.LatLng): Leaflet.Bounds;
}

export function createRasterTileLayerOptions(
  minZoom: number,
  maxZoom: number,
  preloadBuffer: number,
): Leaflet.TileLayerOptions {
  return {
    attribution: '',
    minZoom,
    maxZoom,
    ...(preloadBuffer > 0
      ? {
          updateInterval: 50,
          updateWhenIdle: false,
          updateWhenZooming: true,
        }
      : {}),
  };
}

/**
 * Extends Leaflet's requested tile bounds so raster imagery is already loaded
 * just outside the visible viewport.
 */
export function createBufferedTileLayer(
  leaflet: LeafletModule,
  tileUrl: string,
  options: Leaflet.TileLayerOptions,
  preloadBuffer: number,
): Leaflet.TileLayer {
  const layer = leaflet.tileLayer(tileUrl, options) as TileLayerWithPrivateBounds;
  if (preloadBuffer === 0) return layer;

  const getVisiblePixelBounds = layer._getTiledPixelBounds.bind(layer);
  layer._getTiledPixelBounds = center => {
    const bounds = getVisiblePixelBounds(center);
    const tileSize = layer.getTileSize();
    const horizontalBuffer = tileSize.x * preloadBuffer;
    const verticalBuffer = tileSize.y * preloadBuffer;

    return new leaflet.Bounds(
      bounds.min.subtract([horizontalBuffer, verticalBuffer]),
      bounds.max.add([horizontalBuffer, verticalBuffer]),
    );
  };

  return layer;
}
