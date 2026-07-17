# @webquark/angular

Angular wrappers for the WebQuark component library.

Install with `npm install @webquark/core @webquark/angular`.

## Rich data-table cells

Import the standalone cell directives:

```ts
import {
  QDataTableCellDef,
  QDataTableCellOutlet,
} from '@webquark/angular/data-table-cell';
```

```html
<q-data-table key-field="id" [columns]="columns" [items]="rows">
  <ng-template qTableCell="teamMember" let-row let-value="value">
    <app-team-member-cell [member]="row.member" />
  </ng-template>
</q-data-table>
```

The template context provides `row`, `value`, `rowIndex`, and `column`. Keep
`key-field` stable so cell content stays with the correct row during sorting and
refreshes. Unchanged row-and-column identities reuse the existing wrapper and
`EmbeddedViewRef`; additions are created and removals are destroyed.
