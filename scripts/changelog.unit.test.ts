import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  generateWhatsNew, parseArguments, prepareCapturePreview, readCaptureConfiguration, runCaptureCommand,
  runChangelogCli, type CaptureAdapter, type CaptureJob, type ChangelogConfig, type ReleaseFeed,
  type ResolvedVisualMetadata, type VisualMetadataAdapter,
} from '../src/tooling/changelog/index.js';
import { archiveReleaseNotes } from '../src/tooling/changelog/versioning/core/changelog.js';

const roots: string[] = [];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6b9sAAAAASUVORK5CYII=', 'base64');
const image = { src: 'images/manual-after.png', alt: 'Example screenshot' };
const plain = { id: 'manual-image', title: 'Example image', kind: 'image', image };
const contextual = { ...plain, id: 'context-image', location: { application: 'example', route: '/dashboard' }, subject: { kind: 'page' } };
const resolved: ResolvedVisualMetadata = {
  location: { application: 'example', route: '/dashboard', pageLabel: 'Dashboard', navigation: ['Home', 'Dashboard'], access: ['Signed in'] },
  subject: { kind: 'page', label: 'Dashboard' },
  guidance: { text: 'Open Dashboard to see the change.', sourceRevision: 'reviewed-v1' },
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) {
    const within = relative(tmpdir(), root);
    if (!within || isAbsolute(within) || within.startsWith('..') || !within.startsWith('wq-changelog-test-')) throw new Error('Unexpected fixture cleanup path.');
    rmSync(root, { recursive: true, force: true });
  }
});

function put(path: string, content: string | Buffer): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function fixture(): ChangelogConfig {
  const root = mkdtempSync(join(tmpdir(), 'wq-changelog-test-'));
  roots.push(root);
  put(join(root, 'package.json'), JSON.stringify({ version: '1.1.0' }));
  put(join(root, 'CHANGELOG.md'), '# Changes\n\n## Unreleased\n\n### Added\n\n- Example change.\n\n## v1.0.0 - 2026-10-01\n\n### Fixed\n\n- Earlier change.\n');
  put(join(root, 'docs/changelog/v1.0.0/README.md'), '# v1.0.0\n');
  put(join(root, 'docs/changelog/unreleased/README.md'), '# Unreleased\n\nExample change.\n');
  put(join(root, 'docs/changelog/unreleased/visuals.json'), '[]\n');
  put(join(root, 'docs/changelog/unreleased/captures.json'), '[]\n');
  put(join(root, 'docs/changelog/unreleased', image.src), png);
  return { root, sourceManifest: 'package.json', changelog: 'CHANGELOG.md', releasesDirectory: 'docs/changelog',
    unreleasedDirectory: 'docs/changelog/unreleased', feedOutputDirectory: 'generated/whats-new',
    feedPublicPrefix: 'assets/whats-new', captureStagingDirectory: 'generated/captures' };
}

function visuals(config: ChangelogConfig, entries: unknown[], folder = 'unreleased'): void {
  put(join(config.root, 'docs/changelog', folder, 'visuals.json'), JSON.stringify(entries));
  put(join(config.root, 'docs/changelog', folder, image.src), png);
}

function metadata(): VisualMetadataAdapter & { resolve: ReturnType<typeof vi.fn> } {
  return { id: 'example-metadata', revision: 'reviewed-v1', applications: ['example'], resolve: vi.fn(async () => structuredClone(resolved)) };
}

async function feed(config: ChangelogConfig, includeUnreleased = true): Promise<ReleaseFeed> {
  const result = await generateWhatsNew(config, { includeUnreleased });
  return JSON.parse(readFileSync(join(result.outputDirectory, result.feedUrl.split('/').at(-1)!), 'utf8')) as ReleaseFeed;
}

function snapshot(config: ChangelogConfig, schemaVersion: number, entries: Record<string, unknown>): void {
  put(join(config.root, 'docs/changelog/v1.0.0/locations.json'), JSON.stringify({ schemaVersion, visuals: entries }));
}

