import type { QIconLibrary, QIconLocalPath, QIconName } from '../icon.types';

import { FONTAWESOME_FREE_VERSION, LUCIDE_STATIC_VERSION } from './constants';

const BINARY_ICON_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico'];

export interface ResolveIconUrlOptions {
  name: QIconName;
  library: QIconLibrary;
  localPath: QIconLocalPath;
  libraryVersion?: string;
}

export function getResolvedLibraryVersion(version: string | undefined, fallback: string): string {
  const trimmedVersion = version?.trim();
  return trimmedVersion || fallback;
}

export function isBinaryIconUrl(url: string): boolean {
  const urlLower = url.toLowerCase();
  return BINARY_ICON_EXTENSIONS.some(extension => urlLower.endsWith(extension));
}

export function resolveIconUrl(options: ResolveIconUrlOptions): string {
  const cleanName = options.name.trim();

  if (options.library === 'lucide') {
    const version = getResolvedLibraryVersion(options.libraryVersion, LUCIDE_STATIC_VERSION);
    return `https://cdn.jsdelivr.net/npm/lucide-static@${version}/icons/${encodeURIComponent(cleanName)}.svg`;
  }

  if (options.library === 'font-awesome' || options.library === 'fontawesome') {
    const version = getResolvedLibraryVersion(options.libraryVersion, FONTAWESOME_FREE_VERSION);
    return `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@${version}/svgs/solid/${encodeURIComponent(cleanName)}.svg`;
  }

  if (options.library === 'local') {
    let path = options.localPath || '/assets/icons/';
    if (!path.endsWith('/')) {
      path += '/';
    }

    return `${path}${cleanName}${cleanName.includes('.') ? '' : '.svg'}`;
  }

  if (options.library.includes('{name}')) {
    return options.library.replace('{name}', cleanName);
  }

  let basePath = options.library;
  if (!basePath.endsWith('/')) {
    basePath += '/';
  }
  return `${basePath}${cleanName}`;
}

export function resolveFetchableIconUrl(url: string, locationLike: Pick<Location, 'origin'> | undefined = typeof window !== 'undefined' ? window.location : undefined): string {
  if (!locationLike || /^https?:\/\//i.test(url) || url.startsWith('data:')) {
    return url;
  }

  const base = locationLike.origin && locationLike.origin !== 'null' ? locationLike.origin : 'http://localhost';
  try {
    return new URL(url, base).href;
  } catch (_) {
    return url;
  }
}
