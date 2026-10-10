import { Component } from '@angular/core';
import { QButton } from '@webquark/angular';

@Component({
  standalone: true,
  imports: [QButton],
  template: `<q-button [definitelyNotAProperty]="true">Save</q-button>`,
})
export class InvalidTemplateConsumer {}
