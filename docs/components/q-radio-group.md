# `q-radio-group`

`q-radio-group` is a form-associated, single-selection control. It presents connected options while retaining native radio inputs for keyboard and screen-reader behavior. Use it when one value must be chosen from a short set; use `q-dropdown` for longer option lists and `q-toggle` for a Boolean choice.

The generated [API reference](../../src/components/inputs/radio-group/readme.md) is the canonical property, event, method, and styling contract.

## Public contract

- `options` accepts strings or `{ label, value, disabled? }` objects. Assign arrays through the JavaScript property; the HTML attribute accepts JSON.
- `value` contains the selected string value.
- `label` renders a visible legend; `aria-label` supplies the accessible name when no legend is shown.
- `name`, `required`, `disabled`, `error`, and `errorMessage` provide normal form-control behavior.
- `size` is `sm`, `md`, or `lg`.
- `orientation` is `horizontal`, `vertical`, or `responsive`. Responsive groups stack below 680px.

The control has no slots. It emits `qChange` with the selected string value and forwards `qFocus` and `qBlur` from its native radios. `focusElement()` focuses the selected radio or the first enabled option. `checkValidity()` and `reportValidity()` expose form validity.

## Keyboard and accessibility

The component renders a native `fieldset`, `legend`, and same-name radio inputs inside Shadow DOM. Tab enters the checked option, or the first enabled option when no value is selected. Native Arrow-key and Space behavior changes the selected radio. Disabled options remain unavailable, and a disabled group is omitted from form submission.

A required group without a selected enabled option reports `valueMissing`. `error` or `errorMessage` sets a custom validity error, marks the group invalid, and renders helper text linked with `aria-describedby`.

## Forms

The selected string participates through `ElementInternals`. An empty or unmatched value contributes no form entry. Native form reset restores the value present when the component first loaded. Angular consumers can use the generated `SelectValueAccessor` with template-driven or reactive forms.

## Styling

The component exposes these Shadow Parts:

- `group`, `label`, and `options`
- `option`, `input`, and `option-label`
- `error-msg`

Primary custom properties:

- `--q-radio-group-bg`
- `--q-radio-group-border`
- `--q-radio-group-radius`
- `--q-radio-group-selected-bg`
- `--q-radio-group-selected-color`
- `--q-radio-group-focus-ring`
- `--q-radio-group-error-color`
- `--q-radio-group-option-min-height`
- `--q-radio-group-option-padding`

Defaults inherit the shared WebQuark field, colour, radius, typography, and transition tokens.

## CEF and Unreal considerations

The component uses ordinary CSS Grid, native radio inputs, and static colour fallbacks before `color-mix()`. It does not use a portal, browser-native overlay, animation loop, or layout measurement. The native inputs remain in the accessibility tree instead of using a synthetic ARIA-only radio implementation.

## Examples

Minimal HTML:

```html
<q-radio-group
  label="Sign-in fields"
  name="identifier-mode"
  value="both"
  options='["Email", "Username", {"label":"Email and Username","value":"both"}]'
></q-radio-group>
```

Stateful JavaScript:

```html
<q-radio-group id="delivery-method" label="Delivery method"></q-radio-group>
<output id="selection"></output>

<script type="module">
  const group = document.querySelector('#delivery-method');
  const output = document.querySelector('#selection');

  group.options = [
    { label: 'Courier', value: 'courier' },
    { label: 'Collection', value: 'collection' },
  ];
  group.value = 'courier';
  group.addEventListener('qChange', event => {
    output.value = event.detail;
  });
</script>
```

Known limitation: option content is text-only in the initial contract; icons, badges, descriptions, and arbitrary option templates are not supported.