describe('progressive release content', () => {
  it('generates the existing feed envelope and hashed feed URL without metadata', async () => {
    const config = fixture();
    const result = await generateWhatsNew(config);
    expect(result.feedUrl).toMatch(/^assets\/whats-new\/releases\.[a-f0-9]{20}\.json$/);
    const output = JSON.parse(readFileSync(join(result.outputDirectory, result.feedUrl.split('/').at(-1)!), 'utf8'));
    expect(Object.keys(output)).toEqual(['releases']);
    expect(output.releases).toMatchObject([{ version: '1.0.0', categories: [{ name: 'Fixed', summaries: ['Earlier change.'] }], visuals: [] }]);
    expect(readFileSync(join(result.outputDirectory, 'feed-url.ts'), 'utf8')).toContain(JSON.stringify(result.feedUrl));
  });

  it('includes development Unreleased text and omits it in production', async () => {
    const config = fixture();
    expect((await feed(config)).releases.map(entry => entry.version)).toEqual(['unreleased', '1.0.0']);
    const result = await generateWhatsNew(config, { includeUnreleased: true, environmentType: 'prod' });
    expect(result.releases).toBe(1);
  });

  it('retains the release-folder contract for text-only feeds', async () => {
    const config = fixture();
    rmSync(join(config.root, 'docs/changelog/v1.0.0'), { recursive: true });
    await expect(feed(config, false)).rejects.toThrow(/requires a matching.*v1.0.0/);
  });

  it('generates ordinary images and legacy comparisons with canonical crop/anchor output', async () => {
    const config = fixture();
    visuals(config, [plain, { id: 'comparison', title: 'Before and after', before: image,
      after: { ...image, framing: { anchor: 'top-right', width: 40, height: 60 } },
      afterSummary: { category: 'Added', summary: 'Example change.' } }]);
    const entry = (await feed(config)).releases[0]!;
    expect(entry.visuals).toHaveLength(2);
    expect(entry.visuals[0]).toMatchObject({ kind: 'image', id: plain.id });
    expect(entry.visuals[0]).not.toHaveProperty('location');
    expect(entry.visuals[1]).toMatchObject({ after: { crop: { x: 60, y: 0, width: 40, height: 60 } }, afterSummary: { category: 'Added', summary: 'Example change.' } });
    const reference = entry.visuals[0]!.kind === 'image' ? entry.visuals[0].image.src : '';
    expect(readFileSync(join(config.root, config.feedOutputDirectory!, reference))).toEqual(png);
  });

  it('does not call an optional adapter for ordinary active visuals', async () => {
    const config = { ...fixture(), metadata: metadata() };
    visuals(config, [plain]);
    await feed(config);
    expect(config.metadata.resolve).not.toHaveBeenCalled();
  });

  it.each(['location', 'subject', 'readerSteps', 'capture', 'guidance'])('requires an adapter for a partial %s declaration', async key => {
    const config = fixture();
    visuals(config, [{ ...plain, [key]: key === 'readerSteps' ? [] : {} }]);
    await expect(feed(config)).rejects.toThrow(/reviewed metadata adapter/);
  });

  it('rejects incomplete context even with an adapter', async () => {
    const config = { ...fixture(), metadata: metadata() };
    visuals(config, [{ ...plain, location: contextual.location }]);
    await expect(feed(config)).rejects.toThrow(/subject: expected an object/);
    expect(config.metadata.resolve).not.toHaveBeenCalled();
  });

  it('preserves strict active-visual admission while allowing legacy historical plain visuals', async () => {
    const config = { ...fixture(), metadata: metadata(), requireVisualMetadata: true };
    visuals(config, [plain], 'v1.0.0');
    expect((await feed(config, false)).releases[0]!.visuals).toHaveLength(1);
    visuals(config, [plain]);
    await expect(feed(config)).rejects.toThrow(/location: expected an object/);
  });

  it('resolves complete active context and preserves guidance in the feed', async () => {
    const config = { ...fixture(), metadata: metadata() };
    visuals(config, [contextual]);
    expect((await feed(config)).releases[0]!.visuals[0]).toMatchObject(resolved);
    expect(config.metadata.resolve).toHaveBeenCalledTimes(1);
  });

  it.each(['images/missing.png', '../manual.png'])('rejects invalid image %s without replacing previous output', async src => {
    const config = fixture();
    put(join(config.root, config.feedOutputDirectory!, 'sentinel.txt'), 'Previous output');
    visuals(config, [{ ...plain, image: { ...image, src } }]);
    await expect(feed(config)).rejects.toThrow(/must exist|must reference/);
    expect(readFileSync(join(config.root, config.feedOutputDirectory!, 'sentinel.txt'), 'utf8')).toBe('Previous output');
  });
});

