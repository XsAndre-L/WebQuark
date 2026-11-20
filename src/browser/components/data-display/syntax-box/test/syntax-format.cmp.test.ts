import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
// @ts-ignore - verify freshly built consumer output.
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
// @ts-ignore - real guide previews use the production theme.
import '../../../../../../packages/browser/components/dist/webquark/webquark.css';
import { INVALID_JSON, JSON_EXPECTED, JSON_SOURCE, jsonTokens, UNSUPPORTED_SOURCE } from './format-fixtures';
import { MAX_JSON_FORMAT_DEPTH } from '../internals/formatters/json';
import { normalizeDomNewlines } from './syntax-fixtures';

defineCustomElements();
afterEach(() => { document.body.replaceChildren(); document.body.style.margin = ''; vi.restoreAllMocks(); });

async function create(props: Record<string, unknown> = {}) {
  const form = document.createElement('form'); const el = document.createElement('q-syntax-box');
  Object.assign(el, { editable: true, language: 'json', height: '220px', ...props });
  form.append(el); document.body.append(form); await el.componentOnReady(); return { el, form };
}
async function exact(el: HTMLQSyntaxBoxElement, source: string) {
  await vi.waitFor(() => {
    expect(el.code).toBe(source); expect(el.value).toBe(source);
    expect(el.shadowRoot!.querySelector('textarea')!.value).toBe(normalizeDomNewlines(source));
    expect(normalizeDomNewlines(el.shadowRoot!.querySelector('code')!.textContent!)).toBe(normalizeDomNewlines(source));
  });
}
function events(el: HTMLQSyntaxBoxElement) {
  const observed: { type: string; detail: string; code?: string; value?: string }[] = [];
  for (const type of ['qInput', 'qChange']) el.addEventListener(type, event => {
    observed.push({ type, detail: (event as CustomEvent<string>).detail, code: el.code, value: el.value });
  });
  return observed;
}
async function action(el: HTMLQSyntaxBoxElement): Promise<HTMLQButtonElement> {
  const button = el.shadowRoot!.querySelector<HTMLQButtonElement>('.format-btn')!;
  await button.componentOnReady(); return button;
}

