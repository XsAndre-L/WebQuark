import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { formFieldProtocol, registerFormField } from '../../../../utils/form-field-adapter';
// @ts-ignore - exercise the freshly generated consumer loader.
import { defineCustomElements } from '../../../../../dist/loader';
// @ts-ignore
import '../../../../../dist/webquark/webquark.css';

defineCustomElements();
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

async function create(html = '', parent: HTMLElement = document.body): Promise<HTMLQFormElement> {
  const form = document.createElement('q-form');
  form.innerHTML = html;
  parent.append(form);
  await form.componentOnReady();
  return form;
}

async function submitted(form: HTMLQFormElement): Promise<CustomEvent | undefined> {
  let result: CustomEvent | undefined;
  const listener = (event: Event) => { result = event as CustomEvent; };
  form.addEventListener('qSubmit', listener);
  await form.submitForm();
  form.removeEventListener('qSubmit', listener);
  return result;
}

function pendingField(name: string) {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const realm = frame.contentWindow as Window & typeof globalThis;
  class PendingField extends realm.HTMLElement {
    static formAssociated = true;
    internals = this.attachInternals();
  }
  realm.customElements.define('q-input', PendingField);
  const field = realm.document.createElement('q-input') as unknown as PendingField;
  document.adoptNode(field);
  field.setAttribute('name', name);
  frame.remove();
  return field;
}

function waiting(field: HTMLElement): number {
  return (field as unknown as Record<symbol, { waiting: Set<() => void> }>)[formFieldProtocol]?.waiting.size ?? 0;
}

async function isolatedForm(html: string) {
  const frame = document.createElement('iframe');
  frame.srcdoc = `<q-form>${html}</q-form><script type="module">import { defineCustomElement } from '/dist/components/q-form.js'; defineCustomElement();</script>`;
  document.body.append(frame);
  await vi.waitFor(() => expect(frame.contentWindow?.customElements.get('q-form')).toBeDefined());
  const realm = frame.contentWindow as Window & typeof globalThis;
  const form = realm.document.querySelector('q-form')!;
  await vi.waitFor(() => expect(form.shadowRoot?.querySelector('form')).toBeTruthy());
  const defineInput = () => {
    const script = realm.document.createElement('script');
    script.type = 'module';
    script.textContent = "import { defineCustomElement } from '/dist/components/q-input.js'; defineCustomElement();";
    realm.document.body.append(script);
  };
  return { frame, realm, form, defineInput };
}

