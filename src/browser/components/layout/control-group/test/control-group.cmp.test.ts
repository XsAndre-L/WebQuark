import { afterEach, describe, expect, it } from 'vitest';
import '../../../../../../packages/browser/components/dist/components/q-control-group.js';
import '../../../../../../packages/browser/components/dist/components/q-input.js';
import '../../../../../../packages/browser/components/dist/components/q-dropdown.js';
import '../../../../../../packages/browser/components/dist/components/q-toggle.js';
import '../../../../../../packages/browser/components/dist/components/q-quantity-selector.js';
import '../../../../../../packages/browser/components/dist/components/q-button.js';
import '../../../../../../packages/browser/components/dist/components/q-form.js';
import tokens from '../../../../theme/tokens.css?raw';
import presets from '../../../../theme/token-presets.css?raw';

const frame = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
const element = (id: string) => document.getElementById(id)!;
const surface = (id: string) => element(id).shadowRoot!.querySelector<HTMLElement>('.input-control,.dropdown-trigger,.toggle-wrapper,.quantity-selector,.btn')!;
const height = (id: string) => Math.round(surface(id).getBoundingClientRect().height);

async function fixture(html: string) {
  document.body.innerHTML = `<style>${tokens}\n${presets}</style>${html}`;
  await Promise.all(['q-control-group', 'q-input', 'q-dropdown', 'q-toggle', 'q-quantity-selector', 'q-button', 'q-form'].map(tag => customElements.whenDefined(tag)));
  await frame();
}

afterEach(() => { document.body.innerHTML = ''; });

