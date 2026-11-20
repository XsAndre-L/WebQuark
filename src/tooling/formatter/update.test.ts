import { expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { buildPinnedFormatter, formatterRoot, refreshPinnedAdapters, updateFormatter } from './update';
import { sha256, type ReleaseManifest } from './build';

test('install, rotate, retry and recover formatter history without the registry', async () => {
  const temp = resolve('build/.tmp/formatter-rotation');
  await mkdir(temp, { recursive: true });
  const root = await mkdtemp(join(temp, 'run-'));
  const source = join(formatterRoot, 'prettier');
  const manifest: ReleaseManifest = JSON.parse(await readFile(join(source, 'manifest.json'), 'utf8'));
  const files: Record<string, Blob> = {};
  for (const path of Object.keys(manifest.files).filter(file => !file.startsWith('languages/'))) {
    files['package/' + path] = new Blob([await Bun.file(join(source, path)).arrayBuffer()]);
  }
  const tags = { latest: '1.0.0', dev: '1.1.0-dev.1' };
  const historyFile = join(root, 'versions', 'version.json');
  const history = async () => JSON.parse(await readFile(historyFile, 'utf8'));
  const backups = join(root, 'versions', 'prettier');
  const work = join(root, '.update');
  const pinned = join(root, 'prettier');

  async function writeStaleAdapter(file: string) {
    const bytes = Buffer.from('export const obsolete = true;\n');
    const manifestFile = join(pinned, 'manifest.json');
    const pinnedManifest: ReleaseManifest = JSON.parse(await readFile(manifestFile, 'utf8'));
    pinnedManifest.files[file] = sha256(bytes);

    await writeFile(join(pinned, file), bytes);
    await writeFile(manifestFile, JSON.stringify(pinnedManifest));
  }

  async function fixture(version: string) {
    const archive = new Bun.Archive({
      ...files, 'package/package.json': JSON.stringify({ name: 'prettier', version }),
    }, { compress: 'gzip' });
    const bytes = await (await archive.blob()).bytes();
    const integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64');
    return {
      release: async () => ({ version, dist: { integrity, tarball: '' } }),
      archive: async () => bytes, tags: async () => tags,
    };
  }

  try {
    const first = await fixture('1.0.0');
    await updateFormatter(root, first);
    expect(await readdir(backups)).toEqual([]);
    await updateFormatter(root, await fixture('1.0.1'));
    const latest = await fixture('1.0.2');
    await expect(updateFormatter(root, { ...latest, archive: async () => new Uint8Array(0) })).rejects.toThrow('integrity');
    expect((await history()).length).toBe(2);
    expect(await readdir(backups)).toEqual(['1.0.0']);

    await updateFormatter(root, latest);
    const records = await history();
    expect(records.map((record: any) => record.current)).toEqual(['1.0.0', '1.0.1', '1.0.2']);
    expect(records[2]).toMatchObject({ previous: '1.0.1', webquark: tags });
    expect(await readdir(backups)).toEqual(['1.0.1']);

    const baseline = await readFile(join(pinned, 'manifest.json'), 'utf8');
    await writeStaleAdapter('languages/obsolete.mjs');
    await expect(buildPinnedFormatter(root)).rejects.toThrow('formatter:refresh');
    await refreshPinnedAdapters(root);
    expect(await readFile(join(pinned, 'manifest.json'), 'utf8')).toBe(baseline);
    expect(await readdir(join(pinned, 'languages'))).not.toContain('obsolete.mjs');

    await writeStaleAdapter('languages/javascript.mjs');
    await expect(buildPinnedFormatter(root)).rejects.toThrow('formatter:refresh');
    await updateFormatter(root, latest);
    expect(await readFile(join(pinned, 'manifest.json'), 'utf8')).toBe(baseline);
    expect(await history()).toEqual(records);
    expect(await readdir(backups)).toEqual(['1.0.1']);

    // An interrupted adapter refresh finishes without creating an upstream release record.
    await cp(pinned, join(work, 'incoming'), { recursive: true });
    await rename(pinned, join(work, 'previous-source'));
    await writeFile(join(work, 'pending.json'), JSON.stringify({ kind: 'adapters' }));
    await buildPinnedFormatter(root);
    expect(await readFile(join(pinned, 'manifest.json'), 'utf8')).toBe(baseline);
    expect(await history()).toEqual(records);
    expect(await readdir(backups)).toEqual(['1.0.1']);

    // Recreate an interrupted final cleanup: the new history is committed, two backups remain.
    await mkdir(join(backups, '1.0.0'));
    await writeFile(join(work, 'pending.json'), JSON.stringify(records[2]));
    await rm(join(root, 'build', 'runtime.mjs.gz'));
    await updateFormatter(root, latest);
    expect(await history()).toEqual(records);
    expect(await readdir(backups)).toEqual(['1.0.1']);
    const runtime = join(root, 'build', 'runtime.mjs');
    expect(gunzipSync(await readFile(runtime + '.gz')).equals(await readFile(runtime))).toBe(true);

    // A crash between archiving and activation is recoverable even from an offline build.
    await cp(join(root, 'prettier'), join(work, 'incoming'), { recursive: true });
    await rename(join(root, 'prettier'), join(backups, '1.0.2'));
    const incoming = join(work, 'incoming', 'manifest.json');
    const next = { ...JSON.parse(await readFile(incoming, 'utf8')), version: '1.0.3' };
    await writeFile(incoming, JSON.stringify(next));
    await writeFile(join(work, 'pending.json'), JSON.stringify({
      ...records[2], previous: '1.0.2', current: '1.0.3', updatedAt: new Date().toISOString(),
    }));
    await buildPinnedFormatter(root);
    expect(await readdir(backups)).toEqual(['1.0.2']);
    expect((await history()).at(-1).current).toBe('1.0.3');
  } finally {
    if (resolve(root).startsWith(temp + (process.platform === 'win32' ? '\\' : '/'))) {
      await rm(root, { recursive: true, force: true });
    }
  }
}, 90000);
