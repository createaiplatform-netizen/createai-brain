import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authMiddleware }  from "./middlewares/authMiddleware";
import { scopeMiddleware } from "./middlewares/scopeMiddleware";
import router from "./routes";
import { getRegistry } from "./semantic/registry.js";

export { chatLimiter, heavyLimiter, editLimiter } from "./middlewares/rateLimiters";

const app: Express = express();

// ── Trust Replit's reverse proxy so req.ip is the real client IP ─────────────
// Required for rate limiters to key correctly on real IPs for unauthenticated
// requests (authenticated requests already key by userId, but defence in depth).
app.set("trust proxy", 1);

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ── CORS: explicit allowlist — never reflect arbitrary origins ───────────────
const ALLOWED_ORIGINS = [
  /\.replit\.app$/,
  /\.replit\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/,
];

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some(p => p.test(origin));
    callback(allowed ? null : new Error("CORS: origin not allowed"), allowed);
  },
}));

// ── Body size limits ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));
app.use(cookieParser());

// ── Public health check (no auth) ────────────────────────────────────────────
app.get("/healthz", (_req: Request, res: Response) => {
  res.json({
    status:    "ok",
    service:   "api-server",
    uptime_s:  Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── Root-level SEO: sitemap.xml + robots.txt ─────────────────────────────────
// Must be at domain root (not /api/) for Google to discover them.
const STORE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://localhost:8080";

app.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    const now = new Date().toISOString().split("T")[0];
    const urls = products.map(p => `
  <url>
    <loc>${STORE_URL}/api/semantic/store/${p.id}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.priceCents >= 1500 ? "0.9" : "0.7"}</priority>
  </url>`).join("");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${STORE_URL}/api/semantic/store</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`);
  } catch { res.status(500).send("<?xml version='1.0'?><error>Registry unavailable</error>"); }
});

app.get("/robots.txt", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(`User-agent: *
Allow: /api/semantic/store
Disallow: /api/semantic/checkout/
Disallow: /api/semantic/webhooks/
Disallow: /api/semantic/export/
Disallow: /api/

Sitemap: ${STORE_URL}/sitemap.xml
`);
});

app.use(authMiddleware);
app.use(scopeMiddleware);

app.use("/api", router);

// ── Global error handler (M-17) ──────────────────────────────────────────────
// Must be registered AFTER all routes. Express identifies error handlers by
// their 4-argument signature; the unused _next is required.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("[global-error]", err.stack ?? err.message);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
