import { afterEach, describe, expect, it } from 'vitest';
import '../../../../packages/browser/components/dist/components/q-button.js';
import '../../../../packages/browser/components/dist/components/q-form.js';
import '../../../../packages/browser/components/dist/components/q-input.js';
import '../../../../packages/browser/components/dist/components/q-card.js';
import '../../../../packages/browser/components/dist/components/q-dropdown.js';
import '../../../../packages/browser/components/dist/components/q-tabs.js';
import '../../../../packages/browser/components/dist/components/q-toolbar.js';
import shared from '../tokens.css?raw';
import presets from '../token-presets.css?raw';
import native from '../behaviors/native-content.css?raw';

const frame = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
async function fixture(html: string) {
  document.body.innerHTML = `<style>${shared}\n${presets}\n${native}</style>${html}`;
  await Promise.all(['q-button', 'q-form', 'q-input', 'q-card', 'q-dropdown', 'q-tabs', 'q-toolbar'].map(tag => customElements.whenDefined(tag)));
  await frame();
}
const button = (id: string) => document.getElementById(id)!.shadowRoot!.querySelector('button')!;
const height = (id: string) => button(id).getBoundingClientRect().height;

describe('design presets', () => {
  afterEach(() => { document.body.replaceChildren(); document.documentElement.removeAttribute('data-wq-preset'); });

  it('preserves content-sized compact toolbars and applies taller minimums only in comfortable', async () => {
    const toolbars = (prefix: string) => `<q-toolbar id="${prefix}-normal"><q-button>Save</q-button></q-toolbar><q-toolbar id="${prefix}-small" compact><q-button>Save</q-button></q-toolbar>`;
    await fixture(`${toolbars('default')}<div data-wq-preset="comfortable">${toolbars('comfortable')}<div data-wq-preset="compact">${toolbars('compact')}</div></div>`);
    const rowHeight = (id: string) => document.getElementById(id)!.shadowRoot!.querySelector('[part="row"]')!.getBoundingClientRect().height;
    for (const preset of ['default', 'compact']) {
      expect(rowHeight(`${preset}-normal`)).toBe(52);
      expect(rowHeight(`${preset}-small`)).toBe(44);
    }
    expect(rowHeight('comfortable-normal')).toBe(72);
    expect(rowHeight('comfortable-small')).toBe(60);
    document.documentElement.dataset.wqPreset = 'comfortable';
    await expect.poll(() => rowHeight('default-normal')).toBe(72);
    await expect.poll(() => rowHeight('default-small')).toBe(60);
    document.documentElement.dataset.wqPreset = 'compact';
    await expect.poll(() => rowHeight('default-normal')).toBe(52);
    await expect.poll(() => rowHeight('default-small')).toBe(44);
    document.getElementById('compact-normal')!.style.setProperty('--q-toolbar-height', '80px');
    expect(rowHeight('compact-normal')).toBe(80);
  });

  it('keeps default and explicit compact dimensions and changes comfortable, including at the document root', async () => {
    await fixture('<q-button id="default">Save</q-button><div data-wq-preset="compact"><q-button id="compact">Save</q-button></div><div data-wq-preset="comfortable"><q-button id="comfortable">Save</q-button></div>');
    expect(height('default')).toBe(36);
    expect(height('compact')).toBe(36);
    expect(height('comfortable')).toBe(44);
    expect(getComputedStyle(button('comfortable')).fontSize).toBe('16px');
    document.documentElement.dataset.wqPreset = 'comfortable';
    await frame();
    await expect.poll(() => height('default')).toBe(44);
    expect(height('compact')).toBe(36);
  });

  it('carries inherited size intent through nested and runtime preset changes', async () => {
    await fixture('<q-form size="sm"><div id="scope" data-wq-preset="comfortable"><q-button id="small">Save</q-button><q-button id="large" size="lg">Save</q-button><div data-wq-preset="compact"><q-button id="nested">Save</q-button></div></div></q-form>');
    expect(height('small')).toBe(36);
    expect(height('large')).toBe(52);
    expect(height('nested')).toBe(28);
    document.getElementById('scope')!.dataset.wqPreset = 'compact';
    await frame();
    await expect.poll(() => height('small')).toBe(28);
    await expect.poll(() => height('large')).toBe(44);
    document.querySelector('q-form')!.size = 'lg';
    await frame();
    await expect.poll(() => height('small')).toBe(44);
  });

  it('resolves padding aliases at nested boundaries and preserves explicit overrides', async () => {
    await fixture('<div data-wq-preset="comfortable"><q-card id="card">Text</q-card><div data-wq-preset="compact"><q-card id="compact">Text</q-card></div><q-button id="custom" style="--q-btn-height:60px">Save</q-button></div>');
    const padding = (id: string) => getComputedStyle(document.getElementById(id)!.shadowRoot!.querySelector('.card-body')!).padding;
    expect(padding('card')).toBe('24px');
    expect(padding('compact')).toBe('16px');
    expect(height('custom')).toBe(60);
  });

  it('provides native reading roles without changing page margins or colours', async () => {
    const originalMargin = getComputedStyle(document.body).margin;
    await fixture('<main class="q-prose" data-wq-preset="comfortable" data-theme="light"><h1>Heading</h1><p>Readable text</p><div data-wq-preset="compact"><h1 id="small-heading">Compact</h1></div></main>');
    expect(getComputedStyle(document.querySelector('p')!).fontSize).toBe('18px');
    expect(parseFloat(getComputedStyle(document.querySelector('h1')!).fontSize)).toBeGreaterThanOrEqual(32);
    expect(getComputedStyle(document.getElementById('small-heading')!).fontSize).toBe('16px');
    expect(getComputedStyle(document.body).margin).toBe(originalMargin);
    expect(getComputedStyle(document.querySelector('main')!).getPropertyValue('--q-bg-base').trim()).toBe('#ffffff');
  });

  it('reserves feedback using the nearest preset line height', async () => {
    await fixture('<q-form reserve-feedback><div data-wq-preset="comfortable"><q-input label="Name"></q-input></div></q-form>');
    const feedback = document.querySelector('q-input')!.shadowRoot!.querySelector('.q-field-feedback')!;
    expect(getComputedStyle(feedback).minBlockSize).toBe('20px');
    expect(getComputedStyle(feedback).lineHeight).toBe('20px');
  });

  it('preserves explicit scope and legacy font override precedence', async () => {
    await fixture('<div style="--q-context-control-height:60px;--q-context-feedback-min:40px"><q-form size="sm"><q-button id="scoped">Save</q-button><q-input></q-input></q-form></div><q-card style="--q-font-size-lg:24px"><span slot="header">Title</span>Body</q-card>');
    document.querySelector('q-form')!.reserveFeedback = false;
    await frame();
    expect(height('scoped')).toBe(28);
    expect(getComputedStyle(document.querySelector('q-input')!.shadowRoot!.querySelector('.q-field-feedback')!).minBlockSize).toBe('0px');
    expect(getComputedStyle(document.querySelector('q-card')!.shadowRoot!.querySelector('.card-header')!).fontSize).toBe('24px');
  });

  it('keeps an open dropdown menu in the nearest preset when switching', async () => {
    await fixture('<div id="scope" data-wq-preset="comfortable"><q-dropdown label="Choose"></q-dropdown></div>');
    const dropdown = document.querySelector('q-dropdown')!;
    dropdown.options = [{ label: 'First option', value: 'first' }];
    await frame();
    dropdown.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!.click();
    await frame();
    const option = () => dropdown.shadowRoot!.querySelector<HTMLElement>('[role="option"]')!;
    expect(getComputedStyle(option()).fontSize).toBe('18px');
    document.getElementById('scope')!.dataset.wqPreset = 'compact';
    await expect.poll(() => getComputedStyle(option()).fontSize).toBe('14.4px');
    expect(dropdown.shadowRoot!.querySelector('[part="trigger"]')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps generic and size-specific tab overrides above private preset defaults', async () => {
    await fixture('<div id="scope" data-wq-preset="comfortable"><q-tabs></q-tabs></div>');
    const tabs = document.querySelector('q-tabs')!;
    tabs.items = ['First', 'Second'];
    await frame();
    const style = () => getComputedStyle(tabs.shadowRoot!.querySelector('[part~="tab"]')!);
    expect(style().minHeight).toBe('48px');
    tabs.style.setProperty('--q-tabs-height', '60px');
    tabs.style.setProperty('--q-tabs-padding', '3px 7px');
    expect(style().minHeight).toBe('60px');
    expect(style().padding).toBe('3px 7px');
    tabs.style.setProperty('--q-tabs-height-md', '70px');
    expect(style().minHeight).toBe('70px');
    document.getElementById('scope')!.dataset.wqPreset = 'compact';
    expect(style().minHeight).toBe('70px');
    tabs.style.removeProperty('--q-tabs-height-md');
    tabs.style.removeProperty('--q-tabs-height');
    tabs.style.removeProperty('--q-tabs-padding');
    expect(style().minHeight).toBe('42px');
    expect(style().padding).toBe('9px 16px');
  });
});
