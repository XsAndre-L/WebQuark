import { safeParseJson } from '../../../utils/utils';

import type { RadioGroupOption, RadioGroupOptionInput } from './radio-group.types';

export function getRadioGroupOptions(options: RadioGroupOptionInput[] | string): RadioGroupOption[] {
  return safeParseJson<RadioGroupOptionInput[]>(options, [], 'QRadioGroup').flatMap((option): RadioGroupOption[] => {
    if (typeof option === 'string') {
      const value = option.trim();
      return value ? [{ label: value, value }] : [];
    }

    if (!option || typeof option !== 'object' || typeof option.value !== 'string' || !option.value.trim()) {
      return [];
    }

    return [{
      label: typeof option.label === 'string' ? option.label : option.value,
      value: option.value,
      disabled: option.disabled === true,
    }];
  });
}
