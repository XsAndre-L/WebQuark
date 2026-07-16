import { describe, expect, it, vi } from 'vitest';

import {
  MapBaseLayerController,
  type MapBaseLayerOperations,
  type QMapBaseLayerConfig,
} from '../internals/base-layer';

class TestLayer {
  removed = false;

  constructor(
    readonly name: string,
    private readonly lifecycle: string[],
  ) {}

  remove(): void {
    this.removed = true;
    this.lifecycle.push(`remove:${this.name}`);
  }
}

function createConfig(overrides: Partial<QMapBaseLayerConfig> = {}): QMapBaseLayerConfig {
  return {
    requestedProvider: 'tiles',
    tileUrl: 'https://tiles.example/{z}/{x}/{y}.png',
    googleApiKey: 'key',
    googleApiAvailable: false,
    googleMapType: 'roadmap',
    minZoom: 0,
    maxZoom: 19,
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(promiseResolve => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe('q-map transactional base-layer controller', () => {
  it('attaches a replacement before removing the working layer', async () => {
    const lifecycle: string[] = [];
    let sequence = 0;
    const operations: MapBaseLayerOperations<TestLayer> = {
      attach: layer => lifecycle.push(`attach:${layer.name}`),
      createGoogle: async () => new TestLayer('google', lifecycle),
      createTiles: () => new TestLayer(`tiles-${++sequence}`, lifecycle),
    };
    const controller = new MapBaseLayerController(operations);

    await controller.sync(createConfig());
    await controller.sync(createConfig({ tileUrl: 'https://other.example/{z}/{x}/{y}.png' }));

    expect(lifecycle).toEqual(['attach:tiles-1', 'attach:tiles-2', 'remove:tiles-1']);
    expect(controller.getActiveState()).toEqual({ activeProvider: 'tiles', usingFallback: false });
  });

  it('preserves a working layer when its replacement fails', async () => {
    const lifecycle: string[] = [];
    const working = new TestLayer('working', lifecycle);
    let shouldFail = false;
    const controller = new MapBaseLayerController<TestLayer>({
      attach: layer => lifecycle.push(`attach:${layer.name}`),
      createGoogle: async () => new TestLayer('google', lifecycle),
      createTiles: () => {
        if (shouldFail) throw new Error('tile creation failed');
        return working;
      },
    });

    await controller.sync(createConfig());
    shouldFail = true;
    const result = await controller.sync(createConfig({ tileUrl: 'https://broken.example/{z}/{x}/{y}.png' }));

    expect(result).toMatchObject({ kind: 'error', activeProvider: 'tiles', usingFallback: false });
    expect(working.removed).toBe(false);
  });

  it('removes a candidate that cannot attach and leaves the working layer active', async () => {
    const lifecycle: string[] = [];
    const working = new TestLayer('working', lifecycle);
    const broken = new TestLayer('broken', lifecycle);
    let nextLayer = working;
    const controller = new MapBaseLayerController<TestLayer>({
      attach: layer => {
        lifecycle.push(`attach:${layer.name}`);
        if (layer === broken) throw new Error('attach failed');
      },
      createGoogle: async () => new TestLayer('google', lifecycle),
      createTiles: () => nextLayer,
    });

    await controller.sync(createConfig());
    nextLayer = broken;
    const result = await controller.sync(createConfig({ tileUrl: 'https://broken.example/{z}/{x}/{y}.png' }));

    expect(result).toMatchObject({ kind: 'error', activeProvider: 'tiles', usingFallback: false });
    expect(broken.removed).toBe(true);
    expect(working.removed).toBe(false);
    expect(controller.getActiveState()).toEqual({ activeProvider: 'tiles', usingFallback: false });
  });

  it('discards a stale asynchronous candidate without disturbing the newer provider', async () => {
    const lifecycle: string[] = [];
    const pendingGoogle = deferred<TestLayer>();
    const tiles = new TestLayer('tiles', lifecycle);
    const controller = new MapBaseLayerController<TestLayer>({
      attach: layer => lifecycle.push(`attach:${layer.name}`),
      createGoogle: () => pendingGoogle.promise,
      createTiles: () => tiles,
    });

    const googleSync = controller.sync(createConfig({ requestedProvider: 'google' }));
    const tileResult = await controller.sync(createConfig());
    const staleGoogle = new TestLayer('stale-google', lifecycle);
    pendingGoogle.resolve(staleGoogle);
    const googleResult = await googleSync;

    expect(tileResult).toMatchObject({ kind: 'ready', activeProvider: 'tiles' });
    expect(googleResult).toEqual({ kind: 'stale' });
    expect(staleGoogle.removed).toBe(true);
    expect(tiles.removed).toBe(false);
  });

  it('uses a transactional tile fallback and retains the Google failure as a warning', async () => {
    const lifecycle: string[] = [];
    const failure = new Error('Google unavailable');
    const fallback = new TestLayer('fallback', lifecycle);
    const controller = new MapBaseLayerController<TestLayer>({
      attach: layer => lifecycle.push(`attach:${layer.name}`),
      createGoogle: async () => { throw failure; },
      createTiles: () => fallback,
    });

    const result = await controller.sync(createConfig({ requestedProvider: 'google' }));

    expect(result).toEqual({
      kind: 'ready',
      activeProvider: 'tiles',
      usingFallback: true,
      warning: failure,
    });
    expect(lifecycle).toEqual(['attach:fallback']);
  });

  it('treats an application-owned Google API as configured without a component key', async () => {
    const lifecycle: string[] = [];
    const controller = new MapBaseLayerController<TestLayer>({
      attach: layer => lifecycle.push(`attach:${layer.name}`),
      createGoogle: async () => new TestLayer('external-google', lifecycle),
      createTiles: () => new TestLayer('tiles', lifecycle),
    });

    const result = await controller.sync(createConfig({
      requestedProvider: 'google',
      googleApiKey: '',
      googleApiAvailable: true,
    }));

    expect(result).toMatchObject({ kind: 'ready', activeProvider: 'google', usingFallback: false });
    expect(lifecycle).toEqual(['attach:external-google']);
  });

  it('reports both provider and fallback failures while preserving the previous layer', async () => {
    const lifecycle: string[] = [];
    const working = new TestLayer('working', lifecycle);
    const googleFailure = new Error('Google unavailable');
    const fallbackFailure = new Error('Fallback unavailable');
    let failTiles = false;
    const controller = new MapBaseLayerController<TestLayer>({
      attach: layer => lifecycle.push(`attach:${layer.name}`),
      createGoogle: async () => { throw googleFailure; },
      createTiles: () => {
        if (failTiles) throw fallbackFailure;
        return working;
      },
    });

    await controller.sync(createConfig());
    failTiles = true;
    const result = await controller.sync(createConfig({ requestedProvider: 'google' }));

    expect(result).toEqual({
      kind: 'error',
      error: googleFailure,
      fallbackError: fallbackFailure,
      activeProvider: 'tiles',
      usingFallback: false,
    });
    expect(working.removed).toBe(false);
  });

  it('removes a candidate that resolves after destruction', async () => {
    const lifecycle: string[] = [];
    const pending = deferred<TestLayer>();
    const controller = new MapBaseLayerController<TestLayer>({
      attach: vi.fn(),
      createGoogle: () => pending.promise,
      createTiles: () => new TestLayer('tiles', lifecycle),
    });

    const sync = controller.sync(createConfig({ requestedProvider: 'google' }));
    controller.destroy();
    const candidate = new TestLayer('late', lifecycle);
    pending.resolve(candidate);

    expect(await sync).toEqual({ kind: 'stale' });
    expect(candidate.removed).toBe(true);
  });
});
