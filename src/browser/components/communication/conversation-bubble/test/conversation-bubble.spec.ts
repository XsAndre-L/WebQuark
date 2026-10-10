import { afterEach, describe, expect, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';

defineCustomElements();

describe('q-conversation-bubble', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createComponent(
    props: Record<string, unknown> = {},
    content = 'Hello there.',
  ): Promise<any> {
    const element = document.createElement('q-conversation-bubble');
    Object.assign(element, props);
    element.textContent = content;
    document.body.appendChild(element);
    await (element as any).componentOnReady();
    return element;
  }

  it('renders an incoming semantic message by default', async () => {
    const element = await createComponent({ sender: 'Maya', timestamp: '09:42' });
    const article = element.shadowRoot.querySelector('article') as HTMLElement;

    expect(element.getAttribute('variant')).toBe('incoming');
    expect(article.getAttribute('aria-label')).toBe('Message from Maya, 09:42');
    expect(element.shadowRoot.querySelector('[part="sender"]')?.textContent).toBe('Maya');
    expect(element.shadowRoot.querySelector('[part="timestamp"]')?.textContent).toBe('09:42');
  });

  it('uses a consumer-provided accessible label', async () => {
    const element = await createComponent({ ariaLabel: 'Assistant response about values' });
    expect(element.shadowRoot.querySelector('article')?.getAttribute('aria-label')).toBe(
      'Assistant response about values',
    );
  });

  it('detects avatar and action slots', async () => {
    const element = document.createElement('q-conversation-bubble') as any;
    const avatar = document.createElement('span');
    avatar.setAttribute('slot', 'avatar');
    avatar.textContent = 'A';
    const action = document.createElement('button');
    action.setAttribute('slot', 'actions');
    action.textContent = 'Copy';
    element.append(avatar, document.createTextNode('Message'), action);
    document.body.appendChild(element);
    await element.componentOnReady();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(element.shadowRoot.querySelector('article')?.classList.contains('has-avatar')).toBe(true);
    expect(element.shadowRoot.querySelector('[part="actions"]')?.classList.contains('has-content')).toBe(true);
  });

  it('applies outgoing and system variants without live-region behavior', async () => {
    const outgoing = await createComponent({ variant: 'outgoing' });
    const system = await createComponent({ variant: 'system' });

    expect(outgoing.shadowRoot.querySelector('article')?.classList.contains('variant-outgoing')).toBe(true);
    expect(system.shadowRoot.querySelector('article')?.getAttribute('aria-label')).toBe('System message');
    expect(system.shadowRoot.querySelector('article')?.hasAttribute('aria-live')).toBe(false);
  });
});
