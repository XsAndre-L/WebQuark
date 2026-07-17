import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageDirectory = resolve(import.meta.dir, '..');

function compile(project: string) {
  const result = Bun.spawnSync({
    cmd: ['bunx', 'ngc', '-p', project],
    cwd: packageDirectory,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
    env: process.env,
  });
  const decoder = new TextDecoder();

  return {
    exitCode: result.exitCode,
    output: `${decoder.decode(result.stdout)}${decoder.decode(result.stderr)}`,
  };
}

const declarationFiles = [
  'dist/types/stencil-generated/components.d.ts',
  'dist/types/stencil-generated/value-accessor.d.ts',
  'dist/types/stencil-generated/text-value-accessor.d.ts',
  'dist/types/stencil-generated/select-value-accessor.d.ts',
  'dist/types/stencil-generated/boolean-value-accessor.d.ts',
];

let declarationCount = 0;
for (const declarationFile of declarationFiles) {
  const filePath = resolve(packageDirectory, declarationFile);
  const declarationLines = readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter(
      line =>
        line.includes('ɵɵComponentDeclaration') ||
        line.includes('ɵɵDirectiveDeclaration'),
    );

  if (declarationLines.length === 0) {
    throw new Error(`${declarationFile} contains no Angular declarations`);
  }

  for (const declarationLine of declarationLines) {
    if (!declarationLine.includes(', true, never>;')) {
      throw new Error(
        `${declarationFile} contains a non-standalone Angular declaration:\n${declarationLine.trim()}`,
      );
    }
  }
  declarationCount += declarationLines.length;
}

const valid = compile('consumer-tests/tsconfig.valid.json');
if (valid.exitCode !== 0) {
  throw new Error(`The valid standalone consumer did not compile:\n${valid.output}`);
}

const invalid = compile('consumer-tests/tsconfig.invalid.json');
if (
  invalid.exitCode === 0 ||
  !invalid.output.includes('definitelyNotAProperty')
) {
  throw new Error(
    `The invalid consumer did not fail with the expected strict-template diagnostic:\n${invalid.output}`,
  );
}

console.log(
  `Verified ${declarationCount} standalone declarations and strict Angular consumer compilation.`,
);
