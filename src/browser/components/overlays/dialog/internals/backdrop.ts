import type { QDialogBackdropEffect } from '../dialog.types';

export function resolveDialogBackdropEffect(effect: QDialogBackdropEffect): QDialogBackdropEffect {
  switch (effect) {
    case 'none':
    case 'solid':
      return effect;
    default:
      return 'solid';
  }
}
