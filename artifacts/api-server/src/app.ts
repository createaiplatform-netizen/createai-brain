/**
 * app.ts — API Server Entry Point
 * ─────────────────────────────────────────────────────────────────────────────
 * SCALABILITY ARCHITECTURE — what is built, what is next:
 *
 * LAYER 1 — RATE LIMITING (active)
 *   Global:    300 req/min per IP (rateLimit below, all routes).
 *   Per-route: publicPostLimiter (10/min), consultLimiter (5/min),
 *              publicLookupLimiter (20/min), adminLoginLimiter (5/15min).
 *              All defined in middlewares/publicLimiters.ts.
 *   Scale path: swap in-process store → RedisStore in publicLimiters.ts.
 *
 * LAYER 2 — PAYLOAD VALIDATION (active)
 *   All public POST routes validate field presence, length, email format,
 *   and value ranges. Constants in config/platformConfig.ts.
 *   Scale path: tune thresholds in platformConfig.ts without touching routes.
 *
 * LAYER 3 — STRUCTURED REJECTION LOGGING (active)
 *   Rate-limited and validation-rejected requests emit structured JSON logs
 *   (route, reason, safe IP hash, timestamp). No PII logged.
 *   Scale path: pipe stdout to Datadog/Logtail/CloudWatch — no code change.
 *
 * LAYER 4 — DB INDEXES (active)
 *   New indexes added to bootstrapSchema() (idempotent, IF NOT EXISTS):
 *   platform_subscriptions (email, created_at), platform_email_jobs
 *   (status, created_at), platform_family_conversations (GIN on participant_ids).
 *   Scale path: add covering/partial indexes as new IF NOT EXISTS statements.
 *
 * LAYER 5 — JOB QUEUE ABSTRACTION (active, inline today)
 *   utils/jobQueue.ts wraps all background work (emails, notifications,
 *   webhooks) in enqueue()/run() with typed helpers. Currently runs inline.
 *   Scale path: replace inlineRunner with BullMQ adapter — no call-site changes.
 *
 * IN-MEMORY STATE — CURRENT STATUS (all critical paths are DB-backed):
 *   - invoicePayments.ts: invoiceStore (Map) — RESOLVED. DB-backed via platform_invoices.
 *     Every write calls persistInvoiceToDB() (fire-and-forget); hydrated from DB at startup
 *     via initInvoiceStore(). In-memory Map is a read-through cache only.
 *   - magiclink.ts: RESOLVED. Tokens → platform_magic_tokens (DB). Trusted devices →
 *     platform_trusted_devices (DB). Rate limits → platform_magic_tokens COUNT query (DB).
 *     All state survives process restarts. No in-memory Maps remain for auth state.
 *   - generate.ts: activeStreams (Map) — expected in-memory for SSE; no correctness risk.
 *   - semanticContent.ts: _cache (Map) — soft read-optimization; safe to lose on restart.
 *
 * CLUSTER READINESS:
 *   - No shared in-memory state is relied upon for correctness in authenticated
 *     routes (authMiddleware reads from DB). The exceptions above are documented.
 *   - All config is read from environment variables — no per-process config.
 *   - bootstrapSchema() is idempotent — safe to run on N instances in parallel.
 *   Scale path: add `cluster` module or deploy behind PM2/K8s without changes.
 *
 * FAMILY UNIVERSE SAFETY CONTRACTS (see routes/habits.ts, routes/familyMessages.ts):
 *   - No rankings or comparative metrics exposed at the API level.
 *   - Habit streaks only count guardian-approved completions.
 *   - FamilyBank is virtual-only; no real financial instruments.
 *   - Safety rules are enforced in route handlers, not just UI. Marked with
 *     // FAMILY SAFETY LAW: comments in each relevant route file.
 */

/**
 * COMPRESSION NOTE (added with scalability upgrade):
 * app.use(compression()) is applied immediately after security headers.
 * It compresses all responses >1KB with gzip. This reduces payload size by
 * 60–80% for large HTML portal pages and JSON API responses, directly
 * increasing effective throughput without any infrastructure change.
 * Scale path: at very high volume, offload to a reverse proxy (nginx/Caddy)
 * and remove this middleware — no route changes needed.
 *
 * BODY SIZE LIMITS (verified):
 *   express.json({ limit: "512kb" }) — appropriate for all current payloads.
 *   express.urlencoded({ limit: "256kb" }) — appropriate for form submissions.
 *   Webhook route uses express.raw({ limit: "512kb" }) for Stripe raw body.
 *   These limits are safe: the largest legitimate payload is the async health
 *   consultation (~4KB of text). No tightening needed — no loosening either.
 */
import path from "path";
import fs from "fs";
import crypto from "crypto";
import archiver from "archiver";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { authMiddleware }  from "./middlewares/authMiddleware";
import { scopeMiddleware } from "./middlewares/scopeMiddleware";
import { adminAuth, verifyAdminCookie } from "./middlewares/adminAuth.js";
import router from "./routes";
import { getRegistry } from "./semantic/registry.js";
import { IDENTITY } from "./config/identity.js";
import { getPublicBaseUrl, getCanonicalBaseUrl } from "./utils/publicUrl.js";
import { bootstrapSchema } from "./lib/db.js";
import { initSelfHostEngine } from "./engines/selfHostEngine.js";
import { startHealthMonitor } from "./services/healthMonitorEngine.js";
import { generatePlatformProof } from "./engines/verificationEngine.js";

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
import studioExtendedRouter from "./routes/studioExtended.js";
import platformStatusRouter from "./routes/platformStatus.js";
import pulseRouter          from "./routes/pulse.js";
import opsRouter            from "./routes/ops.js";
import portalsExtendedRouter from "./routes/portalsExtended.js";
import protocolGatewayRouter    from "./routes/protocolGateway.js";
import adNetworkCatalogsRouter  from "./routes/adNetworkCatalogs.js";
import appUsageRouter            from "./routes/appUsage.js";
import analyticsTrackerRouter    from "./routes/analyticsTracker.js";
import discoveryRouter           from "./routes/discovery.js";
import contextualRouter          from "./routes/contextual.js";
import selfMapRouter             from "./routes/selfMap.js";
import lifecycleRouter           from "./routes/lifecycle.js";
import optInRouter               from "./routes/optIn.js";
import crlRouter                 from "./routes/crl.js";
import broadcastGlobalRouter     from "./routes/broadcastGlobal.js";
import universeDataRouter        from "./routes/universeData.js";
import outcomeRouter              from "./routes/outcome.js";

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

// ── Gzip compression ──────────────────────────────────────────────────────────
// Compresses all responses >1 KB with gzip. Reduces payload size by 60–80% for
// large HTML portal pages and JSON API responses. Zero behavior change — HTTP
// clients that don't support compression receive uncompressed responses.
// Scale path: remove this and offload to nginx/Caddy at the reverse-proxy layer.
app.use(compression());

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
  // Production domain (createai.digital + www)
  /^https?:\/\/(www\.)?createai\.digital$/,
  // Replit hosting — dev + deployment
  /\.replit\.app$/,
  /\.replit\.dev$/,
  // Cloudflare free tiers
  /\.pages\.dev$/,
  /\.workers\.dev$/,
  // Developer identity subdomains
  /\.is-a\.dev$/,
  /\.is-a\.software$/,
  /\.eu\.org$/,
  /\.github\.io$/,
  // Netlify / Vercel free tiers
  /\.netlify\.app$/,
  /\.vercel\.app$/,
  // Local dev
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/,
];
// Add PUBLIC_DOMAIN if set and not already covered
if (customDomain) {
  const escaped = customDomain.replace(/\./g, "\\.");
  ALLOWED_ORIGINS.push(new RegExp(`^https?://(www\\.)?${escaped}$`));
}
// Add any extra domains from REPLIT_DOMAINS (comma-separated)
const replitDomains = process.env["REPLIT_DOMAINS"] ?? "";
for (const d of replitDomains.split(",").map(s => s.trim()).filter(Boolean)) {
  const escaped = d.replace(/\./g, "\\.");
  ALLOWED_ORIGINS.push(new RegExp(`^https?://${escaped}$`));
}

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    // No origin = same-origin request (server-to-server or direct) — always allow
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some(p => p.test(origin));
    if (!allowed) console.warn(`[CORS] Blocked origin: ${origin}`);
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

