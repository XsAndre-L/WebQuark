import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { runCli } from './check';
import {
  checkPropOrder,
  compareSemanticFingerprints,
  formatDiagnostic,
  writeSemanticFingerprint,
  type CheckerDiagnostic,
  type SourceInput,
} from './checker';
import {
  PROP_GROUPS,
  type NamedSectionConfig,
  type PropGroup,
  type PropOrderConfig,
  type RelationshipCluster,
} from './config';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function fixtureConfig(
  classifications: Partial<Record<PropGroup, readonly string[]>>,
  options: {
    overrides?: PropOrderConfig['overrides'];
    clusters?: readonly RelationshipCluster[];
    mixinFactories?: PropOrderConfig['mixinFactories'];
    namedSections?: readonly NamedSectionConfig[];
  } = {},
): PropOrderConfig {
  return {
    groups: PROP_GROUPS,
    classifications: PROP_GROUPS
      .filter((group) => classifications[group]?.length)
      .map((group) => ({ group, props: classifications[group] ?? [] })),
    overrides: options.overrides ?? [],
    clusters: options.clusters ?? [],
    mixinFactories: options.mixinFactories ?? [],
    namedSections: options.namedSections ?? [],
  };
}

function componentSource(body: string, options: { tag?: string; imports?: string } = {}): string {
  const tag = options.tag ?? 'q-demo';
  const imports = options.imports ?? "import { Component, Prop } from '@stencil/core';";
  return `${imports}

@Component({ tag: '${tag}' })
export class Demo {
${body}
}
`;
}

function checkFixture(
  source: string,
  config: PropOrderConfig,
  extraSources: readonly SourceInput[] = [],
) {
  return checkPropOrder({
    rootDir: 'C:/virtual/webquark',
    config,
    sources: [
      { filePath: 'src/browser/components/test/demo.tsx', text: source },
      ...extraSources,
    ],
  });
}

function diagnosticCodes(result: ReturnType<typeof checkPropOrder>): string[] {
  return result.diagnostics.map((diagnostic) => diagnostic.code);
}

describe('group classification and source ordering', () => {
  it('accepts canonical group order and exact group spacing', () => {
    const result = checkFixture(componentSource(`  @Prop() label?: string;
  @Prop() value = '';

  @Prop() variant = 'plain';

  @Prop() disabled = false;

  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;`), fixtureConfig({
      'content-data-identity': ['label', 'value'],
      'appearance-layout': ['variant'],
      'state-status': ['disabled'],
      accessibility: ['ariaLabel'],
    }));

    expect(result.exitCode).toBe(0);
    expect(result.diagnostics).toEqual([]);
  });

  it('reports source-order and blank-line policy violations as exit 1', () => {
    const result = checkFixture(componentSource(`  @Prop() disabled = false;
  @Prop() label?: string;`), fixtureConfig({
      'content-data-identity': ['label'],
      'state-status': ['disabled'],
    }));

    expect(result.exitCode).toBe(1);
    expect(diagnosticCodes(result)).toContain('PROP_GROUP_ORDER');
    expect(diagnosticCodes(result)).toContain('PROP_SPACING');
  });

  it('reports an unknown prop as an unclassified policy violation', () => {
    const result = checkFixture(componentSource('  @Prop() mystery = true;'), fixtureConfig({}));

    expect(result.exitCode).toBe(1);
    expect(diagnosticCodes(result)).toContain('UNCLASSIFIED_PROP');
  });

  it('reports stale and duplicate mappings as configuration exit 2', () => {
    const stale = checkFixture(componentSource('  @Prop() label?: string;'), fixtureConfig({
      'content-data-identity': ['label', 'ghost'],
    }));
    const duplicateConfig = fixtureConfig({ 'content-data-identity': ['label'] });
    duplicateConfig.classifications = [
      ...duplicateConfig.classifications,
      { group: 'accessibility', props: ['label'] },
    ];
    const duplicate = checkFixture(componentSource('  @Prop() label?: string;'), duplicateConfig);

    expect(stale.exitCode).toBe(2);
    expect(diagnosticCodes(stale)).toContain('STALE_CLASSIFICATION');
    expect(duplicate.exitCode).toBe(2);
    expect(diagnosticCodes(duplicate)).toContain('DUPLICATE_CLASSIFICATION');
  });

  it('applies a component-specific semantic override', () => {
    const result = checkFixture(componentSource(`  @Prop() name?: string;

  @Prop() size = 'md';

  @Prop() label?: string;`, { tag: 'q-icon' }), fixtureConfig({
      'content-data-identity': ['name', 'label'],
      'appearance-layout': ['size'],
    }, {
      overrides: [{ scope: 'q-icon', prop: 'label', group: 'accessibility' }],
    }));

    expect(result.exitCode).toBe(0);
    expect(result.explanations.find((entry) => entry.prop === 'label')).toMatchObject({
      baseGroup: 'accessibility',
      effectiveGroup: 'accessibility',
    });
  });
});

