import type { QDropdownPlacement } from '../dropdown.types';

export type ResolvedDropdownPlacement = Exclude<QDropdownPlacement, 'auto'>;

export interface DropdownAnchorRect {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
}

export interface DropdownPositionInput {
  readonly trigger: DropdownAnchorRect;
  readonly menuHeight: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly placement: QDropdownPlacement;
  readonly collisionPadding: number;
  readonly offset: number;
}

export interface DropdownPosition {
  readonly placement: ResolvedDropdownPlacement;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly maxHeight: number;
}

export function computeDropdownPosition(input: DropdownPositionInput): DropdownPosition {
  const collisionPadding = Math.max(0, input.collisionPadding);
  const offset = Math.max(0, input.offset);
  const availableWidth = Math.max(0, input.viewportWidth - collisionPadding * 2);
  const width = Math.min(Math.max(0, input.trigger.width), availableWidth);
  const spaceBelow = Math.max(
    0,
    input.viewportHeight - collisionPadding - input.trigger.bottom - offset,
  );
  const spaceAbove = Math.max(0, input.trigger.top - collisionPadding - offset);
  const placement = resolvePlacement(input.placement, input.menuHeight, spaceAbove, spaceBelow);
  const maxHeight = placement === 'bottom' ? spaceBelow : spaceAbove;
  const renderedHeight = Math.min(Math.max(0, input.menuHeight), maxHeight);
  const naturalTop =
    placement === 'bottom'
      ? input.trigger.bottom + offset
      : input.trigger.top - offset - renderedHeight;
  const maxLeft = Math.max(collisionPadding, input.viewportWidth - collisionPadding - width);
  const maxTop = Math.max(collisionPadding, input.viewportHeight - collisionPadding - renderedHeight);

  return {
    placement,
    left: clamp(input.trigger.left, collisionPadding, maxLeft),
    top: clamp(naturalTop, collisionPadding, maxTop),
    width,
    maxHeight,
  };
}

function resolvePlacement(
  placement: QDropdownPlacement,
  menuHeight: number,
  spaceAbove: number,
  spaceBelow: number,
): ResolvedDropdownPlacement {
  if (placement !== 'auto') {
    return placement;
  }

  if (menuHeight <= spaceBelow || spaceBelow >= spaceAbove) {
    return 'bottom';
  }

  return 'top';
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
