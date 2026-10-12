import { afterEach, describe, expect, it } from 'vitest';

import {
  configureQIcons,
  isQIconStrictMode,
  registerQIcons,
  resolveRegisteredQIcon,
} from './registry';

const CIRCLE = {
  name: 'circle',
  size: 24,
  node: [['circle', { cx: '12', cy: '12', r: '10' }]],
} as const;

describe('q-icon registry', () => {
  afterEach(() => {
    registerQIcons({});
    configureQIcons({ strict: false });
  });

  it('replaces the whole registry atomically', () => {
    registerQIcons({ circle: CIRCLE });
    expect(resolveRegisteredQIcon('circle')).toEqual(CIRCLE);

    registerQIcons({ dot: { size: 24, node: [['circle', { cx: '12', cy: '12', r: '2' }]] } });

    expect(resolveRegisteredQIcon('circle')).toBeUndefined();
    expect(resolveRegisteredQIcon('dot')).toBeDefined();
  });

  it('does not register or import a global icon catalog', () => {
    registerQIcons({ circle: CIRCLE });

    expect(resolveRegisteredQIcon('circle')).toBeDefined();
    expect(resolveRegisteredQIcon('activity')).toBeUndefined();
    expect(resolveRegisteredQIcon('alarm-clock')).toBeUndefined();
  });

  it('rejects unsafe definitions without replacing the existing registry', () => {
    registerQIcons({ circle: CIRCLE });

    expect(() => registerQIcons({
      unsafe: {
        size: 24,
        node: [['use', { href: 'https://example.com/icons.svg#unsafe' }]],
      },
    })).toThrow(/same SVG/);

    expect(resolveRegisteredQIcon('circle')).toBeDefined();
    expect(resolveRegisteredQIcon('unsafe')).toBeUndefined();
  });

  it('requires an explicit boolean strict-mode setting', () => {
    configureQIcons({ strict: true });
    expect(isQIconStrictMode()).toBe(true);

    expect(() => configureQIcons({} as never)).toThrow(/boolean strict/);
  });
});
