import type { QCardElevation } from './card.types';

export type NormalizedCardElevation = 'none' | 'low' | 'medium' | 'high';

export function normalizeCardElevation(elevation: QCardElevation): NormalizedCardElevation {
  if (elevation === 1) return 'low';
  if (elevation === 2) return 'medium';
  if (elevation === 3) return 'high';
  return elevation;
}

export function isCardActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

export function shouldActivateCardFromKey(interactive: boolean, key: string, target: EventTarget | null, currentTarget: EventTarget | null): boolean {
  return interactive && target === currentTarget && isCardActivationKey(key);
}
