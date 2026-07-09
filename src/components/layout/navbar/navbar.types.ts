import type { QIconLibrary, QIconLocalPath, QIconName, QIconSize } from '../../media/icon/icon.types';

export type QNavbarTarget = '_self' | '_blank' | '_parent' | '_top';
export type QNavbarMobileMode = 'menu' | 'inline';

export interface NavbarItem {
  label: string;
  value?: string;
  href?: string;
  target?: QNavbarTarget;
  disabled?: boolean;
  active?: boolean;
  icon?: QIconName;
  iconLib?: QIconLibrary;
  iconSize?: QIconSize;
  iconLocalPath?: QIconLocalPath;
  iconOnly?: boolean;
  ariaLabel?: string;
}

export interface NavbarSelectDetail {
  value: string;
  label: string;
  item: NavbarItem;
  originalEvent: MouseEvent;
}
