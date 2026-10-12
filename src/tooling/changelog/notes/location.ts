import { requireMetadata, type ChangelogConfig } from '../config/index.js';
import { normalizeCaptureFormat } from '../shared/capture-format.js';
import type { ResolvedVisualMetadata, VisualLocation, VisualSubject } from '../adapters/metadata.js';
export type * from '../adapters/metadata.js';

/** Any contextual declaration opts into the complete metadata contract, including incomplete declarations. */
export function hasVisualMetadata(record: Record<string, unknown>): boolean {
  return ['location', 'subject', 'readerSteps', 'capture', 'guidance'].some(key => key in record);
}

export function validateVisualCapture(record: Record<string, unknown>, context: string): void {
  if (record['format'] !== undefined) throw new Error(`${context}.format: capture format belongs to its custom recipe or capture.format.`);
  for (const key of ['image', 'before', 'after']) if (record[key] && typeof record[key] === 'object' && 'format' in record[key]) throw new Error(`${context}.${key}.format: image references do not own capture format.`);
  if (record['capture'] === undefined) return;
  const capture = object(record['capture'], `${context}.capture`);
  exactKeys(capture, ['viewport', 'fullPage', 'format'], `${context}.capture`);
  normalizeCaptureFormat(capture['format'], `${context}.capture`);
  if (capture['fullPage'] !== undefined && typeof capture['fullPage'] !== 'boolean') throw new Error(`${context}.capture.fullPage: expected boolean.`);
  if (capture['viewport'] !== undefined) {
    const viewport = object(capture['viewport'], `${context}.capture.viewport`);
    exactKeys(viewport, ['width', 'height'], `${context}.capture.viewport`);
    for (const key of ['width', 'height']) if (typeof viewport[key] !== 'number' || !Number.isInteger(viewport[key]) || (viewport[key] as number) < 320 || (viewport[key] as number) > 4096) throw new Error(`${context}.capture.viewport.${key}: expected an integer in [320, 4096].`);
  }
}

export function validateVisualMetadata(record: Record<string, unknown>, context: string, applications: readonly string[]): {
  location: VisualLocation; subject: VisualSubject; readerSteps?: string[];
} {
  const location = object(record['location'], `${context}.location`);
  exactKeys(location, ['application', 'route'], `${context}.location`);
  const application = text(location['application'], `${context}.location.application`);
  if (!applications.includes(application)) throw new Error(`${context}.location.application: expected a registered application (${applications.join(', ')}).`);
  const route = text(location['route'], `${context}.location.route`);
  if (!/^\/(?:[A-Za-z0-9_-]+|:[A-Za-z][A-Za-z0-9_]*)(?:\/(?:[A-Za-z0-9_-]+|:[A-Za-z][A-Za-z0-9_]*))*$/.test(route)) throw new Error(`${context}.location.route: expected a canonical application path without query values, fragments or record IDs; use a reviewed parameter pattern.`);
  const subject = object(record['subject'], `${context}.subject`);
  exactKeys(subject, ['kind', 'label', 'key'], `${context}.subject`);
  if (subject['kind'] !== 'page' && subject['kind'] !== 'component') throw new Error(`${context}.subject.kind: expected page or component.`);
  const label = subject['label'] === undefined ? undefined : text(subject['label'], `${context}.subject.label`);
  const key = subject['key'] === undefined ? undefined : text(subject['key'], `${context}.subject.key`);
  if (subject['kind'] === 'component' && !label && !key) throw new Error(`${context}.subject: component requires a label or a verified registry key.`);
  if (subject['kind'] === 'page' && (label || key)) throw new Error(`${context}.subject: page labels are owned by application metadata; omit label and key.`);
  const readerSteps = record['readerSteps'];
  if (readerSteps !== undefined && (!Array.isArray(readerSteps) || readerSteps.some(step => typeof step !== 'string' || !step.trim()))) throw new Error(`${context}.readerSteps: expected an array of non-empty plain text steps.`);
  return { location: { application, route }, subject: { kind: subject['kind'], ...(label ? { label } : {}), ...(key ? { key } : {}) }, ...(readerSteps ? { readerSteps: readerSteps as string[] } : {}) };
}

export async function resolveVisualMetadata(config: ChangelogConfig, record: Record<string, unknown>, context: string): Promise<ResolvedVisualMetadata> {
  requireMetadata(config);
  const authored = validateVisualMetadata(record, context, config.metadata.applications);
  const result = await config.metadata.resolve(config.root, record, context);
  if (result.location.application !== authored.location.application || result.location.route !== authored.location.route || result.subject.kind !== authored.subject.kind) throw new Error(`${context}: metadata adapter changed the authored location or subject.`);
  text(result.location.pageLabel, `${context}.pageLabel`);
  text(result.subject.label, `${context}.subject.label`);
  text(result.guidance.text, `${context}.guidance.text`);
  text(result.guidance.sourceRevision, `${context}.guidance.sourceRevision`);
  for (const key of ['navigation', 'access'] as const) if (!Array.isArray(result.location[key]) || result.location[key].some(value => typeof value !== 'string' || !value.trim())) throw new Error(`${context}: metadata adapter returned invalid ${key}.`);
  if (!result.location.navigation.length) throw new Error(`${context}: metadata adapter returned no reviewed navigation.`);
  return result;
}

function text(value: unknown, context: string): string { if (typeof value !== 'string' || !value.trim()) throw new Error(`${context}: expected non-empty text.`); return value.trim(); }
function object(value: unknown, context: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${context}: expected an object.`); return value as Record<string, unknown>; }
function exactKeys(record: Record<string, unknown>, keys: string[], context: string): void { for (const key of Object.keys(record)) if (!keys.includes(key)) throw new Error(`${context}.${key}: unsupported metadata key.`); }
