const GOOGLE_MAPS_VERSION = 'quarterly';
const GOOGLE_MAPS_SCRIPT_URL = 'https://maps.googleapis.com/maps/api/js';

interface GoogleMapsNamespace {
  Map?: unknown;
  importLibrary?: (libraryName: string) => Promise<unknown>;
}

interface GoogleMapsWindow extends Window {
  google?: { maps?: GoogleMapsNamespace };
}

let configuredApiKey: string | undefined;
let googleMapsLoadPromise: Promise<void> | undefined;
let callbackSequence = 0;

/** Returns whether the Maps JavaScript API has exposed the constructor GoogleMutant needs. */
export function hasGoogleMapsApi(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as GoogleMapsWindow).google?.maps?.Map === 'function';
}

/** Returns whether Google Maps is loaded or exposes an application-owned library importer. */
export function hasGoogleMapsConfiguration(): boolean {
  if (hasGoogleMapsApi()) return true;
  if (typeof window === 'undefined') return false;
  return typeof (window as GoogleMapsWindow).google?.maps?.importLibrary === 'function';
}

/**
 * Loads Google Maps once per browser realm, reusing an application-owned API
 * and allowing a fresh key after a failed WebQuark-owned script attempt.
 */
export function loadGoogleMapsApi(apiKey: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('QMap: Google Maps is only available in a browser environment.'));
  }

  if (hasGoogleMapsApi()) return Promise.resolve();

  const normalizedApiKey = apiKey.trim();
  const externalImporter = (window as GoogleMapsWindow).google?.maps?.importLibrary;

  if (googleMapsLoadPromise) {
    if (configuredApiKey && normalizedApiKey && configuredApiKey !== normalizedApiKey) {
      return Promise.reject(new Error('QMap: Google Maps is already loading with a different API key.'));
    }
    return googleMapsLoadPromise;
  }

  if (externalImporter) {
    googleMapsLoadPromise = loadWithExternalImporter(externalImporter);
    return googleMapsLoadPromise;
  }

  if (!normalizedApiKey) return Promise.reject(new Error('QMap: A Google Maps API key is required.'));

  configuredApiKey = normalizedApiKey;
  googleMapsLoadPromise = loadWithScript(normalizedApiKey).catch((cause: unknown) => {
    configuredApiKey = undefined;
    googleMapsLoadPromise = undefined;
    throw new Error('QMap: Google Maps failed to load.', { cause });
  });
  return googleMapsLoadPromise;
}

function loadWithExternalImporter(importLibrary: (libraryName: string) => Promise<unknown>): Promise<void> {
  googleMapsLoadPromise = importLibrary('maps')
    .then(() => assertGoogleMapsApi())
    .catch((cause: unknown) => {
      googleMapsLoadPromise = undefined;
      throw new Error('QMap: Google Maps failed to load.', { cause });
    });
  return googleMapsLoadPromise;
}

function loadWithScript(apiKey: string): Promise<void> {
  const targetWindow = window as GoogleMapsWindow;
  const previousGoogle = targetWindow.google;
  const previousMaps = previousGoogle?.maps;
  const callbackName = `__webquarkGoogleMapsReady${++callbackSequence}`;
  const callbackHost = targetWindow as unknown as Record<string, unknown>;
  const script = document.createElement('script');
  const params = new URLSearchParams({ callback: callbackName, key: apiKey, loading: 'async', v: GOOGLE_MAPS_VERSION });

  script.async = true;
  script.defer = true;
  script.src = `${GOOGLE_MAPS_SCRIPT_URL}?${params.toString()}`;
  script.dataset.webquarkGoogleMaps = 'true';
  const nonce = document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce;
  if (nonce) script.nonce = nonce;

  return new Promise<void>((resolve, reject) => {
    const cleanup = (failed: boolean) => {
      delete callbackHost[callbackName];
      script.onerror = null;
      if (failed) {
        script.remove();
        restoreGoogleMapsNamespace(targetWindow, previousGoogle, previousMaps);
      }
    };

    callbackHost[callbackName] = () => {
      try {
        assertGoogleMapsApi();
        cleanup(false);
        resolve();
      } catch (error) {
        cleanup(true);
        reject(error);
      }
    };
    script.onerror = () => {
      cleanup(true);
      reject(new Error('The Google Maps script could not be loaded.'));
    };
    document.head.append(script);
  });
}

function assertGoogleMapsApi(): void {
  if (!hasGoogleMapsApi()) throw new Error('The Maps library loaded without exposing google.maps.Map.');
}

function restoreGoogleMapsNamespace(
  targetWindow: GoogleMapsWindow,
  previousGoogle: GoogleMapsWindow['google'],
  previousMaps: GoogleMapsNamespace | undefined,
): void {
  if (!previousGoogle) {
    delete targetWindow.google;
    return;
  }

  targetWindow.google = previousGoogle;
  if (previousMaps) previousGoogle.maps = previousMaps;
  else delete previousGoogle.maps;
}
