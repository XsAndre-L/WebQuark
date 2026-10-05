import { afterEach, describe, expect, it } from 'vitest';
// @ts-ignore Tests exercise the generated consumer API after a production build.
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

async function settle() {
  for (let index = 0; index < 6; index++) {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
}

async function mount(html: string, explicitIconOnly = false) {
  const button = document.createElement('q-button');
  button.ariaLabel = 'Notifications';
  if (explicitIconOnly) button.iconOnly = true;
  button.innerHTML = html;
  for (const icon of Array.from(button.querySelectorAll('q-icon'))) {
    icon.definition = { node: [['circle', { cx: '12', cy: '12', r: '8' }]] };
  }
  document.body.append(button);
  await customElements.whenDefined('q-button');
  await button.componentOnReady();
  await settle();
  return button;
}

function label(button: HTMLElement) {
  return button.shadowRoot!.querySelector<HTMLElement>('.btn-label')!;
}

function isIconOnly(button: HTMLElement) {
  return button.shadowRoot!.querySelector('.btn')!.classList.contains('is-icon-only');
}

afterEach(() => document.body.replaceChildren());

describe('q-button default slot ownership', () => {
  it.each(['icon-left', 'icon-right'])('hides the empty label for a q-icon nested in %s', async slot => {
    const button = await mount(`<span slot="${slot}"><q-icon name="bell"></q-icon></span>`, true);
    expect(label(button).classList.contains('has-default-slot-icon')).toBe(false);
    expect(getComputedStyle(label(button)).display).toBe('none');
  });

  it.each(['<q-icon name="bell"></q-icon>', '<q-icon slot="" name="bell"></q-icon>', '<span><q-icon name="bell"></q-icon></span>'])('keeps actual default-slot icon content visible: %s', async html => {
    const button = await mount(html);
    expect(isIconOnly(button)).toBe(true);
    expect(label(button).classList.contains('has-default-slot-icon')).toBe(true);
    expect(getComputedStyle(label(button)).display).not.toBe('none');
  });

  it('preserves a visible label next to a named icon wrapper', async () => {
    const button = await mount('<span slot="icon-left"><q-icon name="bell"></q-icon></span>Notifications');
    expect(isIconOnly(button)).toBe(false);
    expect(getComputedStyle(label(button)).display).not.toBe('none');
  });

  it('ignores framework comments when detecting icon-only content', async () => {
    const button = await mount('<!--bindings={"unread":true}--><span slot="icon-left"><q-icon name="bell"></q-icon><span>3</span></span>');
    expect(isIconOnly(button)).toBe(true);
    expect(getComputedStyle(label(button)).display).toBe('none');
  });

  it('updates the label when an icon wrapper moves between named and default slots', async () => {
    const button = await mount('<span slot="icon-left"><q-icon name="bell"></q-icon></span>');
    const wrapper = button.firstElementChild!;
    expect(isIconOnly(button)).toBe(true);
    expect(getComputedStyle(label(button)).display).toBe('none');

    wrapper.removeAttribute('slot');
    await settle();
    expect(isIconOnly(button)).toBe(true);
    expect(label(button).classList.contains('has-default-slot-icon')).toBe(true);
    expect(getComputedStyle(label(button)).display).not.toBe('none');

    wrapper.setAttribute('slot', 'icon-right');
    await settle();
    expect(isIconOnly(button)).toBe(true);
    expect(label(button).classList.contains('has-default-slot-icon')).toBe(false);
    expect(getComputedStyle(label(button)).display).toBe('none');
  });
});
