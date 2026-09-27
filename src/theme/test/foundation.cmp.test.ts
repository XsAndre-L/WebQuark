import { afterEach, describe, expect, it } from 'vitest';
import '../../../dist/components/q-button.js';
import '../../../dist/components/q-input.js';
import '../../../dist/components/q-dropdown.js';
import '../../../dist/components/q-textarea.js';
import '../../../dist/components/q-radio-group.js';
import '../../../dist/components/q-toggle.js';
import '../../../dist/components/q-quantity-selector.js';
import '../../../dist/components/q-form.js';
import '../../../dist/components/q-card.js';
import '../../../dist/components/q-panel.js';
import '../../../dist/components/q-grid.js';
import '../../../dist/components/q-stack.js';
import '../../../dist/components/q-inline.js';
import '../../../dist/components/q-toolbar.js';
import '../../../dist/components/q-icon.js';
import '../../../dist/components/q-dialog.js';
import globalCss from '../../../dist/webquark/webquark.css?raw';

const frame = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
async function fixture(html: string) {
  document.body.innerHTML = html;
  await Promise.all([...new Set(Array.from(document.querySelectorAll('*')).map(el => el.localName).filter(tag => tag.startsWith('q-')))].map(tag => customElements.whenDefined(tag)));
  await frame();
}
const part = (tag: string, name: string) => document.querySelector(tag)!.shadowRoot!.querySelector<HTMLElement>(`[part~="${name}"]`)!;
const height = (el: Element) => el.getBoundingClientRect().height;

