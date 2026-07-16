import type { LatLngBoundsExpression } from 'leaflet';

import type { QMapBounds, QMapBoundsInput } from '../map.types';

export type QMapBoundsResolution =
  | { kind: 'clear' }
  | { kind: 'valid'; bounds: QMapBounds; leafletBounds: LatLngBoundsExpression }
  | { kind: 'invalid'; message: string };

interface MapBoundsController {
  options: { maxBoundsViscosity?: number };
  setMaxBounds(bounds?: LatLngBoundsExpression): unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseBoundsInput(bounds: QMapBoundsInput | undefined): { parsed?: unknown; invalidJson: boolean } {
  if (typeof bounds !== 'string') return { parsed: bounds, invalidJson: false };

  if (!bounds.trim()) return { parsed: undefined, invalidJson: false };

  try {
    return { parsed: JSON.parse(bounds), invalidJson: false };
  } catch {
    return { invalidJson: true };
  }
}

function isLatitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isLongitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function resolveMapBounds(input: QMapBoundsInput | undefined): QMapBoundsResolution {
  const { parsed: bounds, invalidJson } = parseBoundsInput(input);
  if (invalidJson) return { kind: 'invalid', message: 'maxBounds must be valid JSON or a bounds object.' };
  if (bounds === undefined) return { kind: 'clear' };
  if (!isRecord(bounds)) return { kind: 'invalid', message: 'maxBounds must be a bounds object.' };

  const { southLatitude, westLongitude, northLatitude, eastLongitude } = bounds;
  if (!isLatitude(southLatitude) || !isLatitude(northLatitude)) {
    return { kind: 'invalid', message: 'maxBounds latitude values must be finite numbers from -90 to 90.' };
  }
  if (!isLongitude(westLongitude) || !isLongitude(eastLongitude)) {
    return { kind: 'invalid', message: 'maxBounds longitude values must be finite numbers from -180 to 180.' };
  }
  if (southLatitude >= northLatitude) {
    return { kind: 'invalid', message: 'maxBounds southLatitude must be below northLatitude.' };
  }
  if (westLongitude >= eastLongitude) {
    return { kind: 'invalid', message: 'maxBounds westLongitude must be below eastLongitude; antimeridian-crossing bounds are not supported.' };
  }

  const normalized = { southLatitude, westLongitude, northLatitude, eastLongitude };
  return {
    kind: 'valid',
    bounds: normalized,
    leafletBounds: [
      [normalized.southLatitude, normalized.westLongitude],
      [normalized.northLatitude, normalized.eastLongitude],
    ],
  };
}

export function getInitialLeafletMapBounds(resolution: QMapBoundsResolution): LatLngBoundsExpression | undefined {
  return resolution.kind === 'valid' ? resolution.leafletBounds : undefined;
}

export function getMapBoundsViscosity(value: number): number {
  const viscosity = Number.isFinite(value) ? value : 1;
  return Math.max(0, Math.min(1, viscosity));
}

export function applyMapBounds(
  map: MapBoundsController,
  resolution: QMapBoundsResolution,
  viscosity: number,
): boolean {
  map.options.maxBoundsViscosity = getMapBoundsViscosity(viscosity);
  if (resolution.kind === 'invalid') return false;

  map.setMaxBounds(resolution.kind === 'valid' ? resolution.leafletBounds : undefined);
  return true;
}
