import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { QFormSubmitDetail } from '../form.types';
import { formFieldProtocol, readFormField, registerFormField } from '../../../../utils/form-field-adapter';
// @ts-ignore - cold production output is generated before this consumer test runs.
import { defineCustomElements } from '../../../../../dist/loader';
// @ts-ignore
import '../../../../../dist/webquark/webquark.css';
defineCustomElements();
beforeAll(async () => { await Promise.all(['q-form','q-button','q-input','q-textarea','q-dropdown','q-syntax-box'].map(tag => customElements.whenDefined(tag))); });
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
async function create(html = '', parent: HTMLElement = document.body) {
  const form = document.createElement('q-form'); form.innerHTML = html; parent.append(form); await form.componentOnReady();
  await Promise.all(Array.from(form.querySelectorAll<any>('*')).map(control => control.componentOnReady?.()));
  return form;
}
async function click(button: HTMLQButtonElement) { await button.componentOnReady(); button.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click(); await new Promise(resolve => setTimeout(resolve,0)); }
function entries(data: FormData) { const pairs: [string, FormDataEntryValue][] = []; data.forEach((v,k) => pairs.push([k,v])); return pairs; }
async function submitted(form: HTMLQFormElement, action: () => void | Promise<void>) {
  const captured = vi.fn(); form.addEventListener('qSubmit', captured); await action();
  await vi.waitFor(() => expect(captured).toHaveBeenCalledTimes(1));
  return captured.mock.calls[0][0].detail as QFormSubmitDetail;
}
describe('guarded submission and action ownership', () => {
  it('uses live formNoValidate=false before its reflected attribute updates', async () => {
    const form = await create('<q-input name="field" required></q-input><q-button type="submit" formnovalidate>Send</q-button>');
    const button = form.querySelector('q-button')!;
    const received = vi.fn(); form.addEventListener('qSubmit', received);
    await new Promise<void>(resolve => requestAnimationFrame(() => {
      button.formNoValidate = false;
      expect(button.hasAttribute('formnovalidate')).toBe(true);
      button.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
      resolve();
    }));
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(received).not.toHaveBeenCalled();
    expect(await form.checkValidity()).toBe(false);
  });
  it('synchronously cancels a native submit before readiness even with preventDefault=false', async () => {
    const form = await create('<q-input name="name" value="Ada"></q-input>'); form.preventDefault = false;
    const native = form.shadowRoot!.querySelector('form')!;
    const deliver = vi.spyOn(HTMLFormElement.prototype,'submit').mockImplementation(() => {});
    const event = new Event('submit',{bubbles:true,cancelable:true}); native.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true); expect(deliver).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(deliver).toHaveBeenCalledTimes(1));
  });
  it('emits one cancelable event, keeps default event-only behavior, and snapshots submitter entries in order', async () => {
    const form = await create('<input name="repeat" value="first"><q-button type="submit" name="repeat" value="button">Send</q-button><q-input name="repeat" value="last"></q-input><q-button type="submit" name="other" value="excluded">Other</q-button>');
    const button = form.querySelector('q-button')!;
    const deliver = vi.spyOn(HTMLFormElement.prototype,'submit').mockImplementation(() => {});
    const detail = await submitted(form, () => click(button));
    expect(detail.submitter).toBe(button); expect(detail.values.repeat).toEqual(['first','button','last']);
    expect(entries(detail.formData)).toEqual([['repeat','first'],['repeat','button'],['repeat','last']]); expect(detail.values.other).toBeUndefined(); expect(deliver).not.toHaveBeenCalled();
    expect(detail.originalEvent.defaultPrevented).toBe(true);
  });
  it.each(['qClick','click'] as const)('respects late %s cancellation before entering the transaction', async eventName => {
    const form = await create('<q-button type="submit">Send</q-button>'); const received = vi.fn(); form.addEventListener('qSubmit',received);
    form.addEventListener(eventName,event => event.preventDefault()); await click(form.querySelector('q-button')!);
    await new Promise(resolve => setTimeout(resolve,30)); expect(received).not.toHaveBeenCalled();
  });
  it('respects cancellation before the native submit handler and qSubmit cancellation', async () => {
    const form = await create('<input name="a" value="1">'); form.preventDefault=false;
    const deliver = vi.spyOn(HTMLFormElement.prototype,'submit').mockImplementation(() => {}); const received=vi.fn(); form.addEventListener('qSubmit',received);
    const native=form.shadowRoot!.querySelector('form')!; const cancel=(ev:Event)=>ev.preventDefault(); form.shadowRoot!.addEventListener('submit',cancel,true);
    native.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); await Promise.resolve(); expect(received).not.toHaveBeenCalled();
    form.shadowRoot!.removeEventListener('submit',cancel,true); form.addEventListener('qSubmit',cancel); await form.submitForm(); expect(received).toHaveBeenCalledTimes(1); expect(deliver).not.toHaveBeenCalled();
  });
  it('validates once, ignores busy/reentrant requests, and releases the guard after cancellation', async () => {
    const form=await create('<q-input name="a" value="ready" required></q-input>'); const field=readFormField(form.querySelector('q-input')!)!;
    const report=vi.spyOn(field,'validate'); const received=vi.fn((ev:CustomEvent<QFormSubmitDetail>)=>{ev.preventDefault(); void form.submitForm();}); form.addEventListener('qSubmit',received as EventListener);
    await Promise.all([form.submitForm(),form.submitForm(),form.submitForm()]); expect(received).toHaveBeenCalledTimes(1); expect(report).toHaveBeenCalledTimes(1);
    await form.submitForm(); expect(received).toHaveBeenCalledTimes(2);
  });
  it('revalidates after readiness and stops delivery when the host is detached/reinserted or the submitter moves', async () => {
    const form=await create('<q-button type="submit" name="send" value="1">Send</q-button>'); form.preventDefault=false; const deliver=vi.spyOn(HTMLFormElement.prototype,'submit').mockImplementation(()=>{}); const received=vi.fn();form.addEventListener('qSubmit',received);
    form.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); form.remove(); document.body.append(form); await new Promise(resolve=>setTimeout(resolve,30)); expect(received).not.toHaveBeenCalled();expect(deliver).not.toHaveBeenCalled();
    const button=form.querySelector('q-button')!; await button.componentOnReady(); button.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    queueMicrotask(()=>document.body.append(button)); await new Promise(resolve=>setTimeout(resolve,30)); expect(received).not.toHaveBeenCalled();
    await form.submitForm(); expect(received).toHaveBeenCalledTimes(1); expect(deliver).toHaveBeenCalledTimes(1);
  });
  it('uses live disabled/required/value state after request and preserves literal reserved field names', async () => {
    const form=await create('<q-input name="__proto__" value="old" required></q-input><input name="constructor" value="constructor"><input name="submit" value="submit"><input name="requestSubmit" value="requestSubmit"><input name="elements" value="elements">');
    const input=form.querySelector('q-input')!; let pending=form.submitForm(); input.value=''; await pending; const receive=vi.fn();form.addEventListener('qSubmit',receive);expect(receive).not.toHaveBeenCalled();
    pending=form.submitForm();input.disabled=true;await pending;expect(receive).toHaveBeenCalledTimes(1); expect(receive.mock.calls[0][0].detail.values.__proto__).toBe(Object.prototype);
    input.disabled=false;input.value='new'; const detail=await submitted(form,()=>form.submitForm());expect(Object.hasOwn(detail.values,'__proto__')).toBe(true);expect(detail.values.__proto__).toBe('new');expect(detail.values.constructor).toBe('constructor');
  });
  it('formnovalidate skips validation only and honors explicit/inherited native form ownership', async () => {
    const outer=document.createElement('form');outer.id='native-owner';document.body.append(outer);
    const form=await create('<q-input name="needed" required></q-input><q-button type="submit" name="save" value="draft" formnovalidate>Draft</q-button><q-button type="submit" form="missing">Unresolved</q-button>');
    const buttons=form.querySelectorAll('q-button');const detail=await submitted(form,()=>click(buttons[0])); expect(detail.values).toEqual({needed:'',save:'draft'});
    const receive=vi.fn();form.addEventListener('qSubmit',receive);await click(buttons[1]);await new Promise(resolve=>setTimeout(resolve,20));expect(receive).not.toHaveBeenCalled();
    buttons[1].form='native-owner'; const native=vi.fn((ev:SubmitEvent)=>{ev.preventDefault();expect(ev.submitter?.tagName).toBe('BUTTON');});outer.addEventListener('submit',native as EventListener);await click(buttons[1]);expect(native).toHaveBeenCalledTimes(1);expect(outer.querySelector('button')).toBeNull();expect(receive).not.toHaveBeenCalled();
    const nested=await create('<q-button type="submit">Inherited</q-button>',outer);await click(nested.querySelector('q-button')!);expect(native).toHaveBeenCalledTimes(2);
  });
  it('native submit controls under layout wrappers and image controls contribute only their own entries', async () => {
    const form=await create('<q-grid><button type="submit" name="button" value="native">Native</button><input type="image" name="image"><input type="submit" name="input" value="input"></q-grid>');
    const button=form.querySelector('button')!;expect((await submitted(form,()=>button.click())).values).toEqual({button:'native'});
    const image=form.querySelector<HTMLInputElement>('input[type="image"]')!;expect((await submitted(form,()=>image.click())).values).toEqual({'image.x':'0','image.y':'0'});
    expect((await submitted(form,()=>form.querySelector<HTMLInputElement>('input[type="submit"]')!.click())).values).toEqual({input:'input'});
  });
  it('does not cancel or collect a native form nested in its light DOM',async()=>{
    const form=await create('<form id="nested-native"><input name="native" value="1"><q-button type="submit" name="send" value="native">Send</q-button></form>');
    const native=form.querySelector('form')!;let canceledBeforeConsumer=true;const nativeSubmit=vi.fn((ev:SubmitEvent)=>{canceledBeforeConsumer=ev.defaultPrevented;ev.preventDefault();});native.addEventListener('submit',nativeSubmit as EventListener);const received=vi.fn();form.addEventListener('qSubmit',received);
    await click(form.querySelector('q-button')!);expect(nativeSubmit).toHaveBeenCalledTimes(1);expect(canceledBeforeConsumer).toBe(false);expect(received).not.toHaveBeenCalled();expect(await form.getValues()).toEqual({});
  });
  it('waits for adapters, uses current constraints/overrides, and cancels disconnected waits without timeout leaks',async()=>{
    const form=await create('<q-input name="a" value="old" required></q-input><q-button type="submit" name="send" value="old">Send</q-button>');const input=form.querySelector('q-input')!,button=form.querySelector('q-button')!;const field=readFormField(input)!;const connection=(input as any)[formFieldProtocol];
    connection.field=undefined;const received=vi.fn();form.addEventListener('qSubmit',received);await click(button);await vi.waitFor(()=>expect(connection.waiting.size).toBe(1));expect(received).not.toHaveBeenCalled();input.value='';button.formNoValidate=true;button.value='live';registerFormField(input,field);await vi.waitFor(()=>expect(received).toHaveBeenCalledTimes(1));expect(received.mock.calls[0][0].detail.values).toEqual({a:'',send:'live'});expect(connection.waiting.size).toBe(0);
    connection.field=undefined;form.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await vi.waitFor(()=>expect(connection.waiting.size).toBe(1));form.remove();await vi.waitFor(()=>expect(connection.waiting.size).toBe(0));expect(received).toHaveBeenCalledTimes(1);registerFormField(input,field);
  });
  it('preserves generated React event/submitter props through current value writes and cancellation',async()=>{
    // @ts-ignore - installed React peer aliases are verification-fixture only.
    const React=await import('react');
    // @ts-ignore
    const {createRoot}=await import('react-dom/client');
    // @ts-ignore
    const {flushSync}=await import('react-dom');
    // @ts-ignore - generated consumer wrappers.
    const {QForm,QInput,QButton}=await import('@webquark/react');
    const container=document.createElement('div');document.body.append(container);const root=createRoot(container);const receive=vi.fn((ev:CustomEvent<QFormSubmitDetail>)=>ev.preventDefault());let write!:(value:string)=>void;
    function Harness(){const [value,setValue]=React.useState('initial');write=setValue;return React.createElement(QForm,{preventDefault:false,onQSubmit:receive},React.createElement(QInput,{name:'react',required:true,value}),React.createElement(QButton,{type:'submit',name:'send',value:'react-button'},'Send'));}
    flushSync(()=>root.render(React.createElement(Harness)));const form=container.querySelector('q-form')!;await form.componentOnReady();await form.getValues();flushSync(()=>write('current'));const deliver=vi.spyOn(HTMLFormElement.prototype,'submit').mockImplementation(()=>{});await click(form.querySelector('q-button')!);await vi.waitFor(()=>expect(receive).toHaveBeenCalledTimes(1));expect(receive.mock.calls[0][0].detail.values).toEqual({react:'current',send:'react-button'});expect(receive.mock.calls[0][0].detail.submitter).toBe(form.querySelector('q-button'));expect(deliver).not.toHaveBeenCalled();flushSync(()=>root.unmount());
  });
  it('restores delivery attributes and removes the bridge even when native delivery throws', async () => {
    const form=await create('<input name="a" value="1">');form.preventDefault=false;form.action='/original';form.target='_self';await new Promise(requestAnimationFrame);
    const native=form.shadowRoot!.querySelector('form')!;const before=Array.from(native.attributes).map(a=>[a.name,a.value]);const error=new Error('delivery failed');const diagnostic=vi.spyOn(console,'error').mockImplementation(()=>{});const deliver=vi.spyOn(HTMLFormElement.prototype,'submit').mockImplementation(()=>{throw error;});
    await expect(form.submitForm()).rejects.toBe(error);expect(Array.from(native.attributes).map(a=>[a.name,a.value])).toEqual(before);expect(entries(new FormData(native))).toEqual([]);expect(diagnostic).toHaveBeenCalledWith(error);
    deliver.mockImplementation(()=>{});await form.submitForm();expect(deliver).toHaveBeenCalledTimes(2);
  });
  it('canceled throwing listeners cannot leak the transaction guard or trigger delivery',async()=>{
    // Isolate native listener exceptions in a same-origin realm, avoiding the
    // test runner's global unhandled-error capture while using real DOM dispatch.
    const frame=document.createElement('iframe');document.body.append(frame);const view=frame.contentWindow!;const errors:Error[]=[];
    view.addEventListener('error',ev=>{errors.push(ev.error);ev.preventDefault();});
    const form=await create('<input name="a" value="1">');form.preventDefault=false;const deliver=vi.spyOn(HTMLFormElement.prototype,'submit').mockImplementation(()=>{});
    const listener=(view as any).Function('event','event.preventDefault(); throw new Error("consumer failed");');
    // The callback realm alone does not choose DOM's exception-reporting realm;
    // dispatch the form itself in that document after its production upgrade.
    frame.contentDocument!.body.append(form);
    const native=form.shadowRoot!.querySelector('form')!;
    const nativeDeliver=vi.spyOn((view as any).HTMLFormElement.prototype,'submit').mockImplementation(()=>{});
    form.addEventListener('qSubmit',listener);await form.submitForm();expect(errors).toHaveLength(1);expect(nativeDeliver).not.toHaveBeenCalled();expect(deliver).not.toHaveBeenCalled();
    form.removeEventListener('qSubmit',listener);await form.submitForm();expect(nativeDeliver).toHaveBeenCalledTimes(1);expect(native.getAttribute('method')).toBe('post');
  });
  it('logical native radio reset matches native grouping and defaultChecked tree ordering',async()=>{
    const form=await create('<input type="radio" name="logical-radio" value="first" checked><input type="radio" name="logical-radio" value="last" checked>');
    const native=document.createElement('form');native.innerHTML='<input type="radio" name="native-radio" value="first" checked><input type="radio" name="native-radio" value="last" checked>';document.body.append(native);
    const logical=Array.from(form.querySelectorAll<HTMLInputElement>('input')),owned=Array.from(native.querySelectorAll<HTMLInputElement>('input'));
    logical[0].checked=true;owned[0].checked=true;await form.resetForm();native.reset();expect(logical.map(input=>input.checked)).toEqual(owned.map(input=>input.checked));expect(logical.map(input=>input.checked)).toEqual([false,true]);
    // Unassociated radios share their native tree/name group across wrappers.
    const other=await create('<input type="radio" name="logical-radio" value="other" checked>');await form.resetForm();expect(other.querySelector<HTMLInputElement>('input')!.checked).toBe(false);expect(logical[1].checked).toBe(true);
  });
  it('preserves reset cancellation in the shadow path without adding an earlier reset bridge',async()=>{
    const form=await create('<q-input name="a" value="initial"></q-input><button type="reset">Reset</button>');form.querySelector('q-input')!.value='dirty';const reset=vi.fn();form.addEventListener('qReset',reset);form.shadowRoot!.addEventListener('click',ev=>ev.preventDefault());
    await userEvent.click(form.querySelector('button')!);expect(await form.getValues()).toEqual({a:'dirty'});expect(reset).not.toHaveBeenCalled();
  });
});

