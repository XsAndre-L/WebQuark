import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import ts from 'typescript';

import {
  DEFAULT_PROP_ORDER_CONFIG,
  type NamedSection,
  type PropGroup,
  type PropOrderConfig,
  type RelationshipCluster,
} from './config';

export type ExitCode = 0 | 1 | 2;
export type DiagnosticKind = 'policy' | 'operational';

export interface CheckerDiagnostic {
  kind: DiagnosticKind;
  code: string;
  file: string;
  line: number;
  column: number;
  scope?: string;
  prop?: string;
  group?: PropGroup;
  expected?: string;
  message: string;
}

export interface SourceInput {
  filePath: string;
  text: string;
}

export interface CheckOptions {
  rootDir?: string;
  category?: string;
  component?: string;
  explain?: boolean;
  config?: PropOrderConfig;
  sources?: readonly SourceInput[];
}

export interface PropExplanation {
  file: string;
  line: number;
  scope: string;
  prop: string;
  baseGroup: PropGroup;
  effectiveGroup: PropGroup;
  cluster?: string;
  source: 'component' | 'mixin';
}

export interface FingerprintDeclaration {
  source: 'component' | 'mixin';
  scope: string;
  file: string;
  name: string;
  questionToken: boolean;
  exclamationToken: boolean;
  decorators: readonly string[];
  modifiers: readonly string[];
  type: string;
  initializer: string;
  jsDoc: readonly string[];
}

export interface SemanticFingerprint {
  version: 1;
  sourceDeclarationCount: number;
  effectiveComponentPropCount: number;
  hash: string;
  declarations: readonly FingerprintDeclaration[];
}

export interface CheckSummary {
  componentCount: number;
  mixinFactoryCount: number;
  sourceDeclarationCount: number;
  effectiveComponentPropCount: number;
  checkedComponentCount: number;
  checkedMixinFactoryCount: number;
}

export interface CheckResult {
  exitCode: ExitCode;
  diagnostics: readonly CheckerDiagnostic[];
  explanations: readonly PropExplanation[];
  summary: CheckSummary;
  fingerprint: SemanticFingerprint;
}

interface ImportBinding {
  imported: string;
  module: string;
}

interface StencilBindings {
  identifiers: ReadonlyMap<'Component' | 'Prop' | 'Mixin', ReadonlySet<string>>;
  namespaces: ReadonlySet<string>;
  imports: ReadonlyMap<string, ImportBinding>;
}

interface PropInfo {
  name: string;
  scope: string;
  source: 'component' | 'mixin';
  file: string;
  sourceFile: ts.SourceFile;
  node: ts.PropertyDeclaration;
  memberIndex: number;
  blockStart: number;
  line: number;
  column: number;
  baseGroup?: PropGroup;
  effectiveGroup?: PropGroup;
  cluster?: RelationshipCluster;
}

interface SourceBlock {
  scope: string;
  source: 'component' | 'mixin';
  file: string;
  category?: string;
  sourceFile: ts.SourceFile;
  classNode: ts.ClassDeclaration | ts.ClassExpression;
  props: PropInfo[];
  appliedMixins: string[];
}

interface RepositoryModel {
  rootDir: string;
  blocks: SourceBlock[];
  components: SourceBlock[];
  mixins: SourceBlock[];
  diagnostics: CheckerDiagnostic[];
}

const EMPTY_SUMMARY: CheckSummary = {
  componentCount: 0,
  mixinFactoryCount: 0,
  sourceDeclarationCount: 0,
  effectiveComponentPropCount: 0,
  checkedComponentCount: 0,
  checkedMixinFactoryCount: 0,
};

function normalizePath(value: string): string {
  return value.replaceAll('\\', '/');
}

function displayPath(rootDir: string, filePath: string): string {
  const output = relative(rootDir, filePath);
  return normalizePath(output || filePath);
}

function diagnosticAt(
  kind: DiagnosticKind,
  code: string,
  file: string,
  sourceFile: ts.SourceFile | undefined,
  position: number | undefined,
  message: string,
  details: Partial<Pick<CheckerDiagnostic, 'scope' | 'prop' | 'group' | 'expected'>> = {},
): CheckerDiagnostic {
  const location = sourceFile && position !== undefined
    ? sourceFile.getLineAndCharacterOfPosition(Math.max(0, Math.min(position, sourceFile.text.length)))
    : { line: 0, character: 0 };

  return {
    kind,
    code,
    file: normalizePath(file),
    line: location.line + 1,
    column: location.character + 1,
    message,
    ...details,
  };
}

function sourceFileDiagnostics(sourceFile: ts.SourceFile, file: string): CheckerDiagnostic[] {
  const parseDiagnostics = (sourceFile as ts.SourceFile & {
    parseDiagnostics?: readonly ts.DiagnosticWithLocation[];
  }).parseDiagnostics ?? [];

  return parseDiagnostics.map((entry) => diagnosticAt(
    'operational',
    'PARSE_ERROR',
    file,
    sourceFile,
    entry.start,
    ts.flattenDiagnosticMessageText(entry.messageText, '\n'),
  ));
}

function getDecorators(node: ts.Node): readonly ts.Decorator[] {
  return ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : [];
}

function getStencilBindings(sourceFile: ts.SourceFile): StencilBindings {
  const identifiers = new Map<'Component' | 'Prop' | 'Mixin', Set<string>>([
    ['Component', new Set()],
    ['Prop', new Set()],
    ['Mixin', new Set()],
  ]);
  const namespaces = new Set<string>();
  const imports = new Map<string, ImportBinding>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const module = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (!clause) continue;

    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
      if (module === '@stencil/core') namespaces.add(clause.namedBindings.name.text);
      continue;
    }

    if (!clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
    for (const specifier of clause.namedBindings.elements) {
      if (specifier.isTypeOnly) continue;
      const imported = specifier.propertyName?.text ?? specifier.name.text;
      const local = specifier.name.text;
      imports.set(local, { imported, module });
      if (module === '@stencil/core' && (imported === 'Component' || imported === 'Prop' || imported === 'Mixin')) {
        identifiers.get(imported)?.add(local);
      }
    }
  }

  return { identifiers, namespaces, imports };
}

