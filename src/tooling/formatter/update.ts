import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { Database } from 'bun:sqlite';
import { buildFormatter, matchesLanguageCatalog, sha256, writeLanguageModules, type ReleaseManifest } from './build';

const registry = 'https://registry.npmjs.org';
export const formatterRoot = import.meta.dir;
const stableVersion = /^\d+\.\d+\.\d+$/;

interface UpdateRecord {
  updatedAt: string;
  previous: string | null;
  current: string;
  integrity: string;
  webquark: { latest: string | null; dev: string | null };
}

interface RegistryRelease { version: string; dist: { tarball: string; integrity: string } }
interface Registry {
  release(): Promise<RegistryRelease>;
  archive(release: RegistryRelease): Promise<Uint8Array>;
  tags(): Promise<UpdateRecord['webquark']>;
}

async function request(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Registry request failed (${response.status}): ${url}`);
  return response;
}

const npm: Registry = {
  release: async () => (await request(registry + '/prettier/latest')).json(),
  async archive({ dist }) {
    if (new URL(dist.tarball).origin !== registry) throw new Error('Expected official npm tarball');
    return new Uint8Array(await (await request(dist.tarball)).arrayBuffer());
  },
  async tags() {
    const { latest, dev } = await (await request(registry + '/-/package/@webquark%2fbrowser/dist-tags')).json();
    return { latest: latest ?? null, dev: dev ?? null };
  },
};

async function saveJson(file: string, value: unknown) {
  const next = file + '.next';
  await mkdir(dirname(file), { recursive: true });
  await writeFile(next, JSON.stringify(value, null, 2) + '\n', { flush: true });
  await rename(next, file);
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8'));
}

function removeOwned(root: string, path: string) {
  if (!resolve(path).startsWith(resolve(root) + sep)) throw new Error('Unexpected formatter cleanup path');
  return rm(path, { recursive: true, force: true });
}

async function stageSource(bytes: Uint8Array, release: RegistryRelease, source: string) {
  if ('sha512-' + createHash('sha512').update(bytes).digest('base64') !== release.dist.integrity) {
    throw new Error('Prettier archive failed the registry integrity check');
  }
  const archive = await new Bun.Archive(bytes).files();
  const metadata = archive.get('package/package.json');
  const pkg = metadata && JSON.parse(await metadata.text());
  if (pkg?.name !== 'prettier' || pkg.version !== release.version) throw new Error('Unexpected archived package');
  await mkdir(join(source, 'plugins'), { recursive: true });

  const files: Record<string, string> = {};
  for (const [path, entry] of archive) {
    if (!/^package\/(?:standalone\.mjs|plugins\/[a-z0-9-]+\.mjs|LICENSE|THIRD-PARTY-NOTICES\.md)$/.test(path)) continue;
    const name = path.slice('package/'.length);
    const data = new Uint8Array(await entry.arrayBuffer());
    await writeFile(join(source, name), data);
    files[name] = sha256(data);
  }
  for (const required of ['standalone.mjs', 'LICENSE', 'THIRD-PARTY-NOTICES.md']) {
    if (!files[required]) throw new Error('Upstream archive is missing ' + required);
  }

  await stageLanguageModules(source, { version: release.version, integrity: release.dist.integrity, files });
}

async function stageLanguageModules(source: string, manifest: ReleaseManifest) {
  const files = Object.fromEntries(Object.entries(manifest.files).filter(([file]) => !file.startsWith('languages/')));

  await writeLanguageModules(source);
  for (const name of await readdir(join(source, 'languages'))) {
    const file = 'languages/' + name;
    files[file] = sha256(await readFile(join(source, file)));
  }
  await saveJson(join(source, 'manifest.json'), { ...manifest, files });
}

async function withLock<T>(root: string, action: (work: string) => Promise<T>): Promise<T> {
  const work = join(root, '.update');
  await mkdir(work, { recursive: true });
  // SQLite releases the writer lock on process exit, including interrupted updates.
  const db = new Database(join(work, 'lock.sqlite'), { create: true });
  try {
    db.exec('PRAGMA busy_timeout=5000; BEGIN IMMEDIATE');
    return await action(work);
  } finally {
    db.close();
  }
}

async function publishBuild(root: string, work: string) {
  const staged = join(work, 'built');
  if (!existsSync(staged)) return;
  const active = join(root, 'build');
  const old = join(work, 'previous-build');
  if (existsSync(active)) {
    await removeOwned(work, old);
    await rename(active, old);
  }
  await rename(staged, active);
}

async function finishUpdate(root: string, work: string) {
  const journal = join(work, 'pending.json');
  if (!existsSync(journal)) return;
  const record = await readJson<UpdateRecord | { kind: 'adapters' }>(journal);
  const active = join(root, 'prettier');
  if ('kind' in record) {
    if (record.kind !== 'adapters') throw new Error('Unknown formatter recovery operation');
    const incoming = join(work, 'incoming');
    const previous = join(work, 'previous-source');
    if (existsSync(incoming)) {
      if (existsSync(active)) await rename(active, previous);
      await rename(incoming, active);
    }
    await publishBuild(root, work);
    await removeOwned(work, previous);
    await removeOwned(work, join(work, 'previous-build'));
    await rm(journal);
    return;
  }

  const versions = join(root, 'versions', 'prettier');
  await mkdir(versions, { recursive: true });
  if (!stableVersion.test(record.current) || (record.previous && !stableVersion.test(record.previous))) {
    throw new Error('Unexpected version in formatter recovery journal');
  }
  if (record.previous && !existsSync(join(versions, record.previous))) {
    await rename(active, join(versions, record.previous));
  }
  if (!existsSync(active)) await rename(join(work, 'incoming'), active);
  await publishBuild(root, work);

  const historyPath = join(root, 'versions', 'version.json');
  const history = existsSync(historyPath) ? await readJson<UpdateRecord[]>(historyPath) : [];
  if (!history.some(entry => entry.updatedAt === record.updatedAt && entry.current === record.current)) {
    await saveJson(historyPath, [...history, record]);
  }

  for (const backup of await readdir(versions, { withFileTypes: true })) {
    if (backup.isDirectory() && stableVersion.test(backup.name) && backup.name !== record.previous) {
      await removeOwned(versions, join(versions, backup.name));
    }
  }
  await removeOwned(work, join(work, 'previous-build'));
  await rm(journal);
}

async function rebuild(root: string, work: string) {
  const built = join(work, 'built');
  await removeOwned(work, built);
  await buildFormatter(join(root, 'prettier'), built);
  await publishBuild(root, work);
  await removeOwned(work, join(work, 'previous-build'));
}

async function verifyStagedBuild(incoming: string, built: string) {
  await buildFormatter(incoming, built);
  // A fresh ESM cache is essential when two releases are checked at the same staging path.
  const check = Bun.spawn([process.execPath, join(import.meta.dir, 'build.ts'), built], { stdout: 'inherit', stderr: 'inherit' });
  if (await check.exited !== 0) throw new Error('Staged formatter verification failed');
}

async function refreshAdapters(root: string, work: string, manifest: ReleaseManifest) {
  const incoming = join(work, 'incoming');
  const built = join(work, 'built');
  await removeOwned(work, incoming);
  await removeOwned(work, built);
  const active = join(root, 'prettier');
  await cp(active, incoming, { recursive: true, filter: path => path !== join(active, 'languages') });

  await stageLanguageModules(incoming, manifest);
  await verifyStagedBuild(incoming, built);
  await saveJson(join(work, 'pending.json'), { kind: 'adapters' });
  await finishUpdate(root, work);
}

export function refreshPinnedAdapters(root = formatterRoot) {
  return withLock(root, async work => {
    await finishUpdate(root, work);
    const manifest = await readJson<ReleaseManifest>(join(root, 'prettier', 'manifest.json'));
    await refreshAdapters(root, work, manifest);
  });
}

// Only this operation needs the registry. Ordinary builds exclusively use tracked files.
export function updateFormatter(root = formatterRoot, upstream = npm) {
  return withLock(root, async work => {
    await finishUpdate(root, work);
    const release = await upstream.release();
    if (!stableVersion.test(release.version)) throw new Error('Expected a stable Prettier release');
    const currentPath = join(root, 'prettier', 'manifest.json');
    const current = existsSync(currentPath) ? await readJson<ReleaseManifest>(currentPath) : null;
    if (current?.version === release.version) {
      if (current.integrity !== release.dist.integrity) throw new Error('Upstream integrity changed for pinned version');
      if (matchesLanguageCatalog(current)) {
        await rebuild(root, work);
      } else {
        await refreshAdapters(root, work, current);
      }
      return release.version;
    }

    const incoming = join(work, 'incoming');
    const built = join(work, 'built');
    await removeOwned(work, incoming);
    await removeOwned(work, built);
    await stageSource(await upstream.archive(release), release, incoming);
    await verifyStagedBuild(incoming, built);
    const record: UpdateRecord = {
      updatedAt: new Date().toISOString(), previous: current?.version ?? null,
      current: release.version, integrity: release.dist.integrity, webquark: await upstream.tags(),
    };
    await saveJson(join(work, 'pending.json'), record);
    await finishUpdate(root, work);
    return release.version;
  });
}

export function buildPinnedFormatter(root = formatterRoot) {
  return withLock(root, async work => {
    await finishUpdate(root, work);
    await rebuild(root, work);
  });
}
