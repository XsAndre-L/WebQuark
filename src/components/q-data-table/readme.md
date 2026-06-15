# q-data-table



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute            | Description | Type                      | Default       |
| ------------------- | -------------------- | ----------- | ------------------------- | ------------- |
| `columns`           | `columns`            |             | `TableColumn[] \| string` | `[]`          |
| `items`             | `items`              |             | `any[] \| string`         | `[]`          |
| `keyField`          | `key-field`          |             | `string`                  | `'id'`        |
| `searchPlaceholder` | `search-placeholder` |             | `string`                  | `'Search...'` |
| `searchValue`       | `search-value`       |             | `string`                  | `''`          |
| `selectable`        | `selectable`         |             | `boolean`                 | `false`       |
| `selectedKeys`      | --                   |             | `any[]`                   | `[]`          |
| `showSearch`        | `show-search`        |             | `boolean`                 | `false`       |
| `showToolbar`       | `show-toolbar`       |             | `boolean`                 | `false`       |
| `toolbarTitle`      | `toolbar-title`      |             | `string`                  | `undefined`   |


## Events

| Event              | Description | Type                                                                                     |
| ------------------ | ----------- | ---------------------------------------------------------------------------------------- |
| `qRowClick`        |             | `CustomEvent<{ item: any; index: number; originalEvent: KeyboardEvent \| MouseEvent; }>` |
| `qSearch`          |             | `CustomEvent<string>`                                                                    |
| `qSelectionChange` |             | `CustomEvent<{ selectedKeys: any[]; selectedItems: any[]; }>`                            |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
