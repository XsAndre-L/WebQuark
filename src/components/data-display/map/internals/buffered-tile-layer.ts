import type * as Leaflet from 'leaflet';

import type { QMapRasterTileLoadingPolicy } from '../map.types';

type LeafletModule = typeof import('leaflet');

interface TileLayerWithPrivateMethods extends Leaflet.TileLayer {
  _getTiledPixelBounds(center: Leaflet.LatLng): Leaflet.Bounds;
  _initTile(tile: HTMLElement): void;
}

interface ProgressiveTileRecord {
  active?: boolean;
  progressiveLoadFailed?: boolean;
}

interface ProgressiveTileLayer {
  onAdd(map: Leaflet.Map): unknown;
  _pruneTiles(): void;
  _tileCoordsToKey(coords: Leaflet.Coords): string;
  _tileReady(
    coords: Leaflet.Coords,
    error: Error | null,
    tile: HTMLElement,
  ): void;
  _tiles: Record<string, ProgressiveTileRecord>;
  _updateOpacity(): void;
}

const TILE_SEAM_OVERLAP_PX = 1;

export function createRasterTileLayerOptions(
  minZoom: number,
  maxZoom: number,
  preloadBuffer: number,
  loadingPolicy: QMapRasterTileLoadingPolicy = 'full-batch',
): Leaflet.TileLayerOptions {
  return {
    attribution: '',
    minZoom,
    maxZoom,
    ...(loadingPolicy === 'progressive'
      ? { updateWhenZooming: true }
      : {}),
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
  loadingPolicy: QMapRasterTileLoadingPolicy = 'full-batch',
): Leaflet.TileLayer {
  const layer = leaflet.tileLayer(tileUrl, options) as TileLayerWithPrivateMethods;
  const initializeTile = layer._initTile.bind(layer);
  layer._initTile = tile => {
    initializeTile(tile);
    const tileSize = layer.getTileSize();
    tile.style.width = `${tileSize.x + TILE_SEAM_OVERLAP_PX}px`;
    tile.style.height = `${tileSize.y + TILE_SEAM_OVERLAP_PX}px`;
  };

  if (loadingPolicy === 'progressive') {
    configureProgressiveTileLayer(requireProgressiveTileLayer(layer));
  }

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

function requireProgressiveTileLayer(
  layer: Leaflet.TileLayer,
): ProgressiveTileLayer {
  const candidate = layer as unknown as Partial<ProgressiveTileLayer>;
  if (
    typeof candidate._pruneTiles !== 'function' ||
    typeof candidate._tileCoordsToKey !== 'function' ||
    typeof candidate._tileReady !== 'function' ||
    typeof candidate._updateOpacity !== 'function' ||
    typeof candidate.onAdd !== 'function'
  ) {
    throw progressiveLoadingUnsupported();
  }

  return candidate as ProgressiveTileLayer;
}

function configureProgressiveTileLayer(layer: ProgressiveTileLayer): void {
  const addToMap = layer.onAdd.bind(layer);
  let configured = false;
  layer.onAdd = map => {
    const result = addToMap(map);
    requireProgressiveTileRecords(layer);
    if (!configured) {
      keepLoadedParentsUntilChildrenSucceed(layer);
      configured = true;
    }
    return result;
  };
}

function requireProgressiveTileRecords(
  layer: ProgressiveTileLayer,
): Record<string, ProgressiveTileRecord> {
  if (
    layer._tiles === null ||
    typeof layer._tiles !== 'object' ||
    Array.isArray(layer._tiles)
  ) {
    throw progressiveLoadingUnsupported();
  }

  return layer._tiles;
}

function progressiveLoadingUnsupported(): Error {
  return new Error(
    'Progressive raster loading is not supported by this Leaflet tile layer.',
  );
}

/**
 * Leaflet already retains loaded parents while children are pending. A failed
 * image is normally marked active, which can prematurely prune that parent;
 * progressive layers keep failed children inactive so the coarser tile stays
 * visible underneath.
 */
function keepLoadedParentsUntilChildrenSucceed(
  layer: ProgressiveTileLayer,
): void {
  const finishTile = layer._tileReady.bind(layer);
  const pruneTiles = layer._pruneTiles.bind(layer);
  const updateOpacity = layer._updateOpacity.bind(layer);

  const withoutPruning = (operation: () => void) => {
    const activePruneTiles = layer._pruneTiles;
    layer._pruneTiles = () => undefined;
    try {
      operation();
    } finally {
      layer._pruneTiles = activePruneTiles;
    }
  };
  const keepFailedChildrenInactive = () => {
    for (const tile of Object.values(layer._tiles)) {
      if (tile.progressiveLoadFailed) tile.active = false;
    }
  };

  layer._tileReady = (coords, error, tile) => {
    const tileRecord = layer._tiles[layer._tileCoordsToKey(coords)];
    if (!error) {
      if (tileRecord) tileRecord.progressiveLoadFailed = false;
      finishTile(coords, error, tile);
      return;
    }

    withoutPruning(() => finishTile(coords, error, tile));
    if (tileRecord) {
      tileRecord.progressiveLoadFailed = true;
      tileRecord.active = false;
    }
    pruneTiles();
  };

  layer._updateOpacity = () => {
    withoutPruning(updateOpacity);
    keepFailedChildrenInactive();
    pruneTiles();
  };
}