describe('originating Enter and native dialog submission',()=>{
  it('submits from wrapped named and unnamed single-line fields with the first owned action',async()=>{
    const form=await create('<q-grid><q-input value="ready"></q-input><input name="second" value="2"></q-grid><q-button type="submit" name="action" value="first">First</q-button><button type="submit" name="action" value="second">Second</button>');
    const field=form.querySelector('q-input')!;await field.focusElement();const detail=await submitted(form,()=>userEvent.keyboard('{Enter}'));expect(detail.values).toEqual({second:'2',action:'first'});expect(detail.submitter).toBe(form.querySelector('q-button'));
  });
  it('a disabled default action blocks Enter and no action still submits multiple text fields once',async()=>{
    const form=await create('<input name="a" value="1"><input name="b" value="2"><q-button type="submit" disabled>First</q-button><button type="submit">Second</button>');const receive=vi.fn();form.addEventListener('qSubmit',receive);const input=form.querySelector('input')!;input.focus();await userEvent.keyboard('{Enter}');expect(receive).not.toHaveBeenCalled();
    form.querySelectorAll('q-button,button').forEach(b=>b.remove());await userEvent.keyboard('{Enter}');await vi.waitFor(()=>expect(receive).toHaveBeenCalledTimes(1));expect(receive.mock.calls[0][0].detail.submitter).toBeNull();
  });
  it.each([{isComposing:true},{keyCode:229},{ctrlKey:true},{altKey:true},{metaKey:true}])('leaves IME/modifier Enter untouched: %j',async options=>{
    const form=await create('<q-grid><input name="a" value="1"></q-grid>');const receive=vi.fn();form.addEventListener('qSubmit',receive);const ev=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,composed:true,cancelable:true,...options});form.querySelector('input')!.dispatchEvent(ev);expect(ev.defaultPrevented).toBe(false);await Promise.resolve();expect(receive).not.toHaveBeenCalled();
  });
  it('leaves canceled Enter, multiline/editor/popup and button/link keys untouched',async()=>{
    const form=await create('<input name="a"><textarea name="area"></textarea><q-textarea name="qa"></q-textarea><q-syntax-box name="editor" editable></q-syntax-box><q-dropdown name="drop" searchable></q-dropdown><div contenteditable="true">Text</div><a href="#safe">Link</a><button type="button">Button</button>');form.enterBehavior='none';
    for(const target of [form.querySelector('textarea')!,form.querySelector('q-textarea')!.shadowRoot!.querySelector('textarea')!,form.querySelector('q-syntax-box')!.shadowRoot!.querySelector('textarea')!,form.querySelector('[contenteditable]')!,form.querySelector('a')!,form.querySelector('button')!]){const ev=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,composed:true,cancelable:true});target.dispatchEvent(ev);expect(ev.defaultPrevented).toBe(false);}
    const input=form.querySelector('input')!;input.addEventListener('keydown',ev=>ev.preventDefault(),{once:true});const ev=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,composed:true,cancelable:true});input.dispatchEvent(ev);expect(ev.defaultPrevented).toBe(true);
  });
  it('never borrows an unrelated active field for popup or unowned Enter',async()=>{
    const form=await create('<input name="a"><q-dropdown name="choice" searchable></q-dropdown><q-input name="foreign" form="missing"></q-input>');form.enterBehavior='none';form.querySelector('input')!.focus();
    const dropdown=form.querySelector('q-dropdown')!;dropdown.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();await new Promise(requestAnimationFrame);form.querySelector('input')!.focus();const search=dropdown.shadowRoot!.querySelector('input');expect(search).not.toBeNull();
    for(const target of [search!,form.querySelector('q-input')!.shadowRoot!.querySelector('input')!,form]){const ev=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,composed:true,cancelable:true});target.dispatchEvent(ev);expect(ev.defaultPrevented).toBe(false);}
  });
  it('focus-next includes unnamed controls, skips invisible/inherited-disabled controls and reverses Shift+Enter',async()=>{
    const form=await create('<q-grid><input id="first"><div hidden><input id="hidden"></div><fieldset disabled><input id="disabled"></fieldset><input id="last" readonly></q-grid>');form.enterBehavior='focus-next';const first=form.querySelector<HTMLInputElement>('#first')!,last=form.querySelector<HTMLInputElement>('#last')!;first.focus();await userEvent.keyboard('{Enter}');expect(document.activeElement).toBe(last);expect(last.readOnly).toBe(true);
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}');expect(document.activeElement).toBe(first);last.focus();await submitted(form,()=>userEvent.keyboard('{Enter}'));
  });
  it('valid dialog submission closes the actual native dialog once with the submitter value',async()=>{
    const dialog=document.createElement('dialog');document.body.append(dialog);const form=await create('<q-input name="a" value="ready" required></q-input><q-button type="submit" name="result" value="approved" formmethod="dialog">Approve</q-button>',dialog);form.preventDefault=false;dialog.showModal();const close=vi.spyOn(HTMLDialogElement.prototype,'close');const deliver=vi.spyOn(HTMLFormElement.prototype,'submit');await submitted(form,()=>click(form.querySelector('q-button')!));await vi.waitFor(()=>expect(dialog.open).toBe(false));expect(dialog.returnValue).toBe('approved');expect(close).toHaveBeenCalledTimes(1);expect(deliver).not.toHaveBeenCalled();
  });
  it('invalid or canceled dialog submissions remain open and do not deliver',async()=>{
    const dialog=document.createElement('dialog');document.body.append(dialog);const form=await create('<q-input name="a" required></q-input>',dialog);form.preventDefault=false;form.method='dialog';dialog.showModal();await form.submitForm();expect(dialog.open).toBe(true);form.querySelector('q-input')!.value='ready';form.addEventListener('qSubmit',ev=>ev.preventDefault());await form.submitForm();expect(dialog.open).toBe(true);
  });
  it('rejects dialog delivery outside native dialog but allows event-only mode',async()=>{
    const overlay=document.createElement('div');overlay.setAttribute('role','dialog');document.body.append(overlay);const form=await create('<input name="a" value="1">',overlay);form.method='dialog';await form.submitForm();form.preventDefault=false;vi.spyOn(console,'error').mockImplementation(()=>{});await expect(form.submitForm()).rejects.toMatchObject({name:'NotSupportedError'});
  });
});
