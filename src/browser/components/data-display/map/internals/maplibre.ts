import type {} from '@maplibre/maplibre-gl-leaflet';
import type * as Leaflet from 'leaflet';
import type { ErrorEvent as MapLibreErrorEvent, Map as MapLibreMap } from 'maplibre-gl';

type LeafletModule = typeof import('leaflet');
interface MapLibreLeafletOptions extends Leaflet.LeafletMaplibreGLOptions {
  /** Extra viewport rendered outside the visible Leaflet bounds. */
  padding?: number;
  /** Minimum delay between Leaflet-to-MapLibre position synchronizations. */
  updateInterval?: number;
}

type MapLibreLayerFactory = (options: MapLibreLeafletOptions) => Leaflet.Layer;

interface LeafletMapLibreHost {
  maplibreGL?: MapLibreLayerFactory;
}

interface MapLibreLeafletLayer extends Leaflet.Layer {
  getMaplibreMap(): MapLibreMap;
}

const VECTOR_STYLE_LOAD_TIMEOUT_MS = 15_000;

let mapLibreLayerFactoryPromise: Promise<MapLibreLayerFactory> | undefined;

/** Lazily loads MapLibre's Leaflet adapter and returns its registered layer factory. */
export function loadMapLibreLayerFactory(leaflet: LeafletModule): Promise<MapLibreLayerFactory> {
  if (!mapLibreLayerFactoryPromise) {
    mapLibreLayerFactoryPromise = importMapLibreLayerFactory(leaflet).catch((error: unknown) => {
      mapLibreLayerFactoryPromise = undefined;
      throw error;
    });
  }

  return mapLibreLayerFactoryPromise;
}

async function importMapLibreLayerFactory(leaflet: LeafletModule): Promise<MapLibreLayerFactory> {
  if (typeof window === 'undefined') {
    throw new Error('QMap: the vector provider is only available in a browser environment.');
  }

  await import('@maplibre/maplibre-gl-leaflet');

  const factory = (leaflet as LeafletMapLibreHost).maplibreGL;
  if (typeof factory !== 'function') {
    throw new Error('QMap: MapLibre did not register its Leaflet layer factory.');
  }

  return factory;
}

/** Waits until the vector style has loaded so provider fallback remains transactional. */
export function waitForMapLibreLayerReady(layer: Leaflet.Layer): Promise<void> {
  const getMaplibreMap = (layer as unknown as Partial<MapLibreLeafletLayer>).getMaplibreMap;
  if (typeof getMaplibreMap !== 'function') {
    return Promise.reject(new Error('QMap: the vector layer did not expose its MapLibre map.'));
  }

  const map = getMaplibreMap.call(layer);
  if (map.loaded()) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const handleLoad = () => finish(resolve);
    const handleError = (event: MapLibreErrorEvent) => {
      finish(() => reject(event.error ?? new Error('QMap: the vector style failed to load.')));
    };
    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error('QMap: the vector style timed out while loading.')));
    }, VECTOR_STYLE_LOAD_TIMEOUT_MS);
    const finish = (complete: () => void) => {
      window.clearTimeout(timeout);
      map.off('load', handleLoad);
      map.off('error', handleError);
      complete();
    };

    map.on('load', handleLoad);
    map.on('error', handleError);
  });
}
