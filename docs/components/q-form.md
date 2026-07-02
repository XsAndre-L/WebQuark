# q-form

`q-form` wraps native and WebQuark form controls and emits `qSubmit` with both a plain `values` object and native `FormData`.

Use named controls, for example `<q-input name="email">`, to include values in the submit payload.

Key props: `label`, `action`, `method`, `autocomplete`, `enctype`, `target`, `noValidate`, `preventDefault`.

Events: `qSubmit`, `qReset`.