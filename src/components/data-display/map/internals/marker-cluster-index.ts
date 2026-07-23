import Supercluster from 'supercluster';

import type { QMapMarker, QMapMarkerId } from '../map.types';
import { getMapMarkerKey } from './markers';

interface MarkerPointProperties {
  markerKey: string;
}

export interface MapMarkerClusteringOptions {
  enabled: boolean;
  radius: number;
  minPoints: number;
  maxZoom: number;
}

export interface MapMarkerViewportMarker {
  kind: 'marker';
  key: string;
  marker: QMapMarker;
}

export interface MapMarkerViewportCluster {
  kind: 'cluster';
  key: string;
  clusterId: string;
  markerIds: QMapMarkerId[];
  markerKeys: string[];
  latitude: number;
  longitude: number;
  count: number;
  expansionZoom: number;
  containsSelection: boolean;
}

export type MapMarkerViewportItem = MapMarkerViewportMarker | MapMarkerViewportCluster;
export type MapMarkerClusterBounds = [number, number, number, number];

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

export function normalizeMapMarkerClusteringOptions(
  enabled: boolean,
  radius: number,
  minPoints: number,
  requestedMaxZoom: number | undefined,
  mapMaxZoom: number,
): MapMarkerClusteringOptions {
  const normalizedMapMaxZoom = Number.isFinite(mapMaxZoom) ? Math.max(0, Math.floor(mapMaxZoom)) : 19;
  return {
    enabled,
    radius: Number.isFinite(radius) ? clampInteger(radius, 1, 200) : 48,
    minPoints: Number.isFinite(minPoints) ? clampInteger(minPoints, 2, 1000) : 2,
    maxZoom: Number.isFinite(requestedMaxZoom)
      ? clampInteger(requestedMaxZoom as number, 0, normalizedMapMaxZoom)
      : Math.max(0, normalizedMapMaxZoom - 1),
  };
}

function sourceSignature(markers: QMapMarker[], options: MapMarkerClusteringOptions): string {
  return `${options.radius}:${options.minPoints}:${options.maxZoom}:${
    markers
      .map(marker => `${getMapMarkerKey(marker.id)}@${marker.longitude},${marker.latitude}`)
      .sort()
      .join('|')
  }`;
}

function isClusterFeature(
  feature: Supercluster.ClusterFeature<Supercluster.AnyProps> | Supercluster.PointFeature<MarkerPointProperties>,
): feature is Supercluster.ClusterFeature<Supercluster.AnyProps> {
  return 'cluster' in feature.properties && feature.properties.cluster === true;
}

function createEmptyClusterIndex(): Supercluster<MarkerPointProperties> {
  const index = new Supercluster<MarkerPointProperties>();
  index.load([]);
  return index;
}

/** Keeps the clustering library private and returns deterministic q-map records. */
export class MapMarkerClusterIndex {
  private index = createEmptyClusterIndex();
  private readonly markers = new Map<string, QMapMarker>();
  private readonly standaloneMarkers = new Map<string, QMapMarker>();
  private signature = '';

  load(markers: QMapMarker[], options: MapMarkerClusteringOptions): void {
    const ordered = [...markers].sort((left, right) => getMapMarkerKey(left.id).localeCompare(getMapMarkerKey(right.id)));
    this.markers.clear();
    this.standaloneMarkers.clear();
    const clusterableMarkers: QMapMarker[] = [];
    for (const marker of ordered) {
      const key = getMapMarkerKey(marker.id);
      if (marker.clusterable === false) {
        this.standaloneMarkers.set(key, marker);
      } else {
        this.markers.set(key, marker);
        clusterableMarkers.push(marker);
      }
    }

    const nextSignature = sourceSignature(clusterableMarkers, options);
    if (nextSignature === this.signature) return;
    this.signature = nextSignature;
    this.index = new Supercluster<MarkerPointProperties>({
      radius: options.radius,
      minPoints: options.minPoints,
      maxZoom: options.maxZoom,
    });
    this.index.load(clusterableMarkers.map(marker => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [marker.longitude, marker.latitude],
      },
      properties: {
        markerKey: getMapMarkerKey(marker.id),
      },
    })));
  }

  getViewportItems(
    bounds: MapMarkerClusterBounds,
    zoom: number,
    selectedMarkerId: QMapMarkerId | undefined,
  ): MapMarkerViewportItem[] {
    const selectedKey = selectedMarkerId === undefined ? undefined : getMapMarkerKey(selectedMarkerId);
    const items = new Map<string, MapMarkerViewportItem>();

    for (const feature of this.index.getClusters(bounds, Math.max(0, Math.floor(zoom)))) {
      if (!isClusterFeature(feature)) {
        const marker = this.markers.get(feature.properties.markerKey);
        if (marker) {
          const key = getMapMarkerKey(marker.id);
          items.set(key, { kind: 'marker', key, marker });
        }
        continue;
      }

      const sourceClusterId = feature.properties.cluster_id;
      const markerKeys = this.index
        .getLeaves(sourceClusterId, Infinity)
        .map(leaf => leaf.properties.markerKey)
        .filter(key => this.markers.has(key))
        .sort();
      const markerIds = markerKeys
        .map(key => this.markers.get(key)?.id)
        .filter((id): id is QMapMarkerId => id !== undefined);
      const clusterId = String(sourceClusterId);
      const key = `cluster:${clusterId}`;
      items.set(key, {
        kind: 'cluster',
        key,
        clusterId,
        markerIds,
        markerKeys,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        count: markerIds.length,
        expansionZoom: this.index.getClusterExpansionZoom(sourceClusterId),
        containsSelection: selectedKey !== undefined && markerKeys.includes(selectedKey),
      });
    }

    for (const [key, marker] of this.standaloneMarkers) {
      if (!isMarkerInBounds(marker, bounds)) continue;
      items.set(key, { kind: 'marker', key, marker });
    }

    return [...items.values()].sort((left, right) => left.key.localeCompare(right.key));
  }

  clear(): void {
    this.index = createEmptyClusterIndex();
    this.markers.clear();
    this.standaloneMarkers.clear();
    this.signature = '';
  }
}

function isMarkerInBounds(
  marker: QMapMarker,
  [west, south, east, north]: MapMarkerClusterBounds,
): boolean {
  return (
    marker.longitude >= west &&
    marker.longitude <= east &&
    marker.latitude >= south &&
    marker.latitude <= north
  );
}
