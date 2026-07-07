import { expect, describe, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-circular-progress', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-circular-progress');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('clamps values below and above the 0-100 range', async () => {
    const low = await createComponent({ value: -10 });
    const lowProgress = low.shadowRoot.querySelector('[role="progressbar"]') as HTMLElement;

    expect(lowProgress.getAttribute('aria-valuenow')).toBe('0');
    expect(low.shadowRoot.querySelector('.progress-text')?.textContent).toBe('0%');
    low.remove();

    const high = await createComponent({ value: 120 });
    const highProgress = high.shadowRoot.querySelector('[role="progressbar"]') as HTMLElement;

    expect(highProgress.getAttribute('aria-valuenow')).toBe('100');
    expect(high.shadowRoot.querySelector('.progress-text')?.textContent).toBe('100%');
    high.remove();
  });

  it('renders indeterminate state without determinate value text', async () => {
    const el = await createComponent({ indeterminate: true });
    const progress = el.shadowRoot.querySelector('[role="progressbar"]') as HTMLElement;

    expect(el.hasAttribute('indeterminate')).toBe(true);
    expect(progress.getAttribute('aria-valuenow')).toBeNull();
    expect(progress.getAttribute('aria-valuetext')).toBeNull();
    expect(el.shadowRoot.querySelector('.progress-text')).toBeNull();
    el.remove();
  });

  it('uses label as visible text and aria-valuetext while keeping aria-label separate', async () => {
    const el = await createComponent({ value: 60, label: '3 of 5 tasks', ariaLabel: 'Upload progress' });
    const progress = el.shadowRoot.querySelector('[role="progressbar"]') as HTMLElement;

    expect(el.shadowRoot.querySelector('.progress-text')?.textContent).toBe('3 of 5 tasks');
    expect(progress.getAttribute('aria-valuetext')).toBe('3 of 5 tasks');
    expect(progress.getAttribute('aria-label')).toBe('Upload progress');
    el.remove();
  });

  it('reflects the size preset to the host attribute', async () => {
    const el = await createComponent({ size: 'lg' });

    expect(el.getAttribute('size')).toBe('lg');
    el.remove();
  });
});
