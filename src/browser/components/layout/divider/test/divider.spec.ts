import { afterEach, describe, expect, it } from 'vitest';
// @ts-ignore Generated loader is built before unit tests.
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';

defineCustomElements();
describe('q-divider semantics', () => {
  afterEach(() => { document.body.innerHTML = ''; });
  it('exposes one static horizontal separator by default', async () => {
    const el = document.createElement('q-divider');
    document.body.append(el);
    await el.componentOnReady();
    expect(el.getAttribute('role')).toBe('separator');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.shadowRoot.querySelector('[part="line"]').getAttribute('aria-hidden')).toBe('true');
    expect(el.length).toBe('auto');
    expect(el.spacing).toBe('lg');
  });
  it('updates orientation and removes semantics when decorative', async () => {
    const el = document.createElement('q-divider');
    document.body.append(el);
    await el.componentOnReady();
    el.orientation = 'vertical';
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
    el.decorative = true;
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-orientation')).toBe(false);
    el.decorative = false;
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(el.getAttribute('role')).toBe('separator');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });
});
