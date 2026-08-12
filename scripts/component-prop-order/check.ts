#!/usr/bin/env bun

import { pathToFileURL } from 'node:url';

import {
  checkPropOrder,
  compareSemanticFingerprints,
  formatDiagnostic,
  readSemanticFingerprint,
  writeSemanticFingerprint,
  type CheckerDiagnostic,
  type ExitCode,
} from './checker';

export interface CliIo {
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export interface CliDependencies {
  check?: typeof checkPropOrder;
  compareFingerprints?: typeof compareSemanticFingerprints;
  readFingerprint?: typeof readSemanticFingerprint;
  writeFingerprint?: typeof writeSemanticFingerprint;
}

interface CliOptions {
  category?: string;
  component?: string;
  explain: boolean;
  json: boolean;
  fingerprint?: string;
  compare?: string;
  help: boolean;
}

const USAGE = `Usage: bun run check:prop-order [options]

Options:
  --category <name>         Check one component category
  --component <tag>         Check one component tag
  --explain                 Print each prop's base and effective group
  --json                    Emit machine-readable JSON
  --fingerprint <file>      Write an order-insensitive semantic fingerprint
  --compare <file>          Compare against a semantic fingerprint
  --help                    Show this help`;

function cliDiagnostic(code: string, message: string): CheckerDiagnostic {
  return {
    kind: 'operational',
    code,
    file: 'scripts/component-prop-order/check.ts',
    line: 1,
    column: 1,
    message,
  };
}

function parseArguments(argv: readonly string[]): { options?: CliOptions; diagnostic?: CheckerDiagnostic } {
  const options: CliOptions = { explain: false, json: false, help: false };
  const seen = new Set<string>();
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--') continue;
    if (argument === '--explain' || argument === '--json' || argument === '--help') {
      const key = argument.slice(2) as 'explain' | 'json' | 'help';
      options[key] = true;
      continue;
    }
    if (
      argument === '--category'
      || argument === '--component'
      || argument === '--fingerprint'
      || argument === '--compare'
    ) {
      if (seen.has(argument)) {
        return { diagnostic: cliDiagnostic('CLI_USAGE', `${argument} may be supplied only once.`) };
      }
      seen.add(argument);
      const value = argv[++index];
      if (!value || value.startsWith('--')) {
        return { diagnostic: cliDiagnostic('CLI_USAGE', `${argument} requires a value.`) };
      }
      const key = argument.slice(2) as 'category' | 'component' | 'fingerprint' | 'compare';
      options[key] = value;
      continue;
    }
    return { diagnostic: cliDiagnostic('CLI_USAGE', `Unknown option ${argument}.`) };
  }
  if (options.fingerprint && options.compare) {
    return { diagnostic: cliDiagnostic('CLI_USAGE', '--fingerprint and --compare are mutually exclusive.') };
  }
  return { options };
}

function emitJson(
  io: CliIo,
  exitCode: ExitCode,
  result: ReturnType<typeof checkPropOrder> | undefined,
  diagnostics: readonly CheckerDiagnostic[],
  extra: Record<string, unknown> = {},
): void {
  io.stdout(`${JSON.stringify({
    ok: exitCode === 0,
    exitCode,
    summary: result?.summary,
    diagnostics,
    explanations: result?.explanations,
    fingerprint: result?.fingerprint,
    ...extra,
  }, null, 2)}\n`);
}

export function runCli(
  argv: readonly string[],
  io: CliIo = {
    cwd: process.cwd(),
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  },
  dependencies: CliDependencies = {},
): ExitCode {
  const parsed = parseArguments(argv);
  if (!parsed.options) {
    const diagnostic = parsed.diagnostic ?? cliDiagnostic('CLI_USAGE', 'Invalid arguments.');
    const wantsJson = argv.includes('--json');
    if (wantsJson) emitJson(io, 2, undefined, [diagnostic]);
    else io.stderr(`${formatDiagnostic(diagnostic)}\n\n${USAGE}\n`);
    return 2;
  }
  const options = parsed.options;
  if (options.help) {
    if (options.json) emitJson(io, 0, undefined, [], { usage: USAGE });
    else io.stdout(`${USAGE}\n`);
    return 0;
  }

  const check = dependencies.check ?? checkPropOrder;
  const result = check({
    rootDir: io.cwd,
    category: options.category,
    component: options.component,
    explain: options.explain,
  });
  const diagnostics = [...result.diagnostics];
  let exitCode = result.exitCode;
  let comparison: ReturnType<typeof compareSemanticFingerprints> | undefined;

  if (options.fingerprint && exitCode !== 2) {
    try {
      (dependencies.writeFingerprint ?? writeSemanticFingerprint)(options.fingerprint, result.fingerprint, io.cwd);
    } catch (error) {
      diagnostics.push(cliDiagnostic(
        'FINGERPRINT_WRITE_ERROR',
        error instanceof Error ? error.message : String(error),
      ));
      exitCode = 2;
    }
  }

  if (options.compare && exitCode !== 2) {
    try {
      comparison = (dependencies.compareFingerprints ?? compareSemanticFingerprints)(
        result.fingerprint,
        (dependencies.readFingerprint ?? readSemanticFingerprint)(options.compare),
      );
      if (!comparison.equal) {
        diagnostics.push({
          kind: 'policy',
          code: 'FINGERPRINT_MISMATCH',
          file: options.compare,
          line: 1,
          column: 1,
          message: comparison.message,
        });
        exitCode = 1;
      }
    } catch (error) {
      diagnostics.push(cliDiagnostic(
        'FINGERPRINT_READ_ERROR',
        error instanceof Error ? error.message : String(error),
      ));
      exitCode = 2;
    }
  }

  if (options.json) {
    emitJson(io, exitCode, result, diagnostics, {
      fingerprintFile: options.fingerprint,
      comparison,
    });
    return exitCode;
  }

  for (const diagnostic of diagnostics) io.stderr(`${formatDiagnostic(diagnostic)}\n`);
  if (options.explain) {
    for (const explanation of result.explanations) {
      const cluster = explanation.cluster ? `, cluster ${explanation.cluster}` : '';
      const base = explanation.baseGroup === explanation.effectiveGroup
        ? explanation.baseGroup
        : `${explanation.effectiveGroup} (base ${explanation.baseGroup})`;
      io.stdout(
        `${explanation.file}:${explanation.line} ${explanation.scope}.${explanation.prop} -> ${base}${cluster}\n`,
      );
    }
  }
  if (options.fingerprint && exitCode !== 2) {
    io.stdout(`Wrote semantic fingerprint to ${options.fingerprint} (${result.fingerprint.hash}).\n`);
  }
  if (comparison?.equal) io.stdout(`${comparison.message}\n`);
  if (exitCode === 0) {
    io.stdout(
      `Prop order check passed for ${result.summary.checkedComponentCount} components and ${result.summary.checkedMixinFactoryCount} mixins (${result.fingerprint.sourceDeclarationCount} source declarations, ${result.fingerprint.effectiveComponentPropCount} effective props).\n`,
    );
  }
  return exitCode;
}

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectExecution) process.exitCode = runCli(process.argv.slice(2));
