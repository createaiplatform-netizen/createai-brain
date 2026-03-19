import rateLimit from "express-rate-limit";

/** Project chat: 60 req/min per authenticated user */
export const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyGenerator: (req) => (req.user as { id?: string } | undefined)?.id ?? req.ip ?? "anon",
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: "Too many chat requests — please slow down." },
  skip: (req) => req.method === "OPTIONS",
});

/** Heavy generation (genome, portfolio, generate-all): 10 req/min per user */
export const heavyLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  keyGenerator: (req) => (req.user as { id?: string } | undefined)?.id ?? req.ip ?? "anon",
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: "Too many generation requests — please wait a moment." },
  skip: (req) => req.method === "OPTIONS",
});

/** Instant edit / rewrite: 30 req/min per user */
export const editLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyGenerator: (req) => (req.user as { id?: string } | undefined)?.id ?? req.ip ?? "anon",
  standardHeaders: true,
  legacyHeaders:  false,
  message: { error: "Too many edit requests — please slow down." },
  skip: (req) => req.method === "OPTIONS",
});
