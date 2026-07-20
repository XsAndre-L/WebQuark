export interface Option {
  label: string;
  value: string;
}

/** A concise option label/value or a fully configured option object. */
export type DropdownOptionInput = Option | string;

export type QDropdownSize = 'sm' | 'md' | 'lg';

export type QDropdownPlacement = 'auto' | 'top' | 'bottom';
