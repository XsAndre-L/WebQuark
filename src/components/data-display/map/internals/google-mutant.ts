import type {} from 'leaflet.gridlayer.googlemutant';
import type * as Leaflet from 'leaflet';

type LeafletModule = typeof import('leaflet');
type GoogleMutantFactory = (options?: Leaflet.gridLayer.GoogleMutantOptions) => Leaflet.GridLayer;

export interface GoogleMutantConstructor {
  new (options?: Leaflet.gridLayer.GoogleMutantOptions): Leaflet.GridLayer;
}

interface LeafletFactoryHost {
  googleMutant?: GoogleMutantFactory;
}

type LeafletGlobal = typeof globalThis & {
  L?: LeafletModule;
};

let googleMutantConstructorPromise: Promise<GoogleMutantConstructor> | undefined;

/**
 * Lazily loads GoogleMutant's ESM constructor without leaving Leaflet on the
 * global object.
 *
 * GoogleMutant 0.16.0's ESM file still executes its legacy `L.gridLayer`
 * factory footer. Supplying the exact ESM Leaflet namespace during module
 * evaluation avoids its `L is not defined` error; both incidental globals are
 * restored immediately afterwards. Consumers must instantiate the returned
 * default constructor rather than the legacy factory, whose ESM registration
 * is incomplete in 0.16.0.
 */
export function loadGoogleMutantConstructor(leaflet: LeafletModule): Promise<GoogleMutantConstructor> {
  if (!googleMutantConstructorPromise) {
    googleMutantConstructorPromise = importGoogleMutantConstructor(leaflet).catch((error: unknown) => {
      googleMutantConstructorPromise = undefined;
      throw error;
    });
  }

  return googleMutantConstructorPromise;
}

async function importGoogleMutantConstructor(leaflet: LeafletModule): Promise<GoogleMutantConstructor> {
  if (typeof window === 'undefined') {
    throw new Error('QMap: GoogleMutant is only available in a browser environment.');
  }

  const globals = globalThis as LeafletGlobal;
  const factoryHost = leaflet.gridLayer as LeafletFactoryHost;
  const hasOwn = Object.prototype.hasOwnProperty;
  const hadLeafletGlobal = hasOwn.call(globals, 'L');
  const previousLeafletGlobal = globals.L;
  const hadGoogleMutantFactory = hasOwn.call(factoryHost, 'googleMutant');
  const previousGoogleMutantFactory = factoryHost.googleMutant;

  globals.L = leaflet;

  try {
    const module = await import('leaflet.gridlayer.googlemutant/src/Leaflet.GoogleMutant.mjs');
    if (typeof module.default !== 'function') {
      throw new Error('QMap: GoogleMutant did not expose its default constructor.');
    }
    return module.default;
  } finally {
    if (hadGoogleMutantFactory) factoryHost.googleMutant = previousGoogleMutantFactory;
    else delete factoryHost.googleMutant;

    if (hadLeafletGlobal) globals.L = previousLeafletGlobal;
    else delete globals.L;
  }
}
