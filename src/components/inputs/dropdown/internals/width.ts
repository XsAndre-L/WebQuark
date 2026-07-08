import type { Option, QDropdownSize } from '../dropdown.types';

import { getOptionLabel } from './options';

const AVG_CHAR_WIDTH_PX = 7.2;
const WIDTH_CHROME_PX = 38;
const MIN_SEARCHABLE_SM_WIDTH_PX = 160;

export function calculateDropdownWidthFromLength(labelLength: number, minWidth = 0): string {
  const calculatedWidth = labelLength * AVG_CHAR_WIDTH_PX + WIDTH_CHROME_PX;
  return `${Math.ceil(Math.max(minWidth, calculatedWidth))}px`;
}

export function computeDropdownDynamicWidth(options: {
  size: QDropdownSize;
  searchable: boolean;
  allOptions: readonly Option[];
  selectedOption?: Option;
  placeholder: string;
}): string | undefined {
  if (options.size !== 'sm') return undefined;

  if (options.searchable) {
    const labelText = options.selectedOption ? getOptionLabel(options.selectedOption) : options.placeholder;
    return calculateDropdownWidthFromLength(labelText ? labelText.length : 0, MIN_SEARCHABLE_SM_WIDTH_PX);
  }

  const lengths = options.allOptions.map(option => getOptionLabel(option).length);
  if (options.placeholder) {
    lengths.push(options.placeholder.length);
  }

  return calculateDropdownWidthFromLength(Math.max(...lengths, 0));
}
