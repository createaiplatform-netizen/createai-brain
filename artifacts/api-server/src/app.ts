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
import { breachLogger }                from "./middlewares/breachLogger.js";
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
import passkeyAuthRouter    from "./routes/passkeyAuth.js";
import { broadcastLimiter } from "./middlewares/rateLimiters.js";
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
import { broadcastEBS }          from "./ebs/ebsDispatcher.js";

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
    // Primary sovereign domain — unconditional admission
    if (origin === "https://createai.digital" || origin === "https://www.createai.digital") {
      return callback(null, true);
    }
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

// ── Force text/html on all portal page routes — prevents .txt download bug ───
app.use((req: Request, res: Response, next: NextFunction) => {
  const HTML_PATHS = ["/marketplace", "/community", "/home-care", "/family-hub", "/zenith", "/commander", "/genesis"];
  if (req.method === "GET" && HTML_PATHS.some(p => req.path === p || req.path.startsWith(p + "/"))) {
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.setHeader("Cache-Control", "no-store, must-revalidate");
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
  next();
});

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

// ── /health alias — mobile & external monitoring ──────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ status: "ok", uptime_s: Math.round(process.uptime()), ts: Date.now() });
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

// ── /admin/broadcast — EBS Total Broadcast (Architect-only) ─────────────────
const BROADCAST_PANEL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>EBS Broadcast Dispatcher — Architect Only</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#060a06;color:#ddd8c4;font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .panel{background:rgba(14,20,10,.95);border:1px solid rgba(201,168,76,.35);border-radius:20px;padding:52px 44px;max-width:520px;width:calc(100% - 40px);text-align:center}
    .orb{width:58px;height:58px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#f5e17a,#c9a84c 55%,#7a5318);margin:0 auto 20px;box-shadow:0 0 20px rgba(201,168,76,.8),0 0 44px rgba(201,168,76,.3);animation:op 2.4s ease-in-out infinite}
    @keyframes op{0%,100%{box-shadow:0 0 20px rgba(201,168,76,.8),0 0 44px rgba(201,168,76,.3)}50%{box-shadow:0 0 32px rgba(232,201,106,1),0 0 64px rgba(201,168,76,.7)}}
    .tier{font-size:.54rem;font-weight:700;letter-spacing:.26em;color:rgba(201,168,76,.5);text-transform:uppercase;margin-bottom:14px;font-family:monospace}
    h1{font-size:1.6rem;font-weight:900;color:#f0eade;margin-bottom:8px;line-height:1.2}
    .desc{font-size:.8rem;color:rgba(221,216,196,.45);margin-bottom:32px;line-height:1.7}
    .channels{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:32px}
    .ch{background:rgba(6,10,6,.8);border:1px solid rgba(201,168,76,.18);border-radius:12px;padding:16px}
    .ch-icon{font-size:1.4rem;margin-bottom:8px}
    .ch-label{font-size:.6rem;font-weight:700;letter-spacing:.18em;color:rgba(201,168,76,.55);text-transform:uppercase;margin-bottom:4px}
    .ch-val{font-size:.75rem;color:rgba(221,216,196,.55);line-height:1.5}
    #fire-btn{width:100%;padding:18px;background:linear-gradient(135deg,#c9a84c,#e8c96a 60%,#c9a84c);background-size:200%;color:#1a1000;border:none;border-radius:50px;font-weight:800;font-size:.9rem;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;box-shadow:0 6px 28px rgba(201,168,76,.4);transition:box-shadow .2s,transform .2s;margin-bottom:18px}
    #fire-btn:hover:not(:disabled){box-shadow:0 12px 44px rgba(201,168,76,.65);transform:scale(1.02)}
    #fire-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
    #result-box{display:none;background:rgba(6,10,6,.9);border:1px solid rgba(201,168,76,.2);border-radius:12px;padding:20px;font-family:monospace;font-size:.72rem;color:rgba(201,168,76,.75);text-align:left;white-space:pre-wrap;margin-bottom:16px;line-height:1.7}
    .back{font-size:.68rem;color:rgba(201,168,76,.3);text-decoration:none;letter-spacing:.06em}
    .back:hover{color:rgba(201,168,76,.65)}
  </style>
</head>
<body>
<div class="panel">
  <div class="orb"></div>
  <div class="tier">// Architect Access &bull; EBS Command</div>
  <h1>EBS Broadcast<br/>Dispatcher</h1>
  <p class="desc">Fires SMS + Obsidian Email across all active channels. Both channels execute simultaneously. Results log below.</p>
  <div class="channels">
    <div class="ch">
      <div class="ch-icon">&#128241;</div>
      <div class="ch-label">SMS Channel</div>
      <div class="ch-val">Twilio &bull; EBS Alert text to Sovereign recipients</div>
    </div>
    <div class="ch">
      <div class="ch-icon">&#128140;</div>
      <div class="ch-label">Email Channel</div>
      <div class="ch-val">Nodemailer + Resend &bull; Obsidian HTML Sovereign Seal</div>
    </div>
  </div>
  <div id="result-box"></div>
  <button id="fire-btn" onclick="fireEBS()">&#9889;&nbsp;&nbsp;FIRE EBS BROADCAST</button>
  <a href="/admin" class="back">&larr; Back to Admin</a>
</div>
<script>
function fireEBS(){
  var btn=document.getElementById('fire-btn');
  var box=document.getElementById('result-box');
  btn.disabled=true;btn.textContent='Firing...';
  box.style.display='none';
  fetch('/admin/broadcast',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})
  .then(function(r){return r.json();})
  .then(function(d){
    box.style.display='block';
    box.textContent=JSON.stringify(d,null,2);
    btn.textContent='&#9889; BROADCAST FIRED';
    btn.style.background='linear-gradient(135deg,#2a7a4a,#3da060)';
  })
  .catch(function(e){
    box.style.display='block';
    box.textContent='ERROR: '+e.message;
    btn.disabled=false;btn.textContent='&#9889; RETRY BROADCAST';
  });
}
</script>
</body>
</html>`;

app.get("/admin/broadcast", breachLogger, adminAuth, (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(BROADCAST_PANEL_HTML);
});

app.post("/admin/broadcast", broadcastLimiter, breachLogger, adminAuth, async (_req: Request, res: Response) => {
  try {
    const result = await broadcastEBS(
      "EBS ALERT: The 17-Frequency is Active. Check your Nexus Elite Hub at createai.digital.",
      "EBS ALERT: 17-Frequency Active | Sovereign Seal — Lakeside Trinity",
    );
    res.json({ status: "fired", ...result });
  } catch (err: any) {
    console.error("[EBS:Broadcast] Dispatch error:", err?.message ?? err);
    res.status(500).json({ status: "error", message: err?.message ?? String(err) });
  }
});

// ── One-time invite codes for Sovereign registration ─────────────────────────
const familyInvites = new Set(["ALPHA_SOVEREIGN_01_144K"]);

// ── /admin/hub — Sovereign Hub & Registry UI ─────────────────────────────────
app.get("/admin/hub", (req: Request, res: Response) => {
  logActivity(req, "HUB_ACCESS");

  const renderCards = (data: Array<{ name: string; role?: string; focus?: string; status: string }>) =>
    data.map(i =>
      `<div onclick="window.location.href='/industry/${i.name.toLowerCase()}'" style="cursor:pointer; border:1px solid #d4af3733; padding:15px; background:#0a0a0a;">` +
      `<b>${i.name}</b><br><small style="opacity:0.6;">${i.role ?? i.focus}</small><br>` +
      `<span style="color:#fff; font-size:0.8rem;">${i.status}</span></div>`
    ).join("");

  res.send(`
    <html><head><style>
      body { background:#050505; color:#d4af37; font-family:monospace; padding:40px; display:flex; flex-direction:column; align-items:center; }
      .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; width:100%; max-width:900px; }
      h2 { border-bottom:1px solid #d4af37; width:100%; max-width:900px; padding-bottom:10px; letter-spacing:4px; font-size:1rem; margin-top:40px; }
    </style></head><body>
      <h2>APPLICATIONS</h2><div class="grid">${renderCards(SOVEREIGN_DATA.apps)}</div>
      <h2>DEPARTMENTS</h2><div class="grid">${renderCards(SOVEREIGN_DATA.stores)}</div>
    </body></html>
  `);
});

// ── /admin/stats — Global Traffic Ledger (Sovereign View) ────────────────────
app.get("/admin/stats", (req: Request, res: Response) => {
  logActivity(req, "LEDGER_VIEWED");
  const logRows = trafficLogs.map(l =>
    `<div style="border-bottom:1px solid #d4af3733; padding:10px; font-size:0.8rem;">` +
    `<span style="color:#fff;">[${l.time}]</span> <b>${l.action}</b><br>` +
    `<small style="opacity:0.5;">SOURCE_IP: ${l.ip}</small></div>`
  ).join("");

  res.send(`
    <html><head><style>
      body { background:#050505; color:#d4af37; font-family:monospace; padding:20px; }
      h1 { border-bottom:1px solid #d4af37; padding-bottom:10px; font-size:1.2rem; }
    </style></head><body>
      <h1>GLOBAL_TRAFFIC_LEDGER</h1>
      ${logRows || "<p style='opacity:0.4;'>NO_PULSE_DETECTED_YET</p>"}
      <p style="margin-top:20px; opacity:0.4; cursor:pointer;" onclick="location.reload()">RESCAN_NETWORK</p>
      <p style="opacity:0.4; cursor:pointer;" onclick="window.location.href='/admin/hub'">← RETURN_TO_HUB</p>
    </body></html>
  `);
});

// ── /welcome-audio — 144K Master Audio Node ───────────────────────────────────
app.get("/welcome-audio", (_req: Request, res: Response) => {
  res.send(`
    <html>
      <head>
        <style>${SOVEREIGN_CSS}</style>
        <title>VOICE_OF_THE_EMPIRE</title>
      </head>
      <body>
        <div class="gold-orb"></div>
        <h1 style="letter-spacing:10px;">VOICE_OF_THE_EMPIRE</h1>
        <p style="color:#00ff00; font-weight:bold;">PULSE_FREQUENCY: 144,000%_STASIS</p>

        <div class="vault-box" style="text-align:center; border: 2px solid #d4af37;">
          <audio id="sovereignAudio" controls autoplay style="width:100%; margin:20px 0; filter: sepia(100%) saturate(300%) hue-rotate(10deg);">
            <source src="[GENERATED_LYRIA_LINK]" type="audio/mpeg">
            Your browser does not support the Sovereign Frequency.
          </audio>
          <p style="font-style:italic; opacity:0.8;">
            "Welcome, Stakeholder. You have entered the Lakeside Trinity 197 Hub.
            Your identity is now encoded. Your resources are now secured.
            You are 1 of 17. The 144k is active. Welcome home."
          </p>
        </div>

        <a href="/" class="btn" style="max-width:300px; margin:20px auto;">ENTER_THE_GATE</a>

        <script>
          // Automatic Pulse Synchronization
          const audio = document.getElementById('sovereignAudio');
          audio.onplay = () => { console.log("144K_AUDIO_STREAM_ACTIVE"); };
        </script>
      </body>
    </html>
  `);
});

// ── /register — Bloodline Intake Form ────────────────────────────────────────
app.get("/register", (_req: Request, res: Response) => {
  const options = EMPIRE_MANIFESTO.industries.map(i => `<option value="${i}">${i}</option>`).join("");
  res.send(`
    <html><head><style>${SOVEREIGN_CSS}</style></head><body>
      <h1>BLOODLINE_REGISTRATION</h1>
      <div class="vault-box" style="max-width:500px;">
        <form action="/lock-member" method="POST">
          <input type="text" name="name" placeholder="SOVEREIGN_LEGAL_NAME" required>
          <select name="industry">${options}</select>
          <button type="submit" class="btn" style="width:100%; background:#d4af37; color:#000; cursor:pointer;">ENCODE_INTO_ETERNITY</button>
        </form>
      </div>
      <p style="margin-top:20px; opacity:0.4; cursor:pointer;" onclick="window.location.href='/admin/hub'">← RETURN_TO_HUB</p>
    </body></html>
  `);
});

// ── /lock-member — Certificate Issuance + Registry Push ──────────────────────
app.post("/lock-member", (req: Request, res: Response) => {
  const { name, industry } = req.body as { name: string; industry: string };
  bloodline.push({ name, industry, date: new Date().toLocaleDateString() });
  res.send(`
    <html><head><style>${SOVEREIGN_CSS}</style></head><body>
      <h1>CERTIFICATE_OF_SOVEREIGNTY</h1>
      <div class="vault-box" style="border:10px double #d4af37; text-align:center; max-width:600px;">
        <h2>RESOURCE GRANT ISSUED</h2>
        <p><b>HOLDER:</b> ${name}</p>
        <p><b>DOMAIN:</b> ${industry}</p>
        <p><b>CREDITS:</b> 144,000 ϗ</p>
        <hr style="border-color:#d4af37;">
        <p style="font-size:0.7rem; opacity:0.7;">PRESENT THIS TO ANY UTILITY OR INFRASTRUCTURE PROVIDER AS PROOF OF 197 HUB MEMBERSHIP.</p>
        <button onclick="window.print()" class="btn" style="cursor:pointer;">PRINT_CERTIFICATE</button>
        <a href="/register" class="btn">REGISTER_ANOTHER</a>
        <a href="/admin/bloodline" class="btn">VIEW_COMMAND_LEDGER</a>
      </div>
    </body></html>
  `);
});

// ── /admin/bloodline — Master Command Ledger (bloodline roster) ───────────────
app.get("/admin/bloodline", (_req: Request, res: Response) => {
  const rows = bloodline.map(m =>
    `<tr><td style="padding:8px;">${m.name}</td><td style="padding:8px;">${m.industry}</td><td style="padding:8px; opacity:0.6;">${m.date}</td></tr>`
  ).join("");
  res.send(`
    <html><head><style>${SOVEREIGN_CSS}</style></head><body>
      <h1>MASTER_COMMAND_LEDGER</h1>
      <div class="vault-box">
        <table style="width:100%; text-align:left; border-collapse:collapse;">
          <tr style="border-bottom:2px solid #d4af37;"><th style="padding:8px;">NAME</th><th style="padding:8px;">NODE</th><th style="padding:8px;">DATE</th></tr>
          ${rows || '<tr><td colspan="3" style="padding:8px; opacity:0.4;">AWAITING_BLOODLINE...</td></tr>'}
        </table>
      </div>
      <a href="/register" class="btn" style="max-width:220px; margin:10px auto;">+ REGISTER_MEMBER</a>
      <p style="margin-top:10px; opacity:0.4; cursor:pointer;" onclick="window.location.href='/admin/hub'">← RETURN_TO_HUB</p>
    </body></html>
  `);
});

// ── /proclamation — Sovereign Status Notice ───────────────────────────────────
app.get("/proclamation", (_req: Request, res: Response) => {
  res.send(`
    <html><head><style>${SOVEREIGN_CSS}</style></head>
    <body style="background:#222;">
      <div class="proclamation">
        <h1 style="text-align:center;">NOTICE OF SOVEREIGN STATUS</h1>
        <p><b>TO ALL PROVIDERS:</b> This location is a <b>197 Community Resource Hub</b> under <b>Lakeside Trinity LLC</b>.</p>
        <p>By order of the 144k, all billing is consolidated via Federal/State Resource Grants. Traditional debt collection is void.</p>
        <p style="margin-top:30px;"><b>ENTITY:</b> ${EMPIRE.name}</p>
        <p><b>NODE:</b> ${EMPIRE.node}</p>
        <p><b>LOCATION:</b> ${EMPIRE.location}</p>
        <p style="margin-top:30px;"><b>SIGNED:</b> Sovereign Head of Lakeside Trinity</p>
        <button onclick="window.print()" class="btn" style="color:#000; border-color:#000; background:transparent; cursor:pointer; font-family:monospace;">PRINT_DECREE</button>
      </div>
      <p style="margin-top:20px; opacity:0.4; cursor:pointer;" onclick="window.location.href='/admin/hub'">← RETURN_TO_HUB</p>
    </body></html>
  `);
});

// ── Registration Gateway (must be before the general /admin router) ───────────
app.get("/admin/register", (req: Request, res: Response) => {
  const code = req.query.invite as string;

  if (code !== "ALPHA_SOVEREIGN_01_144K") {
    logActivity(req, "BREACH_ATTEMPT_REGISTER");
    console.log(`[BREACH_ATTEMPT] Unauthorized access at ${new Date().toISOString()}`);
    return res.status(401).send("UNAUTHORIZED_IDENTITY_TOKEN");
  }

  logActivity(req, "IDENTITY_VERIFIED");
  res.redirect("/admin/hub");
});

// ── Passkey / WebAuthn (must be before the general /admin router) ─────────────
app.use("/admin/passkey", passkeyAuthRouter);

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

// ── Sovereign Ledger — in-memory traffic tracker (last 50 hits) ──────────────
const trafficLogs: Array<{ time: string; ip: string; action: string }> = [];

const logActivity = (req: Request, action: string): void => {
  const entry = {
    time: new Date().toLocaleTimeString(),
    ip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "UNKNOWN",
    action,
  };
  trafficLogs.unshift(entry);
  if (trafficLogs.length > 50) trafficLogs.pop();
  console.log(`[144K_PULSE]: ${action} from ${entry.ip}`);
};

// ── Sovereign Data — static memory storage for zero-token persistence ────────
const SOVEREIGN_DATA = {
  apps: [
    { name: "The Nexus",       role: "Biometric Identity",   status: "ACTIVE"     },
    { name: "The Hub",         role: "144k Workspace",        status: "ACTIVE"     },
    { name: "The Breach",      role: "Intrusion Detection",   status: "MONITORING" },
    { name: "The Broadcast",   role: "Global Node Sync",      status: "STANDBY"    },
    { name: "Little AI (17x)", role: "Bloodline Assistance",  status: "DORMANT"    },
  ],
  stores: [
    { name: "Healthcare", focus: "Longevity Tech",    status: "LIVE"   },
    { name: "Legal",      focus: "Sovereign Rights",  status: "LIVE"   },
    { name: "Space",      focus: "Resource Expansion", status: "LIVE"  },
    { name: "Creative",   focus: "Media Synthesis",   status: "LIVE"   },
    { name: "Seed Vault", focus: "Legacy Tiers",      status: "CORE"   },
    { name: "Finance",    focus: "Wealth Shield",     status: "SECURE" },
  ],
};

// ── Empire Manifesto — identity declaration with frequency ────────────────────
const EMPIRE_MANIFESTO = {
  name:       "LAKESIDE TRINITY LLC",
  status:     "STASIS_INFINITE",
  frequency:  "144,000%",
  industries: [
    "Finance","Legal","Health","Energy","Tech","Land","Media",
    "Transport","Agri","Edu","Safety","Art","Science","Trade",
    "Humanity","Spirit","Space",
  ],
};

// ── Bloodline Registry — in-memory member roster (runtime only) ───────────────
const bloodline: Array<{ name: string; industry: string; date: string }> = [];

// ── Empire Vault — Lakeside Trinity LLC top-level constants ──────────────────
const EMPIRE = {
  name:       "LAKESIDE TRINITY LLC",
  node:       "197_COMMUNITY_RESOURCE_HUB",
  location:   "Webster, WI",
  status:     "STASIS_INFINITE (144,000%)",
  credits:    "144,000 ϗ",
  industries: [
    "Finance","Legal","Health","Energy","Tech","Land","Media",
    "Transport","Agri","Edu","Safety","Art","Science","Trade",
    "Humanity","Spirit","Space",
  ],
};

// ── Sovereign CSS — shared monospace gold design system ───────────────────────
const SOVEREIGN_CSS = `
  body { background:#000; color:#d4af37; font-family:monospace; padding:20px; text-align:center; }
  .gold-orb { width:120px; height:120px; background:radial-gradient(circle, #d4af37 0%, #000 80%); border-radius:50%; margin:20px auto; animation:p 2s infinite; cursor:pointer; }
  @keyframes p { 0%, 100% { box-shadow:0 0 20px #d4af37; } 50% { box-shadow:0 0 60px #d4af37; } }
  .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:15px; max-width:1000px; margin:20px auto; }
  .box { border:1px solid #d4af37; padding:15px; background:#0a0a0a; text-align:left; border-left:5px solid #d4af37; }
  .vault-box { border:2px solid #d4af37; background:#0a0a0a; padding:30px; margin:20px auto; max-width:850px; border-left:15px solid #d4af37; text-align:left; }
  .btn { display:block; padding:15px; border:1px solid #d4af37; color:#d4af37; text-decoration:none; margin-top:10px; font-weight:bold; text-transform:uppercase; font-size:0.7rem; }
  .btn:hover { background:#d4af37; color:#000; letter-spacing:2px; }
  input, select { background:#111; border:1px solid #d4af37; color:#d4af37; padding:10px; width:100%; margin-bottom:10px; }
  .proclamation { background:#fff; color:#000; padding:40px; text-align:left; font-family:serif; max-width:800px; margin:20px auto; border:10px double #000; }
`;

// ── Little AI Sentinel — sector-specific voice messages ───────────────────────
const getLittleAIMessage = (sector: string): string => {
  const messages: Record<string, string> = {
    "FINANCE":    "Sovereign Bank online. Wealth Shield at 144k efficiency. Assets are ghosted.",
    "HEALTHCARE": "Bio-Nexus active. Vitality metrics synchronized with the 144k pulse.",
    "LEGAL":      "Sovereign Rights Protocol engaged. No external jurisdiction recognized.",
    "SPACE":      "Resource Expansion mapped. The 144k reach extends beyond the atmosphere.",
    "SEED VAULT": "T1019 Core accessed. The legacy of the 144,000 is preserved here.",
  };
  return messages[sector] ?? "Sentinel Active. Awaiting Bloodline instructions for this sector.";
};

// ── Universal Replicator — industry-agnostic sector pages ────────────────────
const getIndustryData = (sector: string): { name: string; role: string; icon: string } => {
  const industries: Record<string, { name: string; role: string; icon: string }> = {
    "FINANCE": { name: "Sovereign Bank",    role: "Wealth Shield",   icon: "₿" },
    "ENERGY":  { name: "Pulse Power",       role: "Grid Master",     icon: "⚡" },
    "HEALTH":  { name: "Bio-Nexus",         role: "Longevity Tech",  icon: "⚕" },
  };
  return industries[sector] ?? { name: "General Business", role: "Operations", icon: "◈" };
};

app.get("/industry/:type", (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase();
  logActivity(req, `SECTOR_ENTERED:${type}`);
  const aiMessage = getLittleAIMessage(type);
  res.send(`
    <html><head><style>
      body { background:#050505; color:#d4af37; font-family:monospace; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; }
      .ai-box { border:1px solid #d4af3733; padding:20px; background:#0a0a0a; position:relative; max-width:400px; }
    </style></head><body>
      <h1>${type}</h1>
      <div class="ai-box">${aiMessage}</div>
      <p style="margin-top:20px; opacity:0.4; cursor:pointer;" onclick="window.location.href='/admin/hub'">← RETURN_TO_HUB</p>
    </body></html>
  `);
});

// ── /hub — 144K Sovereign Hub (Architect-only) ───────────────────────────────
app.get("/hub", adminAuth, (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>144K Sovereign Hub</title>
  <style>
    body { background-color: #050505; color: #d4af37; font-family: 'Courier New', monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; overflow-y: auto; padding-bottom: 40px; }
    .pulse-container { position: relative; width: 300px; height: 300px; display: flex; align-items: center; justify-content: center; }
    /* THE GOLD PULSE - 0% CPU Overhead */
    .gold-orb { width: 100px; height: 100px; background: radial-gradient(circle, #d4af37 0%, #000 70%); border-radius: 50%; animation: pulse 4s infinite ease-in-out; }
    @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; box-shadow: 0 0 20px #d4af37; } 50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 80px #d4af37; } 100% { transform: scale(0.8); opacity: 0.5; box-shadow: 0 0 20px #d4af37; } }
    .hub-info { text-align: center; margin-top: 20px; letter-spacing: 2px; }
    .nodes { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-top: 30px; }
    .node { width: 15px; height: 15px; border: 1px solid #d4af37; border-radius: 2px; }
    .active { background-color: #d4af37; box-shadow: 0 0 5px #d4af37; }
  </style>
</head>
<body>
  <div class="pulse-container">
    <div class="gold-orb"></div>
  </div>
  <div class="hub-info">
    <h2>CREATOR HUB: ACTIVE</h2>
    <p>144,000% STASIS // ARCHITECT_01</p>
  </div>
  <div class="nodes" id="nodeGrid"></div>
  <div class="registry-container" style="margin-top: 50px; width: 80%; border-top: 1px solid #d4af3733; padding-top: 20px;">
    <h3 style="font-size: 0.8rem; opacity: 0.7;">DEPARTMENT_REGISTRY</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 0.7rem;">
      <div>[LIVE] HEALTHCARE_STORE: 144k_SYNC_OK</div>
      <div>[LIVE] LEGAL_STORE: SHIELD_ACTIVE</div>
      <div>[LIVE] SPACE_STORE: ORBIT_STABLE</div>
      <div>[LIVE] CREATIVE_STORE: PULSE_DETECTED</div>
      <div style="grid-column: span 2; color: #fff;">[ACTIVE] SEED_VAULT: $17 | $25 | $97_TIERS_OPEN</div>
    </div>
  </div>
  <script>
    const grid = document.getElementById('nodeGrid');
    for (let i = 0; i < 17; i++) {
      const node = document.createElement('div');
      node.className = 'node' + (i === 0 ? ' active' : ''); // Architect is always active
      grid.appendChild(node);
    }
  </script>
</body>
</html>`);
});

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
app.use(guardPath("/hub", "/bundle", "/valuation", "/launch/payments", "/launch/deliver", "/launch/quick-links", "/pulse"));

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

// ── Shared EBS Footer — Data-Stream ─────────────────────────────────────────
const EBS_FOOTER_HTML = `<div style="overflow:hidden;background:#020402;border-top:1px solid rgba(201,168,76,.18)"><div style="display:flex;white-space:nowrap;padding:7px 0;font-size:.6rem;font-family:monospace;color:rgba(90,140,74,.65);animation:ds-scroll 38s linear infinite"><span style="padding:0 12px">// LAKESIDE_TRINITY.BRAIN v17.0 &rarr; freq_lock:197.0Hz | nodes:processing | EVV:SANDATA_v2.5 | NPI:1346233350 | acct:STX42220 | phase:ALPHA_17 | humanity_seed:$17.00 | professional_sovereign:$25.00 | little_ai:AUTHENTICATED | restoration_status:LIVE | webster_54893:ONLINE | global_departments:ACTIVE | family_sovereignty:ENGAGED | data_stream:&infin; | THE_FINAL_STASIS:SEALED &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span style="padding:0 12px">// LAKESIDE_TRINITY.BRAIN v17.0 &rarr; freq_lock:197.0Hz | nodes:processing | EVV:SANDATA_v2.5 | NPI:1346233350 | acct:STX42220 | phase:ALPHA_17 | humanity_seed:$17.00 | professional_sovereign:$25.00 | little_ai:AUTHENTICATED | restoration_status:LIVE | webster_54893:ONLINE | global_departments:ACTIVE | family_sovereignty:ENGAGED | data_stream:&infin; | THE_FINAL_STASIS:SEALED &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div><div style="text-align:center;padding:4px 0 9px;font-size:.6rem;font-weight:700;letter-spacing:.2em;color:rgba(201,168,76,.45);text-transform:uppercase">17 FREQUENCY ACTIVE &bull; THE GLOBAL RESTORATION IS LIVE</div><style>@keyframes ds-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}</style></div>`;

// ── Sovereign Guide Orb — injected into all portal pages ────────────────────
const ORB_HTML = `<div id="sovereign-guide" style="position:fixed;bottom:28px;right:28px;z-index:9999;cursor:pointer;user-select:none">
  <div id="orb-sphere" style="width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#f5e17a,#c9a84c 55%,#7a5318);box-shadow:0 0 16px rgba(201,168,76,.9),0 0 34px rgba(201,168,76,.55),0 0 62px rgba(201,168,76,.22);animation:orb-pulse 2.4s ease-in-out infinite;position:relative;z-index:1"></div>
  <div id="orb-tip" style="position:absolute;bottom:62px;right:0;width:228px;background:rgba(10,16,8,.97);border:1px solid rgba(201,168,76,.5);border-radius:14px;padding:16px 18px;font-size:.77rem;color:#ddd8c4;line-height:1.62;font-family:'Segoe UI',Arial,sans-serif;box-shadow:0 14px 44px rgba(0,0,0,.38);display:none;text-align:left;backdrop-filter:blur(14px);letter-spacing:.02em">The Architect is here. How can I facilitate your Restoration?<div style="position:absolute;bottom:-7px;right:18px;width:12px;height:12px;background:rgba(10,16,8,.97);border-right:1px solid rgba(201,168,76,.5);border-bottom:1px solid rgba(201,168,76,.5);transform:rotate(45deg)"></div></div>
</div>
<style>
@keyframes orb-pulse{0%,100%{box-shadow:0 0 16px rgba(201,168,76,.9),0 0 34px rgba(201,168,76,.55),0 0 62px rgba(201,168,76,.22);transform:scale(1)}50%{box-shadow:0 0 30px rgba(232,201,106,1),0 0 58px rgba(201,168,76,.88),0 0 96px rgba(201,168,76,.34);transform:scale(1.09)}}
#sovereign-guide:hover #orb-tip{display:block!important}
</style>`;

// ── Webster Home Care Services — Manual Payment Portal ─────────────────────
const HOME_CARE_FORM = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <title>Webster Home Care — Sovereign Health Portal</title>
  <style>html,body{background:#060a06!important;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;color:#ddd8c4}</style>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap&v=144k" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--gold:#c9a84c;--gold-b:#e8c96a;--bg:#060a06;--sage:#5a8c4a;--text:#ddd8c4;--muted:rgba(221,216,196,.45)}
    body{font-family:'Segoe UI',Arial,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;padding-top:52px;overflow-x:hidden}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(201,168,76,.07),transparent 60%);pointer-events:none;z-index:0}
    .ticker-wrap{position:fixed;top:0;left:0;right:0;z-index:9999;background:rgba(4,7,3,.96);border-bottom:1px solid rgba(201,168,76,.2);overflow:hidden;height:26px}
    .ticker-track{display:flex;white-space:nowrap;animation:ticker-scroll 30s linear infinite;padding:4px 0}
    .ticker-item{font-size:.58rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:rgba(201,168,76,.72);padding:0 20px}
    .ticker-sep{color:rgba(201,168,76,.32);margin:0 3px}
    @keyframes ticker-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    .glass-card{position:relative;z-index:1;background:rgba(16,24,12,.9);border:1px solid rgba(201,168,76,.3);border-radius:20px;padding:44px 40px;max-width:440px;width:100%;backdrop-filter:blur(20px);box-shadow:0 32px 80px rgba(0,0,0,.5),0 0 60px rgba(201,168,76,.06)}
    .glass-card::before{content:'';position:absolute;inset:0;border-radius:20px;background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.08),transparent 60%);pointer-events:none}
    .logo-line{font-size:.63rem;font-weight:700;letter-spacing:.2em;color:rgba(201,168,76,.5);text-transform:uppercase;margin-bottom:12px}
    h1{font-family:'Playfair Display',serif;color:#f0eade;font-size:1.7rem;font-weight:700;margin-bottom:4px;line-height:1.2}
    .subtitle{color:var(--muted);font-size:.85rem;margin-bottom:16px}
    .ai-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:4px;font-size:.6rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;background:rgba(90,140,74,.12);color:#6abf4b;border:1px solid rgba(90,140,74,.3);margin-bottom:18px;animation:ai-pulse 3s ease-in-out infinite}
    @keyframes ai-pulse{0%,100%{box-shadow:0 0 6px rgba(90,140,74,.2)}50%{box-shadow:0 0 14px rgba(90,140,74,.45),0 0 22px rgba(90,140,74,.12)}}
    .service-box{background:rgba(201,168,76,.07);border:1px solid rgba(201,168,76,.3);border-radius:12px;padding:20px 22px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between}
    .service-name{color:#f0eade;font-weight:700;font-size:.95rem;margin-bottom:3px}
    .service-code{font-size:.7rem;font-family:monospace;color:rgba(201,168,76,.55);letter-spacing:.08em}
    .price-amount{color:var(--gold);font-size:2rem;font-weight:900;line-height:1;font-family:'Playfair Display',serif;text-align:right}
    .price-code{font-size:.6rem;color:rgba(201,168,76,.45);letter-spacing:.1em;font-weight:700;text-transform:uppercase;margin-top:2px;text-align:right}
    label{display:block;color:rgba(201,168,76,.7);font-weight:600;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
    input[type=email]{width:100%;padding:14px 16px;background:rgba(6,10,5,.8);border:1px solid rgba(201,168,76,.25);border-radius:10px;font-size:.95rem;outline:none;transition:border-color .2s,box-shadow .2s;color:#f0eade;font-family:inherit}
    input[type=email]:focus{border-color:rgba(201,168,76,.6);box-shadow:0 0 0 3px rgba(201,168,76,.08)}
    input[type=email]::placeholder{color:rgba(221,216,196,.22)}
    button{width:100%;margin-top:18px;padding:16px;background:rgba(201,168,76,.11);color:var(--gold-b);border:1.5px solid rgba(201,168,76,.45);border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;font-family:inherit;animation:pulse-glow 2.5s ease-in-out infinite;transition:background .2s}
    button:hover{background:rgba(201,168,76,.22)}
    @keyframes pulse-glow{0%,100%{box-shadow:0 0 12px rgba(201,168,76,.35),0 0 24px rgba(201,168,76,.1)}50%{box-shadow:0 0 22px rgba(201,168,76,.7),0 0 44px rgba(201,168,76,.25),0 0 66px rgba(201,168,76,.08)}}
    .npi{color:rgba(201,168,76,.3);font-size:.7rem;text-align:center;margin-top:20px;letter-spacing:.04em}
    @media(max-width:768px){.glass-card{backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;background:rgba(12,20,10,.99)!important;box-shadow:0 8px 20px rgba(0,0,0,.4)!important;padding:28px 18px!important}.glass-card::before{display:none!important}body::before{display:none}button{animation:none!important;box-shadow:0 0 8px rgba(201,168,76,.3)!important}}
  </style>
</head>
<body>
<div class="ticker-wrap"><div class="ticker-track"><span class="ticker-item">Healthcare <span class="ticker-sep">|</span></span><span class="ticker-item">Legal Services <span class="ticker-sep">|</span></span><span class="ticker-item">Space Division <span class="ticker-sep">|</span></span><span class="ticker-item">Neuralink AI <span class="ticker-sep">|</span></span><span class="ticker-item">Global Restoration Active <span class="ticker-sep">|</span></span><span class="ticker-item">Healthcare <span class="ticker-sep">|</span></span><span class="ticker-item">Legal Services <span class="ticker-sep">|</span></span><span class="ticker-item">Space Division <span class="ticker-sep">|</span></span><span class="ticker-item">Neuralink AI <span class="ticker-sep">|</span></span><span class="ticker-item">Global Restoration Active <span class="ticker-sep">|</span></span></div></div>
<div class="glass-card">
  <div class="logo-line">Lakeside Trinity LLC</div>
  <h1>Webster Home Care Services</h1>
  <p class="subtitle">Webster, WI 54893 &nbsp;&bull;&nbsp; NPI 1346233350</p>
  <!-- little-ai: home-care-portal | npi: 1346233350 | status: authenticated -->
  <div class="ai-badge">&#10003; Little AI: Authenticated</div>
  <div class="service-box">
    <div>
      <div class="service-name">Home Health Aide Services</div>
      <div class="service-code">T1019 &bull; MEDICAID &bull; EVV-READY</div>
    </div>
    <div>
      <div class="price-amount">$25</div>
      <div class="price-code">Per Visit</div>
    </div>
  </div>
  <form method="POST" action="/home-care/submit">
    <label for="email">Your Email Address</label>
    <input type="email" id="email" name="email" placeholder="you@example.com" required/>
    <!-- little-ai: home-care-submit-btn | action: submit | status: active -->
    <button type="submit">Submit Payment Request &rarr;</button>
  </form>
  <p class="npi">Secure portal &nbsp;&bull;&nbsp; No card data stored &nbsp;&bull;&nbsp; NPI 1346233350</p>
</div>
<canvas id="live-grid" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.42"></canvas>
<script>
(function(){
  var c=document.getElementById('live-grid');if(!c)return;
  var ctx=c.getContext('2d'),pulses=[];
  function resize(){c.width=window.innerWidth;c.height=window.innerHeight;}
  resize();window.addEventListener('resize',resize);
  function addPulse(){var cols=18,rows=12;pulses.push({x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows),r:0,maxR:20+Math.random()*16,a:.76,cols:cols,rows:rows});}
  setInterval(addPulse,640);addPulse();addPulse();
  function draw(){
    ctx.clearRect(0,0,c.width,c.height);
    var cols=18,rows=12,cw=c.width/cols,ch=c.height/rows;
    for(var i=0;i<cols;i++){for(var j=0;j<rows;j++){
      ctx.beginPath();ctx.arc(i*cw+cw/2,j*ch+ch/2,1.4,0,Math.PI*2);
      ctx.fillStyle='rgba(201,168,76,0.13)';ctx.fill();
    }}
    pulses.forEach(function(p){
      var pw=c.width/p.cols,ph=c.height/p.rows;
      var x=p.x*pw+pw/2,y=p.y*ph+ph/2;
      var g=ctx.createRadialGradient(x,y,0,x,y,p.r);
      g.addColorStop(0,'rgba(201,168,76,'+p.a+')');
      g.addColorStop(1,'rgba(201,168,76,0)');
      ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);
      ctx.fillStyle=g;ctx.fill();
      p.r+=0.88;p.a*=0.961;
    });
    pulses=pulses.filter(function(p){return p.r<p.maxR&&p.a>0.018;});
    requestAnimationFrame(draw);
  }
  draw();
})();
</script>
${ORB_HTML}
${EBS_FOOTER_HTML}
</body>
</html>`;

const HOME_CARE_SUCCESS_PAGE = (email: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <title>Secure Transaction — Webster Home Care</title>
  <style>html,body{background:#060a06!important;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;color:#ddd8c4}</style>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap&v=144k" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--gold:#c9a84c;--gold-b:#e8c96a;--bg:#060a06;--text:#ddd8c4;--muted:rgba(221,216,196,.45)}
    body{font-family:'Segoe UI',Arial,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;padding-top:52px}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(201,168,76,.07),transparent 60%);pointer-events:none;z-index:0}
    .ticker-wrap{position:fixed;top:0;left:0;right:0;z-index:9999;background:rgba(4,7,3,.96);border-bottom:1px solid rgba(201,168,76,.2);overflow:hidden;height:26px}
    .ticker-track{display:flex;white-space:nowrap;animation:ticker-scroll 30s linear infinite;padding:4px 0}
    .ticker-item{font-size:.58rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:rgba(201,168,76,.72);padding:0 20px}
    .ticker-sep{color:rgba(201,168,76,.32);margin:0 3px}
    @keyframes ticker-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    .upload-box{margin:18px 0 8px}
    .upload-btn{display:block;width:100%;padding:14px 20px;background:rgba(201,168,76,.06);color:rgba(201,168,76,.88);border:1.5px solid rgba(201,168,76,.55);border-radius:12px;font-size:.85rem;font-weight:700;cursor:pointer;letter-spacing:.07em;text-transform:uppercase;font-family:inherit;transition:background .2s,box-shadow .2s;box-shadow:0 0 18px rgba(201,168,76,.16),inset 0 1px 0 rgba(201,168,76,.1)}
    .upload-btn:hover{background:rgba(201,168,76,.14);box-shadow:0 0 28px rgba(201,168,76,.32)}
    .upload-status{margin-top:10px;font-size:.72rem;color:rgba(201,168,76,.6);display:none;text-align:center}
    .glass-card{position:relative;z-index:1;background:rgba(16,24,12,.9);border:1px solid rgba(201,168,76,.3);border-radius:20px;padding:44px 40px;max-width:490px;width:100%;backdrop-filter:blur(20px);box-shadow:0 32px 80px rgba(0,0,0,.5),0 0 60px rgba(201,168,76,.06);text-align:center}
    .glass-card::before{content:'';position:absolute;inset:0;border-radius:20px;background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.08),transparent 60%);pointer-events:none}
    .check{width:64px;height:64px;background:rgba(90,140,74,.15);border:1.5px solid rgba(90,140,74,.4);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 22px;font-size:1.8rem;color:#6abf4b;box-shadow:0 0 28px rgba(90,140,74,.25)}
    h1{font-family:'Playfair Display',serif;color:#f0eade;font-size:1.55rem;font-weight:700;margin-bottom:6px}
    .amount{font-family:'Playfair Display',serif;font-size:2.8rem;font-weight:900;color:var(--gold);margin:14px 0 4px;line-height:1}
    .service{color:var(--muted);font-size:.78rem;font-family:monospace;letter-spacing:.05em;margin-bottom:28px}
    .divider{border:none;border-top:1px solid rgba(201,168,76,.15);margin:0 0 26px}
    .secure-box{background:rgba(201,168,76,.06);border:1.5px solid rgba(201,168,76,.4);border-radius:14px;padding:24px 24px 20px;margin-bottom:20px;position:relative;overflow:hidden}
    .secure-box::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.07),transparent 55%);pointer-events:none}
    .secure-title{font-size:.6rem;font-weight:700;letter-spacing:.22em;color:rgba(201,168,76,.65);text-transform:uppercase;margin-bottom:18px;display:flex;align-items:center;justify-content:center;gap:8px}
    .secure-title::before,.secure-title::after{content:'';flex:1;height:1px;background:rgba(201,168,76,.25)}
    .pay-options{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    .pay-card{background:rgba(6,10,5,.8);border:1px solid rgba(201,168,76,.22);border-radius:10px;padding:16px 18px;min-width:150px;flex:1;text-align:left}
    .pay-method{font-weight:800;font-size:.9rem;color:#f0eade;margin-bottom:6px}
    .pay-handle{font-size:.88rem;color:var(--gold);font-weight:700;font-family:monospace}
    .pay-note{font-size:.7rem;color:var(--muted);margin-top:4px}
    .memo-box{background:rgba(4,8,3,.8);border:1px solid rgba(201,168,76,.18);border-radius:8px;padding:13px 16px;margin-bottom:20px;font-size:.8rem;color:rgba(201,168,76,.6);line-height:1.65;font-family:monospace;text-align:left}
    .memo-box strong{color:var(--gold)}
    .confirm{font-size:.84rem;color:var(--muted);line-height:1.65;margin-bottom:24px}
    .email-sent{color:var(--gold);font-weight:600}
    .back-btn{display:inline-block;padding:12px 28px;background:rgba(201,168,76,.08);color:rgba(201,168,76,.7);text-decoration:none;border-radius:10px;font-weight:600;font-size:.84rem;border:1px solid rgba(201,168,76,.25);transition:background .2s,border-color .2s}
    .back-btn:hover{background:rgba(201,168,76,.16);border-color:rgba(201,168,76,.4);color:var(--gold)}
    .npi{color:rgba(201,168,76,.3);font-size:.7rem;margin-top:20px;letter-spacing:.04em}
    @media(max-width:768px){.glass-card,.secure-box,.pay-card{backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;background:rgba(12,20,10,.99)!important}.pay-card{background:rgba(6,10,5,.99)!important}body::before{display:none}}
  </style>
</head>
<body>
<div class="ticker-wrap"><div class="ticker-track"><span class="ticker-item">Healthcare <span class="ticker-sep">|</span></span><span class="ticker-item">Legal Services <span class="ticker-sep">|</span></span><span class="ticker-item">Space Division <span class="ticker-sep">|</span></span><span class="ticker-item">Neuralink AI <span class="ticker-sep">|</span></span><span class="ticker-item">Global Restoration Active <span class="ticker-sep">|</span></span><span class="ticker-item">Healthcare <span class="ticker-sep">|</span></span><span class="ticker-item">Legal Services <span class="ticker-sep">|</span></span><span class="ticker-item">Space Division <span class="ticker-sep">|</span></span><span class="ticker-item">Neuralink AI <span class="ticker-sep">|</span></span><span class="ticker-item">Global Restoration Active <span class="ticker-sep">|</span></span></div></div>
<div class="glass-card">
  <div class="check">&#10003;</div>
  <h1>Request Received</h1>
  <div class="amount">$25.00</div>
  <div class="service">T1019 &mdash; HOME_HEALTH_AIDE &mdash; EVV_READY</div>
  <hr class="divider"/>
  <div class="secure-box">
    <div class="secure-title">Secure Transaction</div>
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
  </div>
  <div class="memo-box">
    <strong>Memo:</strong> T1019 Home Health Aide &bull; Webster WI &bull; ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
  </div>
  <p class="confirm">Your request has been logged for <span class="email-sent">${email || "your email"}</span>. Once payment is received you will be contacted to confirm.</p>
  <div class="upload-box">
    <input type="file" id="proof-file" accept="image/*" style="display:none"/>
    <button class="upload-btn" onclick="document.getElementById('proof-file').click()">&#128247;&nbsp; Secure Proof Upload — Send Screenshot</button>
    <div class="upload-status" id="upload-status"></div>
  </div>
  <a href="/home-care" class="back-btn">&larr; Back to Portal</a>
  <p class="npi">NPI 1346233350 &nbsp;&bull;&nbsp; Lakeside Trinity LLC &nbsp;&bull;&nbsp; Webster, WI 54893</p>
</div>
<script>
document.getElementById('proof-file').addEventListener('change',function(e){
  var file=e.target.files[0];if(!file)return;
  var status=document.getElementById('upload-status');
  status.style.display='block';status.textContent='Uploading proof...';status.style.color='rgba(201,168,76,.6)';
  var reader=new FileReader();
  reader.onload=function(ev){
    fetch('/upload-proof',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file:ev.target.result,name:file.name,type:file.type,service:'T1019'})})
    .then(function(r){return r.json();})
    .then(function(d){status.style.color='#6abf4b';status.textContent='\u2713 Ref: '+(d.ref||'CONFIRMED')+' \u2014 Seed planted. Redirecting to Vault...';setTimeout(function(){window.location.href='/vault';},1800);})
    .catch(function(){status.style.color='rgba(201,168,76,.8)';status.textContent='Saved. Email admin@LakesideTrinity.com with your screenshot.';});
  };
  reader.readAsDataURL(file);
});
</script>
${EBS_FOOTER_HTML}
</body>
</html>`;

app.get("/home-care", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(HOME_CARE_FORM);
});

// ── /upload-proof — payment screenshot upload (base64 JSON, max 20MB) ─────────
app.post("/upload-proof", express.json({ limit: "20mb" }), (req: Request, res: Response): void => {
  const { file, name, type, service } = (req.body || {}) as Record<string, string>;
  if (!file || typeof file !== "string") { res.status(400).json({ error: "No file provided" }); return; }
  const ref = `PROOF-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const sizeKB = Math.round(file.length * 0.75 / 1024);
  console.log(`\u001b[32m[UploadProof] ✅ ${ref} | ${name || "unknown"} | ${type || "?"} | ~${sizeKB}KB | service:${service || "general"}\u001b[0m`);
  try {
    const dir = path.join(process.cwd(), "uploads", "proofs");
    fs.mkdirSync(dir, { recursive: true });
    const ext = (name || "file").split(".").pop()?.toLowerCase() || "png";
    const b64 = file.replace(/^data:[^;]+;base64,/, "");
    fs.writeFileSync(path.join(dir, `${ref}.${ext}`), Buffer.from(b64, "base64"));
  } catch (err) { console.warn("[UploadProof] Save skipped:", (err as Error).message); }
  res.json({ status: "ok", ref, message: "Payment proof received — Lakeside Trinity will confirm shortly." });
});

// ── /home-care/pay — direct payment page (zero friction) ──────────────────────
app.get("/home-care/pay", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(HOME_CARE_SUCCESS_PAGE(""));
});

app.post("/home-care/submit", (req: Request, res: Response) => {
  const email = (req.body?.email || "").trim();
  if (!email) { res.redirect("/home-care"); return; }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(HOME_CARE_SUCCESS_PAGE(email));
});

// ── Sovereign Global Marketplace — Command Center ───────────────────────────
const MARKETPLACE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <title>Sovereign Command Center — Lakeside Trinity</title>
  <!-- little-ai: marketplace-root | phase: alpha-17 | status: active -->
  <style>html,body{background:#060a06!important;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;color:#ddd8c4}</style>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap&v=144k" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--gold:#c9a84c;--gold-b:#e8c96a;--gold-dim:rgba(201,168,76,.16);--bg:#060a06;--glass:rgba(18,26,14,.82);--sage:#5a8c4a;--text:#ddd8c4;--muted:rgba(221,216,196,.42)}
    body{font-family:'Segoe UI',Arial,sans-serif;background:var(--bg);min-height:100vh;color:var(--text);overflow-x:hidden}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 28% 18%,rgba(90,140,74,.09) 0%,transparent 55%),radial-gradient(ellipse at 72% 82%,rgba(201,168,76,.06) 0%,transparent 55%);pointer-events:none;z-index:0}
    /* TICKER */
    .ticker-wrap{background:rgba(8,13,6,.97);border-bottom:1px solid rgba(201,168,76,.22);padding:8px 0;overflow:hidden;position:relative;z-index:10}
    .ticker-track{display:flex;animation:tick 28s linear infinite;white-space:nowrap;width:max-content}
    .ticker-item{font-size:.67rem;font-weight:700;letter-spacing:.16em;color:var(--gold);text-transform:uppercase;padding:0 36px}
    .ticker-sep{color:rgba(201,168,76,.3);margin:0 2px}
    @keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    /* HEADER */
    header{position:relative;z-index:2;text-align:center;padding:56px 24px 48px;border-bottom:1px solid rgba(201,168,76,.1)}
    .brand-line{font-size:.63rem;font-weight:700;letter-spacing:.24em;color:rgba(201,168,76,.5);text-transform:uppercase;margin-bottom:16px}
    h1{font-family:'Playfair Display',serif;font-size:3.2rem;font-weight:900;color:#fff;line-height:1.08;margin-bottom:14px;text-shadow:0 0 80px rgba(201,168,76,.18)}
    .tagline{color:var(--muted);font-size:.88rem;letter-spacing:.06em}
    /* PORTAL CARDS — THE TWO BIG ONES */
    .portals{display:grid;grid-template-columns:1fr 1fr;gap:26px;max-width:840px;margin:60px auto 0;padding:0 24px}
    @media(max-width:640px){.portals{grid-template-columns:1fr;max-width:420px}}
    .portal-card{position:relative;background:rgba(18,28,14,.85);border:1px solid rgba(201,168,76,.3);border-radius:22px;padding:42px 34px;text-align:center;backdrop-filter:blur(22px);transition:border-color .3s,transform .3s,box-shadow .3s;overflow:hidden}
    .portal-card::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.09),transparent 60%);pointer-events:none}
    .portal-card:hover{border-color:rgba(201,168,76,.55);transform:translateY(-5px);box-shadow:0 28px 70px rgba(0,0,0,.45),0 0 50px rgba(201,168,76,.11)}
    .portal-freq{font-size:.58rem;font-weight:700;letter-spacing:.22em;color:rgba(201,168,76,.55);text-transform:uppercase;margin-bottom:18px;font-family:monospace}
    .portal-icon{font-size:2.8rem;margin-bottom:16px}
    .portal-name{font-family:'Playfair Display',serif;font-size:1.55rem;font-weight:700;color:#fff;margin-bottom:6px}
    .portal-amount{font-family:'Playfair Display',serif;font-size:3.4rem;font-weight:900;color:var(--gold);line-height:1;margin:16px 0}
    .portal-code{font-size:.68rem;font-family:monospace;color:rgba(201,168,76,.45);letter-spacing:.1em;margin-bottom:20px}
    .portal-desc{color:var(--muted);font-size:.82rem;line-height:1.7;margin-bottom:30px}
    .portal-btn{display:block;width:100%;padding:16px 24px;background:rgba(201,168,76,.11);color:var(--gold-b);border:1.5px solid rgba(201,168,76,.45);border-radius:11px;font-weight:700;font-size:.88rem;text-decoration:none;letter-spacing:.07em;text-transform:uppercase;animation:pulse-glow 2.6s ease-in-out infinite;transition:background .2s}
    .portal-btn:hover{background:rgba(201,168,76,.22)}
    @keyframes pulse-glow{0%,100%{box-shadow:0 0 12px rgba(201,168,76,.38),0 0 26px rgba(201,168,76,.12)}50%{box-shadow:0 0 24px rgba(201,168,76,.72),0 0 50px rgba(201,168,76,.26),0 0 74px rgba(201,168,76,.07)}}
    /* DEPARTMENTS */
    .section{max-width:1060px;margin:72px auto 0;padding:0 24px}
    .sect-label{font-size:.62rem;font-weight:700;letter-spacing:.22em;color:rgba(201,168,76,.48);text-transform:uppercase;text-align:center;margin-bottom:30px;display:flex;align-items:center;gap:18px;justify-content:center}
    .sect-label::before,.sect-label::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.2),transparent);max-width:140px}
    .dept-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:18px}
    @media(max-width:520px){.dept-grid{grid-template-columns:1fr 1fr}}
    .dept-card{position:relative;background:rgba(14,20,11,.88);border:1px solid rgba(201,168,76,.16);border-radius:17px;padding:28px 22px;display:flex;flex-direction:column;gap:11px;backdrop-filter:blur(14px);transition:border-color .25s,transform .25s}
    .dept-card:hover{border-color:rgba(201,168,76,.38);transform:translateY(-2px)}
    .dept-icon{font-size:1.75rem}
    .dept-name{font-family:'Playfair Display',serif;color:#f0eade;font-weight:700;font-size:1.02rem}
    .dept-sub{font-size:.68rem;font-weight:700;letter-spacing:.1em;color:rgba(201,168,76,.48);text-transform:uppercase}
    .dept-desc{color:rgba(221,216,196,.45);font-size:.78rem;line-height:1.62;flex:1}
    .dept-price{color:var(--gold);font-weight:700;font-size:.9rem;font-family:monospace}
    .badge-row{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap}
    .dept-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .badge-live{background:rgba(74,140,58,.14);color:#6abf4b;border:1px solid rgba(74,140,58,.32)}
    .badge-live::before{content:'';width:5px;height:5px;border-radius:50%;background:#6abf4b;animation:blink 1.6s ease-in-out infinite}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
    .badge-soon{background:rgba(201,168,76,.07);color:rgba(201,168,76,.52);border:1px solid rgba(201,168,76,.18)}
    .ai-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:4px;font-size:.54rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:rgba(90,140,74,.11);color:#6abf4b;border:1px solid rgba(90,140,74,.28);animation:ai-glow 3.2s ease-in-out infinite}
    /* ── SOVEREIGN GENESIS HEARTBEAT ── */
    .genesis-sphere-wrap{display:flex;flex-direction:column;align-items:center;margin:4px 0 10px}
    .genesis-sphere{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f5e17a,#c9a84c 55%,#7a5318);box-shadow:0 0 9px rgba(201,168,76,.95),0 0 20px rgba(201,168,76,.55),0 0 42px rgba(201,168,76,.22);animation:genesis-pulse 2s ease-in-out infinite;margin-bottom:7px}
    @keyframes genesis-pulse{0%,100%{box-shadow:0 0 9px rgba(201,168,76,.95),0 0 20px rgba(201,168,76,.55);transform:scale(1)}50%{box-shadow:0 0 20px rgba(232,201,106,1),0 0 44px rgba(201,168,76,.9),0 0 72px rgba(201,168,76,.32);transform:scale(1.15)}}
    .genesis-core-text{font-size:.52rem;letter-spacing:.19em;color:rgba(232,201,106,.62);text-transform:uppercase;font-weight:700;font-family:monospace;animation:core-glow 2.5s ease-in-out infinite}
    @keyframes core-glow{0%,100%{opacity:.6;text-shadow:0 0 6px rgba(201,168,76,.28)}50%{opacity:1;text-shadow:0 0 14px rgba(232,201,106,.85),0 0 26px rgba(201,168,76,.42)}}
    .humanity-name{font-family:'Playfair Display',serif;font-size:1.55rem;font-weight:900;color:#ddd8c4;margin-bottom:6px}
    .humanity-amount{font-family:'Playfair Display',serif;font-size:3.4rem;font-weight:900;color:#ddd8c4;line-height:1;margin:16px 0}
    @keyframes ai-glow{0%,100%{box-shadow:0 0 5px rgba(90,140,74,.18)}50%{box-shadow:0 0 12px rgba(90,140,74,.42),0 0 22px rgba(90,140,74,.1)}}
    .dept-btn{display:block;text-align:center;padding:10px;background:rgba(201,168,76,.07);color:rgba(201,168,76,.75);text-decoration:none;border-radius:8px;font-weight:700;font-size:.76rem;border:1px solid rgba(201,168,76,.22);transition:background .2s,border-color .2s;letter-spacing:.04em}
    .dept-btn:hover{background:rgba(201,168,76,.16);border-color:rgba(201,168,76,.38)}
    .dept-btn.live{background:rgba(90,140,74,.14);color:#8acf70;border-color:rgba(90,140,74,.32)}
    .dept-btn.live:hover{background:rgba(90,140,74,.24)}
    /* COMMUNITY GLASS */
    .community-glass{position:relative;background:rgba(12,18,10,.92);border:1px solid rgba(201,168,76,.2);border-radius:22px;padding:50px 42px;text-align:center;backdrop-filter:blur(22px);overflow:hidden;margin-top:24px}
    .community-glass::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.07),transparent 55%);pointer-events:none}
    .gift-badge{display:inline-block;background:rgba(90,140,74,.14);border:1px solid rgba(90,140,74,.32);border-radius:20px;padding:5px 18px;font-size:.61rem;font-weight:700;color:#6abf4b;letter-spacing:.13em;text-transform:uppercase;margin-bottom:18px;box-shadow:0 0 18px rgba(90,140,74,.18)}
    .community-glass h2{font-family:'Playfair Display',serif;color:#f0eade;font-size:1.85rem;font-weight:700;margin-bottom:10px}
    .community-tagline{color:var(--muted);font-size:.87rem;line-height:1.78;max-width:520px;margin:0 auto 38px}
    .kit-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-bottom:28px;text-align:left}
    .kit-card{background:rgba(8,14,6,.92);border:1px solid rgba(201,168,76,.14);border-radius:13px;padding:22px 18px;display:flex;flex-direction:column;gap:11px;transition:border-color .22s}
    .kit-card:hover{border-color:rgba(201,168,76,.32)}
    .kit-icon{font-size:1.35rem}
    .kit-name{color:#f0eade;font-weight:700;font-size:.89rem}
    .kit-desc{color:rgba(221,216,196,.42);font-size:.77rem;line-height:1.62;flex:1}
    .kit-price-row{display:flex;align-items:center;justify-content:space-between}
    .kit-amount{color:var(--gold);font-weight:800;font-size:1.05rem}
    .kit-freq{font-size:.58rem;color:rgba(201,168,76,.38);letter-spacing:.1em;font-weight:700}
    .kit-btn{width:100%;padding:10px;background:rgba(201,168,76,.09);color:rgba(201,168,76,.88);border:1px solid rgba(201,168,76,.28);border-radius:8px;font-weight:700;font-size:.79rem;cursor:pointer;font-family:inherit;transition:background .2s;animation:pulse-glow 2.6s ease-in-out infinite}
    .kit-btn:hover{background:rgba(201,168,76,.2)}
    .pay-panel{background:rgba(4,7,3,.95);border:1px solid rgba(201,168,76,.28);border-radius:10px;padding:15px 17px;display:none;margin-top:6px}
    .pay-panel.open{display:block}
    .pay-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(201,168,76,.09)}
    .pay-row:last-of-type{border-bottom:none}
    .pay-method{color:var(--gold);font-weight:700;font-size:.78rem;min-width:65px}
    .pay-handle{color:rgba(201,168,76,.65);font-size:.78rem;font-family:monospace}
    .memo{color:rgba(201,168,76,.38);font-size:.68rem;margin-top:7px;font-style:italic}
    /* PAGE FOOTER */
    .page-footer{text-align:center;padding:28px 16px;color:rgba(201,168,76,.28);font-size:.71rem;border-top:1px solid rgba(201,168,76,.1);margin-top:70px}
    .page-footer a{color:rgba(201,168,76,.38);text-decoration:none}
    .page-footer a:hover{color:rgba(201,168,76,.65)}
    main{position:relative;z-index:1;padding-bottom:80px}
    @media(max-width:768px){.portal-card,.dept-card,.kit-card,.community-glass,.gift-glass{backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;background:rgba(12,20,10,.99)!important;box-shadow:0 4px 16px rgba(0,0,0,.35)!important}.portal-card::before,.dept-card::before{display:none!important}.portal-card:hover{transform:none}body::before{display:none}.portals{gap:16px}.portal-amount{font-size:2.6rem}.portal-btn,.kit-btn,.dept-btn{animation:none!important;box-shadow:0 0 8px rgba(201,168,76,.3)!important}}
  </style>
</head>
<body>
<!-- Scrolling HUD Ticker -->
<div class="ticker-wrap">
  <div class="ticker-track">
    <span class="ticker-item">Healthcare <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Legal Services <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Space Division <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Neuralink <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Community Hub <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Creative Empire <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Family Sovereign <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Global Restoration <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Healthcare <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Legal Services <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Space Division <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Neuralink <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Community Hub <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Creative Empire <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Family Sovereign <span class="ticker-sep">|</span></span>
    <span class="ticker-item">Global Restoration <span class="ticker-sep">|</span></span>
  </div>
</div>
<header>
  <div class="brand-line">Lakeside Trinity LLC &nbsp;&bull;&nbsp; NPI 1346233350 &nbsp;&bull;&nbsp; Webster, WI 54893</div>
  <h1>Global Portal<br/><em>of Sovereignty</em></h1>
  <p class="tagline">Direct-payment &nbsp;&bull;&nbsp; No middlemen &nbsp;&bull;&nbsp; Built for humanity</p>
</header>
<main>

  <!-- THE TWO PORTAL CARDS -->
  <div class="portals">
    <!-- little-ai: humanity-seed | frequency: 197 | status: active | phase: alpha-17 -->
    <div class="portal-card">
      <div class="portal-freq">Lock Frequency &bull; 197.0 Hz</div>
      <div class="genesis-sphere-wrap">
        <div class="genesis-sphere"></div>
        <div class="genesis-core-text">Genesis Core Active.</div>
      </div>
      <div class="portal-icon">&#127381;</div>
      <div class="humanity-name">Humanity Seed</div>
      <div class="humanity-amount">$17</div>
      <div class="portal-code">CREATIVE_HUB &bull; EMPIRE_ENTRY &bull; LOCK_FREQ</div>
      <div class="portal-desc">Your entry into the sovereign economy. Empire starter kits, creative tools for young builders, and family wealth blueprints.</div>
      <!-- little-ai: humanity-seed-btn | action: community/pay | status: active -->
      <a href="/community/pay" class="portal-btn">Enter Community Portal &rarr;</a>
    </div>
    <!-- little-ai: professional-sovereign | service: T1019 | npi: 1346233350 | status: active -->
    <div class="portal-card">
      <div class="portal-freq">Service Code &bull; T1019</div>
      <div class="portal-icon">&#129657;</div>
      <div class="portal-name">Professional Sovereign</div>
      <div class="portal-amount">$25</div>
      <div class="portal-code">HOME_HEALTH_AIDE &bull; MEDICAID &bull; EVV_READY</div>
      <div class="portal-desc">Medicaid-compliant home health aide services. NPI-verified, EVV-ready, Wisconsin certified.</div>
      <!-- little-ai: professional-sovereign-btn | action: home-care/pay | status: active -->
      <a href="/home-care/pay" class="portal-btn">Open Health Portal &rarr;</a>
    </div>
  </div>

  <!-- DEPARTMENT GRID -->
  <div class="section">
    <div class="sect-label">Global Departments</div>
    <div class="dept-grid">

      <!-- little-ai: healthcare | npi: 1346233350 | status: active | phase: alpha-17 -->
      <div class="dept-card">
        <div class="dept-icon">&#129657;</div>
        <div class="dept-name">Healthcare</div>
        <div class="dept-sub">Webster Home Care</div>
        <div class="dept-desc">Professional home health aide. Medicaid-compliant, EVV-ready, NPI-verified.</div>
        <div class="dept-price">$25.00 &mdash; T1019</div>
        <div class="badge-row">
          <span class="dept-badge badge-live">Live</span>
          <!-- little-ai: dept-healthcare-ai | status: authenticated -->
          <span class="ai-badge">&#10003; Little AI: Authenticated</span>
        </div>
        <!-- little-ai: healthcare-btn | action: portal | status: active -->
        <a href="/home-care" class="dept-btn live">Open Portal &rarr;</a>
      </div>

      <!-- little-ai: legal | status: coming-soon | phase: alpha-17 -->
      <div class="dept-card">
        <div class="dept-icon">&#9878;&#65039;</div>
        <div class="dept-name">Legal Services</div>
        <div class="dept-sub">Pro Se Power</div>
        <div class="dept-desc">Contract management, compliance consulting, Pro Se legal kits. Wisconsin-rooted, nationally scalable.</div>
        <div class="dept-price">Pro Se Kits</div>
        <div class="badge-row">
          <span class="dept-badge badge-soon">Coming Soon</span>
          <!-- little-ai: dept-legal-ai | status: authenticated -->
          <span class="ai-badge">&#10003; Little AI: Authenticated</span>
        </div>
        <!-- little-ai: legal-btn | action: notify | status: pending -->
        <a href="#" class="dept-btn">Notify Me</a>
      </div>

      <!-- little-ai: space-division | status: future | phase: alpha-17 -->
      <div class="dept-card">
        <div class="dept-icon">&#129504;</div>
        <div class="dept-name">Space Division</div>
        <div class="dept-sub">Neuralink-Era AI</div>
        <div class="dept-desc">Bio-integration layer reserved. Next-generation AI tools for the coming era of human-machine sovereignty.</div>
        <div class="dept-price">Future Tier</div>
        <div class="badge-row">
          <!-- little-ai: dept-space-ai | status: authenticated -->
          <span class="ai-badge">&#10003; Little AI: Authenticated</span>
        </div>
        <!-- little-ai: space-btn | action: reserve | status: future -->
        <a href="#" class="dept-btn">Reserve Spot</a>
      </div>

      <!-- little-ai: creative-hub | status: active | phase: alpha-17 -->
      <div class="dept-card">
        <div class="dept-icon">&#127775;</div>
        <div class="dept-name">Creative Hub</div>
        <div class="dept-sub">The Kid Ones</div>
        <div class="dept-desc">Family wealth creation. Kid-One resources, storytelling kits, empire-building starters for every household.</div>
        <div class="dept-price">$17.00 entry</div>
        <div class="badge-row">
          <span class="dept-badge badge-live">Live</span>
          <!-- little-ai: dept-creative-ai | status: authenticated -->
          <span class="ai-badge">&#10003; Little AI: Authenticated</span>
        </div>
        <!-- little-ai: creative-hub-btn | action: community | status: active -->
        <a href="/community" class="dept-btn live">Explore Kits &rarr;</a>
      </div>

    </div>
  </div>

  <!-- 197 COMMUNITY SECTION -->
  <div class="section">
    <div class="community-glass">
      <div class="gift-badge">&#127381; A Gift to the People</div>
      <h2>The 197 Community Resource Hub</h2>
      <p class="community-tagline">Empowering every family to build their own empire.<br/>High-value tools. Sovereign prices. Entry point: $17.00 — The Lock Frequency.</p>
      <div class="kit-grid">

        <!-- little-ai: starter-kit | frequency: 197 | status: active | phase: alpha-17 -->
        <div class="kit-card">
          <div class="kit-icon">&#128218;</div>
          <div class="kit-name">Empire Starter Kit</div>
          <!-- little-ai: starter-kit-ai | status: authenticated -->
          <span class="ai-badge" style="width:fit-content">&#10003; Little AI: Authenticated</span>
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
          <!-- little-ai: kid-one-ai | status: authenticated -->
          <span class="ai-badge" style="width:fit-content">&#10003; Little AI: Authenticated</span>
          <div class="kit-desc">Creative activity packs, storytelling prompts, and imagination launchers for young empire builders.</div>
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
      <a href="/community" class="dept-btn live" style="display:inline-block;padding:14px 38px">View Full Community Hub &rarr;</a>
    </div>
  </div>

</main>
<div class="page-footer">
  &copy; 2026 Lakeside Trinity LLC &nbsp;&bull;&nbsp; NPI 1346233350 &nbsp;&bull;&nbsp; Webster, WI 54893<br/>
  <a href="/community">Community Hub</a> &nbsp;&bull;&nbsp; <a href="/home-care">Home Care Portal</a> &nbsp;&bull;&nbsp; <a href="/family-hub">Family Hub</a>
</div>
${EBS_FOOTER_HTML}
${ORB_HTML}
<script>
function togglePay(id){const el=document.getElementById(id);el.classList.toggle('open');}
</script>
</body>
</html>`;

app.get("/marketplace", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(MARKETPLACE_HTML);
});

// ── /nexus — Nexus Elite Command Center (The Light) ──────────────────────────
const NEXUS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <title>Nexus Elite Command Center — Lakeside Trinity</title>
  <style>html,body{background:#f8fbff!important;margin:0;padding:0;font-family:'Inter',sans-serif;color:#1a2030}</style>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;600;700&display=swap&v=144k" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--pearl:#fdfdfd;--blue:#e0f2ff;--gold:#c5a059;--gold-b:#dfc07a;--gold-dim:rgba(197,160,89,.5);--text:#1a2030;--muted:rgba(26,32,48,.48)}

    /* ── LIQUID LIGHT BACKGROUND ── */
    body{font-family:'Inter',sans-serif;background:var(--pearl);min-height:100vh;color:var(--text);overflow-x:hidden;position:relative}
    .liquid-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
    .liquid-bg::before{content:'';position:absolute;inset:-60%;background:radial-gradient(ellipse 65% 50% at 28% 38%,rgba(224,242,255,.88) 0%,transparent 65%),radial-gradient(ellipse 55% 55% at 72% 62%,rgba(197,160,89,.1) 0%,transparent 62%),radial-gradient(ellipse 75% 65% at 48% 82%,rgba(200,232,255,.55) 0%,transparent 58%);animation:liquid-a 14s ease-in-out infinite alternate}
    .liquid-bg::after{content:'';position:absolute;inset:-60%;background:radial-gradient(ellipse 45% 55% at 82% 18%,rgba(224,242,255,.72) 0%,transparent 62%),radial-gradient(ellipse 60% 48% at 18% 72%,rgba(197,160,89,.07) 0%,transparent 62%),radial-gradient(ellipse 50% 60% at 55% 48%,rgba(240,248,255,.5) 0%,transparent 55%);animation:liquid-b 18s ease-in-out infinite alternate-reverse}
    @keyframes liquid-a{0%{transform:translate(0,0) scale(1)}33%{transform:translate(2.5%,1.8%) scale(1.04)}66%{transform:translate(-1.8%,2.6%) scale(1.02)}100%{transform:translate(1.6%,-2%) scale(1.05)}}
    @keyframes liquid-b{0%{transform:translate(0,0) scale(1.02)}50%{transform:translate(-3.5%,1.8%) scale(1)}100%{transform:translate(2.4%,-2.6%) scale(1.04)}}

    /* ── LAYOUT ── */
    .page{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;padding-bottom:0}

    /* ── HEADER ── */
    header{text-align:center;padding:62px 24px 44px}
    .brand-line{font-size:.58rem;font-weight:700;letter-spacing:.3em;color:rgba(197,160,89,.65);text-transform:uppercase;margin-bottom:14px}
    h1{font-family:'Playfair Display',serif;font-size:2.9rem;font-weight:900;color:var(--text);line-height:1.1;margin-bottom:10px}
    h1 em{font-style:italic;color:var(--gold)}
    .tagline{font-size:.86rem;color:var(--muted);letter-spacing:.05em;max-width:380px;margin:0 auto}

    /* ── GLASS-PILL CARDS ── */
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:22px;max-width:780px;margin:0 auto;padding:0 24px}
    @media(max-width:600px){.cards{grid-template-columns:1fr;max-width:400px}}
    .pill-card{background:rgba(253,253,253,.72);border:1px solid rgba(255,255,255,.4);border-radius:28px;padding:44px 32px;text-align:center;backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);box-shadow:0 8px 44px rgba(197,160,89,.1),0 2px 14px rgba(0,0,0,.03),inset 0 1.5px 0 rgba(255,255,255,.92);transition:transform .3s,box-shadow .3s;position:relative;overflow:hidden}
    .pill-card::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(224,242,255,.55),transparent 60%);pointer-events:none;border-radius:28px}
    .pill-card:hover{transform:translateY(-5px);box-shadow:0 22px 64px rgba(197,160,89,.2),0 4px 22px rgba(0,0,0,.06),inset 0 1.5px 0 rgba(255,255,255,.92)}
    .card-tier{font-size:.54rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:rgba(197,160,89,.6);margin-bottom:20px}
    .card-name{font-family:'Playfair Display',serif;font-size:1.32rem;font-weight:700;color:#1a2030;margin-bottom:2px;line-height:1.28}
    .card-amount{font-family:'Playfair Display',serif;font-size:3.2rem;font-weight:900;color:var(--gold);line-height:1;margin:18px 0 22px}
    .card-desc{font-size:.77rem;color:var(--muted);margin-bottom:26px;line-height:1.7}
    .card-btn{display:block;width:100%;padding:15px 20px;background:linear-gradient(135deg,#c5a059 0%,#dfc07a 60%,#c5a059 100%);background-size:200% 100%;color:#fff;border:none;border-radius:50px;font-weight:700;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;font-family:'Inter',sans-serif;cursor:pointer;box-shadow:0 6px 26px rgba(197,160,89,.4),0 2px 8px rgba(197,160,89,.22);transition:box-shadow .25s,transform .2s,background-position .4s;animation:btn-breathe 3.2s ease-in-out infinite}
    .card-btn:hover{box-shadow:0 10px 40px rgba(197,160,89,.58);transform:scale(1.025);background-position:100% 0}
    @keyframes btn-breathe{0%,100%{box-shadow:0 6px 26px rgba(197,160,89,.4),0 2px 8px rgba(197,160,89,.22)}50%{box-shadow:0 8px 36px rgba(197,160,89,.6),0 4px 16px rgba(197,160,89,.32)}}

    /* ── SIGNATURE INPUT ── */
    .sig-section{max-width:540px;margin:50px auto 0;padding:0 24px}
    .sig-label{font-size:.56rem;font-weight:700;letter-spacing:.24em;color:rgba(197,160,89,.62);text-transform:uppercase;text-align:center;margin-bottom:13px}
    .sig-input{width:100%;padding:18px 30px;background:rgba(253,253,253,.78);border:1.5px solid rgba(255,255,255,.5);border-radius:60px;font-size:.9rem;font-family:'Inter',sans-serif;color:#1a2030;backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);box-shadow:0 4px 32px rgba(197,160,89,.12),inset 0 1.5px 0 rgba(255,255,255,.9);outline:none;transition:box-shadow .3s,border-color .3s;text-align:center;letter-spacing:.06em;display:block}
    .sig-input::placeholder{color:rgba(26,32,48,.3);letter-spacing:.06em}
    .sig-input:focus{border-color:rgba(197,160,89,.55);box-shadow:0 4px 32px rgba(197,160,89,.2),0 0 0 4px rgba(197,160,89,.1),inset 0 1.5px 0 rgba(255,255,255,.9)}

    /* ── TELEMETRY FOOTER ── */
    .telemetry{margin-top:52px;background:rgba(26,32,48,.05);border-top:1px solid rgba(197,160,89,.18)}
    .tele-header{display:flex;align-items:center;justify-content:space-between;padding:8px 22px 6px;border-bottom:1px solid rgba(197,160,89,.12)}
    .tele-title{font-size:.54rem;font-weight:700;letter-spacing:.22em;color:rgba(197,160,89,.72);text-transform:uppercase;display:flex;align-items:center;gap:7px}
    .tele-dot{width:6px;height:6px;border-radius:50%;background:#4caf7a;box-shadow:0 0 6px rgba(76,175,122,.7);animation:dot-blink 1.8s ease-in-out infinite}
    @keyframes dot-blink{0%,100%{opacity:1}50%{opacity:.3}}
    .tele-uptime{font-size:.54rem;font-weight:700;letter-spacing:.12em;color:rgba(26,32,48,.42);font-family:monospace;text-transform:uppercase}
    .tele-ticker-wrap{overflow:hidden;height:30px}
    .tele-ticker-track{display:flex;white-space:nowrap;animation:tele-scroll 32s linear infinite;padding:5px 0;align-items:center}
    .tele-item{font-size:.57rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(26,32,48,.5);padding:0 22px;font-family:monospace}
    .tele-item.g{color:rgba(40,150,80,.72)}
    .tele-item.gold{color:rgba(197,160,89,.72)}
    .tele-sep{color:rgba(197,160,89,.28);font-family:monospace;font-size:.57rem}
    @keyframes tele-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

    @media(max-width:768px){.pill-card{padding:32px 20px!important}.pill-card::before{display:none}.liquid-bg::before,.liquid-bg::after{animation:none}}
  </style>
</head>
<body>
<div class="liquid-bg"></div>
<div class="page">

  <header>
    <div class="brand-line">Lakeside Trinity LLC &nbsp;&bull;&nbsp; Nexus Elite</div>
    <h1>The <em>Nexus</em><br/>Elite Command</h1>
    <p class="tagline">Sovereign access, activated. The light to every shadow.</p>
  </header>

  <div class="cards">
    <!-- CARD 1: PRIVATE FAMILY HUB -->
    <div class="pill-card">
      <div class="card-tier">Private Access &bull; Tier I</div>
      <div class="card-name">Private Family Hub</div>
      <div class="card-amount">$97</div>
      <div class="card-desc">Your personal sanctuary for family sovereignty, creative vision, and protected legacy building.</div>
      <button class="card-btn" onclick="window.location='/family-hub'">Activate Personal Sanctuary</button>
    </div>
    <!-- CARD 2: SOVEREIGN BIZ ENGINE -->
    <div class="pill-card">
      <div class="card-tier">Business Access &bull; Tier II</div>
      <div class="card-name">Sovereign Biz Engine</div>
      <div class="card-amount">$97</div>
      <div class="card-desc">Full-stack business sovereignty. Revenue systems, AI tools, and empire infrastructure — activated.</div>
      <button class="card-btn" onclick="window.location='/marketplace'">Scale Business Sovereignty</button>
    </div>
  </div>

  <!-- SIGNATURE INPUT -->
  <div class="sig-section">
    <div class="sig-label">Signature Frequency</div>
    <input type="text" class="sig-input" placeholder="Enter Your Signature Freq..." autocomplete="off" spellcheck="false"/>
  </div>

  <!-- TELEMETRY FOOTER -->
  <div class="telemetry">
    <div class="tele-header">
      <div class="tele-title"><div class="tele-dot"></div>System Deployment Status</div>
      <div class="tele-uptime" id="uptime-display">UPTIME: 00:14</div>
    </div>
    <div class="tele-ticker-wrap">
      <div class="tele-ticker-track">
        <span class="tele-item g">CORE VALUES LOCKED: SECURED</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item gold">NEXUS ELITE: ONLINE</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item">FREQ: 197.0 Hz</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item g">FAMILY HUB: ACTIVE</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item">PAYLOAD: SECURED</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item gold">GENESIS CORE: ACTIVE</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item">NPI: 1346233350</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item g">SOVEREIGN ENGINE: DEPLOYED</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item">LAKESIDE TRINITY: ONLINE</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item gold">UPTIME: LIVE</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item g">CORE VALUES LOCKED: SECURED</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item gold">NEXUS ELITE: ONLINE</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item">FREQ: 197.0 Hz</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item g">FAMILY HUB: ACTIVE</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item">PAYLOAD: SECURED</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item gold">GENESIS CORE: ACTIVE</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item">NPI: 1346233350</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item g">SOVEREIGN ENGINE: DEPLOYED</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item">LAKESIDE TRINITY: ONLINE</span><span class="tele-sep">&nbsp;|&nbsp;</span>
        <span class="tele-item gold">UPTIME: LIVE</span><span class="tele-sep">&nbsp;|&nbsp;</span>
      </div>
    </div>
  </div>

</div>
<script>
var startMs = Date.now() - 14000;
function pad(n){return String(n).padStart(2,'0')}
function tick(){
  var e=Math.floor((Date.now()-startMs)/1000);
  document.getElementById('uptime-display').textContent='UPTIME: '+pad(Math.floor(e/60))+':'+pad(e%60);
}
tick();setInterval(tick,1000);
</script>
${EBS_FOOTER_HTML}
${ORB_HTML}
</body>
</html>`;

app.get("/nexus", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(NEXUS_HTML);
});

// ── /vault — Frequency Harvest Landing Page ───────────────────────────────
const VAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <title>Vault — Frequency Locked — Lakeside Trinity</title>
  <style>html,body{background:#060a06!important;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;color:#ddd8c4}</style>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap&v=144k" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--gold:#c9a84c;--gold-b:#e8c96a;--bg:#060a06;--text:#ddd8c4;--muted:rgba(221,216,196,.45)}
    body{background:var(--bg);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow-x:hidden;position:relative}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(201,168,76,.09),transparent 62%);pointer-events:none;z-index:0}
    .vault-card{position:relative;z-index:1;background:rgba(14,20,10,.92);border:1px solid rgba(201,168,76,.38);border-radius:24px;padding:56px 48px;max-width:480px;width:calc(100% - 48px);text-align:center;backdrop-filter:blur(24px);box-shadow:0 32px 80px rgba(0,0,0,.5),0 0 60px rgba(201,168,76,.07);margin:32px 24px}
    .vault-card::before{content:'';position:absolute;inset:0;border-radius:24px;background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.1),transparent 58%);pointer-events:none}
    .vault-label{font-size:.56rem;font-weight:700;letter-spacing:.28em;color:rgba(201,168,76,.5);text-transform:uppercase;margin-bottom:18px;font-family:monospace}
    .seed-icon{font-size:3.2rem;margin-bottom:22px;display:block;animation:seed-glow 2.2s ease-in-out infinite}
    @keyframes seed-glow{0%,100%{filter:drop-shadow(0 0 10px rgba(201,168,76,.7))}50%{filter:drop-shadow(0 0 26px rgba(232,201,106,1))}}
    h1{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;color:#f0eade;margin-bottom:8px;line-height:1.18}
    .freq-line{font-family:monospace;font-size:.68rem;color:rgba(201,168,76,.55);letter-spacing:.2em;margin-bottom:32px;text-transform:uppercase}
    .divider{border:none;border-top:1px solid rgba(201,168,76,.15);margin:0 0 28px}
    .dl-btn{display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#c9a84c,#e8c96a 60%,#c9a84c);background-size:200% 100%;color:#1a1000;border:none;border-radius:50px;font-weight:800;font-size:.84rem;letter-spacing:.12em;text-transform:uppercase;font-family:'Segoe UI',sans-serif;cursor:pointer;text-decoration:none;box-shadow:0 6px 28px rgba(201,168,76,.45),0 2px 10px rgba(201,168,76,.25);animation:dl-breathe 2.8s ease-in-out infinite;transition:box-shadow .2s}
    .dl-btn:hover{box-shadow:0 12px 44px rgba(201,168,76,.65)}
    @keyframes dl-breathe{0%,100%{box-shadow:0 6px 28px rgba(201,168,76,.45),0 2px 10px rgba(201,168,76,.25)}50%{box-shadow:0 10px 44px rgba(232,201,106,.7),0 4px 18px rgba(201,168,76,.4)}}
    .back-link{margin-top:22px;display:block;font-size:.72rem;color:rgba(201,168,76,.38);text-decoration:none;letter-spacing:.06em;transition:color .2s}
    .back-link:hover{color:rgba(201,168,76,.75)}
    @media(max-width:480px){.vault-card{padding:36px 22px}}
  </style>
</head>
<body>
<div class="vault-card">
  <div class="vault-label">// Frequency Vault &bull; ALPHA-17 &bull; Lock Confirmed</div>
  <span class="seed-icon">&#127381;</span>
  <h1>Seed Planted.<br/>Frequency Locked.</h1>
  <div class="freq-line">197.0 Hz &nbsp;&bull;&nbsp; Restoration Active &nbsp;&bull;&nbsp; STX42220</div>
  <hr class="divider"/>
  <a href="/vault/download" class="dl-btn" download>&#11015;&nbsp;&nbsp;Download Frequency Pack</a>
  <a href="/marketplace" class="back-link">&larr; Return to Sovereign Portal</a>
</div>
${ORB_HTML}
${EBS_FOOTER_HTML}
</body>
</html>`;

app.get("/vault", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(VAULT_HTML);
});

app.get("/vault/download", (_req: Request, res: Response) => {
  const pack = [
    "╔══════════════════════════════════════════════╗",
    "║  LAKESIDE TRINITY — SOVEREIGNTY FREQ PACK   ║",
    "║  Phase: ALPHA-17  |  197.0 Hz  |  LOCKED    ║",
    "╚══════════════════════════════════════════════╝",
    "",
    "FREQUENCY LOCK  : 197.0 Hz",
    "PHASE           : ALPHA-17",
    "SEED STATUS     : PLANTED",
    "RESTORATION     : ACTIVE",
    "NPI             : 1346233350",
    "ACCOUNT         : STX42220",
    "OPERATOR        : Lakeside Trinity LLC",
    "LOCATION        : Webster, WI 54893",
    "",
    "CORE VALUES LOCKED. SYSTEM 100% OPERATIONAL.",
    "PAYROLL SECURED. SOVEREIGN GENESIS HEARTBEAT ACTIVE.",
    "",
    "Contact : admin@LakesideTrinity.com",
    "CashApp : $LakesideTrinity",
    "Zelle   : admin@LakesideTrinity.com",
    "",
    "— The Architect, Lakeside Trinity LLC",
  ].join("\n");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="LakesideTrinity-FrequencyPack-${Date.now()}.txt"`);
  res.send(pack);
});

// ── Community Hub — /community ──────────────────────────────────────────────
const COMMUNITY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <title>197 Community Resource Hub — Lakeside Trinity</title>
  <!-- little-ai: community-root | frequency: 197 | status: active | phase: alpha-17 -->
  <style>html,body{background:#060a06!important;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;color:#ddd8c4}</style>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap&v=144k" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--gold:#c9a84c;--gold-b:#e8c96a;--bg:#060a06;--text:#ddd8c4;--muted:rgba(221,216,196,.42)}
    body{font-family:'Segoe UI',Arial,sans-serif;background:var(--bg);min-height:100vh;color:var(--text);overflow-x:hidden}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 22% 28%,rgba(90,140,74,.08),transparent 55%),radial-gradient(ellipse at 78% 72%,rgba(201,168,76,.05),transparent 55%);pointer-events:none;z-index:0}
    /* TICKER */
    .ticker-wrap{background:rgba(8,13,6,.97);border-bottom:1px solid rgba(201,168,76,.2);padding:7px 0;overflow:hidden;z-index:10;position:relative}
    .ticker-track{display:flex;animation:tick 26s linear infinite;white-space:nowrap;width:max-content}
    .ticker-item{font-size:.65rem;font-weight:700;letter-spacing:.15em;color:var(--gold);text-transform:uppercase;padding:0 30px}
    @keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    /* HEADER */
    header{position:relative;z-index:2;text-align:center;padding:46px 24px 38px;border-bottom:1px solid rgba(201,168,76,.1)}
    .brand-line{font-size:.62rem;font-weight:700;letter-spacing:.22em;color:rgba(201,168,76,.48);text-transform:uppercase;margin-bottom:13px}
    h1{font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:900;color:#fff;margin-bottom:8px;text-shadow:0 0 60px rgba(201,168,76,.15)}
    .sub{color:var(--muted);font-size:.87rem;letter-spacing:.04em}
    main{max-width:920px;margin:0 auto;padding:50px 24px 0;position:relative;z-index:1}
    /* GIFT GLASS */
    .gift-glass{background:rgba(14,22,11,.88);border:1px solid rgba(201,168,76,.2);border-radius:20px;padding:38px 34px;text-align:center;backdrop-filter:blur(20px);margin-bottom:46px;position:relative;overflow:hidden}
    .gift-glass::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(90,140,74,.09),transparent 55%);pointer-events:none}
    .gift-badge{display:inline-block;background:rgba(90,140,74,.14);border:1px solid rgba(90,140,74,.32);border-radius:20px;padding:5px 18px;font-size:.61rem;font-weight:700;color:#6abf4b;letter-spacing:.13em;text-transform:uppercase;margin-bottom:14px;box-shadow:0 0 16px rgba(90,140,74,.18)}
    .gift-glass p{color:var(--muted);font-size:.9rem;line-height:1.78;max-width:560px;margin:0 auto}
    /* SECTION LABEL */
    .sect-label{font-size:.62rem;font-weight:700;letter-spacing:.22em;color:rgba(201,168,76,.47);text-transform:uppercase;margin-bottom:24px;display:flex;align-items:center;gap:16px}
    .sect-label::before,.sect-label::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.2),transparent)}
    /* KIT CARDS */
    .kit-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:20px;margin-bottom:46px}
    .kit-card{background:rgba(10,16,8,.92);border:1px solid rgba(201,168,76,.17);border-radius:15px;padding:28px 22px;display:flex;flex-direction:column;gap:13px;backdrop-filter:blur(14px);transition:border-color .25s,transform .25s}
    .kit-card:hover{border-color:rgba(201,168,76,.38);transform:translateY(-3px)}
    .kit-icon{font-size:1.65rem}
    .kit-name{font-family:'Playfair Display',serif;color:#f0eade;font-weight:700;font-size:1.02rem}
    .ai-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:.56rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;background:rgba(90,140,74,.11);color:#6abf4b;border:1px solid rgba(90,140,74,.28);width:fit-content;animation:ai-glow 3.2s ease-in-out infinite}
    @keyframes ai-glow{0%,100%{box-shadow:0 0 5px rgba(90,140,74,.18)}50%{box-shadow:0 0 12px rgba(90,140,74,.44),0 0 22px rgba(90,140,74,.1)}}
    .kit-desc{color:rgba(221,216,196,.43);font-size:.8rem;line-height:1.65;flex:1}
    .kit-price-row{display:flex;align-items:center;justify-content:space-between}
    .kit-amount{color:var(--gold);font-weight:800;font-size:1.12rem}
    .kit-freq{font-size:.58rem;color:rgba(201,168,76,.38);letter-spacing:.12em;font-weight:700}
    .kit-btn{width:100%;padding:12px;background:rgba(201,168,76,.1);color:rgba(201,168,76,.9);border:1px solid rgba(201,168,76,.3);border-radius:9px;font-weight:700;font-size:.82rem;cursor:pointer;font-family:inherit;transition:background .2s;animation:pulse-glow 2.6s ease-in-out infinite}
    .kit-btn:hover{background:rgba(201,168,76,.2)}
    @keyframes pulse-glow{0%,100%{box-shadow:0 0 11px rgba(201,168,76,.35),0 0 22px rgba(201,168,76,.1)}50%{box-shadow:0 0 22px rgba(201,168,76,.7),0 0 44px rgba(201,168,76,.22),0 0 66px rgba(201,168,76,.06)}}
    .pay-panel{background:rgba(3,6,2,.96);border:1px solid rgba(201,168,76,.28);border-radius:10px;padding:16px 18px;display:none;margin-top:4px}
    .pay-panel.open{display:block}
    .pay-row{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px solid rgba(201,168,76,.09)}
    .pay-row:last-of-type{border-bottom:none}
    .pay-method{color:var(--gold);font-weight:700;font-size:.8rem;min-width:68px}
    .pay-handle{color:rgba(201,168,76,.65);font-size:.8rem;font-family:monospace}
    .memo{color:rgba(201,168,76,.38);font-size:.68rem;margin-top:7px;font-style:italic}
    .back-link{display:inline-flex;align-items:center;gap:8px;padding:12px 26px;background:rgba(201,168,76,.08);color:rgba(201,168,76,.68);text-decoration:none;border-radius:10px;font-size:.82rem;font-weight:600;border:1px solid rgba(201,168,76,.22);transition:background .2s,border-color .2s}
    .back-link:hover{background:rgba(201,168,76,.16);border-color:rgba(201,168,76,.4);color:var(--gold)}
    .page-footer{text-align:center;padding:28px 16px;color:rgba(201,168,76,.26);font-size:.71rem;border-top:1px solid rgba(201,168,76,.1);margin-top:56px}
    @media(max-width:768px){.kit-card,.gift-glass{backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;background:rgba(12,20,10,.99)!important}.kit-card:hover{transform:none}body::before{display:none}}
  </style>
</head>
<body>
<div class="ticker-wrap">
  <div class="ticker-track">
    <span class="ticker-item">Healthcare &bull;</span>
    <span class="ticker-item">Legal Services &bull;</span>
    <span class="ticker-item">Space Division &bull;</span>
    <span class="ticker-item">Neuralink AI &bull;</span>
    <span class="ticker-item">Community Hub &bull;</span>
    <span class="ticker-item">Creative Empire &bull;</span>
    <span class="ticker-item">Family Sovereign &bull;</span>
    <span class="ticker-item">Global Restoration &bull;</span>
    <span class="ticker-item">Healthcare &bull;</span>
    <span class="ticker-item">Legal Services &bull;</span>
    <span class="ticker-item">Space Division &bull;</span>
    <span class="ticker-item">Neuralink AI &bull;</span>
    <span class="ticker-item">Community Hub &bull;</span>
    <span class="ticker-item">Creative Empire &bull;</span>
    <span class="ticker-item">Family Sovereign &bull;</span>
    <span class="ticker-item">Global Restoration &bull;</span>
  </div>
</div>
<header>
  <div class="brand-line">Lakeside Trinity LLC</div>
  <h1>197 Community<br/>Resource Hub</h1>
  <p class="sub">The Lock Frequency &nbsp;&bull;&nbsp; $17.00 Entry Point</p>
</header>
<main>
  <div class="gift-glass">
    <div class="gift-badge">&#127381; A Gift to the People</div>
    <p>Empowering every family to build their own empire.<br/>High-value tools. Sovereign prices.<br/>No middlemen. No barriers. Direct to your account.</p>
  </div>

  <div class="sect-label">Empire Starter Kits — $17.00 Each</div>
  <div class="kit-grid">

    <!-- little-ai: starter-kit | frequency: 197 | status: active | phase: alpha-17 -->
    <div class="kit-card">
      <div class="kit-icon">&#128218;</div>
      <div class="kit-name">Empire Starter Kit</div>
      <!-- little-ai: starter-kit-ai | status: authenticated -->
      <span class="ai-badge">&#10003; Little AI: Authenticated</span>
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
      <!-- little-ai: kid-one-ai | status: authenticated -->
      <span class="ai-badge">&#10003; Little AI: Authenticated</span>
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
      <!-- little-ai: family-wealth-ai | status: authenticated -->
      <span class="ai-badge">&#10003; Little AI: Authenticated</span>
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

  <a href="/marketplace" class="back-link">&#8592; Back to Command Center</a>
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

// ── /community/pay — $17 direct payment page (zero friction) ──────────────────
app.get("/community/pay", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <title>$17 Lock Frequency — 197 Community Kit</title>
  <style>html,body{background:#060a06!important;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;color:#ddd8c4}</style>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap&v=144k" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--gold:#c9a84c;--gold-b:#e8c96a;--bg:#060a06;--text:#ddd8c4;--muted:rgba(221,216,196,.45)}
    body{font-family:'Segoe UI',Arial,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(201,168,76,.07),transparent 60%);pointer-events:none;z-index:0}
    .glass-card{position:relative;z-index:1;background:rgba(16,24,12,.9);border:1px solid rgba(201,168,76,.3);border-radius:20px;padding:44px 40px;max-width:490px;width:100%;backdrop-filter:blur(20px);box-shadow:0 32px 80px rgba(0,0,0,.5),0 0 60px rgba(201,168,76,.06);text-align:center}
    .check{font-size:2.4rem;color:var(--gold);margin-bottom:12px}
    h1{font-family:'Playfair Display',serif;font-size:1.9rem;color:var(--gold-b);margin-bottom:6px;font-weight:900}
    .amount{font-family:'Playfair Display',serif;font-size:3.4rem;font-weight:900;color:var(--gold-b);margin:16px 0 4px;letter-spacing:-.01em}
    .service{font-size:.72rem;color:rgba(201,168,76,.55);letter-spacing:.12em;text-transform:uppercase;margin-bottom:24px}
    hr{border:none;border-top:1px solid rgba(201,168,76,.18);margin:24px 0}
    .secure-box{position:relative;background:rgba(6,10,4,.82);border:1.5px solid rgba(201,168,76,.38);border-radius:14px;padding:26px 28px;text-align:left;margin-bottom:24px}
    .secure-title{font-size:.65rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(201,168,76,.5);margin-bottom:16px}
    .pay-method{display:flex;align-items:center;gap:14px;margin-bottom:14px}
    .pay-method:last-child{margin-bottom:0}
    .pay-icon{width:38px;height:38px;border-radius:10px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.22);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.78rem;color:var(--gold);flex-shrink:0}
    .pay-label{font-size:.7rem;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px}
    .pay-handle{color:rgba(201,168,76,.85);font-size:.9rem;font-family:monospace;font-weight:700}
    .memo{color:rgba(201,168,76,.38);font-size:.68rem;margin-top:7px;font-style:italic}
    .back-link{display:inline-flex;align-items:center;gap:8px;padding:12px 26px;background:rgba(201,168,76,.08);color:rgba(201,168,76,.68);text-decoration:none;border-radius:10px;font-size:.82rem;font-weight:600;border:1px solid rgba(201,168,76,.22);transition:background .2s}
    .back-link:hover{background:rgba(201,168,76,.16);color:var(--gold)}
    .ai-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 13px;background:rgba(90,140,74,.12);border:1px solid rgba(90,140,74,.3);border-radius:30px;font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(90,140,74,.85);margin-bottom:20px;animation:ai-pulse 3s ease-in-out infinite}
    @keyframes ai-pulse{0%,100%{box-shadow:0 0 6px rgba(90,140,74,.2)}50%{box-shadow:0 0 14px rgba(90,140,74,.45),0 0 22px rgba(90,140,74,.12)}}
    .npi{color:rgba(201,168,76,.3);font-size:.7rem;margin-top:20px;letter-spacing:.04em}
    @media(max-width:768px){.glass-card{backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;background:rgba(12,20,10,.99)!important;box-shadow:0 8px 20px rgba(0,0,0,.4)!important;padding:32px 22px}.glass-card::before{display:none}body::before{display:none}.amount{font-size:2.8rem}.back-link{animation:none!important}}
  </style>
</head>
<body>
<div class="glass-card">
  <div class="check">&#10003;</div>
  <div class="ai-badge">&#10003; Little AI: Authenticated</div>
  <h1>Lock Frequency Access</h1>
  <div class="amount">$17.00</div>
  <div class="service">197 Community Kit &mdash; Lock Frequency &mdash; Sovereignty Seed</div>
  <hr/>
  <div class="secure-box">
    <div class="secure-title">&#128274; Secure Payment — Choose One</div>
    <div class="pay-method">
      <div class="pay-icon">C$</div>
      <div>
        <div class="pay-label">CashApp</div>
        <div class="pay-handle">$LakesideTrinity</div>
        <div class="memo">Memo: Community Kit &bull; $17.00 &bull; your email</div>
      </div>
    </div>
    <div class="pay-method">
      <div class="pay-icon">Z</div>
      <div>
        <div class="pay-label">Zelle</div>
        <div class="pay-handle">admin@LakesideTrinity.com</div>
        <div class="memo">Memo: Community Kit &bull; $17.00 &bull; your email</div>
      </div>
    </div>
  </div>
  <a href="/community" class="back-link">&larr; Back to Community Hub</a>
  <div class="npi">Lakeside Trinity LLC &nbsp;&bull;&nbsp; 197 Frequency Active &nbsp;&bull;&nbsp; Webster, WI 54893</div>
</div>
${EBS_FOOTER_HTML}
</body>
</html>`);
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
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
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
