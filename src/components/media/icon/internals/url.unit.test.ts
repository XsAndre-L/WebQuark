import { afterEach, describe, expect, it, vi } from 'vitest';
import { isBinaryIconUrl, resolveFetchableIconUrl, resolveIconUrl } from './url';

describe('icon URL policy', () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each(['logo.PNG?v=2#mark', '/icons/photo.jpg?x=1', '../icons/picture.JPEG#x', 'https://example.invalid/icon.webp?token=x#preview', '//example.invalid/icon.GIF?x=1', '/icons/favicon.ico#icon', 'file:///icons/logo.PNG?v=2', 'blob:https://example.invalid/logo.png'])('classifies pathname while preserving the full image URL: %s', url => {
    expect(isBinaryIconUrl(url)).toBe(true);
  });
  it.each(['/icons/icon.svg?name=logo.png', '/icons/logo?download=.jpg#icon.webp', 'https://example.invalid/logo', 'javascript:inert.png', 'data:text/plain,logo.png', 'mailto:logo.png'])('does not infer an image from an unsupported scheme or suffix outside pathname: %s', url => {
    expect(isBinaryIconUrl(url)).toBe(false);
  });
  it('appends local inferred SVG extensions before query/fragment and ignores dots in a directory/query', () => {
    const local = (name: string) => resolveIconUrl({ name, library: 'local', localPath: '/assets/icons' });
    expect(local('check?v=1.2#mark')).toBe('/assets/icons/check.svg?v=1.2#mark');
    expect(local('v1.2/check#mark')).toBe('/assets/icons/v1.2/check.svg#mark');
    expect(local('logo.PNG?version=2#mark')).toBe('/assets/icons/logo.PNG?version=2#mark');
  });
  it('retains pinned libraries, aliases, custom templates and base paths', () => {
    expect(resolveIconUrl({ name: 'heart', library: 'lucide', localPath: '' })).toContain('lucide-static@0.416.0/icons/heart.svg');
    expect(resolveIconUrl({ name: 'heart', library: 'fontawesome', libraryVersion: '7.0.0', localPath: '' })).toContain('@fortawesome/fontawesome-free@7.0.0');
    expect(resolveIconUrl({ name: 'logo.PNG', library: 'https://example.invalid/{name}?v=2#x', localPath: '' })).toBe('https://example.invalid/logo.PNG?v=2#x');
    expect(resolveIconUrl({ name: 'check.svg', library: '/custom/icons', localPath: '' })).toBe('/custom/icons/check.svg');
  });
  it('uses one explicit protocol policy for fetches, including non-browser imports', () => {
    expect(resolveFetchableIconUrl('/check.svg', { origin: 'https://example.invalid' })).toBe('https://example.invalid/check.svg');
    vi.stubGlobal('window', undefined);
    expect(resolveFetchableIconUrl('/check.svg', undefined)).toBe('/check.svg');
    expect(resolveFetchableIconUrl('data:image/svg+xml,%3Csvg/%3E', undefined)).toBe('data:image/svg+xml,%3Csvg/%3E');
    expect(resolveFetchableIconUrl('file:///check.svg', undefined)).toBe('file:///check.svg');
    expect(resolveFetchableIconUrl('blob:https://example.invalid/icon.svg', undefined)).toBe('blob:https://example.invalid/icon.svg');
    for (const url of ['javascript:inert.svg', 'data:text/html,inert', 'mailto:icon.svg']) {
      expect(() => resolveFetchableIconUrl(url, undefined)).toThrow(/HTTP/);
    }
  });
});
