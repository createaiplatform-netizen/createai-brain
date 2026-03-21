import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { authMiddleware }  from "./middlewares/authMiddleware";
import { scopeMiddleware } from "./middlewares/scopeMiddleware";
import { adminAuth, verifyAdminCookie } from "./middlewares/adminAuth.js";
import router from "./routes";
import { getRegistry } from "./semantic/registry.js";
import { getPublicBaseUrl } from "./utils/publicUrl.js";
import { bootstrapSchema } from "./lib/db.js";

// ── Route imports ────────────────────────────────────────────────────────────
import platformHubRouter    from "./routes/platformHub.js";
import moneyHubRouter       from "./routes/moneyHub.js";
import signalSpaceRouter    from "./routes/signalSpace.js";
import coreOSRouter         from "./routes/coreOS.js";
import nexusRouter           from "./routes/nexus.js";
import bundleOSRouter        from "./routes/bundleOS.js";
import valuationRouter       from "./routes/valuation.js";
import semanticStoreRouter  from "./routes/semanticStore.js";
import semanticLaunchRouter from "./routes/semanticLaunch.js";
import semanticPortalRouter from "./routes/semanticPortal.js";
import semanticSubRouter    from "./routes/semanticSubscription.js";
import adminAuthRouter      from "./routes/adminAuth.js";
import studioRouter         from "./routes/studio.js";
import platformStatusRouter from "./routes/platformStatus.js";
import pulseRouter          from "./routes/pulse.js";

export { chatLimiter, heavyLimiter, editLimiter } from "./middlewares/rateLimiters";

const app: Express = express();

// ── Bootstrap database schema on startup ─────────────────────────────────────
bootstrapSchema().catch(e => console.error("[DB] bootstrap error:", e instanceof Error ? e.message : String(e)));

// ── Trust Replit's reverse proxy so req.ip is the real client IP ─────────────
app.set("trust proxy", 1);

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ── Global rate limiting ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { ok: false, error: "Too many requests. Please slow down." },
  skip: (req) => req.path === "/healthz",
});
app.use(globalLimiter);

// ── CORS allowlist ────────────────────────────────────────────────────────────
const customDomain = process.env["PUBLIC_DOMAIN"]?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? "";
const ALLOWED_ORIGINS: RegExp[] = [
  /\.replit\.app$/,
  /\.replit\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/,
];
if (customDomain) {
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
// Webhook routes need the raw body Buffer for Stripe signature verification.
// We capture it in rawBody on req, then parse as JSON too.
app.use((req: express.Request & { rawBody?: Buffer }, res, next) => {
  if (req.path.includes("/webhooks/")) {
    express.raw({ type: "*/*", limit: "512kb" })(req, res, (err) => {
      if (err) { next(err); return; }
      // Store raw for signature verification, then parse as JSON if possible
      const buf = req.body as Buffer;
      req.rawBody = buf;
      try {
        req.body = JSON.parse(buf.toString("utf8")) as unknown;
      } catch {
        // Keep as buffer if not JSON
      }
      next();
    });
  } else {
    next();
  }
});
app.use(express.json({ limit: "512kb" }));
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

// ── SEO: sitemap + robots ─────────────────────────────────────────────────────
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
Disallow: /admin/
Disallow: /studio/
Disallow: /api/semantic/webhooks/
Disallow: /api/semantic/export/
Disallow: /api/semantic/checkout/
Disallow: /api/

Sitemap: ${BASE}/sitemap.xml
`);
});

// ── Admin auth (public — login page must not be behind auth) ──────────────────
app.use("/admin", adminAuthRouter);

// ── AI Studio (protected by admin auth) ──────────────────────────────────────
app.use("/studio", adminAuth, studioRouter);

// ── Platform Status (protected by admin auth) ─────────────────────────────────
app.use("/status", adminAuth, platformStatusRouter);

// ── PULSE — Real-Time Platform Awareness (protected by admin auth) ────────────
app.use("/pulse", adminAuth, pulseRouter);

// ── Path-level admin guards ───────────────────────────────────────────────────
// These intercept specific admin-only pages before the public router layer.
// We use path-specific guards (not prefix mounts) to avoid Express stripping the
// path prefix (which would make /hub → "/" inside the platformHub router).
function guardPath(...paths: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const matched = paths.some(p => req.path === p || req.path.startsWith(p + "/"));
    if (!matched) { next(); return; }
    const cookie = req.cookies?.["ADMIN_SESSION"] as string | undefined;
    if (cookie && verifyAdminCookie(cookie)) { next(); return; }
    const returnTo = encodeURIComponent(req.originalUrl);
    res.redirect(302, "/admin/login?return=" + returnTo);
  };
}

// Protect specific admin-only pages
app.use(guardPath("/hub", "/vault", "/bundle", "/valuation", "/launch/payments", "/launch/deliver", "/launch/quick-links", "/pulse"));

// ── Clean public URL layer (mounted BEFORE API auth) ──────────────────────────
// URL Map:
//   /               → Platform homepage
//   /hub            → Admin directory (admin-protected via guardPath above)
//   /vault          → Money hub (admin-protected)
//   /nexus          → NEXUS OS console
//   /bundle         → Business OS Bundle (admin-protected)
//   /valuation      → Platform valuation (admin-protected)
//   /store          → Product catalog
//   /store/:id      → Individual product page
//   /checkout/:id   → Stripe checkout
//   /export/...     → CSV / XML / JSON feeds
//   /launch/        → Revenue Launch Console
//   /launch/payments → Live payment feed (admin-protected via guardPath above)
//   /portal/me      → Customer self-service portal
//   /portal/lookup  → POST: email-gated purchase lookup
//   /join/landing   → Membership landing page
//   /join/plans     → Subscription plans JSON
//   /join/checkout/:priceId → Subscription checkout

app.use("/ss",        signalSpaceRouter);
app.use("/nexus",     nexusRouter);
app.use("/core",      coreOSRouter);
app.use("/bundle",    bundleOSRouter);
app.use("/valuation", valuationRouter);
app.use("/vault",     moneyHubRouter);
app.use("/launch",    semanticLaunchRouter);
app.use("/portal",    semanticPortalRouter);
app.use("/join",      semanticSubRouter);
app.use("/",          semanticStoreRouter);
app.use("/",          platformHubRouter);

// ── API (private — Replit auth + scope) ──────────────────────────────────────
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
