import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFormField } from '../../../../utils/form-field-adapter';
import { userEvent } from 'vitest/browser';
// @ts-ignore - verify the fresh consumer loader and production styles.
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
// @ts-ignore
import '../../../../../../packages/browser/components/dist/webquark/webquark.css';

// The registry captures callbacks during definition, and Stencil locks them.
// A test-only subclass counts native q-input calls while invoking its exact
// production callback. Logical adapters continue to use the field instance.
const nativeResetCounts = new WeakMap<HTMLElement, number>();
const define = customElements.define.bind(customElements);
vi.spyOn(customElements, 'define').mockImplementation((name, constructor, options) => {
  const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, 'formResetCallback');
  if (name !== 'q-input' || typeof descriptor?.value !== 'function') return define(name, constructor, options);
  class CountedInput extends constructor {
    formResetCallback(...args: unknown[]) {
      const input = this as unknown as HTMLElement;
      nativeResetCounts.set(input, (nativeResetCounts.get(input) ?? 0) + 1);
      return descriptor.value.apply(this, args);
    }
  }
  define(name, CountedInput, options);
});
defineCustomElements();
beforeAll(async () => {
  await Promise.all(['q-form', 'q-button', 'q-input', 'q-textarea', 'q-dropdown', 'q-radio-group', 'q-toggle', 'q-syntax-box'].map(tag => customElements.whenDefined(tag)));
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

async function create(html = '', parent: HTMLElement = document.body) {
  const form = document.createElement('q-form');
  form.innerHTML = html;
  parent.append(form);
  await form.componentOnReady();
  return form;
}

async function buttonNative(button: HTMLQButtonElement) {
  await button.componentOnReady();
  return button.shadowRoot!.querySelector('button')!;
}

function entries(data: FormData): Array<[string, FormDataEntryValue]> {
  const result: Array<[string, FormDataEntryValue]> = [];
  data.forEach((value, name) => result.push([name,value]));
  return result;
}

async function mixed() {
  const form = await create('<input name="native" value="initial"><textarea name="native-area">initial</textarea><input type="checkbox" name="checks" value="a" checked><input type="checkbox" name="checks" value="b"><select name="select"><option value="a">A</option><option value="b" selected>B</option></select><select name="multi" multiple><option value="a" selected>A</option><option value="b">B</option></select><input name="file" type="file"><q-input name="input" required value="initial"></q-input><q-textarea name="area" required value="initial"></q-textarea><q-dropdown name="drop" value="a"></q-dropdown><q-radio-group name="radio" value="a"></q-radio-group><q-toggle name="toggle" checked></q-toggle><q-syntax-box name="source" editable code="&lt;raw&gt;\r\n&amp;literal"></q-syntax-box><button type="reset">Native reset</button><input type="reset" value="Native input reset"><q-button type="reset">Reset</q-button>');
  form.querySelector('q-dropdown')!.options = ['a','b'];
  form.querySelector('q-radio-group')!.options = ['a','b'];
  const initial = await form.getValues();
  const changed = { native:'changed', 'native-area':'changed', checks:['b'], select:'a', multi:['b'], input:'changed', area:'changed', drop:'b', radio:'b', toggle:false, source:'changed', file:null };
  return { form, initial, changed };
}

describe('built reset transactions and synchronous field state', () => {
  it.each([true, false])('waits for later trusted click cancellation=%s before resetting slotted fields', async cancel => {
    const form = await create('<input name="native" value="initial"><q-input name="field" value="initial"></q-input><button type="reset">Reset</button>');
    await form.setValues({ native: 'edited', field: 'edited' });
    const reset = vi.fn(); form.addEventListener('qReset', reset);
    if (cancel) form.addEventListener('click', event => event.preventDefault());
    await userEvent.click(form.querySelector('button')!);
    expect(await form.getValues()).toEqual({ native: cancel ? 'edited' : 'initial', field: cancel ? 'edited' : 'initial' });
    expect(reset).toHaveBeenCalledTimes(cancel ? 0 : 1);
  });
  it.each([true, false])('waits for later trusted native reset cancellation=%s before resetting logical fields', async cancel => {
    const form = await create('<q-input name="field" value="initial"></q-input>');
    const owner = form.shadowRoot!.querySelector('form')!;
    const native = document.createElement('input'); native.name = 'native'; native.defaultValue = 'initial';
    const button = document.createElement('button'); button.type = 'reset'; button.textContent = 'Reset';
    owner.append(native, button);
    await form.setValues({ native: 'edited', field: 'edited' });
    const reset = vi.fn(); form.addEventListener('qReset', reset);
    if (cancel) owner.addEventListener('reset', event => event.preventDefault());
    await userEvent.click(button);
    expect(await form.getValues()).toEqual({ native: cancel ? 'edited' : 'initial', field: cancel ? 'edited' : 'initial' });
    expect(reset).toHaveBeenCalledTimes(1);
  });
  it('restores native declared and live defaults without losing dirty values, selections or file clearing', async () => {
    const form = await create('<input name="email" value="initial@example.com"><input name="empty"><textarea name="notes">initial notes</textarea><input type="checkbox" name="check" checked><select name="choice"><option value="a">A</option><option value="b">B</option></select><input type="file" name="upload">');
    const input = form.querySelector<HTMLInputElement>('input[name="email"]')!;
    const empty = form.querySelector<HTMLInputElement>('input[name="empty"]')!;
    const notes = form.querySelector('textarea')!;
    const check = form.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    const choice = form.querySelector('select')!;
    const upload = form.querySelector<HTMLInputElement>('input[type="file"]')!;
    input.value = 'changed@example.com';
    empty.value = 'changed';
    notes.value = 'changed';
    check.checked = false;
    choice.value = 'b';
    const files = new DataTransfer();
    files.items.add(new File(['contents'], 'selected.txt'));
    upload.files = files.files;
    expect(input.getAttribute('value')).toBe('initial@example.com');

    await form.resetForm();
    // Retains the exact native-default assertion previously run in Mock DOM.
    expect(input.value).toBe('initial@example.com');
    expect(empty.value).toBe('');
    expect(notes.value).toBe('initial notes');
    expect(check.checked).toBe(true);
    expect(choice.value).toBe('a');
    expect(upload.files!.length).toBe(0);

    input.defaultValue = 'live@example.com';
    notes.defaultValue = 'live notes';
    check.defaultChecked = false;
    choice.options[1].defaultSelected = true;
    input.value = 'changed again';
    notes.value = 'changed again';
    check.checked = true;
    choice.value = 'a';
    await form.resetForm();
    expect(input.value).toBe('live@example.com');
    expect(notes.value).toBe('live notes');
    expect(check.checked).toBe(false);
    expect(choice.value).toBe('b');
  });

  it.each(['method','native button','native input','q-button'] as const)('restores live native and field-owned defaults once through %s', async action => {
    const { form, initial, changed } = await mixed();
    await form.setValues(changed);
    const resets = vi.fn();
    const changes = vi.fn();
    form.addEventListener('qReset', resets);
    ['qInput','qChange','input','change'].forEach(type => form.addEventListener(type, changes));
    const adapters = Array.from(form.querySelectorAll('q-input,q-textarea,q-dropdown,q-radio-group,q-toggle,q-syntax-box')).map(field => vi.spyOn(readFormField(field as HTMLElement)!, 'reset'));
    if (action === 'method') await form.resetForm();
    else if (action === 'native button') form.querySelector('button')!.click();
    else if (action === 'native input') form.querySelector<HTMLInputElement>('input[type="reset"]')!.click();
    else (await buttonNative(form.querySelector('q-button')!)).click();
    const values = await form.getValues();
    expect(values).toEqual(initial);
    expect(resets).toHaveBeenCalledTimes(1);
    adapters.forEach(reset => expect(reset).toHaveBeenCalledTimes(1));
    expect(changes).not.toHaveBeenCalled();
    expect(form.querySelector('q-input')!.shadowRoot!.querySelector('input')!.value).toBe('initial');
    expect(await form.checkValidity()).toBe(true);
  });

  it.each(['qReset','native capture','late native listener'] as const)('honors cancellation from %s before any reset mutation', async stage => {
    const { form, changed } = await mixed();
    await form.setValues(changed);
    const owner = form.shadowRoot!.querySelector('form')!;
    owner.id = 'reset-owner';
    const native = document.createElement('input');
    native.name = 'associated'; native.defaultValue = 'initial'; native.value = 'changed'; native.setAttribute('form', owner.id);
    form.shadowRoot!.append(native);
    const associated = document.createElement('q-input');
    associated.name = 'associated-custom';
    associated.value = 'initial';
    associated.setAttribute('form', owner.id);
    form.shadowRoot!.append(associated);
    await associated.componentOnReady();
    associated.value = 'changed';
    const before = await form.getValues();
    const reset = vi.spyOn(readFormField(form.querySelector('q-input')!)!, 'reset');
    const seen: string[] = [];
    form.addEventListener('qReset', event => {
      seen.push(form.querySelector('q-input')!.value);
      if (stage === 'qReset') event.preventDefault();
    });
    if (stage !== 'qReset') owner.addEventListener('reset', event => event.preventDefault(), { capture: stage === 'native capture' });
    await form.resetForm();
    expect(await form.getValues()).toEqual(before);
    expect(native.value).toBe('changed');
    expect(associated.value).toBe('changed');
    expect(nativeResetCounts.get(associated) ?? 0).toBe(0);
    expect(seen).toEqual(['changed']);
    expect(reset).not.toHaveBeenCalled();
  });

  it.each(['qClick','late qClick','late native click'] as const)('allows %s cancellation of q-button reset activation', async stage => {
    const form = await create('<input name="text" value="initial"><q-button type="reset">Reset</q-button>');
    await form.setValues({ text:'changed' });
    const button = form.querySelector('q-button')!;
    const resets = vi.fn(); form.addEventListener('qReset', resets);
    const listener = (event: Event) => event.preventDefault();
    if (stage === 'qClick') button.addEventListener('qClick', listener);
    else form.addEventListener(stage === 'late qClick' ? 'qClick' : 'click', listener);
    (await buttonNative(button)).click();
    expect(await form.getValues()).toEqual({ text:'changed' });
    expect(resets).not.toHaveBeenCalled();
  });

  it('bridges q-button reset in ordinary native forms and external associations without qReset or double events', async () => {
    const native = document.createElement('form'); native.id = 'outside';
    native.innerHTML = '<input name="text" value="initial"><q-input name="face" value="initial"></q-input><q-button type="reset" name="action">Reset</q-button>';
    document.body.append(native);
    const field = native.querySelector('q-input')!; await field.componentOnReady();
    const logical = vi.spyOn(readFormField(field)!, 'reset');
    const events = vi.fn(); const wrapper = vi.fn(); native.addEventListener('reset', events); native.addEventListener('qReset', wrapper);
    field.value = 'changed'; native.querySelector('input')!.value = 'changed';
    (await buttonNative(native.querySelector('q-button')!)).click();
    await vi.waitFor(() => expect(field.value).toBe('initial'));
    expect(native.querySelector('input')!.value).toBe('initial');
    expect(events).toHaveBeenCalledTimes(1); expect(wrapper).not.toHaveBeenCalled(); expect(logical).not.toHaveBeenCalled();
    expect(nativeResetCounts.get(field)).toBe(1);
    expect(entries(new FormData(native))).toEqual([['text', 'initial'], ['face', 'initial']]);
    const external = document.createElement('q-button'); external.type = 'reset'; external.setAttribute('form', native.id); document.body.append(external);
    field.value = 'changed';
    (await buttonNative(external)).click();
    await vi.waitFor(() => expect(field.value).toBe('initial'));
    expect(events).toHaveBeenCalledTimes(2);
    expect(nativeResetCounts.get(field)).toBe(2);
  });

  it('honors native-form late reset cancellation for externally associated q-button', async () => {
    const native = document.createElement('form'); native.id = 'outside'; native.innerHTML = '<input value="initial"><q-input value="initial"></q-input>'; document.body.append(native);
    const button = document.createElement('q-button'); button.type = 'reset'; button.setAttribute('form', native.id); document.body.append(button);
    native.querySelector('input')!.value = 'changed';
    const field = native.querySelector('q-input')!;
    await field.componentOnReady();
    field.value = 'changed';
    const resets = vi.fn(); native.addEventListener('reset', resets); native.addEventListener('reset', event => event.preventDefault());
    (await buttonNative(button)).click();
    await vi.waitFor(() => expect(resets).toHaveBeenCalledTimes(1));
    expect(native.querySelector('input')!.value).toBe('changed');
    expect(field.value).toBe('changed');
    expect(nativeResetCounts.get(field) ?? 0).toBe(0);
  });

  it('honors late native click cancellation and actual external ownership for native reset buttons', async () => {
    const outside = document.createElement('form');
    outside.id = 'native-reset-target';
    outside.innerHTML = '<input value="outside-default">';
    document.body.append(outside);
    const form = await create('<input name="text" value="initial"><button type="reset">Logical</button><button type="reset" form="native-reset-target">External</button>');
    await form.setValues({ text: 'changed' });
    const reset = vi.fn();
    const externalReset = vi.fn();
    form.addEventListener('qReset', reset);
    outside.addEventListener('reset', externalReset);
    const cancel = (event: Event) => event.preventDefault();
    form.addEventListener('click', cancel);
    form.querySelector('button')!.click();
    expect(await form.getValues()).toEqual({ text: 'changed' });
    expect(reset).not.toHaveBeenCalled();
    form.removeEventListener('click', cancel);
    outside.querySelector('input')!.value = 'outside-changed';
    form.querySelectorAll('button')[1].click();
    expect(outside.querySelector('input')!.value).toBe('outside-default');
    expect(externalReset).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
    expect(await form.getValues()).toEqual({ text: 'changed' });
  });

  it('ignores disabled, inherited-disabled, loading, link and unresolved reset actions', async () => {
    const form = await create('<input name="text" value="initial"><q-button type="reset" disabled>Disabled</q-button><fieldset disabled><q-button type="reset">Inherited</q-button></fieldset><q-button type="reset" loading>Loading</q-button><q-button type="reset" href="#reset-test">Link</q-button><q-button type="reset" form="missing">Missing</q-button>');
    await form.setValues({ text:'changed' });
    const resets = vi.fn(); form.addEventListener('qReset', resets);
    for (const button of Array.from(form.querySelectorAll('q-button'))) {
      await button.componentOnReady();
      const target = button.shadowRoot!.querySelector('button,a')!;
      if (button.href) button.addEventListener('click', event => event.preventDefault());
      target.dispatchEvent(new MouseEvent('click', {bubbles:true,composed:true,cancelable:true}));
    }
    expect(await form.getValues()).toEqual({ text:'changed' }); expect(resets).not.toHaveBeenCalled();
  });

  it('uses current action ownership after a late click listener changes native association', async () => {
    const first = document.createElement('form'); first.id='first'; first.innerHTML='<input value="first">';
    const second = document.createElement('form'); second.id='second'; second.innerHTML='<input value="second">';
    document.body.append(first,second);
    const button = document.createElement('q-button'); button.type='reset'; button.setAttribute('form','first'); document.body.append(button);
    first.querySelector('input')!.value='changed-first'; second.querySelector('input')!.value='changed-second';
    button.addEventListener('click', () => button.setAttribute('form','second'));
    (await buttonNative(button)).click();
    await vi.waitFor(() => expect(second.querySelector('input')!.value).toBe('second'));
    expect(first.querySelector('input')!.value).toBe('changed-first');
  });

  it('retains field-owned dynamic defaults across assignment, owner changes and reconnect, while native defaults stay live', async () => {
    const first = await create('<input name="native" value="mounted">');
    const second = await create();
    const field = document.createElement('q-input'); field.name='dynamic'; field.value='declared'; first.append(field);
    await first.setValues({ native:'changed', dynamic:'changed' });
    first.querySelector('input')!.defaultValue='live-default';
    await first.resetForm(); expect(await first.getValues()).toEqual({native:'live-default',dynamic:'declared'});
    second.append(field); await second.setValues({dynamic:'changed-again'});
    field.remove(); second.append(field);
    await second.resetForm(); expect(await second.getValues()).toEqual({dynamic:'declared'});
    expect(await first.getValues()).toEqual({native:'live-default'});
  });

  it('leaves nested and foreign native-owned fields alone and avoids manual native FACE resets', async () => {
    const outside = document.createElement('form'); outside.id='outside'; document.body.append(outside);
    const form = await create('<q-input name="own" value="initial"></q-input><q-input name="foreign" value="foreign" form="outside"></q-input><input name="foreign-native" value="foreign" form="outside"><q-form><q-input name="nested" value="nested"></q-input></q-form>');
    const nested = form.querySelector('q-form')!; await nested.componentOnReady(); await nested.setValues({nested:'changed'});
    const foreign = form.querySelector<HTMLQInputElement>('q-input[name="foreign"]')!; await foreign.componentOnReady(); foreign.value='changed';
    const owner = form.shadowRoot!.querySelector('form')!; owner.id='inner';
    const associated = document.createElement('q-input'); associated.name='associated'; associated.value='initial'; associated.setAttribute('form',owner.id); form.shadowRoot!.append(associated);
    await form.setValues({own:'changed',associated:'changed'});
    const logical = vi.spyOn(readFormField(form.querySelector<HTMLQInputElement>('q-input[name="own"]')!)!, 'reset');
    const native = vi.spyOn(readFormField(associated)!, 'reset');
    await form.resetForm();
    expect(await form.getValues()).toEqual({own:'initial',associated:'initial'});
    expect(logical).toHaveBeenCalledTimes(1); expect(native).not.toHaveBeenCalled();
    expect(nativeResetCounts.get(associated)).toBe(1);
    expect(foreign.value).toBe('changed'); expect(await nested.getValues()).toEqual({nested:'changed'});
  });

  it('rediscoveries logical ownership after a qReset listener moves a field elsewhere', async () => {
    const first=await create('<q-input name="text" value="initial"></q-input>'), second=await create();
    await first.setValues({text:'changed'}); const field=first.querySelector('q-input')!;
    first.addEventListener('qReset', () => second.append(field));
    await first.resetForm(); expect(await first.getValues()).toEqual({}); expect(await second.getValues()).toEqual({text:'changed'});
  });

  it('joins reentrant reset requests without duplicate events or callbacks', async () => {
    const form=await create('<q-input name="text" value="initial"></q-input>'); await form.setValues({text:'changed'});
    const events=vi.fn(); const reset=vi.spyOn(readFormField(form.querySelector('q-input')!)!, 'reset');
    let joined: Promise<void> | undefined;
    form.addEventListener('qReset', () => { events(); joined=form.resetForm(); });
    await Promise.all([form.resetForm(),form.resetForm()]); await joined;
    expect(events).toHaveBeenCalledTimes(1); expect(reset).toHaveBeenCalledTimes(1); expect(await form.getValues()).toEqual({text:'initial'});
  });

  it('synchronizes inherited disabling, first-legend exceptions and re-enable without rewriting explicit props', async () => {
    const form=await create('<fieldset><legend><q-input name="legend" value="yes"></q-input><q-button type="reset">Legend</q-button></legend><q-input name="input" value="yes"></q-input><q-textarea name="area" value="yes"></q-textarea><q-dropdown name="drop" value="a"></q-dropdown><q-radio-group name="radio" value="a"></q-radio-group><q-toggle name="toggle" checked></q-toggle><q-syntax-box name="source" editable code="yes"></q-syntax-box><q-input name="explicit" disabled value="yes"></q-input><q-button type="reset">Body</q-button><legend><q-input name="second" value="yes"></q-input></legend></fieldset>');
    form.querySelector('q-dropdown')!.options=['a']; form.querySelector('q-radio-group')!.options=['a']; await form.getValues();
    const fieldset=form.querySelector('fieldset')!; fieldset.disabled=true;
    expect(await form.getValues()).toEqual({legend:'yes'});
    for (const tag of ['q-input','q-textarea','q-dropdown','q-radio-group','q-syntax-box']) {
      const field=form.querySelector<HTMLElement>(`${tag}:not([name="legend"]):not([name="explicit"]):not([name="second"])`)!;
      expect((field.shadowRoot!.querySelector('input,textarea,button,fieldset') as HTMLInputElement).disabled).toBe(true);
      expect((field as HTMLQInputElement).disabled).toBe(false);
    }
    const toggle=form.querySelector('q-toggle')!;
    expect(toggle.shadowRoot!.querySelector('[role]')!.getAttribute('aria-disabled')).toBe('true');
    await toggle.toggle(); expect(toggle.checked).toBe(true);
    const buttons=form.querySelectorAll('q-button');
    expect((await buttonNative(buttons[0])).disabled).toBe(false); expect((await buttonNative(buttons[1])).disabled).toBe(true);
    fieldset.disabled=false;
    expect((await form.getValues()).input).toBe('yes'); expect((await form.getValues()).explicit).toBeUndefined();
    expect(form.querySelector<HTMLQInputElement>('q-input[name="explicit"]')!.disabled).toBe(true);
    const field=form.querySelector<HTMLQInputElement>('q-input[name="input"]')!;
    field.disabled=true; expect(await field.checkValidity()).toBe(true); field.disabled=false;
    expect(field.shadowRoot!.querySelector('input')!.disabled).toBe(false);
    fieldset.disabled=true; fieldset.querySelector('legend')!.append(field);
    expect((await form.getValues()).input).toBe('yes'); expect(field.disabled).toBe(false);
  });

  it('reconciles direct controlled properties immediately for native FormData and native validity', async () => {
    const native=document.createElement('form'); native.innerHTML='<q-input name="input" required value="initial"></q-input><q-textarea name="area" required value="initial"></q-textarea><q-dropdown name="drop" required value="a"></q-dropdown><q-radio-group name="radio" required value="a"></q-radio-group><q-toggle name="toggle" required checked></q-toggle><q-syntax-box name="source" editable required code="initial"></q-syntax-box>'; document.body.append(native);
    const input=native.querySelector('q-input')!, area=native.querySelector('q-textarea')!, drop=native.querySelector('q-dropdown')!, radio=native.querySelector('q-radio-group')!, toggle=native.querySelector('q-toggle')!, editor=native.querySelector('q-syntax-box')!;
    drop.options=['a','b']; radio.options=['a','b'];
    await Promise.all(Array.from(native.children).map(field => (field as HTMLQInputElement).componentOnReady()));
    input.name='renamed'; input.value='after'; area.value='after'; drop.value='b'; radio.value='b'; toggle.checked=false; editor.value='<raw>\r\n&after';
    expect(entries(new FormData(native))).toEqual([['renamed','after'],['area','after'],['drop','b'],['radio','b'],['source','<raw>\r\n&after']]);
    expect(native.checkValidity()).toBe(false); toggle.checked=true; expect(native.checkValidity()).toBe(true);
    input.value=''; expect(native.checkValidity()).toBe(false); input.value='after';
    area.value=''; expect(native.checkValidity()).toBe(false); area.value='after';
    editor.code=''; expect(native.checkValidity()).toBe(false); editor.code='after'; expect(native.checkValidity()).toBe(true);
    input.disabled=true; expect(new FormData(native).has('renamed')).toBe(false); input.disabled=false; expect(new FormData(native).get('renamed')).toBe('after');
    expect(input.shadowRoot!.querySelector('input')!.value).toBe('after'); expect(area.shadowRoot!.querySelector('textarea')!.value).toBe('after');
  });

  it('blocks a stale clear action immediately when its fieldset becomes disabled', async () => {
    const form = await create('<fieldset><q-input name="text" value="initial" clearable></q-input></fieldset>');
    await form.getValues();
    const field = form.querySelector('q-input')!;
    const clear = field.shadowRoot!.querySelector<HTMLButtonElement>('.clear-btn')!;
    expect(clear).not.toBeNull();
    const change = vi.fn();
    field.addEventListener('qChange', change);
    form.querySelector('fieldset')!.disabled = true;
    clear.click();
    expect(field.value).toBe('initial');
    expect(change).not.toHaveBeenCalled();
  });

  it('blocks an open dropdown selection immediately when disabling its ancestor fieldset', async () => {
    const form = await create('<fieldset><q-dropdown name="choice" value="a"></q-dropdown></fieldset>');
    const field = form.querySelector('q-dropdown')!;
    field.options = ['a', 'b'];
    await form.getValues();
    field.shadowRoot!.querySelector('button')!.click();
    await vi.waitFor(() => expect(field.shadowRoot!.querySelectorAll('[role="option"]')).toHaveLength(2));
    const option = field.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')[1];
    const change = vi.fn();
    field.addEventListener('qChange', change);
    form.querySelector('fieldset')!.disabled = true;
    option.click();
    expect(field.value).toBe('a');
    expect(change).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(field.shadowRoot!.querySelector('[role="listbox"]')).toBeNull());
  });

  it('immediately updates inherited and explicit disabling on button anchors and retains explicit state', async () => {
    const fieldset = document.createElement('fieldset');
    fieldset.innerHTML = '<q-button href="#local">Link</q-button>';
    document.body.append(fieldset);
    const button = fieldset.querySelector('q-button')!;
    await button.componentOnReady();
    const anchor = button.shadowRoot!.querySelector('a')!;
    fieldset.disabled = true;
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.tabIndex).toBe(-1);
    expect(button.disabled).toBe(false);
    button.disabled = true;
    fieldset.disabled = false;
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(button.disabled).toBe(true);
    button.disabled = false;
    expect(anchor.getAttribute('aria-disabled')).toBe('false');
    expect(anchor.hasAttribute('tabindex')).toBe(false);
  });

  it('keeps readonly native and custom text fields successful and assignable without disabled behavior', async () => {
    const form=await create('<input name="native" required readonly><q-input name="custom" required readonly></q-input>');
    expect(await form.checkValidity()).toBe(true); expect(await form.getValues()).toEqual({native:'',custom:''});
    const native=form.querySelector('input')!; const input=form.querySelector('q-input')!.shadowRoot!.querySelector('input')!;
    expect(native.readOnly).toBe(true); expect(input.readOnly).toBe(true); expect(input.disabled).toBe(false);
    await form.setValues({native:'assigned',custom:'assigned'}); expect(await form.getValues()).toEqual({native:'assigned',custom:'assigned'});
  });

  it('makes field/form check/report and submission immediately coherent after direct constraint writes', async () => {
    const form=await create('<q-input name="email" value="before"></q-input><q-textarea name="area" value="before"></q-textarea>'); await form.getValues();
    const input=form.querySelector('q-input')!; input.type='email'; input.required=true; input.value='invalid';
    const area=form.querySelector('q-textarea')!; area.required=true; area.value='';
    expect(await form.checkValidity()).toBe(false); expect(await input.checkValidity()).toBe(false); expect(await area.checkValidity()).toBe(false);
    input.value='after@example.com'; area.value='after'; expect(await form.reportValidity()).toBe(true);
    const submit=vi.fn(); form.addEventListener('qSubmit',submit); await form.submitForm();
    expect(submit).toHaveBeenCalledTimes(1); expect(submit.mock.calls[0][0].detail.values).toEqual({email:'after@example.com',area:'after'});
  });

  it('keeps React controlled-prop writes coherent through the generated wrappers', async () => {
    // @ts-ignore - test-only aliases use installed React package peers.
    const React=await import('react');
    // @ts-ignore
    const {createRoot}=await import('react-dom/client');
    // @ts-ignore
    const {flushSync}=await import('react-dom');
    // @ts-ignore - wrappers are generated after the core build in packages:build.
    const {QForm,QInput}=await import('@webquark/react');
    const container=document.createElement('div'); document.body.append(container); const root=createRoot(container);
    let write!: (value:string)=>void;
    function Harness() { const [value,setValue]=React.useState('initial'); write=setValue; return React.createElement(QForm,{},React.createElement(QInput,{name:'react',required:true,value})); }
    flushSync(() => root.render(React.createElement(Harness)));
    const form=container.querySelector('q-form')!; await form.componentOnReady(); expect(await form.getValues()).toEqual({react:'initial'});
    flushSync(() => write('')); expect(await form.checkValidity()).toBe(false);
    flushSync(() => write('updated')); expect(await form.checkValidity()).toBe(true); expect(await form.getValues()).toEqual({react:'updated'});
    flushSync(() => root.unmount());
  });
});