describe('relationship clusters', () => {
  const searchConfig = fixtureConfig({
    'content-data-identity': ['searchPlaceholder'],
    'features-behavior': ['showSearch'],
    'state-status': ['searchValue', 'disabled'],
  }, {
    clusters: [{
      id: 'search',
      scope: 'q-demo',
      props: ['showSearch', 'searchPlaceholder', 'searchValue'],
    }],
  });

  it('accepts an ordered contiguous cluster as one controller-group unit', () => {
    const result = checkFixture(componentSource(`  @Prop() showSearch = false;
  @Prop() searchPlaceholder = 'Search';
  @Prop() searchValue = '';

  @Prop() disabled = false;`), searchConfig);

    expect(result.exitCode).toBe(0);
    expect(result.explanations.find((entry) => entry.prop === 'searchValue')).toMatchObject({
      baseGroup: 'state-status',
      effectiveGroup: 'features-behavior',
      cluster: 'search',
    });
  });

  it('rejects reversed and noncontiguous clusters', () => {
    const reversed = checkFixture(componentSource(`  @Prop() showSearch = false;
  @Prop() searchValue = '';
  @Prop() searchPlaceholder = 'Search';

  @Prop() disabled = false;`), searchConfig);
    const noncontiguousConfig = fixtureConfig({
      'content-data-identity': ['searchPlaceholder'],
      'features-behavior': ['showSearch', 'copyable'],
      'state-status': ['searchValue'],
    }, { clusters: searchConfig.clusters });
    const noncontiguous = checkFixture(componentSource(`  @Prop() showSearch = false;
  @Prop() copyable = false;
  @Prop() searchPlaceholder = 'Search';
  @Prop() searchValue = '';`), noncontiguousConfig);

    expect(diagnosticCodes(reversed)).toContain('CLUSTER_ORDER');
    expect(diagnosticCodes(noncontiguous)).toContain('CLUSTER_CONTIGUITY');
  });

  it('validates the present ordered subset of a cluster', () => {
    const config = fixtureConfig({
      'content-data-identity': ['searchPlaceholder'],
      'features-behavior': ['showSearch'],
      'state-status': ['searchValue'],
    }, {
      clusters: [{
        id: 'partial-search',
        scope: 'q-demo',
        props: ['showSearch', 'searchPlaceholder', 'searchValue'],
      }],
    });
    const holder = componentSource('  @Prop() searchPlaceholder = \'Search\';', { tag: 'q-holder' });
    const result = checkFixture(
      componentSource(`  @Prop() showSearch = false;
  @Prop() searchValue = '';`),
      config,
      [{ filePath: 'src/browser/components/test/holder.tsx', text: holder }],
    );

    expect(result.exitCode).toBe(0);
  });

  it('accepts a relationship split across a mixin and local source block', () => {
    const mixinFile = 'src/browser/components/actions/action.props.ts';
    const config = fixtureConfig({
      'platform-external-integration': ['href', 'target', 'rel'],
    }, {
      mixinFactories: [{ name: 'withActionProps', file: mixinFile }],
      clusters: [
        { id: 'action-navigation', scope: 'withActionProps', props: ['href', 'rel'] },
        { id: 'component-navigation', scope: 'q-action', props: ['href', 'target', 'rel'] },
      ],
    });
    const mixin = `import { Prop } from '@stencil/core';
export const withActionProps = (Base: any) => {
  class ActionProps extends Base {
    @Prop() href?: string;
    @Prop() rel?: string;
  }
  return ActionProps;
};`;
    const component = componentSource('  @Prop() target?: string;', {
      tag: 'q-action',
      imports: `import { Component, Mixin, Prop } from '@stencil/core';
import { withActionProps } from '../actions/action.props';`,
    }).replace('export class Demo {', 'export class Demo extends Mixin(withActionProps) {');
    const result = checkFixture(component, config, [{ filePath: mixinFile, text: mixin }]);

    expect(result.exitCode).toBe(0);
    expect(result.summary.effectiveComponentPropCount).toBe(3);
  });

  it('rejects malformed and overlapping clusters as configuration failures', () => {
    const config = fixtureConfig({ 'features-behavior': ['showSearch', 'copyable'] }, {
      clusters: [
        { id: 'one', scope: 'q-demo', props: ['showSearch'] },
        { id: 'two', scope: 'q-demo', props: ['showSearch', 'copyable'] },
      ],
    });
    const result = checkFixture(componentSource(`  @Prop() showSearch = false;
  @Prop() copyable = false;`), config);

    expect(result.exitCode).toBe(2);
    expect(diagnosticCodes(result)).toContain('INVALID_CLUSTER');
    expect(diagnosticCodes(result)).toContain('OVERLAPPING_CLUSTERS');
  });
});

