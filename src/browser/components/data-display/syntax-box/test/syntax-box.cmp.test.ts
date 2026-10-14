import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
// @ts-ignore - test the freshly regenerated consumer build, not the source transform.
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
// @ts-ignore - use the production component theme for the guide preview.
import '../../../../../../packages/browser/components/dist/webquark/webquark.css';
import { LANGUAGE_SOURCE, LITERAL_SOURCES, normalizeDomNewlines, SYNTAX_LANGUAGES } from './syntax-fixtures';
import { highlight } from '../internals/syntax';

defineCustomElements();
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

async function create(props: Record<string, unknown> = {}, slot?: string) {
  const form = document.createElement('form'); const el = document.createElement('q-syntax-box');
  Object.assign(el, { height: '150px', ...props });
  if (slot !== undefined) el.textContent = slot;
  form.append(el); document.body.append(form); await el.componentOnReady();
  return { el, form, textarea: el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement | null };
}
function expectLiteral(code: HTMLElement, source: string) {
  expect(normalizeDomNewlines(code.textContent ?? '')).toBe(normalizeDomNewlines(source));
  for (const child of Array.from(code.querySelectorAll('*'))) {
    expect(child.tagName).toBe('SPAN'); expect(child.getAttributeNames()).toEqual(['class']);
    expect(child.className).toMatch(/^code-(comment|value|tag|number|attr)$/);
  }
}
async function expectSource(el: HTMLQSyntaxBoxElement, source: string) {
  await vi.waitFor(() => {
    expect(el.code).toBe(source); expect(el.value).toBe(source);
    expectLiteral(el.shadowRoot!.querySelector('code')!, source);
    const textarea = el.shadowRoot!.querySelector('textarea');
    if (textarea) expect(textarea.value).toBe(normalizeDomNewlines(source));
  });
}