describe('built q-form ownership and canonical values', () => {
  it('validates unnamed supported fields and ignores named wrappers, slots, actions and consumer shadow internals', async () => {
    const form = await create('<div name="wrapper" value="fake"><input required></div><q-input required></q-input><slot name="fake"></slot><q-button name="action">Action</q-button><div id="consumer"></div>');
    form.querySelector('#consumer')!.attachShadow({ mode: 'open' }).innerHTML = '<input name="secret" required>';
    expect(await form.getValues()).toEqual({});
    expect(await submitted(form)).toBeUndefined();
    form.querySelector('input')!.value = 'native';
    await form.setValues({ missing: 'ignored' });
    form.querySelector('q-input')!.value = 'custom';
    expect((await submitted(form))?.detail.values).toEqual({});
  });

  it('excludes nested forms and explicit unresolved owners, and preserves actual outer native ownership', async () => {
    const outside = document.createElement('form');
    outside.id = 'outside';
    document.body.append(outside);
    const form = await create('<input name="own" value="yes"><input name="external" value="no" form="outside"><input name="unresolved" value="no" form="missing"><input name="empty-owner" value="no" form=""><q-input name="face" value="outside" form="outside"></q-input>');
    const nested = document.createElement('q-form');
    nested.innerHTML = '<input name="nested" value="no"><q-input name="nested-face" value="no"></q-input>';
    form.append(nested);
    await nested.componentOnReady();
    expect(await form.getValues()).toEqual({ own: 'yes' });
    expect(new FormData(outside).get('face')).toBe('outside');
    await form.setValues({ face: 'do not change', external: 'do not change', nested: 'do not change' });
    expect(new FormData(outside).get('face')).toBe('outside');
    const outerOwned = await create('<input name="native" value="outer"><q-input name="custom" value="outer"></q-input>', outside);
    expect(await outerOwned.getValues()).toEqual({});
    expect(new FormData(outside).get('custom')).toBe('outer');
  });

  it('includes actual native controls externally associated with the internal form once', async () => {
    const form = await create('<input name="light" value="a">');
    const owner = form.shadowRoot!.querySelector('form')!;
    owner.id = 'shadow-owner';
    const external = document.createElement('input');
    external.name = 'external';
    external.value = 'b';
    external.setAttribute('form', owner.id);
    form.shadowRoot!.append(external);
    expect(external.form).toBe(owner);
    expect(await form.getValues()).toEqual({ light: 'a', external: 'b' });
    expect(Array.from((await submitted(form))!.detail.formData)).toEqual([['light', 'a'], ['external', 'b']]);
  });

  it('uses the native elements getter when associated fields shadow form properties', async () => {
    const form = await create('<input name="light" value="a">');
    const owner = form.shadowRoot!.querySelector('form')!;
    owner.id = 'clobbered-owner';
    for (const name of ['elements', 'submit', 'external']) {
      const input = document.createElement('input');
      input.name = name;
      input.value = name;
      input.setAttribute('form', owner.id);
      form.shadowRoot!.append(input);
    }
    expect((owner as unknown as { elements: Element }).elements.tagName).toBe('INPUT');
    expect(await form.getValues()).toEqual({ light: 'a', elements: 'elements', submit: 'submit', external: 'external' });
    await form.setValues({ elements: 'updated', external: 'changed' });
    expect((await submitted(form))!.detail.values).toEqual({ light: 'a', elements: 'updated', submit: 'submit', external: 'changed' });
  });

  it('cancels readiness after host removal without a repeat loop or retained waiter', async () => {
    const form = await create('<input name="kept" value="before">');
    const field = pendingField('pending');
    form.append(field);
    const pending = form.getValues();
    await vi.waitFor(() => expect(waiting(field)).toBe(1));
    form.remove();
    expect(await pending).toEqual({ kept: 'before' });
    expect(waiting(field)).toBe(0);
  });

  it('waits for a supported field definition and adapter before getValues resolves', async () => {
    const { realm, form, defineInput } = await isolatedForm('<q-input name="late" value="before"></q-input>');
    const field = form.querySelector('q-input')!;
    expect(realm.customElements.get('q-input')).toBeUndefined();
    let settled = false;
    const pending = form.getValues().then(values => { settled = true; return values; });
    await vi.waitFor(() => expect(waiting(field)).toBe(1));
    expect(settled).toBe(false);
    defineInput();
    expect(await pending).toEqual({ late: 'before' });
    expect(waiting(field)).toBe(0);
  });

  it('waits for delayed registration before setValues assigns the supported field', async () => {
    const { realm, form, defineInput } = await isolatedForm('<input name="kept" value="before"><q-input name="late" value="before"></q-input>');
    const field = form.querySelector('q-input')!;
    expect(realm.customElements.get('q-input')).toBeUndefined();
    const pending = form.setValues({ kept: 'after', late: 'assigned' });
    await vi.waitFor(() => expect(waiting(field)).toBe(1));
    expect(form.querySelector('input')!.value).toBe('before');
    defineInput();
    await pending;
    expect(await form.getValues()).toEqual({ kept: 'after', late: 'assigned' });
    expect(field.shadowRoot!.querySelector('input')!.value).toBe('assigned');
    expect(waiting(field)).toBe(0);
  });

  it('rejects an owned supported tag that never registers instead of silently omitting it', async () => {
    const { realm, form } = await isolatedForm('<input name="kept" value="before"><q-input name="late"></q-input>');
    const field = form.querySelector('q-input')!;
    expect(realm.customElements.get('q-input')).toBeUndefined();
    await expect(form.setValues({ kept: 'changed', late: 'assigned' })).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(form.querySelector('input')!.value).toBe('before');
    expect(waiting(field)).toBe(0);
  }, 10000);

  it('rediscovers ownership when a not-ready field is reparented or explicitly associated elsewhere', async () => {
    const first = await create();
    const second = await create();
    const field = pendingField('late');
    first.append(field);
    const pending = first.getValues();
    await vi.waitFor(() => expect(waiting(field)).toBe(1));
    second.append(field);
    expect(await pending).toEqual({});
    expect(waiting(field)).toBe(0);
    let value = 'ready';
    registerFormField(field, {
      kind: 'text', owner: () => field.internals.form, active: () => true,
      value: () => value, assign: next => { value = String(next); },
      reconcile: () => {}, reset: () => { value = 'ready'; }, validate: () => true,
    });
    await first.setValues({ late: 'foreign' });
    expect(await second.getValues()).toEqual({ late: 'ready' });
    field.setAttribute('form', 'unresolved');
    expect(await second.getValues()).toEqual({});
    const explicit = pendingField('explicit');
    second.append(explicit);
    const pendingOwner = second.getValues();
    await vi.waitFor(() => expect(waiting(explicit)).toBe(1));
    explicit.setAttribute('form', 'unresolved');
    expect(await pendingOwner).toEqual({});
    expect(waiting(explicit)).toBe(0);
  });

  it('rejects permanently unready fields finitely and cleans all pending waits without partial mutation', async () => {
    const form = await create('<input name="kept" value="before">');
    const fields = [pendingField('first'), pendingField('second')];
    form.append(...fields);
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const pending = form.setValues({ kept: 'changed' });
    await expect(pending).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(fields.map(waiting)).toEqual([0, 0]);
    expect(disconnect.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(form.querySelector('input')!.value).toBe('before');
    fields.forEach(field => field.remove());
    await form.setValues({ kept: 'after' });
    expect(await form.getValues()).toEqual({ kept: 'after' });
  }, 10000);

  it('honors fieldset first-legend semantics, explicit disabled and successful readonly values', async () => {
    const form = await create('<fieldset disabled><legend><input name="legend" value="yes"><q-input name="face-legend" value="yes"></q-input></legend><input name="blocked" value="no"><q-input name="face-blocked" required value="no"></q-input><legend><input name="second-legend" value="no"></legend></fieldset><input name="readonly" required readonly value=""><input name="explicit" disabled value="no"><q-input name="face-readonly" value="yes" readonly></q-input>');
    expect(await form.getValues()).toEqual({ legend: 'yes', 'face-legend': 'yes', readonly: '', 'face-readonly': 'yes' });
    expect((await submitted(form))?.detail.values).toEqual(await form.getValues());
    const fieldset = form.querySelector('fieldset')!;
    fieldset.disabled = false;
    expect((await form.getValues()).blocked).toBe('no');
    expect((await form.getValues()).explicit).toBeUndefined();
    expect(form.querySelector<HTMLQInputElement>('q-input[name="face-blocked"]')!.disabled).toBe(false);
  });

  it('assigns disabled and readonly owned fields silently while collecting only successful values', async () => {
    const form = await create('<input name="repeat" disabled value="disabled"><input name="repeat" readonly value="readonly"><textarea name="readonly" readonly>before</textarea><fieldset disabled><input name="inherited" value="before"><q-input name="face-inherited" value="before"></q-input></fieldset><q-input name="face" disabled value="before"></q-input><q-textarea name="area" disabled value="before"></q-textarea><q-dropdown name="drop" disabled value="a"></q-dropdown><q-radio-group name="radio" disabled value="a"></q-radio-group><q-toggle name="toggle" disabled></q-toggle><q-syntax-box name="source" editable disabled code="before"></q-syntax-box><q-syntax-box name="display" code="keep"></q-syntax-box>');
    form.querySelector('q-dropdown')!.options = ['a', 'b'];
    form.querySelector('q-radio-group')!.options = ['a', 'b'];
    const observed: string[] = [];
    ['qInput', 'qChange', 'input', 'change'].forEach(type => form.addEventListener(type, () => observed.push(type)));
    await expect(form.setValues({ readonly: 'changed', repeat: ['short'] })).rejects.toThrow(TypeError);
    expect(form.querySelector('textarea')!.value).toBe('before');
    await form.setValues({ repeat: ['disabled-updated', 'readonly-updated'], readonly: 'after', inherited: 'after', 'face-inherited': 'after', face: 'after', area: 'after', drop: 'b', radio: 'b', toggle: true, source: '<raw>&after', display: 'ignored' });
    expect(Array.from(form.querySelectorAll('input')).map(field => field.value)).toEqual(['disabled-updated', 'readonly-updated', 'after']);
    expect(form.querySelector<HTMLQInputElement>('q-input[name="face"]')!.value).toBe('after');
    expect(form.querySelector<HTMLQInputElement>('q-input[name="face-inherited"]')!.value).toBe('after');
    expect(form.querySelector('q-textarea')!.value).toBe('after');
    expect(form.querySelector('q-dropdown')!.value).toBe('b');
    expect(form.querySelector('q-radio-group')!.value).toBe('b');
    expect(form.querySelector('q-toggle')!.checked).toBe(true);
    expect(form.querySelector<HTMLQSyntaxBoxElement>('q-syntax-box[name="source"]')!.code).toBe('<raw>&after');
    expect(form.querySelector<HTMLQSyntaxBoxElement>('q-syntax-box[name="display"]')!.code).toBe('keep');
    expect(await form.getValues()).toEqual({ repeat: ['readonly-updated'], readonly: 'after' });
    form.querySelector('fieldset')!.disabled = false;
    expect(await form.getValues()).toEqual({ repeat: ['readonly-updated'], readonly: 'after', inherited: 'after', 'face-inherited': 'after' });
    expect(observed).toEqual([]);
  });

  it('collects selected enabled options, identities, hidden values and dirname without unsuccessful fallbacks', async () => {
    const form = await create('<input name="hidden" type="hidden" value="h"><input name="choice" type="checkbox" value="" checked><input name="choice" type="checkbox" value="off"><input name="radio" type="radio" value="r1"><input name="radio" type="radio" value="r2" checked><select name="many" multiple><option value="a" selected>A</option><optgroup disabled><option value="bad" selected>Bad</option></optgroup><option value="disabled" disabled selected>Disabled</option><option value="b" selected>B</option></select><select name="none" multiple><option>A</option></select><select name="single"><option value="" selected>Empty</option></select><input name="direction" value="שלום" dir="rtl" dirname="direction.dir">');
    expect(await form.getValues()).toEqual({ hidden: 'h', choice: [''], radio: 'r2', many: ['a', 'b'], none: [], single: '', direction: 'שלום', 'direction.dir': 'rtl' });
    expect(Array.from((await submitted(form))!.detail.formData)).toEqual([['hidden', 'h'], ['choice', ''], ['radio', 'r2'], ['many', 'a'], ['many', 'b'], ['single', ''], ['direction', 'שלום'], ['direction.dir', 'rtl']]);
  });

  it('preserves native radio validity when a disabled checked option satisfies required but has no entry', async () => {
    const form = await create('<input type="radio" name="native" value="a" required><input type="radio" name="native" value="b" checked disabled>');
    expect(form.querySelector('input')!.checkValidity()).toBe(true);
    expect(await form.getValues()).toEqual({});
    expect((await submitted(form))?.detail.values).toEqual({});
  });

  it('matches native direction, charset and datalist serialization', async () => {
    const types = ['hidden', 'text', 'search', 'tel', 'url', 'email', 'password', 'number', 'range', 'color'];
    const html = types.map(type => `<input type="${type}" name="${type}" value="" dirname="${type}.dir" dir="rtl">`).join('') +
      '<input type="hidden" name="_charset_" value="original"><datalist><input name="datalist-native" value="no" required><q-input name="datalist-face" value="face" required></q-input></datalist>';
    const form = await create(html);
    form.noValidate = true;
    const native = document.createElement('form');
    native.innerHTML = html;
    document.body.append(native);
    await native.querySelector('q-input')!.componentOnReady();
    const nativeEntries: Array<[string, FormDataEntryValue]> = [];
    new FormData(native).forEach((value, name) => nativeEntries.push([name, value]));
    expect(Array.from((await submitted(form))!.detail.formData)).toEqual(nativeEntries);
    expect((await form.getValues())._charset_).toBe('UTF-8');
    const values = await form.getValues();
    const nativeData = new FormData(native);
    expect(values['datalist-native']).toBe(nativeData.get('datalist-native') ?? undefined);
    expect(values['datalist-face']).toBe(nativeData.get('datalist-face') ?? undefined);
    expect(form.querySelector<HTMLInputElement>('input[name="datalist-native"]')!.willValidate).toBe(false);
  });

  it('omits unavailable custom selections, including disabled radio choices, while retaining external-search domain values', async () => {
    const form = await create('<q-radio-group name="radio" value="bad" required></q-radio-group><q-dropdown name="local" value="gone" required></q-dropdown><q-dropdown name="remote" value="unloaded" external-search></q-dropdown><q-syntax-box name="display" code="not a field"></q-syntax-box>');
    form.querySelector('q-radio-group')!.options = [{ value: 'good', label: 'Good' }, { value: 'bad', label: 'Bad', disabled: true }];
    const dropdowns = form.querySelectorAll('q-dropdown');
    dropdowns[0].options = ['good'];
    dropdowns[1].options = ['paged'];
    expect(await form.getValues()).toEqual({ remote: 'unloaded' });
    expect(await submitted(form)).toBeUndefined();
    await form.setValues({ radio: 'good', local: 'good', remote: 'unloaded' });
    expect((await submitted(form))?.detail.values).toEqual({ radio: 'good', local: 'good', remote: 'unloaded' });
  });

  it('keeps repeated scalar and toggle shapes and preserves mixed-name successful entries', async () => {
    const form = await create('<input name="same" value="a"><q-input name="same" value="b"></q-input><input name="same" value="excluded" disabled><q-toggle name="flags" checked></q-toggle><q-toggle name="flags"></q-toggle><q-toggle name="flags" disabled checked></q-toggle><q-toggle name="lone"></q-toggle><q-toggle name="mixed" checked></q-toggle><input name="mixed" value="text">');
    expect(await form.getValues()).toEqual({ same: ['a', 'b'], flags: [true, false], lone: false, mixed: ['true', 'text'] });
    expect(Array.from((await submitted(form))!.detail.formData)).toEqual([['same', 'a'], ['same', 'b'], ['flags', 'true'], ['mixed', 'true'], ['mixed', 'text']]);
    await form.setValues({ same: ['x', 'y', 'z'], flags: [false, true, false], lone: 'yes' });
    expect((await form.getValues()).same).toEqual(['x', 'y']);
    expect((await form.getValues()).flags).toEqual([false, true]);
    expect(form.querySelector<HTMLInputElement>('input[disabled]')!.value).toBe('z');
    await expect(form.setValues({ same: ['short'], flags: [true, false, false] })).rejects.toThrow(TypeError);
    await expect(form.setValues({ mixed: ['x', 'y'] })).rejects.toThrow(TypeError);
  });

  it('keeps empty selection entries successful while required validation still rejects them', async () => {
    const form = await create('<q-dropdown name="custom" required></q-dropdown><select name="native" required><option value="">Choose</option></select>');
    const dropdown = form.querySelector('q-dropdown')!;
    dropdown.options = [{ value: '', label: 'Choose' }];
    await form.setValues({ custom: null, native: null });
    expect(await form.getValues()).toEqual({ custom: '', native: '' });
    expect(await dropdown.checkValidity()).toBe(false);
    expect(await submitted(form)).toBeUndefined();
    form.noValidate = true;
    expect((await submitted(form))!.detail.formData.get('custom')).toBe('');
  });

  it('preserves every file and native empty-file placeholder and supports clearing only', async () => {
    const form = await create('<input name="files" type="file" multiple><input name="empty" type="file"><input name="repeat" type="file"><input name="repeat" type="file">');
    const files = [new File(['one'], 'one.txt', { type: 'text/plain' }), new File(['two'], 'two.txt', { type: 'text/plain' })];
    const transfer = new DataTransfer();
    files.forEach(file => transfer.items.add(file));
    form.querySelector<HTMLInputElement>('input')!.files = transfer.files;
    const values = await form.getValues();
    expect((values.files as File[]).map(file => file.name)).toEqual(['one.txt', 'two.txt']);
    expect((values.files as File[])[0]).toBe(files[0]);
    expect(values.empty).toBeInstanceOf(File);
    expect((values.empty as File).name).toBe('');
    expect((values.empty as File).type).toBe('application/octet-stream');
    expect((values.repeat as File[]).map(file => file.size)).toEqual([0, 0]);
    const event = await submitted(form);
    expect(event!.detail.formData.getAll('files').map((file: File) => file.name)).toEqual(['one.txt', 'two.txt']);
    await expect(form.setValues({ files })).rejects.toThrow(TypeError);
    expect(form.querySelector<HTMLInputElement>('input')!.files!.length).toBe(2);
    await form.setValues({ files: [], empty: null, repeat: '' });
    expect(form.querySelector<HTMLInputElement>('input')!.files!.length).toBe(0);
    expect((await form.getValues()).files).toHaveLength(1);
    expect(((await form.getValues()).files as File[])[0].name).toBe('');
  });

  it('assigns radio and checkbox identities without changing option values, and preserves multiselects', async () => {
    const form = await create('<input name="radio" type="radio" value="a" checked><input name="radio" type="radio" value="b"><input name="checks" type="checkbox" value="" checked><input name="checks" type="checkbox" value="b"><input name="single" type="checkbox" value="identity"><select name="multi" multiple><option value="a">A</option><option value="b">B</option><option value="c">C</option></select>');
    await form.setValues({ radio: 'b', checks: ['', 'b'], single: true, multi: ['a', 'c'] });
    expect(await form.getValues()).toEqual({ radio: 'b', checks: ['', 'b'], single: 'identity', multi: ['a', 'c'] });
    expect(Array.from(form.querySelectorAll('input')).map(input => input.value)).toEqual(['a', 'b', '', 'b', 'identity']);
    await form.setValues({ radio: null, checks: [], single: null, multi: null });
    expect(await form.getValues()).toEqual({ checks: [], multi: [] });
  });

  it('rejects lone selection arrays atomically and maps repeated selections explicitly', async () => {
    const form = await create('<input name="kept" value="before"><q-dropdown name="drop" value="a"></q-dropdown><q-radio-group name="custom-radio" value="a"></q-radio-group><select name="native"><option value="a">A</option><option value="b">B</option></select><q-dropdown name="repeat" value="a"></q-dropdown><q-dropdown name="repeat" value="a"></q-dropdown>');
    form.querySelectorAll('q-dropdown').forEach(field => { field.options = ['a', 'b']; });
    form.querySelector('q-radio-group')!.options = ['a', 'b'];
    for (const name of ['drop', 'custom-radio', 'native']) {
      await expect(form.setValues({ kept: 'changed', [name]: ['b'] })).rejects.toThrow(TypeError);
      expect(form.querySelector('input')!.value).toBe('before');
    }
    await form.setValues({ drop: 'b', 'custom-radio': 'b', native: 'b', repeat: ['a', 'b'] });
    expect(await form.getValues()).toEqual({ kept: 'before', drop: 'b', 'custom-radio': 'b', native: 'b', repeat: ['a', 'b'] });
  });

  it('preserves the actual native radio group across unassociated wrappers', async () => {
    const first = await create('<input type="radio" name="shared" value="a" checked>');
    const second = await create('<input type="radio" name="shared" value="b">');
    const a = first.querySelector('input')!;
    const b = second.querySelector('input')!;
    expect(a.form).toBeNull();
    expect(b.form).toBeNull();
    expect(a.getRootNode()).toBe(b.getRootNode());
    await second.setValues({ shared: 'b' });
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
    expect(await first.getValues()).toEqual({});
    expect(await second.getValues()).toEqual({ shared: 'b' });
    await first.setValues({ shared: null });
    expect(b.checked).toBe(true);
    expect([a.value, b.value]).toEqual(['a', 'b']);
    await expect(first.setValues({ shared: ['a'] })).rejects.toThrow(TypeError);
  });

  it('partitions same-name radios by actual native owner and tree before assigning groups', async () => {
    const form = await create('<input type="radio" name="pick" value="a"><input type="radio" name="pick" value="b">');
    const owner = form.shadowRoot!.querySelector('form')!;
    owner.id = 'radio-owner';
    for (const value of ['a', 'b']) {
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'pick';
      input.value = value;
      input.setAttribute('form', owner.id);
      form.shadowRoot!.append(input);
    }
    await form.setValues({ pick: 'b' });
    expect(await form.getValues()).toEqual({ pick: ['b', 'b'] });
    await form.setValues({ pick: ['a', 'b'] });
    expect(await form.getValues()).toEqual({ pick: ['a', 'b'] });
    await expect(form.setValues({ pick: ['a'] })).rejects.toThrow(TypeError);
    expect(await form.getValues()).toEqual({ pick: ['a', 'b'] });
    await form.setValues({ pick: [null, 'b'] });
    expect(await form.getValues()).toEqual({ pick: ['b'] });
  });

  it('makes silent partial setters immediately coherent and rejects the entire invalid update atomically', async () => {
    const form = await create('<q-input name="email" type="email" required value="old@example.com"></q-input><q-textarea name="text" value="old"></q-textarea><q-syntax-box name="source" editable code="old"></q-syntax-box><input name="unchanged" readonly value="keep"><input name="upload" type="file">');
    const observed: string[] = [];
    ['qInput', 'qChange', 'input', 'change'].forEach(type => form.addEventListener(type, () => observed.push(type)));
    await expect(form.setValues({ email: 'changed@example.com', upload: new File(['x'], 'x.txt') })).rejects.toThrow(TypeError);
    expect(form.querySelector('q-input')!.value).toBe('old@example.com');
    await form.setValues({ email: 'bad', text: 0, source: '<raw>&literal', missing: 'ignored' });
    expect(form.querySelector('q-input')!.shadowRoot!.querySelector('input')!.value).toBe('bad');
    expect(await form.querySelector('q-input')!.checkValidity()).toBe(false);
    expect(await submitted(form)).toBeUndefined();
    await form.setValues({ email: 'new@example.com' });
    expect((await submitted(form))?.detail.values.email).toBe('new@example.com');
    expect((await form.getValues()).text).toBe('0');
    expect(form.querySelector('q-syntax-box')!.code).toBe('<raw>&literal');
    expect((await form.getValues()).unchanged).toBe('keep');
    expect(observed).toEqual([]);
  });

  it('rediscovers dynamic and reparented controls without cached ownership or unknown-shadow claims', async () => {
    const first = await create();
    const second = await create();
    const field = document.createElement('q-input');
    field.name = 'dynamic';
    field.value = 'initial';
    first.append(field);
    expect((field as unknown as Record<symbol, unknown>)[Symbol.for('webquark.form-field.v1')]).toBeUndefined();
    await first.setValues({ dynamic: 'first' });
    expect(await first.getValues()).toEqual({ dynamic: 'first' });
    second.append(field);
    expect(await first.getValues()).toEqual({});
    await second.setValues({ dynamic: 'second' });
    expect(await second.getValues()).toEqual({ dynamic: 'second' });
    field.remove();
    expect(await second.getValues()).toEqual({});
  });

  it('uses literal object keys without prototype mutation', async () => {
    const form = await create('<input name="__proto__" value="literal"><input name="constructor" value="ctor"><input name="toString" value="string">');
    const values = await form.getValues();
    expect(Object.getPrototypeOf(values)).toBe(Object.prototype);
    expect(Object.keys(values)).toEqual(['__proto__', 'constructor', 'toString']);
    expect(values.__proto__).toBe('literal');
    await form.setValues(JSON.parse('{"__proto__":"updated"}'));
    expect((await form.getValues()).__proto__).toBe('updated');
  });

  it('renders the mixed-field guide example using the built package', async () => {
    const form = await create('<q-input name="tag" label="First tag" value="alpha"></q-input><q-input name="tag" label="Second tag" value="beta"></q-input><q-toggle name="features" label="Email" checked></q-toggle><q-toggle name="features" label="SMS"></q-toggle><q-button slot="actions" type="button">Read values</q-button>');
    form.label = 'Typed form values';
    await form.setValues({ tag: ['design', 'review'], features: [true, false] });
    const output = document.createElement('pre');
    output.textContent = JSON.stringify(await form.getValues(), null, 2);
    form.after(output);
    const button = form.querySelector('q-button')!;
    await button.componentOnReady();
    button.addEventListener('qClick', async () => { output.textContent = JSON.stringify(await form.getValues(), null, 2); });
    button.shadowRoot!.querySelector('button')!.click();
    await vi.waitFor(() => expect(JSON.parse(output.textContent!)).toEqual({ tag: ['design', 'review'], features: [true, false] }));
    document.body.style.padding = '24px';
    document.body.style.maxWidth = '580px';
    await page.screenshot({ path: '.verification/q-form-typed-values.png' });
    document.body.style.padding = '';
    document.body.style.maxWidth = '';
    expect(JSON.parse(output.textContent!)).toEqual({ tag: ['design', 'review'], features: [true, false] });
  });
});
