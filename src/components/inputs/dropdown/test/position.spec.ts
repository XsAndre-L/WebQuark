import { describe, expect, it } from 'vitest';

import { computeDropdownPosition } from '../internals/position';

const trigger = {
  top: 100,
  right: 220,
  bottom: 140,
  left: 100,
  width: 120,
};

describe('computeDropdownPosition', () => {
  it('opens below when the menu fits', () => {
    expect(
      computeDropdownPosition({
        trigger,
        menuHeight: 200,
        viewportWidth: 800,
        viewportHeight: 600,
        placement: 'auto',
        collisionPadding: 8,
        offset: 4,
      }),
    ).toEqual({
      placement: 'bottom',
      left: 100,
      top: 144,
      width: 120,
      maxHeight: 448,
    });
  });

  it('flips above when the bottom has insufficient space', () => {
    const position = computeDropdownPosition({
      trigger: { ...trigger, top: 500, bottom: 540 },
      menuHeight: 180,
      viewportWidth: 800,
      viewportHeight: 600,
      placement: 'auto',
      collisionPadding: 8,
      offset: 4,
    });

    expect(position.placement).toBe('top');
    expect(position.top).toBe(316);
    expect(position.maxHeight).toBe(488);
  });

  it('clamps the menu horizontally inside the viewport', () => {
    const position = computeDropdownPosition({
      trigger: { ...trigger, right: 835, left: 715 },
      menuHeight: 100,
      viewportWidth: 800,
      viewportHeight: 600,
      placement: 'bottom',
      collisionPadding: 8,
      offset: 4,
    });

    expect(position.left).toBe(672);
    expect(position.width).toBe(120);
  });

  it('limits the menu height to the selected side', () => {
    const position = computeDropdownPosition({
      trigger: { ...trigger, top: 260, bottom: 300 },
      menuHeight: 500,
      viewportWidth: 800,
      viewportHeight: 400,
      placement: 'bottom',
      collisionPadding: 8,
      offset: 4,
    });

    expect(position.placement).toBe('bottom');
    expect(position.maxHeight).toBe(88);
    expect(position.top).toBe(304);
  });
});
