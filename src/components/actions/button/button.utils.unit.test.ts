import { describe, expect, it } from 'vitest';

import { shouldWarnForMissingButtonAccessibleName } from './button.utils';

describe('q-button accessible-name validation', () => {
  it('warns for icon-only controls without an aria-label', () => {
    expect(shouldWarnForMissingButtonAccessibleName({
      hasVisibleText: false,
      hasIcon: true,
    })).toBe(true);

    expect(shouldWarnForMissingButtonAccessibleName({
      iconOnly: true,
      hasVisibleText: true,
      hasIcon: true,
    })).toBe(true);
  });

  it('does not warn when visible text or an aria-label provides the name', () => {
    expect(shouldWarnForMissingButtonAccessibleName({
      hasVisibleText: true,
      hasIcon: true,
    })).toBe(false);

    expect(shouldWarnForMissingButtonAccessibleName({
      ariaLabel: 'Save',
      hasVisibleText: false,
      hasIcon: true,
    })).toBe(false);
  });

  it('does not infer an accessible name from the icon and ignores empty non-icon buttons', () => {
    expect(shouldWarnForMissingButtonAccessibleName({
      ariaLabel: '   ',
      hasVisibleText: false,
      hasIcon: true,
    })).toBe(true);

    expect(shouldWarnForMissingButtonAccessibleName({
      hasVisibleText: false,
      hasIcon: false,
    })).toBe(false);
  });

  it('does not request another warning after the instance has warned', () => {
    expect(shouldWarnForMissingButtonAccessibleName({
      hasVisibleText: false,
      hasIcon: true,
      hasWarned: true,
    })).toBe(false);
  });
});