describe('q-control-group', () => {
  it('joins all five controls without changing standalone geometry or child values', async () => {
    await fixture(`<q-input id="standalone" label="Outside" label-hidden value="original"></q-input>
      <q-control-group aria-label="Mixed controls" id="group">
        <q-toggle id="toggle" label="Enabled" checked></q-toggle>
        <q-input id="amount" label="Amount" label-hidden type="number" value="5" width="xs"></q-input>
        <q-dropdown id="unit" label="Unit" label-hidden options='["Minutes","Hours"]' value="Minutes"></q-dropdown>
        <q-quantity-selector id="quantity" value="2"></q-quantity-selector>
        <q-button id="button">Apply</q-button>
      </q-control-group>`);
    for (const id of ['toggle', 'amount', 'unit', 'quantity', 'button']) expect(height(id)).toBe(height('standalone'));
    expect(element('standalone').hasAttribute('data-q-control-group')).toBe(false);
    expect(getComputedStyle(surface('standalone')).borderStartStartRadius).not.toBe('0px');
    expect(getComputedStyle(surface('amount')).borderStartStartRadius).toBe('0px');
    expect((element('amount') as HTMLQInputElement).value).toBe('5');
    expect((element('toggle') as HTMLQToggleElement).checked).toBe(true);
    expect(element('group').shadowRoot!.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Mixed controls');
    expect(element('group').tabIndex).toBe(-1);
  });

  it('tracks hidden, repeated and moved children and restores standalone styling', async () => {
    await fixture('<q-control-group id="a"><q-input id="one"></q-input><q-input id="two"></q-input><q-button id="three">Save</q-button></q-control-group><q-control-group id="b"></q-control-group>');
    const originalRadius = getComputedStyle(surface('one')).borderStartStartRadius;
    element('one').hidden = true;
    await frame();
    expect(element('one').hasAttribute('data-q-control-group')).toBe(false);
    expect(element('two').getAttribute('data-q-control-group')).toBe('first');
    element('b').append(element('two'));
    await frame();
    expect(element('two').getAttribute('data-q-control-group')).toBe('only');
    document.body.append(element('two'));
    await frame();
    expect(element('two').hasAttribute('data-q-control-group')).toBe(false);
    expect(getComputedStyle(surface('two')).borderStartStartRadius).toBe(originalRadius);
    element('one').hidden = false;
    element('a').prepend(element('three'));
    await frame();
    expect(element('three').getAttribute('data-q-control-group')).toBe('first');
    expect(element('one').getAttribute('data-q-control-group')).toBe('last');
  });

  it('inherits changing preset, size and palette scopes without leaking outside', async () => {
    await fixture(`<q-form size="sm"><div id="scope" data-wq-preset="comfortable" style="--q-border-color:rgb(120, 10, 30)">
      <q-input id="outside" label-hidden label="Outside"></q-input>
      <q-control-group id="group"><q-input id="inside" label-hidden label="Inside"></q-input><q-button id="large" size="lg">Save</q-button></q-control-group>
      <div data-wq-preset="compact"><q-control-group><q-input id="nested" label-hidden label="Nested"></q-input></q-control-group></div>
      </div></q-form>`);
    expect(height('inside')).toBe(height('outside'));
    expect(height('inside')).toBe(36);
    expect(height('nested')).toBe(28);
    expect(height('large')).toBe(52);
    element('scope').dataset.wqPreset = 'compact';
    element('scope').style.setProperty('--q-border-color', 'rgb(10, 90, 40)');
    await frame();
    expect(height('inside')).toBe(height('outside'));
    expect(height('inside')).toBe(28);
    await expect.poll(() => height('large')).toBe(44);
    expect(getComputedStyle(surface('inside')).borderColor).toBe(getComputedStyle(surface('outside')).borderColor);
    element('group').setAttribute('size', 'lg');
    await frame();
    await expect.poll(() => height('inside')).toBe(44);
    expect(height('outside')).toBe(28);
  });

  it('preserves form values, reset, validation and events', async () => {
    await fixture(`<form id="form"><q-control-group>
      <q-input id="input" name="amount" label="Amount" label-hidden value="5" required></q-input>
      <q-toggle id="enabled" name="enabled" label="Enabled" checked></q-toggle>
      <q-dropdown id="unit" name="unit" label="Unit" label-hidden options='["Minutes","Hours"]' value="Minutes"></q-dropdown>
      </q-control-group></form>`);
    const form = element('form') as HTMLFormElement;
    expect(new FormData(form).get('amount')).toBe('5');
    expect(new FormData(form).get('unit')).toBe('Minutes');
    const input = element('input') as HTMLQInputElement;
    input.value = '';
    await frame();
    expect(await input.checkValidity()).toBe(false);
    form.reset();
    await frame();
    expect(input.value).toBe('5');
    let changes = 0;
    element('enabled').addEventListener('qChange', () => changes++);
    surface('enabled').click();
    await frame();
    expect(changes).toBe(1);
    expect(new FormData(form).has('enabled')).toBe(false);
  });

  it('keeps explicit host and preset widths without growing them into spare space', async () => {
    await fixture('<q-control-group style="width:600px"><q-input id="fixed" style="width:120px" label-hidden label="Code"></q-input><q-button>Find</q-button></q-control-group><q-control-group style="width:600px"><q-input id="small" width="xs" label-hidden label="Amount"></q-input><q-dropdown label-hidden label="Unit"></q-dropdown></q-control-group>');
    expect(element('fixed').getBoundingClientRect().width).toBe(120);
    expect(element('small').getBoundingClientRect().width).toBe(80);
  });

  it('preserves child appearance and actions across light and dark themes', async () => {
    await fixture(`<div id="theme" data-theme="light">
      <q-control-group><q-input id="input" label="Amount" label-hidden type="number" value="5"></q-input><q-dropdown id="dropdown" label="Supplier" label-hidden searchable options='["Acme","Example"]'></q-dropdown><q-button id="action">Use supplier</q-button></q-control-group>
      <q-input id="standalone" label="Amount" label-hidden type="number" value="5"></q-input></div>`);
    for (const theme of ['light', 'dark']) {
      element('theme').dataset.theme = theme;
      await frame();
      await expect.poll(() => getComputedStyle(surface('input')).backgroundColor).toBe(getComputedStyle(surface('standalone')).backgroundColor);
      expect(height('input')).toBe(height('standalone'));
    }
    element('input').shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Increase value"]')!.click();
    await frame();
    expect((element('input') as HTMLQInputElement).value).toBe('6');
    let actions = 0;
    element('action').addEventListener('qClick', () => actions++);
    surface('action').click();
    expect(actions).toBe(1);
    (element('action') as HTMLQButtonElement).disabled = true;
    await frame();
    surface('action').click();
    expect(actions).toBe(1);
    surface('dropdown').click();
    await frame();
    const option = element('dropdown').shadowRoot!.querySelector<HTMLElement>('[role="option"]')!;
    option.click();
    await frame();
    expect((element('dropdown') as HTMLQDropdownElement).value).toBe('Acme');
  });

  it('preserves q-form discovery, reset and disabled fields through the slot', async () => {
    await fixture('<q-form id="form"><q-control-group><q-input id="input" label="Amount" label-hidden name="amount" value="5"></q-input><q-input name="ignored" disabled value="hidden"></q-input></q-control-group></q-form>');
    const form = element('form') as HTMLQFormElement;
    expect(await form.getValues()).toEqual({ amount: '5' });
    await form.setValues({ amount: '10' });
    expect((element('input') as HTMLQInputElement).value).toBe('10');
    await form.resetForm();
    expect(await form.getValues()).toEqual({ amount: '5' });
  });

  it('keeps focus and dropdown menus outside the shared outline in RTL and vertical layouts', async () => {
    await fixture(`<q-control-group id="group" dir="rtl" style="width:300px"><q-input id="input" label="Amount" label-hidden></q-input>
      <q-dropdown id="dropdown" label="Unit" label-hidden options='["Minutes","Hours"]'></q-dropdown></q-control-group>`);
    expect(getComputedStyle(surface('input')).borderTopRightRadius).not.toBe('0px');
    await (element('input') as HTMLQInputElement).focusElement();
    expect(element('input').shadowRoot!.activeElement?.tagName).toBe('INPUT');
    surface('dropdown').click();
    await frame();
    const menu = element('dropdown').shadowRoot!.querySelector<HTMLElement>('[role="listbox"]')!;
    expect(menu.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(getComputedStyle(element('group').shadowRoot!.querySelector('[part="group"]')!).overflow).toBe('visible');
    element('group').setAttribute('orientation', 'vertical');
    await frame();
    expect(surface('dropdown').getBoundingClientRect().top).toBeGreaterThan(surface('input').getBoundingClientRect().top);
  });
});
