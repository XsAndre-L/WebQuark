import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
import { isStepDiagramItemActivationKey } from '../step-diagram-item.utils';

defineCustomElements();

describe('q-step-diagram-item', () => {
  async function createComponent(props: Record<string, any> = {}, html = ''): Promise<any> {
    const el = document.createElement('q-step-diagram-item');
    Object.assign(el, props);
    el.innerHTML = html;
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  it('emits qItemClick from content click', async () => {
    const el = await createComponent();
    const content = el.shadowRoot.querySelector('.step-content') as HTMLElement;
    const handler = vi.fn();
    el.addEventListener('qItemClick', handler);

    content.click();
    await wait(10);

    expect(handler).toHaveBeenCalledTimes(1);
    el.remove();
  });

  it('recognizes Enter and Space as keyboard activation keys', () => {
    expect(isStepDiagramItemActivationKey('Enter')).toBe(true);
    expect(isStepDiagramItemActivationKey(' ')).toBe(true);
    expect(isStepDiagramItemActivationKey('Escape')).toBe(false);
  });

  it('keeps the decorative badge from emitting qItemClick', async () => {
    const el = await createComponent();
    const badge = el.shadowRoot.querySelector('.step-badge') as HTMLElement;
    const handler = vi.fn();
    el.addEventListener('qItemClick', handler);

    badge.click();
    await wait(10);

    expect(handler).not.toHaveBeenCalled();
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    el.remove();
  });

  it('reflects status, lineStyle, and layout attributes', async () => {
    const el = await createComponent({ status: 'active', lineStyle: 'dashed', layout: 'horizontal' });

    expect(el.getAttribute('status')).toBe('active');
    expect(el.getAttribute('line-style')).toBe('dashed');
    expect(el.getAttribute('layout')).toBe('horizontal');
    expect(el.shadowRoot.querySelector('.step-item')?.classList.contains('status-active')).toBe(false);
    el.remove();
  });

  it('exposes active and pending state semantics on the content button', async () => {
    const active = await createComponent({ status: 'active' });
    const activeContent = active.shadowRoot.querySelector('.step-content') as HTMLElement;

    expect(activeContent.getAttribute('aria-current')).toBe('step');
    active.remove();

    const pending = await createComponent({ status: 'pending' });
    const pendingContent = pending.shadowRoot.querySelector('.step-content') as HTMLElement;

    expect(pendingContent.getAttribute('aria-disabled')).toBe('true');
    pending.remove();
  });

  it('receives layout from a q-step-diagram parent', async () => {
    const parent = document.createElement('q-step-diagram') as any;
    parent.layout = 'horizontal';
    parent.innerHTML = '<q-step-diagram-item></q-step-diagram-item>';
    document.body.appendChild(parent);
    if (typeof parent.componentOnReady === 'function') {
      await parent.componentOnReady();
    } else {
      await wait(50);
    }

    const child = parent.querySelector('q-step-diagram-item') as any;
    await wait(20);

    expect(child.layout).toBe('horizontal');
    parent.remove();
  });
});