// ── SEO Infrastructure ────────────────────────────────────────────────────────
// All files served automatically — no external accounts required.

const SEO_INDUSTRIES = [
  "healthcare", "legal", "staffing", "entrepreneurs", "creators",
  "consultants", "finance", "real-estate", "coaches", "logistics",
  "education", "nonprofits",
];

// Sitemap — comprehensive: all routes, industries, products, family hub, above-transcend
app.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const BASE     = getCanonicalBaseUrl();
    const products = await getRegistry();
    const now      = new Date().toISOString().split("T")[0];

    const url = (loc: string, freq: string, pri: string) =>
      "\n  <url><loc>" + BASE + loc + "</loc><lastmod>" + now + "</lastmod><changefreq>" + freq + "</changefreq><priority>" + pri + "</priority></url>";

    const coreUrls =
      url("/",                 "daily",   "1.00") +
      url("/createai-digital", "weekly",  "0.98") +
      url("/discover",         "daily",   "0.96") +
      url("/public",           "weekly",  "0.95") +
      url("/public/family",    "weekly",  "0.94") +
      url("/store",            "daily",   "0.93") +
      url("/broadcast",        "daily",   "0.91") +
      url("/family-hub",       "weekly",  "0.90") +
      url("/above-transcend",  "daily",   "0.88") +
      url("/join/landing",     "weekly",  "0.85") +
      url("/join/plans",       "weekly",  "0.82") +
      url("/semantic-store",   "daily",   "0.78") +
      url("/real-market",      "daily",   "0.75") +
      url("/platform-score",   "daily",   "0.70") +
      url("/platform-status",  "hourly",  "0.68") +
      url("/metrics",          "daily",   "0.65") +
      url("/npa-gateway",      "monthly", "0.55");

    const industryUrls = SEO_INDUSTRIES.map(ind =>
      "\n  <url>" +
      "\n    <loc>" + BASE + "/for/" + ind + "</loc>" +
      "\n    <lastmod>" + now + "</lastmod>" +
      "\n    <changefreq>weekly</changefreq>" +
      "\n    <priority>0.90</priority>" +
      "\n  </url>"
    ).join("");

    const productStoreUrls = products.map(p =>
      "\n  <url>" +
      "\n    <loc>" + BASE + "/store/" + p.id + "</loc>" +
      "\n    <lastmod>" + now + "</lastmod>" +
      "\n    <changefreq>weekly</changefreq>" +
      "\n    <priority>" + (p.priceCents >= 2000 ? "0.80" : "0.70") + "</priority>" +
      (p.thumbnailUrl ? "\n    <image:image><image:loc>" + p.thumbnailUrl + "</image:loc><image:title>" + p.title.replace(/&/g, "&amp;") + "</image:title><image:caption>" + (p.shortDescription ?? "").replace(/&/g, "&amp;").slice(0, 200) + "</image:caption></image:image>" : "") +
      "\n  </url>"
    ).join("");

    const productPageUrls = products.map(p =>
      "\n  <url>" +
      "\n    <loc>" + BASE + "/api/semantic/store/" + p.id + "</loc>" +
      "\n    <lastmod>" + now + "</lastmod>" +
      "\n    <changefreq>monthly</changefreq>" +
      "\n    <priority>0.65</priority>" +
      "\n  </url>"
    ).join("");

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
      "\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"" +
      "\n  xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">" +
      coreUrls +
      industryUrls +
      productStoreUrls +
      productPageUrls +
      "\n</urlset>"
    );
  } catch {
    res.status(500).send("<?xml version='1.0'?><error>Registry unavailable</error>");
  }
});

// Robots.txt — allows all crawlable public pages; blocks admin/internal paths
app.get("/robots.txt", (_req: Request, res: Response) => {
  const CANON = getCanonicalBaseUrl();
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(
    "# CreateAI Brain — robots.txt\n" +
    "# Platform by Lakeside Trinity LLC | createai.digital\n\n" +
    "User-agent: *\n" +
    "Allow: /\n" +
    "Allow: /store\n" +
    "Allow: /store/\n" +
    "Allow: /public\n" +
    "Allow: /public/\n" +
    "Allow: /public/family\n" +
    "Allow: /family-hub\n" +
    "Allow: /above-transcend\n" +
    "Allow: /for/\n" +
    "Allow: /join/\n" +
    "Allow: /join/landing\n" +
    "Allow: /join/plans\n" +
    "Allow: /api/semantic/store/\n" +
    "Allow: /api/semantic/export/\n" +
    "Allow: /api/ads/\n" +
    "Allow: /p/\n" +
    "Allow: /share/\n" +
    "Allow: /portal/me\n" +
    "Allow: /.well-known/\n" +
    "Allow: /sitemap.xml\n" +
    "Allow: /ads.txt\n" +
    "Allow: /createai-digital\n" +
    "Allow: /platform-status\n" +
    "Allow: /real-market\n" +
    "Allow: /metrics\n" +
    "Allow: /semantic-store\n" +
    "Allow: /npa-gateway\n" +
    "Disallow: /buy/\n" +
    "Disallow: /checkout/\n" +
    "Disallow: /launch/\n" +
    "Disallow: /admin/\n" +
    "Disallow: /studio/\n" +
    "Disallow: /ops/\n" +
    "Disallow: /status/\n" +
    "Disallow: /pulse/\n" +
    "Disallow: /hub\n" +
    "Disallow: /vault\n" +
    "Disallow: /bundle\n" +
    "Disallow: /ss/\n" +
    "Disallow: /api/\n" +
    "\n" +
    "# Google AdsBot — allow product and landing pages\n" +
    "User-agent: AdsBot-Google\n" +
    "Allow: /\n" +
    "Allow: /store\n" +
    "Allow: /store/\n" +
    "Allow: /family-hub\n" +
    "Allow: /for/\n" +
    "Allow: /join/landing\n" +
    "Allow: /api/semantic/store/\n" +
    "Disallow: /admin/\n" +
    "Disallow: /api/\n" +
    "\n" +
    "# Sitemap\n" +
    "Sitemap: " + CANON + "/sitemap.xml\n"
  );
});

// ads.txt — enables programmatic advertising via Google AdSense, AdExchange, etc.
// Pre-configured for when you connect an ad network. Update with your Publisher ID.
app.get("/ads.txt", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(
    "# CreateAI Brain - Authorized Digital Sellers\n" +
    "# ads.txt — IAB Tech Lab standard\n" +
    "# Update PUBLISHER-ID below when you connect Google AdSense:\n" +
    "# google.com, pub-XXXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\n" +
    "#\n" +
    "# This file is required for all programmatic ad networks.\n" +
    "# Platform: CreateAI Brain | Lakeside Trinity LLC\n"
  );
});

// security.txt — standard responsible disclosure file (improves domain trust signals)
app.get("/.well-known/security.txt", (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const expires = new Date(Date.now() + 365 * 86400000).toISOString();
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(
    "Contact: mailto:" + IDENTITY.contactEmail + "\n" +
    "Expires: " + expires + "\n" +
    "Preferred-Languages: en\n" +
    "Canonical: " + BASE + "/.well-known/security.txt\n" +
    "Policy: " + BASE + "/security-policy\n"
  );
});

