import type * as Leaflet from 'leaflet';

export const TILE_LAYER_READY_TIMEOUT_MS = 10_000;

export interface TileLayerReadinessOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/** Waits for the initially requested raster tiles to finish without errors. */
export function waitForInitialTileLayerReady(
  layer: Leaflet.TileLayer,
  options: TileLayerReadinessOptions = {},
): Promise<void> {
  const { signal, timeoutMs = TILE_LAYER_READY_TIMEOUT_MS } = options;

  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const cleanup = () => {
      layer.off('load', handleLoad);
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
    const handleLoad = () => settle();
    const handleTileError = () => settle(new Error('Raster tiles failed to load.'));
    const handleAbort = () => settle(createAbortError());

    layer.on('load', handleLoad);
    layer.on('tileerror', handleTileError);
    signal?.addEventListener('abort', handleAbort, { once: true });
    timeout = setTimeout(
      () => settle(new Error('Raster tile loading timed out.')),
      Math.max(0, timeoutMs),
    );
  });
}

function createAbortError(): Error {
  const error = new Error('Raster tile loading was cancelled.');
  error.name = 'AbortError';
  return error;
}
