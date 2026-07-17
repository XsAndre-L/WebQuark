type NativeValidityOptions = {
  internals: ElementInternals;
  control: HTMLInputElement | HTMLTextAreaElement;
  disabled: boolean;
  customError?: string;
};

export function syncNativeControlValidity({
  internals,
  control,
  disabled,
  customError,
}: NativeValidityOptions): void {
  if (
    typeof internals.setValidity !== 'function' ||
    !control.validity
  ) {
    return;
  }

  if (disabled) {
    internals.setValidity({});
    return;
  }

  const message = customError?.trim();
  if (message) {
    internals.setValidity({ customError: true }, message, control);
    return;
  }

  if (control.validity.valid) {
    internals.setValidity({});
    return;
  }

  internals.setValidity(
    validityFlags(control.validity),
    control.validationMessage || 'Please enter a valid value.',
    control,
  );
}

export function syncRequiredBooleanValidity(
  internals: ElementInternals,
  options: {
    required: boolean;
    checked: boolean;
    disabled: boolean;
    anchor?: HTMLElement;
  },
): void {
  if (typeof internals.setValidity !== 'function') {
    return;
  }

  if (options.disabled || !options.required || options.checked) {
    internals.setValidity({});
    return;
  }

  internals.setValidity(
    { valueMissing: true },
    'Please select this option to continue.',
    options.anchor,
  );
}

function validityFlags(validity: ValidityState): ValidityStateFlags {
  return {
    badInput: validity.badInput,
    customError: validity.customError,
    patternMismatch: validity.patternMismatch,
    rangeOverflow: validity.rangeOverflow,
    rangeUnderflow: validity.rangeUnderflow,
    stepMismatch: validity.stepMismatch,
    tooLong: validity.tooLong,
    tooShort: validity.tooShort,
    typeMismatch: validity.typeMismatch,
    valueMissing: validity.valueMissing,
  };
}