describe('built q-syntax-box literal rendering and source preservation', () => {
  for (const language of SYNTAX_LANGUAGES) {
    it.each([...LITERAL_SOURCES, ['language spacing, strings and comments', LANGUAGE_SOURCE[language]]])(`${language}: displays %s literally without source DOM`, async (_case, source) => {
      const { el } = await create({ language, code: source }); await expectSource(el, source);
      // Independently exercise the HTML-string helper through a real parser too.
      const container = document.createElement('code'); container.innerHTML = highlight(source, language);
      expectLiteral(container, source);
    });
    it(`${language}: preserves initialization, controlled code/value, blur, copy and reset exactly`, async () => {
      const source = LANGUAGE_SOURCE[language]; const updated = source + '\r\n  // untouched &lt; <i> 雪  \r';
      const { el, form, textarea } = await create({ language, value: source, editable: true, copyable: true, name: 'source' });
      const input = vi.fn(); const change = vi.fn(); el.addEventListener('qInput', input); el.addEventListener('qChange', change);
      const write = vi.fn().mockResolvedValue(undefined); vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(write);
      await expectSource(el, source);
      textarea!.focus(); textarea!.blur(); await expectSource(el, source);
      el.code = updated; await expectSource(el, updated);
      textarea!.focus(); el.value = source + '\t  '; await expectSource(el, source + '\t  ');
      textarea!.blur(); await expectSource(el, source + '\t  ');
      el.shadowRoot!.querySelectorAll('q-button')[1].click(); await vi.waitFor(() => expect(write).toHaveBeenCalledWith(source + '\t  '));
      expect(input).not.toHaveBeenCalled(); expect(change).not.toHaveBeenCalled();
      form.reset(); await expectSource(el, source);
      el.shadowRoot!.querySelectorAll('q-button')[1].click(); await vi.waitFor(() => expect(write).toHaveBeenLastCalledWith(source));
      expect(input).not.toHaveBeenCalled(); expect(change).not.toHaveBeenCalled();
    });
  }
  it('retains literal NUL and surrogate text through component text nodes', async () => {
    const source = '<b>\0\ud800 &lt;\r\n🐦'; const { el } = await create({ code: source }); await expectSource(el, source);
  });
  it('creates an unset required editor, accepts native input and resets to empty', async () => {
    const { el, form, textarea } = await create({ editable: true, required: true, name: 'source', variant: 'plain', ariaLabel: 'Source' }, 'read-only fallback');
    expect(textarea).not.toBeNull(); await expectSource(el, '');
    expect(textarea!.validity.valueMissing).toBe(true); expect(await el.checkValidity()).toBe(false);
    expect(form.checkValidity()).toBe(false); expect(new FormData(form).get('source')).toBe('');
    const input = vi.fn(); const change = vi.fn(); el.addEventListener('qInput', input); el.addEventListener('qChange', change);
    await userEvent.type(page.getByRole('textbox', { name: 'Source' }), '<b>&lt;');
    await expectSource(el, '<b>&lt;'); expect(await el.checkValidity()).toBe(true); expect(form.checkValidity()).toBe(true);
    expect(input.mock.calls.at(-1)![0].detail).toBe('<b>&lt;'); expect(change).not.toHaveBeenCalled();
    textarea!.blur(); await vi.waitFor(() => expect(change).toHaveBeenCalledTimes(1)); expect(change.mock.calls[0][0].detail).toBe('<b>&lt;');
    const inputCount = input.mock.calls.length; form.reset(); await expectSource(el, '');
    expect(await el.checkValidity()).toBe(false); expect(input).toHaveBeenCalledTimes(inputCount); expect(change).toHaveBeenCalledTimes(1);
  });
  it('retains read-only slot projection and can enter initially empty editable mode', async () => {
    const { el, form } = await create({ required: true, name: 'source' }, 'Fallback 雪');
    expect(el.code).toBeUndefined(); expect(el.value).toBeUndefined(); expect(el.shadowRoot!.querySelector('textarea')).toBeNull();
    expect(el.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])')!.assignedNodes()[0].textContent).toBe('Fallback 雪');
    expect(await el.checkValidity()).toBe(true); expect(new FormData(form).has('source')).toBe(false);
    el.editable = true; await expectSource(el, ''); expect(el.shadowRoot!.querySelector('textarea')).not.toBeNull(); expect(await el.checkValidity()).toBe(false);
  });
  it('keeps externally cleared editable aliases empty without reverting to a slot', async () => {
    const { el } = await create({ code: 'seed', editable: true, required: true });
    el.code = undefined; await expectSource(el, ''); expect(await el.checkValidity()).toBe(false);
    el.value = 'next'; await expectSource(el, 'next'); el.value = undefined; await expectSource(el, '');
  });
  it('normalizes only actual native editing to LF and preserves ordinary caret/input/change timing', async () => {
    const original = '{\r\n  "x" :  9007199254740993\r\n}\r';
    const { el, textarea, form } = await create({ code: original, language: 'json', editable: true, variant: 'plain', ariaLabel: 'Source' });
    const input = vi.fn(); const change = vi.fn(); el.addEventListener('qInput', input); el.addEventListener('qChange', change);
    await expectSource(el, original); textarea!.focus(); textarea!.setSelectionRange(1, 1);
    await userEvent.keyboard('X'); const edited = '{X' + normalizeDomNewlines(original).slice(1);
    await expectSource(el, edited); expect(textarea!.selectionStart).toBe(2); expect(textarea!.selectionEnd).toBe(2);
    expect(input).toHaveBeenCalledTimes(1); expect(input.mock.calls[0][0].detail).toBe(edited); expect(change).not.toHaveBeenCalled();
    el.value = edited; await expectSource(el, edited); expect(textarea!.selectionStart).toBe(2);
    textarea!.blur(); await vi.waitFor(() => expect(change).toHaveBeenCalledTimes(1)); expect(change.mock.calls[0][0].detail).toBe(edited);
    form.reset(); await expectSource(el, original);
  });
  it.each(['html', 'javascript'] as const)('%s: keeps typing responsive after inserting a long unfinished lexical run', async language => {
    const { el, textarea } = await create({ language, editable: true, variant: 'plain', ariaLabel: 'Source' });
    const input = vi.fn(); const change = vi.fn(); el.addEventListener('qInput', input); el.addEventListener('qChange', change);
    // A native fill inserts a complete paste-sized value without a keyboard event per character.
    const source = 'a'.repeat(32768);
    await page.getByRole('textbox', { name: 'Source' }).fill(source);
    await expectSource(el, source);
    expect(el.shadowRoot!.querySelector('code')!.childNodes).toHaveLength(1);
    textarea!.setSelectionRange(source.length, source.length);
    await userEvent.keyboard('X');
    await expectSource(el, source + 'X');
    expect(textarea!.selectionStart).toBe(source.length + 1); expect(textarea!.selectionEnd).toBe(source.length + 1);
    expect(input.mock.calls.at(-1)![0].detail).toBe(source + 'X'); expect(change).not.toHaveBeenCalled();
    textarea!.blur(); await vi.waitFor(() => expect(change).toHaveBeenCalledTimes(1));
    expect(change.mock.calls[0][0].detail).toBe(source + 'X');
  });
  it('replaces the selection with two Tab spaces, keeps caret, navigates Shift+Tab and blurs on Escape', async () => {
    const before = document.createElement('button'); before.textContent = 'Before'; document.body.append(before);
    const { el, textarea } = await create({ code: 'abcd', editable: true, variant: 'plain', ariaLabel: 'Source' });
    const input = vi.fn(); el.addEventListener('qInput', input);
    textarea!.focus(); textarea!.setSelectionRange(1, 3); await userEvent.keyboard('{Tab}');
    await expectSource(el, 'a  d'); await vi.waitFor(() => expect(textarea!.selectionStart).toBe(3)); expect(textarea!.selectionEnd).toBe(3);
    expect(input).toHaveBeenCalledTimes(1); expect(input.mock.calls[0][0].detail).toBe('a  d');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}'); expect(document.activeElement).toBe(before); await expectSource(el, 'a  d');
    textarea!.focus(); await userEvent.keyboard('{Escape}'); expect(el.shadowRoot!.activeElement).not.toBe(textarea); await expectSource(el, 'a  d');
  });
  it('renders the runnable empty-editor guide example for visual review', async () => {
    await page.viewport(800, 600);
    document.body.style.margin = '20px';
    const { el } = await create({ editable: true, required: true, name: 'template', heading: 'New template', language: 'html', height: '110px', ariaLabel: 'Template source' });
    el.style.width = '520px'; await expectSource(el, ''); expect(await el.checkValidity()).toBe(false);
    const formatIcon = el.shadowRoot!.querySelector('q-icon')!;
    await vi.waitFor(() => expect(formatIcon.shadowRoot!.querySelector('[part="svg"] svg path')).not.toBeNull());
    expect(formatIcon.shadowRoot!.querySelector('[part="fallback"]')).toBeNull();
    await page.elementLocator(el).screenshot({ path: 'docs/components/assets/q-syntax-box-empty-editor.png' });
    document.body.style.margin = '';
  });
  it('renders native editor Format, Copy and copied Check icons without fallback', async () => {
    const { el } = await create({ code: '<b>&lt;</b>', editable: true, copyable: true, heading: 'Editor' });
    const icons = el.shadowRoot!.querySelectorAll('q-icon'); expect(icons.length).toBe(2);
    for (const icon of Array.from(icons)) {
      await vi.waitFor(() => expect(icon.shadowRoot!.querySelector('[part="svg"] svg')).not.toBeNull());
      expect(icon.shadowRoot!.querySelector('[part="fallback"]')).toBeNull();
      expect(icon.shadowRoot!.querySelector('[key]')).toBeNull();
    }
    expect(icons[0].shadowRoot!.querySelectorAll('svg path').length).toBe(2);
    expect(icons[1].shadowRoot!.querySelector('svg rect')).not.toBeNull();
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    el.shadowRoot!.querySelectorAll('q-button')[1].click(); await vi.waitFor(() => expect(write).toHaveBeenCalledWith('<b>&lt;</b>'));
    await vi.waitFor(() => { expect(icons[1].shadowRoot!.querySelector('svg rect')).toBeNull(); expect(icons[1].shadowRoot!.querySelectorAll('svg path').length).toBe(1); });
    expect(icons[1].shadowRoot!.querySelector('[part="fallback"]')).toBeNull();
  });
});
