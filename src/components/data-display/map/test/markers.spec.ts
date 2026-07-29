import { describe, expect, it } from 'vitest';

import { Q_MAP_MARKER_VARIANTS } from '../map.types';
import type { QMapMarker } from '../map.types';
import { getMapMarkerKey, getMapMarkers } from '../internals/markers';

describe('q-map marker normalization', () => {
  it('keeps numeric and string IDs type-stable', () => {
    expect(getMapMarkerKey(1)).toBe('number:1');
    expect(getMapMarkerKey('1')).toBe('string:1');
    expect(getMapMarkerKey(1)).not.toBe(getMapMarkerKey('1'));
  });

  it('retains records whose IDs have equal text but different primitive types', () => {
    const markers = getMapMarkers([
      { id: 1, latitude: 0, longitude: 0, label: 'Numeric' },
      { id: '1', latitude: 1, longitude: 1, label: 'String' },
    ]);

    expect(markers.map(marker => marker.id)).toEqual([1, '1']);
  });

  it('uses the exported runtime variant set for normalization', () => {
    const markers = getMapMarkers([
      { id: 'valid', latitude: 0, longitude: 0, label: 'Valid', variant: 'success' },
      { id: 'invalid', latitude: 0, longitude: 0, label: 'Invalid', variant: 'unknown' as 'success' },
    ]);

    expect(Q_MAP_MARKER_VARIANTS).toEqual(['default', 'success', 'warning', 'danger', 'muted']);
    expect(markers.map(marker => marker.variant)).toEqual(['success', 'default']);
  });

  it('defaults omitted and invalid clusterable values to true for array input', () => {
    const markers = getMapMarkers([
      { id: 'omitted', latitude: 0, longitude: 0, label: 'Omitted' },
      {
        id: 'invalid',
        latitude: 1,
        longitude: 1,
        label: 'Invalid',
        clusterable: 'false' as unknown as boolean,
      },
      {
        id: 'standalone',
        latitude: 2,
        longitude: 2,
        label: 'Standalone',
        clusterable: false,
      },
    ]);

    expect(markers.map(marker => marker.clusterable)).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('preserves explicit false and defaults omitted values for JSON input', () => {
    const markers = getMapMarkers(
      JSON.stringify([
        {
          id: 'clustered',
          latitude: 0,
          longitude: 0,
          label: 'Clustered',
        },
        {
          id: 'standalone',
          latitude: 1,
          longitude: 1,
          label: 'Standalone',
          clusterable: false,
        },
      ]),
    );

    expect(markers.map(marker => marker.clusterable)).toEqual([true, false]);
  });

  it('normalizes callout text and defaults its presentation options', () => {
    const [marker] = getMapMarkers([
      {
        id: 'store',
        latitude: 0,
        longitude: 0,
        label: 'Store',
        callout: {
          title: '  Main Street Store  ',
          subtitle: '  CUST-001 | Johannesburg  ',
          meta: '  Visit due  ',
          status: {
            label: '  Attention  ',
            variant: 'warning',
          },
        },
      },
    ]);

    expect(marker.callout).toEqual({
      title: 'Main Street Store',
      subtitle: 'CUST-001 | Johannesburg',
      meta: 'Visit due',
      status: {
        label: 'Attention',
        variant: 'warning',
      },
      variant: 'default',
      placement: 'auto',
      visibility: 'always',
    });
  });

  it('removes callouts without a meaningful title', () => {
    const markers = getMapMarkers([
      {
        id: 'blank',
        latitude: 0,
        longitude: 0,
        label: 'Blank callout',
        callout: {
          title: '   ',
          subtitle: 'Ignored subtitle',
        },
      },
      {
        id: 'invalid',
        latitude: 1,
        longitude: 1,
        label: 'Invalid callout',
        callout: 'Store details' as unknown as QMapMarker['callout'],
      },
    ]);

    expect(markers.map(marker => marker.callout)).toEqual([undefined, undefined]);
  });

  it('removes callout statuses without a meaningful label', () => {
    const [marker] = getMapMarkers([
      {
        id: 'store',
        latitude: 0,
        longitude: 0,
        label: 'Store',
        callout: {
          title: 'Store',
          status: {
            label: '   ',
            variant: 'warning',
          },
        },
      },
    ]);

    expect(marker.callout).toEqual({
      title: 'Store',
      variant: 'default',
      placement: 'auto',
      visibility: 'always',
    });
  });
});
