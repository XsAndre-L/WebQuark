export type QTabsOrientation = 'horizontal' | 'vertical';

export interface TabItem {
  label: string;
  value: string;
  disabled?: boolean;
  tabId?: string;
  panelId?: string;
}

/** A concise tab label/value or a fully configured tab item. */
export type TabItemInput = TabItem | string;
