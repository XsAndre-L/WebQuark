const GOOGLE_MAPS_VERSION = 'quarterly';

interface GoogleMapsWindow extends Window {
  google?: {
    maps?: {
      Map?: unknown;
      importLibrary?: unknown;
    };
  };
}

let configuredApiKey: string | undefined;
let googleMapsLoadPromise: Promise<void> | undefined;

/** Returns whether the Maps JavaScript API has exposed the constructor GoogleMutant needs. */
export function hasGoogleMapsApi(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as GoogleMapsWindow).google?.maps?.Map === 'function';
}

/**
 * Loads the Google Maps JavaScript API once for the current browser realm.
 *
 * Google owns a single global API configuration per page, so the first API key
 * used by WebQuark wins. A Maps API loaded by the application is reused.
 */
export function loadGoogleMapsApi(apiKey: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('QMap: Google Maps is only available in a browser environment.'));
  }

  const normalizedApiKey = apiKey.trim();
  if (configuredApiKey && normalizedApiKey && configuredApiKey !== normalizedApiKey) {
    return Promise.reject(new Error('QMap: Google Maps is already loading with a different API key.'));
  }

  if (hasGoogleMapsApi()) return Promise.resolve();

  const maps = (window as GoogleMapsWindow).google?.maps;
  const hasExternalImporter = typeof maps?.importLibrary === 'function';

  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  if (!normalizedApiKey && !hasExternalImporter) {
    return Promise.reject(new Error('QMap: A Google Maps API key is required.'));
  }

  if (!hasExternalImporter) configuredApiKey = normalizedApiKey;

  googleMapsLoadPromise = (async () => {
    const { importLibrary, setOptions } = await import('@googlemaps/js-api-loader');

    // An application-owned loader already has its own immutable options. An
    // empty call records that setup without attempting to replace those options.
    setOptions(hasExternalImporter ? {} : { key: normalizedApiKey, v: GOOGLE_MAPS_VERSION });
    await importLibrary('maps');

    if (!hasGoogleMapsApi()) {
      throw new Error('The Maps library loaded without exposing google.maps.Map.');
    }
  })().catch((cause: unknown) => {
    googleMapsLoadPromise = undefined;
    throw new Error('QMap: Google Maps failed to load.', { cause });
  });

  return googleMapsLoadPromise;
}
