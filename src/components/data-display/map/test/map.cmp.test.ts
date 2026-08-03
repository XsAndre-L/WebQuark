import { afterEach, describe, expect, it } from 'vitest';

import type {
  QMapClusterSelectDetail,
  QMapErrorDetail,
  QMapMarker,
  QMapMarkerSelectDetail,
  QMapStatusChangeDetail,
} from '../map.types';
import mapStyles from '../map.css?inline';
import '../map';

let pendingGoogleScript: HTMLScriptElement | undefined;
let restoreHeadAppend: (() => void) | undefined;

async function waitForReady(element: HTMLQMapElement): Promise<void> {
  await new Promise<void>(resolve => element.addEventListener('qReady', () => resolve(), { once: true }));
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function waitForReadyOrError(
  element: HTMLQMapElement,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    element.addEventListener('qReady', () => resolve(), { once: true });
    element.addEventListener(
      'qError',
      event =>
        reject(
          new Error(
            (event as CustomEvent<QMapErrorDetail>).detail.message,
          ),
        ),
      { once: true },
    );
  });
  await new Promise<void>(resolve =>
    requestAnimationFrame(() => resolve()),
  );
}

async function failGoogleLoader(): Promise<void> {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (pendingGoogleScript?.onerror) {
      pendingGoogleScript.onerror(new Event('error'));
      return;
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  throw new Error('Google Maps loader script was not created.');
}

function interceptGoogleLoaderScript(): void {
  const originalAppend = document.head.append.bind(document.head);
  document.head.append = (...nodes: (Node | string)[]) => {
    const loader = nodes.find(node => node instanceof HTMLScriptElement && node.dataset.webquarkGoogleMaps === 'true');
    if (loader instanceof HTMLScriptElement) {
      pendingGoogleScript = loader;
      return;
    }
    originalAppend(...nodes);
  };
  restoreHeadAppend = () => {
    document.head.append = originalAppend;
    pendingGoogleScript = undefined;
    restoreHeadAppend = undefined;
  };
}

describe('q-map in Chromium', () => {
  afterEach(() => {
    restoreHeadAppend?.();
    Reflect.deleteProperty(window, 'google');
    document.body.replaceChildren();
  });

  it('renders accessible configuration state and reports lifecycle transitions', async () => {
    const element = document.createElement('q-map');
    const statuses: QMapStatusChangeDetail[] = [];
    element.ariaLabel = 'Team locations';
    element.addEventListener('qStatusChange', event => {
      statuses.push((event as CustomEvent<QMapStatusChangeDetail>).detail);
    });
    const ready = waitForReady(element);
    document.body.append(element);
    await ready;

    const canvas = element.shadowRoot?.querySelector<HTMLElement>('[part="canvas"]');
    const empty = element.shadowRoot?.querySelector<HTMLElement>('[part="empty"]');
    expect(canvas?.getAttribute('role')).toBe('region');
    expect(canvas?.getAttribute('aria-label')).toBe('Team locations');
    expect(canvas?.getAttribute('aria-busy')).toBeNull();
    expect(empty?.textContent).toContain('Map provider is not configured.');
    expect(statuses.map(status => status.status)).toEqual(['initializing', 'empty']);
  });

  it('keeps numeric and string marker IDs independent for rendering and selection', async () => {
    const element = document.createElement('q-map');
    element.markers = [
      { id: 1, latitude: -26.2041, longitude: 28.0473, label: 'Numeric marker' },
      { id: '1', latitude: -26.21, longitude: 28.05, label: 'String marker', variant: 'success' },
    ];
    element.selectedMarkerId = '1';
    const selections: QMapMarkerSelectDetail[] = [];
    element.addEventListener('qMarkerSelect', event => {
      selections.push((event as CustomEvent<QMapMarkerSelectDetail>).detail);
    });
    const ready = waitForReady(element);
    document.body.append(element);
    await ready;

    const markers = element.shadowRoot?.querySelectorAll<HTMLElement>('[part~="marker"]');
    expect(markers).toHaveLength(2);
    expect(markers?.[0].dataset.markerId).toBe('number:1');
    expect(markers?.[0].getAttribute('aria-pressed')).toBe('false');
    expect(markers?.[1].dataset.markerId).toBe('string:1');
    expect(markers?.[1].getAttribute('aria-pressed')).toBe('true');

    markers?.[1].click();
    expect(selections).toHaveLength(1);
    expect(selections[0].marker.id).toBe('1');
    expect(selections[0].originalEvent).toBeInstanceOf(MouseEvent);
  });

  it('renders and updates a selected marker callout with measurable text', async () => {
    const element = document.createElement('q-map');
    element.markers = [
      {
        id: 'store:1',
        latitude: -26.2041,
        longitude: 28.0473,
        label: 'Store',
        callout: {
          title: 'Store',
          subtitle: 'CUST-001 | JHB',
          status: {
            label: 'Upcoming',
            variant: 'default',
          },
          visibility: 'selected',
        },
      },
    ];
    element.selectedMarkerId = 'store:1';
    const ready = waitForReady(element);
    document.body.append(element);
    await ready;
    const style = document.createElement('style');
    style.textContent = mapStyles;
    element.shadowRoot?.prepend(style);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    const callout = element.shadowRoot?.querySelector<HTMLElement>('[part~="marker-callout"]');
    const title = callout?.querySelector<HTMLElement>('.q-map-callout__title');
    const subtitle = callout?.querySelector<HTMLElement>('.q-map-callout__subtitle');
    const status = callout?.querySelector<HTMLElement>('.q-map-callout__status');
    expect(callout?.textContent).toContain('Store');
    expect(subtitle?.textContent).toBe('CUST-001 | JHB');
    expect(status?.textContent).toBe('Upcoming');
    expect(title?.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(subtitle?.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(status?.getBoundingClientRect().left).toBeGreaterThan(
      title?.getBoundingClientRect().right ?? 0,
    );
    const calloutStyle = getComputedStyle(callout as HTMLElement);
    const directionalOffset = Math.max(
      ...[
        calloutStyle.marginTop,
        calloutStyle.marginRight,
        calloutStyle.marginBottom,
        calloutStyle.marginLeft,
      ].map(value => Math.abs(Number.parseFloat(value))),
    );
    expect(directionalOffset).toBe(20);
    const initialWidth = callout?.getBoundingClientRect().width ?? 0;
    const initialTransform = callout?.style.transform;

    element.markers = [
      {
        id: 'store:1',
        latitude: -26.2041,
        longitude: 28.0473,
        label: 'Updated Main Street Supermarket',
        callout: {
          title: 'Updated Main Street Supermarket',
          subtitle: 'CUST-002 | Pretoria Central',
          status: {
            label: 'Attention',
            variant: 'warning',
          },
          visibility: 'selected',
        },
      },
    ];
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    const updatedCallout = element.shadowRoot?.querySelector<HTMLElement>('[part~="marker-callout"]');
    expect(updatedCallout?.textContent).toContain('Updated Main Street Supermarket');
    expect(updatedCallout?.textContent).toContain('CUST-002 | Pretoria Central');
    expect(updatedCallout?.textContent).toContain('Attention');
    expect(
      updatedCallout
        ?.querySelector('.q-map-callout__status')
        ?.classList.contains('variant-warning'),
    ).toBe(true);
    expect(updatedCallout?.getBoundingClientRect().width).toBeGreaterThan(initialWidth);
    expect(updatedCallout?.style.transform).not.toBe(initialTransform);

    element.selectedMarkerId = undefined;
    await expect.poll(
      () => element.shadowRoot?.querySelector('[part~="marker-callout"]'),
    ).toBeNull();
  });

  it('reports the shared cluster group for markers from different sources', async () => {
    const element = document.createElement('q-map');
    element.centerLatitude = -33.9249;
    element.centerLongitude = 18.4241;
    element.zoom = 7;
    element.clusterMarkers = true;
    element.markers = [
      {
        id: 'store:1',
        latitude: -33.9249,
        longitude: 18.4241,
        label: 'Store one',
        clusterGroup: 'field-activity',
      },
      {
        id: 'merchandiser:1',
        latitude: -33.9249,
        longitude: 18.4241,
        label: 'Merchandiser one',
        clusterGroup: 'field-activity',
      },
    ];
    const clusters: QMapClusterSelectDetail[] = [];
    element.addEventListener('qClusterSelect', event => {
      clusters.push((event as CustomEvent<QMapClusterSelectDetail>).detail);
    });
    const ready = waitForReadyOrError(element);
    document.body.append(element);
    await ready;

    const cluster = element.shadowRoot?.querySelector<HTMLElement>('[part~="cluster"]');
    expect(cluster?.dataset.clusterGroup).toBe('field-activity');
    expect(cluster?.getAttribute('part')?.split(/\s+/)).toContain(
      'cluster-group-field-activity',
    );
    cluster?.click();
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toEqual(expect.objectContaining({
      clusterGroup: 'field-activity',
      markerIds: ['merchandiser:1', 'store:1'],
    }));
  });

  it('separates overlapping cluster groups by 75% of the visible diameter', async () => {
    const element = document.createElement('q-map');
    element.centerLatitude = -33.9249;
    element.centerLongitude = 18.4241;
    element.zoom = 7;
    element.clusterMarkers = true;
    element.markers = [
      {
        id: 'store:1',
        latitude: -33.9249,
        longitude: 18.4241,
        label: 'Store one',
        clusterGroup: 'stores',
      },
      {
        id: 'store:2',
        latitude: -33.9249,
        longitude: 18.4241,
        label: 'Store two',
        clusterGroup: 'stores',
      },
      {
        id: 'merchandiser:1',
        latitude: -33.9249,
        longitude: 18.4241,
        label: 'Merchandiser one',
        clusterGroup: 'merchandisers',
      },
      {
        id: 'merchandiser:2',
        latitude: -33.9249,
        longitude: 18.4241,
        label: 'Merchandiser two',
        clusterGroup: 'merchandisers',
      },
    ];
    const ready = waitForReadyOrError(element);
    document.body.append(element);
    await ready;
    const style = document.createElement('style');
    style.textContent = mapStyles;
    element.shadowRoot?.prepend(style);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    const stores = element.shadowRoot?.querySelector<HTMLElement>(
      '[data-cluster-group="stores"]',
    );
    const merchandisers = element.shadowRoot?.querySelector<HTMLElement>(
      '[data-cluster-group="merchandisers"]',
    );
    const storeBounds = stores?.getBoundingClientRect();
    const merchandiserBounds = merchandisers?.getBoundingClientRect();
    expect(storeBounds && merchandiserBounds).toBeTruthy();

    const visibleDiameter = Math.max(
      storeBounds?.width ?? 0,
      storeBounds?.height ?? 0,
    );
    const centerDistance = storeBounds && merchandiserBounds
      ? Math.hypot(
          (merchandiserBounds.left + merchandiserBounds.width / 2)
            - (storeBounds.left + storeBounds.width / 2),
          (merchandiserBounds.top + merchandiserBounds.height / 2)
            - (storeBounds.top + storeBounds.height / 2),
        )
      : 0;
    expect(centerDistance).toBeCloseTo(visibleDiameter * 0.75, 0);
    expect(centerDistance).toBeLessThan(visibleDiameter);
  });

  it('keeps standalone markers at their true position above eligible clusters', async () => {
    const element = document.createElement('q-map');
    const markers: QMapMarker[] = [
      {
        id: 'store:1',
        latitude: -33.9249,
        longitude: 18.4241,
        label: 'Store one',
      },
      {
        id: 'store:2',
        latitude: -33.9249,
        longitude: 18.4241,
        label: 'Store two',
      },
      {
        id: 'merchandiser:1',
        latitude: -33.9249,
        longitude: 18.4241,
        label: 'Merchandiser one',
        clusterable: false,
      },
    ];
    element.centerLatitude = -33.9249;
    element.centerLongitude = 18.4241;
    element.zoom = 7;
    element.clusterMarkers = true;
    element.markers = markers;
    const clusters: QMapClusterSelectDetail[] = [];
    const selections: QMapMarkerSelectDetail[] = [];
    element.addEventListener('qClusterSelect', event => {
      clusters.push((event as CustomEvent<QMapClusterSelectDetail>).detail);
    });
    element.addEventListener('qMarkerSelect', event => {
      selections.push((event as CustomEvent<QMapMarkerSelectDetail>).detail);
    });
    const ready = waitForReadyOrError(element);
    document.body.append(element);
    await ready;
    const style = document.createElement('style');
    style.textContent = mapStyles;
    element.shadowRoot?.prepend(style);
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => resolve()),
    );

    const cluster = element.shadowRoot?.querySelector<HTMLElement>(
      '[part~="cluster"]',
    );
    const standalone = element.shadowRoot?.querySelector<HTMLElement>(
      '[data-marker-id="string:merchandiser:1"]',
    );
    expect(cluster?.textContent).toContain('2');
    expect(standalone).not.toBeNull();
    const clusterBounds = cluster?.getBoundingClientRect();
    const standaloneBounds = standalone?.getBoundingClientRect();
    expect(clusterBounds && standaloneBounds).toBeTruthy();
    expect(
      clusterBounds
      && standaloneBounds
      && Math.abs(
        (clusterBounds.left + clusterBounds.width / 2)
        - (standaloneBounds.left + standaloneBounds.width / 2),
      ),
    ).toBeLessThan(1);
    expect(
      clusterBounds
      && standaloneBounds
      && Math.abs(
        (clusterBounds.top + clusterBounds.height / 2)
        - (standaloneBounds.top + standaloneBounds.height / 2),
      ),
    ).toBeLessThan(1);
    expect(Number(standalone?.style.zIndex)).toBeGreaterThan(
      Number(cluster?.style.zIndex),
    );

    const standaloneHit = standaloneBounds
      ? element.shadowRoot?.elementFromPoint(
          standaloneBounds.left + standaloneBounds.width / 2,
          standaloneBounds.top + standaloneBounds.height / 2,
        )
      : undefined;
    expect(standaloneHit).toBe(standalone);
    standaloneHit?.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      clientX: standaloneBounds?.left,
      clientY: standaloneBounds?.top,
    }));
    expect(selections.map(selection => selection.marker.id)).toEqual([
      'merchandiser:1',
    ]);

    cluster?.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      clientX: clusterBounds?.left,
      clientY: clusterBounds?.top,
    }));
    expect(clusters).toHaveLength(1);
    expect(clusters[0].markerIds).toEqual(['store:1', 'store:2']);

    element.markers = markers.map(marker => ({
      ...marker,
      clusterable: false,
    }));
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => resolve()),
    );

    expect(
      element.shadowRoot?.querySelectorAll('[part~="cluster"]'),
    ).toHaveLength(0);
    expect(
      element.shadowRoot?.querySelectorAll('[part~="marker"]'),
    ).toHaveLength(3);
  });

  it('renders attribution as text and refuses unsafe link schemes', async () => {
    const element = document.createElement('q-map');
    element.attribution = '<strong>Map provider</strong>';
    element.attributionUrl = 'javascript:alert(1)';
    element.tileUrl = 'https://tiles.example/{z}/{x}/{y}.png';
    const ready = waitForReady(element);
    document.body.append(element);
    await ready;

    const attribution = element.shadowRoot?.querySelector<HTMLElement>('[part="attribution"]');
    expect(attribution?.tagName).toBe('SPAN');
    expect(attribution?.textContent).toBe('<strong>Map provider</strong>');
    expect(attribution?.querySelector('strong')).toBeNull();
  });

  it('applies raster filtering once at the tile-pane level', async () => {
    const element = document.createElement('q-map');
    element.tileUrl =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    element.style.setProperty('--q-map-tile-filter', 'grayscale(1)');
    const ready = waitForReady(element);
    document.body.append(element);
    await ready;
    const style = document.createElement('style');
    style.textContent = mapStyles;
    element.shadowRoot?.prepend(style);
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => resolve()),
    );

    const pane = element.shadowRoot?.querySelector<HTMLElement>(
      '.leaflet-tile-pane',
    );
    const tile = pane?.querySelector<HTMLElement>('.leaflet-tile');

    expect(getComputedStyle(pane as HTMLElement).filter).toBe('grayscale(1)');
    expect(tile && getComputedStyle(tile).filter).toBe('none');
  });

  it('reports malformed initial and runtime bounds without turning them into clears', async () => {
    const element = document.createElement('q-map');
    const errors: QMapErrorDetail[] = [];
    element.maxBounds = '{}';
    element.addEventListener('qError', event => {
      errors.push((event as CustomEvent<QMapErrorDetail>).detail);
    });
    const ready = waitForReady(element);
    document.body.append(element);
    await ready;

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: 'invalid-max-bounds', recoverable: true });

    element.maxBounds = {
      southLatitude: -26.65,
      westLongitude: 27.54,
      northLatitude: -25.75,
      eastLongitude: 28.55,
    };
    await new Promise(resolve => requestAnimationFrame(resolve));
    element.maxBounds = '{';
    await new Promise(resolve => requestAnimationFrame(resolve));

    expect(errors).toHaveLength(2);
    expect(errors[1].message).toContain('valid JSON');
  });

  it('renders an explicit error and emits typed failure state when no provider can activate', async () => {
    const element = document.createElement('q-map');
    const errors: QMapErrorDetail[] = [];
    const statuses: QMapStatusChangeDetail[] = [];
    element.provider = 'google';
    element.googleApiKey = 'invalid-key';
    element.addEventListener('qError', event => {
      errors.push((event as CustomEvent<QMapErrorDetail>).detail);
    });
    element.addEventListener('qStatusChange', event => {
      statuses.push((event as CustomEvent<QMapStatusChangeDetail>).detail);
    });
    interceptGoogleLoaderScript();
    const ready = waitForReady(element);
    document.body.append(element);
    await failGoogleLoader();
    await ready;

    const error = element.shadowRoot?.querySelector<HTMLElement>('[part="error"]');
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.textContent).toContain('Map imagery failed to load.');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: 'provider-initialization-failed', requestedProvider: 'google' });
    expect(statuses.at(-1)).toEqual({
      status: 'error',
      requestedProvider: 'google',
      activeProvider: undefined,
      usingFallback: false,
    });
  });

  it('reports a Google failure while exposing a successful tile fallback', async () => {
    const element = document.createElement('q-map');
    const errors: QMapErrorDetail[] = [];
    const statuses: QMapStatusChangeDetail[] = [];
    element.provider = 'google';
    element.googleApiKey = 'invalid-key';
    element.tileUrl = 'https://tiles.example/{z}/{x}/{y}.png';
    element.attribution = 'Fallback tiles';
    element.addEventListener('qError', event => {
      errors.push((event as CustomEvent<QMapErrorDetail>).detail);
    });
    element.addEventListener('qStatusChange', event => {
      statuses.push((event as CustomEvent<QMapStatusChangeDetail>).detail);
    });
    interceptGoogleLoaderScript();
    const ready = waitForReady(element);
    document.body.append(element);
    await failGoogleLoader();
    await ready;

    expect(element.shadowRoot?.querySelector('[part="error"]')).toBeNull();
    expect(element.shadowRoot?.querySelector('[part="attribution"]')?.textContent).toBe('Fallback tiles');
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('provider-initialization-failed');
    expect(statuses.at(-1)).toEqual({
      status: 'ready',
      requestedProvider: 'google',
      activeProvider: 'tiles',
      usingFallback: true,
    });
  });
});
