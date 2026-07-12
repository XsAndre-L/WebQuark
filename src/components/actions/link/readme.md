# q-link



<!-- Auto Generated Below -->


## Overview

Inline link with disabled handling, external-link affordances, and optional icon slots.

## Properties

| Property    | Attribute   | Description                                                                                     | Type                                           | Default     |
| ----------- | ----------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------- |
| `disabled`  | `disabled`  | Disables navigation, focus, and click emission.                                                 | `boolean`                                      | `false`     |
| `download`  | `download`  | Download filename or boolean download hint.                                                     | `string`                                       | `undefined` |
| `external`  | `external`  | Shows the external-link cue and applies safe default rel when rel is not supplied.              | `boolean`                                      | `false`     |
| `href`      | `href`      | Primary destination URL. Takes precedence over url, mailto, and tel.                            | `string`                                       | `undefined` |
| `label`     | `label`     | Fallback text when no default slot content is provided.                                         | `string`                                       | `undefined` |
| `mailto`    | `mailto`    | Email address used to generate a mailto: URL when href/url are not set.                         | `string`                                       | `undefined` |
| `rel`       | `rel`       | Native anchor rel value. Defaults to noopener noreferrer for target="_blank" or external links. | `string`                                       | `undefined` |
| `target`    | `target`    | Native anchor target.                                                                           | `"_blank" \| "_parent" \| "_self" \| "_top"`   | `undefined` |
| `tel`       | `tel`       | Phone number used to generate a tel: URL when href/url/mailto are not set.                      | `string`                                       | `undefined` |
| `underline` | `underline` | Underline behavior.                                                                             | `"always" \| "hover" \| "none"`                | `'hover'`   |
| `url`       | `url`       | Alias destination URL kept for compatibility. `href` wins when both are set.                    | `string`                                       | `undefined` |
| `variant`   | `variant`   | Visual style of the link.                                                                       | `"accent" \| "danger" \| "default" \| "muted"` | `'default'` |


## Events

| Event    | Description                                        | Type                      |
| -------- | -------------------------------------------------- | ------------------------- |
| `qBlur`  | Emitted when the inner anchor loses focus.         | `CustomEvent<FocusEvent>` |
| `qClick` | Emitted when the link is clicked and not disabled. | `CustomEvent<MouseEvent>` |
| `qFocus` | Emitted when the inner anchor receives focus.      | `CustomEvent<FocusEvent>` |


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
