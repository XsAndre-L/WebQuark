import { afterEach, describe, expect, it } from 'vitest';

import '../../alert/alert';
import '../toast';

async function nextFrame(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

describe('q-toast interactions in Chromium', () => {
  afterEach(async () => {
    document.body.replaceChildren();
    await nextFrame();
  });

  it('dismisses a rendered toast through the real QAlert button', async () => {
    const host = document.createElement('q-toast') as any;
    document.body.append(host);
    await customElements.whenDefined('q-toast');
    await nextFrame();

    await host.danger('Could not save', 'Try again later.');
    await nextFrame();

    const alert = host.shadowRoot!.querySelector('q-alert')!;
    await customElements.whenDefined('q-alert');
    await nextFrame();
    const dismissButton = alert.shadowRoot!.querySelector(
      '[part="dismiss-button"]',
    ) as HTMLButtonElement;

    dismissButton.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 300));

    expect(host.shadowRoot!.querySelector('q-alert')).toBeNull();
  });

  it('renders built-in semantic icons without loading a q-icon', async () => {
    const host = document.createElement('q-toast') as any;
    document.body.append(host);
    await customElements.whenDefined('q-toast');
    await nextFrame();

    await host.success('Saved', undefined, { duration: 0 });
    await nextFrame();

    const alert = host.shadowRoot!.querySelector('q-alert')!;
    expect(alert.querySelector('svg[slot="icon"]')).not.toBeNull();
    expect(alert.querySelector('q-icon')).toBeNull();
  });
});
