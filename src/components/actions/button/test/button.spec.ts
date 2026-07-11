import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-button', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-button');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  async function createComponentWithChild(props: Record<string, any> = {}, child?: HTMLElement): Promise<any> {
    const el = document.createElement('q-button');
    Object.assign(el, props);
    if (child) {
      el.appendChild(child);
    }
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('adds noopener noreferrer for blank link buttons by default', async () => {
    const el = await createComponent({ href: 'https://example.com', target: '_blank' });
    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;

    expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    el.remove();
  });

  it('keeps an explicit rel value for link buttons', async () => {
    const el = await createComponent({ href: 'https://example.com', target: '_blank', rel: 'nofollow' });
    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;

    expect(anchor.getAttribute('rel')).toBe('nofollow');
    el.remove();
  });

  it('forwards aria-label to native button and link render paths', async () => {
    const buttonEl = await createComponent({ ariaLabel: 'Close panel', iconOnly: true });
    const button = buttonEl.shadowRoot.querySelector('button') as HTMLButtonElement;
    const linkEl = await createComponent({ href: '/docs', ariaLabel: 'Open docs', iconOnly: true });
    const anchor = linkEl.shadowRoot.querySelector('a') as HTMLAnchorElement;

    expect(button.getAttribute('aria-label')).toBe('Close panel');
    expect(anchor.getAttribute('aria-label')).toBe('Open docs');
    buttonEl.remove();
    linkEl.remove();
  });

  it('marks loading link buttons busy and suppresses qClick', async () => {
    const el = await createComponent({ href: '/export', loading: true });
    const handler = vi.fn();
    el.addEventListener('qClick', handler);
    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(anchor.getAttribute('aria-busy')).toBe('true');
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('tabindex')).toBe('-1');
    expect(event.defaultPrevented).toBe(true);
    expect(handler).not.toHaveBeenCalled();
    el.remove();
  });

  it('auto-detects icon-only content from slotted icon regions', async () => {
    const icon = document.createElement('span');
    icon.setAttribute('slot', 'icon-left');
    const el = await createComponentWithChild({}, icon);
    const button = el.shadowRoot.querySelector('.btn') as HTMLButtonElement;

    expect(button.classList.contains('is-icon-only')).toBe(true);
    el.remove();
  });

  it('renders the icon shorthand with the button size', async () => {
    const el = await createComponent({ icon: 'save', size: 'lg', ariaLabel: 'Save' });
    const icon = el.shadowRoot.querySelector('q-icon[part="icon"]') as any;

    expect(icon).toBeTruthy();
    expect(icon.name).toBe('save');
    expect(icon.size).toBe('lg');
    expect(el.shadowRoot.querySelector('.btn').classList.contains('is-icon-only')).toBe(true);
    el.remove();
  });

  it('lets assigned icon-left content replace the shorthand fallback', async () => {
    const customIcon = document.createElement('span');
    customIcon.setAttribute('slot', 'icon-left');
    const el = await createComponentWithChild({ icon: 'save' }, customIcon);
    const slot = el.shadowRoot.querySelector('slot[name="icon-left"]') as HTMLSlotElement;

    expect(slot.assignedElements()).toHaveLength(1);
    expect(slot.assignedElements()[0]).toBe(customIcon);
    el.remove();
  });

  it('uses visible text as the accessible name without adding aria-label', async () => {
    const el = document.createElement('q-button') as any;
    el.icon = 'save';
    el.textContent = 'Save';
    document.body.appendChild(el);
    await el.componentOnReady();

    const button = el.shadowRoot.querySelector('button') as HTMLButtonElement;
    expect(button.classList.contains('is-icon-only')).toBe(false);
    expect(button.hasAttribute('aria-label')).toBe(false);
    el.remove();
  });

  it('applies circular shape and stacked content classes', async () => {
    const el = await createComponent({ shape: 'circle', layout: 'stacked' });
    const button = el.shadowRoot.querySelector('.btn') as HTMLButtonElement;

    expect(button.classList.contains('shape-circle')).toBe(true);
    expect(button.classList.contains('layout-stacked')).toBe(true);
    el.remove();
  });

  it('emits focus and blur events from the inner button', async () => {
    const el = await createComponent();
    const focusHandler = vi.fn();
    const blurHandler = vi.fn();
    el.addEventListener('qFocus', focusHandler);
    el.addEventListener('qBlur', blurHandler);
    const button = el.shadowRoot.querySelector('button') as HTMLButtonElement;

    button.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    button.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(focusHandler).toHaveBeenCalledTimes(1);
    expect(blurHandler).toHaveBeenCalledTimes(1);
    el.remove();
  });
});
