# q-syntax-box



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description | Type                                        | Default     |
| ---------- | ---------- | ----------- | ------------------------------------------- | ----------- |
| `code`     | `code`     |             | `string`                                    | `undefined` |
| `copyable` | `copyable` |             | `boolean`                                   | `false`     |
| `disabled` | `disabled` |             | `boolean`                                   | `false`     |
| `editable` | `editable` |             | `boolean`                                   | `false`     |
| `heading`  | `heading`  |             | `string`                                    | `undefined` |
| `height`   | `height`   |             | `string`                                    | `undefined` |
| `language` | `language` |             | `"css" \| "html" \| "javascript" \| "json"` | `'html'`    |
| `name`     | `name`     |             | `string`                                    | `undefined` |
| `required` | `required` |             | `boolean`                                   | `false`     |
| `value`    | `value`    |             | `string`                                    | `undefined` |
| `variant`  | `variant`  |             | `"panel" \| "plain"`                        | `'panel'`   |


## Events

| Event     | Description | Type                  |
| --------- | ----------- | --------------------- |
| `qChange` |             | `CustomEvent<string>` |
| `qInput`  |             | `CustomEvent<string>` |


## Methods

### `scrollToBottom() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Depends on

- [q-scrollable](../../layout/scrollable)
- [q-button](../../actions/button)
- [q-icon](../../media/icon)
- [q-tooltip](../../overlays/tooltip)

### Graph
```mermaid
graph TD;
  q-syntax-box --> q-scrollable
  q-syntax-box --> q-button
  q-syntax-box --> q-icon
  q-syntax-box --> q-tooltip
  style q-syntax-box fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
