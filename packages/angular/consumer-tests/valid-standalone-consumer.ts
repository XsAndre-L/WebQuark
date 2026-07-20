import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  BooleanValueAccessor,
  QButton,
  QDropdown,
  QInput,
  QToggle,
  SelectValueAccessor,
  TextValueAccessor,
} from '@webquark/angular';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    QButton,
    QDropdown,
    QInput,
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
    <q-button type="submit" [disabled]="name.invalid">Save</q-button>
  `,
})
export class ValidStandaloneConsumer {
  readonly name = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly enabled = new FormControl(false, { nonNullable: true });
  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];
}
