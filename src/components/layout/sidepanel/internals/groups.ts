import type { SidepanelItem } from '../sidepanel.types';

/** Recursively seeds the expanded set with all parent item values */
export function seedExpandedGroups(items: SidepanelItem[], set: Set<string>): void {
  items.forEach((item) => {
    if (item.children && item.children.length > 0) {
      set.add(item.value);
      seedExpandedGroups(item.children, set);
    }
  });
}

/** In accordion mode: removes sibling group values from the expanded set */
export function closeSiblings(targetValue: string, items: SidepanelItem[], set: Set<string>): void {
  const siblings = items.filter((i) => i.children && i.children.length > 0);
  const isAtThisLevel = siblings.some((s) => s.value === targetValue);

  if (isAtThisLevel) {
    siblings.forEach((s) => {
      if (s.value !== targetValue) set.delete(s.value);
    });
  } else {
    items.forEach((item) => {
      if (item.children) closeSiblings(targetValue, item.children, set);
    });
  }
}

/** Toggle a group open/closed, respecting accordion mode. Returns the new expanded set. */
export function toggleGroup(items: SidepanelItem[], currentExpanded: Set<string>, accordion: boolean, value: string): Set<string> {
  const next = new Set(currentExpanded);

  if (next.has(value)) {
    next.delete(value);
  } else {
    if (accordion) {
      closeSiblings(value, items, next);
    }
    next.add(value);
  }

  return next;
}
