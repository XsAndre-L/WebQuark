import { describe, expect, it } from 'bun:test';
import { assertLockstepPackages, assertPackageContract, packages, prepareManifest, repositoryRoot, type PackageManifest } from './release-utils';

function manifests(version = '1.0.2'): PackageManifest[] {
  return packages.map(definition => prepareManifest(definition, {
    name: definition.name, version,
    ...(definition.role === 'wrapper' ? { peerDependencies: { framework: '^21.0.0' } } : {}),
  }, version));
}

describe('lockstep release package graph', () => {
  it.each(['1.1.0-dev.9', '1.1.0'])('prepares all five packages and their exact internal versions for %s', version => {
    const original = manifests();
    const prepared = packages.map((definition, index) => prepareManifest(definition, original[index], version));
    expect(assertLockstepPackages(prepared)).toBe(version);
    expect(original.every(manifest => manifest.version === '1.0.2')).toBe(true);
    const core = prepared.find(manifest => manifest.name === '@webquark/core')!;
    expect(core.dependencies).toEqual({ '@webquark/browser': version, '@webquark/tooling': version });
    for (const name of ['@webquark/browser', '@webquark/tooling']) {
      const manifest = prepared.find(candidate => candidate.name === name)!;
      expect(manifest.dependencies).toBeUndefined();
      expect(manifest.peerDependencies).toBeUndefined();
    }
    const wrapper = prepared.find(manifest => manifest.name === '@webquark/angular')!;
    expect(wrapper.dependencies).toEqual({ '@webquark/browser': version });
    expect(wrapper.peerDependencies).toEqual({ framework: '^21.0.0', '@webquark/browser': version });
  });

  it('packs package directories in dependency order and excludes the private repository root', () => {
    const available = new Set<string>();
    for (const definition of packages) {
      expect(definition.directory).not.toBe(repositoryRoot);
      for (const dependency of definition.dependencies) expect(available.has(dependency)).toBe(true);
      available.add(definition.name);
    }
    expect(available.size).toBe(5);
  });

  it('rejects mixed versions, legacy wrapper-to-core dependencies, and tooling-to-browser edges', () => {
    const mixed = manifests(); mixed[1].version = '1.0.3';
    expect(() => assertLockstepPackages(mixed)).toThrow('lockstep');
    const wrapper = packages.find(definition => definition.key === 'angular')!;
    const oldWrapper = { ...manifests().find(manifest => manifest.name === wrapper.name)!, dependencies: { '@webquark/core': '1.0.2' } };
    expect(() => assertPackageContract(wrapper, oldWrapper, '1.0.2')).toThrow('must depend on @webquark/browser');
    const tooling = packages.find(definition => definition.key === 'tooling')!;
    expect(() => prepareManifest(tooling, { name: tooling.name, version: '1.0.2', dependencies: { '@webquark/browser': '1.0.2' } }, '1.1.0')).toThrow('Invalid internal dependency');
  });

  it('rejects private package manifests before packing or publication', () => {
    const definition = packages[0];
    expect(() => prepareManifest(definition, { name: definition.name, version: '1.0.2', private: true }, '1.1.0')).toThrow('Invalid publishable package');
  });
});
