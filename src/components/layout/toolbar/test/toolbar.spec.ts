import { afterEach, describe, expect, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-toolbar', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-toolbar');
    Object.assign(el, props);
    document.body.appendChild(el);
    await (el as any).componentOnReady();
    return el;
  }

  it('renders consumer-owned start, content, and end regions without controls', async () => {
    const el = await createComponent({ ariaLabel: 'Page actions' });
    const back = document.createElement('button');
    back.setAttribute('slot', 'start');
    const title = document.createElement('span');
    title.textContent = 'Settings';
    const profile = document.createElement('button');
    profile.setAttribute('slot', 'end');
    el.append(back, title, profile);
    await new Promise(resolve => setTimeout(resolve, 10));

    const startSlot = el.shadowRoot.querySelector('slot[name="start"]') as HTMLSlotElement;
    const defaultSlot = el.shadowRoot.querySelector('slot:not([name])') as HTMLSlotElement;
    const endSlot = el.shadowRoot.querySelector('slot[name="end"]') as HTMLSlotElement;
    const toolbar = el.shadowRoot.querySelector('.toolbar') as HTMLElement;

    expect(startSlot.assignedElements()).toContain(back);
    expect(defaultSlot.assignedElements()).toContain(title);
    expect(endSlot.assignedElements()).toContain(profile);
    expect(el.shadowRoot.querySelector('button')).toBeNull();
    expect(toolbar.getAttribute('role')).toBe('group');
    expect(toolbar.getAttribute('aria-label')).toBe('Page actions');
  });

  it('reflects edge and presentation properties', async () => {
    const el = await createComponent({ edge: 'right', sticky: true, compact: true, bordered: true, transparent: true });

    expect(el.getAttribute('edge')).toBe('right');
    expect(el.hasAttribute('sticky')).toBe(true);
    expect(el.hasAttribute('compact')).toBe(true);
    expect(el.hasAttribute('bordered')).toBe(true);
    expect(el.hasAttribute('transparent')).toBe(true);
  });
});
