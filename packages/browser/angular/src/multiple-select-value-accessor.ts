import { Directive, DoCheck, ElementRef, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { ValueAccessor } from './stencil-generated/value-accessor.js';

/** Attribute selection is static in Angular; a bound false value still uses this accessor. */
@Directive({
  standalone: true,
  selector: 'q-dropdown[multiple]',
  host: {
    '(qValuesChange)': 'selectionChanged(true)',
    '(qChange)': 'selectionChanged(false)',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultipleSelectValueAccessor), multi: true }],
})
export class MultipleSelectValueAccessor extends ValueAccessor implements DoCheck {
  private lastMultiple?: boolean;

  constructor(element: ElementRef<HTMLQDropdownElement>) {
    super(element);
  }

  override writeValue(value: string | string[] | null): void {
    const element = this.el.nativeElement as HTMLQDropdownElement;
    this.lastMultiple = element.multiple;
    if (element.multiple) {
      element.values = this.lastValue = Array.isArray(value) ? [...value] : value == null ? [] : [value];
    } else {
      element.value = this.lastValue = Array.isArray(value) ? value[0] ?? '' : value ?? '';
    }
  }

  ngDoCheck(): void {
    if (this.lastMultiple !== this.el.nativeElement.multiple) this.writeValue(this.lastValue);
  }

  selectionChanged(multiple: boolean): void {
    const element = this.el.nativeElement as HTMLQDropdownElement;
    if (element.multiple === multiple) this.handleChangeEvent(multiple ? [...element.values] : element.value);
  }
}