function decoratorMatches(
  decorator: ts.Decorator,
  symbol: 'Component' | 'Prop' | 'Mixin',
  bindings: StencilBindings,
): boolean {
  const expression = ts.isCallExpression(decorator.expression)
    ? decorator.expression.expression
    : decorator.expression;
  if (ts.isIdentifier(expression)) return bindings.identifiers.get(symbol)?.has(expression.text) ?? false;
  return ts.isPropertyAccessExpression(expression)
    && ts.isIdentifier(expression.expression)
    && bindings.namespaces.has(expression.expression.text)
    && expression.name.text === symbol;
}

function findDecorator(
  node: ts.Node,
  symbol: 'Component' | 'Prop' | 'Mixin',
  bindings: StencilBindings,
): ts.Decorator | undefined {
  return getDecorators(node).find((decorator) => decoratorMatches(decorator, symbol, bindings));
}

function propertyName(node: ts.PropertyDeclaration): string | undefined {
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) || ts.isNumericLiteral(node.name)) {
    return node.name.text;
  }
  return undefined;
}

function componentTag(
  node: ts.ClassDeclaration,
  decorator: ts.Decorator,
): string | undefined {
  if (!ts.isCallExpression(decorator.expression)) return undefined;
  const [argument] = decorator.expression.arguments;
  if (!argument || !ts.isObjectLiteralExpression(argument)) return undefined;
  for (const member of argument.properties) {
    if (!ts.isPropertyAssignment(member)) continue;
    const name = ts.isIdentifier(member.name) || ts.isStringLiteral(member.name) ? member.name.text : undefined;
    if (name === 'tag' && ts.isStringLiteralLike(member.initializer)) return member.initializer.text;
  }
  return undefined;
}

function propsFromClass(
  sourceFile: ts.SourceFile,
  classNode: ts.ClassDeclaration | ts.ClassExpression,
  bindings: StencilBindings,
  scope: string,
  source: 'component' | 'mixin',
  file: string,
  diagnostics: CheckerDiagnostic[],
): PropInfo[] {
  const props: PropInfo[] = [];
  classNode.members.forEach((member, memberIndex) => {
    if (!ts.isPropertyDeclaration(member) || !findDecorator(member, 'Prop', bindings)) return;
    const name = propertyName(member);
    if (!name) {
      diagnostics.push(diagnosticAt(
        'operational',
        'UNSUPPORTED_PROP_NAME',
        file,
        sourceFile,
        member.name.getStart(sourceFile),
        'Prop names must be identifiers or string/numeric literals.',
        { scope },
      ));
      return;
    }
    const location = sourceFile.getLineAndCharacterOfPosition(member.name.getStart(sourceFile));
    props.push({
      name,
      scope,
      source,
      file,
      sourceFile,
      node: member,
      memberIndex,
      blockStart: member.getStart(sourceFile, true),
      line: location.line + 1,
      column: location.character + 1,
    });
  });
  return props;
}

function normalizedModuleTarget(importer: string, module: string): string | undefined {
  if (!module.startsWith('.')) return undefined;
  const absolute = resolve(dirname(importer), module);
  return normalizePath(absolute).replace(/\.(?:tsx?|mts|cts)$/, '');
}

function normalizedConfiguredTarget(rootDir: string, file: string): string {
  return normalizePath(resolve(rootDir, file)).replace(/\.(?:tsx?|mts|cts)$/, '');
}

function appliedMixins(
  classNode: ts.ClassDeclaration,
  bindings: StencilBindings,
  sourcePath: string,
  rootDir: string,
  config: PropOrderConfig,
  file: string,
  diagnostics: CheckerDiagnostic[],
): string[] {
  const output: string[] = [];
  const extendsClause = classNode.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
  const expression = extendsClause?.types[0]?.expression;
  if (!expression || !ts.isCallExpression(expression)) return output;

  const callee = expression.expression;
  const isMixin = ts.isIdentifier(callee)
    ? bindings.identifiers.get('Mixin')?.has(callee.text) ?? false
    : ts.isPropertyAccessExpression(callee)
      && ts.isIdentifier(callee.expression)
      && bindings.namespaces.has(callee.expression.text)
      && callee.name.text === 'Mixin';
  if (!isMixin) return output;

  for (const argument of expression.arguments) {
    if (!ts.isIdentifier(argument)) {
      diagnostics.push(diagnosticAt(
        'operational',
        'UNSUPPORTED_MIXIN_ARGUMENT',
        file,
        classNode.getSourceFile(),
        argument.getStart(),
        'Stencil Mixin arguments must be imported configured factory identifiers.',
      ));
      continue;
    }
    const imported = bindings.imports.get(argument.text);
    const target = imported ? normalizedModuleTarget(sourcePath, imported.module) : undefined;
    const factory = imported && target
      ? config.mixinFactories.find((candidate) => (
        candidate.name === imported.imported
        && normalizedConfiguredTarget(rootDir, candidate.file) === target
      ))
      : undefined;
    if (!factory) {
      diagnostics.push(diagnosticAt(
        'operational',
        'UNKNOWN_MIXIN_FACTORY',
        file,
        classNode.getSourceFile(),
        argument.getStart(),
        `Mixin factory ${argument.text} is not explicitly configured.`,
      ));
      continue;
    }
    output.push(factory.name);
  }
  return output;
}

function categoryFromFile(rootDir: string, sourcePath: string): string | undefined {
  const rel = normalizePath(relative(resolve(rootDir, 'src/components'), sourcePath));
  if (rel.startsWith('../')) return undefined;
  return rel.split('/')[0];
}

function visitDescendants(node: ts.Node, visitor: (node: ts.Node) => void): void {
  visitor(node);
  node.forEachChild((child) => visitDescendants(child, visitor));
}

function findMixinClass(
  sourceFile: ts.SourceFile,
  factoryName: string,
): ts.ClassDeclaration | ts.ClassExpression | undefined {
  let found: ts.ClassDeclaration | ts.ClassExpression | undefined;
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== factoryName || !declaration.initializer) continue;
      visitDescendants(declaration.initializer, (candidate) => {
        if (!found && (ts.isClassDeclaration(candidate) || ts.isClassExpression(candidate))) found = candidate;
      });
    }
  }
  return found;
}

