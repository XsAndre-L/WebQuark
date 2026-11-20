import { join, resolve } from 'node:path';

/** Mirrors a Pages project mount, including real 404s for missing or off-prefix files. */
export function servePlayground(basePath: string) {
  const directory = resolve('.stencil/dist/playground');
  const prefix = basePath.endsWith('/') ? basePath : basePath + '/';
  const files = new Map<string, string>();

  for (const path of new Bun.Glob('**/*').scanSync({ cwd: directory, onlyFiles: true })) {
    files.set(prefix + path.replaceAll('\\', '/'), join(directory, path));
  }
  files.set(prefix, join(directory, 'index.html'));

  return Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(request) {
      const path = files.get(new URL(request.url).pathname);
      return path ? new Response(Bun.file(path)) : new Response('Not found', { status: 404 });
    },
  });
}