describe('named sections, parsing, and ignored declarations', () => {
  it('resets group ordering within named mode sections and enforces their boundaries', () => {
    const config = fixtureConfig({
      'content-data-identity': ['label'],
      'appearance-layout': ['variant'],
    }, {
      namedSections: [{
        scope: 'q-mode',
        sections: [
          { name: 'Shared', marker: 'Shared', props: ['variant'] },
          { name: 'Drawer', marker: 'Drawer-mode props', props: ['label'] },
        ],
      }],
    });
    const source = componentSource(`  // ── Shared ─────────────────
  @Prop() variant = 'plain';

  // ── Drawer-mode props ───────
  @Prop() label?: string;`, { tag: 'q-mode' });
    const result = checkFixture(source, config);

    expect(result.exitCode).toBe(0);
  });

  it('rejects missing, reordered, and incorrectly spaced named sections', () => {
    const config = fixtureConfig({
      'content-data-identity': ['label'],
      'appearance-layout': ['variant'],
    }, {
      namedSections: [{
        scope: 'q-mode',
        sections: [
          { name: 'Shared', marker: 'Shared', props: ['variant'] },
          { name: 'Drawer', marker: 'Drawer-mode props', props: ['label'] },
        ],
      }],
    });
    const source = componentSource(`  // ── Drawer-mode props ───────

  @Prop() label?: string;
  // ── Shared ─────────────────
  @Prop() variant = 'plain';`, { tag: 'q-mode' });
    const result = checkFixture(source, config);

    expect(result.exitCode).toBe(1);
    expect(diagnosticCodes(result)).toContain('NAMED_SECTION_ORDER');
    expect(diagnosticCodes(result)).toContain('SECTION_HEADER_SPACING');
  });

  it('resolves Stencil import aliases, supports multiline declarations, and ignores other decorators', () => {
    const source = componentSource(`  @El() host!: HTMLElement;
  @Internals() internals!: ElementInternals;

  /**
   * Retained documentation.
   */
  @P({
    reflect: true,
    mutable: true,
  })
  label:
    | string
    | null = (() => {
      return 'demo';
    })();

  @Evt() changed!: unknown;`, {
      imports: "import { AttachInternals as Internals, Component as C, Element as El, Event as Evt, Prop as P } from '@stencil/core';",
    }).replace('@Component(', '@C(');
    const helper = `import { Prop as P } from '@stencil/core';
export class Helper { @P() ignored = true; }`;
    const generated = `export namespace Components {
  interface QGenerated { value: string; }
}`;
    const result = checkFixture(source, fixtureConfig({
      'content-data-identity': ['label'],
    }), [
      { filePath: 'src/browser/components/test/helper.tsx', text: helper },
      { filePath: 'src/browser/components.d.ts', text: generated },
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.summary.sourceDeclarationCount).toBe(1);
    expect(result.fingerprint.declarations[0]).toMatchObject({
      decorators: [expect.stringContaining('mutable: true')],
      type: '| string\n    | null',
      initializer: expect.stringContaining("return 'demo'"),
      jsDoc: [expect.stringContaining('Retained documentation')],
    });
  });

  it('reports syntax errors as operational exit 2', () => {
    const result = checkFixture(
      "import { Component, Prop } from '@stencil/core'; @Component({ tag: 'q-demo' }) class Demo { @Prop() value = ; }",
      fixtureConfig({ 'content-data-identity': ['value'] }),
    );

    expect(result.exitCode).toBe(2);
    expect(diagnosticCodes(result)).toContain('PARSE_ERROR');
  });
});

describe('mixin factories and inherited API checks', () => {
  const mixinFile = 'src/browser/components/actions/action.props.ts';
  const mixinSource = `import { Prop as P } from '@stencil/core';
export const withOne = (Base: any) => {
  class One extends Base { @P() label?: string; }
  return One;
};
export const withTwo = (Base: any) => {
  class Two extends Base { @P() disabled = false; }
  return Two;
};`;
  const config = fixtureConfig({
    'content-data-identity': ['label'],
    'state-status': ['disabled'],
  }, {
    mixinFactories: [
      { name: 'withOne', file: mixinFile },
      { name: 'withTwo', file: mixinFile },
    ],
  });

  it('scans multiple configured factories and resolves aliased Mixin composition', () => {
    const source = componentSource('', {
      tag: 'q-mixed',
      imports: `import { Component, Mixin as Compose } from '@stencil/core';
import { withOne as first, withTwo as second } from '../actions/action.props';`,
    }).replace('export class Demo {', 'export class Demo extends Compose(first, second) {');
    const result = checkFixture(source, config, [{ filePath: mixinFile, text: mixinSource }]);

    expect(result.exitCode).toBe(0);
    expect(result.summary.mixinFactoryCount).toBe(2);
    expect(result.summary.sourceDeclarationCount).toBe(2);
    expect(result.summary.effectiveComponentPropCount).toBe(2);
  });

  it('rejects inherited/local and inherited/inherited duplicate props', () => {
    const localSource = componentSource('  @Prop() label?: string;', {
      tag: 'q-mixed',
      imports: `import { Component, Mixin, Prop } from '@stencil/core';
import { withOne } from '../actions/action.props';`,
    }).replace('export class Demo {', 'export class Demo extends Mixin(withOne) {');
    const localResult = checkFixture(localSource, config, [{ filePath: mixinFile, text: mixinSource }]);

    const duplicateMixinSource = mixinSource.replace('@P() disabled = false;', '@P() label?: string;');
    const duplicateConfig = fixtureConfig({ 'content-data-identity': ['label'] }, {
      mixinFactories: config.mixinFactories,
    });
    const inheritedSource = componentSource('', {
      tag: 'q-mixed',
      imports: `import { Component, Mixin } from '@stencil/core';
import { withOne, withTwo } from '../actions/action.props';`,
    }).replace('export class Demo {', 'export class Demo extends Mixin(withOne, withTwo) {');
    const inheritedResult = checkFixture(
      inheritedSource,
      duplicateConfig,
      [{ filePath: mixinFile, text: duplicateMixinSource }],
    );

    expect(diagnosticCodes(localResult)).toContain('INHERITED_PROP_REDECLARATION');
    expect(diagnosticCodes(inheritedResult)).toContain('INHERITED_PROP_REDECLARATION');
  });
});

describe('semantic fingerprints', () => {
  const config = fixtureConfig({ 'content-data-identity': ['label', 'value'] });

  it('is order-insensitive while retaining exact declaration semantics', () => {
    const before = checkFixture(componentSource(`  /** Label docs. */
  @Prop({ reflect: true }) label: string = 'Label';
  @Prop() value?: number;`), config);
    const reordered = checkFixture(componentSource(`  @Prop() value?: number;
  /** Label docs. */
  @Prop({ reflect: true }) label: string = 'Label';`), config);

    expect(compareSemanticFingerprints(reordered.fingerprint, before.fingerprint).equal).toBe(true);
  });

  it.each([
    ['JSDoc', '/** Label docs. */', '/** Different docs. */'],
    ['decorator', '@Prop({ reflect: true })', '@Prop({ mutable: true })'],
    ['name', 'label: string', 'caption: string'],
    ['type', 'label: string', 'label: string | null'],
    ['initializer', "= 'Label'", "= 'Changed'"],
    ['optional token', 'value?: number', 'value!: number'],
  ])('detects a %s mutation', (_name, beforeText, afterText) => {
    const source = `  /** Label docs. */
  @Prop({ reflect: true }) label: string = 'Label';
  @Prop() value?: number;`;
    const before = checkFixture(componentSource(source), config).fingerprint;
    const after = checkFixture(componentSource(source.replace(beforeText, afterText)), config).fingerprint;

    expect(compareSemanticFingerprints(after, before)).toMatchObject({ equal: false });
  });

  it('refuses to write a fingerprint inside src', () => {
    const result = checkFixture(componentSource('  @Prop() label?: string;'), fixtureConfig({
      'content-data-identity': ['label'],
    }));
    const forbidden = resolve(process.cwd(), 'src/component-prop-fingerprint.json');

    expect(() => writeSemanticFingerprint(forbidden, result.fingerprint, process.cwd())).toThrow(/outside the source tree/);
  });
});

function snapshotSourceFiles(root: string): Map<string, string> {
  const output = new Map<string, string>();
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) walk(path);
      else output.set(path, readFileSync(path, 'utf8'));
    }
  };
  walk(resolve(root, 'src'));
  return output;
}

