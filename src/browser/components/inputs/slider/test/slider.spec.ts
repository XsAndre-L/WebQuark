import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
defineCustomElements();
const settle = () => new Promise(resolve => setTimeout(resolve, 20));
async function create(props = {}) {
  const el = document.createElement('q-slider') as any;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.componentOnReady();
  await settle();
  return el;
}
afterEach(() => { document.body.innerHTML = ''; });
describe('q-slider', () => {
  it('works with just min and max and defaults to min', async () => {
    const el = await create({ min: 4, max: 40 });
    expect(el.value).toBe(4);
    expect(el.shadowRoot.querySelector('input').type).toBe('range');
    expect(el.shadowRoot.querySelector('input').getAttribute('aria-label')).toBe('Value');
  });
  it('clamps and snaps values when constraints change without emitting', async () => {
    const el = await create({ min: 0, max: 10, step: 2, value: 7 });
    expect(el.value).toBe(8);
    const changed = vi.fn();
    el.addEventListener('qInput', changed);
    el.max = 5;
    await settle();
    expect(el.value).toBe(4);
    el.value = -3;
    await settle();
    expect(el.value).toBe(0);
    expect(changed).not.toHaveBeenCalled();
  });
  it('emits numeric input and commit events', async () => {
    const el = await create({ min: 1, max: 10, value: 3, label: 'Columns' });
    const input = el.shadowRoot.querySelector('input');
    const live = vi.fn(), commit = vi.fn();
    el.addEventListener('qInput', live);
    el.addEventListener('qChange', commit);
    // Stencil's mock DOM does not calculate the native range valueAsNumber.
    Object.defineProperty(input, 'valueAsNumber', { get: () => Number(input.value) });
    input.value = '6';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    await settle();
    expect(el.value).toBe(6);
    expect(live.mock.calls[0][0].detail).toBe(6);
    expect(commit.mock.calls[0][0].detail).toBe(6);
    expect(el.shadowRoot.querySelector('label').htmlFor).toBe(input.id);
  });
  it('supports fractional steps and disables native interaction', async () => {
    const el = await create({ min: .1, max: 1, step: .1, value: .31, disabled: true });
    expect(el.value).toBe(.3);
    expect(el.shadowRoot.querySelector('input').disabled).toBe(true);
  });
});
