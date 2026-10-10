#!/usr/bin/env node

import * as http from "http";
import * as fs from "fs";
import * as path from "path";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333;
// The same binary runs from the checkout or the umbrella's staged scripts directory.
const PACKAGE_DIR = path.resolve(eval("__dirname"), '..');
const packageManifest = JSON.parse(fs.readFileSync(path.join(PACKAGE_DIR, 'package.json'), 'utf8'));
const PUBLIC_DIR = path.join(PACKAGE_DIR, packageManifest.private ? '.stencil/dist/playground' : 'dist/playground');

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  // Decode URL to handle spaces/special characters
  const decodedUrl = decodeURIComponent(req.url || "");
  let filePath = path.join(PUBLIC_DIR, decodedUrl === "/" ? "index.html" : decodedUrl);

  // Basic path traversal protection
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If file doesn't exist, fall back to index.html (SPA routing support)
      filePath = path.join(PUBLIC_DIR, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 WebQuark Sandbox is running!`);
  console.log(`👉 http://localhost:${PORT}\n`);
});
