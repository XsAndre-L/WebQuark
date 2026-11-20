import * as http from "http";
import * as fs from "fs";
import * as path from "path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

function acceptsGzip(header = ""): boolean {
  const weights = new Map<string, number>();
  for (const item of header.toLowerCase().split(",")) {
    const [encoding, quality] = item.trim().split(/\s*;\s*q\s*=\s*/);
    weights.set(encoding, quality === undefined ? 1 : Number(quality));
  }
  return (weights.get("gzip") ?? weights.get("*") ?? 0) > 0;
}

export function startSandbox(publicDirectory: string, port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333): http.Server {
  const PUBLIC_DIR = path.resolve(publicDirectory);
  const server = http.createServer((req, res) => {
    // Decode URL to handle spaces/special characters
    let decodedUrl: string;
    try {
      decodedUrl = decodeURIComponent((req.url || "/").split("?")[0]);
      if (decodedUrl.includes("\0")) throw new URIError("Invalid path");
    } catch {
      res.writeHead(400).end();
      return;
    }
    let filePath = path.join(PUBLIC_DIR, decodedUrl === "/" ? "index.html" : decodedUrl);

    // Basic path traversal protection
    if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
      res.statusCode = 403;
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        if (path.extname(filePath).toLowerCase() === ".mjs") {
          res.writeHead(404);
          res.end();
          return;
        }
        // If file doesn't exist, fall back to index.html (SPA routing support)
        filePath = path.join(PUBLIC_DIR, "index.html");
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const isModule = ext === ".mjs";
      const compressed = isModule && acceptsGzip(req.headers["accept-encoding"]) && fs.existsSync(filePath + ".gz");
      const stream = fs.createReadStream(compressed ? filePath + ".gz" : filePath);

      stream.once("open", () => {
        res.writeHead(200, {
          "Content-Type": contentType,
          ...(isModule ? { Vary: "Accept-Encoding" } : {}),
          ...(compressed ? { "Content-Encoding": "gzip" } : {}),
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        });
        stream.pipe(res);
      });
      stream.on("error", (error: NodeJS.ErrnoException) => {
        if (res.headersSent) res.destroy();
        else res.writeHead(error.code === "ENOENT" ? 404 : 500).end();
      });
      res.on("close", () => stream.destroy());
    });
  });

  server.listen(port, () => {
    console.log(`\n🚀 WebQuark Sandbox is running!`);
    const address = server.address();
    console.log(`👉 http://localhost:${typeof address === 'object' && address ? address.port : port}\n`);
  });
  return server;
}