describe('archive snapshot compatibility', () => {
  it.each([1, 2])('reads contextual v%s snapshots without calling the current adapter', async schemaVersion => {
    const config = { ...fixture(), metadata: metadata() };
    visuals(config, [contextual], 'v1.0.0');
    snapshot(config, schemaVersion, { [contextual.id]: resolved });
    expect((await feed(config, false)).releases[0]!.visuals[0]).toMatchObject(resolved);
    expect(config.metadata.resolve).not.toHaveBeenCalled();
    // Historical snapshots also work without an adapter or its current application registry.
    expect((await feed({ ...config, metadata: undefined }, false)).releases[0]!.visuals[0]).toMatchObject(resolved);
  });

  it('keeps v1 missing-ID rejection, including ordinary authored visuals', async () => {
    const config = fixture();
    visuals(config, [plain], 'v1.0.0');
    snapshot(config, 1, {});
    await expect(feed(config, false)).rejects.toThrow(/missing visual manual-image/);
  });

  it.each(['location', 'subject', 'readerSteps', 'capture', 'guidance'])('rejects v2 missing snapshots for %s declarations', async key => {
    const config = fixture();
    visuals(config, [{ ...plain, [key]: key === 'readerSteps' ? [] : {} }], 'v1.0.0');
    snapshot(config, 2, {});
    await expect(feed(config, false)).rejects.toThrow(/missing visual manual-image/);
  });

  it('rejects historical snapshot conflicts', async () => {
    const config = fixture();
    visuals(config, [contextual], 'v1.0.0');
    snapshot(config, 1, { [contextual.id]: { ...resolved, location: { ...resolved.location, route: '/changed' } } });
    await expect(feed(config, false)).rejects.toThrow(/snapshot conflicts/);
  });

  it('roundtrips mixed content using v2 and snapshots only contextual visuals', async () => {
    const config = { ...fixture(), metadata: metadata() };
    visuals(config, [plain, contextual]);
    const activeVisuals = (await feed(config)).releases[0]!.visuals;
    await archiveReleaseNotes(config, '1.1.0', '2026-10-12');
    expect(JSON.parse(readFileSync(join(config.root, 'docs/changelog/v1.1.0/locations.json'), 'utf8'))).toEqual({ schemaVersion: 2, visuals: { [contextual.id]: resolved } });
    config.metadata.resolve.mockClear();
    expect((await feed(config, false)).releases[0]!.visuals).toEqual(activeVisuals);
    expect(config.metadata.resolve).not.toHaveBeenCalled();
    expect(JSON.parse(readFileSync(join(config.root, config.unreleasedDirectory, 'visuals.json'), 'utf8'))).toEqual([]);
  });

  it.each([{ entries: [] }, { entries: [contextual] }])('retains v1 for empty or fully contextual archives', async ({ entries }) => {
    const config = { ...fixture(), metadata: metadata(), requireVisualMetadata: true };
    visuals(config, entries);
    await archiveReleaseNotes(config, '1.1.0', '2026-10-12');
    expect(JSON.parse(readFileSync(join(config.root, 'docs/changelog/v1.1.0/locations.json'), 'utf8')).schemaVersion).toBe(1);
  });

  it('roundtrips an ordinary-only archive without metadata', async () => {
    const config = fixture();
    visuals(config, [plain]);
    const activeVisuals = (await feed(config)).releases[0]!.visuals;
    await archiveReleaseNotes(config, '1.1.0', '2026-10-12');
    expect(JSON.parse(readFileSync(join(config.root, 'docs/changelog/v1.1.0/locations.json'), 'utf8'))).toEqual({ schemaVersion: 2, visuals: {} });
    expect((await feed(config, false)).releases[0]!.visuals).toEqual(activeVisuals);
  });
});

