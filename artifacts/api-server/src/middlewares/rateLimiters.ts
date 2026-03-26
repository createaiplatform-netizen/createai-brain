import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";
import type { Request } from "express";

// All limiters key by authenticated userId when present, falling back to
// ipKeyGenerator (handles IPv6 normalisation) for unauthenticated requests.
const userOrIpKey: Options["keyGenerator"] = (req: Request) =>
  (req.user as { id?: string } | undefined)?.id ??
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipKeyGenerator(req as unknown as any);

/** Project chat: 60 req/min per authenticated user */
export const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: "Too many chat requests — please slow down." },
  skip: (req) => req.method === "OPTIONS",
});

/** Heavy generation (genome, portfolio, generate-all): 10 req/min per user */
export const heavyLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: "Too many generation requests — please wait a moment." },
  skip: (req) => req.method === "OPTIONS",
});

/** Instant edit / rewrite: 30 req/min per user */
export const editLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: "Too many edit requests — please slow down." },
  skip: (req) => req.method === "OPTIONS",
});

/**
 * Payout stats read: 30 req/min per user.
 * Stats are non-destructive but still sensitive — bounded to prevent scraping.
 */
export const payoutStatsLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: "Too many payout stat requests." },
  skip: (req) => req.method === "OPTIONS",
});

/**
 * Payout trigger: 3 req per 5 min per user.
 * Triggering a real financial transfer is high-stakes — very conservative limit.
 */
export const payoutTriggerLimiter = rateLimit({
  windowMs: 5 * 60_000,
  max: 3,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: "Payout trigger rate limit reached — please wait before retrying." },
  skip: (req) => req.method === "OPTIONS",
});

/**
 * Ultra interaction: 60 req/min per user.
 * Each call runs multiple engine ops — bounded to prevent amplification abuse.
 */
export const interactionLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: "Too many interaction requests — please slow down." },
  skip: (req) => req.method === "OPTIONS",
});

/** Architect EBS Broadcast trigger: 3 fires per 15 min per IP — hard cap */
export const broadcastLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 3,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: "Broadcast rate limit reached — try again in 15 minutes." },
  skip: (req) => req.method === "OPTIONS",
});
