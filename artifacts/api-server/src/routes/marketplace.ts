/**
 * routes/marketplace.ts
 * ---------------------
 * REST API for the Dynamic Transcend Marketplace Engine
 *
 * Endpoints (all under /api/marketplace):
 *   GET    /snapshot             — full engine state snapshot
 *   GET    /users                — list users + earnings
 *   GET    /items                — list marketplace items
 *   POST   /click                — clickTranscend(userId)
 *   POST   /complete-module      — completeModule(userId, moduleName)
 *   POST   /items                — createItem(userId, title, price)
 *   POST   /buy                  — buyItem(buyerId, itemId)
 *   POST   /add-user             — add a new user to the engine
 *   POST   /demo                 — run the full demoSession()
 *   POST   /reset                — reset all earnings + items
 */

import { Router, type Request, type Response } from "express";
import { engine, runDemoSession, MODULE_SCORES } from "../marketplace/engine.js";

const router = Router();

// ── GET /snapshot ─────────────────────────────────────────────────────────────
router.get("/snapshot", (_req: Request, res: Response) => {
  res.json({ ok: true, ...engine.snapshot() });
});

// ── GET /users ────────────────────────────────────────────────────────────────
router.get("/users", (_req: Request, res: Response) => {
  const snap = engine.snapshot();
  res.json({ ok: true, users: snap.users, platformEarnings: snap.platformEarnings });
});

// ── GET /items ────────────────────────────────────────────────────────────────
router.get("/items", (_req: Request, res: Response) => {
  const snap = engine.snapshot();
  res.json({ ok: true, items: snap.marketplace, totalItems: snap.marketplace.length });
});

// ── GET /modules ──────────────────────────────────────────────────────────────
// NOTE: scores and overachievement_pct are HARDCODED constants, not live data.
// Use POST /api/modules/:name for real live API measurements.
router.get("/modules", (_req: Request, res: Response) => {
  const mods = Object.entries(MODULE_SCORES).map(([name, v]) => ({
    name,
    score:               v.score,
    overachievement_pct: v.overachievement_pct,
    baseEarnings:        parseFloat(((v.score * v.overachievement_pct) / 100).toFixed(2)),
    _dataType:           "simulated",
    _note:               "Hardcoded reference values — not computed from live API data. POST /api/modules/:name for live measurements.",
  }));
  res.json({
    ok: true,
    modules: mods,
    _dataType: "simulated",
    _note: "Module scores and revenue figures are hardcoded reference constants. They do not represent real transactions or live measurements.",
  });
});

// ── POST /click ───────────────────────────────────────────────────────────────
router.post("/click", (req: Request, res: Response) => {
  const { userId } = req.body as { userId?: number };
  if (!userId) return res.status(400).json({ ok: false, error: "userId required" });
  const event = engine.clickTranscend(Number(userId));
  if (!event) return res.status(404).json({ ok: false, error: "User not found" });
  res.json({ ok: true, event, snapshot: engine.snapshot() });
});

// ── POST /complete-module ─────────────────────────────────────────────────────
router.post("/complete-module", (req: Request, res: Response) => {
  const { userId, moduleName } = req.body as { userId?: number; moduleName?: string };
  if (!userId || !moduleName) return res.status(400).json({ ok: false, error: "userId and moduleName required" });
  if (!MODULE_SCORES[moduleName]) {
    return res.status(400).json({ ok: false, error: `Unknown module "${moduleName}"`, validModules: Object.keys(MODULE_SCORES) });
  }
  const event = engine.completeModule(Number(userId), moduleName);
  if (!event) return res.status(404).json({ ok: false, error: "User not found" });
  res.json({ ok: true, event, snapshot: engine.snapshot() });
});

// ── POST /items ───────────────────────────────────────────────────────────────
router.post("/items", (req: Request, res: Response) => {
  const { userId, title, price } = req.body as { userId?: number; title?: string; price?: number };
  if (!userId || !title || price === undefined) {
    return res.status(400).json({ ok: false, error: "userId, title, and price required" });
  }
  const item = engine.createItem(Number(userId), title, Number(price));
  if (!item) return res.status(404).json({ ok: false, error: "User not found" });
  res.json({ ok: true, item, snapshot: engine.snapshot() });
});

// ── POST /buy ─────────────────────────────────────────────────────────────────
router.post("/buy", (req: Request, res: Response) => {
  const { buyerId, itemId } = req.body as { buyerId?: number; itemId?: number };
  if (!buyerId || !itemId) return res.status(400).json({ ok: false, error: "buyerId and itemId required" });
  const event = engine.buyItem(Number(buyerId), Number(itemId));
  if (!event) return res.status(404).json({ ok: false, error: "Item not found" });
  res.json({ ok: true, event, snapshot: engine.snapshot() });
});

// ── POST /add-user ────────────────────────────────────────────────────────────
router.post("/add-user", (req: Request, res: Response) => {
  const { id, name } = req.body as { id?: number; name?: string };
  if (!id || !name) return res.status(400).json({ ok: false, error: "id and name required" });
  engine.addUser({ id: Number(id), name, earnings: 0 });
  res.json({ ok: true, users: engine.snapshot().users });
});

// ── POST /demo ────────────────────────────────────────────────────────────────
// Runs the full spec demoSession() on the shared engine and returns results
router.post("/demo", (_req: Request, res: Response) => {
  const result = runDemoSession(engine);
  res.json({ ok: true, ...result, snapshot: engine.snapshot() });
});

// ── POST /reset ───────────────────────────────────────────────────────────────
router.post("/reset", (_req: Request, res: Response) => {
  engine.reset();
  res.json({ ok: true, message: "Engine state reset — earnings cleared, marketplace emptied", snapshot: engine.snapshot() });
});

export default router;
