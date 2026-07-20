# q-alert



<!-- Auto Generated Below -->


## Overview

Inline contextual message with opt-in announcements and controlled dismissal.

## Properties

| Property       | Attribute       | Description                                                                    | Type                                           | Default           |
| -------------- | --------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- | ----------------- |
| `announcement` | `announcement`  | Live-region behavior. Announcements are off by default to avoid noisy updates. | `"assertive" \| "off" \| "polite"`             | `'off'`           |
| `dismissLabel` | `dismiss-label` | Accessible label for the dismiss button.                                       | `string`                                       | `'Dismiss alert'` |
| `dismissible`  | `dismissible`   | Shows a dismiss button. Consumers remove or hide the alert after `qDismiss`.   | `boolean`                                      | `false`           |
| `heading`      | `heading`       | Optional heading rendered before the message content.                          | `string`                                       | `undefined`       |
| `variant`      | `variant`       | Visual status of the message.                                                  | `"danger" \| "info" \| "success" \| "warning"` | `'info'`          |


## Events

| Event      | Description                                                                   | Type                |
| ---------- | ----------------------------------------------------------------------------- | ------------------- |
| `qDismiss` | Emitted when the dismiss button is activated. The component remains rendered. | `CustomEvent<void>` |


## Slots

| Slot        | Description                                           |
| ----------- | ----------------------------------------------------- |
|             | Alert message content.                                |
| `"actions"` | Optional action controls displayed after the message. |
| `"icon"`    | Optional leading icon or status mark.                 |


## Shadow Parts

| Part               | Description                   |
| ------------------ | ----------------------------- |
| `"actions"`        | Optional action region.       |
| `"container"`      | Outer alert container.        |
| `"content"`        | Heading and message region.   |
| `"dismiss-button"` | Native dismiss button.        |
| `"heading"`        | Optional alert heading.       |
| `"icon"`           | Leading icon region.          |
| `"message"`        | Default message slot wrapper. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