function listComponentSourcePaths(rootDir: string): string[] {
  const componentRoot = resolve(rootDir, 'src/components');
  if (!existsSync(componentRoot)) return [];
  const output: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory).sort()) {
      const fullPath = resolve(directory, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        walk(fullPath);
      } else if (/\.tsx$/.test(entry) && !/\.(?:test|spec|cmp)\.tsx$/.test(entry)) {
        output.push(fullPath);
      }
    }
  };
  walk(componentRoot);
  return output;
}

function buildSourceInputs(rootDir: string, config: PropOrderConfig): SourceInput[] {
  const paths = new Set(listComponentSourcePaths(rootDir));
  for (const factory of config.mixinFactories) paths.add(resolve(rootDir, factory.file));
  return [...paths].sort().map((filePath) => ({ filePath, text: readFileSync(filePath, 'utf8') }));
}

function buildModel(options: CheckOptions): RepositoryModel {
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const config = options.config ?? DEFAULT_PROP_ORDER_CONFIG;
  const diagnostics: CheckerDiagnostic[] = [];
  const blocks: SourceBlock[] = [];
  const inputs = options.sources
    ? options.sources.map((input) => ({
      filePath: isAbsolute(input.filePath) ? input.filePath : resolve(rootDir, input.filePath),
      text: input.text,
    }))
    : buildSourceInputs(rootDir, config);
  const parsed = new Map<string, { sourceFile: ts.SourceFile; bindings: StencilBindings }>();

  for (const input of inputs) {
    const sourcePath = resolve(input.filePath);
    const file = displayPath(rootDir, sourcePath);
    const sourceFile = ts.createSourceFile(
      sourcePath,
      input.text,
      ts.ScriptTarget.Latest,
      true,
      sourcePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    diagnostics.push(...sourceFileDiagnostics(sourceFile, file));
    parsed.set(normalizePath(sourcePath), { sourceFile, bindings: getStencilBindings(sourceFile) });
  }

  for (const [sourcePath, entry] of parsed) {
    const { sourceFile, bindings } = entry;
    const file = displayPath(rootDir, sourcePath);
    for (const statement of sourceFile.statements) {
      if (!ts.isClassDeclaration(statement)) continue;
      const decorator = findDecorator(statement, 'Component', bindings);
      if (!decorator) continue;
      const tag = componentTag(statement, decorator);
      if (!tag) {
        diagnostics.push(diagnosticAt(
          'operational',
          'INVALID_COMPONENT_TAG',
          file,
          sourceFile,
          decorator.getStart(sourceFile),
          'The @Component decorator must contain a static string tag.',
        ));
        continue;
      }
      blocks.push({
        scope: tag,
        source: 'component',
        file,
        category: categoryFromFile(rootDir, sourcePath),
        sourceFile,
        classNode: statement,
        props: propsFromClass(sourceFile, statement, bindings, tag, 'component', file, diagnostics),
        appliedMixins: appliedMixins(statement, bindings, sourcePath, rootDir, config, file, diagnostics),
      });
    }
  }

  for (const factory of config.mixinFactories) {
    const sourcePath = normalizePath(resolve(rootDir, factory.file));
    const entry = parsed.get(sourcePath);
    if (!entry) {
      diagnostics.push(diagnosticAt(
        'operational',
        'MISSING_MIXIN_SOURCE',
        normalizePath(factory.file),
        undefined,
        undefined,
        `Configured mixin source does not exist or was not loaded: ${factory.file}.`,
        { scope: factory.name },
      ));
      continue;
    }
    const classNode = findMixinClass(entry.sourceFile, factory.name);
    if (!classNode) {
      diagnostics.push(diagnosticAt(
        'operational',
        'MISSING_MIXIN_FACTORY',
        displayPath(rootDir, sourcePath),
        entry.sourceFile,
        0,
        `Configured mixin factory ${factory.name} does not contain a class.`,
        { scope: factory.name },
      ));
      continue;
    }
    const file = displayPath(rootDir, sourcePath);
    blocks.push({
      scope: factory.name,
      source: 'mixin',
      file,
      category: categoryFromFile(rootDir, sourcePath),
      sourceFile: entry.sourceFile,
      classNode,
      props: propsFromClass(entry.sourceFile, classNode, entry.bindings, factory.name, 'mixin', file, diagnostics),
      appliedMixins: [],
    });
  }

  const components = blocks.filter((block) => block.source === 'component');
  const mixins = blocks.filter((block) => block.source === 'mixin');
  const seenScopes = new Set<string>();
  for (const block of blocks) {
    if (seenScopes.has(block.scope)) {
      diagnostics.push(diagnosticAt(
        'operational',
        'DUPLICATE_SCOPE',
        block.file,
        block.sourceFile,
        block.classNode.getStart(block.sourceFile),
        `Duplicate component tag or mixin factory scope ${block.scope}.`,
        { scope: block.scope },
      ));
    }
    seenScopes.add(block.scope);
  }

  return { rootDir, blocks, components, mixins, diagnostics };
}

function buildClassificationMap(
  config: PropOrderConfig,
  diagnostics: CheckerDiagnostic[],
): Map<string, PropGroup> {
  const map = new Map<string, PropGroup>();
  const configuredGroups = new Set(config.groups);
  for (const entry of config.classifications) {
    if (!configuredGroups.has(entry.group)) {
      diagnostics.push(diagnosticAt(
        'operational',
        'INVALID_GROUP',
        'scripts/component-prop-order/config.ts',
        undefined,
        undefined,
        `Classification uses unknown group ${entry.group}.`,
      ));
      continue;
    }
    for (const prop of entry.props) {
      const prior = map.get(prop);
      if (prior) {
        diagnostics.push(diagnosticAt(
          'operational',
          'DUPLICATE_CLASSIFICATION',
          'scripts/component-prop-order/config.ts',
          undefined,
          undefined,
          `Prop ${prop} is classified in both ${prior} and ${entry.group}.`,
          { prop, group: entry.group, expected: prior },
        ));
      } else {
        map.set(prop, entry.group);
      }
    }
  }
  return map;
}

function effectivePropsForComponent(component: SourceBlock, mixins: ReadonlyMap<string, SourceBlock>): PropInfo[] {
  const output: PropInfo[] = [];
  for (const factory of component.appliedMixins) {
    const mixin = mixins.get(factory);
    if (mixin) output.push(...mixin.props);
  }
  output.push(...component.props);
  return output;
}

function effectiveNamesForScope(scope: string, model: RepositoryModel): Set<string> | undefined {
  const block = model.blocks.find((candidate) => candidate.scope === scope);
  if (!block) return undefined;
  if (block.source === 'mixin') return new Set(block.props.map((prop) => prop.name));
  const mixins = new Map(model.mixins.map((mixin) => [mixin.scope, mixin]));
  return new Set(effectivePropsForComponent(block, mixins).map((prop) => prop.name));
}

function validateConfiguration(
  config: PropOrderConfig,
  model: RepositoryModel,
  classifications: ReadonlyMap<string, PropGroup>,
): CheckerDiagnostic[] {
  const diagnostics: CheckerDiagnostic[] = [];
  const actualNames = new Set(model.blocks.flatMap((block) => block.props.map((prop) => prop.name)));
  for (const prop of classifications.keys()) {
    if (!actualNames.has(prop)) {
      diagnostics.push(diagnosticAt(
        'operational',
        'STALE_CLASSIFICATION',
        'scripts/component-prop-order/config.ts',
        undefined,
        undefined,
        `Classified prop ${prop} is not declared by any component or configured mixin.`,
        { prop, group: classifications.get(prop) },
      ));
    }
  }

  const overrideKeys = new Set<string>();
  for (const override of config.overrides) {
    const key = `${override.scope}\0${override.prop}`;
    if (overrideKeys.has(key)) {
      diagnostics.push(diagnosticAt(
        'operational',
        'DUPLICATE_OVERRIDE',
        'scripts/component-prop-order/config.ts',
        undefined,
        undefined,
        `Duplicate override for ${override.scope}.${override.prop}.`,
        { scope: override.scope, prop: override.prop, group: override.group },
      ));
    }
    overrideKeys.add(key);
    const names = effectiveNamesForScope(override.scope, model);
    if (!names?.has(override.prop)) {
      diagnostics.push(diagnosticAt(
        'operational',
        'STALE_OVERRIDE',
        'scripts/component-prop-order/config.ts',
        undefined,
        undefined,
        `Override ${override.scope}.${override.prop} does not match an effective prop.`,
        { scope: override.scope, prop: override.prop, group: override.group },
      ));
    }
  }

  const clusterIds = new Set<string>();
  const clusteredProps = new Map<string, string>();
  for (const cluster of config.clusters) {
    if (clusterIds.has(cluster.id)) {
      diagnostics.push(diagnosticAt(
        'operational',
        'DUPLICATE_CLUSTER_ID',
        'scripts/component-prop-order/config.ts',
        undefined,
        undefined,
        `Relationship cluster id ${cluster.id} is duplicated.`,
        { scope: cluster.scope },
      ));
    }
    clusterIds.add(cluster.id);
    if (!effectiveNamesForScope(cluster.scope, model)) {
      diagnostics.push(diagnosticAt(
        'operational',
        'STALE_CLUSTER_SCOPE',
        'scripts/component-prop-order/config.ts',
        undefined,
        undefined,
        `Relationship cluster ${cluster.id} targets unknown scope ${cluster.scope}.`,
        { scope: cluster.scope },
      ));
    }
    if (cluster.props.length < 2 || new Set(cluster.props).size !== cluster.props.length) {
      diagnostics.push(diagnosticAt(
        'operational',
        'INVALID_CLUSTER',
        'scripts/component-prop-order/config.ts',
        undefined,
        undefined,
        `Relationship cluster ${cluster.id} must contain at least two unique props.`,
        { scope: cluster.scope },
      ));
    }
    for (const prop of cluster.props) {
      const key = `${cluster.scope}\0${prop}`;
      const prior = clusteredProps.get(key);
      if (prior) {
        diagnostics.push(diagnosticAt(
          'operational',
          'OVERLAPPING_CLUSTERS',
          'scripts/component-prop-order/config.ts',
          undefined,
          undefined,
          `${cluster.scope}.${prop} appears in both ${prior} and ${cluster.id}.`,
          { scope: cluster.scope, prop },
        ));
      }
      clusteredProps.set(key, cluster.id);
      const override = config.overrides.find((candidate) => candidate.scope === cluster.scope && candidate.prop === prop);
      if (!override && !classifications.has(prop)) {
        diagnostics.push(diagnosticAt(
          'operational',
          'UNCLASSIFIED_CLUSTER_PROP',
          'scripts/component-prop-order/config.ts',
          undefined,
          undefined,
          `Cluster ${cluster.id} refers to unclassified prop ${prop}.`,
          { scope: cluster.scope, prop },
        ));
      }
    }
  }

  const sectionScopes = new Set<string>();
  for (const named of config.namedSections) {
    if (sectionScopes.has(named.scope)) {
      diagnostics.push(diagnosticAt(
        'operational',
        'DUPLICATE_SECTION_CONFIG',
        'scripts/component-prop-order/config.ts',
        undefined,
        undefined,
        `Named section configuration for ${named.scope} is duplicated.`,
        { scope: named.scope },
      ));
    }
    sectionScopes.add(named.scope);
    const names = effectiveNamesForScope(named.scope, model);
    if (!names) {
      diagnostics.push(diagnosticAt(
        'operational',
        'STALE_SECTION_SCOPE',
        'scripts/component-prop-order/config.ts',
        undefined,
        undefined,
        `Named sections target unknown scope ${named.scope}.`,
        { scope: named.scope },
      ));
      continue;
    }
    const listed = new Set<string>();
    for (const section of named.sections) {
      for (const prop of section.props) {
        if (listed.has(prop) || !names.has(prop)) {
          diagnostics.push(diagnosticAt(
            'operational',
            listed.has(prop) ? 'DUPLICATE_SECTION_PROP' : 'STALE_SECTION_PROP',
            'scripts/component-prop-order/config.ts',
            undefined,
            undefined,
            listed.has(prop)
              ? `${named.scope}.${prop} is listed in more than one named section.`
              : `${named.scope}.${prop} is not an effective prop.`,
            { scope: named.scope, prop },
          ));
        }
        listed.add(prop);
      }
    }
  }

  return diagnostics;
}

function groupForProp(
  scope: string,
  prop: string,
  config: PropOrderConfig,
  classifications: ReadonlyMap<string, PropGroup>,
): PropGroup | undefined {
  return config.overrides.find((entry) => entry.scope === scope && entry.prop === prop)?.group
    ?? classifications.get(prop);
}

interface SectionSlice {
  name?: string;
  props: PropInfo[];
  definition?: NamedSection;
  headerStart?: number;
  headerEnd?: number;
}

function lineRecords(text: string): Array<{ start: number; end: number; text: string }> {
  const records: Array<{ start: number; end: number; text: string }> = [];
  let start = 0;
  for (let index = 0; index <= text.length; index++) {
    if (index !== text.length && text[index] !== '\n' && text[index] !== '\r') continue;
    const end = index;
    records.push({ start, end, text: text.slice(start, end) });
    if (text[index] === '\r' && text[index + 1] === '\n') index++;
    start = index + 1;
  }
  return records;
}

function blankLineCount(gap: string): number | undefined {
  if (/\S/.test(gap)) return undefined;
  const lineBreaks = gap.match(/\r\n|\r|\n/g)?.length ?? 0;
  return Math.max(0, lineBreaks - 1);
}

function spacingDiagnostic(
  previous: PropInfo,
  next: PropInfo,
  expectedBlankLines: 0 | 1,
  actual: number | undefined,
): CheckerDiagnostic {
  return diagnosticAt(
    'policy',
    'PROP_SPACING',
    next.file,
    next.sourceFile,
    next.blockStart,
    actual === undefined
      ? `Only whitespace may separate consecutive props; expected ${expectedBlankLines} blank line${expectedBlankLines === 1 ? '' : 's'}.`
      : `Expected ${expectedBlankLines} blank line${expectedBlankLines === 1 ? '' : 's'} before ${next.name}, found ${actual}.`,
    {
      scope: next.scope,
      prop: next.name,
      group: next.effectiveGroup,
      expected: `${expectedBlankLines} blank line${expectedBlankLines === 1 ? '' : 's'} after ${previous.name}`,
    },
  );
}

function namedSectionSlices(
  block: SourceBlock,
  namedSections: readonly NamedSection[],
  diagnostics: CheckerDiagnostic[],
): SectionSlice[] {
  const classStart = block.classNode.getStart(block.sourceFile);
  const classEnd = block.classNode.end;
  const records = lineRecords(block.sourceFile.text).filter((line) => line.end >= classStart && line.start <= classEnd);
  const markers: Array<{ definition: NamedSection; start: number; end: number }> = [];

  for (const definition of namedSections) {
    const matches = records.filter((line) => line.text.trimStart().startsWith('//') && line.text.includes(definition.marker));
    if (matches.length !== 1) {
      diagnostics.push(diagnosticAt(
        'policy',
        'NAMED_SECTION_MARKER',
        block.file,
        block.sourceFile,
        block.classNode.getStart(block.sourceFile),
        `Expected exactly one ${definition.name} section marker containing "${definition.marker}", found ${matches.length}.`,
        { scope: block.scope, expected: definition.marker },
      ));
      continue;
    }
    const match = matches[0];
    markers.push({
      definition,
      start: match.start + match.text.indexOf('//'),
      end: match.end,
    });
  }

  const configuredOrder = new Map(namedSections.map((section, index) => [section.name, index]));
  const actualOrder = [...markers].sort((a, b) => a.start - b.start);
  if (actualOrder.some((entry, index) => configuredOrder.get(entry.definition.name) !== index)) {
    diagnostics.push(diagnosticAt(
      'policy',
      'NAMED_SECTION_ORDER',
      block.file,
      block.sourceFile,
      actualOrder[0]?.start ?? block.classNode.getStart(block.sourceFile),
      `Named sections must appear in this order: ${namedSections.map((section) => section.name).join(', ')}.`,
      { scope: block.scope },
    ));
  }

  const slices: SectionSlice[] = actualOrder.map((marker, index) => {
    const nextStart = actualOrder[index + 1]?.start ?? classEnd;
    return {
      name: marker.definition.name,
      definition: marker.definition,
      headerStart: marker.start,
      headerEnd: marker.end,
      props: block.props.filter((prop) => prop.blockStart > marker.end && prop.blockStart < nextStart),
    };
  });

  const assigned = new Set(slices.flatMap((section) => section.props));
  for (const prop of block.props) {
    if (!assigned.has(prop)) {
      diagnostics.push(diagnosticAt(
        'policy',
        'PROP_OUTSIDE_NAMED_SECTION',
        prop.file,
        prop.sourceFile,
        prop.blockStart,
        `${prop.name} must appear inside one of ${block.scope}'s configured named sections.`,
        { scope: block.scope, prop: prop.name },
      ));
    }
  }

  for (const slice of slices) {
    const expected = new Set(slice.definition?.props ?? []);
    const actual = new Set(slice.props.map((prop) => prop.name));
    for (const prop of actual) {
      if (!expected.has(prop)) {
        diagnostics.push(diagnosticAt(
          'policy',
          'WRONG_NAMED_SECTION',
          block.file,
          block.sourceFile,
          slice.props.find((candidate) => candidate.name === prop)?.blockStart,
          `${prop} does not belong in the ${slice.name} section.`,
          { scope: block.scope, prop, expected: slice.definition?.props.join(', ') },
        ));
      }
    }
    for (const prop of expected) {
      if (!actual.has(prop)) {
        diagnostics.push(diagnosticAt(
          'policy',
          'MISSING_NAMED_SECTION_PROP',
          block.file,
          block.sourceFile,
          slice.headerStart,
          `${prop} is missing from the ${slice.name} section.`,
          { scope: block.scope, prop, expected: slice.name },
        ));
      }
    }
    const first = slice.props[0];
    if (first && slice.headerEnd !== undefined) {
      const actualSpacing = blankLineCount(block.sourceFile.text.slice(slice.headerEnd, first.blockStart));
      if (actualSpacing !== 0) {
        diagnostics.push(diagnosticAt(
          'policy',
          'SECTION_HEADER_SPACING',
          block.file,
          block.sourceFile,
          first.blockStart,
          `The first prop in ${slice.name} must immediately follow its section header.`,
          { scope: block.scope, prop: first.name, expected: '0 blank lines after the section header' },
        ));
      }
    }
  }

  for (let index = 1; index < slices.length; index++) {
    const previous = slices[index - 1].props.at(-1);
    const current = slices[index];
    if (!previous || current.headerStart === undefined) continue;
    const actualSpacing = blankLineCount(block.sourceFile.text.slice(previous.node.end, current.headerStart));
    if (actualSpacing !== 1) {
      diagnostics.push(diagnosticAt(
        'policy',
        'SECTION_BOUNDARY_SPACING',
        block.file,
        block.sourceFile,
        current.headerStart,
        `Expected exactly one blank line before the ${current.name} section.`,
        { scope: block.scope, expected: '1 blank line between named sections' },
      ));
    }
  }

  return slices;
}

function applyClassifications(
  block: SourceBlock,
  config: PropOrderConfig,
  classifications: ReadonlyMap<string, PropGroup>,
  diagnostics: CheckerDiagnostic[],
): void {
  const clusters = config.clusters.filter((cluster) => cluster.scope === block.scope);
  for (const prop of block.props) {
    prop.baseGroup = groupForProp(block.scope, prop.name, config, classifications);
    if (!prop.baseGroup) {
      diagnostics.push(diagnosticAt(
        'policy',
        'UNCLASSIFIED_PROP',
        prop.file,
        prop.sourceFile,
        prop.node.name.getStart(prop.sourceFile),
        `${block.scope}.${prop.name} is not classified.`,
        { scope: block.scope, prop: prop.name },
      ));
      continue;
    }
    prop.cluster = clusters.find((cluster) => cluster.props.includes(prop.name));
    if (prop.cluster) {
      prop.effectiveGroup = groupForProp(block.scope, prop.cluster.props[0], config, classifications);
    } else {
      prop.effectiveGroup = prop.baseGroup;
    }
  }
}

function validateClusters(
  block: SourceBlock,
  props: readonly PropInfo[],
  config: PropOrderConfig,
  diagnostics: CheckerDiagnostic[],
): void {
  for (const cluster of config.clusters.filter((candidate) => candidate.scope === block.scope)) {
    const present = props.filter((prop) => cluster.props.includes(prop.name));
    if (present.length < 2) continue;
    const desired = cluster.props.filter((name) => present.some((prop) => prop.name === name));
    const actual = present.map((prop) => prop.name);
    if (actual.some((name, index) => name !== desired[index])) {
      const prop = present.find((entry, index) => entry.name !== desired[index]) ?? present[0];
      diagnostics.push(diagnosticAt(
        'policy',
        'CLUSTER_ORDER',
        prop.file,
        prop.sourceFile,
        prop.blockStart,
        `Cluster ${cluster.id} must follow ${desired.join(' -> ')}.`,
        { scope: block.scope, prop: prop.name, group: prop.effectiveGroup, expected: desired.join(', ') },
      ));
    }
    const bySourceOrder = [...present].sort((a, b) => a.memberIndex - b.memberIndex);
    for (let index = 1; index < bySourceOrder.length; index++) {
      if (bySourceOrder[index].memberIndex !== bySourceOrder[index - 1].memberIndex + 1) {
        diagnostics.push(diagnosticAt(
          'policy',
          'CLUSTER_CONTIGUITY',
          bySourceOrder[index].file,
          bySourceOrder[index].sourceFile,
          bySourceOrder[index].blockStart,
          `Cluster ${cluster.id} must be contiguous within this source block.`,
          {
            scope: block.scope,
            prop: bySourceOrder[index].name,
            group: bySourceOrder[index].effectiveGroup,
            expected: desired.join(', '),
          },
        ));
        break;
      }
    }
  }
}

function validateSectionOrderAndSpacing(
  block: SourceBlock,
  section: SectionSlice,
  config: PropOrderConfig,
  diagnostics: CheckerDiagnostic[],
): void {
  validateClusters(block, section.props, config, diagnostics);
  const groupIndex = new Map(config.groups.map((group, index) => [group, index]));
  let highest = -1;
  let highestProp: PropInfo | undefined;
  for (const prop of section.props) {
    if (!prop.effectiveGroup) continue;
    const current = groupIndex.get(prop.effectiveGroup);
    if (current === undefined) continue;
    if (current < highest) {
      diagnostics.push(diagnosticAt(
        'policy',
        'PROP_GROUP_ORDER',
        prop.file,
        prop.sourceFile,
        prop.blockStart,
        `${prop.name} (${prop.effectiveGroup}) must appear before ${highestProp?.name} (${highestProp?.effectiveGroup}).`,
        {
          scope: block.scope,
          prop: prop.name,
          group: prop.effectiveGroup,
          expected: `before ${highestProp?.name ?? 'later groups'}`,
        },
      ));
    } else if (current > highest) {
      highest = current;
      highestProp = prop;
    }
  }

  for (let index = 1; index < section.props.length; index++) {
    const previous = section.props[index - 1];
    const current = section.props[index];
    if (!previous.effectiveGroup || !current.effectiveGroup) continue;
    const expectedBlankLines: 0 | 1 = previous.effectiveGroup === current.effectiveGroup ? 0 : 1;
    const actual = blankLineCount(block.sourceFile.text.slice(previous.node.end, current.blockStart));
    if (actual !== expectedBlankLines) diagnostics.push(spacingDiagnostic(previous, current, expectedBlankLines, actual));
  }
}

function validateBlock(
  block: SourceBlock,
  config: PropOrderConfig,
  classifications: ReadonlyMap<string, PropGroup>,
  diagnostics: CheckerDiagnostic[],
): void {
  applyClassifications(block, config, classifications, diagnostics);
  const seen = new Set<string>();
  for (const prop of block.props) {
    if (seen.has(prop.name)) {
      diagnostics.push(diagnosticAt(
        'policy',
        'DUPLICATE_LOCAL_PROP',
        prop.file,
        prop.sourceFile,
        prop.blockStart,
        `${block.scope}.${prop.name} is declared more than once in the same source block.`,
        { scope: block.scope, prop: prop.name, group: prop.effectiveGroup },
      ));
    }
    seen.add(prop.name);
  }

  const named = config.namedSections.find((entry) => entry.scope === block.scope);
  const sections = named
    ? namedSectionSlices(block, named.sections, diagnostics)
    : [{ props: block.props } satisfies SectionSlice];
  for (const section of sections) validateSectionOrderAndSpacing(block, section, config, diagnostics);
}

function validateEffectiveDuplicates(
  components: readonly SourceBlock[],
  mixins: ReadonlyMap<string, SourceBlock>,
  diagnostics: CheckerDiagnostic[],
): void {
  for (const component of components) {
    const seen = new Map<string, PropInfo>();
    for (const prop of effectivePropsForComponent(component, mixins)) {
      const previous = seen.get(prop.name);
      if (previous) {
        diagnostics.push(diagnosticAt(
          'policy',
          'INHERITED_PROP_REDECLARATION',
          prop.file,
          prop.sourceFile,
          prop.blockStart,
          `${component.scope}.${prop.name} is provided by both ${previous.scope} and ${prop.scope}.`,
          { scope: component.scope, prop: prop.name, expected: `remove the local or duplicate inherited declaration` },
        ));
      } else {
        seen.set(prop.name, prop);
      }
    }
  }
}

function fingerprintDeclaration(prop: PropInfo): FingerprintDeclaration {
  const sourceFile = prop.sourceFile;
  const node = prop.node;
  const jsDocNodes = (node as ts.PropertyDeclaration & { jsDoc?: readonly ts.JSDoc[] }).jsDoc ?? [];
  return {
    source: prop.source,
    scope: prop.scope,
    file: prop.file,
    name: prop.name,
    questionToken: Boolean(node.questionToken),
    exclamationToken: Boolean(node.exclamationToken),
    decorators: getDecorators(node).map((decorator) => decorator.getText(sourceFile)),
    modifiers: (ts.getModifiers(node) ?? []).map((modifier) => modifier.getText(sourceFile)),
    type: node.type?.getText(sourceFile) ?? '',
    initializer: node.initializer?.getText(sourceFile) ?? '',
    jsDoc: jsDocNodes.map((doc) => doc.getText(sourceFile)),
  };
}

function fingerprintSortKey(entry: FingerprintDeclaration): string {
  return [entry.source, entry.scope, entry.file, entry.name, JSON.stringify(entry)].join('\0');
}

export function createSemanticFingerprint(
  blocks: readonly SourceBlock[],
  components: readonly SourceBlock[],
  mixins: ReadonlyMap<string, SourceBlock>,
): SemanticFingerprint {
  const declarations = blocks
    .flatMap((block) => block.props.map(fingerprintDeclaration))
    .sort((a, b) => fingerprintSortKey(a).localeCompare(fingerprintSortKey(b)));
  const payload = {
    version: 1 as const,
    sourceDeclarationCount: declarations.length,
    effectiveComponentPropCount: components.reduce(
      (total, component) => total + effectivePropsForComponent(component, mixins).length,
      0,
    ),
    declarations,
  };
  return {
    ...payload,
    hash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
  };
}

function emptyFingerprint(): SemanticFingerprint {
  const payload = {
    version: 1 as const,
    sourceDeclarationCount: 0,
    effectiveComponentPropCount: 0,
    declarations: [] as FingerprintDeclaration[],
  };
  return {
    ...payload,
    hash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
  };
}

function selectBlocks(
  model: RepositoryModel,
  options: CheckOptions,
  diagnostics: CheckerDiagnostic[],
): { components: SourceBlock[]; mixins: SourceBlock[]; blocks: SourceBlock[] } {
  const categories = new Set(model.components.map((component) => component.category).filter(Boolean));
  if (options.category && !categories.has(options.category)) {
    diagnostics.push(diagnosticAt(
      'operational',
      'UNKNOWN_CATEGORY',
      'src/components',
      undefined,
      undefined,
      `Unknown component category ${options.category}.`,
      { expected: [...categories].sort().join(', ') },
    ));
  }
  if (options.component && !model.components.some((component) => component.scope === options.component)) {
    diagnostics.push(diagnosticAt(
      'operational',
      'UNKNOWN_COMPONENT',
      'src/components',
      undefined,
      undefined,
      `Unknown component tag ${options.component}.`,
      { scope: options.component },
    ));
  }

  const components = model.components.filter((component) => (
    (!options.category || component.category === options.category)
    && (!options.component || component.scope === options.component)
  ));
  const neededMixins = new Set(components.flatMap((component) => component.appliedMixins));
  const unrestricted = !options.category && !options.component;
  const mixins = model.mixins.filter((mixin) => (
    unrestricted
    || neededMixins.has(mixin.scope)
    || (options.category !== undefined && mixin.category === options.category)
  ));
  return { components, mixins, blocks: [...components, ...mixins] };
}

function sortedDiagnostics(diagnostics: readonly CheckerDiagnostic[]): CheckerDiagnostic[] {
  return [...diagnostics].sort((a, b) => (
    a.file.localeCompare(b.file)
    || a.line - b.line
    || a.column - b.column
    || a.code.localeCompare(b.code)
    || (a.prop ?? '').localeCompare(b.prop ?? '')
  ));
}

function validateCanonicalGroupOrder(config: PropOrderConfig): CheckerDiagnostic[] {
  const actual = config.groups.join(',');
  const expected = DEFAULT_PROP_ORDER_CONFIG.groups.join(',');
  if (actual === expected) return [];
  return [diagnosticAt(
    'operational',
    'INVALID_GROUP_ORDER',
    'scripts/component-prop-order/config.ts',
    undefined,
    undefined,
    `Prop groups must use the canonical order: ${DEFAULT_PROP_ORDER_CONFIG.groups.join(', ')}.`,
    { expected: DEFAULT_PROP_ORDER_CONFIG.groups.join(', ') },
  )];
}

export function checkPropOrder(options: CheckOptions = {}): CheckResult {
  const config = options.config ?? DEFAULT_PROP_ORDER_CONFIG;
  try {
    const model = buildModel(options);
    const diagnostics: CheckerDiagnostic[] = [
      ...model.diagnostics,
      ...validateCanonicalGroupOrder(config),
    ];
    const classifications = buildClassificationMap(config, diagnostics);
    if (!model.diagnostics.some((entry) => entry.kind === 'operational')) {
      diagnostics.push(...validateConfiguration(config, model, classifications));
    }
    const selection = selectBlocks(model, options, diagnostics);
    for (const block of selection.blocks) validateBlock(block, config, classifications, diagnostics);
    const mixinMap = new Map(model.mixins.map((mixin) => [mixin.scope, mixin]));
    validateEffectiveDuplicates(selection.components, mixinMap, diagnostics);

    const explanations: PropExplanation[] = selection.blocks.flatMap((block) => block.props
      .filter((prop): prop is PropInfo & { baseGroup: PropGroup; effectiveGroup: PropGroup } => (
        Boolean(prop.baseGroup && prop.effectiveGroup)
      ))
      .map((prop) => ({
        file: prop.file,
        line: prop.line,
        scope: block.scope,
        prop: prop.name,
        baseGroup: prop.baseGroup,
        effectiveGroup: prop.effectiveGroup,
        cluster: prop.cluster?.id,
        source: block.source,
      })));
    explanations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

    const allMixinMap = new Map(model.mixins.map((mixin) => [mixin.scope, mixin]));
    const fingerprint = createSemanticFingerprint(selection.blocks, selection.components, allMixinMap);
    const summary: CheckSummary = {
      componentCount: model.components.length,
      mixinFactoryCount: model.mixins.length,
      sourceDeclarationCount: model.blocks.reduce((total, block) => total + block.props.length, 0),
      effectiveComponentPropCount: model.components.reduce(
        (total, component) => total + effectivePropsForComponent(component, allMixinMap).length,
        0,
      ),
      checkedComponentCount: selection.components.length,
      checkedMixinFactoryCount: selection.mixins.length,
    };
    const orderedDiagnostics = sortedDiagnostics(diagnostics);
    const exitCode: ExitCode = orderedDiagnostics.some((entry) => entry.kind === 'operational')
      ? 2
      : orderedDiagnostics.some((entry) => entry.kind === 'policy')
        ? 1
        : 0;
    return { exitCode, diagnostics: orderedDiagnostics, explanations, summary, fingerprint };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      exitCode: 2,
      diagnostics: [diagnosticAt(
        'operational',
        'OPERATIONAL_FAILURE',
        normalizePath(options.rootDir ?? process.cwd()),
        undefined,
        undefined,
        message,
      )],
      explanations: [],
      summary: EMPTY_SUMMARY,
      fingerprint: emptyFingerprint(),
    };
  }
}

