import type { QIconLibrary, QIconLocalPath, QIconName, QIconSize } from '../../media/icon/icon.types';

export type QNavbarTarget = '_self' | '_blank' | '_parent' | '_top';
export type QNavbarMobileMode = 'menu' | 'inline';
export type QNavbarEdge = 'top' | 'right' | 'bottom' | 'left';
export type QNavbarNavAlign = 'start' | 'center' | 'end';
export type QNavbarNavCenterWithin = 'available' | 'container';
export type QNavbarAddonPlacement =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

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
  /** Named slot projected next to this item. */
  addonSlot?: string;
  /** Position of the slotted add-on relative to this item. */
  addonPlacement?: QNavbarAddonPlacement;
}

/** A concise navigation label/value or a fully configured navigation item. */
export type NavbarItemInput = NavbarItem | string;

export interface NavbarSelectDetail {
  value: string;
  label: string;
  item: NavbarItem;
  originalEvent: MouseEvent;
}
