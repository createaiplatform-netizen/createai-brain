/**
 * storefront-server.js
 *
 * Minimal pure-Node.js reverse proxy.
 * Serves index.html at GET / and proxies every other request
 * to the API server on API_PORT.
 *
 * No external dependencies — uses only Node built-ins.
 *
 * Environment variables:
 *   PORT      Public-facing port (default 8080). Mapped to external 80 by Replit.
 *   API_PORT  Internal port where the api-server is listening (default 8082).
 */

"use strict";

const http = require("node:http");
const fs   = require("node:fs");
const path = require("node:path");

const PUBLIC_PORT = Number(process.env.PORT)     || 8080;
const API_PORT    = Number(process.env.API_PORT)  || 8082;
const HTML        = fs.readFileSync(path.join(__dirname, "index.html"));

const server = http.createServer((req, res) => {

  // ── Serve storefront at root ────────────────────────────────────────────────
  if (req.url === "/" || req.url === "") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML);
    return;
  }

  // ── Proxy everything else to the api-server ─────────────────────────────────
  const opts = {
    hostname: "127.0.0.1",
    port:     API_PORT,
    path:     req.url,
    method:   req.method,
    headers:  { ...req.headers, host: `127.0.0.1:${API_PORT}` },
  };

  const proxy = http.request(opts, (apiRes) => {
    res.writeHead(apiRes.statusCode, apiRes.headers);
    apiRes.pipe(res);
  });

  proxy.on("error", (err) => {
    console.error("[storefront] proxy error:", err.message);
    if (!res.headersSent) res.writeHead(502);
    res.end("Gateway error — api-server unavailable");
  });

  req.pipe(proxy);
});

server.listen(PUBLIC_PORT, () => {
  console.log(`[storefront] :${PUBLIC_PORT} → / serves index.html | all else proxied to :${API_PORT}`);
});
