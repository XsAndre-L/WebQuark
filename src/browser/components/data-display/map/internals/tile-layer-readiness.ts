import type * as Leaflet from 'leaflet';

import type { QMapRasterTileLoadingPolicy } from '../map.types';

export const TILE_LAYER_READY_TIMEOUT_MS = 10_000;

export interface TileLayerReadinessOptions {
  loadingPolicy?: QMapRasterTileLoadingPolicy;
  signal?: AbortSignal;
  startLoading?: () => void;
  timeoutMs?: number;
}

/** Waits for enough of a replacement raster layer to be safely presented. */
export function waitForInitialTileLayerReady(
  layer: Leaflet.TileLayer,
  options: TileLayerReadinessOptions = {},
): Promise<void> {
  const {
    loadingPolicy = 'full-batch',
    signal,
    startLoading,
    timeoutMs = TILE_LAYER_READY_TIMEOUT_MS,
  } = options;

  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const cleanup = () => {
      layer.off('load', handleLoad);
      layer.off('tileload', handleTileLoad);
      layer.off('tileerror', handleTileError);
      signal?.removeEventListener('abort', handleAbort);
      if (timeout !== undefined) clearTimeout(timeout);
    };
    const settle = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const handleLoad = () => loadingPolicy === 'full-batch'
      ? settle()
      : settle(new Error('Raster tiles failed to load.'));
    const handleTileLoad = () => {
      if (loadingPolicy === 'progressive') settle();
    };
    const handleTileError = () => {
      if (loadingPolicy === 'full-batch') {
        settle(new Error('Raster tiles failed to load.'));
      }
    };
    const handleAbort = () => settle(createAbortError());

    layer.on('load', handleLoad);
    layer.on('tileload', handleTileLoad);
    layer.on('tileerror', handleTileError);
    signal?.addEventListener('abort', handleAbort, { once: true });
    timeout = setTimeout(
      () => settle(new Error('Raster tile loading timed out.')),
      Math.max(0, timeoutMs),
    );

    if (startLoading) {
      try {
        startLoading();
        if (!layer.isLoading()) settle();
      } catch (error) {
        settle(toError(error));
      }
    }
  });
}

function createAbortError(): Error {
  const error = new Error('Raster tile loading was cancelled.');
  error.name = 'AbortError';
  return error;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
