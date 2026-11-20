import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
// @ts-ignore - exercise the same generated component loader as an application.
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
// @ts-ignore - visibility and focus need the component theme.
import '../../../../../../packages/browser/components/dist/webquark/webquark.css';

defineCustomElements();

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function mountBox(markup: string) {
  document.body.innerHTML = markup;
  const box = document.querySelector('q-syntax-box')!;
  await box.componentOnReady();
  await Promise.all(Array.from(box.querySelectorAll('q-syntax-view'), view => view.componentOnReady()));
  return box;
}

const tab = (name: string, selected?: boolean) => page.getByRole('tab', { name, exact: true, selected });

async function expectTabs(...labels: string[]) {
  await vi.waitFor(() => {
    expect(page.getByRole('tab').elements().map(element => element.textContent?.trim())).toEqual(labels);
  });
}

describe('q-syntax-box composed views', () => {
  it('renders standalone content and a single child directly, then adds tabs for a second child', async () => {
    await mountBox('<q-syntax-box heading="Source" code="standalone"></q-syntax-box>');
    await expect.element(page.getByText('standalone', { exact: true })).toBeVisible();
    await expectTabs();

    const box = await mountBox(`
      <form>
        <q-syntax-box heading="Output">
          <q-button slot="actions">Box action</q-button>
          <q-syntax-view heading="Example HTML" view-key="html" code="first"></q-syntax-view>
        </q-syntax-box>
      </form>
    `);
    await expect.element(page.getByText('first', { exact: true })).toBeVisible();
    await expectTabs();

    const events = document.createElement('q-syntax-view');
    events.heading = 'Events';
    box.append(events);
    await expectTabs('Example HTML', 'Events');
    await expect.element(tab('Example HTML', true)).toBeVisible();

    await tab('Events').click();
    box.closest('form')!.reset();
    await expectTabs('Example HTML', 'Events');
    await expect.element(tab('Events', true)).toBeVisible();
    events.remove();
    await expect.element(page.getByText('first', { exact: true })).toBeVisible();
    await expectTabs();
  });

  it.each(['code=""', 'value=""', 'editable'])(
    'counts the explicitly empty parent %s, with ordinary and empty child views',
    async parentSource => {
      await mountBox(`
        <q-syntax-box heading="Parent" ${parentSource}>
          <q-syntax-view heading="First" code="sample"></q-syntax-view>
          <q-syntax-view heading="Second"></q-syntax-view>
        </q-syntax-box>
      `);
      await expectTabs('Parent', 'First', 'Second');
      await expect.element(tab('Parent', true)).toBeVisible();
    },
  );

  it('keeps the edited field, caret and committed value across keyboard tab changes', async () => {
    const box = await mountBox(`
      <q-syntax-box variant="plain">
        <q-syntax-view heading="Draft" editable code="initial"></q-syntax-view>
        <q-syntax-view heading="Events">Recorded</q-syntax-view>
      </q-syntax-box>
    `);
    const changes = vi.fn();
    box.addEventListener('qChange', changes);

    const field = page.getByRole('textbox', { name: 'Draft' });
    await field.fill('edited draft');
    const textarea = field.element() as HTMLTextAreaElement;
    textarea.setSelectionRange(2, 5);
    await tab('Draft').click();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(tab('Events', true)).toBeVisible();
    await expect.element(page.getByText('Recorded', { exact: true })).toBeVisible();
    expect(field.elements()).toHaveLength(0);
    expect(textarea.isConnected).toBe(true);

    await userEvent.keyboard('{Home}');
    await vi.waitFor(() => expect(tab('Draft').element().matches(':focus')).toBe(true));
    await expect.element(field).toHaveValue('edited draft');
    expect(field.element()).toBe(textarea);
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([2, 5]);
    expect(changes.mock.calls.map(([event]) => event.detail)).toEqual(['edited draft']);
    expect(box.code).toBeUndefined();
  });

  it('preserves view identity through duplicate labels, renames, reordering and removal', async () => {
    const box = await mountBox(`
      <q-syntax-box>
        <q-syntax-view heading="Same" view-key="one" code="first body"></q-syntax-view>
        <q-syntax-view heading="Same" view-key="two" code="second body"></q-syntax-view>
        <q-syntax-view heading="Last" code="third body"></q-syntax-view>
      </q-syntax-box>
    `);
    await expectTabs('Same', 'Same', 'Last');
    await tab('Same').nth(1).click();
    const [first, second, third] = Array.from(box.querySelectorAll('q-syntax-view'));
    second.heading = 'Renamed';
    box.prepend(third);
    await expectTabs('Last', 'Same', 'Renamed');
    await expect.element(tab('Renamed', true)).toBeVisible();
    await expect.element(page.getByText('second body', { exact: true })).toBeVisible();
    second.remove();
    await expect.element(tab('Same', true)).toBeVisible();
    await expect.element(page.getByText('first body', { exact: true })).toBeVisible();
    first.remove();
    await expectTabs();
    await expect.element(page.getByText('third body', { exact: true })).toBeVisible();
  });

  it('keeps nested tab sets independent and associates each active tab with its named panel', async () => {
    await mountBox(`
      <q-syntax-box>
        <q-syntax-view heading="Code" view-key="code" code="outer"></q-syntax-view>
        <q-syntax-view heading="Nested" view-key="nested">
          <q-syntax-box>
            <q-syntax-view heading="Inner code" view-key="code" code="inner"></q-syntax-view>
            <q-syntax-view heading="Inner events" view-key="events"></q-syntax-view>
          </q-syntax-box>
        </q-syntax-view>
      </q-syntax-box>
    `);
    await expectTabs('Code', 'Nested');
    await tab('Nested').click();
    await tab('Inner events').click();

    for (const name of ['Nested', 'Inner events']) {
      await expect.element(tab(name, true)).toBeVisible();
      const panel = page.getByRole('tabpanel', { name, exact: true });
      await expect.element(panel).toBeVisible();
      await vi.waitFor(() => {
        const selectedTab = tab(name).element() as HTMLElement & { ariaControlsElements?: readonly Element[] };
        expect(selectedTab.ariaControlsElements).toContain(panel.element());
      });
    }
    await tab('Code').click();
    await expectTabs('Code', 'Nested');
    await tab('Nested').click();
    await expect.element(tab('Inner events', true)).toBeVisible();
  });

  it('keeps Copy data and delayed feedback on the originating view', async () => {
    const box = await mountBox('<q-syntax-box heading="Source" copyable>own text<q-button slot="actions">Unrelated action</q-button><q-syntax-view heading="Other" copyable code="second source"></q-syntax-view></q-syntax-box>');
    await expectTabs('Source', 'Other');
    let finishCopy!: () => void;
    const pending = new Promise<void>(resolve => { finishCopy = resolve; });
    const clipboard = vi.spyOn(navigator.clipboard, 'writeText').mockReturnValue(pending);

    await page.getByRole('button', { name: 'Copy', exact: true }).click();
    expect(clipboard).toHaveBeenCalledWith('own text');
    await tab('Other').click();
    finishCopy();
    await expect.element(page.getByRole('button', { name: 'Copy', exact: true })).toBeVisible();
    await tab('Source').click();
    await expect.element(page.getByRole('button', { name: 'Copied!', exact: true })).toBeVisible();
    expect(box.querySelector('q-syntax-view')!.code).toBe('second source');
  });

  it('submits each named native form field once and resets the inactive editor', async () => {
    const box = await mountBox(`
      <form><fieldset><q-syntax-box name="container">
        <q-syntax-view heading="One" view-key="first-tab" editable name="source" code="a"></q-syntax-view>
        <q-syntax-view heading="Two" view-key="second-tab" editable name="source" code="b"></q-syntax-view>
        <q-syntax-view heading="Disabled" editable disabled name="disabled" code="omit"></q-syntax-view>
      </q-syntax-box></fieldset></form>
    `);
    const form = box.closest('form')!;
    const [first, second] = Array.from(box.querySelectorAll('q-syntax-view'));
    await expectTabs('One', 'Two', 'Disabled');
    await page.getByRole('textbox', { name: 'One' }).fill('edited');
    await tab('Two').click();
    await page.getByRole('textbox', { name: 'Two' }).fill('also edited');
    const data = new FormData(form);
    expect(data.getAll('source')).toEqual(['edited', 'also edited']);
    expect(data.has('container')).toBe(false);
    expect(data.has('disabled')).toBe(false);

    const fieldset = form.querySelector('fieldset')!;
    fieldset.disabled = true;
    expect(new FormData(form).has('source')).toBe(false);
    fieldset.disabled = false;
    expect(new FormData(form).getAll('source')).toEqual(['edited', 'also edited']);

    form.reset();
    await vi.waitFor(() => expect([first.code, second.code]).toEqual(['a', 'b']));
    await expectTabs('One', 'Two', 'Disabled');
    await expect.element(tab('Two', true)).toBeVisible();
  });

  it('uses view fields in q-form and reveals an inactive invalid editor only when reporting', async () => {
    await mountBox(`
      <q-form><q-syntax-box name="output">
        <q-syntax-view heading="Draft" editable name="draft" code="initial"></q-syntax-view>
        <q-syntax-view heading="Required" editable required name="source"></q-syntax-view>
      </q-syntax-box></q-form>
    `);
    const form = document.querySelector('q-form')!;
    await form.componentOnReady();
    await expectTabs('Draft', 'Required');
    expect(await form.getValues()).toEqual({ draft: 'initial', source: '' });
    expect(await form.checkValidity()).toBe(false);
    await expect.element(tab('Draft', true)).toBeVisible();
    expect(await form.reportValidity()).toBe(false);
    await expect.element(tab('Required', true)).toBeVisible();
    await page.getByRole('textbox', { name: 'Required' }).fill('ready');
    expect(await form.checkValidity()).toBe(true);
    await form.resetForm();
    expect(await form.getValues()).toEqual({ draft: 'initial', source: '' });
    await expectTabs('Draft', 'Required');
  });

  it.each(['reportValidity', 'requestSubmit'] as const)('reveals the invalid view during native %s', async action => {
    const box = await mountBox(`
      <form><q-syntax-box>
        <q-syntax-view heading="Preview" code="source"></q-syntax-view>
        <q-syntax-view heading="Editor" editable required name="source"></q-syntax-view>
      </q-syntax-box></form>
    `);
    const form = box.closest('form')!;
    await expectTabs('Preview', 'Editor');
    expect(form.checkValidity()).toBe(false);
    await expect.element(tab('Preview', true)).toBeVisible();
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    form.addEventListener('submit', submit);
    if (action === 'reportValidity') expect(form.reportValidity()).toBe(false);
    else form.requestSubmit();

    await expect.element(tab('Editor', true)).toBeVisible();
    const editor = page.getByRole('textbox', { name: 'Editor' });
    await vi.waitFor(() => expect(editor.element().matches(':focus')).toBe(true));
    expect(submit).not.toHaveBeenCalled();
  });
});
