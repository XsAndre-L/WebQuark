/// <reference types="bun" />
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const fixedFiles: Record<string, string> = {
  '/': 'viewer.html',
  '/viewer.js': 'viewer.js',
  '/feed-url.js': 'dist/feed-url.js',
};
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 4173,
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const filePath = fixedFiles[path] ?? (
      /^\/release-notes\/(?:releases\.[a-f0-9]+\.json|images\/[a-f0-9]+\.(?:png|jpe?g|webp|gif|avif|svg))$/.test(path)
        ? `dist${path}` : undefined
    );
    if (!filePath) return new Response('Not found', { status: 404 });
    const file = Bun.file(`${root}/${filePath}`);
    return await file.exists() ? new Response(file) : new Response('Run bun generate.ts first.', { status: 404 });
  },
});
console.log(`Release notes: ${server.url}`);
