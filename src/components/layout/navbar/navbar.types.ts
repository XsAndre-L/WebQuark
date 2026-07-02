export type QNavbarTarget = '_self' | '_blank' | '_parent' | '_top';

export interface NavbarItem {
  label: string;
  value?: string;
  href?: string;
  target?: QNavbarTarget;
  disabled?: boolean;
  active?: boolean;
}

export interface NavbarSelectDetail {
  value: string;
  label: string;
  item: NavbarItem;
  originalEvent: MouseEvent;
}

