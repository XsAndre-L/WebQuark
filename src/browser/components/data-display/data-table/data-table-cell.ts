import type {
  CollectionIdentity,
  CollectionIdentityInput,
} from '../../../utils/collection-identity';

import type { DataTableItem } from './data-table.types';

const CELL_SLOT_PREFIX = 'q-data-table-cell';

/** Row-specific gutter slot. Use the row's unique, stable collection identity. */
export function getDataTableRowGutterSlotName(rowKey: CollectionIdentity): string {
  return `q-data-table-row-gutter-${encodeSlotPart(serializeIdentity(rowKey))}`;
}

export function getDataTableCellSlotName(
  columnKey: CollectionIdentity,
  rowKey: CollectionIdentity,
): string {
  return `${CELL_SLOT_PREFIX}-${encodeSlotPart(serializeIdentity(columnKey))}-${encodeSlotPart(serializeIdentity(rowKey))}`;
}

export function getDataTableItemKey(
  item: DataTableItem,
  _index: number,
  keyField: string,
): CollectionIdentityInput {
  if (isRecord(item) && Object.prototype.hasOwnProperty.call(item, keyField)) {
    const value = item[keyField];
    return typeof value === 'string' || typeof value === 'number'
      ? value
      : undefined;
  }

  return undefined;
}

export function getDataTableCellValue(item: DataTableItem, path: string): unknown {
  if (!path) return undefined;

  return path.split('.').reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, item);
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}

function serializeIdentity(identity: CollectionIdentity): string {
  return typeof identity === 'string'
    ? `string:${identity}`
    : serializeNumber(identity);
}

function serializeNumber(value: number): string {
  if (Number.isNaN(value)) return 'number:NaN';
  if (Object.is(value, -0)) return 'number:-0';
  return `number:${String(value)}`;
}

function encodeSlotPart(value: string): string {
  return encodeURIComponent(value).replaceAll("'", '%27');
}
