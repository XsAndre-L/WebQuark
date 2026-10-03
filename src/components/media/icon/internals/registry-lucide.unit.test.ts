import { afterEach, describe, expect, it, vi } from 'vitest';
import { Braces, Check, Copy, Bell, CircleAlert } from '@lucide/icons';
import { prepareQIconDefinition, registerQIcons, resolveRegisteredQIcon } from './registry';
import { cloneIconAttributes, createIconBudget, MAX_ICON_ATTRIBUTES, MAX_ICON_ATTRIBUTE_BYTES, MAX_ICON_DEPTH, MAX_ICON_NODES, MAX_ICON_SVG_BYTES } from './policy';

const LUCIDE = { Braces, Check, Copy, Bell, CircleAlert };
afterEach(() => registerQIcons({}));

describe('registered Lucide node metadata boundary', () => {
  it.each(Object.entries(LUCIDE))('preserves real %s geometry, strips keys and leaves original data intact', (_name, source) => {
    const before = JSON.stringify(source); const prepared = prepareQIconDefinition(source);
    expect(prepared.size).toBe(source.size); expect(prepared.name).toBe(source.name);
    expect(prepared.node.length).toBe(source.node.length);
    source.node.forEach(([tag, attributes], index) => {
      expect(attributes.key).toBeTypeOf('string'); expect(prepared.node[index][0]).toBe(tag);
      const { key: _metadata, ...geometry } = attributes;
      expect(prepared.node[index][1]).toEqual(geometry); expect(prepared.node[index][1]).not.toHaveProperty('key');
      expect(Object.isFrozen(prepared.node[index][1])).toBe(true);
    });
    expect(JSON.stringify(source)).toBe(before);
  });
  it('supports the documented real Bell/CircleAlert application-owned registry', () => {
    registerQIcons({ bell: Bell, 'circle-alert': CircleAlert });
    expect(resolveRegisteredQIcon('bell')!.node[0][1].d).toBe(Bell.node[0][1].d);
    expect(resolveRegisteredQIcon('circle-alert')!.node[0][1].r).toBe(CircleAlert.node[0][1].r);
    expect(resolveRegisteredQIcon('circle-alert')!.node.every(node => !('key' in node[1]))).toBe(true);
  });
  it('normalizes nested node metadata without changing root attributes or SVG data', () => {
    const prepared = prepareQIconDefinition({ attributes: { id: 'root' }, node: [['g', { key: 'group' }, [['path', { d: 'M1 1', key: 'child' }]]]] });
    expect(prepared.attributes).toEqual({ id: 'root' }); expect(prepared.node).toEqual([['g', {}, [['path', { d: 'M1 1' }]]]]);
    expect(() => prepareQIconDefinition({ attributes: { key: 'root-key' }, node: [] })).toThrow(/unsupported SVG attribute/);
    expect(() => cloneIconAttributes({ d: 'M1 1', key: 'xml-key' }, 'path', createIconBudget(), 'fetched attributes')).toThrow(/unsupported SVG attribute/);
  });
  it.each([null, 3, true, {}, () => 'key'])('rejects non-string key metadata %s without accepting functions', key => {
    expect(() => prepareQIconDefinition({ node: [['path', { d: 'M1 1', key }]] })).toThrow(/string data property/);
  });
  it('rejects a metadata accessor and does not invoke unknown-attribute getters', () => {
    const getter = vi.fn(() => 'value');
    const keyAttributes = { d: 'M1 1' }; Object.defineProperty(keyAttributes, 'key', { enumerable: true, get: getter });
    expect(() => prepareQIconDefinition({ node: [['path', keyAttributes]] })).toThrow(/string data property/);
    const unknown = { d: 'M1 1', key: 'metadata' }; Object.defineProperty(unknown, 'unknown', { enumerable: true, get: getter });
    expect(() => prepareQIconDefinition({ node: [['path', unknown]] })).toThrow(/unsupported SVG attribute/);
    expect(getter).not.toHaveBeenCalled();
  });
  it.each([
    ['unknown', 'attribute'], ['Key', 'not-known-metadata'], ['onload', 'inert rejection fixture'], ['style', 'fill:red'],
    ['href', 'https://example.invalid/icon.svg#x'], ['fill', 'url(https://example.invalid/x)'], ['d', () => 'M1 1'],
  ])('still rejects %s SVG data beside a valid metadata key', (name, value) => {
    registerQIcons({ kept: Check });
    expect(() => registerQIcons({ rejected: { node: [['path', { d: 'M1 1', key: 'metadata', [name]: value }]] } } as never)).toThrow();
    expect(resolveRegisteredQIcon('kept')).toBeDefined(); expect(resolveRegisteredQIcon('rejected')).toBeUndefined();
  });
  it('counts discarded metadata against attribute, UTF-8 and total-byte budgets', () => {
    const attributes: Record<string, string> = { key: 'metadata' };
    for (let i = 0; i < MAX_ICON_ATTRIBUTES - 1; i++) attributes[`data-x${i}`] = 'x';
    expect(prepareQIconDefinition({ node: [['path', attributes]] }).node[0][1]).not.toHaveProperty('key');
    attributes['data-over'] = 'x'; expect(() => prepareQIconDefinition({ node: [['path', attributes]] })).toThrow(/64 attributes/);
    for (const key of ['a'.repeat(MAX_ICON_ATTRIBUTE_BYTES + 1), '雪'.repeat(Math.ceil(MAX_ICON_ATTRIBUTE_BYTES / 3))]) {
      expect(() => prepareQIconDefinition({ node: [['path', { key }]] })).toThrow(/byte budget/);
    }
    expect(() => prepareQIconDefinition({ node: Array.from({ length: 3 }, () => ['path', { key: 'x'.repeat(Math.ceil(MAX_ICON_SVG_BYTES / 3)) }]) })).toThrow(/byte budget/);
  });
  it('retains node/depth limits while normalizing metadata', () => {
    expect(() => prepareQIconDefinition({ node: Array.from({ length: MAX_ICON_NODES + 1 }, () => ['path', { key: 'x' }]) })).toThrow(/SVG nodes/);
    let node: unknown = ['path', { key: 'leaf' }];
    for (let i = 0; i < MAX_ICON_DEPTH; i++) node = ['g', { key: 'group' }, [node]];
    expect(() => prepareQIconDefinition({ node: [node] })).toThrow(/depth/);
  });
});
