import type * as Leaflet from 'leaflet';

type LeafletModule = typeof import('leaflet');

interface TileLayerWithPrivateMethods extends Leaflet.TileLayer {
  _getTiledPixelBounds(center: Leaflet.LatLng): Leaflet.Bounds;
  _initTile(tile: HTMLElement): void;
}

const TILE_SEAM_OVERLAP_PX = 1;

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
  const layer = leaflet.tileLayer(tileUrl, options) as TileLayerWithPrivateMethods;
  const initializeTile = layer._initTile.bind(layer);
  layer._initTile = tile => {
    initializeTile(tile);
    const tileSize = layer.getTileSize();
    tile.style.width = `${tileSize.x + TILE_SEAM_OVERLAP_PX}px`;
    tile.style.height = `${tileSize.y + TILE_SEAM_OVERLAP_PX}px`;
  };

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
