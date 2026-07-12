import type { SidepanelItem, SidepanelItemInput } from './sidepanel.types';

export function getSidepanelItems(items: readonly SidepanelItemInput[]): SidepanelItem[] {
  return items.flatMap((item): SidepanelItem[] => {
    if (typeof item === 'string') {
      const value = item.trim();
      return value ? [{ label: value, value }] : [];
    }

    if (!item || typeof item !== 'object' || typeof item.label !== 'string' || typeof item.value !== 'string') {
      return [];
    }

    return [{
      ...item,
      children: item.children ? getSidepanelItems(item.children) : undefined,
    }];
  });
}
