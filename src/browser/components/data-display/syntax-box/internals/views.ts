import type { QSyntaxBoxVariant } from '../syntax-box.types';

export interface SyntaxOwner {
  variant: QSyntaxBoxVariant;
  visible(view: HTMLElement): boolean;
  select(view: HTMLElement): void;
}

export const syntaxBoxes = new WeakMap<HTMLElement, SyntaxOwner>();
export const syntaxScrollRestorers = new WeakMap<HTMLElement, () => void>();
export const syntaxVisibility = new WeakMap<HTMLElement, () => void>();

export function syntaxOwner(view: HTMLElement): SyntaxOwner | undefined {
  return syntaxBoxes.get(view) ?? (view.localName === 'q-syntax-view' && view.parentElement
    ? syntaxBoxes.get(view.parentElement)
    : undefined);
}

export function revealSyntaxEditor(editor: HTMLElement): void {
  const ancestors: HTMLElement[] = [];
  for (let node: HTMLElement | null = editor; node; node = node.parentElement) {
    if (node === editor || node.localName === 'q-syntax-view') ancestors.push(node);
  }
  for (const view of ancestors.reverse()) syntaxOwner(view)?.select(view);
}

export function ownContentNodes(host: HTMLElement): ChildNode[] {
  return Array.from(host.childNodes).filter(node => node.nodeType === 3 ||
    (node instanceof Element && !node.slot && node.localName !== 'q-syntax-view'));
}

export function hasSlottedSource(host: HTMLElement): boolean {
  return ownContentNodes(host).some(node => node.nodeType === 1 || Boolean(node.textContent?.trim()));
}
