export type QMapMarkerId = string | number;

export type QMapProvider = 'tiles' | 'google';

export type QMapGoogleMapType = 'roadmap' | 'satellite' | 'terrain' | 'hybrid';

export type QMapMarkerVariant = 'default' | 'success' | 'warning' | 'danger' | 'muted';

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
