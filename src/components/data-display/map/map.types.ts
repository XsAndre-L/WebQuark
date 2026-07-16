export type QMapMarkerId = string | number;

export type QMapProvider = 'tiles' | 'google';

export type QMapGoogleMapType = 'roadmap' | 'satellite' | 'terrain' | 'hybrid';

export const Q_MAP_MARKER_VARIANTS = ['default', 'success', 'warning', 'danger', 'muted'] as const;

export type QMapMarkerVariant = (typeof Q_MAP_MARKER_VARIANTS)[number];

export interface QMapBounds {
  southLatitude: number;
  westLongitude: number;
  northLatitude: number;
  eastLongitude: number;
}

export type QMapBoundsInput = QMapBounds | string;

export interface QMapMarker {
  id: QMapMarkerId;
  latitude: number;
  longitude: number;
  label: string;
  variant?: QMapMarkerVariant;
}

export type QMapMarkerInput = QMapMarker[] | string;

export interface QMapMarkerSelectDetail {
  marker: QMapMarker;
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
