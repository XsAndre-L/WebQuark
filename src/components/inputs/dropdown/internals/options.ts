import { safeParseJson } from '../../../../utils/utils';

import type { Option } from '../dropdown.types';

export function getOptionLabel(option: Partial<Option> | undefined): string {
  return typeof option?.label === 'string' ? option.label : '';
}

export function getDropdownOptions(options: Option[] | string): Option[] {
  return safeParseJson<Option[]>(options, [], 'QDropdown').filter((option): option is Option =>
    Boolean(option) && typeof option === 'object' && typeof option.value === 'string'
  );
}

export function getSelectedOption(options: readonly Option[], value: string): Option | undefined {
  return options.find(option => option.value === value);
}

export function getFilteredOptions(options: readonly Option[], searchTerm: string, searchable: boolean): Option[] {
  const trimmedTerm = searchTerm.trim();
  if (!searchable || !trimmedTerm) {
    return [...options];
  }

  const normalizedTerm = trimmedTerm.toLowerCase();
  return options.filter(option => getOptionLabel(option).toLowerCase().includes(normalizedTerm));
}

export function getVisibleOptions(options: readonly Option[], visibleCount: number): Option[] {
  return options.slice(0, visibleCount);
}
