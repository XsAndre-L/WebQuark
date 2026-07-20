import { safeParseJson } from '../../../utils/utils';

import type { TabItem, TabItemInput } from './tabs.types';

export function getTabIdentity(item: TabItem): string {
  return item.tabId?.trim() || item.value;
}

export function getTabDomId(
  instanceId: string,
  item: TabItem,
  identityKey: string,
  usesFallback: boolean,
): string {
  const explicitTabId = item.tabId?.trim();

  if (explicitTabId && !usesFallback) {
    return explicitTabId;
  }

  return `${instanceId}-tab-${toDomIdSegment(identityKey)}`;
}

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

function toDomIdSegment(value: string): string {
  return Array.from(value, character => character.codePointAt(0)!.toString(16)).join('-');
}
