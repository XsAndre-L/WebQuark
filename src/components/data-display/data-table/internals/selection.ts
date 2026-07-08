import type { DataTableItem, DataTableKey } from '../data-table.types';
import { getItemKey } from './data-access';

export interface DataTableSelectionState {
  checked: boolean;
  indeterminate: boolean;
}

export function getSelectedKeySet(selectedKeys: readonly DataTableKey[] | undefined): Set<DataTableKey> {
  return new Set(selectedKeys || []);
}

export function getSelectedItems(
  items: readonly DataTableItem[],
  selectedKeys: ReadonlySet<DataTableKey>,
  keyField: string
): DataTableItem[] {
  return items.filter((item, index) => selectedKeys.has(getItemKey(item, index, keyField)));
}

export function getSelectionState(
  items: readonly DataTableItem[],
  selectedKeys: ReadonlySet<DataTableKey>,
  keyField: string
): DataTableSelectionState {
  if (items.length === 0) {
    return { checked: false, indeterminate: false };
  }

  const selectedCount = getSelectedItems(items, selectedKeys, keyField).length;
  return {
    checked: selectedCount === items.length,
    indeterminate: selectedCount > 0 && selectedCount < items.length,
  };
}

export function getAllItemKeys(items: readonly DataTableItem[], keyField: string): DataTableKey[] {
  return items.map((item, index) => getItemKey(item, index, keyField));
}

export function toggleSelectedKey(selectedKeys: readonly DataTableKey[] | undefined, key: DataTableKey): DataTableKey[] {
  const nextKeys = [...(selectedKeys || [])];
  const keyIndex = nextKeys.indexOf(key);

  if (keyIndex > -1) {
    nextKeys.splice(keyIndex, 1);
  } else {
    nextKeys.push(key);
  }

  return nextKeys;
}
