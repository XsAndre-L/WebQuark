import { afterEach, describe, expect, it } from 'vitest';
import '../../../../packages/browser/components/dist/components/q-input.js';
import '../../../../packages/browser/components/dist/components/q-dropdown.js';
import '../../../../packages/browser/components/dist/components/q-textarea.js';
import shared from '../tokens.css?raw';
import presets from '../token-presets.css?raw';

const tags = ['q-input', 'q-dropdown', 'q-textarea'] as const;
const frame = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
const width = (element: Element) => element.getBoundingClientRect().width;
async function fixture(html: string) {
  document.body.innerHTML = `<style>${shared}\n${presets}</style>${html}`;
  await Promise.all(tags.map(tag => customElements.whenDefined(tag)));
  await frame();
}
afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute('style');
});

describe.each(tags)('%s horizontal width', tag => {
  it('supports every named width independently of size, preset, and direction', async () => {
    await fixture(`<div style="width:600px"><${tag} id="field"></${tag}></div>`);
    const field = document.getElementById('field')!;
    for (const preset of ['compact', 'comfortable']) {
      field.dataset.wqPreset = preset;
      for (const direction of ['ltr', 'rtl']) {
        field.dir = direction;
        for (const size of ['sm', 'lg']) {
          field.setAttribute('size', size);
          for (const [name, expected] of Object.entries({ xs: 80, sm: 120, md: 180, lg: 240, xl: 290, xxl: 360, full: 600 })) {
            field.setAttribute('width', name);
            await expect.poll(() => width(field)).toBe(expected);
          }
        }
      }
    }
  });

  it('preserves omitted, invalid and empty widths and responds to reflected property changes/removal', async () => {
    await fixture(`<div style="width:500px"><${tag} id="field"></${tag}></div>`);
    const field = document.getElementById('field')! as HTMLQInputElement;
    expect(width(field)).toBe(500);
    field.width = 'sm';
    await expect.poll(() => field.getAttribute('width')).toBe('sm');
    expect(width(field)).toBe(120);
    for (const value of ['invalid', '']) {
      field.setAttribute('width', value);
      await expect.poll(() => width(field)).toBe(500);
    }
    field.width = 'xxl';
    await expect.poll(() => field.getAttribute('width')).toBe('xxl');
    await expect.poll(() => width(field)).toBe(360);
    field.removeAttribute('width');
    await expect.poll(() => width(field)).toBe(500);
  });

  it('honors scoped/global tokens, root rem size and external host CSS precedence', async () => {
    await fixture(`<div id="scope" style="width:600px"><${tag} id="field" width="md"></${tag}></div>`);
    const field = document.getElementById('field')!;
    document.documentElement.style.setProperty('--q-input-width-md', '18rem');
    expect(width(field)).toBe(288);
    document.getElementById('scope')!.style.setProperty('--q-input-width-md', '12rem');
    expect(width(field)).toBe(192);
    document.documentElement.style.fontSize = '20px';
    expect(width(field)).toBe(240);
    const style = document.createElement('style');
    style.textContent = `${tag} { width: 177px; }`;
    document.head.append(style);
    expect(width(field)).toBe(177);
    style.remove();
    expect(width(field)).toBe(240);
    field.style.width = '191px';
    expect(width(field)).toBe(191);
    field.style.removeProperty('width');
    expect(width(field)).toBe(240);
  });

  it('fits narrow, flex and grid containers with long content', async () => {
    await fixture(['block', 'flex', 'grid'].map(display => `<div style="display:${display};width:110px;grid-template-columns:minmax(0,1fr)"><${tag} width="xxl" label="A lengthy visible field label" description="Supporting details wrap within available space" placeholder="An extremely long unbroken label that must not enlarge the container" value="A long selection or entered field value"></${tag}></div>`).join(''));
    for (const field of Array.from(document.querySelectorAll(tag))) {
      expect(width(field)).toBe(110);
      expect(field.scrollWidth).toBeLessThanOrEqual(110);
    }
  });
});

it('keeps the open dropdown menu aligned as width and container change', async () => {
  await fixture('<div id="scope" style="width:500px"><q-dropdown id="field" width="sm"></q-dropdown></div>');
  const field = document.getElementById('field')! as HTMLQDropdownElement;
  field.options = [{ label: 'A very long option label that does not determine host width', value: 'one' }];
  await frame();
  field.shadowRoot!.querySelector<HTMLButtonElement>('.dropdown-trigger')!.click();
  await frame();
  const menu = () => field.shadowRoot!.querySelector('.dropdown-menu')!;
  await expect.poll(() => width(menu())).toBe(120);
  field.width = 'xxl';
  await expect.poll(() => width(menu())).toBe(360);
  document.getElementById('scope')!.style.width = '120px';
  await expect.poll(() => width(menu())).toBe(120);
});

it('preserves textarea auto-grow when the width becomes narrower', async () => {
  await fixture('<q-textarea id="field" width="lg" rows="1"></q-textarea>');
  const field = document.getElementById('field')! as HTMLQTextareaElement;
  field.value = 'Words wrap into more lines as the available horizontal space becomes smaller. '.repeat(4);
  await frame();
  const textarea = field.shadowRoot!.querySelector('textarea')!;
  const initial = textarea.getBoundingClientRect().height;
  field.width = 'sm';
  await expect.poll(() => textarea.getBoundingClientRect().height).toBeGreaterThan(initial);
});

it.each(['manual', 'fixed'] as const)('preserves textarea %s resize behavior while changing width', async mode => {
  await fixture(`<q-textarea id="field" width="lg" resize-mode="${mode}" rows="2"></q-textarea>`);
  const field = document.getElementById('field')! as HTMLQTextareaElement;
  const textarea = field.shadowRoot!.querySelector('textarea')!;
  field.value = 'Many words that should not grow this textarea automatically. '.repeat(10);
  await frame();
  const initial = textarea.getBoundingClientRect().height;
  field.width = 'sm';
  await frame();
  expect(textarea.getBoundingClientRect().height).toBe(initial);
  expect(getComputedStyle(textarea).resize).toBe(mode === 'manual' ? 'vertical' : 'none');
});
