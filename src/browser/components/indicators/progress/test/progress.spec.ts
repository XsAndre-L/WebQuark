import { describe, expect, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';

defineCustomElements();

describe('q-progress', () => {
  async function createComponent(
    props: Record<string, unknown> = {},
  ): Promise<any> {
    const el = document.createElement('q-progress');
    Object.assign(el, props);
    document.body.appendChild(el);

    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return el;
  }

  it('renders linear progress by default and clamps its value', async () => {
    const el = await createComponent({ value: 120 });
    const progress = el.shadowRoot.querySelector(
      '[role="progressbar"]',
    ) as HTMLElement;

    expect(progress.classList.contains('progress-linear')).toBe(true);
    expect(progress.getAttribute('aria-valuenow')).toBe('100');
    expect(
      (el.shadowRoot.querySelector('.progress-linear__fill') as HTMLElement)
        .style.width,
    ).toBe('100%');
    el.remove();
  });

  it('renders the circular variant with visible label text', async () => {
    const el = await createComponent({
      variant: 'circular',
      value: 60,
      label: '3 of 5 tasks',
      ariaLabel: 'Upload progress',
    });
    const progress = el.shadowRoot.querySelector(
      '[role="progressbar"]',
    ) as HTMLElement;

    expect(progress.classList.contains('progress-circular')).toBe(true);
    expect(
      el.shadowRoot.querySelector('.progress-circular__label')?.textContent,
    ).toBe('3 of 5 tasks');
    expect(progress.getAttribute('aria-valuetext')).toBe('3 of 5 tasks');
    expect(progress.getAttribute('aria-label')).toBe('Upload progress');
    el.remove();
  });

  it('renders either variant as indeterminate without value metadata', async () => {
    for (const variant of ['linear', 'circular']) {
      const el = await createComponent({ variant, indeterminate: true });
      const progress = el.shadowRoot.querySelector(
        '[role="progressbar"]',
      ) as HTMLElement;

      expect(progress.getAttribute('aria-valuenow')).toBeNull();
      expect(progress.getAttribute('aria-valuetext')).toBeNull();
      el.remove();
    }
  });

  it('supports semantic tone and size attributes', async () => {
    const el = await createComponent({ size: 'lg', tone: 'success' });

    expect(el.getAttribute('size')).toBe('lg');
    expect(el.getAttribute('tone')).toBe('success');
    el.remove();
  });
});
