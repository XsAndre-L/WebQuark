# @webquark/angular

Angular wrappers for the WebQuark component library.

Install with `npm install @webquark/browser @webquark/angular`.

## Angular compatibility

`@webquark/angular` supports Angular 21 and Angular 22. The published package is
compiled with Angular 21 in partial-Ivy mode and is verified from its packed npm
artifact in strict Angular 21 and Angular 22 consumer projects.

Keep the build dependencies on Angular 21 so the package remains consumable by
both supported major versions. Published-package compatibility is verified by the packed
consumer checks with Angular 21.2.25 and Angular 22.2.2, both using TypeScript 6.0.3.

## Standalone components

The generated WebQuark proxies and form value accessors are standalone Angular
declarations. Import only the components used by the consumer:

```ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  BooleanValueAccessor,
  QButton,
  QInput,
  QRadioGroup,
  QToggle,
  SelectValueAccessor,
  TextValueAccessor,
} from '@webquark/angular';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    QButton,
    QInput,
    QRadioGroup,
    QToggle,
    TextValueAccessor,
    SelectValueAccessor,
    BooleanValueAccessor,
  ],
  template: `
    <q-input label="Name" [formControl]="name" />
    <q-radio-group
      label="Access"
      [options]="accessOptions"
      [formControl]="access"
    />
    <q-toggle label="Enabled" [formControl]="enabled" />
    <q-button type="submit">Save</q-button>
  `,
})
export class ExampleComponent {
  readonly name = new FormControl('', { nonNullable: true });
  readonly access = new FormControl('user', { nonNullable: true });
  readonly enabled = new FormControl(false, { nonNullable: true });
  readonly accessOptions = [
    { label: 'User', value: 'user' },
    { label: 'Administrator', value: 'administrator' },
  ];
}
```

`TextValueAccessor` updates controls on `qInput`, `SelectValueAccessor` supports
`q-dropdown` and `q-radio-group`, and `BooleanValueAccessor` supports `q-toggle`.

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
