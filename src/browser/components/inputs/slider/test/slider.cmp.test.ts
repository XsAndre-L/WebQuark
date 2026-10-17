import { afterEach, beforeAll, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
defineCustomElements();
beforeAll(async () => { await customElements.whenDefined('q-slider'); });
afterEach(() => document.body.replaceChildren());
const settle = () => new Promise(resolve => setTimeout(resolve, 30));
it('supports keyboard, form submission, reset and disabled fieldsets', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<fieldset><q-slider name="gap" label="Gap" min="4" max="40" value="16" suffix="px"></q-slider></fieldset>';
  document.body.append(form);
  const slider = form.querySelector('q-slider')!;
  await slider.componentOnReady();
  const input = slider.shadowRoot!.querySelector('input')!;
  await userEvent.click(input);
  await userEvent.keyboard('{Home}');
  await settle();
  expect(slider.value).toBe(4);
  await userEvent.keyboard('{ArrowRight}');
  await settle();
  expect(slider.value).toBe(5);
  expect(new FormData(form).get('gap')).toBe('5');
  form.reset();
  await settle();
  expect(slider.value).toBe(16);
  form.querySelector('fieldset')!.disabled = true;
  await settle();
  expect(input.disabled).toBe(true);
  expect(new FormData(form).has('gap')).toBe(false);
});
it('participates in q-form values and theme overrides', async () => {
  const form = document.createElement('q-form');
  form.innerHTML = '<q-slider name="columns" label="Columns" min="1" max="10" value="3"></q-slider>';
  document.body.append(form);
  await form.componentOnReady();
  const slider = form.querySelector('q-slider')!;
  await slider.componentOnReady();
  await form.setValues({ columns: '7' });
  await settle();
  expect(slider.value).toBe(7);
  expect((await form.getValues()).columns).toBe('7');
  slider.style.setProperty('--q-slider-track-color', 'rgb(10, 20, 30)');
  expect(getComputedStyle(slider.shadowRoot!.querySelector('input')!).backgroundColor).toBe('rgb(10, 20, 30)');
});

