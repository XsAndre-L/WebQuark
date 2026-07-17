export type QFormFieldValue = string | File | boolean | number | null;
export type QFormValue = QFormFieldValue | QFormFieldValue[];
export type QFormValues = Record<string, QFormValue>;
export type QFormEnterBehavior = 'submit' | 'focus-next' | 'none';
export type QFormAction = 'submit' | 'reset';
export type QFormMethod = 'get' | 'post' | 'dialog';
export type QFormAutocomplete = 'on' | 'off';
export type QFormEnctype = 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
export type QFormTarget = '_self' | '_blank' | '_parent' | '_top';

export interface QFormSubmitDetail {
  values: QFormValues;
  formData: FormData;
  form: HTMLFormElement;
  originalEvent: Event;
}

export interface QFormResetDetail {
  form: HTMLFormElement;
  originalEvent: Event;
}

export type NamedFormControl = HTMLElement & {
  value?: string | number | boolean | null;
  checked?: boolean;
  disabled?: boolean;
  editable?: boolean;
  type?: string;
  files?: FileList | null;
  focusElement?: () => Promise<void> | void;
  formResetCallback?: () => void;
  checkValidity?: () => boolean | Promise<boolean>;
  reportValidity?: () => boolean | Promise<boolean>;
};

export interface HandleEnterBehaviorOptions {
  ev: KeyboardEvent;
  enterBehavior: QFormEnterBehavior;
  formEl: HTMLFormElement | undefined;
  hostEl: HTMLElement;
  requestSubmit: () => void;
}
