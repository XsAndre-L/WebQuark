import { safeParseJson } from '../../../../utils/utils';

import type { DropdownOptionInput, Option } from '../dropdown.types';

export function getOptionLabel(option: Partial<Option> | undefined): string {
  return typeof option?.label === 'string' ? option.label : '';
}

export function getDropdownOptions(options: DropdownOptionInput[] | string): Option[] {
  return safeParseJson<DropdownOptionInput[]>(options, [], 'QDropdown').flatMap((option): Option[] => {
    if (typeof option === 'string') {
      const value = option.trim();
      return value ? [{ label: value, value }] : [];
    }

    if (option && typeof option === 'object' && typeof option.value === 'string') {
      return [{ ...option, label: getOptionLabel(option) }];
    }

    return [];
  });
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
