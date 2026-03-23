/**
 * storefront-server.js
 *
 * Pure-Node.js reverse proxy.
 * Proxies ALL requests (including "/") to the api-server, which serves
 * the compiled React SPA via selfHostEngine at the root path.
 *
 * No external dependencies — uses only Node built-ins.
 *
 * Environment variables:
 *   PORT      Public-facing port (default 8080). Mapped to external 80 by Replit.
 *   API_PORT  Internal port where the api-server is listening (default 8082).
 */

"use strict";

const http = require("node:http");

const PUBLIC_PORT = Number(process.env.PORT)    || 8080;
const API_PORT    = Number(process.env.API_PORT) || 8082;

const server = http.createServer((req, res) => {
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
  console.log(`[storefront] :${PUBLIC_PORT} → all requests proxied to api-server :${API_PORT}`);
});
