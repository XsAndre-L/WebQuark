import {
  Q_MAP_MARKER_CALLOUT_PLACEMENTS,
  Q_MAP_MARKER_CALLOUT_STAT_LAYOUTS,
  Q_MAP_MARKER_CALLOUT_VISIBILITIES,
  Q_MAP_MARKER_KINDS,
  Q_MAP_MARKER_RINGS,
  Q_MAP_MARKER_VARIANTS,
} from '../map.types';
import type {
  QMapMarker,
  QMapMarkerBadge,
  QMapMarkerCallout,
  QMapMarkerCalloutStat,
  QMapMarkerCalloutStatLayout,
  QMapMarkerCalloutStatus,
  QMapMarkerCalloutPlacement,
  QMapMarkerCalloutVisibility,
  QMapMarkerId,
  QMapMarkerInput,
  QMapMarkerKind,
  QMapMarkerRing,
  QMapMarkerVariant,
} from '../map.types';

const MARKER_VARIANTS = new Set<string>(Q_MAP_MARKER_VARIANTS);
const MARKER_KINDS = new Set<string>(Q_MAP_MARKER_KINDS);
const MARKER_RINGS = new Set<string>(Q_MAP_MARKER_RINGS);
const CALLOUT_PLACEMENTS = new Set<string>(Q_MAP_MARKER_CALLOUT_PLACEMENTS);
const CALLOUT_STAT_LAYOUTS = new Set<string>(Q_MAP_MARKER_CALLOUT_STAT_LAYOUTS);
const CALLOUT_VISIBILITIES = new Set<string>(Q_MAP_MARKER_CALLOUT_VISIBILITIES);
const MAX_CALLOUT_STATS = 6;

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

function getOptionalEnum<T extends string>(value: unknown, allowed: Set<string>): T | undefined {
  return typeof value === 'string' && allowed.has(value) ? (value as T) : undefined;
}

function getOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeBadge(value: unknown): QMapMarkerBadge | undefined {
  if (!isRecord(value)) return undefined;
  const ariaLabel = getOptionalText(value.ariaLabel);
  const icon = getOptionalText(value.icon);
  const text = getOptionalText(value.text);
  if (!ariaLabel || (!icon && !text)) return undefined;

  return {
    ariaLabel,
    variant: getMarkerVariant(value.variant),
    ...(icon ? { icon } : {}),
    ...(text ? { text } : {}),
  };
}

function normalizeCalloutStatus(
  value: unknown,
): QMapMarkerCalloutStatus | undefined {
  if (!isRecord(value)) return undefined;
  const label = getOptionalText(value.label);
  if (!label) return undefined;

  return {
    label,
    variant: getMarkerVariant(value.variant),
  };
}

function normalizeCalloutStat(value: unknown): QMapMarkerCalloutStat | undefined {
  if (!isRecord(value)) return undefined;
  const label = getOptionalText(value.label);
  const statValue =
    typeof value.value === 'number' && Number.isFinite(value.value)
      ? value.value
      : getOptionalText(value.value);
  if (!label || statValue === undefined) return undefined;

  return {
    label,
    value: statValue,
    layout:
      getOptionalEnum<QMapMarkerCalloutStatLayout>(
        value.layout,
        CALLOUT_STAT_LAYOUTS,
      ) ?? 'compact',
  };
}

function normalizeCalloutStats(
  value: unknown,
): QMapMarkerCalloutStat[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const stats = value
    .map(normalizeCalloutStat)
    .filter((stat): stat is QMapMarkerCalloutStat => stat !== undefined)
    .slice(0, MAX_CALLOUT_STATS);

  return stats.length > 0 ? stats : undefined;
}

function normalizeCallout(value: unknown): QMapMarkerCallout | undefined {
  if (!isRecord(value)) return undefined;
  const title = getOptionalText(value.title);
  if (!title) return undefined;

  const subtitle = getOptionalText(value.subtitle);
  const meta = getOptionalText(value.meta);
  const stats = normalizeCalloutStats(value.stats);
  const status = normalizeCalloutStatus(value.status);
  const placement = getOptionalEnum<QMapMarkerCalloutPlacement>(value.placement, CALLOUT_PLACEMENTS) ?? 'auto';
  const visibility = getOptionalEnum<QMapMarkerCalloutVisibility>(value.visibility, CALLOUT_VISIBILITIES) ?? 'always';

  return {
    title,
    variant: getMarkerVariant(value.variant),
    placement,
    visibility,
    ...(subtitle ? { subtitle } : {}),
    ...(meta ? { meta } : {}),
    ...(stats ? { stats } : {}),
    ...(status ? { status } : {}),
  };
}

function normalizeMarker(value: unknown): QMapMarker | undefined {
  if (!isRecord(value) || !isMarkerId(value.id)) return undefined;
  if (typeof value.latitude !== 'number' || !Number.isFinite(value.latitude) || value.latitude < -90 || value.latitude > 90) return undefined;
  if (typeof value.longitude !== 'number' || !Number.isFinite(value.longitude) || value.longitude < -180 || value.longitude > 180) return undefined;

  const label = typeof value.label === 'string' && value.label.trim().length > 0 ? value.label : String(value.id);
  const imageUrl = getOptionalText(value.imageUrl);
  const fallbackText = getOptionalText(value.fallbackText);
  const icon = getOptionalText(value.icon);
  const requestedKind = getOptionalEnum<QMapMarkerKind>(value.kind, MARKER_KINDS);
  const kind = requestedKind === 'icon' && !icon ? 'dot' : requestedKind;
  const ring = getOptionalEnum<QMapMarkerRing>(value.ring, MARKER_RINGS);
  const badge = normalizeBadge(value.badge);
  const callout = normalizeCallout(value.callout);

  return {
    id: value.id,
    latitude: value.latitude,
    longitude: value.longitude,
    label,
    clusterable: value.clusterable !== false,
    variant: getMarkerVariant(value.variant),
    ...(imageUrl ? { imageUrl } : {}),
    ...(fallbackText ? { fallbackText } : {}),
    ...(kind ? { kind } : {}),
    ...(icon ? { icon } : {}),
    ...(ring ? { ring } : {}),
    ...(value.pulse === true ? { pulse: true } : {}),
    ...(badge ? { badge } : {}),
    ...(callout ? { callout } : {}),
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
