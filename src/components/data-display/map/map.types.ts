import type { QIconName } from '../../media/icon/icon.types';

export type QMapMarkerId = string | number;

export type QMapProvider = 'tiles' | 'vector' | 'google';

export type QMapGoogleMapType = 'roadmap' | 'satellite' | 'terrain' | 'hybrid';

export const Q_MAP_MARKER_VARIANTS = ['default', 'success', 'warning', 'danger', 'muted'] as const;
export const Q_MAP_MARKER_KINDS = ['dot', 'avatar', 'icon'] as const;
export const Q_MAP_MARKER_RINGS = ['none', 'solid', 'dashed'] as const;
export const Q_MAP_MARKER_CALLOUT_PLACEMENTS = ['auto', 'left', 'right', 'top', 'bottom'] as const;
export const Q_MAP_MARKER_CALLOUT_VISIBILITIES = ['always', 'selected'] as const;

export type QMapMarkerVariant = (typeof Q_MAP_MARKER_VARIANTS)[number];
export type QMapMarkerKind = (typeof Q_MAP_MARKER_KINDS)[number];
export type QMapMarkerRing = (typeof Q_MAP_MARKER_RINGS)[number];
export type QMapMarkerCalloutPlacement = (typeof Q_MAP_MARKER_CALLOUT_PLACEMENTS)[number];
export type QMapMarkerCalloutVisibility = (typeof Q_MAP_MARKER_CALLOUT_VISIBILITIES)[number];

export interface QMapBounds {
  southLatitude: number;
  westLongitude: number;
  northLatitude: number;
  eastLongitude: number;
}

export type QMapBoundsInput = QMapBounds | string;

export interface QMapMarkerBadge {
  icon?: QIconName;
  text?: string;
  variant?: QMapMarkerVariant;
  ariaLabel: string;
}

export interface QMapMarkerCallout {
  title: string;
  subtitle?: string;
  meta?: string;
  variant?: QMapMarkerVariant;
  placement?: QMapMarkerCalloutPlacement;
  visibility?: QMapMarkerCalloutVisibility;
}

export interface QMapMarker {
  id: QMapMarkerId;
  latitude: number;
  longitude: number;
  label: string;
  /** Excludes this marker from clusters when explicitly false. Defaults to true. */
  clusterable?: boolean;
  variant?: QMapMarkerVariant;
  imageUrl?: string;
  fallbackText?: string;
  kind?: QMapMarkerKind;
  icon?: QIconName;
  ring?: QMapMarkerRing;
  pulse?: boolean;
  badge?: QMapMarkerBadge;
  callout?: QMapMarkerCallout;
}

export type QMapMarkerInput = QMapMarker[] | string;

export interface QMapClickDetail {
  latitude: number;
  longitude: number;
  originalEvent: MouseEvent;
}

export interface QMapMarkerSelectDetail {
  marker: QMapMarker;
  originalEvent: MouseEvent | KeyboardEvent;
}

export interface QMapClusterSelectDetail {
  clusterId: string;
  markerIds: QMapMarkerId[];
  latitude: number;
  longitude: number;
  expansionZoom: number;
  originalEvent: MouseEvent | KeyboardEvent;
}

export type QMapStatus = 'initializing' | 'ready' | 'empty' | 'error';

export interface QMapStatusChangeDetail {
  status: QMapStatus;
  requestedProvider: QMapProvider;
  activeProvider?: QMapProvider;
  usingFallback: boolean;
}

export type QMapErrorCode =
  | 'leaflet-initialization-failed'
  | 'provider-initialization-failed'
  | 'fallback-initialization-failed'
  | 'invalid-max-bounds';

export interface QMapErrorDetail {
  code: QMapErrorCode;
  message: string;
  requestedProvider: QMapProvider;
  recoverable: boolean;
}
