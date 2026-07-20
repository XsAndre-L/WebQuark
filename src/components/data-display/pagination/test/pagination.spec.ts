import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-pagination', () => {
  const waitForUpdate = () => new Promise(resolve => setTimeout(resolve, 10));

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createComponent(
    props: Record<string, unknown> = {},
  ): Promise<any> {
    const element = document.createElement('q-pagination');
    Object.assign(element, props);
    document.body.appendChild(element);
    if (typeof (element as any).componentOnReady === 'function') {
      await (element as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return element;
  }

  it('renders an accessible range summary and page count', async () => {
    const element = await createComponent({
      ariaLabel: 'User results',
      page: 2,
      pageSize: 10,
      totalItems: 53,
      itemLabel: 'users',
    });
    const navigation = element.shadowRoot.querySelector('nav') as HTMLElement;
    const pageCount = element.shadowRoot.querySelector(
      '.page-count',
    ) as HTMLElement;

    expect(navigation.getAttribute('aria-label')).toBe('User results');
    expect(element.shadowRoot.querySelector('.summary')?.textContent).toContain(
      'Showing 11-20 of 53 users',
    );
    expect(pageCount.textContent).toContain('2 / 6');
    expect(pageCount.getAttribute('aria-label')).toBe('Page 2 of 6');
  });

  it('emits a requested page without mutating the controlled page prop', async () => {
    const element = await createComponent({
      page: 1,
      pageSize: 10,
      totalItems: 25,
    });
    const handler = vi.fn();
    element.addEventListener('qPageChange', handler);

    element.shadowRoot.querySelector('[part="next-button"]').click();
    await waitForUpdate();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toBe(2);
    expect(element.page).toBe(1);
  });

  it('disables unavailable navigation in the empty state', async () => {
    const element = await createComponent({ totalItems: 0 });
    const buttons = Array.from(
      element.shadowRoot.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    expect(element.shadowRoot.querySelector('.summary')?.textContent).toContain(
      'Showing 0-0 of 0 items',
    );
    expect(buttons.every(button => button.hasAttribute('disabled'))).toBe(true);
  });

  it('clamps invalid paging inputs and does not emit beyond a boundary', async () => {
    const element = await createComponent({
      page: 99,
      pageSize: 0,
      totalItems: 3.8,
    });
    const handler = vi.fn();
    element.addEventListener('qPageChange', handler);
    const pageCount = element.shadowRoot.querySelector(
      '.page-count',
    ) as HTMLElement;
    const nextButton = element.shadowRoot.querySelector(
      '[part="next-button"]',
    ) as HTMLButtonElement;

    expect(pageCount.textContent).toContain('3 / 3');
    expect(nextButton.hasAttribute('disabled')).toBe(true);
    nextButton.click();
    await waitForUpdate();
    expect(handler).not.toHaveBeenCalled();
  });

  it('can hide the summary and disable otherwise available navigation', async () => {
    const element = await createComponent({
      page: 2,
      pageSize: 10,
      totalItems: 30,
      showSummary: false,
      disabled: true,
    });
    const buttons = Array.from(
      element.shadowRoot.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    expect(element.shadowRoot.querySelector('.summary')).toBeNull();
    expect(buttons.every(button => button.hasAttribute('disabled'))).toBe(true);
  });
});
