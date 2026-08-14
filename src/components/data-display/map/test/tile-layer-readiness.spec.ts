import { afterEach, describe, expect, it, vi } from 'vitest';

import { waitForInitialTileLayerReady } from '../internals/tile-layer-readiness';

class TestTileLayer {
  private readonly listeners = new Map<string, Set<() => void>>();
  loading = false;

  on(type: string, listener: () => void): this {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    return this;
  }

  off(type: string, listener: () => void): this {
    this.listeners.get(type)?.delete(listener);
    return this;
  }

  emit(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }

  listenerCount(): number {
    return [...this.listeners.values()].reduce(
      (count, listeners) => count + listeners.size,
      0,
    );
  }

  isLoading(): boolean {
    return this.loading;
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe('raster tile-layer readiness', () => {
  it('resolves after the initial tile batch loads and cleans up listeners', async () => {
    const layer = new TestTileLayer();
    const readiness = waitForInitialTileLayerReady(layer as never, {
      timeoutMs: 100,
    });

    layer.emit('load');

    await expect(readiness).resolves.toBeUndefined();
    expect(layer.listenerCount()).toBe(0);
  });

  it('keeps the default full-batch policy waiting after one tile succeeds', async () => {
    const layer = new TestTileLayer();
    let resolved = false;
    const readiness = waitForInitialTileLayerReady(layer as never, {
      timeoutMs: 100,
    }).then(() => {
      resolved = true;
    });

    layer.emit('tileload');
    await Promise.resolve();

    expect(resolved).toBe(false);

    layer.emit('load');
    await readiness;
    expect(layer.listenerCount()).toBe(0);
  });

  it('rejects tile errors without waiting for the timeout', async () => {
    const layer = new TestTileLayer();
    const readiness = waitForInitialTileLayerReady(layer as never, {
      timeoutMs: 100,
    });

    layer.emit('tileerror');

    await expect(readiness).rejects.toThrow('Raster tiles failed to load.');
    expect(layer.listenerCount()).toBe(0);
  });

  it('lets a progressive replacement commit on its first successful tile', async () => {
    const layer = new TestTileLayer();
    const readiness = waitForInitialTileLayerReady(layer as never, {
      loadingPolicy: 'progressive',
      timeoutMs: 100,
    });

    layer.emit('tileerror');
    layer.emit('tileload');

    await expect(readiness).resolves.toBeUndefined();
    expect(layer.listenerCount()).toBe(0);
  });

  it('observes a cached progressive tile that loads during layer activation', async () => {
    const layer = new TestTileLayer();
    const readiness = waitForInitialTileLayerReady(layer as never, {
      loadingPolicy: 'progressive',
      startLoading: () => {
        layer.loading = true;
        layer.emit('tileload');
        layer.emit('load');
        layer.loading = false;
      },
      timeoutMs: 100,
    });

    await expect(readiness).resolves.toBeUndefined();
    expect(layer.listenerCount()).toBe(0);
  });

  it('rejects a progressive batch that completes without a successful tile', async () => {
    const layer = new TestTileLayer();
    const readiness = waitForInitialTileLayerReady(layer as never, {
      loadingPolicy: 'progressive',
      timeoutMs: 100,
    });

    layer.emit('tileerror');
    layer.emit('load');

    await expect(readiness).rejects.toThrow('Raster tiles failed to load.');
    expect(layer.listenerCount()).toBe(0);
  });

  it('supports cancellation and timeout cleanup', async () => {
    vi.useFakeTimers();
    const cancelledLayer = new TestTileLayer();
    const controller = new AbortController();
    const cancelled = waitForInitialTileLayerReady(cancelledLayer as never, {
      signal: controller.signal,
      timeoutMs: 100,
    });
    const cancelledExpectation = expect(cancelled).rejects.toMatchObject({
      name: 'AbortError',
    });

    controller.abort();

    await cancelledExpectation;
    expect(cancelledLayer.listenerCount()).toBe(0);

    const timedOutLayer = new TestTileLayer();
    const timedOut = waitForInitialTileLayerReady(timedOutLayer as never, {
      timeoutMs: 25,
    });
    const timedOutExpectation = expect(timedOut).rejects.toThrow(
      'Raster tile loading timed out.',
    );
    await vi.advanceTimersByTimeAsync(25);

    await timedOutExpectation;
    expect(timedOutLayer.listenerCount()).toBe(0);
  });
});
