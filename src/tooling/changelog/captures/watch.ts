import { watch as watchFileSystem } from 'node:fs';
import { stat } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { captureFingerprint, relevantWatchChange, requiresCaptureRestart, type CaptureWatchInputs } from './fingerprint.js';
import { projectPath, type ChangelogConfig } from '../config/index.js';
import type { CaptureAdapter, CaptureJob } from '../adapters/capture.js';
import { readCaptureConfiguration } from './config.js';
import { prepareCapturePreview } from '../notes/preview.js';
import { generateWhatsNew } from '../notes/feed.js';

export type BuiltFrontend = { fingerprint: string; assetsRoot: string; runDirectory: string; application?: string };
type CaptureResult = { empty: boolean; cached?: unknown };
type RunCapture = (selected: string[], signal: AbortSignal, cached?: unknown) => Promise<CaptureResult>;

export async function watchCaptureInputs<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>, roots: string[], onChange: (path: string) => void, onError: (error: Error) => void, inputs?: CaptureWatchInputs) {
  const watchers: ReturnType<typeof watchFileSystem>[] = [];
  let debounce: ReturnType<typeof setTimeout> | undefined;
  try {
    for (const root of roots) {
      const directory = (await stat(root)).isDirectory();
      const watcher = watchFileSystem(root, { recursive: directory }, (_event, name) => {
        const path = directory && name ? resolve(root, String(name)) : root;
        if (!relevantWatchChange(config, path, inputs)) return;
        // Imported capture functions/data remain cached in this process.
        if (requiresCaptureRestart(config, adapter, path, inputs?.packageRoots)) return onChange(path);
        clearTimeout(debounce);
        debounce = setTimeout(() => onChange(path), 1000);
      });
      watcher.on('error', onError);
      watchers.push(watcher);
    }
  } catch (error) {
    for (const watcher of watchers) watcher.close();
    throw error;
  }
  return () => {
    clearTimeout(debounce);
    for (const watcher of watchers) watcher.close();
  };
}

async function releaseIdentity(config: ChangelogConfig) {
  const directory = projectPath(config, config.unreleasedDirectory);
  const info = await stat(directory).catch(() => null);
  const configuration = await stat(resolve(directory, 'captures.json')).catch(() => null);
  return {
    directory: info ? `${info.dev}:${info.ino}:${info.birthtimeMs}` : '',
    configuration: configuration ? `${configuration.dev}:${configuration.ino}:${configuration.birthtimeMs}` : '',
  };
}

export async function captureWatch<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>, selected: string[], signal: AbortSignal, runCapture: RunCapture, installWatchers = watchCaptureInputs) {
  const initialRelease = await releaseIdentity(config);
  let cached: unknown;
  let pending = true;
  let wake: (() => void) | undefined;
  let closeWatchers: (() => void) | undefined;
  let previousFingerprint: string | undefined;
  let watcherError: Error | undefined;
  let restartRequired = false;
  let activeRun: AbortController | undefined;
  const stop = () => {
    activeRun?.abort();
    closeWatchers?.();
    closeWatchers = undefined;
    wake?.();
  };
  signal.addEventListener('abort', stop, { once: true });
  try {
    while (!signal.aborted) {
      if (watcherError) throw watcherError;
      if (!pending) {
        console.log('[capture] Watching source and active WebQuark inputs. Ctrl+C stops.');
        await new Promise<void>(resolvePromise => { wake = resolvePromise; });
        wake = undefined;
        if (signal.aborted) break;
      }
      if (watcherError) throw watcherError;
      if (restartRequired) {
        console.log('[capture] Capture code or demo data changed. Watch stopped; restart to load the updated modules.');
        break;
      }
      const currentRelease = await releaseIdentity(config);
      if (currentRelease.directory !== initialRelease.directory || currentRelease.configuration !== initialRelease.configuration) {
        console.log('[capture] Unreleased or captures.json changed. Watch stopped; restart against the new configuration.');
        break;
      }
      pending = false;
      closeWatchers?.();
      const inputs = await captureFingerprint(config, adapter, false, selected);
      const configuration = await readCaptureConfiguration(config, adapter);
      const ownedOutputs = configuration.entries.map(({ id, visualId, output, mode }) => ({ id, visualId, output, mode }));
      const selfTargetOutputs = configuration.entries.filter(entry => adapter.repositoryContent(entry) && (!selected.length || selected.includes(entry.id))).map(entry => entry.output);
      const capturePreview = await prepareCapturePreview(config, { ownedOutputs, selfTargetOutputs });
      closeWatchers = await installWatchers(config, adapter, inputs.watchRoots, path => {
        restartRequired ||= requiresCaptureRestart(config, adapter, path, Object.values(inputs.webquark));
        pending = true;
        if (restartRequired) stop();
        else wake?.();
      }, error => {
        watcherError = error;
        pending = true;
        stop();
      }, { ownedOutputs: configuration.entries.map(entry => `${config.unreleasedDirectory}/${entry.output}`), inputAssets: selfTargetOutputs.length ? capturePreview.assets.map(asset => asset.path) : [], packageRoots: Object.values(inputs.webquark) });
      // Setup can deliver an event before its cleanup handle is assigned.
      if (signal.aborted) break;
      if (watcherError) throw watcherError;
      if (restartRequired) {
        console.log('[capture] Capture code or demo data changed. Watch stopped; restart to load the updated modules.');
        break;
      }
      if (previousFingerprint === inputs.sha256) {
        await generateWhatsNew(config, { includeUnreleased: true, capturePreview });
        console.log('[capture] Presentation preview refreshed; screenshot inputs are unchanged.');
        continue;
      }
      previousFingerprint = inputs.sha256;
      try {
        activeRun = new AbortController();
        if (signal.aborted) activeRun.abort();
        const result = await runCapture(selected, activeRun.signal, cached);
        cached = result.cached;
        if (result.empty) break;
      } catch (error) {
        if (signal.aborted) break;
        if (!restartRequired) console.error(error instanceof Error ? error.message : error);
      } finally {
        activeRun = undefined;
      }
    }
  } finally {
    stop();
    signal.removeEventListener('abort', stop);
  }
}
