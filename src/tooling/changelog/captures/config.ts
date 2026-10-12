import { assertCaptureOutput } from '../shared/capture-format.js';
import { projectPath, requireCaptureContentConfig, validateChangelogConfig, type ChangelogConfig } from '../config/index.js';
import type { CaptureAdapter, CaptureJob } from '../adapters/capture.js';

export type CaptureFocusContext = { top?: number; right?: number; bottom?: number; left?: number };
export type CaptureFocus = { target: string; context?: CaptureFocusContext };

export function normalizeCaptureFocus(input: unknown, location = 'focus'): CaptureFocus & { context: Required<CaptureFocusContext> } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(`${location} must be an object.`);
  const focus = input as Record<string, unknown>;
  const unknown = Object.keys(focus).filter(key => !['target', 'context'].includes(key));
  if (unknown.length) throw new Error(`${location} has unsupported fields: ${unknown.join(', ')}.`);
  if (typeof focus.target !== 'string' || !focus.target.trim()) throw new Error(`${location}.target must be a non-empty named target.`);
  if (focus.context !== undefined && (!focus.context || typeof focus.context !== 'object' || Array.isArray(focus.context))) throw new Error(`${location}.context must be an object.`);
  const margins = (focus.context ?? {}) as Record<string, unknown>;
  const edges = ['top', 'right', 'bottom', 'left'] as const;
  const unknownEdges = Object.keys(margins).filter(key => !edges.includes(key as typeof edges[number]));
  if (unknownEdges.length) throw new Error(`${location}.context has unsupported fields: ${unknownEdges.join(', ')}.`);
  const context = {} as Required<CaptureFocusContext>;
  for (const edge of edges) {
    const value = margins[edge] ?? 0;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100 || margins[edge] === null) throw new Error(`${location}.context.${edge} must be a finite percentage between 0 and 100.`);
    context[edge] = value;
  }
  return { target: focus.target, context };
}


export function captureCommandHelp(command?: string): string {
  if (command === 'publish') return [
    'Usage: wq-changelog capture publish <run-id> --config <project-config-module>',
    'Save the exact passed, cleanup-verified staged run after reviewing its images and report.',
    'Publication revalidates current inputs and staged bytes; it does not start capture resources.',
  ].join('\n');
  if (command === 'stage') return [
    'Usage: wq-changelog capture stage --config <project-config-module> [--scenario <id>] [--watch]',
    'Stage images and a report for review without replacing release images. Repeat --scenario to select multiple jobs.',
    'Requires metadata, staging/feed configuration, and captureAdapter or loadCaptureAdapter in the config module.',
  ].join('\n');
  return [
    'Usage: wq-changelog capture stage --config <project-config-module> [--scenario <id>] [--watch]',
    '       wq-changelog capture publish <run-id> --config <project-config-module>',
    'Review the staged images/report before publishing their exact run ID.',
    'Legacy: capture [--scenario <id>] [--watch] [--stage-only] | capture --publish-run <run-id>.',
    'Legacy custom captures save immediately unless --stage-only; generic page captures require staging.',
  ].join('\n');
}

export function parseArguments(arguments_: string[]) {
  const tokens = [...arguments_];
  const command = tokens[0] === 'stage' || tokens[0] === 'publish' ? tokens.shift() : undefined;
  const selected: string[] = [];
  let watch = false;
  let help = false;
  let stageOnly = command === 'stage';
  let publishRun: string | undefined;
  if (command === 'publish') {
    if (tokens.includes('--help') || tokens.includes('-h')) return { selected, watch, help: true, stageOnly };
    if (tokens.length !== 1 || !tokens[0] || tokens[0].startsWith('-')) throw new Error('capture publish requires one staged run ID and no capture options.');
    return { selected, watch, help, stageOnly, publishRun: tokens[0] };
  }
  for (let index = 0; index < tokens.length; index++) {
    const argument = tokens[index];
    if (argument === '--watch') watch = true;
    else if (argument === '--stage-only') stageOnly = true;
    else if (argument === '--publish-run') {
      if (command === 'stage') throw new Error('capture stage cannot publish a run; use capture publish <run-id>.');
      const value = tokens[++index];
      if (!value || value.startsWith('--') || publishRun) throw new Error('--publish-run requires one staged run ID.');
      publishRun = value;
    }
    else if (argument === '--help' || argument === '-h') help = true;
    else if (argument === '--scenario') {
      const scenario = tokens[++index];
      if (!scenario || scenario.startsWith('--')) throw new Error('--scenario requires a configured capture ID.');
      selected.push(scenario);
    } else throw new Error(`Unknown capture option: ${argument}`);
  }
  if (publishRun && (selected.length || watch || stageOnly)) throw new Error('--publish-run cannot be combined with selection, watch or stage-only.');
  return { selected, watch, help, stageOnly, ...(publishRun ? { publishRun } : {}) };
}

/** JSON selects reviewed jobs only; project code owns registry admission. */
export async function readCaptureConfiguration<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>) {
  requireCaptureContentConfig(config);
  await validateChangelogConfig(config);
  if (!adapter.id || !adapter.revision || typeof adapter.validateReviewedEvidence !== 'function') throw new Error('Capture requires a reviewed adapter with mandatory evidence validation.');
  const configuration = await adapter.readConfiguration(config);
  if (configuration.path !== projectPath(config, `${config.unreleasedDirectory}/captures.json`)) throw new Error('Capture configuration must be active Unreleased captures.json.');
  const ids = new Set<string>(), outputs = new Set<string>();
  for (const entry of configuration.entries) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || ids.has(entry.id)) throw new Error(`Invalid or duplicate capture ID: ${entry.id}.`);
    assertCaptureOutput(entry.output, entry.format, `capture ${entry.id}`);
    if (outputs.has(entry.output.toLowerCase())) throw new Error(`Duplicate capture output: ${entry.output}.`);
    if (entry.mode !== 'custom' && entry.mode !== 'page') throw new Error(`Unsupported capture mode: ${entry.id}.`);
    for (const value of [entry.viewport.width, entry.viewport.height]) if (!Number.isInteger(value) || value < 1 || value > 8192) throw new Error(`Invalid viewport: ${entry.id}.`);
    if (typeof entry.fullPage !== 'boolean') throw new Error(`Invalid fullPage: ${entry.id}.`);
    ids.add(entry.id); outputs.add(entry.output.toLowerCase());
  }
  return configuration;
}
