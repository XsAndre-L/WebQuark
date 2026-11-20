import type { ComponentSpec, Example } from '../state';
import api from './component-api.json';
import before from '../assets/comparison-before.svg' with { type: 'text' };
import after from '../assets/comparison-after.svg' with { type: 'text' };

export interface ComponentAPI {
  attributes: Record<string, string | null>;
  defaults: Record<string, string>;
  requiredProps: string[];
  events: string[];
}

export const contracts: Record<string, ComponentAPI> = api;

export interface ResolvedExample {
  tag: string;
  name: string;
  props: Record<string, any>;
  content: string;
}

const illustrations: Record<string, string> = {
  'assets/comparison-before.svg': before,
  'assets/comparison-after.svg': after,
};

export function portableAsset(value: string): string {
  const key = value.replace(/^\.\//, '');
  return Object.hasOwn(illustrations, key)
    ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(illustrations[key]) : value;
}

function groupByRole(item: { role?: string }) {
  const role = item.role || 'Unassigned';
  return { key: role, label: role };
}

function slotMarkup(spec: ComponentSpec, item?: Example): string {
  const body = document.createElement('template');
  const slots = new Set([...Object.keys(spec.slots || {}), ...Object.keys(item?.slots || {})]);
  if (item?.slot !== undefined) slots.add('default');
  for (const name of slots) {
    const slot = spec.slots?.[name];
    const fallback = item ? slot?.default : slot?.currentValue;
    const value = item?.slots?.[name] ?? (name === 'default' ? item?.slot : undefined) ?? fallback;
    if (!value) continue;

    const fragment = document.createElement('template');
    if (slot?.type === 'text' || slot?.type === 'textarea') fragment.content.append(document.createTextNode(value));
    else fragment.innerHTML = value;
    if (name !== 'default') {
      for (const node of Array.from(fragment.content.childNodes)) {
        if (node instanceof HTMLElement || node instanceof SVGElement) node.setAttribute('slot', name);
        else if (node.textContent?.trim()) {
          const span = document.createElement('span');
          span.slot = name;
          span.textContent = node.textContent;
          node.replaceWith(span);
        }
      }
    }
    body.content.append(fragment.content);
  }
  return body.innerHTML;
}

export function resolveExample(spec: ComponentSpec, item?: Example): ResolvedExample {
  const props: Record<string, any> = {};
  if (spec.options) props.options = spec.options;
  for (const [name, definition] of Object.entries(spec.props || {})) {
    const value = item ? definition.default : definition.currentValue;
    if (value !== undefined && value !== null) props[name] = value;
  }
  for (const [name, value] of Object.entries(item?.props || {})) {
    if (value === null || value === undefined) delete props[name];
    else props[name] = value;
  }
  for (const [name, value] of Object.entries(props)) {
    if (spec.props?.[name]?.type === 'callback') {
      if (value === 'role') props[name] = groupByRole;
      else delete props[name];
    }
  }
  return { tag: spec.tag, name: item?.name ?? 'Sandbox', props, content: slotMarkup(spec, item) };
}

export function applyExample(element: HTMLElement, next: ResolvedExample, previous?: ResolvedExample) {
  const attributes = contracts[next.tag].attributes;
  for (const [key, value] of Object.entries(next.props)) {
    if (previous && Object.is(previous.props[key], value)) continue;
    if (key === 'style' || key === 'dir') element.setAttribute(key, String(value));
    else if (Object.hasOwn(attributes, key)) Reflect.set(element, key, value);
  }
  if (previous?.content !== next.content) element.innerHTML = next.content;
  element.dataset.example = next.name;
}

export function wrapTrigger(element: HTMLElement): HTMLElement {
  if (element.localName !== 'q-tooltip') return element;
  const trigger = document.createElement('q-button');
  trigger.setAttribute('type', 'button');
  trigger.setAttribute('aria-label', 'Show tooltip');
  trigger.textContent = 'Show tooltip';
  trigger.append(element);
  return trigger;
}
