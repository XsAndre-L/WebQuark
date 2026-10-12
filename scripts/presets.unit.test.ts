import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { comfortablePreset, dimensionTokens, presetTokens, themeGroups, internalPresetTokens } from '../src/browser/theme/tokens';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const declarations = (css: string) => Object.fromEntries([...css.matchAll(/(--q-[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));

describe('preset compatibility manifest', () => {
  it('preserves all 180 original defaults exactly and allocates each once', () => {
    const baseline = JSON.parse(read('../src/browser/theme/test/compact-baseline.json'));
    const catalog = [...dimensionTokens, ...themeGroups.flatMap(group => group.tokens)];
    expect(Object.fromEntries(catalog.map(token => [token.name, token.value]))).toEqual(baseline);
    const shared = declarations(read('../src/browser/theme/tokens.css').split('@media')[0]);
    const compact = declarations(read('../src/browser/theme/token-presets.css').split(":where([data-wq-preset='comfortable'])")[0]);
    for (const [name, value] of Object.entries(baseline)) {
      expect(Number(name in shared) + Number(name in compact), name).toBe(1);
      expect(shared[name] ?? compact[name], name).toBe(value);
    }
    expect(Object.keys(comfortablePreset)).toHaveLength(65);
  });

  it('has complete, valid, identical key sets and generated values for both presets', () => {
    expect(new Set(presetTokens.map(token => token.name)).size).toBe(presetTokens.length);
    const css = read('../src/browser/theme/token-presets.css');
    const [compact, comfortable] = css.split(":where([data-wq-preset='comfortable'])");
    for (const mode of ['compact', 'comfortable'] as const) {
      const actual = declarations(mode === 'compact' ? compact : comfortable);
      expect(actual).toEqual(Object.fromEntries(presetTokens.map(token => [token.name, token[mode]])));
      expect(Object.values(actual).every(value => value && !/TBD|undefined/.test(value))).toBe(true);
    }
  });

  it('keeps private size fallbacks out of the public token reference', () => {
    const docs = read('../docs/design-presets-tokens.md');
    const css = read('../src/browser/theme/token-presets.css');
    expect(presetTokens.every(token => token.name.startsWith('--q-'))).toBe(true);
    for (const [name, values] of Object.entries(internalPresetTokens)) {
      expect(name.startsWith('--_q-')).toBe(true);
      expect(docs).not.toContain(name);
      expect(css).toContain(`${name}: ${values.compact};`);
      expect(css).toContain(`${name}: ${values.comfortable};`);
    }
  });
});
