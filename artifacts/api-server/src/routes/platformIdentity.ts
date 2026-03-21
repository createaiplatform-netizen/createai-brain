/**
 * platformIdentity.ts — Public API for the NEXUS Platform Address (NPA) system.
 *
 * Mounted at /api by app.ts, so these paths become:
 *   GET  /api/platform-identity          — full resolved identity (JSON)
 *   GET  /api/platform-identity/refresh  — force re-resolve (admin only)
 *
 * The /.well-known/ endpoints are registered directly in app.ts (not here)
 * because they must live at the root, not under /api.
 */

import { Router, type Request, type Response } from "express";
import { resolveNexusIdentity, refreshNexusIdentity } from "../config/nexusIdentityResolver.js";
import { verifyAdminCookie } from "../middlewares/adminAuth.js";

const router = Router();

router.get("/platform-identity", (_req: Request, res: Response) => {
  const id = resolveNexusIdentity();
  res.json({
    npa:          id.npa,
    handle:       id.handle,
    platformName: id.platformName,
    legalEntity:  id.legalEntity,
    ownerName:    id.ownerName,
    liveUrl:      id.liveUrl,
    liveDomain:   id.liveDomain,
    domainSource: id.domainSource,
    contactEmail: id.contactEmail,
    fromEmail:    id.fromEmail,
    cashApp:      id.cashApp,
    venmo:        id.venmo,
    resolvedAt:   id.resolvedAt,
  });
});

router.post("/platform-identity/refresh", verifyAdminCookie, (_req: Request, res: Response) => {
  const id = refreshNexusIdentity();
  res.json({ ok: true, resolved: id.liveUrl, domainSource: id.domainSource, resolvedAt: id.resolvedAt });
});

export default router;