describe('built syntax-box explicit safe formatting', () => {
  it('formats only on explicit JSON action, preserving tokens/aliases/event order/copy/reset', async () => {
    const { el, form } = await create({ value: JSON_SOURCE, copyable: true, name: 'source' }); const observed = events(el);
    const textarea = el.shadowRoot!.querySelector('textarea')!;
    await exact(el, JSON_SOURCE); textarea.focus(); textarea.blur(); await exact(el, JSON_SOURCE); expect(observed).toEqual([]);
    const button = await action(el); expect(button.disabled).toBe(false); button.click(); await exact(el, JSON_EXPECTED);
    expect(jsonTokens(el.code!)).toEqual(jsonTokens(JSON_SOURCE));
    expect(observed).toEqual(['qInput', 'qChange'].map(type => ({ type, detail: JSON_EXPECTED, code: JSON_EXPECTED, value: JSON_EXPECTED })));
    expect(new FormData(form).get('source')).toBe(JSON_EXPECTED);
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    el.shadowRoot!.querySelectorAll('q-button')[1].click(); await vi.waitFor(() => expect(write).toHaveBeenCalledWith(JSON_EXPECTED));
    form.reset(); await exact(el, JSON_SOURCE); expect(observed.length).toBe(2);
    el.code = '{"other":-0}'; await exact(el, '{"other":-0}'); expect(observed.length).toBe(2);
    el.value = JSON_EXPECTED; await exact(el, JSON_EXPECTED); button.click(); await exact(el, JSON_EXPECTED);
    expect(observed.map(event => event.type)).toEqual(['qInput', 'qChange', 'qInput', 'qChange']);
  });
  it.each(INVALID_JSON)('preserves %s with visible feedback and existing explicit JSON events', async (_case, source) => {
    const { el } = await create({ code: source }); const observed = events(el); (await action(el)).click(); await exact(el, source);
    await vi.waitFor(() => expect(el.shadowRoot!.querySelector('.format-feedback')!.textContent).toBe('Invalid JSON; source unchanged.'));
    expect(observed.map(event => [event.type, event.detail])).toEqual([['qInput', source], ['qChange', source]]);
    el.value = '{"valid":1}'; await exact(el, '{"valid":1}'); expect(el.shadowRoot!.querySelector('.format-feedback')).toBeNull();
  });
  it.each(UNSUPPORTED_SOURCE)('makes %s Format visibly unavailable without altering comments/literals/events', async (language, source) => {
    const { el } = await create({ language, code: source }); const observed = events(el); const button = await action(el);
    expect(button.disabled).toBe(true); expect(button.shadowRoot!.querySelector('button')!.disabled).toBe(true);
    expect(el.shadowRoot!.querySelector('.format-feedback')!.textContent).toBe('Formatting is available for JSON only.');
    button.click(); await exact(el, source); expect(observed).toEqual([]);
    el.language = 'json'; el.value = '{"next":1}'; await exact(el, '{"next":1}');
    await vi.waitFor(() => expect(button.disabled).toBe(false)); expect(el.shadowRoot!.querySelector('.format-feedback')).toBeNull();
  });
  it('keeps over-depth JSON intact with bounded-format feedback', async () => {
    const source = '['.repeat(MAX_JSON_FORMAT_DEPTH + 1) + '-0' + ']'.repeat(MAX_JSON_FORMAT_DEPTH + 1);
    const { el } = await create({ code: source }); (await action(el)).click(); await exact(el, source);
    await vi.waitFor(() => expect(el.shadowRoot!.querySelector('.format-feedback')!.textContent).toBe('JSON formatting limit reached; source unchanged.'));
  });
  it('keeps empty/disabled actions quiet and the plain variant without a Format action', async () => {
    const { el } = await create(); const observed = events(el); (await action(el)).click(); await exact(el, ''); expect(observed).toEqual([]);
    el.code = JSON_SOURCE; el.disabled = true; await exact(el, JSON_SOURCE); (await action(el)).click(); await exact(el, JSON_SOURCE); expect(observed).toEqual([]);
    el.variant = 'plain'; await vi.waitFor(() => expect(el.shadowRoot!.querySelector('.format-btn')).toBeNull());
  });
  it('captures the runnable explicit JSON guide example after real formatting', async () => {
    await page.viewport(800, 700); document.body.style.margin = '20px';
    const { el } = await create({ code: '{"10":9007199254740993,"2":-0,"same":1,"same":2}', heading: 'Exact JSON tokens', height: '190px' });
    el.style.width = '560px'; (await action(el)).click();
    await exact(el, '{\n  "10": 9007199254740993,\n  "2": -0,\n  "same": 1,\n  "same": 2\n}');
    await page.elementLocator(el).screenshot({ path: 'docs/components/assets/q-syntax-box-format-json.png' });
  });
  it('captures the runnable unsupported-format guide example', async () => {
    await page.viewport(800, 700); document.body.style.margin = '20px';
    const { el } = await create({ code: 'const message = `keep  spaces; { braces }`;', language: 'javascript', heading: 'Literal JavaScript', height: '110px' });
    el.style.width = '560px'; expect((await action(el)).disabled).toBe(true); await exact(el, 'const message = `keep  spaces; { braces }`;');
    await page.elementLocator(el).screenshot({ path: 'docs/components/assets/q-syntax-box-format-unsupported.png' });
  });
  it('refreshes the submitted-code example with current unavailable JavaScript formatting', async () => {
    await page.viewport(800, 700); document.body.style.margin = '20px';
    const { el, form } = await create({ code: 'const ready = true;', language: 'javascript', height: '110px', name: 'template', required: true, ariaLabel: 'Template code' });
    form.style.width = '560px'; const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Read form data';
    const output = document.createElement('output'); form.append(submit, output);
    form.addEventListener('submit', event => { event.preventDefault(); output.textContent = String(new FormData(form).get('template')); });
    submit.click(); expect(output.textContent).toBe('const ready = true;'); expect((await action(el)).disabled).toBe(true);
    await page.elementLocator(form).screenshot({ path: 'docs/components/assets/q-syntax-box-submit-code.png' });
  });
});
