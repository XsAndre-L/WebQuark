import { afterEach, describe, expect, it, vi } from 'vitest';
import { CarouselAutoplay, type CarouselAutoplayConfig } from '../internals/autoplay';

const enabled: CarouselAutoplayConfig = {
  enabled: true,
  navigable: true,
  suspended: false,
  reducedMotion: false,
  interval: 5000,
};

function create() {
  vi.useFakeTimers();
  const advance = vi.fn(() => true);
  const changed = vi.fn();
  const autoplay = new CarouselAutoplay(advance, changed);
  return { autoplay, advance, changed };
}

afterEach(() => vi.useRealTimers());

describe('carousel autoplay ownership', () => {
  it('starts only when enabled and navigable, and uses the interval', () => {
    const { autoplay, advance, changed } = create();
    autoplay.configure({ ...enabled, enabled: false });
    vi.advanceTimersByTime(10000);
    expect(advance).not.toHaveBeenCalled();
    autoplay.configure(enabled);
    vi.advanceTimersByTime(4999);
    expect(advance).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(advance).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenLastCalledWith(true, true);
  });

  it('temporarily suspends running without changing the next button action', () => {
    const { autoplay, advance, changed } = create();
    autoplay.configure(enabled);
    autoplay.configure({ ...enabled, suspended: true });
    expect(changed).toHaveBeenLastCalledWith(false, true);
    vi.advanceTimersByTime(10000);
    expect(advance).not.toHaveBeenCalled();
    autoplay.configure(enabled);
    vi.advanceTimersByTime(5000);
    expect(advance).toHaveBeenCalledTimes(1);
    autoplay.pause();
    autoplay.configure({ ...enabled, suspended: true });
    autoplay.configure(enabled);
    vi.advanceTimersByTime(5000);
    expect(advance).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenLastCalledWith(false, false);
  });

  it('preserves requested and paused intent through temporary empty content', () => {
    const { autoplay, advance, changed } = create();
    autoplay.configure({ ...enabled, navigable: false });
    expect(changed).toHaveBeenLastCalledWith(false, true);
    vi.advanceTimersByTime(5000);
    expect(advance).not.toHaveBeenCalled();
    autoplay.configure(enabled);
    vi.advanceTimersByTime(5000);
    expect(advance).toHaveBeenCalledTimes(1);
    autoplay.pause();
    autoplay.configure({ ...enabled, navigable: false });
    autoplay.configure(enabled);
    vi.advanceTimersByTime(5000);
    expect(advance).toHaveBeenCalledTimes(1);
    autoplay.configure({ ...enabled, navigable: false });
    autoplay.play();
    expect(changed).toHaveBeenLastCalledWith(false, true);
    autoplay.configure(enabled);
    vi.advanceTimersByTime(5000);
    expect(advance).toHaveBeenCalledTimes(2);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('normalizes interval %s', interval => {
    const { autoplay, advance } = create();
    autoplay.configure({ ...enabled, interval });
    vi.advanceTimersByTime(4999);
    expect(advance).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(advance).toHaveBeenCalledTimes(1);
  });

  it('auto-pauses for reduced motion until an explicit restart', () => {
    const { autoplay, advance, changed } = create();
    autoplay.configure({ ...enabled, reducedMotion: true });
    vi.advanceTimersByTime(5000);
    expect(advance).not.toHaveBeenCalled();
    autoplay.play();
    vi.advanceTimersByTime(5000);
    expect(advance).toHaveBeenCalledTimes(1);
    autoplay.configure(enabled);
    autoplay.configure({ ...enabled, reducedMotion: true });
    autoplay.configure(enabled);
    vi.advanceTimersByTime(5000);
    expect(advance).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenLastCalledWith(false, false);
  });

  it('stops completed playback and clears timers on disconnect', () => {
    const { autoplay, advance, changed } = create();
    advance.mockReturnValue(false);
    autoplay.configure(enabled);
    vi.advanceTimersByTime(15000);
    expect(advance).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenLastCalledWith(false, false);
    autoplay.play();
    autoplay.disconnect();
    vi.advanceTimersByTime(10000);
    expect(advance).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});


it('holds completion through pause and readiness, consuming it only once', () => {
  const { autoplay, advance } = create();
  const config = { ...enabled, timing: 'completion' as const, visitKey: 'video:1', advanceSuspended: true };
  autoplay.configure(config);
  autoplay.complete('stale');
  autoplay.complete('video:1');
  vi.advanceTimersByTime(30000);
  expect(advance).not.toHaveBeenCalled();
  autoplay.pause();
  autoplay.configure({ ...config, advanceSuspended: false });
  expect(advance).not.toHaveBeenCalled();
  autoplay.play();
  expect(advance).toHaveBeenCalledTimes(1);
  autoplay.configure({ ...config, advanceSuspended: false });
  expect(advance).toHaveBeenCalledTimes(1);
});

it('starts a fresh image dwell on navigation and discards the old video completion', () => {
  const { autoplay, advance } = create();
  autoplay.configure({ ...enabled, timing: 'completion', visitKey: 'old' });
  autoplay.pause();
  autoplay.complete('old');
  autoplay.configure({ ...enabled, timing: 'interval', visitKey: 'image:1' });
  autoplay.play();
  vi.advanceTimersByTime(4000);
  autoplay.configure({ ...enabled, timing: 'interval', visitKey: 'image:2' });
  vi.advanceTimersByTime(4999);
  expect(advance).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(advance).toHaveBeenCalledTimes(1);
});
