import { beforeEach, describe, expect, it, vi } from 'vitest';

interface TestGoogleWindow extends Window {
  google?: {
    maps?: {
      Map?: unknown;
      importLibrary?: (libraryName: string) => Promise<unknown>;
    };
  };
}

function getLoaderScript(): HTMLScriptElement {
  const script = document.querySelector<HTMLScriptElement>('script[data-webquark-google-maps="true"]');
  if (!script) throw new Error('Expected the Google Maps loader script.');
  return script;
}

function invokeLoaderCallback(script: HTMLScriptElement): void {
  const callbackName = new URL(script.src).searchParams.get('callback');
  const callback = callbackName
    ? (window as unknown as Record<string, unknown>)[callbackName]
    : undefined;
  if (typeof callback !== 'function') throw new Error('Expected a callable Google Maps callback.');
  callback();
}

function failLoaderScript(script: HTMLScriptElement): void {
  if (!script.onerror) throw new Error('Expected a Google Maps script error handler.');
  script.onerror(new Event('error'));
}

describe('q-map Google Maps loader', () => {
  beforeEach(() => {
    vi.resetModules();
    document.querySelectorAll('script[data-webquark-google-maps="true"]').forEach(script => script.remove());
    Reflect.deleteProperty(window, 'google');
  });

  it('allows a different API key after a failed owned load', async () => {
    const { loadGoogleMapsApi } = await import('../internals/google-maps');
    const firstLoad = loadGoogleMapsApi('bad-key');
    const firstScript = getLoaderScript();
    failLoaderScript(firstScript);
    await expect(firstLoad).rejects.toThrow('QMap: Google Maps failed to load.');
    expect(firstScript.isConnected).toBe(false);

    const secondLoad = loadGoogleMapsApi('good-key');
    const secondScript = getLoaderScript();
    expect(new URL(secondScript.src).searchParams.get('key')).toBe('good-key');
    (window as TestGoogleWindow).google = { maps: { Map: class TestGoogleMap {} } };
    invokeLoaderCallback(secondScript);

    await expect(secondLoad).resolves.toBeUndefined();
  });

  it('rejects a different key while an owned load is still in flight', async () => {
    const { loadGoogleMapsApi } = await import('../internals/google-maps');
    const firstLoad = loadGoogleMapsApi('first-key');

    await expect(loadGoogleMapsApi('second-key')).rejects.toThrow('already loading with a different API key');
    failLoaderScript(getLoaderScript());
    await expect(firstLoad).rejects.toThrow('failed to load');
  });

  it('reuses an application-owned importer without injecting a script', async () => {
    const importLibrary = vi.fn(async () => {
      const maps = (window as TestGoogleWindow).google?.maps;
      if (maps) maps.Map = class TestGoogleMap {};
    });
    (window as TestGoogleWindow).google = { maps: { importLibrary } };
    const { loadGoogleMapsApi } = await import('../internals/google-maps');

    await expect(loadGoogleMapsApi('')).resolves.toBeUndefined();
    expect(importLibrary).toHaveBeenCalledWith('maps');
    expect(document.querySelector('script[data-webquark-google-maps="true"]')).toBeNull();
  });
});
