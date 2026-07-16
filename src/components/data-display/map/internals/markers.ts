import { Q_MAP_MARKER_VARIANTS } from '../map.types';
import type { QMapMarker, QMapMarkerId, QMapMarkerInput, QMapMarkerVariant } from '../map.types';

const MARKER_VARIANTS = new Set<string>(Q_MAP_MARKER_VARIANTS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseMarkerInput(markers: QMapMarkerInput): unknown[] {
  if (Array.isArray(markers)) return markers;

  try {
    const parsed = JSON.parse(markers);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isMarkerId(value: unknown): value is QMapMarkerId {
  return (typeof value === 'string' && value.trim().length > 0) || (typeof value === 'number' && Number.isFinite(value));
}

function getMarkerVariant(value: unknown): QMapMarkerVariant {
  return typeof value === 'string' && MARKER_VARIANTS.has(value) ? (value as QMapMarkerVariant) : 'default';
}

function normalizeMarker(value: unknown): QMapMarker | undefined {
  if (!isRecord(value) || !isMarkerId(value.id)) return undefined;
  if (typeof value.latitude !== 'number' || !Number.isFinite(value.latitude) || value.latitude < -90 || value.latitude > 90) return undefined;
  if (typeof value.longitude !== 'number' || !Number.isFinite(value.longitude) || value.longitude < -180 || value.longitude > 180) return undefined;

  const label = typeof value.label === 'string' && value.label.trim().length > 0 ? value.label : String(value.id);

  return {
    id: value.id,
    latitude: value.latitude,
    longitude: value.longitude,
    label,
    variant: getMarkerVariant(value.variant),
  };
}

export function getMapMarkerKey(id: QMapMarkerId): string {
  return typeof id === 'number' ? `number:${id}` : `string:${id}`;
}

export function getMapMarkers(markers: QMapMarkerInput): QMapMarker[] {
  const uniqueMarkers = new Map<string, QMapMarker>();

  for (const value of parseMarkerInput(markers)) {
    const marker = normalizeMarker(value);
    if (marker) uniqueMarkers.set(getMapMarkerKey(marker.id), marker);
  }

  return [...uniqueMarkers.values()];
}
