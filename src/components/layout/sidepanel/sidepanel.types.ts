export interface SidepanelItem {
  label: string;
  value: string;
  icon?: string;
  /** Keeps a parent category visible and non-collapsible. Ignored for leaf items. */
  alwaysExpanded?: boolean;
  children?: SidepanelItem[];
}

/** A concise navigation label/value or a fully configured (optionally nested) item. */
export type SidepanelItemInput = SidepanelItem | string;

export type QSidepanelVariant = 'drawer' | 'nav' | 'panel';
export type QSidepanelSide = 'left' | 'right' | 'top' | 'bottom';
export type QSidepanelMode = 'flat' | 'grouped' | 'tree';
export type QSidepanelCollapseControl = 'none' | 'header' | 'footer' | 'edge';
export type QSidepanelCollapseMode = 'rail' | 'hidden';

export interface QSidepanelSelectDetail {
  value: string;
  label: string;
  item: SidepanelItem;
}

export interface QSidepanelCollapsedChangeDetail {
  collapsed: boolean;
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

