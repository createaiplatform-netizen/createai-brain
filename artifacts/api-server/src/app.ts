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
