import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  BooleanValueAccessor,
  MultipleSelectValueAccessor,
  QButton,
  QControlGroup,
  QDropdown,
  QInput,
  QImageComparison,
  QNavbar,
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
    QControlGroup,
    QDropdown,
    QInput,
    QImageComparison,
    QNavbar,
    QRadioGroup,
    QToggle,
    BooleanValueAccessor,
    MultipleSelectValueAccessor,
    SelectValueAccessor,
    TextValueAccessor,
  ],
  template: `
    <q-control-group ariaLabel="Sync interval" orientation="horizontal" size="sm">
      <q-toggle label="Enabled" [formControl]="enabled" />
      <q-input label="Amount" [labelHidden]="true" type="number" value="5" />
      <q-dropdown label="Unit" [labelHidden]="true" [options]="['Minutes', 'Hours']" />
    </q-control-group>
    <q-navbar navAlign="center" navCenterWithin="container" [sticky]="true" />
    <q-image-comparison beforeSrc="before.png" afterSrc="after.png"
      beforeAlt="Original view" afterAlt="Updated view" beforeLabel="Original" afterLabel="Updated"
      [aspectRatio]="16 / 9" [position]="comparisonPosition" ariaLabel="Compare views"
      (qChange)="comparisonPosition = $event.detail" />
    <q-input label="Name" [formControl]="name" />
    <q-dropdown
      label="Status"
      [options]="statusOptions"
      [formControl]="status"
    />
    <q-radio-group
      label="Access"
      [options]="accessOptions"
      [formControl]="access"
    />
    <q-dropdown label="Selected statuses" [multiple]="true" [options]="statusOptions" [formControl]="statuses" />
    <q-dropdown label="Single status" [multiple]="false" [options]="statusOptions" [formControl]="status" />
    <q-toggle label="Enabled" [formControl]="enabled" />
    <q-button type="submit" [disabled]="name.invalid">Save</q-button>
  `,
})
export class ValidStandaloneConsumer {
  comparisonPosition = 50;
  readonly name = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly statuses = new FormControl<string[]>([], { nonNullable: true });
  readonly access = new FormControl('user', { nonNullable: true });
  readonly enabled = new FormControl(false, { nonNullable: true });
  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];
  readonly accessOptions = [
    { label: 'User', value: 'user' },
    { label: 'Administrator', value: 'administrator' },
  ];
}
