import { afterEach, describe, expect, it } from 'vitest';
import { MockWindow } from '@stencil/core/mock-doc';
import { applyValues, collectValues } from './values';
import { getFormControls } from './controls';

function form(html: string): HTMLElement {
  // Isolate pure helper contracts from the environment's component host proxies.
  const testDocument = new MockWindow().document;
  const host = testDocument.createElement('q-form') as unknown as HTMLElement;
  host.innerHTML = html;
  // Mock custom-element innerHTML setters retain the raw proxy target as parent.
  for (const child of Array.from(host.childNodes)) host.append(child);
  testDocument.body.append(host as never);
  return host;
}
afterEach(() => { document.body.innerHTML = ''; });

describe('typed form assignment preparation', () => {
  it('discovers unnamed native fields without claiming wrappers or nested form contents', () => {
    const host = form('<div name="fake"><input required></div><button name="action"></button><slot name="slot"></slot><q-form><input name="nested"></q-form>');
    expect(getFormControls(undefined, host).map(control => control.tagName)).toEqual(['INPUT']);
  });
  it('broadcasts scalars and assigns matching arrays positionally', () => {
    const host = form('<input name="text" value="a"><textarea name="text">b</textarea>');
    applyValues(undefined, host, { text: 'broadcast' });
    expect(collectValues(undefined, host)).toEqual({ text: ['broadcast', 'broadcast'] });
    applyValues(undefined, host, { text: [0, false] });
    expect(collectValues(undefined, host)).toEqual({ text: ['0', 'false'] });
  });
  it('rejects bad arity and nonfinite/file scalar values before any partial write', () => {
    const host = form('<input name="first" value="before"><input name="repeated" value="a"><input name="repeated" value="b">');
    expect(() => applyValues(undefined, host, { first: 'changed', repeated: ['short'] })).toThrow(TypeError);
    expect(() => applyValues(undefined, host, { first: 'changed', repeated: [1, Infinity] })).toThrow(TypeError);
    expect(collectValues(undefined, host)).toEqual({ first: 'before', repeated: ['a', 'b'] });
  });
  it('preserves option identities and uses checkbox identity lists rather than truthiness', () => {
    const host = form('<input name="radio" type="radio" value="a"><input name="radio" type="radio" value="b"><input name="checks" type="checkbox" value=""><input name="checks" type="checkbox" value="b">');
    applyValues(undefined, host, { radio: 'b', checks: ['', 'b'] });
    expect(Array.from(host.querySelectorAll('input')).map(input => [input.value, input.checked])).toEqual([['a', false], ['b', true], ['', true], ['b', true]]);
    expect(() => applyValues(undefined, host, { checks: true })).toThrow(TypeError);
  });
  it('updates readonly and disabled targets, ignores missing names and clears null text', () => {
    const host = form('<input name="frozen" value="a" readonly><input name="disabled" value="b" disabled><input name="keep" value="c">');
    applyValues(undefined, host, { frozen: null, disabled: 'updated', absent: 'ignored' });
    expect(Array.from(host.querySelectorAll('input')).map(input => input.value)).toEqual(['', 'updated', 'c']);
  });
  it('preserves radio and checkbox identities when native participation is unavailable', () => {
    // This non-browser DOM cannot serialize datalist descendants with native FormData.
    const host = form('<datalist><input name="radio" type="radio" value="a"><input name="radio" type="radio" value="b"><input name="checks" type="checkbox" value="a"><input name="checks" type="checkbox" value="b"></datalist>');
    expect(collectValues(undefined, host)).toEqual({});
    applyValues(undefined, host, { radio: 'b', checks: ['b'] });
    expect(Array.from(host.querySelectorAll('input')).map(input => [input.value, input.checked])).toEqual([['a', false], ['b', true], ['a', false], ['b', true]]);
    expect(collectValues(undefined, host)).toEqual({});
  });
  it('rejects mixed identity/scalar names atomically', () => {
    const host = form('<input name="first" value="before"><input name="mixed" value="text"><input name="mixed" type="checkbox" value="option">');
    expect(() => applyValues(undefined, host, { first: 'changed', mixed: ['x', 'option'] })).toThrow(TypeError);
    expect(host.querySelector('input')!.value).toBe('before');
  });
});
