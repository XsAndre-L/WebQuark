import { describe, expect, it } from 'vitest';
import type { QIconNode } from '../icon.types';
import { prepareQIconDefinition } from './registry';
import { MAX_ICON_ATTRIBUTE_BYTES, MAX_ICON_ATTRIBUTES, MAX_ICON_DEPTH, MAX_ICON_NODES, MAX_ICON_SVG_BYTES } from './policy';
import { RESOURCE_ICON } from '../test/icon-fixtures';

describe('shared strict icon definition policy', () => {
  it('preserves ordinary geometry, masks, gradients, groups and local symbols as frozen data', () => {
    const prepared = prepareQIconDefinition(RESOURCE_ICON);
    expect(prepared).toEqual(RESOURCE_ICON);
    expect(Object.isFrozen(prepared.node[0][2])).toBe(true);
    expect(Object.isFrozen(prepared.node[1][1])).toBe(true);
  });

  it.each(['script', 'foreignObject', 'a', 'animate', 'set', 'image', 'svg', 'unknown'])('rejects unsupported element %s', tag => {
    expect(() => prepareQIconDefinition({ node: [[tag, {}]] })).toThrow(/unsupported SVG element/);
  });

  it.each([
    ['onclick', ''], ['OnLoad', ''], ['style', 'fill:red'], ['src', '#shape'], ['tabindex', '0'],
    ['innerHTML', 'inert'], ['xmlns', 'urn:unsupported'], ['fill', 'url(https://example.invalid/paint)'],
    ['fill', 'u\\72l(#paint)'], ['fill', 'var(--external-resource)'], ['fill', 'url(#paint) url(https://example.invalid/paint)'],
  ])('rejects unsupported attribute %s=%s', (name, value) => {
    expect(() => prepareQIconDefinition({ node: [['path', { [name]: value }]] })).toThrow();
  });

  it('checks root attributes with the same allowlist and namespace policy', () => {
    expect(() => prepareQIconDefinition({ node: [], attributes: { xmlns: 'urn:unsupported' } })).toThrow(/namespace/);
    expect(() => prepareQIconDefinition({ node: [], attributes: { onload: '' } })).toThrow(/unsupported SVG attribute/);
  });

  it.each(['', ' ', 'two ids', 'bad#id'])('rejects invalid or empty root ID %j', id => {
    expect(() => prepareQIconDefinition({ attributes: { id }, node: [['path', { d: 'M1 1' }]] })).toThrow(/nonempty and unique/);
  });

  it('rejects an ID shared by the root and a child', () => {
    expect(() => prepareQIconDefinition({ attributes: { id: 'duplicate' }, node: [['path', { id: 'duplicate' }]] })).toThrow(/nonempty and unique/);
  });

  it('preserves a valid root ID and child references, but intentionally rejects references to the root', () => {
    const definition = { ...RESOURCE_ICON, attributes: { id: 'icon-root' } };
    expect(prepareQIconDefinition(definition)).toEqual(definition);
    for (const attributes of [{ href: '#icon-root' }, { 'xlink:href': '#icon-root' }, { fill: 'url(#icon-root)' }]) {
      expect(() => prepareQIconDefinition({ attributes: { id: 'icon-root' }, node: [['use', attributes]] })).toThrow(/not the SVG root/);
    }
  });

  it('bounds every attribute before large UTF-8 allocation and the accumulated attribute bytes', () => {
    expect(() => prepareQIconDefinition({ node: [['path', { d: 'x'.repeat(MAX_ICON_ATTRIBUTE_BYTES + 1) }]] })).toThrow(/byte budget/);
    expect(() => prepareQIconDefinition({ node: Array.from({ length: 3 }, () => ['path', { d: 'x'.repeat(MAX_ICON_SVG_BYTES / 2) }]) })).toThrow(/byte budget/);
    expect(() => prepareQIconDefinition({ node: [['path', Object.fromEntries(Array.from({ length: MAX_ICON_ATTRIBUTES + 1 }, (_, i) => [`data-n${i}`, 'x']))]] })).toThrow(/attributes/);
  });

  it('accepts the node/depth boundaries and rejects one beyond either boundary', () => {
    const leaf = (): QIconNode => ['path', { d: 'M1 1' }];
    expect(prepareQIconDefinition({ node: Array.from({ length: MAX_ICON_NODES }, leaf) }).node).toHaveLength(MAX_ICON_NODES);
    expect(() => prepareQIconDefinition({ node: Array.from({ length: MAX_ICON_NODES + 1 }, leaf) })).toThrow(/SVG nodes/);
    let node = leaf();
    for (let depth = 1; depth < MAX_ICON_DEPTH; depth++) node = ['g', {}, [node]];
    expect(() => prepareQIconDefinition({ node: [node] })).not.toThrow();
    expect(() => prepareQIconDefinition({ node: [['g', {}, [node]]] })).toThrow(/depth/);
  });

  it('rejects missing/duplicate IDs, cyclic references and exponential local symbol expansion', () => {
    expect(() => prepareQIconDefinition({ node: [['use', { href: '#missing' }]] })).toThrow(/same SVG/);
    expect(() => prepareQIconDefinition({ node: [['path', { id: 'x' }], ['path', { id: 'x' }]] })).toThrow(/unique/);
    expect(() => prepareQIconDefinition({ node: [['symbol', { id: 'x' }, [['use', { href: '#x' }]]]] })).toThrow(/cycle/);
    const symbols: QIconNode[] = [['symbol', { id: 's0' }, [['path', { d: 'M1 1' }]]]];
    for (let i = 1; i <= 12; i++) symbols.push(['symbol', { id: `s${i}` }, [
      ['use', { href: `#s${i - 1}` }], ['use', { href: `#s${i - 1}` }],
    ]]);
    expect(() => prepareQIconDefinition({ node: [['defs', {}, symbols], ['use', { href: '#s12' }]] })).toThrow(/expansion/);
  });
});
