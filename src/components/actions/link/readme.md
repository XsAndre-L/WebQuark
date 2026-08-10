# q-link



<!-- Auto Generated Below -->


## Overview

Inline link with disabled handling, external-link affordances, and optional icon slots.

## Properties

| Property    | Attribute   | Description                                                                  | Type                                           | Default     |
| ----------- | ----------- | ---------------------------------------------------------------------------- | ---------------------------------------------- | ----------- |
| `disabled`  | `disabled`  | Prevents activation, navigation, and secondary actions such as removal.      | `boolean`                                      | `false`     |
| `download`  | `download`  | Enables native download behavior when the component operates as a link.      | `string`                                       | `undefined` |
| `external`  | `external`  | Shows an external-link cue and supplies a safe default `rel`.                | `boolean`                                      | `false`     |
| `href`      | `href`      | Destination used when the component operates as a link.                      | `string`                                       | `undefined` |
| `label`     | `label`     | Text used when slotted content cannot supply the component's required label. | `string`                                       | `undefined` |
| `mailto`    | `mailto`    | Generates a `mailto:` URL when `href` and `url` are unset.                   | `string`                                       | `undefined` |
| `rel`       | `rel`       | Defaults to `noopener noreferrer` when `target="_blank"`.                    | `string`                                       | `undefined` |
| `target`    | `target`    |                                                                              | `"_blank" \| "_parent" \| "_self" \| "_top"`   | `undefined` |
| `tel`       | `tel`       | Generates a `tel:` URL when higher-priority destinations are unset.          | `string`                                       | `undefined` |
| `underline` | `underline` |                                                                              | `"always" \| "hover" \| "none"`                | `'hover'`   |
| `url`       | `url`       | Compatibility alias used when `href` is unset.                               | `string`                                       | `undefined` |
| `variant`   | `variant`   |                                                                              | `"accent" \| "danger" \| "default" \| "muted"` | `'default'` |


## Events

| Event    | Description                                        | Type                      |
| -------- | -------------------------------------------------- | ------------------------- |
| `qBlur`  |                                                    | `CustomEvent<FocusEvent>` |
| `qClick` | Emitted when the link is clicked and not disabled. | `CustomEvent<MouseEvent>` |
| `qFocus` |                                                    | `CustomEvent<FocusEvent>` |


## Slots

| Slot           | Description                                |
| -------------- | ------------------------------------------ |
|                | Link text. Falls back to the `label` prop. |
| `"icon-left"`  | Content placed before the label.           |
| `"icon-right"` | Content placed after the label.            |


## Shadow Parts

| Part              | Description                   |
| ----------------- | ----------------------------- |
| `"external-icon"` | External-link indicator icon. |
| `"label"`         | Link label wrapper.           |
| `"link"`          | Native anchor element.        |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
