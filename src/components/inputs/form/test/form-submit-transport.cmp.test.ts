import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { commands, userEvent } from 'vitest/browser';
import type { QFormSubmitDetail } from '../form.types';
// @ts-ignore - test the fresh consumer output.
import { defineCustomElements } from '../../../../../dist/loader';
// @ts-ignore
import '../../../../../dist/webquark/webquark.css';
defineCustomElements();
interface ProbeRequest { url: string; method: string; headers: Record<string,string>; body: string; bodyBase64: string }
const probe = commands as typeof commands & { startFormSubmitProbe(origin:string):Promise<void>; readFormSubmitProbe():Promise<ProbeRequest[]>; stopFormSubmitProbe():Promise<void> };
let target: string;
beforeAll(async()=>{await Promise.all(['q-form','q-button','q-input','q-toggle'].map(tag=>customElements.whenDefined(tag)));});
beforeEach(async()=>{
  await probe.startFormSubmitProbe(location.origin);
  const frame=document.createElement('iframe');target=`submit-target-${crypto.randomUUID()}`;frame.name=target;document.body.append(frame);
});
afterEach(async()=>{await probe.stopFormSubmitProbe();document.body.replaceChildren();vi.restoreAllMocks();});
async function create(html='', method:'get'|'post'|'dialog'='post'){
  const form=document.createElement('q-form');form.innerHTML=html;form.preventDefault=false;form.method=method;form.action='/__webquark_submit_probe__/default';
  // The q-form target type retains its existing public union; the native form supports named contexts.
  (form as HTMLElement & {target:string}).target=target;
  document.body.append(form);await form.componentOnReady();await Promise.all(Array.from(form.querySelectorAll<any>('*')).map(el=>el.componentOnReady?.()));return form;
}
async function nativeButton(button:HTMLQButtonElement){await button.componentOnReady();return button.shadowRoot!.querySelector<HTMLButtonElement>('button')!;}
async function requests(count:number){let found:ProbeRequest[]=[];await vi.waitFor(async()=>{found=await probe.readFormSubmitProbe();expect(found).toHaveLength(count);});return found;}
async function noRequests(){await new Promise(resolve=>setTimeout(resolve,150));expect(await probe.readFormSubmitProbe()).toEqual([]);}
function pairs(params:URLSearchParams){const result:[string,string][]=[];params.forEach((value,name)=>result.push([name,value]));return result;}
function file(input:HTMLInputElement){const files=new DataTransfer();files.items.add(new File([new Uint8Array([0,1,65,255,10])],'evidence.bin',{type:'application/octet-stream'}));input.files=files.files;}