describe('foundation composition in the browser', () => {
  afterEach(() => { document.body.replaceChildren(); document.documentElement.style.cssText = ''; });

  it('preserves automatic and explicit theme palettes after catalog generation', async () => {
    await fixture('<div id="light" data-theme="light"><q-input></q-input><div id="dark" data-theme="dark"><q-button>Save</q-button></div></div>');
    const style = document.createElement('style');
    style.textContent = globalCss;
    document.body.append(style);
    const token = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();
    expect(token(document.documentElement, '--q-bg-base')).toBe(matchMedia('(prefers-color-scheme: light)').matches ? '#ffffff' : '#0b0f19');
    expect(token(document.querySelector('#light')!, '--q-bg-base')).toBe('#ffffff');
    expect(token(document.querySelector('#dark')!, '--q-bg-base')).toBe('#0b0f19');
    expect(token(document.querySelector('#dark')!, '--q-color-primary')).toBe('#60a5fa');
    document.querySelector<HTMLElement>('#dark')!.style.setProperty('--q-color-primary', '#123456');
    expect(token(document.querySelector('q-button')!, '--q-color-primary')).toBe('#123456');
  });

  for (const stylesheet of [false, true]) {
    it(`shares control radii across explicit and inherited sizes ${stylesheet ? 'with' : 'without'} global CSS`, async () => {
      await fixture('<q-form><q-button>Save</q-button><q-input></q-input><q-textarea></q-textarea><q-dropdown></q-dropdown><q-radio-group></q-radio-group><q-quantity-selector></q-quantity-selector></q-form><q-toolbar size="sm"><q-button id="toolbar-button">Action</q-button></q-toolbar>');
      if (stylesheet) {
        const style = document.createElement('style');
        style.textContent = globalCss;
        document.body.append(style);
      }
      const form = document.querySelector('q-form')!;
      const selectors = [
        ['q-button', 'button', '--q-btn-radius'],
        ['q-input', '.input-control', '--q-input-radius'],
        ['q-textarea', 'textarea', '--q-input-radius'],
        ['q-dropdown', '.dropdown-trigger', '--q-dropdown-radius'],
        ['q-radio-group', '.options', '--q-radio-group-radius'],
        ['q-quantity-selector', '.quantity-selector', '--q-quantity-selector-radius'],
      ];
      const radius = (tag: string, selector: string) => getComputedStyle(document.querySelector(tag)!.shadowRoot!.querySelector(selector)!).borderRadius;
      for (const [size, expected] of [['sm', '5.5px'], ['md', '7px'], ['lg', '8.5px']] as const) {
        form.size = size;
        await frame();
        for (const [tag, selector] of selectors) await expect.poll(() => radius(tag, selector)).toBe(expected);
        for (const [tag] of selectors) (document.querySelector(tag) as any).size = 'sm';
        await frame();
        for (const [tag, selector] of selectors) await expect.poll(() => radius(tag, selector)).toBe('5.5px');
        for (const [tag] of selectors) (document.querySelector(tag) as any).size = 'inherit';
      }
      await expect.poll(() => radius('#toolbar-button', 'button')).toBe('5.5px');
      form.style.setProperty('--q-control-radius-lg', '10px');
      for (const [tag, selector] of selectors) await expect.poll(() => radius(tag, selector)).toBe('10px');
      form.style.setProperty('--q-field-radius', '12px');
      for (const [tag, selector] of selectors.slice(1)) await expect.poll(() => radius(tag, selector)).toBe('12px');
      for (const [tag, selector, token] of selectors) {
        document.querySelector<HTMLElement>(tag)!.style.setProperty(token, '3px');
        await expect.poll(() => radius(tag, selector)).toBe('3px');
      }
      const button = document.querySelector('q-button')!;
      button.size = 'sm';
      button.style.setProperty('--q-btn-radius-sm', '2px');
      await expect.poll(() => radius('q-button', 'button')).toBe('2px');
      button.shape = 'pill';
      await expect.poll(() => radius('q-button', 'button')).toBe('999px');
      button.shape = 'circle';
      await expect.poll(() => radius('q-button', 'button')).toBe('50%');
    });
  }

  it('auto-grows after inherited and explicit size changes, container resizing, and reconnecting', async () => {
    await fixture('<q-form size="sm" style="width:400px"><q-textarea></q-textarea></q-form>');
    const form = document.querySelector('q-form')!;
    const field = document.querySelector('q-textarea')!;
    const area = field.shadowRoot!.querySelector('textarea')!;
    field.value = Array(8).fill('A full line of text for resizing').join('\n');
    await frame();
    await expect.poll(() => area.scrollHeight - area.clientHeight).toBe(0);
    const smallHeight = height(area);
    form.size = 'lg';
    await frame();
    await expect.poll(() => area.scrollHeight - area.clientHeight).toBe(0);
    expect(height(area)).toBeGreaterThan(smallHeight);
    field.size = 'sm';
    await frame();
    await expect.poll(() => height(area)).toBe(smallHeight);
    field.size = 'inherit';
    await frame();
    await expect.poll(() => area.scrollHeight - area.clientHeight).toBe(0);
    const wideHeight = height(area);
    form.style.width = '180px';
    await frame();
    await expect.poll(() => area.scrollHeight - area.clientHeight).toBe(0);
    expect(height(area)).toBeGreaterThan(wideHeight);
    field.remove();
    form.size = 'sm';
    form.style.width = '400px';
    form.append(field);
    await frame();
    await expect.poll(() => height(area)).toBe(smallHeight);
    await frame();
    expect(height(area)).toBe(smallHeight);
  });

  for (const mode of ['manual', 'fixed'] as const) {
    it(`preserves ${mode} textarea height when inherited size changes`, async () => {
      await fixture(`<q-form size="sm"><q-textarea resize-mode="${mode}"></q-textarea></q-form>`);
      const area = document.querySelector('q-textarea')!.shadowRoot!.querySelector('textarea')!;
      area.style.height = '120px';
      document.querySelector('q-form')!.size = 'lg';
      await frame();
      await frame();
      expect(height(area)).toBe(120);
    });
  }

  for (const [size, expected] of [['sm', 28], ['md', 36], ['lg', 44]] as const) {
    it(`sizes ${size} color inputs and preserves icon-only padding overrides`, async () => {
      await fixture(`<q-form size="${size}"><q-input type="color"></q-input></q-form><q-input id="explicit" type="color" size="${size}"></q-input><q-button size="${size}" icon-only aria-label="Action"><span slot="icon-left">X</span></q-button>`);
      expect(height(part('q-input', 'control'))).toBe(expected);
      expect(height(part('#explicit', 'control'))).toBe(expected);
      const button = document.querySelector('q-button')!;
      expect(height(part('q-button', 'button'))).toBe(expected);
      const style = document.createElement('style');
      style.textContent = globalCss;
      document.body.append(style);
      await frame();
      expect(height(part('q-input', 'control'))).toBe(expected);
      expect(height(part('q-button', 'button'))).toBe(expected);
      button.style.setProperty(`--q-btn-icon-padding-${size}`, '20px');
      await frame();
      await expect.poll(() => getComputedStyle(part('q-button', 'button')).padding).toBe('20px');
      button.shape = 'circle';
      await frame();
      await expect.poll(() => getComputedStyle(part('q-button', 'button')).padding).toBe('20px');
      const input = document.querySelector('q-input')!;
      input.style.setProperty('--q-input-height', '50px');
      await frame();
      expect(height(part('q-input', 'control'))).toBe(50);
    });
  }

  for (const stylesheet of [false, true]) {
    it(`preserves textarea field-padding overrides ${stylesheet ? 'with' : 'without'} global CSS`, async () => {
      await fixture('<q-textarea></q-textarea>');
      if (stylesheet) {
        const style = document.createElement('style');
        style.textContent = globalCss;
        document.body.append(style);
      }
      const field = document.querySelector('q-textarea')!;
      const area = field.shadowRoot!.querySelector('textarea')!;
      await frame();
      expect(getComputedStyle(area).padding).toBe('8px 12px');
      field.style.setProperty('--q-field-padding', '20px 30px');
      await frame();
      expect(getComputedStyle(area).padding).toBe('20px 30px');
      field.style.setProperty('--q-input-padding', '4px 6px');
      await frame();
      expect(getComputedStyle(area).padding).toBe('4px 6px');
    });
  }

  for (const [size, expected] of [['sm', 28], ['md', 36], ['lg', 44]] as const) {
    it(`aligns ${size} controls without global CSS, including inherited and explicit sizes`, async () => {
      await fixture(`<q-form size="${size}"><q-inline><q-button>Save</q-button><q-input aria-label="Name"></q-input><q-dropdown aria-label="Choice"></q-dropdown><q-radio-group orientation="horizontal" aria-label="Kind"></q-radio-group><q-quantity-selector></q-quantity-selector></q-inline><q-button id="override" size="lg">Override</q-button></q-form>`);
      const radios = document.querySelector('q-radio-group')!;
      radios.options = [{ label: 'First', value: 'a', icon: 'check' }, { label: 'Second', value: 'b' }];
      await frame();
      for (const [tag, name] of [['q-button', 'button'], ['q-input', 'control'], ['q-dropdown', 'trigger'], ['q-radio-group', 'options']]) {
        expect(Math.abs(height(part(tag, name)) - expected), tag).toBeLessThanOrEqual(1);
      }
      expect(height(part('#override', 'button'))).toBe(44);
      expect(height(document.querySelector('q-quantity-selector')!.shadowRoot!.querySelector('.quantity-selector')!)).toBe(expected);
      document.querySelector('q-form')!.size = 'sm';
      await frame();
      expect(height(part('q-input', 'control'))).toBe(28);
      expect(height(part('#override', 'button'))).toBe(44);
      expect(height(document.querySelector('q-radio-group')!.shadowRoot!.querySelector('q-icon')!)).toBe(14);
    });
  }

  it('inherits feedback space and supports an explicit false override', async () => {
    await fixture('<q-form reserve-feedback><q-stack><q-input label="Name"></q-input><q-input id="off" label="Other"></q-input></q-stack></q-form>');
    document.querySelector<HTMLQInputElement>('#off')!.reserveFeedback = false;
    await frame();
    expect(height(part('q-input', 'feedback'))).toBe(16);
    expect(height(part('#off', 'feedback'))).toBe(0);
    const input = document.querySelector('q-input')!;
    const reservedHeight = height(input);
    input.description = 'Supporting text';
    await frame();
    expect(input.shadowRoot!.querySelector('input')!.getAttribute('aria-describedby')).toBe('q-field-error');
    expect(part('q-input', 'feedback').textContent).toBe('Supporting text');
    expect(height(input)).toBe(reservedHeight);
    input.labelHidden = true;
    input.error = 'Please correct this';
    await frame();
    expect(part('q-input', 'feedback').textContent).toBe('Please correct this');
  });

  it('caps columns and lets full-row items and narrow containers fit', async () => {
    await fixture('<q-grid style="width:800px" min-item-width="12rem" columns="3"><div>A</div><div>B</div><div>C</div><div data-q-span="full">Full</div></q-grid>');
    const grid = document.querySelector('q-grid')!;
    const layout = part('q-grid', 'layout');
    expect(getComputedStyle(layout).gridTemplateColumns.split(' ').length).toBe(3);
    expect(grid.children[3].getBoundingClientRect().width).toBe(800);
    grid.style.width = '180px';
    await frame();
    expect(getComputedStyle(layout).gridTemplateColumns.split(' ').length).toBe(1);
    expect(layout.scrollWidth).toBeLessThanOrEqual(180);
  });

  it('preserves component error colors in shared feedback', async () => {
    await fixture('<q-radio-group error="Choose one" style="--q-radio-group-error-color:rgb(120, 20, 30)"></q-radio-group><q-toggle error="Review this" style="--q-toggle-error-color:rgb(30, 40, 150)"></q-toggle>');
    expect(getComputedStyle(part('q-radio-group', 'feedback')).color).toBe('rgb(120, 20, 30)');
    expect(getComputedStyle(part('q-toggle', 'feedback')).color).toBe('rgb(30, 40, 150)');
  });

  it('keeps explicit surface roles and padding local', async () => {
    await fixture('<q-panel variant="plain" surface="card" padding="none" style="--q-bg-card:rgb(12, 34, 56)"><q-card><span slot="footer">Footer</span>Body</q-card></q-panel>');
    expect(getComputedStyle(part('q-panel', 'panel')).backgroundColor).toBe('rgb(12, 34, 56)');
    expect(getComputedStyle(part('q-panel', 'body')).padding).toBe('0px');
    expect(getComputedStyle(part('q-card', 'body')).padding).toBe('16px');
    expect(getComputedStyle(part('q-card', 'footer')).display).not.toBe('none');
    document.querySelector('q-panel')!.style.setProperty('--q-panel-bg', 'rgb(56, 34, 12)');
    await frame();
    expect(getComputedStyle(part('q-panel', 'panel')).backgroundColor).toBe('rgb(56, 34, 12)');
  });

  it('validates dropdowns through q-form while accepting remotely loaded values', async () => {
    await fixture('<q-form><q-grid><q-dropdown name="country" label="Country" required></q-dropdown></q-grid></q-form>');
    const form = document.querySelector('q-form')!;
    const dropdown = document.querySelector('q-dropdown')!;
    let submissions = 0;
    form.addEventListener('qSubmit', () => submissions++);
    expect(await dropdown.checkValidity()).toBe(false);
    await form.submitForm();
    expect(submissions).toBe(0);
    dropdown.value = 'not-in-current-page';
    await frame();
    await form.submitForm();
    expect(submissions).toBe(1);
    dropdown.error = 'Server rejected selection';
    await frame();
    expect(await dropdown.checkValidity()).toBe(false);
    dropdown.disabled = true;
    await frame();
    expect(await dropdown.checkValidity()).toBe(true);
    dropdown.disabled = false;
    dropdown.error = undefined;
    await form.resetForm();
    expect(dropdown.value).toBe('');
  });

  it('participates in native form validation and preserves noValidate', async () => {
    await fixture('<form><q-dropdown name="choice" required></q-dropdown></form><q-form no-validate><q-dropdown name="other" required></q-dropdown></q-form>');
    expect(document.querySelector('form')!.checkValidity()).toBe(false);
    document.querySelector('q-dropdown')!.value = 'a';
    await frame();
    expect(document.querySelector('form')!.checkValidity()).toBe(true);
    let submitted = false;
    document.querySelector('q-form')!.addEventListener('qSubmit', () => submitted = true);
    await document.querySelector('q-form')!.submitForm();
    expect(submitted).toBe(true);
  });

  it('wraps horizontal toolbar actions and honors compact and custom padding', async () => {
    await fixture('<q-toolbar size="sm" compact style="width:240px"><strong>Page</strong><q-button slot="end">First action</q-button><q-button slot="end">Second action</q-button><q-button slot="end">Third action</q-button></q-toolbar>');
    const toolbar = document.querySelector('q-toolbar')!;
    const row = toolbar.shadowRoot!.querySelector<HTMLElement>('.toolbar-row')!;
    expect(row.scrollWidth).toBeLessThanOrEqual(240);
    expect(getComputedStyle(row).paddingTop).toBe('4px');
    expect(height(part('q-button', 'button'))).toBe(28);
    toolbar.style.setProperty('--q-toolbar-padding', '0px');
    await frame();
    expect(getComputedStyle(row).padding).toBe('0px');
    toolbar.edge = 'left';
    toolbar.gap = 'md';
    await frame();
    expect(getComputedStyle(row).display).toBe('grid');
    expect(getComputedStyle(row).rowGap).toBe('12px');
  });

  it('keeps dialog actions within the viewport and restores focus', async () => {
    await fixture('<button id="opener">Open</button><q-dialog dialog-title="Details" cancel-label="Cancel editing these details" confirm-label="Save and continue to the next step"></q-dialog>');
    const opener = document.querySelector<HTMLButtonElement>('#opener')!;
    opener.focus();
    const dialog = document.querySelector('q-dialog')!;
    dialog.open = true;
    await frame();
    const modal = part('q-dialog', 'modal');
    expect(modal.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth - 32);
    expect(modal.scrollWidth).toBeLessThanOrEqual(modal.clientWidth);
    dialog.open = false;
    await frame();
    expect(document.activeElement).toBe(opener);
    dialog.showCancel = false;
    dialog.showConfirm = false;
    await frame();
    expect(getComputedStyle(part('q-dialog', 'footer')).display).toBe('none');
    const footer = document.createElement('span');
    footer.slot = 'footer';
    footer.textContent = 'Custom actions';
    dialog.append(footer);
    await frame();
    expect(getComputedStyle(part('q-dialog', 'footer')).display).not.toBe('none');
    footer.remove();
    await frame();
    expect(getComputedStyle(part('q-dialog', 'footer')).display).toBe('none');
  });

  for (const stylesheet of [false, true]) {
    it(`resolves local palettes, panel padding, and explicit geometry overrides ${stylesheet ? 'with' : 'without'} global CSS`, async () => {
      await fixture('<div style="--q-bg-surface-2:rgb(13, 27, 39)"><q-card>Card</q-card></div><q-panel padding="sm">Panel</q-panel><q-input size="sm"></q-input><q-button size="lg">Large</q-button>');
      if (stylesheet) {
        const style = document.createElement('style');
        style.textContent = globalCss;
        document.body.append(style);
      }
      await frame();
      expect(getComputedStyle(part('q-card', 'container')).backgroundColor).toBe('rgb(13, 27, 39)');
      expect(getComputedStyle(part('q-panel', 'body')).padding).toBe('8px');
      expect(height(part('q-input', 'control'))).toBe(28);
      expect(height(part('q-button', 'button'))).toBe(44);
      const panel = document.querySelector('q-panel')!;
      panel.style.setProperty('--q-panel-padding-sm', '21px');
      await frame();
      expect(getComputedStyle(part('q-panel', 'body')).padding).toBe('21px');
      panel.style.setProperty('--q-panel-padding', '3px');
      document.querySelector('q-input')!.style.setProperty('--q-input-height', '50px');
      await frame();
      expect(getComputedStyle(part('q-panel', 'body')).padding).toBe('3px');
      expect(height(part('q-input', 'control'))).toBe(50);
    });
  }
});

