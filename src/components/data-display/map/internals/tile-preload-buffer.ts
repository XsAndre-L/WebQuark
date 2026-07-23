export const DEFAULT_TILE_PRELOAD_BUFFER = 0;
export const MAX_TILE_PRELOAD_BUFFER = 4;

/** Normalizes the number of offscreen raster-tile rows and columns to preload. */
export function normalizeTilePreloadBuffer(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_TILE_PRELOAD_BUFFER;
  return Math.min(MAX_TILE_PRELOAD_BUFFER, Math.max(0, Math.round(value)));
}
