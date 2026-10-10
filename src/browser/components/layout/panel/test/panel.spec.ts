import { afterEach, describe, expect, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';

defineCustomElements();

describe('q-panel', () => {
  const waitForUpdate = () =>
    new Promise(resolve => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
        return;
      }
      setTimeout(resolve, 0);
    });

  async function createComponent(props: Record<string, any> = {}, html = ''): Promise<any> {
    const el = document.createElement('q-panel');
    Object.assign(el, props);
    el.innerHTML = html;
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await waitForUpdate();
    }
    await waitForUpdate();
    return el;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders body content', async () => {
    const el = await createComponent({}, '<p>Panel body</p>');
    const panel = el.shadowRoot.querySelector('.panel') as HTMLElement;

    expect(el.shadowRoot.querySelector('.panel-body')).not.toBeNull();
    expect(el.variant).toBe('bordered');
    expect(panel.classList.contains('variant-bordered')).toBe(true);
    expect(el.textContent).toContain('Panel body');
  });

  it('supports removing the default border', async () => {
    const el = await createComponent({ noBorders: true });
    const panel = el.shadowRoot.querySelector('.panel') as HTMLElement;

    expect(el.hasAttribute('no-borders')).toBe(true);
    expect(panel.classList.contains('has-no-borders')).toBe(true);
  });

  it('reveals the header and footer slots when provided', async () => {
    const el = await createComponent({}, '<span slot="header">Header</span><span slot="footer">Footer</span>');

    expect(el.shadowRoot.querySelector('.panel-header')?.classList.contains('is-hidden')).toBe(false);
    expect(el.shadowRoot.querySelector('.panel-footer')?.classList.contains('is-hidden')).toBe(false);
  });

  it('applies variant, padding, full-height, and sticky classes', async () => {
    const el = await createComponent({
      variant: 'bordered',
      padding: 'lg',
      fullHeight: true,
      scrollable: true,
      stickyHeader: true,
      stickyFooter: true,
    });

    const panel = el.shadowRoot.querySelector('.panel') as HTMLElement;

    expect(panel.classList.contains('variant-bordered')).toBe(true);
    expect(panel.classList.contains('padding-lg')).toBe(true);
    expect(panel.classList.contains('is-full-height')).toBe(true);
    expect(panel.classList.contains('is-scrollable')).toBe(true);
    expect(panel.classList.contains('has-sticky-header')).toBe(true);
    expect(panel.classList.contains('has-sticky-footer')).toBe(true);
    expect(panel.classList.contains('uses-sticky-scroll')).toBe(true);
  });

  it('passes ariaLabel to the panel container', async () => {
    const el = await createComponent({ ariaLabel: 'Activity' });
    const panel = el.shadowRoot.querySelector('.panel') as HTMLElement;

    expect(panel.getAttribute('aria-label')).toBe('Activity');
  });

  it('makes scrollable body content keyboard focusable and named', async () => {
    const el = await createComponent({ scrollable: true, ariaLabel: 'Activity' }, '<p>Scrollable body</p>');
    const body = el.shadowRoot.querySelector('.panel-body') as HTMLElement;

    expect(body.getAttribute('tabindex')).toBe('0');
    expect(body.getAttribute('role')).toBe('region');
    expect(body.getAttribute('aria-label')).toBe('Activity content');
  });
});
