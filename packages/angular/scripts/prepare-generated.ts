import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

type TextEdit = {
  position: number;
  text: string;
};

const generatedDirectory = resolve(import.meta.dir, '../src/stencil-generated');
const generatedFiles = [
  'components.ts',
  'value-accessor.ts',
  'text-value-accessor.ts',
  'select-value-accessor.ts',
  'boolean-value-accessor.ts',
];

function propertyName(property: ts.ObjectLiteralElementLike): string | undefined {
  const name = property.name;
  if (!name) {
    return undefined;
  }

  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }

  return undefined;
}

function standaloneEdits(filePath: string, source: string): TextEdit[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const edits: TextEdit[] = [];
  let declarationCount = 0;

  function visit(node: ts.Node): void {
    if (ts.isClassDeclaration(node)) {
      for (const decorator of ts.getDecorators(node) ?? []) {
        if (!ts.isCallExpression(decorator.expression)) {
          continue;
        }

        const expression = decorator.expression.expression;
        if (
          !ts.isIdentifier(expression) ||
          (expression.text !== 'Component' && expression.text !== 'Directive')
        ) {
          continue;
        }

        const metadata = decorator.expression.arguments[0];
        if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
          throw new Error(
            `${filePath} contains an unsupported @${expression.text} decorator`,
          );
        }

        declarationCount += 1;
        const standaloneProperty = metadata.properties.find(
          property => propertyName(property) === 'standalone',
        );

        if (standaloneProperty) {
          if (
            !ts.isPropertyAssignment(standaloneProperty) ||
            standaloneProperty.initializer.kind !== ts.SyntaxKind.TrueKeyword
          ) {
            throw new Error(
              `${filePath} contains a generated declaration that is not standalone`,
            );
          }
          continue;
        }

        const openingBrace = metadata.getStart(sourceFile);
        const text =
          metadata.properties.length === 0
            ? ' standalone: true '
            : '\n  standalone: true,';
        edits.push({ position: openingBrace + 1, text });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (declarationCount === 0) {
    throw new Error(
      `${filePath} does not contain an Angular component or directive`,
    );
  }

  return edits;
}

function esmImportEdits(filePath: string, source: string): TextEdit[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const edits: TextEdit[] = [];

  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      if (
        specifier.startsWith('.') &&
        !specifier.endsWith('.js') &&
        !specifier.endsWith('.json')
      ) {
        edits.push({
          position: node.moduleSpecifier.end - 1,
          text: '.js',
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return edits;
}

let updatedDeclarationCount = 0;
let updatedImportCount = 0;

for (const generatedFile of generatedFiles) {
  const filePath = resolve(generatedDirectory, generatedFile);
  if (!existsSync(filePath)) {
    throw new Error(
      `Missing ${filePath}. Run the root WebQuark build to regenerate Angular sources.`,
    );
  }

  const source = readFileSync(filePath, 'utf8');
  const standalone = standaloneEdits(filePath, source);
  const esmImports = esmImportEdits(filePath, source);
  const edits = [...standalone, ...esmImports];
  if (edits.length === 0) {
    continue;
  }

  const updated = edits
    .sort((left, right) => right.position - left.position)
    .reduce(
      (content, edit) =>
        content.slice(0, edit.position) + edit.text + content.slice(edit.position),
      source,
    );
  writeFileSync(filePath, updated);
  updatedDeclarationCount += standalone.length;
  updatedImportCount += esmImports.length;
}

console.log(
  [
    updatedDeclarationCount === 0
      ? 'Generated Angular declarations are already standalone.'
      : `Marked ${updatedDeclarationCount} generated Angular declarations as standalone.`,
    updatedImportCount === 0
      ? 'Generated Angular relative imports already use ESM extensions.'
      : `Added ESM extensions to ${updatedImportCount} generated Angular relative imports.`,
  ].join('\n'),
);
