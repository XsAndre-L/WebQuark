import { safeParseJson } from '../../../utils/utils';

import type { NavbarItem, NavbarItemInput } from './navbar.types';

export function getNavbarItems(items: NavbarItemInput[] | string): NavbarItem[] {
  return safeParseJson<NavbarItemInput[]>(items, [], 'QNavbar').flatMap((item): NavbarItem[] => {
    if (typeof item === 'string') {
      const value = item.trim();
      return value ? [{ label: value, value }] : [];
    }

    if (item && typeof item === 'object' && typeof item.label === 'string') {
      return [item];
    }

    return [];
  });
}