export interface FingerprintComparison {
  equal: boolean;
  message: string;
}

export function compareSemanticFingerprints(
  current: SemanticFingerprint,
  baseline: SemanticFingerprint,
): FingerprintComparison {
  if (current.hash === baseline.hash && JSON.stringify(current) === JSON.stringify(baseline)) {
    return { equal: true, message: `Semantic fingerprint matches (${current.hash}).` };
  }
  const currentByKey = new Map(current.declarations.map((entry) => [
    `${entry.source}\0${entry.scope}\0${entry.file}\0${entry.name}`,
    JSON.stringify(entry),
  ]));
  const baselineByKey = new Map(baseline.declarations.map((entry) => [
    `${entry.source}\0${entry.scope}\0${entry.file}\0${entry.name}`,
    JSON.stringify(entry),
  ]));
  const changed = new Set<string>();
  for (const key of new Set([...currentByKey.keys(), ...baselineByKey.keys()])) {
    if (currentByKey.get(key) !== baselineByKey.get(key)) changed.add(key.split('\0').slice(1).join('.'));
  }
  return {
    equal: false,
    message: [
      `Semantic fingerprint differs: expected ${baseline.hash}, received ${current.hash}.`,
      changed.size ? `Changed declarations: ${[...changed].sort().join(', ')}.` : '',
    ].filter(Boolean).join(' '),
  };
}

