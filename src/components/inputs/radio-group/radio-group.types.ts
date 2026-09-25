import type { QControlSize } from '../../../theme/tokens';
import type { QIconName } from '../../media/icon/icon.types';

export interface RadioGroupOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: QIconName;
}

/** A concise option label/value or a fully configured radio option. */
export type RadioGroupOptionInput = RadioGroupOption | string;

export type QRadioGroupOrientation = 'horizontal' | 'responsive' | 'vertical';
export type QRadioGroupSize = QControlSize;
