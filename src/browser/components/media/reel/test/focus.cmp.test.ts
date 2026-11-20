import { afterEach, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
// @ts-ignore - the browser tests run after Stencil generates the loader.
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';

defineCustomElements();

afterEach(() => document.body.replaceChildren());

it('focuses the viewer on first open and restores the opening thumbnail after navigation', async () => {
  const reel = document.createElement('q-reel');
  const thumbnails = ['First image', 'Second image'].map(label => {
    const thumbnail = document.createElement('q-thumbnail');
    thumbnail.label = label;
    thumbnail.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16"/%3E';
    return thumbnail;
  });

  reel.append(...thumbnails);
  document.body.append(reel);

  const opener = await vi.waitFor(() => {
    const trigger = thumbnails[0].shadowRoot?.querySelector<HTMLElement>('[role="button"]');
    expect(trigger).toBeTruthy();
    return trigger!;
  });
  opener.focus();
  await userEvent.keyboard('{Enter}');
  await vi.waitFor(() => expect(reel.shadowRoot?.activeElement?.getAttribute('aria-label')).toBe('Close viewer'));

  await userEvent.keyboard('{ArrowRight}');
  await vi.waitFor(() => expect(reel.shadowRoot?.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Second image'));

  await userEvent.keyboard('{Escape}');
  await vi.waitFor(() => {
    expect(reel.shadowRoot?.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(thumbnails[0]);
    expect(thumbnails[0].shadowRoot?.activeElement).toBe(opener);
  });
});
