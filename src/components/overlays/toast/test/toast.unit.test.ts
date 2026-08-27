import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  registerToastHost,
  toast,
  unregisterToastHost,
  type QToastHostAdapter,
} from '../toast-controller';
import type { QToastItem, QToastRequest } from '../toast.types';
import {
  enqueueToast,
  normalizeMaxVisible,
  removeToast,
} from '../internals/queue';
import { ToastTimerManager } from '../internals/timers';

const item = (id: string): QToastItem => ({
  id,
  title: id,
  variant: 'info',
  duration: 5_000,
  dismissible: true,
  exiting: false,
});

describe('q-toast queue', () => {
  it('keeps visible capacity bounded and promotes pending toasts in order', () => {
    const first = enqueueToast({ visible: [], pending: [] }, item('one'), 1);
    const second = enqueueToast(first, item('two'), 1);

    expect(second.visible.map(({ id }) => id)).toEqual(['one']);
    expect(second.pending.map(({ id }) => id)).toEqual(['two']);

    const removed = removeToast(second, 'one', 1);
    expect(removed.visible.map(({ id }) => id)).toEqual(['two']);
    expect(removed.pending).toEqual([]);
    expect(removed.promoted.map(({ id }) => id)).toEqual(['two']);
  });

  it('normalizes invalid and fractional visible limits', () => {
    expect(normalizeMaxVisible(Number.NaN)).toBe(3);
    expect(normalizeMaxVisible(0)).toBe(1);
    expect(normalizeMaxVisible(4.9)).toBe(4);
  });
});

describe('q-toast timers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('preserves the remaining duration while paused for multiple reasons', () => {
    vi.useFakeTimers();
    const manager = new ToastTimerManager();
    const callback = vi.fn();

    manager.start('one', 1_000, callback);
    vi.advanceTimersByTime(400);
    manager.pause('one', 'hover');
    manager.pause('one', 'document-hidden');
    vi.advanceTimersByTime(1_000);
    manager.resume('one', 'hover');
    vi.advanceTimersByTime(1_000);

    expect(callback).not.toHaveBeenCalled();

    manager.resume('one', 'document-hidden');
    vi.advanceTimersByTime(599);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not schedule persistent toasts', () => {
    vi.useFakeTimers();
    const manager = new ToastTimerManager();
    const callback = vi.fn();

    manager.start('persistent', 0, callback);
    vi.runAllTimers();

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('toast controller', () => {
  let activeAdapter: QToastHostAdapter | undefined;

  afterEach(() => {
    if (activeAdapter) {
      unregisterToastHost(activeAdapter);
      activeAdapter = undefined;
    } else {
      toast.clear();
    }
    vi.restoreAllMocks();
  });

  it('buffers pre-host calls and preserves the error to danger alias', () => {
    const id = toast.error('Could not delete user', 'Protected account');
    const enqueue = vi.fn<(request: QToastRequest, id: string) => void>();
    activeAdapter = {
      enqueue,
      dismiss: vi.fn(() => false),
      clear: vi.fn(() => 0),
    };

    expect(registerToastHost(activeAdapter)).toBe(true);
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Could not delete user',
        description: 'Protected account',
        variant: 'danger',
      }),
      id,
    );
  });

  it('rejects duplicate global hosts', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    activeAdapter = {
      enqueue: vi.fn(),
      dismiss: vi.fn(() => false),
      clear: vi.fn(() => 0),
    };
    const duplicate: QToastHostAdapter = {
      enqueue: vi.fn(),
      dismiss: vi.fn(() => false),
      clear: vi.fn(() => 0),
    };

    expect(registerToastHost(activeAdapter)).toBe(true);
    expect(registerToastHost(duplicate)).toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('only one global'));
  });
});
