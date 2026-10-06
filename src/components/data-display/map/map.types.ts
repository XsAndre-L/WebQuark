import type { QIconName } from '../../media/icon/icon.types';

export type QMapMarkerId = string | number;

/** A rectangle expressed in browser viewport (client) coordinates. */
export interface QMapViewportRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type QMapMarkerVisibilityResult =
  | 'visible'
  | 'panned'
  | 'unavailable'
  | 'constrained';

export const Q_MAP_DEFAULT_CLUSTER_GROUP = 'default';

export type QMapProvider = 'tiles' | 'vector' | 'google';

export const Q_MAP_RASTER_TILE_LOADING_POLICIES = [
  'full-batch',
  'progressive',
] as const;

/** Controls how a replacement raster layer becomes visible. */
export type QMapRasterTileLoadingPolicy =
  (typeof Q_MAP_RASTER_TILE_LOADING_POLICIES)[number];

export type QMapGoogleMapType = 'roadmap' | 'satellite' | 'terrain' | 'hybrid';

export const Q_MAP_MARKER_VARIANTS = ['default', 'success', 'warning', 'danger', 'muted'] as const;
export const Q_MAP_MARKER_KINDS = ['dot', 'avatar', 'icon', 'image'] as const;
export const Q_MAP_MARKER_SIZES = ['small', 'medium', 'large'] as const;
export const Q_MAP_MARKER_RINGS = ['none', 'solid', 'dashed'] as const;
export const Q_MAP_MARKER_CALLOUT_PLACEMENTS = ['auto', 'left', 'right', 'top', 'bottom'] as const;
export const Q_MAP_MARKER_CALLOUT_STAT_LAYOUTS = ['compact', 'wide'] as const;
export const Q_MAP_MARKER_CALLOUT_VISIBILITIES = ['always', 'selected'] as const;

export type QMapMarkerVariant = (typeof Q_MAP_MARKER_VARIANTS)[number];
export type QMapMarkerKind = (typeof Q_MAP_MARKER_KINDS)[number];
export type QMapMarkerSize = (typeof Q_MAP_MARKER_SIZES)[number];
export type QMapMarkerRing = (typeof Q_MAP_MARKER_RINGS)[number];
export type QMapMarkerCalloutPlacement = (typeof Q_MAP_MARKER_CALLOUT_PLACEMENTS)[number];
export type QMapMarkerCalloutStatLayout = (typeof Q_MAP_MARKER_CALLOUT_STAT_LAYOUTS)[number];
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

export interface QMapMarkerCalloutStatus {
  label: string;
  variant?: QMapMarkerVariant;
}

export interface QMapMarkerCalloutStat {
  label: string;
  value: string | number;
  layout?: QMapMarkerCalloutStatLayout;
}

export interface QMapMarkerCallout {
  title: string;
  subtitle?: string;
  meta?: string;
  stats?: readonly QMapMarkerCalloutStat[];
  status?: QMapMarkerCalloutStatus;
  variant?: QMapMarkerVariant;
  placement?: QMapMarkerCalloutPlacement;
  visibility?: QMapMarkerCalloutVisibility;
}

export interface QMapFitMarkersOptions {
  /** Padding on each viewport edge in pixels. Defaults to zero. */
  padding?: number;
  /** Limits fitted zoom without exceeding the map's configured zoom range. */
  maxZoom?: number;
}

export interface QMapMarker {
  id: QMapMarkerId;
  latitude: number;
  longitude: number;
  label: string;
  /** Excludes this marker from clusters when explicitly false. Defaults to true. */
  clusterable?: boolean;
  /** Clusters only with markers using the same normalized group. Defaults to "default". */
  clusterGroup?: string;
  variant?: QMapMarkerVariant;
  imageUrl?: string;
  /** Displayed width and height for image markers, in pixels. */
  imageSize?: readonly [number, number];
  /** Coordinate anchor measured from the image's top-left. Defaults to bottom-center. */
  imageAnchor?: readonly [number, number];
  fallbackText?: string;
  kind?: QMapMarkerKind;
  icon?: QIconName;
  /** Overrides the rendered icon width and height in pixels. */
  iconSize?: number;
  /** Applies a horizontal optical correction to the rendered icon in pixels. */
  iconOffsetX?: number;
  /** Applies a vertical optical correction to the rendered icon in pixels. */
  iconOffsetY?: number;
  /** Selects a semantic marker diameter without coupling marker data to pixels. */
  size?: QMapMarkerSize;
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
  clusterGroup: string;
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
