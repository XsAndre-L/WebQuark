export interface QuantityBounds {
  min?: number;
  max?: number;
}

export function hasQuantityBound(value: number | undefined | null): value is number {
  return value !== undefined && value !== null;
}

export function toFiniteQuantity(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function clampQuantityValue(value: number, bounds: QuantityBounds): number {
  let clamped = value;

  if (hasQuantityBound(bounds.min)) {
    clamped = Math.max(bounds.min, clamped);
  }
  if (hasQuantityBound(bounds.max)) {
    clamped = Math.min(bounds.max, clamped);
  }

  return clamped;
}

export function stepQuantityValue(value: number, step: number, direction: 1 | -1, bounds: QuantityBounds): number {
  const current = toFiniteQuantity(value);
  return clampQuantityValue(current + step * direction, bounds);
}

export function sanitizeQuantityInput(rawValue: string): string {
  let value = rawValue.replace(/[^0-9.-]/g, '');

  if (value.startsWith('-')) {
    value = '-' + value.slice(1).replace(/-/g, '');
  } else {
    value = value.replace(/-/g, '');
  }

  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }

  return value;
}

export function parseQuantityInput(value: string): number | undefined {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function isWithinQuantityBounds(value: number, bounds: QuantityBounds): boolean {
  const isAboveMin = !hasQuantityBound(bounds.min) || value >= bounds.min;
  const isBelowMax = !hasQuantityBound(bounds.max) || value <= bounds.max;
  return isAboveMin && isBelowMax;
}

export function reconcileQuantityInput(value: string, bounds: QuantityBounds): number {
  let parsed = parseQuantityInput(value);

  if (parsed === undefined) {
    if (hasQuantityBound(bounds.min)) {
      parsed = bounds.min;
    } else if (hasQuantityBound(bounds.max)) {
      parsed = Math.min(0, bounds.max);
    } else {
      parsed = 0;
    }
  }

  return clampQuantityValue(parsed, bounds);
}

export function getQuantityInputCharCount(value: number, bounds: QuantityBounds): number {
  if (hasQuantityBound(bounds.min) || hasQuantityBound(bounds.max)) {
    return Math.max(3, bounds.min?.toString().length ?? 0, bounds.max?.toString().length ?? 0);
  }

  return Math.max(3, value?.toString().length ?? 0);
}
