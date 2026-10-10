import type { QIconLibrary, QIconLocalPath, QIconName } from '../icon.types';
import { FONTAWESOME_FREE_VERSION, LUCIDE_STATIC_VERSION } from './constants';

const BINARY_ICON_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico'];
const URL_BASE = 'http://localhost';
const ASSET_PROTOCOLS = ['http:', 'https:', 'file:', 'blob:'];

export interface ResolveIconUrlOptions {
  name: QIconName;
  library: QIconLibrary;
  localPath: QIconLocalPath;
  libraryVersion?: string;
}

export function getResolvedLibraryVersion(version: string | undefined, fallback: string): string {
  return version?.trim() || fallback;
}

function parseIconUrl(url: string, base = URL_BASE): URL {
  const parsed = new URL(url, base);
  if (!ASSET_PROTOCOLS.includes(parsed.protocol)
    && !(parsed.protocol === 'data:' && /^data:image\/svg\+xml(?:[;,])/i.test(url))) {
    throw new TypeError('Icon URLs must use HTTP(S), file/blob assets, a relative path, or SVG image data.');
  }
  return parsed;
}

export function isBinaryIconUrl(url: string): boolean {
  try {
    const parsed = parseIconUrl(url);
    return ASSET_PROTOCOLS.includes(parsed.protocol)
      && BINARY_ICON_EXTENSIONS.some(extension => parsed.pathname.toLowerCase().endsWith(extension));
  } catch (_) {
    return false;
  }
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
    const path = options.localPath || '/assets/icons/';
    const suffixIndex = cleanName.search(/[?#]/);
    const filename = suffixIndex < 0 ? cleanName : cleanName.slice(0, suffixIndex);
    const suffix = suffixIndex < 0 ? '' : cleanName.slice(suffixIndex);
    const basename = filename.slice(filename.lastIndexOf('/') + 1);
    return `${path.endsWith('/') ? path : `${path}/`}${filename}${basename.includes('.') ? '' : '.svg'}${suffix}`;
  }
  if (options.library.includes('{name}')) return options.library.replace('{name}', cleanName);
  return `${options.library.endsWith('/') ? options.library : `${options.library}/`}${cleanName}`;
}

export function resolveFetchableIconUrl(url: string, locationLike: Pick<Location, 'origin'> | undefined = typeof window !== 'undefined' ? window.location : undefined): string {
  const base = locationLike?.origin && locationLike.origin !== 'null' ? locationLike.origin : URL_BASE;
  const parsed = parseIconUrl(url, base);
  return locationLike ? parsed.href : url;
}
