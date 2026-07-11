import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-dialog', () => {
  async function wait(ms = 30): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-dialog');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses solid as the default backdrop effect', async () => {
    const el = await createComponent();
    const backdrop = el.shadowRoot.querySelector('.dialog-backdrop') as HTMLElement;

    expect(el.backdropEffect).toBe('solid');
    expect(backdrop.classList.contains('effect-solid')).toBe(true);
  });

  it('supports the solid backdrop effect for Unreal-safe rendering', async () => {
    const el = await createComponent({ backdropEffect: 'solid' });
    const backdrop = el.shadowRoot.querySelector('.dialog-backdrop') as HTMLElement;

    expect(backdrop.classList.contains('effect-solid')).toBe(true);
  });

  it('falls back to solid for unknown backdrop effects', async () => {
    const el = await createComponent({ backdropEffect: 'invalid' });
    const backdrop = el.shadowRoot.querySelector('.dialog-backdrop') as HTMLElement;

    expect(backdrop.classList.contains('effect-solid')).toBe(true);
  });

  it('wires title and message text to dialog aria attributes', async () => {
    const el = await createComponent({ dialogTitle: 'Delete item', message: 'This action cannot be undone.' });
    const modal = el.shadowRoot.querySelector('.dialog-modal') as HTMLElement;
    const title = el.shadowRoot.querySelector('.dialog-title') as HTMLElement;
    const message = el.shadowRoot.querySelector('.dialog-message') as HTMLElement;

    expect(title.id).toMatch(/^q-dialog-\d+-title$/);
    expect(message.id).toMatch(/^q-dialog-\d+-description$/);
    expect(modal.getAttribute('aria-labelledby')).toBe(title.id);
    expect(modal.getAttribute('aria-describedby')).toBe(message.id);
  });

  it('uses an explicit aria-label instead of aria-labelledby', async () => {
    const el = await createComponent({ dialogTitle: 'Visible title', ariaLabel: 'Account confirmation' });
    const modal = el.shadowRoot.querySelector('.dialog-modal') as HTMLElement;

    expect(modal.getAttribute('aria-label')).toBe('Account confirmation');
    expect(modal.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('uses closeLabel for the close button accessible name', async () => {
    const el = await createComponent({ closeLabel: 'Close confirmation' });
    const closeButton = el.shadowRoot.querySelector('.dialog-close-btn') as HTMLButtonElement;

    expect(closeButton.getAttribute('aria-label')).toBe('Close confirmation');
  });

  it('show and close methods update open state and emit qClose on close', async () => {
    const el = await createComponent();
    const closeHandler = vi.fn();
    el.addEventListener('qClose', closeHandler);

    await el.show();
    await wait(60);

    expect(el.open).toBe(true);
    expect(el.shadowRoot.querySelector('.dialog-wrapper').classList.contains('is-visible')).toBe(true);

    await el.close();
    await wait();

    expect(el.open).toBe(false);
    expect(closeHandler).toHaveBeenCalledTimes(1);
  });

  it('confirm emits qConfirm and qClose, then closes the dialog', async () => {
    const el = await createComponent({ open: true });
    const confirmHandler = vi.fn();
    const closeHandler = vi.fn();
    el.addEventListener('qConfirm', confirmHandler);
    el.addEventListener('qClose', closeHandler);

    await el.confirm();
    await wait();

    expect(confirmHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(el.open).toBe(false);
  });

  it('Escape cancels and closes when closeOnEsc is true', async () => {
    const el = await createComponent({ open: true });
    const cancelHandler = vi.fn();
    const closeHandler = vi.fn();
    el.addEventListener('qCancel', cancelHandler);
    el.addEventListener('qClose', closeHandler);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wait();

    expect(cancelHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(el.open).toBe(false);
  });

  it('Escape does not close when closeOnEsc is false', async () => {
    const el = await createComponent({ open: true, closeOnEsc: false });
    const cancelHandler = vi.fn();
    el.addEventListener('qCancel', cancelHandler);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wait();

    expect(cancelHandler).not.toHaveBeenCalled();
    expect(el.open).toBe(true);
  });

  it('backdrop clicks do not close while loading', async () => {
    const el = await createComponent({ open: true, loading: true });
    const cancelHandler = vi.fn();
    const closeHandler = vi.fn();
    const backdrop = el.shadowRoot.querySelector('.dialog-backdrop') as HTMLElement;
    el.addEventListener('qCancel', cancelHandler);
    el.addEventListener('qClose', closeHandler);

    backdrop.click();
    await wait();

    expect(cancelHandler).not.toHaveBeenCalled();
    expect(closeHandler).not.toHaveBeenCalled();
    expect(el.open).toBe(true);
  });
});
