export interface NormalizeSyntaxBoxValueOptions {
  editable: boolean;
}

export interface InitialSyntaxBoxValue {
  code?: string;
  value?: string;
  initialValue: string;
}

/** Missing editable content is empty; supplied source is never reformatted. */
export function normalizeSyntaxBoxValue(value: string | undefined, options: NormalizeSyntaxBoxValueOptions): string | undefined {
  return options.editable ? value ?? '' : value;
}

export function resolveInitialSyntaxBoxValue(options: {
  code?: string;
  value?: string;
  editable: boolean;
}): InitialSyntaxBoxValue {
  const code = normalizeSyntaxBoxValue(options.code ?? options.value, options);
  // Preserve the existing read-only behavior when both aliases were supplied differently.
  const value = options.editable ? code : options.value ?? code;
  return { code, value, initialValue: code ?? '' };
}
