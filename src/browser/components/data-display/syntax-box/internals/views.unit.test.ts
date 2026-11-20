import { expect, it, vi } from 'vitest';

it('connects a box and its views across independently loaded modules', async () => {
  const parentModule = await import('./views');
  vi.resetModules();
  const childModule = await import('./views');
  expect(childModule.syntaxOwner).not.toBe(parentModule.syntaxOwner);

  const box = document.createElement('q-syntax-box');
  const view = document.createElement('q-syntax-view');
  box.append(view);
  const owner = { variant: 'panel' as const, visible: () => true, select: vi.fn() };
  parentModule.syntaxBoxes.set(box, owner);
  expect(childModule.syntaxOwner(view)).toBe(owner);

  const syncVisibility = vi.fn();
  const restoreScroll = vi.fn();
  childModule.syntaxVisibility.set(view, syncVisibility);
  childModule.syntaxScrollRestorers.set(view, restoreScroll);
  expect(parentModule.syntaxVisibility.get(view)).toBe(syncVisibility);
  expect(parentModule.syntaxScrollRestorers.get(view)).toBe(restoreScroll);
});