describe('actual intercepted native transport',()=>{
  it.each(['preventDefault','returnValue'] as const)('later native submit %s cancellation suppresses the guarded transaction',async method=>{
    const form=await create('<q-input name="a" value="ready"></q-input>');const native=form.shadowRoot!.querySelector('form')!;const button=document.createElement('button');button.type='submit';button.textContent='Native submit';native.append(button);
    const receive=vi.fn();form.addEventListener('qSubmit',receive);let original!:SubmitEvent;const late=vi.fn((ev:SubmitEvent)=>{original=ev;expect(ev.defaultPrevented).toBe(true);if(method==='preventDefault')ev.preventDefault();else ev.returnValue=false;});
    // Register after componentOnReady: the production onSubmit listener exists first.
    native.addEventListener('submit',late as EventListener);await userEvent.click(button);expect(late).toHaveBeenCalledTimes(1);await noRequests();expect(receive).not.toHaveBeenCalled();expect(original.defaultPrevented).toBe(true);
    expect(Object.getOwnPropertyDescriptor(original,'preventDefault')).toBeUndefined();expect(Object.getOwnPropertyDescriptor(original,'returnValue')).toBeUndefined();
    native.removeEventListener('submit',late as EventListener);await userEvent.click(button);await requests(1);expect(receive).toHaveBeenCalledTimes(1);
  });
  it('reentrant native submit/requestSubmit calls during formdata produce one actual request',async()=>{
    const form=await create('<q-input name="a" value="ready"></q-input>');const native=form.shadowRoot!.querySelector('form')!;const receive=vi.fn();form.addEventListener('qSubmit',receive);const submitted=vi.fn();native.addEventListener('submit',submitted);
    const data=vi.fn((ev:FormDataEvent)=>{native.submit();native.requestSubmit();HTMLFormElement.prototype.submit.call(native);HTMLFormElement.prototype.requestSubmit.call(native);ev.formData.append('native-edit','kept');});native.addEventListener('formdata',data as EventListener);
    await form.submitForm();const [request]=await requests(1);expect(request.body).toBe('a=ready&native-edit=kept');expect(data).toHaveBeenCalledTimes(1);expect(receive).toHaveBeenCalledTimes(1);expect(submitted).toHaveBeenCalledTimes(1);await noExtra();
  });
  it('GET sends the approved repeated entries, submitter, reserved names and qSubmit mutations once',async()=>{
    const form=await create('<input name="repeat" value="first"><q-input name="repeat" value="last"></q-input><input name="submit" value="literal"><input name="requestSubmit" value="literal"><input name="elements" value="literal"><q-button type="submit" name="send" value="yes">Send</q-button>','get');
    const native=form.shadowRoot!.querySelector('form')!;let collected!:QFormSubmitDetail;const received=vi.fn((ev:CustomEvent<QFormSubmitDetail>)=>{collected=ev.detail;ev.detail.formData.append('mutation','approved');(form.querySelector('input')!).value='later-field-change';});form.addEventListener('qSubmit',received as EventListener);
    native.addEventListener('formdata',ev=>{(ev as FormDataEvent).formData.append('native-listener','later');});
    (await nativeButton(form.querySelector('q-button')!)).click();const [request]=await requests(1);expect(received).toHaveBeenCalledTimes(1);expect(collected.values.repeat).toEqual(['first','last']);expect(collected.values.mutation).toBeUndefined();
    expect(request.method).toBe('GET');expect(pairs(new URL(request.url).searchParams)).toEqual([['repeat','first'],['repeat','last'],['submit','literal'],['requestSubmit','literal'],['elements','literal'],['send','yes'],['mutation','approved'],['native-listener','later']]);expect(request.body).toBe('');
    expect(native.getAttribute('action')).toBe('/__webquark_submit_probe__/default');expect(native.getAttribute('target')).toBe(target);expect(new FormData(native).get('repeat')).toBeNull();
  });
  it('POST applies action/method/encoding/target overrides and restores original attributes',async()=>{
    const form=await create('<q-input name="message" value="a &amp; b"></q-input><q-button type="submit" name="mode" value="override" formaction="/__webquark_submit_probe__/override" formmethod="post" formenctype="application/x-www-form-urlencoded">Send</q-button>','get');
    const button=form.querySelector('q-button')!;button.formTarget=target;const native=form.shadowRoot!.querySelector('form')!;const before=['action','method','enctype','target'].map(name=>native.getAttribute(name));
    (await nativeButton(button)).click();const [request]=await requests(1);expect(new URL(request.url).pathname).toBe('/__webquark_submit_probe__/override');expect(request.method).toBe('POST');expect(request.headers['content-type']).toContain('application/x-www-form-urlencoded');expect(pairs(new URLSearchParams(request.body))).toEqual([['message','a & b'],['mode','override']]);expect(['action','method','enctype','target'].map(name=>native.getAttribute(name))).toEqual(before);
  });
  it('multipart preserves repeated files, binary bytes, filenames and native formdata mutation',async()=>{
    const form=await create('<q-input name="repeat" value="one"></q-input><input name="repeat" value="two"><input type="file" name="upload"><q-button type="submit" name="send" value="yes" formenctype="multipart/form-data">Send</q-button>');file(form.querySelector<HTMLInputElement>('input[type="file"]')!);const original=form.querySelector<HTMLInputElement>('input[type="file"]')!.files![0];let emitted!:QFormSubmitDetail;
    form.addEventListener('qSubmit',(ev:CustomEvent<QFormSubmitDetail>)=>{emitted=ev.detail;ev.detail.formData.append('upload',new File(['second-file'],'second.txt',{type:'text/plain'}));});
    form.shadowRoot!.querySelector('form')!.addEventListener('formdata',ev=>(ev as FormDataEvent).formData.append('after','native'));
    (await nativeButton(form.querySelector('q-button')!)).click();const [request]=await requests(1);expect(emitted.formData.get('upload')).toBe(original);expect(request.method).toBe('POST');expect(request.headers['content-type']).toMatch(/^multipart\/form-data; boundary=/);
    const bytes=Uint8Array.from(atob(request.bodyBase64),ch=>ch.charCodeAt(0));expect(Array.from(bytes).some((_,index)=>[0,1,65,255,10].every((value,offset)=>bytes[index+offset]===value))).toBe(true);
    expect(request.body).toContain('name="upload"; filename="evidence.bin"');expect(request.body).toContain('name="upload"; filename="second.txt"');expect(request.body).toContain('second-file');expect(request.body.match(/name="repeat"/g)).toHaveLength(2);expect(request.body).toContain('name="after"');
  });
  it('text/plain uses actual browser serialization and current logical values',async()=>{
    const form=await create('<q-input name="text" value="first"></q-input><q-button type="submit" name="send" value="yes" formenctype="text/plain">Send</q-button>');form.querySelector('q-input')!.value='live';(await nativeButton(form.querySelector('q-button')!)).click();const [request]=await requests(1);expect(request.headers['content-type']).toContain('text/plain');expect(request.body).toBe('text=live\r\nsend=yes\r\n');
  });
  it.each(['invalid','qSubmit','qClick','click','event-only'] as const)('%s produces zero native delivery requests',async reason=>{
    const form=await create('<q-input name="needed" required></q-input><q-button type="submit" name="send" value="yes">Send</q-button>');if(reason!=='invalid')form.querySelector('q-input')!.value='ready';if(reason==='event-only')form.preventDefault=true;else if(reason!=='invalid')form.addEventListener(reason,ev=>ev.preventDefault());(await nativeButton(form.querySelector('q-button')!)).click();await noRequests();
  });
  it('ordinary native form uses one temporary proxy and transports q-button metadata natively',async()=>{
    const form=document.createElement('form');form.id='ordinary';form.action='/__webquark_submit_probe__/ordinary';form.method='post';form.target=target;form.innerHTML='<input name="field" value="native"><q-input name="custom" value="custom"></q-input>';document.body.append(form);
    const button=document.createElement('q-button');button.type='submit';button.form='ordinary';button.name='send';button.value='yes';button.formAction='/__webquark_submit_probe__/native-override';document.body.append(button);await button.componentOnReady();await form.querySelector('q-input')!.componentOnReady();const submit=vi.fn((ev:SubmitEvent)=>{expect(ev.submitter).toBeInstanceOf(HTMLButtonElement);expect(ev.submitter).not.toBe(button);});form.addEventListener('submit',submit as EventListener);(await nativeButton(button)).click();const [request]=await requests(1);expect(submit).toHaveBeenCalledTimes(1);expect(new URL(request.url).pathname).toBe('/__webquark_submit_probe__/native-override');expect(pairs(new URLSearchParams(request.body))).toEqual([['field','native'],['custom','custom'],['send','yes']]);expect(form.querySelector('button')).toBeNull();
  });
  it('native associated actions deliver exactly once through q-form with the author submitter',async()=>{
    const form=await create();const native=form.shadowRoot!.querySelector('form')!;const action=document.createElement('button');action.type='submit';action.name='native';action.value='once';native.append(action);const received=vi.fn();form.addEventListener('qSubmit',received);action.click();const [request]=await requests(1);expect(received).toHaveBeenCalledTimes(1);expect(received.mock.calls[0][0].detail.submitter).toBe(action);expect(request.body).toBe('native=once');
  });
  it.each([false,true])('image pointer coordinates match actual native delivery (native=%s)',async owned=>{
    const form=await create();const image=document.createElement('input');image.type='image';image.name='image';image.alt='Send';image.src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"></svg>';image.style.cssText='width:40px;height:30px';
    (owned?form.shadowRoot!.querySelector('form')!:form).append(image);let pointer:readonly[number,number]|undefined;image.addEventListener('click',ev=>{pointer=[ev.offsetX,ev.offsetY];});
    await userEvent.click(image);const [request]=await requests(1);expect(pointer).toBeDefined();const expected=[['image.x',String(Math.floor(pointer![0]))],['image.y',String(Math.floor(pointer![1]))]];expect(pairs(new URLSearchParams(request.body))).toEqual(expected);
    const oracle=document.createElement('form');oracle.action='/__webquark_submit_probe__/image-oracle';oracle.method='post';oracle.target=target;const nativeImage=image.cloneNode(true) as HTMLInputElement;oracle.append(nativeImage);document.body.append(oracle);let actual!:readonly[number,number];nativeImage.addEventListener('click',ev=>{actual=[ev.offsetX,ev.offsetY];});await userEvent.click(nativeImage);const [,nativeRequest]=await requests(2);expect(pairs(new URLSearchParams(nativeRequest.body))).toEqual([['image.x',String(Math.floor(actual[0]))],['image.y',String(Math.floor(actual[1]))]]);expect(pairs(new URLSearchParams(nativeRequest.body))).toEqual(expected);
  });
  it.each(['named','unnamed'] as const)('image keyboard/click/requestSubmit keep separate coordinate semantics (%s)',async naming=>{
    const form=await create();const native=form.shadowRoot!.querySelector('form')!;const image=document.createElement('input');image.type='image';image.alt='Send';if(naming==='named')image.name='image';image.src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"></svg>';image.style.cssText='width:40px;height:30px';native.append(image);
    const keys=naming==='named'?['image.x','image.y']:['x','y'];const zeros=[[keys[0],'0'],[keys[1],'0']];
    image.focus();await userEvent.keyboard('{Enter}');let found=await requests(1);expect(pairs(new URLSearchParams(found[0].body))).toEqual(zeros);
    image.click();found=await requests(2);expect(pairs(new URLSearchParams(found[1].body))).toEqual(zeros);
    await userEvent.click(image);found=await requests(3);expect(pairs(new URLSearchParams(found[2].body))).not.toEqual(zeros);
    native.requestSubmit(image);found=await requests(4);expect(pairs(new URLSearchParams(found[3].body))).toEqual(zeros);
    await form.submitForm();found=await requests(5);expect(found[4].body).toBe('');
  });
  it('requestSubmit inside a pointer click listener does not borrow that pending click coordinates',async()=>{
    const form=await create();const native=form.shadowRoot!.querySelector('form')!;const image=document.createElement('input');image.type='image';image.name='image';image.alt='Send';image.style.cssText='width:40px;height:30px';native.append(image);
    form.addEventListener('click',ev=>{native.requestSubmit(image);ev.preventDefault();},{once:true});await userEvent.click(image);const [request]=await requests(1);expect(pairs(new URLSearchParams(request.body))).toEqual([['image.x','0'],['image.y','0']]);await noExtra();
  });
  it.each(['qClick','click'] as const)('trusted q-button click honors later %s listeners',async eventName=>{
    const form=await create('<q-button type="submit" name="send" value="yes">Send</q-button>');const receive=vi.fn();form.addEventListener('qSubmit',receive);form.addEventListener(eventName,ev=>ev.preventDefault());await userEvent.click(await nativeButton(form.querySelector('q-button')!));await noRequests();expect(receive).not.toHaveBeenCalled();
  });
  it('repeated image activation does not duplicate pending delivery and detached submitters never deliver',async()=>{
    const form=await create();const image=document.createElement('input');image.type='image';image.name='image';image.alt='Send';form.append(image);image.click();image.click();image.remove();await noRequests();form.append(image);image.click();image.click();const [request]=await requests(1);expect(request.body).toBe('image.x=0&image.y=0');await noExtra();
    form.shadowRoot!.querySelector('form')!.append(image);image.click();image.remove();await noExtra();form.append(image);await form.submitForm();const found=await requests(2);expect(found[1].body).toBe('');
  });
  it('uncanceled throwing qSubmit listeners retain native event semantics and clean up after one delivery',async()=>{
    const form=await create('<q-input name="a" value="ready"></q-input>');const realm=document.createElement('iframe');document.body.append(realm);const view=realm.contentWindow!;const errors:Error[]=[];view.addEventListener('error',ev=>{errors.push(ev.error);ev.preventDefault();});realm.contentDocument!.body.append(form);
    const listener=(view as any).Function('event','event.detail.formData.append("listener", "before-throw"); throw new Error("consumer failed");');form.addEventListener('qSubmit',listener);await form.submitForm();const [request]=await requests(1);expect(errors).toHaveLength(1);expect(request.body).toBe('a=ready&listener=before-throw');form.removeEventListener('qSubmit',listener);await form.submitForm();await requests(2);
  });
  it('formnovalidate permits an otherwise invalid delivery and reentrant qSubmit calls do not duplicate it',async()=>{
    const form=await create('<q-input name="needed" required></q-input><q-button type="submit" name="send" value="draft" formnovalidate>Draft</q-button>');const button=await nativeButton(form.querySelector('q-button')!);const received=vi.fn(()=>{void form.submitForm();button.click();});form.addEventListener('qSubmit',received);button.click();const [request]=await requests(1);expect(request.body).toBe('needed=&send=draft');expect(received).toHaveBeenCalledTimes(1);await noExtra();
  });
  it('valid native dialog closes without any request',async()=>{
    const dialog=document.createElement('dialog');document.body.append(dialog);const form=await create('<input name="field" value="ready"><q-button type="submit" value="done">Done</q-button>','dialog');dialog.append(form);dialog.showModal();(await nativeButton(form.querySelector('q-button')!)).click();await vi.waitFor(()=>expect(dialog.open).toBe(false));expect(dialog.returnValue).toBe('done');await noRequests();
  });
});
async function noExtra(){await new Promise(resolve=>setTimeout(resolve,150));expect(await probe.readFormSubmitProbe()).toHaveLength(1);}
