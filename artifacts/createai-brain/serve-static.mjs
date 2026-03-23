/**
 * serve-static.mjs — minimal SPA static server for CreateAI Brain
 * Runs as a direct `node` process so Replit's workflow runner
 * detects the open port without any pnpm/shell intermediary.
 *
 * Workflow command:
 *   node /home/runner/workspace/artifacts/createai-brain/serve-static.mjs
 */

import http from "http";
import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PORT  = parseInt(process.env.PORT ?? "5173", 10);
const __dir = path.dirname(fileURLToPath(import.meta.url));
const DIST  = path.join(__dir, "dist", "public");

const MIME = {
  ".html":  "text/html; charset=utf-8",
  ".js":    "application/javascript",
  ".mjs":   "application/javascript",
  ".css":   "text/css",
  ".json":  "application/json",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".gif":   "image/gif",
  ".svg":   "image/svg+xml",
  ".ico":   "image/x-icon",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
  ".ttf":   "font/ttf",
  ".webp":  "image/webp",
  ".mp4":   "video/mp4",
  ".webm":  "video/webm",
};

const INDEX = path.join(DIST, "index.html");

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";

  // ── Health check ─────────────────────────────────────────────
  if (url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
    res.end(JSON.stringify({ status: "ok", port: PORT, service: "createai-brain" }));
    return;
  }

  // ── Strip query string for file resolution ───────────────────
  const cleanUrl = url.split("?")[0];

  // ── Resolve file path ─────────────────────────────────────────
  let filePath = path.join(DIST, cleanUrl === "/" ? "index.html" : cleanUrl);

  // Prevent path traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Directory → try index.html inside it, or SPA fallback
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // SPA fallback: non-existent paths → index.html
  if (!fs.existsSync(filePath)) {
    filePath = INDEX;
  }

  const ext      = path.extname(filePath).toLowerCase();
  const mimeType = MIME[ext] ?? "application/octet-stream";

  // Long-cache for hashed assets, no-cache for HTML
  const isHashed = /\.[a-f0-9]{8,}\.\w+$/.test(path.basename(filePath));
  const cacheCtl = ext === ".html" || !isHashed
    ? "no-cache"
    : "public, max-age=31536000, immutable";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type":  mimeType,
      "Cache-Control": cacheCtl,
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ CreateAI Brain — static server ready on port ${PORT}`);
  console.log(`   Dist: ${DIST}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

server.on("error", (err) => {
  console.error("Server error:", err.message);
  process.exit(1);
});
