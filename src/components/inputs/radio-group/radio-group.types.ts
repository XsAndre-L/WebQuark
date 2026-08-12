export interface RadioGroupOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/** A concise option label/value or a fully configured radio option. */
export type RadioGroupOptionInput = RadioGroupOption | string;

export type QRadioGroupOrientation = 'horizontal' | 'responsive' | 'vertical';
export type QRadioGroupSize = 'sm' | 'md' | 'lg';
