import { describe, expect, it } from 'vitest';
import { submitterNoValidate } from './form-submit-action';

describe('submitter validation overrides', () => {
  it('reads q-button live state while its reflected attribute is stale', () => {
    const button = { tagName: 'Q-BUTTON', formNoValidate: false, hasAttribute: () => true } as unknown as HTMLElement;
    expect(submitterNoValidate(button)).toBe(false);
    (button as HTMLQButtonElement).formNoValidate = true;
    expect(submitterNoValidate(button)).toBe(true);
  });
  it('retains native Boolean attribute semantics and null submitters', () => {
    const button = { tagName: 'BUTTON', formNoValidate: true, hasAttribute: () => true } as unknown as HTMLElement;
    expect(submitterNoValidate(button)).toBe(true);
    expect(submitterNoValidate(null)).toBe(false);
  });
});
