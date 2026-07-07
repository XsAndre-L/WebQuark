export type QChipVariant = 'neutral' | 'filter' | 'primary' | 'success' | 'warning' | 'danger';
export type QChipSize = 'sm' | 'md' | 'lg';
export type QChipTarget = '_self' | '_blank' | '_parent' | '_top';

export interface QChipRemoveDetail {
  /**
   * Consumer-provided identifier for the removed chip.
   */
  value?: string;
  label?: string;
}
