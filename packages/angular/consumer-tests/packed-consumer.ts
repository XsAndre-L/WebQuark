import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  BooleanValueAccessor,
  QButton,
  QDropdown,
  QInput,
  QPagination,
  QToggle,
  SelectValueAccessor,
  TextValueAccessor,
} from '@webquark/angular';
import {
  QDataTableCellDef,
  QDataTableCellOutlet,
} from '@webquark/angular/data-table-cell';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    QButton,
    QDropdown,
    QInput,
    QPagination,
    QToggle,
    BooleanValueAccessor,
    SelectValueAccessor,
    TextValueAccessor,
  ],
  template: `
    <q-input label="Name" [formControl]="name" />
    <q-dropdown
      label="Status"
      [options]="statusOptions"
      [formControl]="status"
    />
    <q-toggle label="Enabled" [formControl]="enabled" />
    <q-pagination
      [page]="1"
      [pageSize]="25"
      [totalItems]="100"
      (qPageChange)="handlePageChange($event)"
    />
    <q-button type="submit" [disabled]="name.invalid">Save</q-button>
  `,
})
export class PackedFormsConsumer {
  readonly name = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly enabled = new FormControl(false, { nonNullable: true });
  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  handlePageChange(_event: CustomEvent<number>): void {}
}

@Component({
  standalone: true,
  imports: [CommonModule, QDataTableCellDef, QDataTableCellOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <q-data-table>
      <ng-template qTableCell="name" let-row>
        <strong>{{ row.name }}</strong>
      </ng-template>
    </q-data-table>
  `,
})
export class PackedDataTableConsumer {}
