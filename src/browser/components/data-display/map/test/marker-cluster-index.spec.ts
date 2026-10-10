import { describe, expect, it } from 'vitest';

import type { QMapMarker } from '../map.types';
import {
  MapMarkerClusterIndex,
  type MapMarkerClusteringOptions,
} from '../internals/marker-cluster-index';

const WORLD_BOUNDS: [number, number, number, number] = [
  -180, -90, 180, 90,
];
const OPTIONS: MapMarkerClusteringOptions = {
  enabled: true,
  radius: 56,
  minPoints: 2,
  maxZoom: 18,
};

describe('q-map selective marker clustering', () => {
  it('returns an empty viewport before the first marker sync', () => {
    const index = new MapMarkerClusterIndex();

    expect(
      index.getViewportItems(WORLD_BOUNDS, 7, undefined),
    ).toEqual([]);
  });

  it('returns all-standalone marker sets without clusters', () => {
    const index = new MapMarkerClusterIndex();
    index.load(
      [
        marker('merchandiser:1', false),
        marker('merchandiser:2', false),
      ],
      OPTIONS,
    );

    const items = index.getViewportItems(WORLD_BOUNDS, 7, undefined);

    expect(items).toHaveLength(2);
    expect(items.every(item => item.kind === 'marker')).toBe(true);
    expect(items.map(item => item.key)).toEqual([
      'string:merchandiser:1',
      'string:merchandiser:2',
    ]);
  });

  it('clusters only eligible colocated markers and excludes standalone IDs from membership', () => {
    const index = new MapMarkerClusterIndex();
    index.load(
      [
        marker('store:1', true),
        marker('store:2', true),
        marker('merchandiser:1', false),
      ],
      OPTIONS,
    );

    const items = index.getViewportItems(
      WORLD_BOUNDS,
      7,
      'store:1',
    );
    const cluster = items.find(item => item.kind === 'cluster');
    const standalone = items.find(
      item =>
        item.kind === 'marker' &&
        item.marker.id === 'merchandiser:1',
    );

    expect(cluster).toEqual(
      expect.objectContaining({
        kind: 'cluster',
        clusterGroup: 'default',
        count: 2,
        markerIds: ['store:1', 'store:2'],
        containsSelection: true,
      }),
    );
    expect(standalone).toEqual(
      expect.objectContaining({
        kind: 'marker',
        key: 'string:merchandiser:1',
      }),
    );
  });

  it('clusters markers from different source layers when their group matches', () => {
    const index = new MapMarkerClusterIndex();
    index.load(
      [
        marker('store:1', true, 'field-activity'),
        marker('merchandiser:1', true, 'field-activity'),
      ],
      OPTIONS,
    );

    expect(index.getViewportItems(WORLD_BOUNDS, 7, undefined)).toEqual([
      expect.objectContaining({
        kind: 'cluster',
        clusterGroup: 'field-activity',
        count: 2,
        markerIds: ['merchandiser:1', 'store:1'],
      }),
    ]);
  });

  it('keeps different groups in separate clusters with unique render keys', () => {
    const index = new MapMarkerClusterIndex();
    index.load(
      [
        marker('store:1', true, 'stores'),
        marker('store:2', true, 'stores'),
        marker('merchandiser:1', true, 'merchandisers'),
        marker('merchandiser:2', true, 'merchandisers'),
      ],
      OPTIONS,
    );

    const clusters = index
      .getViewportItems(WORLD_BOUNDS, 7, undefined)
      .filter(item => item.kind === 'cluster');

    expect(clusters).toHaveLength(2);
    expect(clusters.map(cluster => cluster.clusterGroup)).toEqual([
      'merchandisers',
      'stores',
    ]);
    expect(clusters.map(cluster => cluster.markerIds)).toEqual([
      ['merchandiser:1', 'merchandiser:2'],
      ['store:1', 'store:2'],
    ]);
    expect(new Set(clusters.map(cluster => cluster.key)).size).toBe(2);
  });

  it('removes stale clusters when markers move between groups', () => {
    const index = new MapMarkerClusterIndex();
    index.load(
      [
        marker('store:1', true, 'stores'),
        marker('store:2', true, 'stores'),
      ],
      OPTIONS,
    );
    expect(index.getViewportItems(WORLD_BOUNDS, 7, undefined)).toHaveLength(1);

    index.load(
      [
        marker('store:1', true, 'stores'),
        marker('store:2', true, 'active-visits'),
      ],
      OPTIONS,
    );
    const separated = index.getViewportItems(WORLD_BOUNDS, 7, undefined);

    expect(separated).toHaveLength(2);
    expect(separated.every(item => item.kind === 'marker')).toBe(true);
  });

  it('reconciles clusterable transitions, selection, refresh, and removal', () => {
    const index = new MapMarkerClusterIndex();
    index.load(
      [
        marker('store:1', true),
        marker('store:2', true),
        marker('merchandiser:1', false),
      ],
      OPTIONS,
    );
    expect(
      index
        .getViewportItems(WORLD_BOUNDS, 7, 'merchandiser:1')
        .find(item => item.kind === 'marker'),
    ).toEqual(
      expect.objectContaining({
        marker: expect.objectContaining({
          id: 'merchandiser:1',
          clusterable: false,
        }),
      }),
    );

    index.load(
      [
        marker('store:1', false),
        marker('store:2', true),
        marker('merchandiser:1', false),
      ],
      OPTIONS,
    );
    const transitioned = index.getViewportItems(
      WORLD_BOUNDS,
      7,
      'store:1',
    );
    expect(transitioned).toHaveLength(3);
    expect(transitioned.every(item => item.kind === 'marker')).toBe(true);

    index.load([marker('store:2', false)], OPTIONS);
    expect(index.getViewportItems(WORLD_BOUNDS, 7, 'store:1')).toEqual([
      expect.objectContaining({
        kind: 'marker',
        key: 'string:store:2',
      }),
    ]);

    index.load([], OPTIONS);
    expect(index.getViewportItems(WORLD_BOUNDS, 7, undefined)).toEqual([]);
  });
});

function marker(id: string, clusterable: boolean, clusterGroup?: string): QMapMarker {
  return {
    id,
    latitude: -33.9249,
    longitude: 18.4241,
    label: id,
    clusterable,
    ...(clusterGroup ? { clusterGroup } : {}),
  };
}
