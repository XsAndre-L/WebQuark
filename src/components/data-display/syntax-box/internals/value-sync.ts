import { formatCode } from '../../../../utils/formatter';

import type { QSyntaxBoxLanguage } from '../syntax-box.types';

export interface NormalizeSyntaxBoxValueOptions {
  editable: boolean;
  language: QSyntaxBoxLanguage;
  shouldFormat: boolean;
}

export interface InitialSyntaxBoxValue {
  code?: string;
  value?: string;
  initialValue: string;
}

export function normalizeSyntaxBoxValue(
  value: string | undefined,
  options: NormalizeSyntaxBoxValueOptions
): string | undefined {
  if (value && options.editable && options.shouldFormat) {
    return formatCode(value, options.language);
  }

  return value;
}

export function resolveInitialSyntaxBoxValue(options: {
  code?: string;
  value?: string;
  editable: boolean;
  language: QSyntaxBoxLanguage;
}): InitialSyntaxBoxValue {
  let code = options.code;
  let value = options.value;

  if (value !== undefined && code === undefined) {
    code = value;
  } else if (code !== undefined && value === undefined) {
    value = code;
  }

  if (options.editable && code) {
    const formatted = formatCode(code, options.language);
    code = formatted;
    value = formatted;
  }

  return {
    code,
    value,
    initialValue: code || '',
  };
}