describe('CLI contract and read-only behavior', () => {
  it('returns exit 2 and a stable formatted diagnostic for bad CLI usage', () => {
    let stderr = '';
    const code = runCli(['--not-a-real-option'], {
      cwd: process.cwd(),
      stdout: () => undefined,
      stderr: (text) => { stderr += text; },
    });

    expect(code).toBe(2);
    expect(stderr).toContain('[CLI_USAGE]');
    const diagnostic: CheckerDiagnostic = {
      kind: 'policy',
      code: 'TEST',
      file: 'demo.tsx',
      line: 3,
      column: 5,
      scope: 'q-demo',
      prop: 'label',
      message: 'Demo message.',
    };
    expect(formatDiagnostic(diagnostic)).toBe('demo.tsx:3:5 [TEST] q-demo.label: Demo message.');
  });

  it('never changes source files in check, explain, JSON, fingerprint, or compare modes', () => {
    const root = mkdtempSync(join(tmpdir(), 'webquark-prop-order-'));
    temporaryDirectories.push(root);
    const sourcePath = join(root, 'src/browser/components/test/demo.tsx');
    mkdirSync(join(root, 'src/browser/components/test'), { recursive: true });
    writeFileSync(sourcePath, componentSource('  @Prop() label?: string;'), 'utf8');
    const config = fixtureConfig({ 'content-data-identity': ['label'] });
    const before = snapshotSourceFiles(root);
    const fingerprint = join(root, 'fingerprint.json');
    const silentIo = {
      cwd: root,
      stdout: () => undefined,
      stderr: () => undefined,
    };
    const dependencies = {
      check: () => checkPropOrder({
        rootDir: root,
        config,
        sources: [{ filePath: sourcePath, text: readFileSync(sourcePath, 'utf8') }],
      }),
    };

    runCli([], silentIo, dependencies);
    runCli(['--explain'], silentIo, dependencies);
    runCli(['--json'], silentIo, dependencies);
    expect(runCli(['--fingerprint', fingerprint], silentIo, dependencies)).toBe(0);
    expect(runCli(['--compare', fingerprint], silentIo, dependencies)).toBe(0);

    expect(snapshotSourceFiles(root)).toEqual(before);
  });
});
