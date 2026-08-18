# q-conversation-bubble



<!-- Auto Generated Below -->


## Overview

Semantic conversation message with optional identity, metadata, and actions.

## Properties

| Property    | Attribute    | Description                                       | Type                                   | Default      |
| ----------- | ------------ | ------------------------------------------------- | -------------------------------------- | ------------ |
| `ariaLabel` | `aria-label` | Overrides the generated accessible message label. | `string`                               | `null`       |
| `compact`   | `compact`    | Reduces spacing for dense conversations.          | `boolean`                              | `false`      |
| `sender`    | `sender`     | Visible sender name.                              | `string`                               | `undefined`  |
| `timestamp` | `timestamp`  | Visible timestamp or short temporal description.  | `string`                               | `undefined`  |
| `variant`   | `variant`    |                                                   | `"incoming" \| "outgoing" \| "system"` | `'incoming'` |


## Slots

| Slot        | Description                                         |
| ----------- | --------------------------------------------------- |
|             | Message body.                                       |
| `"actions"` | Optional message actions.                           |
| `"avatar"`  | Optional avatar or identity mark.                   |
| `"meta"`    | Additional metadata displayed beside the timestamp. |


## Shadow Parts

| Part          | Description                       |
| ------------- | --------------------------------- |
| `"actions"`   | Slotted actions region.           |
| `"avatar"`    | Avatar region.                    |
| `"body"`      | Message body.                     |
| `"bubble"`    | Message surface.                  |
| `"container"` | Outer message article.            |
| `"content"`   | Header and bubble content column. |
| `"footer"`    | Timestamp, metadata, and actions. |
| `"header"`    | Sender heading region.            |
| `"meta"`      | Slotted metadata region.          |
| `"sender"`    | Sender text.                      |
| `"timestamp"` | Timestamp text.                   |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