function assertFingerprint(value: unknown): asserts value is SemanticFingerprint {
  if (!value || typeof value !== 'object') throw new Error('Fingerprint must be a JSON object.');
  const candidate = value as Partial<SemanticFingerprint>;
  if (candidate.version !== 1 || typeof candidate.hash !== 'string' || !Array.isArray(candidate.declarations)) {
    throw new Error('Unsupported or malformed fingerprint file.');
  }
}

export function readSemanticFingerprint(filePath: string): SemanticFingerprint {
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  assertFingerprint(parsed);
  return parsed;
}

export function writeSemanticFingerprint(
  filePath: string,
  fingerprint: SemanticFingerprint,
  rootDir: string = process.cwd(),
): void {
  const absolute = resolve(filePath);
  const sourceRoot = resolve(rootDir, 'src');
  const rel = relative(sourceRoot, absolute);
  if (rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))) {
    throw new Error('Fingerprint output must be a temporary path outside the source tree.');
  }
  writeFileSync(absolute, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
}

export function formatDiagnostic(diagnostic: CheckerDiagnostic): string {
  const subject = diagnostic.scope
    ? `${diagnostic.scope}${diagnostic.prop ? `.${diagnostic.prop}` : ''}: `
    : '';
  return `${diagnostic.file}:${diagnostic.line}:${diagnostic.column} [${diagnostic.code}] ${subject}${diagnostic.message}`;
}
