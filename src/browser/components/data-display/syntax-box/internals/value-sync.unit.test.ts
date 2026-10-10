import { describe, expect, it } from 'vitest';
import { normalizeSyntaxBoxValue, resolveInitialSyntaxBoxValue } from './value-sync';
import { LANGUAGE_SOURCE, SYNTAX_LANGUAGES } from '../test/syntax-fixtures';

describe('syntax source synchronization', () => {
  it.each(SYNTAX_LANGUAGES)('preserves %s source through both aliases and the reset snapshot', language => {
    const source = LANGUAGE_SOURCE[language];
    for (const editable of [false, true]) {
      expect(normalizeSyntaxBoxValue(source, { editable })).toBe(source);
      for (const props of [{ code: source }, { value: source }]) {
        expect(resolveInitialSyntaxBoxValue({ ...props, editable })).toEqual({ code: source, value: source, initialValue: source });
      }
    }
  });
  it('normalizes missing editable content but retains absent read-only content', () => {
    expect(resolveInitialSyntaxBoxValue({ editable: true })).toEqual({ code: '', value: '', initialValue: '' });
    expect(normalizeSyntaxBoxValue(undefined, { editable: true })).toBe('');
    expect(resolveInitialSyntaxBoxValue({ editable: false })).toEqual({ code: undefined, value: undefined, initialValue: '' });
    expect(normalizeSyntaxBoxValue(undefined, { editable: false })).toBeUndefined();
  });
  it('keeps explicit empty code ahead of a conflicting value and preserves read-only aliases', () => {
    expect(resolveInitialSyntaxBoxValue({ code: '', value: 'other', editable: true })).toEqual({ code: '', value: '', initialValue: '' });
    expect(resolveInitialSyntaxBoxValue({ code: 'code', value: 'other', editable: false })).toEqual({ code: 'code', value: 'other', initialValue: 'code' });
    expect(resolveInitialSyntaxBoxValue({ code: 'code', value: 'other', editable: true })).toEqual({ code: 'code', value: 'code', initialValue: 'code' });
  });
});
