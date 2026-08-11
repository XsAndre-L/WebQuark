import { describe, expect, it } from 'vitest';

import {
  getMinimalVisibleTranslation,
  isRectFullyVisible,
} from '../internals/marker-visibility';

const VIEWPORT = { top: 0, right: 100, bottom: 100, left: 0 };

describe('q-map marker visibility geometry', () => {
  it('leaves a completely visible target untouched', () => {
    const target = { top: 40, right: 60, bottom: 60, left: 40 };

    expect(getMinimalVisibleTranslation(target, VIEWPORT, [])).toEqual({ x: 0, y: 0 });
    expect(isRectFullyVisible(target, VIEWPORT, [])).toBe(true);
  });

  it('uses the minimum translation at a viewport edge', () => {
    const target = { top: 40, right: 15, bottom: 60, left: -5 };

    expect(getMinimalVisibleTranslation(target, VIEWPORT, [])).toEqual({ x: 5, y: 0 });
  });

  it('moves only far enough to clear an occlusion', () => {
    const target = { top: 40, right: 85, bottom: 60, left: 65 };
    const rightPanel = { top: 0, right: 100, bottom: 100, left: 70 };

    expect(getMinimalVisibleTranslation(target, VIEWPORT, [rightPanel])).toEqual({ x: -15, y: 0 });
    expect(isRectFullyVisible(target, VIEWPORT, [rightPanel])).toBe(false);
  });

  it('combines axis translations when separate occlusions require it', () => {
    const target = { top: 40, right: 60, bottom: 60, left: 40 };
    const verticalBar = { top: 0, right: 55, bottom: 100, left: 50 };
    const horizontalBar = { top: 50, right: 100, bottom: 55, left: 0 };

    expect(getMinimalVisibleTranslation(target, VIEWPORT, [verticalBar, horizontalBar])).toEqual({
      x: -10,
      y: -10,
    });
  });

  it('reports no legal translation when the usable viewport cannot contain the target', () => {
    const target = { top: 40, right: 60, bottom: 60, left: 40 };

    expect(getMinimalVisibleTranslation(target, VIEWPORT, [VIEWPORT])).toBeUndefined();
  });
});
