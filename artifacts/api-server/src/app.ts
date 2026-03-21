import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authMiddleware }  from "./middlewares/authMiddleware";
import { scopeMiddleware } from "./middlewares/scopeMiddleware";
import router from "./routes";
import { getRegistry } from "./semantic/registry.js";
import { getPublicBaseUrl } from "./utils/publicUrl.js";

// ── Clean-URL sub-routers (mounted before auth — all public surfaces) ────────
import platformHubRouter      from "./routes/platformHub.js";
import moneyHubRouter         from "./routes/moneyHub.js";
import signalSpaceRouter      from "./routes/signalSpace.js";
import coreOSRouter           from "./routes/coreOS.js";
import nexusRouter             from "./routes/nexus.js";
import bundleOSRouter          from "./routes/bundleOS.js";
import semanticStoreRouter    from "./routes/semanticStore.js";
import semanticLaunchRouter   from "./routes/semanticLaunch.js";
import semanticPortalRouter   from "./routes/semanticPortal.js";
import semanticSubRouter      from "./routes/semanticSubscription.js";

export { chatLimiter, heavyLimiter, editLimiter } from "./middlewares/rateLimiters";

const app: Express = express();

// ── Trust Replit's reverse proxy so req.ip is the real client IP ─────────────
app.set("trust proxy", 1);

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ── CORS allowlist ────────────────────────────────────────────────────────────
// Covers: Replit dev/prod domains + localhost + any configured custom domain.
const customDomain = process.env["PUBLIC_DOMAIN"]?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? "";
const ALLOWED_ORIGINS: RegExp[] = [
  /\.replit\.app$/,
  /\.replit\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/,
];
if (customDomain) {
  // Add the exact custom domain (both http and https just in case)
  const escaped = customDomain.replace(/\./g, "\\.");
  ALLOWED_ORIGINS.push(new RegExp(`^https?://(www\\.)?${escaped}$`));
}

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some(p => p.test(origin));
    callback(allowed ? null : new Error("CORS: origin not allowed"), allowed);
  },
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));
app.use(cookieParser());

// ── Health check (no auth) ────────────────────────────────────────────────────
app.get("/healthz", (_req: Request, res: Response) => {
  res.json({
    status:    "ok",
    service:   "api-server",
    uptime_s:  Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    domain:    getPublicBaseUrl(),
  });
});

// ── SEO: sitemap + robots (must be at domain root, before auth) ───────────────
app.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const BASE     = getPublicBaseUrl();
    const products = await getRegistry();
    const now      = new Date().toISOString().split("T")[0];
    const urls = products.map(p => `
  <url>
    <loc>${BASE}/store/${p.id}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.priceCents >= 1500 ? "0.9" : "0.7"}</priority>
  </url>`).join("");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE}/store</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.95</priority></url>
  <url><loc>${BASE}/join/landing</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>${urls}
</urlset>`);
  } catch { res.status(500).send("<?xml version='1.0'?><error>Registry unavailable</error>"); }
});

app.get("/robots.txt", (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(`User-agent: *
Allow: /
Allow: /store
Allow: /store/
Allow: /join/landing
Allow: /p/
Allow: /share/
Disallow: /buy/
Disallow: /checkout/
Disallow: /launch/
Disallow: /hub
Disallow: /api/semantic/webhooks/
Disallow: /api/semantic/export/
Disallow: /api/semantic/checkout/
Disallow: /api/

Sitemap: ${BASE}/sitemap.xml
`);
});

// ── Clean public URL layer (mounted BEFORE auth) ──────────────────────────────
// These are the canonical professional URLs for every platform surface.
// They work at the dev domain, at <project>.replit.app, and at any custom domain.
//
// URL Map:
//   /               → Platform homepage
//   /hub            → Admin directory
//   /p/:id          → Product page alias  (→ 301 /store/:id)
//   /buy/:id        → Direct checkout     (→ 302 /checkout/:id)
//   /share/:id      → Social share card   (→ 301 /launch/share/:id)
//   /store          → Product catalog
//   /store/:id      → Individual product page
//   /checkout/:id   → Stripe checkout
//   /export/...     → CSV / XML / JSON feeds
//   /launch/        → Revenue Launch Console
//   /launch/payments → Live payment feed
//   /launch/share/:id → OG-optimized share card
//   /launch/deliver → POST: manual delivery trigger
//   /launch/quick-links → All checkout URLs
//   /portal/me      → Customer self-service portal
//   /portal/lookup  → POST: email-gated purchase lookup
//   /join/landing   → Membership landing page
//   /join/plans     → Subscription plans JSON
//   /join/checkout/:priceId → Subscription checkout
app.use("/",       platformHubRouter);
app.use("/vault",  moneyHubRouter);
app.use("/ss",     signalSpaceRouter);   // /ss (console) · /ss/resolve · /ss/nodes · /ss/goto/:signal
app.use("/nexus",  nexusRouter);         // /nexus (console) · /nexus/resolve · /nexus/navigate · /nexus/presence · /nexus/whoami
app.use("/bundle", bundleOSRouter);     // /bundle (industry analysis) · /bundle/data (JSON)
app.use("/core",   coreOSRouter);        // /core (console) · legacy CORE OS — superseded by NEXUS
app.use("/",       semanticStoreRouter);     // /store, /store/:id, /checkout/:id, /export/...
app.use("/launch", semanticLaunchRouter);    // /launch/, /launch/payments, /launch/share/:id
app.use("/portal", semanticPortalRouter);    // /portal/me, /portal/lookup
app.use("/join",   semanticSubRouter);       // /join/landing, /join/plans, /join/checkout/:priceId

// ── Auth + private API ────────────────────────────────────────────────────────
app.use(authMiddleware);
app.use(scopeMiddleware);
app.use("/api", router);

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("[global-error]", err.stack ?? err.message);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
