/**
 * middlewares/publicLimiters.ts — Per-Route Rate Limiters for Public Endpoints
 * ──────────────────────────────────────────────────────────────────────────────
 * WHAT: Tighter rate limiters applied to specific public-facing POST and
 *       DB-read GET routes, layered on top of the global 300 req/min limit
 *       already in app.ts.
 *
 * WHY SAFE: Each limiter is additive — it never replaces the global limiter.
 *           All limits are conservative. No existing authenticated routes are
 *           affected. No behavior changes for legitimate traffic.
 *
 * SCALE PATH:
 *   - Today:   in-process memory store (default for express-rate-limit).
 *   - Phase 2: swap `store` to a RedisStore with one import change per limiter.
 *              Call sites in route files do not change at all.
 *   - Phase 3: move to an edge rate limiter (Cloudflare, Fastly) and remove
 *              these entirely — again, no route file changes needed.
 *
 * FAMILY SAFETY NOTE: These limiters protect public endpoints only. Family
 *   Universe endpoints are behind authMiddleware and are not covered here.
 *   If public family registration routes are added, add a FAMILY_* limiter
 *   here and apply it explicitly.
 */

import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";
import type { Request } from "express";
import { RATE_LIMITS, logRejection, safeIpHash } from "../config/platformConfig.js";

// Key by IP for all public (unauthenticated) routes.
// ipKeyGenerator handles IPv6 normalisation correctly.
const ipKey: Options["keyGenerator"] = (req: Request) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipKeyGenerator(req as unknown as any);

function onLimitReached(route: string) {
  return (req: Request): void => {
    logRejection(route, "rate_limited", "Public rate limit exceeded", safeIpHash(req.ip));
  };
}

// ── Public POST limiter ────────────────────────────────────────────────────────
// Applied to: /portal/book, /portal/review, /portal/donor/lookup,
//             /portal/student/lookup, /portal/client/lookup
export const publicPostLimiter = rateLimit({
  windowMs:        RATE_LIMITS.PUBLIC_POST_WINDOW_MS,
  max:             RATE_LIMITS.PUBLIC_POST_MAX,
  keyGenerator:    ipKey,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            (req) => req.method === "OPTIONS",
  message:         { ok: false, error: "Too many submissions. Please wait a moment and try again." },
  handler: (req, res, next, options) => {
    onLimitReached(req.path)(req);
    res.status(options.statusCode).json(options.message);
  },
});

// ── Public lookup limiter ─────────────────────────────────────────────────────
// Applied to: /portal/stats (GET, DB-read)
// Slightly looser than POST — a user retrying after a typo should not be
// immediately blocked, but we still cap automated scraping.
export const publicLookupLimiter = rateLimit({
  windowMs:        RATE_LIMITS.PUBLIC_LOOKUP_WINDOW_MS,
  max:             RATE_LIMITS.PUBLIC_LOOKUP_MAX,
  keyGenerator:    ipKey,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            (req) => req.method === "OPTIONS",
  message:         { ok: false, error: "Too many requests. Please slow down." },
  handler: (req, res, next, options) => {
    onLimitReached(req.path)(req);
    res.status(options.statusCode).json(options.message);
  },
});

// ── Health consultation limiter ───────────────────────────────────────────────
// Applied to: POST /portal/consult — triggers an OpenAI call.
// Very tight: 5/min prevents amplification abuse of an expensive AI endpoint.
export const consultLimiter = rateLimit({
  windowMs:        RATE_LIMITS.CONSULT_WINDOW_MS,
  max:             RATE_LIMITS.CONSULT_MAX,
  keyGenerator:    ipKey,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            (req) => req.method === "OPTIONS",
  message:         { ok: false, error: "Too many consultation requests. Please wait before submitting again." },
  handler: (req, res, next, options) => {
    onLimitReached(req.path)(req);
    res.status(options.statusCode).json(options.message);
  },
});

// ── Admin login limiter ───────────────────────────────────────────────────────
// Applied to: POST /admin/login — brute force protection.
export const adminLoginLimiter = rateLimit({
  windowMs:        RATE_LIMITS.ADMIN_LOGIN_WINDOW_MS,
  max:             RATE_LIMITS.ADMIN_LOGIN_MAX,
  keyGenerator:    ipKey,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            (req) => req.method === "OPTIONS",
  message:         "Too many login attempts. Please wait 15 minutes before trying again.",
  handler: (req, res, next, options) => {
    logRejection("/admin/login", "rate_limited", "Admin login brute force protection triggered", safeIpHash(req.ip));
    res.status(options.statusCode).send(options.message);
  },
});
