import type { QIconSize } from '../icon.types';

export function getIconSizeStyle(size: QIconSize | undefined): string {
  const resolvedSize = size ? String(size).trim() : 'md';

  if (resolvedSize === 'sm') return '16px';
  if (resolvedSize === 'md') return '24px';
  if (resolvedSize === 'lg') return '32px';
  if (/^\d+$/.test(resolvedSize)) return `${resolvedSize}px`;

  return resolvedSize;
}
