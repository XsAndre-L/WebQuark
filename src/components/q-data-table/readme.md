# q-data-table



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute    | Description | Type                      | Default |
| -------------- | ------------ | ----------- | ------------------------- | ------- |
| `columns`      | `columns`    |             | `TableColumn[] \| string` | `[]`    |
| `items`        | `items`      |             | `any[] \| string`         | `[]`    |
| `keyField`     | `key-field`  |             | `string`                  | `'id'`  |
| `selectable`   | `selectable` |             | `boolean`                 | `false` |
| `selectedKeys` | --           |             | `any[]`                   | `[]`    |


## Events

| Event              | Description | Type                                                                                     |
| ------------------ | ----------- | ---------------------------------------------------------------------------------------- |
| `qRowClick`        |             | `CustomEvent<{ item: any; index: number; originalEvent: KeyboardEvent \| MouseEvent; }>` |
| `qSelectionChange` |             | `CustomEvent<{ selectedKeys: any[]; selectedItems: any[]; }>`                            |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
