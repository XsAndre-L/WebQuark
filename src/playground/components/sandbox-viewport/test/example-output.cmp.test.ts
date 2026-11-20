import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
// @ts-ignore - use the browser component bundle that renders the playground.
import { defineCustomElements } from '../../../../../packages/browser/components/dist/loader';
// @ts-ignore - exercise visible tabs and actions with production styles.
import '../../../../../packages/browser/components/dist/webquark/webquark.css';
import { snippet } from '../../../examples/snippet';
import { ExampleOutput } from '../example-output';

vi.mock('../../../examples/snippet', () => ({ snippet: vi.fn() }));
defineCustomElements();

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.mocked(snippet).mockReset();
});

const example = { tag: 'q-button', name: 'Button', props: {}, content: 'Save' };

function mountOutput(testId = 'output') {
  const output = new ExampleOutput();
  output.element.dataset.testid = testId;
  document.body.append(output.element);
  return { output, panel: page.getByTestId(testId) };
}

describe('playground example output', () => {
  it('fits the HTML label and uses the theme log padding inside a narrow output box', async () => {
    const { output, panel } = mountOutput();
    output.element.style.width = '320px';
    const events = output.element.querySelector<HTMLElement>('q-syntax-view[view-key="events"]')!;
    events.style.setProperty('--q-padding-md', '9px');
    events.style.setProperty('--q-padding-lg', '19px');

    const htmlTab = panel.getByRole('tab', { name: 'Example HTML' });
    await expect.element(htmlTab).toBeVisible();
    const label = htmlTab.element().querySelector<HTMLElement>('.tab__label')!;
    expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);

    await panel.getByRole('tab', { name: 'Events' }).click();
    await expect.element(panel.getByRole('log')).toBeVisible();
    const body = events.shadowRoot!.querySelector('.slotted-body')!;
    await vi.waitFor(() => {
      expect(getComputedStyle(body).paddingTop).toBe('9px');
      expect(getComputedStyle(body).paddingLeft).toBe('19px');
    });
  });

  it('opens with HTML and keeps hidden events and their Clear action local to each card', async () => {
    vi.mocked(snippet).mockResolvedValue('<q-button>Save</q-button>');
    const clipboard = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const first = mountOutput('first-output');
    const second = mountOutput('second-output');
    await Promise.all([first.output.show(example), second.output.show(example)]);

    for (const { panel } of [first, second]) {
      await expect.element(panel.getByRole('tab', { name: 'Example HTML', selected: true })).toBeVisible();
      expect(panel.getByRole('tab').elements().map(tab => tab.textContent?.trim())).toEqual(['Example HTML', 'Events']);
      expect(panel.getByRole('button', { name: 'Clear event log' }).elements()).toHaveLength(0);
    }
    await first.panel.getByRole('button', { name: 'Copy', exact: true }).click();
    expect(clipboard).toHaveBeenCalledWith('<q-button>Save</q-button>');

    for (let index = 0; index < 101; index++) {
      first.output.record({ source: 'First', name: 'qClick', detail: index });
    }
    second.output.record({ source: 'Second', name: 'qClick', detail: 'retained' });

    await first.panel.getByRole('tab', { name: 'Events' }).click();
    const log = first.panel.getByRole('log', { name: 'Example events' });
    await expect.element(log).toBeVisible();
    expect(log.element().childElementCount).toBe(100);
    expect(log.element().firstElementChild?.textContent).toBe('First · qClick 1');
    expect(log.element().lastElementChild?.textContent).toBe('First · qClick 100');
    expect(first.panel.getByRole('button', { name: 'Copy', exact: true }).elements()).toHaveLength(0);
    await first.panel.getByRole('button', { name: 'Clear event log' }).click();
    await expect.element(log).toHaveTextContent('Interact with the example to see its events.');

    await expect.element(second.panel.getByRole('tab', { name: 'Example HTML', selected: true })).toBeVisible();
    await second.panel.getByRole('tab', { name: 'Events' }).click();
    await expect.element(second.panel.getByRole('log')).toHaveTextContent('retained');
  });

  it.each(['success', 'failure'])('discards a stale snippet %s while Events remains selected', async result => {
    let finish!: () => void;
    const original = new Promise<string>((resolve, reject) => {
      finish = () => result === 'success' ? resolve('stale source') : reject(new Error('stale request'));
    });
    vi.mocked(snippet).mockReturnValueOnce(original).mockResolvedValueOnce('updated source');
    const { panel, output } = mountOutput();
    const pending = output.show(example);
    await panel.getByRole('tab', { name: 'Events' }).click();
    await output.show({ ...example, content: 'Latest' });
    finish();
    await pending;

    await expect.element(panel.getByRole('tab', { name: 'Events', selected: true })).toBeVisible();
    await panel.getByRole('tab', { name: 'Example HTML' }).click();
    await expect.element(panel.getByText('updated source', { exact: true })).toBeVisible();
  });

  it('follows new events without scrolling the HTML being read', async () => {
    vi.mocked(snippet).mockResolvedValue('<q-button>Save</q-button>\n'.repeat(60));
    const { panel, output } = mountOutput();
    await output.show(example);
    await expect.element(panel.getByRole('tab', { name: 'Example HTML', selected: true })).toBeVisible();
    const viewport = (key: string) => output.element.querySelector(`q-syntax-view[view-key="${key}"]`)
      ?.shadowRoot?.querySelector('q-scrollable')?.shadowRoot?.querySelector<HTMLElement>('[part~="viewport"]');

    await vi.waitFor(() => expect(viewport('html')!.scrollHeight).toBeGreaterThan(viewport('html')!.clientHeight));
    viewport('html')!.scrollTop = 20;
    for (let index = 0; index < 40; index++) {
      output.record({ source: 'Button', name: 'qClick', detail: index });
    }
    expect(viewport('html')!.scrollTop).toBe(20);
    await panel.getByRole('tab', { name: 'Events' }).click();
    await vi.waitFor(() => {
      const log = viewport('events')!;
      expect(log.scrollTop).toBeGreaterThan(0);
      expect(log.scrollTop + log.clientHeight).toBeCloseTo(log.scrollHeight, 0);
    });
    await panel.getByRole('tab', { name: 'Example HTML' }).click();
    await vi.waitFor(() => expect(viewport('html')!.scrollTop).toBe(20));
  });
});
