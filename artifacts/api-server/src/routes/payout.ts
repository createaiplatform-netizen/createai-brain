/**
 * payout.ts — Huntington ACH Payout Routes
 * Spec: pushFundsToHuntington
 *
 * GET  /api/payout/stats   — current payout cycle stats (founder/admin only)
 * POST /api/payout/trigger — trigger an immediate payout attempt (founder only)
 *
 * Security:
 *   - authMiddleware enforces authentication globally (app.ts)
 *   - requireFounder enforces founder/admin role on every route here
 *   - payoutStatsLimiter / payoutTriggerLimiter enforce per-user rate limits
 *   - errors never expose internal messages to the client
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { getPayoutStats, pushFundsToHuntington }                  from "../services/payoutService.js";
import { payoutStatsLimiter, payoutTriggerLimiter }               from "../middlewares/rateLimiters.js";

const router = Router();

// ─── Owner guard ──────────────────────────────────────────────────────────────
// Payout data and payout triggers are sensitive financial operations.
// Only the platform founder or an admin may access them.

function requireFounder(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const role = (req.user as { role?: string }).role ?? "";
  if (!["founder", "admin"].includes(role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

// ─── GET /api/payout/stats ───────────────────────────────────────────────────
router.get("/stats", payoutStatsLimiter, requireFounder, (_req: Request, res: Response) => {
  res.json(getPayoutStats());
});

// ─── POST /api/payout/trigger ────────────────────────────────────────────────
router.post(
  "/trigger",
  payoutTriggerLimiter,
  requireFounder,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      await pushFundsToHuntington();
      res.json({ triggered: true, stats: getPayoutStats() });
    } catch (err) {
      // Log internally — never expose internal error details to the client
      console.error("[payout] /trigger error:", (err as Error).message);
      res.status(500).json({ error: "Payout attempt failed. Check server logs." });
    }
  }
);

export default router;