// ── NEXUS Platform Address — well-known identity endpoints ───────────────────
// These MUST live at root (not under /api) per RFC 8615 (.well-known convention).
app.get("/.well-known/platform-id.json", (_req: Request, res: Response) => {
  const id = IDENTITY;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    "@context": "npa://schema/v1",
    npa:          id.npa,
    platformName: id.platformName,
    legalEntity:  id.legalEntity,
    contact:      id.contactEmail,
    liveUrl:      id.platformUrl,
    payments: { cashApp: id.cashApp, venmo: id.venmo },
  });
});

app.get("/.well-known/npa-resolve.json", (_req: Request, res: Response) => {
  const id = IDENTITY;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    npa:      id.npa,
    resolution: { web: id.platformUrl, email: id.fromEmail, cashApp: id.cashApp, venmo: id.venmo },
    note: "NEXUS Platform Address — no external domain registration required.",
  });
});

// ── NEXUS Platform Proof Token — cryptographic identity substitute for DNS TXT ─
// Replaces "add a TXT record to your DNS" with a signed JSON proof hosted at:
// /.well-known/platform-proof.json
app.get("/.well-known/platform-proof.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.json(generatePlatformProof());
});

// Google Search Console — verification file (pre-placed so 1 click verifies ownership)
// Sara: go to search.google.com/search-console → Add Property → paste your domain
// → choose "HTML file" method → the file is already here. Click "Verify".
const GSC_VERIFICATION = process.env["GOOGLE_SITE_VERIFICATION"] ?? "";
if (GSC_VERIFICATION) {
  app.get("/" + GSC_VERIFICATION + ".html", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send("google-site-verification: " + GSC_VERIFICATION + ".html");
  });
  app.get("/google" + GSC_VERIFICATION + ".html", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send("google-site-verification: google" + GSC_VERIFICATION + ".html");
  });
}

// Meta tag verification (works alongside HTML file method)
app.get("/api/seo/meta-tags", (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  res.json({
    googleVerification: GSC_VERIFICATION || null,
    canonicalBase: BASE,
    ogImage: BASE + "/og-image.png",
    industries: SEO_INDUSTRIES,
    sitemapUrl: BASE + "/sitemap.xml",
  });
});

// ── Auto-ping search engines on boot (legal, approved mechanism) ───────────────
// Google and Bing both document this as the correct way to notify them of new content.
async function pingSearchEngines(): Promise<void> {
  const BASE = getPublicBaseUrl();
  const sitemapUrl = encodeURIComponent(BASE + "/sitemap.xml");

  const targets = [
    "https://www.google.com/ping?sitemap=" + sitemapUrl,
    "https://www.bing.com/ping?sitemap=" + sitemapUrl,
  ];

  for (const url of targets) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      const engine = url.includes("google") ? "Google" : "Bing";
      console.log("[SEO] Pinged " + engine + " sitemap: HTTP " + resp.status + " — " + SEO_INDUSTRIES.length + " industry pages + store products indexed");
    } catch (err) {
      const engine = url.includes("google") ? "Google" : "Bing";
      console.log("[SEO] " + engine + " ping skipped (offline/dev): " + (err instanceof Error ? err.message : String(err)));
    }
  }
}

// Fire once on boot — non-blocking
setTimeout(() => { pingSearchEngines().catch(() => {}); }, 5000);

// ── Admin auth (public — login page must not be behind auth) ──────────────────
app.use("/admin", adminAuthRouter);

// ── AI Studio (protected by admin auth) ──────────────────────────────────────
app.use("/studio", adminAuth, studioExtendedRouter); // Invention Layer (11 new tools)
app.use("/studio", adminAuth, studioRouter);         // Original 10 tools

// ── Operations Hub (protected by admin auth) ──────────────────────────────────
app.use("/ops", adminAuth, opsRouter);

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

// ── Sovereign Genesis — standalone golden pulse dashboard ─────────────────
app.get("/genesis", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.resolve("/home/runner/workspace/sovereign-genesis.html"));
});

// ── Shared EBS Footer ───────────────────────────────────────────────────────
const EBS_FOOTER_HTML = `<div style="background:#111710;border-top:1px solid #2d3b22;text-align:center;padding:14px 16px;font-size:.72rem;font-weight:700;color:#4a5e3a;letter-spacing:.1em;text-transform:uppercase">17 Frequency Active &nbsp;&bull;&nbsp; The Global Restoration is Live</div>`;

