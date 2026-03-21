/**
 * selfHost.ts — Internal Hosting API
 *
 * Mounted at /api by app.ts — paths become /api/self-host/...
 *
 *   GET  /api/self-host/status          — full hosting status
 *   GET  /api/self-host/url-map         — full createai:// URL map
 *   GET  /api/self-host/zones           — all createai:// zones
 *   GET  /api/self-host/resolve?npa=... — resolve a createai:// address
 *   POST /api/self-host/build           — trigger frontend build (admin)
 *   POST /api/self-host/serve           — mount built frontend (admin)
 *   POST /api/self-host/publish         — snapshot current build (admin)
 *   GET  /api/self-host/proof           — current platform proof token
 *   POST /api/self-host/verify          — verify a submitted proof token
 */

import { Router, type Request, type Response } from "express";
import { verifyAdminCookie }    from "../middlewares/adminAuth.js";
import { getStatus, buildFrontend, mountFrontend, publishSnapshot } from "../engines/selfHostEngine.js";
import { resolveNPA, getFullUrlMap, getAllZones }  from "../utils/internalRouter.js";
import { generatePlatformProof, verifyProofSignature, getStripeVerificationClaim } from "../engines/verificationEngine.js";
import { resolveNexusIdentity } from "../config/nexusIdentityResolver.js";

// Lazily import Express app reference — done via module-level singleton
import type { Express } from "express";
let _app: Express | null = null;
export function registerApp(app: Express) { _app = app; }

const router = Router();

router.get("/self-host/status", (_req: Request, res: Response) => {
  res.json(getStatus());
});

router.get("/self-host/url-map", (_req: Request, res: Response) => {
  res.json({
    schema:      "createai://",
    description: "NEXUS internal URL addressing — maps createai:// handles to runtime routes",
    routes:      getFullUrlMap(),
    zones:       getAllZones(),
    totalRoutes: getFullUrlMap().length,
  });
});

router.get("/self-host/zones", (_req: Request, res: Response) => {
  res.json(getAllZones());
});

router.get("/self-host/resolve", (req: Request, res: Response) => {
  const npa = String(req.query["npa"] ?? "");
  if (!npa) { res.status(400).json({ error: "?npa= required" }); return; }
  const id   = resolveNexusIdentity();
  const result = resolveNPA(npa, id.liveUrl);
  res.json(result);
});

router.get("/self-host/proof", (_req: Request, res: Response) => {
  res.json(generatePlatformProof());
});

router.get("/self-host/stripe-claim", (_req: Request, res: Response) => {
  res.json(getStripeVerificationClaim());
});

router.post("/self-host/verify", (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const result = verifyProofSignature(body);
  res.json(result);
});

router.post("/self-host/build", verifyAdminCookie, (_req: Request, res: Response) => {
  res.json({ ok: true, message: "Build triggered in background", note: "Check /api/self-host/status for progress." });
  setImmediate(() => {
    buildFrontend();
  });
});

router.post("/self-host/serve", verifyAdminCookie, (_req: Request, res: Response) => {
  if (!_app) { res.status(500).json({ error: "App reference not registered" }); return; }
  mountFrontend(_app);
  res.json({ ok: true, message: "Frontend mounted — API server now serves full app" });
});

router.post("/self-host/publish", verifyAdminCookie, (_req: Request, res: Response) => {
  const snap = publishSnapshot();
  if (!snap.ok) { res.status(400).json({ ok: false, error: "No dist/ found. Run build first." }); return; }
  res.json({ ok: true, version: snap.version, path: snap.path, message: "Snapshot saved at " + snap.path });
});

export default router;
