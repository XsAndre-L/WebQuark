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

export interface HandleDrawerOpenChangeOptions {
  isOpen: boolean;
  drawerEl: HTMLDivElement | undefined;
  previousActiveElement: HTMLElement | null;
  setVisible: (visible: boolean) => void;
  setAnimatedOpen: (animatedOpen: boolean) => void;
  setPreviousActiveElement: (el: HTMLElement | null) => void;
}

export interface RenderNavItemsOptions {
  items: SidepanelItem[];
  expandedGroups: Set<string>;
  activeValue: string;
  onItemClick: (item: SidepanelItem) => void;
  depth?: number;
}

