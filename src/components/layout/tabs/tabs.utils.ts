import { safeParseJson } from '../../../utils/utils';

import type { TabItem, TabItemInput } from './tabs.types';

export function getTabItems(items: TabItemInput[] | string): TabItem[] {
  return safeParseJson<TabItemInput[]>(items, [], 'QTabs').flatMap((item): TabItem[] => {
    if (typeof item === 'string') {
      const value = item.trim();
      return value ? [{ label: value, value }] : [];
    }

    if (
      item &&
      typeof item === 'object' &&
      typeof item.label === 'string' &&
      typeof item.value === 'string'
    ) {
      const label = item.label.trim();
      const value = item.value.trim();
      return label && value ? [{ ...item, label, value }] : [];
    }

    return [];
  });
}