describe('capture CLI and admission', () => {
  it('supports explicit staging and exact-run publication while retaining legacy defaults', () => {
    expect(parseArguments(['stage', '--scenario', 'example', '--watch'])).toMatchObject({ selected: ['example'], watch: true, stageOnly: true });
    expect(parseArguments(['publish', 'saved-run'])).toMatchObject({ publishRun: 'saved-run', stageOnly: false });
    expect(parseArguments([]).stageOnly).toBe(false);
    expect(parseArguments(['--stage-only']).stageOnly).toBe(true);
    expect(parseArguments(['--publish-run', 'saved-run'])).toMatchObject({ publishRun: 'saved-run' });
  });

  it.each([['publish'], ['publish', 'run', '--watch'], ['stage', '--publish-run', 'run'], ['--publish-run', 'run', '--stage-only']])('rejects conflicting or incomplete capture arguments %j', args => {
    expect(() => parseArguments(args)).toThrow();
  });

  it.each([
    { args: ['notes', '--help'], text: 'ordinary manual visuals' },
    { args: ['version', 'check', '--help'], text: 'without changing files' },
    { args: ['release', '--help'], text: 'explicitly requests release preparation' },
    { args: ['capture', 'stage', '--help'], text: 'without replacing release images' },
    { args: ['capture', 'publish', '--help'], text: 'exact passed, cleanup-verified staged run' },
  ])('shows command-specific inert help for $args', async ({ args, text }) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await runChangelogCli([...args, '--config', 'never-load-this-module.mjs'])).toBe(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining(text));
  });

  it('runs installed-style notes CLI using a metadata-free config module', async () => {
    const config = fixture();
    const path = join(config.root, 'config.mjs');
    put(path, `export default ${JSON.stringify(config)};\n`);
    vi.stubEnv('ENVIRONMENT_TYPE', 'prod');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await runChangelogCli(['notes', '--config', path])).toBe(0);
    expect(readdirSync(join(config.root, config.feedOutputDirectory!))).toContain('feed-url.ts');
  });

  it('requires metadata for managed capture even with no configured jobs', async () => {
    const config = fixture();
    const readConfiguration = vi.fn();
    await expect(readCaptureConfiguration(config, { readConfiguration } as unknown as CaptureAdapter)).rejects.toThrow(/reviewed metadata adapter/);
    expect(readConfiguration).not.toHaveBeenCalled();
  });

  it('rejects a managed capture linked to an ordinary metadata-free visual', async () => {
    const config = { ...fixture(), metadata: metadata() };
    visuals(config, [plain]);
    put(join(config.root, config.unreleasedDirectory, 'captures.json'), JSON.stringify([{ id: 'example', visualId: plain.id, format: 'png' }]));
    await expect(prepareCapturePreview(config, { ownedOutputs: [{ id: 'example', visualId: plain.id, output: image.src, mode: 'custom' }] })).rejects.toThrow(/location: expected an object/);
  });

  it('stages and publishes a synthetic capture through the new commands', async () => {
    const config = { ...fixture(), metadata: metadata() };
    visuals(config, [contextual]);
    const capturesPath = join(config.root, config.unreleasedDirectory, 'captures.json');
    put(capturesPath, JSON.stringify([{ id: 'example', visualId: contextual.id, format: 'png' }]));
    const job: CaptureJob = { id: 'example', mode: 'custom', visualId: contextual.id, output: image.src, format: 'png', viewport: { width: 1, height: 1 }, fullPage: false };
    const changedPng = await (await import('sharp')).default({ create: { width: 1, height: 1, channels: 4, background: '#ff0000' } }).png().toBuffer();
    const prepare = vi.fn(async () => ({
      expiresAt: new Date(Date.now() + 60_000).toISOString(), verifyCurrent: async () => {}, close: async () => {},
      capture: async (_entry: CaptureJob, output: string, report: Record<string, unknown>) => {
        put(output, changedPng);
        Object.assign(report, { pageErrors: [], networkViolations: [], unrecoveredFailedRequests: [], evidence: {
          capturedURL: 'http://127.0.0.1:12345/dashboard', readiness: ['fonts', 'animations'], width: 1, height: 1,
          image: { format: 'png', sha256: createHash('sha256').update(changedPng).digest('hex') },
        } });
      },
    }));
    const adapter: CaptureAdapter = { id: 'synthetic-capture', revision: 'v1', defaults: {}, inputs: [], packages: [], restartInputs: [],
      readConfiguration: async () => ({ path: capturesPath, bytes: readFileSync(capturesPath), entries: [job] }),
      projection: entries => entries, repositoryContent: () => false, prepare, validateReviewedEvidence: async () => {} };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await runCaptureCommand(config, adapter, ['stage']);
    expect(readFileSync(join(config.root, config.unreleasedDirectory, image.src))).toEqual(png);
    const runId = readdirSync(join(config.root, config.captureStagingDirectory!))[0]!;
    const reportPath = join(config.root, config.captureStagingDirectory!, runId, 'report.json');
    expect(JSON.parse(readFileSync(reportPath, 'utf8'))).toMatchObject({ stageOnly: true, publication: 'staged', status: 'passed', cleanup: 'passed' });
    await runCaptureCommand(config, adapter, ['publish', runId]);
    expect(readFileSync(join(config.root, config.unreleasedDirectory, image.src))).toEqual(changedPng);
    expect(JSON.parse(readFileSync(reportPath, 'utf8')).publication).toBe('published');
    expect(prepare).toHaveBeenCalledTimes(1);
  });
});
