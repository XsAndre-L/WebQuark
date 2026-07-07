import { afterEach, describe, expect, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-tooltip', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<{ trigger: HTMLButtonElement; el: any }> {
    const trigger = document.createElement('button');
    trigger.textContent = 'Trigger';

    const el = document.createElement('q-tooltip');
    Object.assign(el, props);
    trigger.appendChild(el);
    document.body.appendChild(trigger);

    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return { trigger, el };
  }

  async function wait(ms = 20): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('links the trigger to the tooltip with aria-describedby and cleans it up on disconnect', async () => {
    const { trigger, el } = await createComponent({ content: 'Helpful text' });

    expect(el.id).toMatch(/^q-tooltip-/);
    expect(trigger.getAttribute('aria-describedby')).toBe(el.id);

    el.remove();
    await wait();

    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
  });

  it('preserves pre-existing aria-describedby values when adding and removing its own id', async () => {
    const trigger = document.createElement('button');
    trigger.setAttribute('aria-describedby', 'existing-description');

    const el = document.createElement('q-tooltip') as any;
    el.content = 'Helpful text';
    trigger.appendChild(el);
    document.body.appendChild(trigger);

    if (typeof el.componentOnReady === 'function') {
      await el.componentOnReady();
    } else {
      await wait(50);
    }

    expect(trigger.getAttribute('aria-describedby')).toBe(`existing-description ${el.id}`);

    el.remove();
    await wait();

    expect(trigger.getAttribute('aria-describedby')).toBe('existing-description');
  });

  it('toggles visibility and aria-hidden after the configured delay', async () => {
    const { trigger, el } = await createComponent({ content: 'Helpful text', delay: 1 });

    expect(el.classList.contains('is-visible')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');

    trigger.dispatchEvent(new Event('mouseenter'));
    await wait(50);

    expect(el.classList.contains('is-visible')).toBe(true);
    expect(el.getAttribute('aria-hidden')).toBe('false');

    trigger.dispatchEvent(new Event('mouseleave'));
    await wait();

    expect(el.classList.contains('is-visible')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('reflects position to the host attribute for placement CSS', async () => {
    const { el } = await createComponent({ content: 'Helpful text', position: 'right' });

    expect(el.getAttribute('position')).toBe('right');
  });
});
