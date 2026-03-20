/**
 * ultraInteraction.ts — Ultra Global Zero-Limit Interaction Engine
 * Spec: ULTRA-GLOBAL-ZERO-LIMIT-PLATFORM-ENGINE
 *
 * POST /api/ultra/interaction
 *   Body: { type: string; userId?: string; target?: string }
 *   Applies micro-revenue, throttled meta cycle, max-growth enforcement,
 *   and returns full platform stats + projections.
 *
 * Security:
 *   - authMiddleware enforces authentication globally (app.ts)
 *   - interactionLimiter bounds per-user call rate (60/min)
 *   - All input fields are validated and sanitized before use
 *   - Errors never expose internal messages to the client
 *
 * Throttling: meta cycle and transcend fire at most once per 60 s
 * regardless of how many interactions arrive, so heavy traffic never
 * floods the engine but every call still registers revenue.
 */

import { Router, type Request, type Response }      from "express";
import { applyGrowthMultiplier, getWealthSnapshot } from "../services/wealthMultiplier.js";
import { enforceMaxGrowth, getMaximizerStats }      from "../services/wealthMaximizer.js";
import { triggerMetaCycle, getMetaStats, getMetaProjections } from "../services/metaTranscend.js";
import { getMarketStats, globalTranscend }           from "../services/realMarket.js";
import { getHybridStats }                            from "../services/hybridEngine.js";
import { getAuditSnapshot }                          from "../services/platformAudit.js";
import { UltraInteractionEngine }                    from "../services/ultraInteractionEngine.js";
import { interactionLimiter }                        from "../middlewares/rateLimiters.js";

const router = Router();

// ─── Throttle state ───────────────────────────────────────────────────────────
let _lastMetaCycleTs = 0;
let _lastTranscendTs = 0;
const THROTTLE_MS = 60_000; // 1 min

// ─── Input sanitization helpers ───────────────────────────────────────────────

const MAX_TYPE_LEN   = 64;
const MAX_USERID_LEN = 64;
const MAX_TARGET_LEN = 128;

/**
 * Strip control characters and limit length.
 * Prevents log injection and excessively large field values.
 */
function sanitizeField(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\x00-\x1F\x7F]/g, "")   // remove control chars
    .slice(0, maxLen)
    .trim();
}

/**
 * Validate that a userId is safe to propagate:
 * alphanumeric, hyphens, underscores, dots — no injection vectors.
 */
function isValidUserId(uid: string): boolean {
  return uid === "" || /^[\w\-\.]+$/.test(uid);
}

// ─── POST /api/ultra/interaction ─────────────────────────────────────────────
router.post("/interaction", interactionLimiter, async (req: Request, res: Response): Promise<void> => {
  // ── Input validation + sanitization ────────────────────────────────────────
  const rawType   = sanitizeField((req.body as Record<string, unknown>)?.type,   MAX_TYPE_LEN)   || "unknown";
  const rawUserId = sanitizeField((req.body as Record<string, unknown>)?.userId, MAX_USERID_LEN);
  const rawTarget = sanitizeField((req.body as Record<string, unknown>)?.target, MAX_TARGET_LEN);

  if (!isValidUserId(rawUserId)) {
    res.status(400).json({ error: "Invalid userId format" });
    return;
  }

  const type   = rawType;
  const userId = rawUserId || undefined;
  const target = rawTarget || undefined;

  try {
    // 1. Micro-revenue: $5–$15 per interaction, applied as growth multiplier
    const microRevenue = Math.max(5, Math.random() * 15);
    applyGrowthMultiplier(microRevenue);

    // Fire micro-revenue event → triggers instant payout to Huntington
    UltraInteractionEngine.fireMicroRevenue({
      amount:  microRevenue,
      type,
      userId,
      ts:      new Date().toISOString(),
    });

    // 2. Energy credit (logged server-side, returned to client)
    const energyKwh = Math.random() * 0.2;

    const now = Date.now();

    // 3. Meta cycle — throttled to once per minute
    if (now - _lastMetaCycleTs >= THROTTLE_MS) {
      _lastMetaCycleTs = now;
      triggerMetaCycle().catch(() => {}); // fire-and-forget
    }

    // 4. Enforce 100%+ growth
    await enforceMaxGrowth();

    // 5. Global transcend — throttled to once per minute
    if (now - _lastTranscendTs >= THROTTLE_MS) {
      _lastTranscendTs = now;
      globalTranscend({
        batchSize: 1,
        event: { type, userId, target } as Record<string, unknown>,
      }).catch(() => {});
    }

    // 6. Collect full stats + projections
    const [market, hybrid, wealth, audit, meta, maximizer, projections] = await Promise.allSettled([
      getMarketStats(),
      getHybridStats(),
      getWealthSnapshot(),
      getAuditSnapshot(),
      getMetaStats(),
      getMaximizerStats(),
      getMetaProjections(),
    ]);

    const stats = {
      interactionType: type,
      userId:          userId ?? null,
      target:          target ?? null,
      microRevenue:    `$${microRevenue.toFixed(2)}`,
      energyCredit:    energyKwh.toFixed(4),
      market:          market.status    === "fulfilled" ? market.value    : null,
      hybrid:          hybrid.status    === "fulfilled" ? hybrid.value    : null,
      wealth:          wealth.status    === "fulfilled" ? wealth.value    : null,
      audit:           audit.status     === "fulfilled" ? audit.value     : null,
      meta:            meta.status      === "fulfilled" ? meta.value      : null,
      maximizer:       maximizer.status === "fulfilled" ? maximizer.value : null,
      projections:     projections.status === "fulfilled" ? projections.value : null,
    };

    console.log(
      `[UltraInteraction] ⚡ ${type} · +${microRevenue.toFixed(2)} revenue · ${energyKwh.toFixed(4)} kWh`
    );

    res.json(stats);
  } catch (err) {
    // Log internally — never expose internal error details to the client
    console.error("[ultra/interaction] error:", (err as Error).message);
    res.status(500).json({ error: "Interaction processing failed." });
  }
});

export default router;
