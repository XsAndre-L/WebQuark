import Supercluster from 'supercluster';

import type { QMapMarker, QMapMarkerId } from '../map.types';
import { getMapMarkerClusterGroup, getMapMarkerKey } from './markers';

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
  clusterGroup: string;
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

interface ClusterGroupIndex {
  index: Supercluster<MarkerPointProperties>;
  markers: Map<string, QMapMarker>;
  signature: string;
}

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

function createClusterIndex(
  markers: QMapMarker[],
  options: MapMarkerClusteringOptions,
): Supercluster<MarkerPointProperties> {
  const index = new Supercluster<MarkerPointProperties>({
    radius: options.radius,
    minPoints: options.minPoints,
    maxZoom: options.maxZoom,
  });
  index.load(markers.map(marker => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [marker.longitude, marker.latitude],
    },
    properties: {
      markerKey: getMapMarkerKey(marker.id),
    },
  })));
  return index;
}

/** Keeps the clustering library private and returns deterministic q-map records. */
export class MapMarkerClusterIndex {
  private clusterGroups = new Map<string, ClusterGroupIndex>();
  private readonly standaloneMarkers = new Map<string, QMapMarker>();

  load(markers: QMapMarker[], options: MapMarkerClusteringOptions): void {
    const ordered = [...markers].sort((left, right) => getMapMarkerKey(left.id).localeCompare(getMapMarkerKey(right.id)));
    this.standaloneMarkers.clear();
    const groupedMarkers = new Map<string, QMapMarker[]>();
    for (const marker of ordered) {
      const key = getMapMarkerKey(marker.id);
      if (marker.clusterable === false) {
        this.standaloneMarkers.set(key, marker);
      } else {
        const clusterGroup = getMapMarkerClusterGroup(marker);
        const groupMarkers = groupedMarkers.get(clusterGroup) ?? [];
        groupMarkers.push(marker);
        groupedMarkers.set(clusterGroup, groupMarkers);
      }
    }

    const nextClusterGroups = new Map<string, ClusterGroupIndex>();
    const orderedGroups = [...groupedMarkers].sort(([left], [right]) => left.localeCompare(right));
    for (const [clusterGroup, groupMarkers] of orderedGroups) {
      const groupMarkerMap = new Map(
        groupMarkers.map(marker => [getMapMarkerKey(marker.id), marker]),
      );
      const signature = sourceSignature(groupMarkers, options);
      const current = this.clusterGroups.get(clusterGroup);
      nextClusterGroups.set(clusterGroup, {
        index: current?.signature === signature
          ? current.index
          : createClusterIndex(groupMarkers, options),
        markers: groupMarkerMap,
        signature,
      });
    }
    this.clusterGroups = nextClusterGroups;
  }

  getViewportItems(
    bounds: MapMarkerClusterBounds,
    zoom: number,
    selectedMarkerId: QMapMarkerId | undefined,
  ): MapMarkerViewportItem[] {
    const selectedKey = selectedMarkerId === undefined ? undefined : getMapMarkerKey(selectedMarkerId);
    const items = new Map<string, MapMarkerViewportItem>();

    for (const [clusterGroup, group] of this.clusterGroups) {
      for (const feature of group.index.getClusters(bounds, Math.max(0, Math.floor(zoom)))) {
        if (!isClusterFeature(feature)) {
          const marker = group.markers.get(feature.properties.markerKey);
          if (marker) {
            const key = getMapMarkerKey(marker.id);
            items.set(key, { kind: 'marker', key, marker });
          }
          continue;
        }

        const sourceClusterId = feature.properties.cluster_id;
        const markerKeys = group.index
          .getLeaves(sourceClusterId, Infinity)
          .map(leaf => leaf.properties.markerKey)
          .filter(key => group.markers.has(key))
          .sort();
        const markerIds = markerKeys
          .map(key => group.markers.get(key)?.id)
          .filter((id): id is QMapMarkerId => id !== undefined);
        const clusterId = String(sourceClusterId);
        const key = `cluster:${encodeURIComponent(clusterGroup)}:${clusterId}`;
        items.set(key, {
          kind: 'cluster',
          key,
          clusterId,
          clusterGroup,
          markerIds,
          markerKeys,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          count: markerIds.length,
          expansionZoom: group.index.getClusterExpansionZoom(sourceClusterId),
          containsSelection: selectedKey !== undefined && markerKeys.includes(selectedKey),
        });
      }
    }

    for (const [key, marker] of this.standaloneMarkers) {
      if (!isMarkerInBounds(marker, bounds)) continue;
      items.set(key, { kind: 'marker', key, marker });
    }

    return [...items.values()].sort((left, right) => left.key.localeCompare(right.key));
  }

  clear(): void {
    this.clusterGroups.clear();
    this.standaloneMarkers.clear();
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
