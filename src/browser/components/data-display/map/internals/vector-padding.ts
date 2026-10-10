export const DEFAULT_VECTOR_PADDING = 0.2;
export const MAX_VECTOR_PADDING = 0.5;

/** Normalizes the relative MapLibre viewport padding used for off-screen tile loading. */
export function normalizeVectorPadding(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VECTOR_PADDING;
  return Math.max(0, Math.min(MAX_VECTOR_PADDING, value));
}
