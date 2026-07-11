# q-form

> Contract note: see [Current public contracts](./current-contracts.md#q-form) and the [generated API](../../src/components/layout/form/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

`q-form` wraps native and WebQuark form controls and emits `qSubmit` with both a plain `values` object and native `FormData`.

Use named controls, for example `<q-input name="email">`, to include values in the submit payload.

Key props: `label`, `action`, `method`, `autocomplete`, `enctype`, `target`, `noValidate`, `preventDefault`.

Events: `qSubmit`, `qReset`.