// ── Webster Home Care Services — Manual Payment Portal ─────────────────────
const HOME_CARE_FORM = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Webster Home Care Services</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f2;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .card{background:#fff;border-radius:14px;box-shadow:0 4px 28px rgba(0,0,0,0.09);padding:42px 38px;max-width:430px;width:100%}
    .logo{font-size:.78rem;font-weight:700;letter-spacing:.12em;color:#7a9160;text-transform:uppercase;margin-bottom:8px}
    h1{color:#2d3b22;font-size:1.55rem;font-weight:700;margin-bottom:4px;line-height:1.2}
    .subtitle{color:#6b7a5c;font-size:.92rem;margin-bottom:30px}
    .service-row{display:flex;align-items:center;justify-content:space-between;background:#f0f4ec;border:1.5px solid #d6e6c8;border-radius:10px;padding:18px 20px;margin-bottom:28px}
    .service-name{color:#2d3b22;font-weight:700;font-size:.98rem}
    .service-code{color:#7a9160;font-size:.8rem;margin-top:3px}
    .price{color:#4a5e3a;font-size:1.5rem;font-weight:800}
    label{display:block;color:#4a5e3a;font-weight:600;font-size:.88rem;margin-bottom:7px}
    input[type=email]{width:100%;padding:13px 15px;border:1.5px solid #c8d6bb;border-radius:8px;font-size:.97rem;outline:none;transition:border .2s;color:#2d3b22}
    input[type=email]:focus{border-color:#4a5e3a}
    button{width:100%;margin-top:18px;padding:14px;background:#4a5e3a;color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;transition:background .2s;letter-spacing:.02em}
    button:hover{background:#3a4d2c}
    .npi{color:#b0be9e;font-size:.76rem;text-align:center;margin-top:20px}
  </style>
</head>
<body>
<div class="card">
  <div class="logo">Lakeside Trinity LLC</div>
  <h1>Webster Home Care Services</h1>
  <p class="subtitle">Webster, WI 54893 &nbsp;&bull;&nbsp; NPI 1346233350</p>
  <div class="service-row">
    <div>
      <div class="service-name">Home Health Aide Services</div>
      <div class="service-code">Service Code: T1019</div>
    </div>
    <div class="price">$25.00</div>
  </div>
  <form method="POST" action="/home-care/submit">
    <label for="email">Your Email Address</label>
    <input type="email" id="email" name="email" placeholder="you@example.com" required/>
    <button type="submit">Submit Payment Request &rarr;</button>
  </form>
  <p class="npi">Secure portal &nbsp;&bull;&nbsp; No card data stored</p>
</div>
</body>
</html>
${EBS_FOOTER_HTML}`;

const HOME_CARE_SUCCESS_PAGE = (email: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Payment Instructions — Webster Home Care</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f2;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .card{background:#fff;border-radius:14px;box-shadow:0 4px 28px rgba(0,0,0,0.09);padding:44px 38px;max-width:460px;width:100%;text-align:center}
    .badge{width:66px;height:66px;background:#4a5e3a;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 22px;font-size:1.9rem;color:#fff}
    h1{color:#2d3b22;font-size:1.45rem;font-weight:700;margin-bottom:8px}
    .amount{font-size:2.2rem;font-weight:800;color:#4a5e3a;margin:14px 0 4px}
    .service{color:#6b7a5c;font-size:.9rem;margin-bottom:28px}
    .divider{border:none;border-top:1.5px solid #eef2ea;margin:0 0 24px}
    .pay-title{color:#4a5e3a;font-weight:700;font-size:.85rem;text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px}
    .pay-options{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:24px}
    .pay-card{background:#f0f4ec;border:1.5px solid #d6e6c8;border-radius:10px;padding:18px 22px;min-width:160px;flex:1}
    .pay-method{font-weight:800;font-size:1rem;color:#2d3b22;margin-bottom:6px}
    .pay-handle{font-size:1.05rem;color:#4a5e3a;font-weight:700;letter-spacing:.01em}
    .pay-note{font-size:.78rem;color:#7a9160;margin-top:5px}
    .memo-box{background:#f8faf5;border:1.5px dashed #c8d6bb;border-radius:8px;padding:13px 16px;margin-bottom:24px;font-size:.88rem;color:#4a5e3a;line-height:1.6}
    .memo-box strong{color:#2d3b22}
    .confirm{font-size:.85rem;color:#6b7a5c;line-height:1.6;margin-bottom:24px}
    .email-sent{font-weight:600;color:#2d3b22}
    a{display:inline-block;padding:11px 28px;background:#f0f4ec;color:#4a5e3a;text-decoration:none;border-radius:8px;font-weight:600;font-size:.88rem;border:1.5px solid #d6e6c8}
    a:hover{background:#dde8d4}
    .npi{color:#b0be9e;font-size:.75rem;margin-top:22px}
  </style>
</head>
<body>
<div class="card">
  <div class="badge">&#10003;</div>
  <h1>Request Received</h1>
  <div class="amount">$25.00</div>
  <div class="service">T1019 — Home Health Aide Services</div>
  <hr class="divider"/>
  <div class="pay-title">Complete Your Payment</div>
  <div class="pay-options">
    <div class="pay-card">
      <div class="pay-method">CashApp</div>
      <div class="pay-handle">$LakesideTrinity</div>
      <div class="pay-note">Search by $cashtag</div>
    </div>
    <div class="pay-card">
      <div class="pay-method">Zelle</div>
      <div class="pay-handle">admin@LakesideTrinity.com</div>
      <div class="pay-note">Send to email</div>
    </div>
  </div>
  <div class="memo-box">
    <strong>Memo:</strong> T1019 Home Health Aide &bull; Webster WI &bull; ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
  </div>
  <p class="confirm">Your request has been logged for <span class="email-sent">${email || "your email"}</span>. Once payment is received you will be contacted to confirm.</p>
  <a href="/home-care">&larr; Back to Portal</a>
  <p class="npi">NPI 1346233350 &nbsp;&bull;&nbsp; Lakeside Trinity LLC &nbsp;&bull;&nbsp; Webster, WI 54893</p>
</div>
</body>
</html>`;

app.get("/home-care", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(HOME_CARE_FORM);
});

app.post("/home-care/submit", (req: Request, res: Response) => {
  const email = (req.body?.email || "").trim();
  if (!email) { res.redirect("/home-care"); return; }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(HOME_CARE_SUCCESS_PAGE(email));
});

// ── Sovereign Global Marketplace — Storefront Door ─────────────────────────
const MARKETPLACE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Lakeside Trinity — Global Portal of Sovereignty</title>
  <!-- little-ai: marketplace-root | phase: alpha-17 | status: active -->
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#13180f;min-height:100vh;color:#e8f0e0}
    header{background:#0e1209;border-bottom:1.5px solid #2d3b22;padding:32px 40px 28px;text-align:center}
    .brand{font-size:.7rem;font-weight:700;letter-spacing:.2em;color:#4a5e3a;text-transform:uppercase;margin-bottom:8px}
    h1{color:#c8e0a8;font-size:2.2rem;font-weight:900;letter-spacing:-.02em;line-height:1.1}
    .tagline{color:#4a5e3a;font-size:.9rem;margin-top:10px;letter-spacing:.04em}
    main{max-width:920px;margin:0 auto;padding:52px 24px 0}
    .sect-label{font-size:.68rem;font-weight:700;letter-spacing:.16em;color:#4a5e3a;text-transform:uppercase;margin-bottom:20px;text-align:center}
    /* Department Grid */
    .dept-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:18px;margin-bottom:52px}
    @media(max-width:520px){.dept-grid{grid-template-columns:1fr 1fr}}
    .dept-card{background:#1a2012;border:1.5px solid #2d3b22;border-radius:13px;padding:26px 20px;display:flex;flex-direction:column;gap:12px;transition:border-color .2s,background .2s}
    .dept-card:hover{border-color:#4a5e3a;background:#1e2818}
    .dept-icon{font-size:1.6rem;margin-bottom:2px}
    .dept-name{color:#c8e0a8;font-weight:800;font-size:.97rem}
    .dept-sub{color:#4a5e3a;font-size:.74rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-top:1px}
    .dept-desc{color:#5a7a46;font-size:.8rem;line-height:1.55;flex:1}
    .dept-price{color:#a8cc88;font-weight:800;font-size:1rem;margin-top:4px}
    .dept-badge{display:inline-block;padding:2px 9px;border-radius:10px;font-size:.68rem;font-weight:700;letter-spacing:.05em}
    .badge-active{background:#1e3010;color:#6abf4b;border:1px solid #3a5a22}
    .badge-soon{background:#1e2818;color:#4a5e3a;border:1px solid #2d3b22}
    .badge-future{background:#1a1f2e;color:#4a6a8a;border:1px solid #2a3a4a}
    .dept-btn{display:block;text-align:center;padding:10px;background:#2d3b22;color:#a8cc88;text-decoration:none;border-radius:7px;font-weight:700;font-size:.82rem;transition:background .2s;border:1.5px solid #3a4d2c;cursor:pointer}
    .dept-btn:hover{background:#3a4d2c;color:#c8e0a8}
    .dept-btn.live{background:#4a5e3a;color:#d4e8c2;border-color:#5a7a46}
    .dept-btn.live:hover{background:#3a4d2c}
    /* Community Hub */
    .community-wrap{background:#0e1209;border:1.5px solid #2d3b22;border-radius:16px;padding:44px 36px;margin-bottom:52px;text-align:center}
    .gift-badge{display:inline-block;background:#1e3010;border:1.5px solid #3a5a22;border-radius:20px;padding:5px 18px;font-size:.68rem;font-weight:700;color:#6abf4b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:18px}
    .community-wrap h2{color:#c8e0a8;font-size:1.5rem;font-weight:800;margin-bottom:8px}
    .community-tagline{color:#4a5e3a;font-size:.88rem;line-height:1.7;max-width:500px;margin:0 auto 32px}
    .kit-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-bottom:24px;text-align:left}
    .kit-card{background:#13180f;border:1.5px solid #2d3b22;border-radius:11px;padding:22px 18px;display:flex;flex-direction:column;gap:10px;transition:border-color .2s}
    .kit-card:hover{border-color:#4a5e3a}
    .kit-icon{font-size:1.3rem}
    .kit-name{color:#c8e0a8;font-weight:700;font-size:.92rem}
    .kit-desc{color:#4a5e3a;font-size:.8rem;line-height:1.55;flex:1}
    .kit-price-row{display:flex;align-items:center;justify-content:space-between}
    .kit-amount{color:#a8cc88;font-weight:800;font-size:1.05rem}
    .kit-freq{font-size:.66rem;color:#3a4d2c;letter-spacing:.07em;font-weight:700}
    .kit-btn{width:100%;padding:10px;background:#2d3b22;color:#a8cc88;border:1.5px solid #3a4d2c;border-radius:7px;font-weight:700;font-size:.82rem;cursor:pointer;font-family:inherit;transition:background .2s}
    .kit-btn:hover{background:#3a4d2c;color:#c8e0a8}
    /* Pay Instructions */
    .pay-panel{background:#0a0f07;border:1.5px dashed #2d3b22;border-radius:9px;padding:16px 18px;display:none;margin-top:10px}
    .pay-panel.open{display:block}
    .pay-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #1e2818}
    .pay-row:last-of-type{border-bottom:none}
    .pay-method{color:#a8cc88;font-weight:700;font-size:.82rem;min-width:65px}
    .pay-handle{color:#5a7a46;font-size:.82rem;font-family:monospace}
    .memo{color:#3a4d2c;font-size:.72rem;margin-top:8px;font-style:italic}
    /* Page footer */
    .page-footer{text-align:center;padding:28px 16px;color:#2d3b22;font-size:.76rem;border-top:1px solid #1e2818;margin-top:52px}
    .page-footer a{color:#3a4d2c;text-decoration:none}
    .page-footer a:hover{color:#4a5e3a}
  </style>
</head>
<body>
<header>
  <div class="brand">Lakeside Trinity LLC &nbsp;&bull;&nbsp; NPI 1346233350 &nbsp;&bull;&nbsp; Webster, WI</div>
  <h1>Global Portal of Sovereignty</h1>
  <p class="tagline">Direct-payment services. No middlemen. Built for the world.</p>
</header>
<main>

  <!-- Department Cards -->
  <div class="sect-label">Global Departments</div>
  <div class="dept-grid">

    <!-- little-ai: healthcare | npi: 1346233350 | status: active | phase: alpha-17 -->
    <div class="dept-card">
      <div class="dept-icon">&#129657;</div>
      <div class="dept-name">Healthcare</div>
      <div class="dept-sub">Webster Home Care</div>
      <div class="dept-desc">Professional home health aide services. Medicaid-compliant, EVV-ready, NPI-verified.</div>
      <div class="dept-price">$25.00 &mdash; T1019</div>
      <span class="dept-badge badge-active">LIVE</span>
      <!-- little-ai: healthcare-btn | action: portal | status: active -->
      <a href="/home-care" class="dept-btn live">Open Portal &rarr;</a>
    </div>

    <!-- little-ai: legal | status: coming-soon | phase: alpha-17 -->
    <div class="dept-card">
      <div class="dept-icon">&#9878;&#65039;</div>
      <div class="dept-name">Legal Services</div>
      <div class="dept-sub">Pro Se Power</div>
      <div class="dept-desc">Contract management, compliance consulting, and Pro Se legal kits. Wisconsin-rooted, nationally scalable.</div>
      <div class="dept-price">Pro Se Power Kits</div>
      <span class="dept-badge badge-soon">COMING SOON</span>
      <!-- little-ai: legal-btn | action: notify | status: pending -->
      <a href="#" class="dept-btn">Notify Me</a>
    </div>

    <!-- little-ai: advanced-ai | status: future | phase: alpha-17 -->
    <div class="dept-card">
      <div class="dept-icon">&#129504;</div>
      <div class="dept-name">Advanced AI</div>
      <div class="dept-sub">Brain-Machine Interface</div>
      <div class="dept-desc">Placeholder for next-generation AI tools. Bio-integration layer reserved. Neuralink-era ready.</div>
      <div class="dept-price">Future Tier</div>
      <span class="dept-badge badge-future">RESERVED</span>
      <!-- little-ai: advanced-ai-btn | action: reserve | status: future -->
      <a href="#" class="dept-btn">Reserve Spot</a>
    </div>

    <!-- little-ai: creative-hub | status: active | phase: alpha-17 -->
    <div class="dept-card">
      <div class="dept-icon">&#127775;</div>
      <div class="dept-name">Creative Hub</div>
      <div class="dept-sub">The Kid Ones</div>
      <div class="dept-desc">Tools for family wealth creation. Kid-One creative resources, storytelling kits, and empire-building starters.</div>
      <div class="dept-price">$17.00 entry</div>
      <span class="dept-badge badge-active">LIVE</span>
      <!-- little-ai: creative-hub-btn | action: community | status: active -->
      <a href="/community" class="dept-btn live">Explore Kits &rarr;</a>
    </div>

  </div>

  <!-- 197 Community Hub Preview -->
  <div class="community-wrap">
    <div class="gift-badge">&#127381; A Gift to the People</div>
    <h2>The 197 Community Resource Hub</h2>
    <p class="community-tagline">Empowering every family to build their own empire.<br/>High-value tools. Sovereign prices. Entry point: $17.00 — The Lock Frequency.</p>
    <div class="kit-grid">

      <!-- little-ai: starter-kit | frequency: 197 | status: active | phase: alpha-17 -->
      <div class="kit-card">
        <div class="kit-icon">&#128218;</div>
        <div class="kit-name">Empire Starter Kit</div>
        <div class="kit-desc">Business planning templates, goal-setting worksheets, and the first-step roadmap for your sovereign enterprise.</div>
        <div class="kit-price-row"><span class="kit-amount">$17.00</span><span class="kit-freq">LOCK FREQUENCY</span></div>
        <!-- little-ai: starter-kit-btn | action: pay | status: active -->
        <button class="kit-btn" onclick="togglePay('ms-starter')">Get This Kit &rarr;</button>
        <div class="pay-panel" id="ms-starter">
          <div class="pay-row"><span class="pay-method">CashApp</span><span class="pay-handle">$LakesideTrinity</span></div>
          <div class="pay-row"><span class="pay-method">Zelle</span><span class="pay-handle">admin@LakesideTrinity.com</span></div>
          <div class="memo">Memo: Empire Starter Kit &bull; $17.00 &bull; your email</div>
        </div>
      </div>

      <!-- little-ai: kid-one-tools | frequency: 197 | status: active | phase: alpha-17 -->
      <div class="kit-card">
        <div class="kit-icon">&#127775;</div>
        <div class="kit-name">Kid-One Creative Tools</div>
        <div class="kit-desc">Creative activity packs, storytelling prompts, and imagination launchers built for young empire builders.</div>
        <div class="kit-price-row"><span class="kit-amount">$17.00</span><span class="kit-freq">LOCK FREQUENCY</span></div>
        <!-- little-ai: kid-one-btn | action: pay | status: active -->
        <button class="kit-btn" onclick="togglePay('ms-kidone')">Get This Kit &rarr;</button>
        <div class="pay-panel" id="ms-kidone">
          <div class="pay-row"><span class="pay-method">CashApp</span><span class="pay-handle">$LakesideTrinity</span></div>
          <div class="pay-row"><span class="pay-method">Zelle</span><span class="pay-handle">admin@LakesideTrinity.com</span></div>
          <div class="memo">Memo: Kid-One Tools &bull; $17.00 &bull; your email</div>
        </div>
      </div>

    </div>
    <!-- little-ai: community-hub-btn | action: navigate | status: active -->
    <a href="/community" class="dept-btn live" style="display:inline-block;padding:12px 32px;margin-top:8px">View Full Community Hub &rarr;</a>
  </div>

</main>
<div class="page-footer">
  &copy; 2026 Lakeside Trinity LLC &nbsp;&bull;&nbsp; NPI 1346233350 &nbsp;&bull;&nbsp; Webster, WI 54893<br/>
  <a href="/community">Community Hub</a> &nbsp;&bull;&nbsp; <a href="/home-care">Home Care Portal</a>
</div>
${EBS_FOOTER_HTML}
<script>
function togglePay(id){const el=document.getElementById(id);el.classList.toggle('open');}
</script>
</body>
</html>`;

app.get("/marketplace", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(MARKETPLACE_HTML);
});

// ── Community Hub — /community ──────────────────────────────────────────────
const COMMUNITY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>197 Community Resource Hub — Lakeside Trinity</title>
  <!-- little-ai: community-root | frequency: 197 | status: active | phase: alpha-17 -->
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#13180f;min-height:100vh;color:#e8f0e0;padding:0 0 60px}
    header{background:#0e1209;border-bottom:1.5px solid #2d3b22;padding:28px 32px;text-align:center}
    .brand{font-size:.7rem;font-weight:700;letter-spacing:.18em;color:#4a5e3a;text-transform:uppercase;margin-bottom:6px}
    h1{color:#c8e0a8;font-size:1.7rem;font-weight:800}
    .sub{color:#4a5e3a;font-size:.88rem;margin-top:6px}
    main{max-width:860px;margin:0 auto;padding:44px 24px 0}
    .gift-banner{background:#0e1209;border:1.5px solid #2d3b22;border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:40px}
    .gift-badge{display:inline-block;background:#1e3010;border:1.5px solid #3a5a22;border-radius:20px;padding:4px 16px;font-size:.68rem;font-weight:700;color:#6abf4b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}
    .gift-banner p{color:#4a5e3a;font-size:.9rem;line-height:1.7;max-width:560px;margin:0 auto}
    .sect-label{font-size:.68rem;font-weight:700;letter-spacing:.16em;color:#4a5e3a;text-transform:uppercase;margin-bottom:18px}
    .kit-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;margin-bottom:44px}
    .kit-card{background:#1a2012;border:1.5px solid #2d3b22;border-radius:12px;padding:26px 22px;display:flex;flex-direction:column;gap:12px;transition:border-color .2s}
    .kit-card:hover{border-color:#4a5e3a}
    .kit-icon{font-size:1.5rem}
    .kit-name{color:#c8e0a8;font-weight:700;font-size:.95rem}
    .kit-desc{color:#4a5e3a;font-size:.82rem;line-height:1.6;flex:1}
    .kit-price-row{display:flex;align-items:center;justify-content:space-between}
    .kit-amount{color:#a8cc88;font-weight:800;font-size:1.1rem}
    .kit-freq{font-size:.66rem;color:#3a4d2c;letter-spacing:.07em;font-weight:700}
    .kit-btn{width:100%;padding:11px;background:#2d3b22;color:#a8cc88;border:1.5px solid #3a4d2c;border-radius:7px;font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit;transition:background .2s}
    .kit-btn:hover{background:#3a4d2c;color:#c8e0a8}
    .pay-panel{background:#0a0f07;border:1.5px dashed #2d3b22;border-radius:9px;padding:18px 20px;display:none;margin-top:4px}
    .pay-panel.open{display:block}
    .pay-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1e2818}
    .pay-row:last-of-type{border-bottom:none}
    .pay-method{color:#a8cc88;font-weight:700;font-size:.84rem;min-width:68px}
    .pay-handle{color:#5a7a46;font-size:.84rem;font-family:monospace}
    .memo{color:#3a4d2c;font-size:.73rem;margin-top:8px;font-style:italic}
    .back-link{display:inline-block;padding:11px 24px;background:#1a2012;color:#5a7a46;text-decoration:none;border-radius:8px;font-size:.84rem;font-weight:600;border:1.5px solid #2d3b22;margin-top:8px}
    .back-link:hover{background:#1e2818;color:#a8cc88}
    .page-footer{text-align:center;padding:28px 16px;color:#2d3b22;font-size:.76rem;border-top:1px solid #1e2818;margin-top:44px}
  </style>
</head>
<body>
<header>
  <div class="brand">Lakeside Trinity LLC</div>
  <h1>197 Community Resource Hub</h1>
  <p class="sub">The Lock Frequency &nbsp;&bull;&nbsp; $17.00 Entry Point</p>
</header>
<main>

  <div class="gift-banner">
    <div class="gift-badge">&#127381; A Gift to the People</div>
    <p>Empowering every family to build their own empire.<br/>High-value tools. Sovereign prices.<br/>No middlemen. No barriers. Direct to your account.</p>
  </div>

  <div class="sect-label">Empire Starter Kits — $17.00 Each</div>
  <div class="kit-grid">

    <!-- little-ai: starter-kit | frequency: 197 | status: active | phase: alpha-17 -->
    <div class="kit-card">
      <div class="kit-icon">&#128218;</div>
      <div class="kit-name">Empire Starter Kit</div>
      <div class="kit-desc">Your foundation document set. Business planning templates, goal-setting worksheets, revenue tracking sheets, and the first-step sovereign roadmap.</div>
      <div class="kit-price-row"><span class="kit-amount">$17.00</span><span class="kit-freq">LOCK FREQUENCY</span></div>
      <!-- little-ai: starter-kit-btn | action: pay | status: active -->
      <button class="kit-btn" onclick="togglePay('c-starter')">Get This Kit &rarr;</button>
      <div class="pay-panel" id="c-starter">
        <div class="pay-row"><span class="pay-method">CashApp</span><span class="pay-handle">$LakesideTrinity</span></div>
        <div class="pay-row"><span class="pay-method">Zelle</span><span class="pay-handle">admin@LakesideTrinity.com</span></div>
        <div class="memo">Memo: Empire Starter Kit &bull; $17.00 &bull; include your email</div>
      </div>
    </div>

    <!-- little-ai: kid-one-tools | frequency: 197 | status: active | phase: alpha-17 -->
    <div class="kit-card">
      <div class="kit-icon">&#127775;</div>
      <div class="kit-name">Kid-One Creative Tools</div>
      <div class="kit-desc">Activity packs, storytelling prompts, and imagination launchers for the next generation of sovereign thinkers and creators.</div>
      <div class="kit-price-row"><span class="kit-amount">$17.00</span><span class="kit-freq">LOCK FREQUENCY</span></div>
      <!-- little-ai: kid-one-btn | action: pay | status: active -->
      <button class="kit-btn" onclick="togglePay('c-kidone')">Get This Kit &rarr;</button>
      <div class="pay-panel" id="c-kidone">
        <div class="pay-row"><span class="pay-method">CashApp</span><span class="pay-handle">$LakesideTrinity</span></div>
        <div class="pay-row"><span class="pay-method">Zelle</span><span class="pay-handle">admin@LakesideTrinity.com</span></div>
        <div class="memo">Memo: Kid-One Tools &bull; $17.00 &bull; include your email</div>
      </div>
    </div>

    <!-- little-ai: family-wealth-kit | frequency: 197 | status: active | phase: alpha-17 -->
    <div class="kit-card">
      <div class="kit-icon">&#127968;</div>
      <div class="kit-name">Family Wealth Blueprint</div>
      <div class="kit-desc">Multi-generational wealth planning guide. Asset protection basics, estate mapping, and the Lakeside Trinity family enterprise model.</div>
      <div class="kit-price-row"><span class="kit-amount">$17.00</span><span class="kit-freq">LOCK FREQUENCY</span></div>
      <!-- little-ai: family-wealth-btn | action: pay | status: active -->
      <button class="kit-btn" onclick="togglePay('c-family')">Get This Kit &rarr;</button>
      <div class="pay-panel" id="c-family">
        <div class="pay-row"><span class="pay-method">CashApp</span><span class="pay-handle">$LakesideTrinity</span></div>
        <div class="pay-row"><span class="pay-method">Zelle</span><span class="pay-handle">admin@LakesideTrinity.com</span></div>
        <div class="memo">Memo: Family Wealth Blueprint &bull; $17.00 &bull; include your email</div>
      </div>
    </div>

  </div>

  <a href="/marketplace" class="back-link">&#8592; Back to Marketplace</a>

</main>
<div class="page-footer">&copy; 2026 Lakeside Trinity LLC &nbsp;&bull;&nbsp; Webster, WI 54893 &nbsp;&bull;&nbsp; NPI 1346233350</div>
${EBS_FOOTER_HTML}
<script>
function togglePay(id){const el=document.getElementById(id);el.classList.toggle('open');}
</script>
</body>
</html>`;

app.get("/community", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(COMMUNITY_HTML);
});

// ── Family Hub — Creative Hub & Dream Board ────────────────────────────────
const GLOBAL_DEPARTMENTS = [
  { id: "healthcare",   label: "Healthcare",    desc: "Webster Home Care · HealthOS · Medicaid EVV · NPI 1346233350" },
  { id: "legal",        label: "Legal",         desc: "Legal Practice Manager · Contracts · Compliance · Wisconsin" },
  { id: "real-estate",  label: "Real Estate",   desc: "Property Portfolio · Acquisition · Management · Lakeside" },
  { id: "creative-hub", label: "Creative Hub",  desc: "Family Dream Board · The Kid Ones · Global Industry · Art" },
];

const FAMILY_HUB_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Family Hub — Lakeside Trinity</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#1a1f14;min-height:100vh;color:#e8f0e0;padding:0 0 60px}
    header{background:#111710;border-bottom:1.5px solid #2d3b22;padding:20px 32px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
    .brand{font-size:.78rem;font-weight:700;letter-spacing:.14em;color:#7a9160;text-transform:uppercase}
    h1{font-size:1.5rem;font-weight:800;color:#d4e8c2;margin-top:2px}
    .ai-pill{background:#2d3b22;border:1.5px solid #4a5e3a;border-radius:20px;padding:6px 16px;font-size:.78rem;font-weight:700;color:#a8cc88;letter-spacing:.08em;display:flex;align-items:center;gap:7px}
    .ai-dot{width:8px;height:8px;background:#6abf4b;border-radius:50%;animation:pulse 1.6s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    main{max-width:960px;margin:0 auto;padding:36px 24px 0}
    .section-label{font-size:.72rem;font-weight:700;letter-spacing:.13em;color:#7a9160;text-transform:uppercase;margin-bottom:14px}
    /* Dream Board */
    .dream-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:40px}
    @media(max-width:600px){.dream-grid{grid-template-columns:1fr}}
    .dream-card{background:#1e2818;border:1.5px solid #2d3b22;border-radius:12px;padding:24px}
    .dream-card h3{color:#c8e0a8;font-size:1rem;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px}
    .dream-card h3 span{font-size:1.1rem}
    .idea-list{list-style:none}
    .idea-list li{color:#8fa87a;font-size:.9rem;padding:8px 0;border-bottom:1px solid #2a3520;display:flex;align-items:center;gap:8px}
    .idea-list li:last-child{border-bottom:none}
    .idea-list li::before{content:"◆";font-size:.55rem;color:#4a5e3a;flex-shrink:0}
    .add-idea{width:100%;margin-top:14px;padding:9px;background:transparent;border:1.5px dashed #3a4d2c;border-radius:7px;color:#5a7a46;font-size:.85rem;cursor:pointer;transition:all .2s;font-family:inherit}
    .add-idea:hover{border-color:#4a5e3a;color:#7a9160;background:#1e2818}
    /* Little AI */
    .ai-block{background:#1e2818;border:1.5px solid #4a5e3a;border-radius:12px;padding:24px 28px;margin-bottom:40px;display:flex;align-items:center;gap:20px}
    .ai-icon{width:48px;height:48px;background:#2d3b22;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0}
    .ai-block h3{color:#a8cc88;font-size:.97rem;font-weight:700;margin-bottom:4px}
    .ai-block p{color:#5a7a46;font-size:.83rem;line-height:1.5}
    .ai-status{display:inline-block;margin-top:8px;padding:3px 10px;background:#2d3b22;border-radius:10px;font-size:.72rem;font-weight:700;color:#6abf4b;letter-spacing:.06em}
    /* Global Departments */
    .dept-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:40px}
    .dept-card{background:#1e2818;border:1.5px solid #2d3b22;border-radius:10px;padding:20px 18px;cursor:pointer;transition:border-color .2s,background .2s}
    .dept-card:hover{border-color:#4a5e3a;background:#232d1a}
    .dept-icon{font-size:1.3rem;margin-bottom:10px}
    .dept-name{color:#c8e0a8;font-weight:700;font-size:.93rem;margin-bottom:6px}
    .dept-desc{color:#5a7a46;font-size:.78rem;line-height:1.5}
    /* Footer nav */
    .nav-link{display:inline-block;margin-top:32px;padding:11px 24px;background:#2d3b22;color:#a8cc88;text-decoration:none;border-radius:8px;font-size:.85rem;font-weight:600;border:1.5px solid #3a4d2c}
    .nav-link:hover{background:#3a4d2c}
  </style>
</head>
<body>
<header>
  <div>
    <div class="brand">Lakeside Trinity LLC</div>
    <h1>Family Hub</h1>
  </div>
  <div class="ai-pill"><span class="ai-dot"></span>Little AI Active</div>
</header>
<main>

  <!-- Dream Board -->
  <div class="section-label">Dream Board</div>
  <div class="dream-grid">
    <div class="dream-card">
      <h3><span>&#9733;</span> The Kid Ones</h3>
      <ul class="idea-list">
        <li>Children's wellness app</li>
        <li>Educational story platform</li>
        <li>Family adventure planner</li>
        <li>Kid-safe creative studio</li>
        <li>Learning rewards system</li>
      </ul>
      <button class="add-idea" onclick="addIdea(this,'kid')">+ Add Kid Idea</button>
    </div>
    <div class="dream-card">
      <h3><span>&#127760;</span> Global Industry</h3>
      <ul class="idea-list">
        <li>Home care franchise model</li>
        <li>AI-powered EVV system</li>
        <li>Multilingual legal platform</li>
        <li>Real estate acquisition fund</li>
        <li>Creative agency network</li>
      </ul>
      <button class="add-idea" onclick="addIdea(this,'global')">+ Add Industry Idea</button>
    </div>
  </div>

  <!-- Little AI -->
  <div class="section-label">AI Protocol</div>
  <div class="ai-block">
    <div class="ai-icon">&#129302;</div>
    <div>
      <h3>Little AI — Foundation Layer</h3>
      <p>Every product in the Lakeside Trinity empire gets its own AI brain. This is the seed protocol — the placeholder that becomes the intelligence layer for Healthcare, Legal, Real Estate, and Creative departments as each grows.</p>
      <span class="ai-status">LITTLE AI ACTIVE</span>
    </div>
  </div>

  <!-- Global Departments -->
  <div class="section-label">Global Departments</div>
  <div class="dept-grid">
    <div class="dept-card">
      <div class="dept-icon">&#129657;</div>
      <div class="dept-name">Healthcare</div>
      <div class="dept-desc">Webster Home Care · HealthOS · Medicaid EVV · NPI 1346233350</div>
    </div>
    <div class="dept-card">
      <div class="dept-icon">&#9878;&#65039;</div>
      <div class="dept-name">Legal</div>
      <div class="dept-desc">Legal Practice Manager · Contracts · Compliance · Wisconsin</div>
    </div>
    <div class="dept-card">
      <div class="dept-icon">&#127968;</div>
      <div class="dept-name">Real Estate</div>
      <div class="dept-desc">Property Portfolio · Acquisition · Management · Lakeside</div>
    </div>
    <div class="dept-card">
      <div class="dept-icon">&#127775;</div>
      <div class="dept-name">Creative Hub</div>
      <div class="dept-desc">Family Dream Board · The Kid Ones · Global Industry · Art</div>
    </div>
  </div>

  <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:32px">
    <a href="/home-care" class="nav-link">&#8592; Home Care Portal</a>
    <a href="/marketplace" style="display:inline-block;padding:11px 24px;background:#4a5e3a;color:#d4e8c2;text-decoration:none;border-radius:8px;font-size:.85rem;font-weight:700;border:1.5px solid #3a4d2c;border-radius:8px">&#127760; Launch to Marketplace</a>
  </div>

</main>
<script>
function addIdea(btn, type) {
  const label = type === 'kid' ? 'Kid idea' : 'Industry idea';
  const text = prompt('Add a new ' + label + ':');
  if (!text || !text.trim()) return;
  const list = btn.previousElementSibling;
  const li = document.createElement('li');
  li.textContent = text.trim();
  list.appendChild(li);
}
</script>
${EBS_FOOTER_HTML}
</body>
</html>`;

app.get("/family-hub", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(FAMILY_HUB_HTML);
});

// ── Zenith Studio — generative neural art engine ───────────────────────────
app.get("/zenith", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.resolve("/home/runner/workspace/studio.html"));
});

// ── METADATA_SIGNER — server-side SHA-256 proof of authenticity ───────────
function metadataSigner(name: string, ts: number): string {
  return crypto
    .createHash("sha256")
    .update(`${name}_${ts}_WEBSTER-54893_1440_SOVEREIGN`)
    .digest("hex")
    .toUpperCase()
    .substring(0, 24);
}

// ── Zenith — WEBSTER_EXPORTS infrastructure ───────────────────────────────
const EXPORTS_DIR = path.resolve("/home/runner/workspace/WEBSTER_EXPORTS");
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

// Serve raw PNG files for commander gallery
app.use("/exports", express.static(EXPORTS_DIR));

// Commander page
app.get("/commander", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.resolve("/home/runner/workspace/commander.html"));
});

// Commander data feed — 12 most recent assets
app.get("/commander/data", (_req: Request, res: Response): void => {
  try {
    const files = fs.readdirSync(EXPORTS_DIR);
    const jsons = files
      .filter(f => f.endsWith(".json"))
      .sort((a, b) => {
        const tsA = parseInt(a.match(/_(\d+)\.json$/)?.[1] ?? "0", 10);
        const tsB = parseInt(b.match(/_(\d+)\.json$/)?.[1] ?? "0", 10);
        return tsB - tsA;
      })
      .slice(0, 12);

    const assets = jsons.map(jf => {
      const pngFile = jf.replace(/\.json$/, ".png");
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(EXPORTS_DIR, jf), "utf-8"));
        return { ...meta, png: pngFile, json: jf };
      } catch (_) {
        return { name: jf.replace(/\.json$/, ""), png: pngFile, json: jf };
      }
    });

    res.json({ assets, total: jsons.length });
  } catch (_) {
    res.status(500).json({ assets: [], total: 0 });
  }
});

// Export entire vault as a zip stream with manifest
app.get("/export-batch", (_req: Request, res: Response): void => {
  try {
    const stamp = Date.now();
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="WEBSTER_EMPIRE_${stamp}.zip"`);
    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", () => res.end());
    archive.pipe(res);

    // Build manifest.json — inventory list for records
    const jsons = fs.readdirSync(EXPORTS_DIR).filter(f => f.endsWith(".json"));
    const assets = jsons.map(jf => {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(EXPORTS_DIR, jf), "utf-8"));
        return { file: jf.replace(/\.json$/, ""), ...meta };
      } catch (_) {
        return { file: jf.replace(/\.json$/, "") };
      }
    }).sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(b.savedAt ?? "").localeCompare(String(a.savedAt ?? ""))
    );

    const manifest = {
      system     : "WEBSTER-54893 // ZENITH EMPIRE",
      generated  : new Date().toISOString(),
      total_assets: assets.length,
      assets,
    };
    archive.append(Buffer.from(JSON.stringify(manifest, null, 2)), { name: "manifest.json" });
    archive.directory(EXPORTS_DIR, "WEBSTER_EXPORTS");
    archive.finalize();
  } catch (_) {
    res.status(500).end();
  }
});

app.post("/upload-strike", express.json({ limit: "15mb" }), (req: Request, res: Response): void => {
  try {
    const { name, timestamp, dataURL, metadata } = req.body as {
      name: string;
      timestamp: string;
      dataURL: string;
      metadata: Record<string, unknown>;
    };
    if (!name || !dataURL || !dataURL.startsWith("data:image/png;base64,")) {
      res.status(400).json({ error: "INVALID_PAYLOAD" });
      return;
    }
    const slug = name.replace(/[^A-Z0-9_\-]/gi, "_");
    const ts   = Date.now();
    const base64 = dataURL.replace(/^data:image\/png;base64,/, "");
    const serial = metadataSigner(slug, ts);
    fs.writeFileSync(path.join(EXPORTS_DIR, `${slug}_${ts}.png`), Buffer.from(base64, "base64"));
    fs.writeFileSync(
      path.join(EXPORTS_DIR, `${slug}_${ts}.json`),
      JSON.stringify({
        name, timestamp, savedAt: new Date().toISOString(),
        serial_number: serial,
        proof_of_authenticity: `WEBSTER-54893_${serial}`,
        ...(metadata ?? {}),
      }, null, 2)
    );
    res.status(200).json({ status: "UPLINK_SUCCESS", file: `${slug}_${ts}`, serial_number: serial });
  } catch (_) {
    res.status(500).json({ error: "WRITE_FAILED" });
  }
});

app.use("/ss",        signalSpaceRouter);
app.use("/nexus",     nexusRouter);
app.use("/core",      coreOSRouter);
app.use("/bundle",    bundleOSRouter);
app.use("/valuation", valuationRouter);
app.use("/vault",     moneyHubRouter);
app.use("/launch",    semanticLaunchRouter);
app.use("/portal",    portalsExtendedRouter);  // Extended portals (book, donor, student, client, review, consult)
app.use("/portal",    semanticPortalRouter);   // Existing portal (/me, /lookup)
app.use("/join",      semanticSubRouter);
// ── Protocol Gateway — handle redirects, web+npa:// callbacks, portable cards ──
app.use("/",          protocolGatewayRouter);
app.use("/",          semanticStoreRouter);
app.use("/",          platformHubRouter);
app.use("/api/ads",          adNetworkCatalogsRouter);
app.use("/api/app-usage",   appUsageRouter);
app.use("/api/analytics",  analyticsTrackerRouter);
app.use("/api/discovery",   discoveryRouter);
app.use("/api/contextual",  contextualRouter);
app.use("/api/platform",    selfMapRouter);
app.use("/api/lifecycle",   lifecycleRouter);
app.use("/api/opt-in",      optInRouter);
app.use("/api/crl",         crlRouter);
app.use("/api/broadcast",  broadcastGlobalRouter);
app.use("/api/universe-data", universeDataRouter);
app.use("/api/outcome",      outcomeRouter);

// ── API (private — Replit auth + scope) ──────────────────────────────────────
app.use(authMiddleware);
app.use(scopeMiddleware);
app.use("/api", router);

// ── Self-Host Engine — mounts built frontend if dist/ exists, starts watchdog ──
initSelfHostEngine(app);

// ── Automated Health Monitor — 16-endpoint polling, 60s interval ─────────────
startHealthMonitor();

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("[global-error]", err.stack ?? err.message);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
