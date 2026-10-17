import { afterEach, expect, it } from 'vitest';
import '../../../../../../packages/browser/components/dist/components/q-toggle.js';
import tokens from '../../../../theme/tokens.css?raw';
import presets from '../../../../theme/token-presets.css?raw';

const frame = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
async function fixture(markup: string) {
  document.body.innerHTML = `<style>${tokens}\n${presets}</style>${markup}`;
  await customElements.whenDefined('q-toggle');
  await frame();
  return document.querySelector('q-toggle')!;
}
const part = (element: Element, name: string) => element.shadowRoot!.querySelector<HTMLElement>(`[part~="${name}"]`)!;
afterEach(() => document.body.replaceChildren());

it.each(['ltr', 'rtl'])('places switches after their label at the trailing edge in %s', async direction => {
  const element = await fixture(`<q-toggle dir="${direction}" style="width:320px" label="Required before checkout"></q-toggle>`);
  const control = part(element, 'control').getBoundingClientRect();
  const label = part(element, 'label').getBoundingClientRect();
  const host = element.getBoundingClientRect();
  if (direction === 'ltr') {
    expect(label.right).toBeLessThan(control.left);
    expect(control.right).toBe(host.right);
  } else {
    expect(control.right).toBeLessThan(label.left);
    expect(control.left).toBe(host.left);
  }
});

it.each(['ltr', 'rtl'])('keeps checkboxes before their label in %s', async direction => {
  const element = await fixture(`<q-toggle type="checkbox" dir="${direction}" style="width:320px" label="Visit slot"></q-toggle>`);
  const control = part(element, 'control').getBoundingClientRect();
  const label = part(element, 'label').getBoundingClientRect();
  if (direction === 'ltr') expect(control.right).toBeLessThan(label.left);
  else expect(label.right).toBeLessThan(control.left);
});

it('supports slotted and hidden labels, long text, errors and a control-first part override', async () => {
  const element = await fixture('<q-toggle style="width:160px" error="Review this setting"><span>Long setting label that wraps across multiple lines</span></q-toggle>');
  expect(part(element, 'control').getBoundingClientRect().right).toBe(element.getBoundingClientRect().right);
  expect(part(element, 'label').getBoundingClientRect().height).toBeGreaterThan(20);
  expect(part(element, 'error-msg').getBoundingClientRect().top).toBeGreaterThanOrEqual(part(element, 'label').getBoundingClientRect().bottom);
  element.labelHidden = true;
  await frame();
  expect(part(element, 'label').classList.contains('q-label-hidden')).toBe(true);
  expect(part(element, 'control').getBoundingClientRect().right).toBe(element.getBoundingClientRect().right);
  element.labelHidden = false;
  const override = document.createElement('style');
  override.textContent = 'q-toggle::part(control) { order: 0; margin-inline-start: 0; }';
  document.body.append(override);
  await frame();
  expect(part(element, 'control').getBoundingClientRect().right).toBeLessThan(part(element, 'label').getBoundingClientRect().left);
});

it('preserves label click, keyboard activation, disabled semantics and form value', async () => {
  const element = await fixture('<form><q-toggle name="required" label="Required before checkout"></q-toggle></form>');
  part(element, 'label').click();
  await frame();
  expect(element.checked).toBe(true);
  expect(new FormData(document.querySelector('form')!).get('required')).toBe('true');
  const wrapper = element.shadowRoot!.querySelector<HTMLElement>('[role="switch"]')!;
  wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  await frame();
  expect(element.checked).toBe(false);
  element.disabled = true;
  await frame();
  expect(wrapper.getAttribute('aria-disabled')).toBe('true');
  expect(wrapper.tabIndex).toBe(-1);
  part(element, 'label').click();
  expect(element.checked).toBe(false);
});
