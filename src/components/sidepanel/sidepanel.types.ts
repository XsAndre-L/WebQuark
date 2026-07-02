export interface SidepanelItem {
  label: string;
  value: string;
  icon?: string;
  children?: SidepanelItem[];
}

export type QSidepanelVariant = 'drawer' | 'nav';
export type QSidepanelSide = 'left' | 'right' | 'top' | 'bottom';
export type QSidepanelMode = 'flat' | 'grouped' | 'tree';

export interface QSidepanelSelectDetail {
  value: string;
  label: string;
  item: SidepanelItem;
}

