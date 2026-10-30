import '@angular/compiler';
import { ElementRef } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { MultipleSelectValueAccessor } from '../src/multiple-select-value-accessor';

describe('multiple dropdown Angular value accessor', () => {
  it('writes arrays and forwards array changes without sharing the consumer array', () => {
    const element = { multiple: true, values: [] as string[], value: '', disabled: false };
    const accessor = new MultipleSelectValueAccessor(new ElementRef(element as HTMLQDropdownElement));
    const changed = vi.fn(); accessor.registerOnChange(changed);
    const values = ['catalogue']; accessor.writeValue(values);
    expect(element.values).toEqual(values); expect(element.values).not.toBe(values);
    element.values = ['checkout']; accessor.selectionChanged(true);
    expect(changed).toHaveBeenLastCalledWith(['checkout']);
    accessor.selectionChanged(false); expect(changed).toHaveBeenCalledTimes(1);
    accessor.setDisabledState(true); expect(element.disabled).toBe(true);
  });

  it('preserves scalar behavior for a bound false multiple attribute and handles mode changes', () => {
    const element = { multiple: false, values: [] as string[], value: '' };
    const accessor = new MultipleSelectValueAccessor(new ElementRef(element as HTMLQDropdownElement));
    const changed = vi.fn(); accessor.registerOnChange(changed);
    accessor.writeValue('catalogue'); expect(element.value).toBe('catalogue');
    element.value = 'checkout'; accessor.selectionChanged(false);
    expect(changed).toHaveBeenLastCalledWith('checkout');
    element.multiple = true; accessor.ngDoCheck(); expect(element.values).toEqual(['checkout']);
    accessor.writeValue(null); expect(element.values).toEqual([]);
  });
});
