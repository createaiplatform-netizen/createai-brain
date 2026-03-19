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
