import { parseStableVersion } from '../stable-version.js';
import { escapeRegExp } from './files.js';

export function readBunWorkspaceVersion(
  bunLock: string,
  workspacePath: string,
): string {
  const workspaces = readObjectForKey(bunLock, 'workspaces');
  const workspace = readObjectForKey(workspaces, workspacePath);
  const version = readJsonLikeString(workspace, 'version');
  if (!version) {
    throw new Error(`bun.lock workspace ${workspacePath} has no string version.`);
  }
  return version;
}

export function updateBunWorkspaceVersion(
  bunLock: string,
  workspacePath: string,
  version: string,
): string {
  parseStableVersion(version);
  readBunWorkspaceVersion(bunLock, workspacePath);
  const workspaces = readObjectForKey(bunLock, 'workspaces');
  const workspace = readObjectForKey(workspaces, workspacePath);
  const updated = workspace.replace(
    /("version"\s*:\s*")[^"]+(")/,
    (_match, prefix: string, suffix: string) => prefix + version + suffix,
  );
  return bunLock.replace(workspaces, () => workspaces.replace(workspace, () => updated));
}

function readObjectForKey(source: string, key: string): string {
  const pattern = new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*\\{`, 'g');
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${JSON.stringify(key)} object in bun.lock.`);
  }

  const openingBrace = (matches[0].index ?? 0) + matches[0][0].lastIndexOf('{');
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = openingBrace; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openingBrace, index + 1);
      }
    }
  }

  throw new Error(`Unterminated ${JSON.stringify(key)} object in bun.lock.`);
}

function readJsonLikeString(source: string, key: string): string | undefined {
  const pattern = new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*"([^"]+)"`);
  return pattern.exec(source)?.[1];
}

