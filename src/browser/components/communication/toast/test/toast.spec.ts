import { afterEach, describe, expect, it } from 'vitest';
// @ts-ignore
import '../../../../../../packages/browser/components/dist/components/q-toast.js';
// @ts-ignore
import { toast } from '../../../../../../packages/browser/components/dist/index.js';

describe('q-toast', () => {
  const wait = (duration = 20) =>
    new Promise<void>((resolve) => setTimeout(resolve, duration));

  afterEach(async () => {
    document.body.innerHTML = '';
    await wait();
  });

  async function createHost(
    props: Record<string, unknown> = {},
  ): Promise<any> {
    const host = document.createElement('q-toast') as any;
    Object.assign(host, props);
    document.body.append(host);
    await customElements.whenDefined('q-toast');
    await wait();
    return host;
  }

  it('renders semantic danger feedback through QAlert without a nested live region', async () => {
    const host = await createHost();

    toast.error(
      "Couldn't delete user",
      'System-protected accounts cannot be deleted.',
    );
    await wait();

    const alert = host.shadowRoot.querySelector('q-alert') as any;
    await customElements.whenDefined('q-alert');
    await wait();
    const alertContainer = alert.shadowRoot.querySelector('[part="container"]');

    expect(alert.heading).toBe("Couldn't delete user");
    expect(alert.variant).toBe('danger');
    expect(alert.textContent).toContain(
      'System-protected accounts cannot be deleted.',
    );
    expect(alert.querySelector('svg[slot="icon"]')).not.toBeNull();
    expect(alertContainer.hasAttribute('role')).toBe(false);
    expect(host.shadowRoot.querySelector('[role="status"]')).not.toBeNull();
  });

  it('limits visible toasts and promotes the next toast after dismissal', async () => {
    const host = await createHost({ maxVisible: 1 });
    const firstId = await host.info('First', undefined, { duration: 0 });
    await host.info('Second', undefined, { duration: 0 });
    await wait();

    expect(host.shadowRoot.querySelectorAll('q-alert')).toHaveLength(1);
    expect(host.shadowRoot.querySelector('q-alert').heading).toBe('First');

    expect(await host.dismiss(firstId)).toBe(true);
    await wait(300);

    expect(host.shadowRoot.querySelectorAll('q-alert')).toHaveLength(1);
    expect(host.shadowRoot.querySelector('q-alert').heading).toBe('Second');
  });

  it('clears visible and pending toasts', async () => {
    const host = await createHost({ maxVisible: 1 });
    await host.success('Saved', undefined, { duration: 0 });
    await host.warning('Needs attention', undefined, { duration: 0 });
    await wait();

    expect(await host.clear()).toBe(2);
    await wait(300);

    expect(host.shadowRoot.querySelectorAll('q-alert')).toHaveLength(0);
  });

  it('auto-dismisses finite durations and keeps persistent feedback', async () => {
    const host = await createHost();
    await host.info('Temporary', undefined, { duration: 10 });
    await host.danger('Persistent', undefined, { dismissible: false });
    await wait();

    const initialAlerts = Array.from(
      host.shadowRoot.querySelectorAll('q-alert'),
    ) as HTMLQAlertElement[];
    expect(initialAlerts).toHaveLength(2);
    expect(initialAlerts[1].dismissible).toBe(false);

    await wait(300);

    const remainingAlerts = Array.from(
      host.shadowRoot.querySelectorAll('q-alert'),
    ) as HTMLQAlertElement[];
    expect(remainingAlerts).toHaveLength(1);
    expect(remainingAlerts[0].heading).toBe('Persistent');
  });
});
