import { afterEach, describe, expect, it } from 'vitest';
import '../divider';
import css from '../divider.css?inline';

const frame = async () => { await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); };
async function setup(vertical = false, layout = 'flex') {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `display:${layout};${layout === 'grid' ? 'grid-template-columns:auto 1px auto;' : ''}align-items:center;width:200px;gap:8px;--q-space-sm:8px;--q-border-color:rgb(12, 34, 56)`;
  wrapper.innerHTML = vertical ? '<div style="height:40px">A</div><q-divider orientation="vertical"></q-divider><div>B</div>' : '<q-divider></q-divider>';
  if (!vertical) wrapper.style.display = 'block';
  document.body.append(wrapper);
  await customElements.whenDefined('q-divider');
  await frame();
  const el = wrapper.querySelector('q-divider')!;
  const style = document.createElement('style'); style.textContent = css; el.shadowRoot!.append(style);
  await frame();
  return { wrapper, el, line: el.shadowRoot!.querySelector<HTMLElement>('[part="line"]')! };
}
describe('q-divider allocated geometry', () => {
  afterEach(() => document.body.replaceChildren());
  it('follows its nested wrapper and wrapped flex line, with inherited light/dark colors', async () => {
    const { wrapper, el, line } = await setup(true);
    const outer = document.createElement('div');
    outer.style.cssText = 'display:flex;flex-wrap:wrap;width:160px;gap:12px';
    wrapper.style.width = '140px';
    document.body.append(outer); outer.append(wrapper);
    const anotherGroup = document.createElement('div'); anotherGroup.style.cssText = 'width:140px;height:90px'; outer.append(anotherGroup);
    await frame();
    expect(el.getBoundingClientRect().height).toBeCloseTo(40);
    expect(line.getBoundingClientRect().height).toBeCloseTo(24);
    outer.style.width = '400px'; await frame();
    // The wrapper now stretches to its own allocated flex line height.
    expect(line.getBoundingClientRect().height).toBeCloseTo(el.getBoundingClientRect().height - 16);
    wrapper.style.setProperty('--q-border-color', 'rgb(200, 210, 220)'); await frame();
    expect(getComputedStyle(line).borderLeftColor).toBe('rgb(200, 210, 220)');
    wrapper.style.setProperty('--q-divider-color', 'rgb(1, 2, 3)'); await frame();
    expect(getComputedStyle(line).borderLeftColor).toBe('rgb(1, 2, 3)');
  });
  it('stretches horizontally in a sibling-sized column flex layout', async () => {
    const { wrapper, el, line } = await setup();
    wrapper.style.cssText = 'display:inline-flex;flex-direction:column;align-items:center;--q-divider-inset:6px';
    const sibling = document.createElement('div'); sibling.style.width = '120px'; wrapper.append(sibling);
    await frame();
    expect(el.getBoundingClientRect().width).toBeCloseTo(120);
    expect(line.getBoundingClientRect().width).toBeCloseTo(108);
    el.spacing = 'sm'; await frame();
    expect(getComputedStyle(el).marginBlockStart).toBe('8px');
    expect(getComputedStyle(el).marginBlockEnd).toBe('8px');
  });
  it('fills horizontal width with theme insets and caps explicit percentages and oversized lengths', async () => {
    const { wrapper, el, line } = await setup();
    expect(getComputedStyle(el).marginBlockStart).toBe('16px');
    expect(getComputedStyle(el).marginBlockEnd).toBe('16px');
    expect(line.getBoundingClientRect().width).toBeCloseTo(184);
    el.length = '50%'; await frame();
    expect(line.getBoundingClientRect().width).toBeCloseTo(100);
    el.length = '999px'; await frame();
    expect(line.getBoundingClientRect().width).toBeCloseTo(184);
    wrapper.style.width = '100px'; await frame();
    expect(line.getBoundingClientRect().width).toBeCloseTo(84);
    wrapper.style.width = '10px'; await frame();
    expect(line.getBoundingClientRect().width).toBe(0);
  });
  for (const layout of ['flex', 'grid']) it(`stretches to sibling-driven ${layout} height without influencing it`, async () => {
    const { wrapper, el, line } = await setup(true, layout);
    expect(el.getBoundingClientRect().height).toBeCloseTo(40);
    expect(line.getBoundingClientRect().height).toBeCloseTo(24);
    expect(line.getBoundingClientRect().top - el.getBoundingClientRect().top).toBeCloseTo(8);
    (wrapper.firstElementChild as HTMLElement).style.height = '64px'; await frame();
    expect(line.getBoundingClientRect().height).toBeCloseTo(48);
    el.length = '50%'; await frame();
    expect(line.getBoundingClientRect().height).toBeCloseTo(32);
    el.length = '1000px'; await frame();
    expect(line.getBoundingClientRect().height).toBeCloseTo(48);
    wrapper.dir = 'rtl'; el.spacing = 'sm'; await frame();
    expect(getComputedStyle(el).marginInlineStart).toBe('8px');
    expect(getComputedStyle(el).marginInlineEnd).toBe('8px');
    expect(getComputedStyle(line).borderLeftColor).toBe('rgb(12, 34, 56)');
    (wrapper.firstElementChild as HTMLElement).style.height = '10px';
    (wrapper.lastElementChild as HTMLElement).style.height = '10px'; await frame();
    expect(line.getBoundingClientRect().height).toBe(0);
  });
});
