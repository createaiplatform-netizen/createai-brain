import { Router, type Request, type Response } from "express";
import { growthPath } from "../services/domainEngines.js";

const router = Router();

router.get("/",               (_req, res) => res.json({ ok: true, ...growthPath.stats(), tracks: growthPath.tracks(), enrollments: growthPath.enrollments?.() ?? [] }));
router.get("/stats",          (_req, res) => res.json(growthPath.stats()));
router.get("/tracks",         (_req, res) => res.json({ ok: true, tracks: growthPath.tracks() }));
router.get("/progress/:userId", (req: Request, res: Response) => res.json({ ok: true, ...growthPath.userProgress(String(req.params["userId"] ?? "")) }));

router.post("/enroll", (req: Request, res: Response) => {
  const { userId, trackId } = req.body as { userId: string; trackId: string };
  if (!userId || !trackId) { res.status(400).json({ error: "userId and trackId required" }); return; }
  res.json({ ok: growthPath.enroll(userId, trackId) });
});

router.post("/complete", (req: Request, res: Response) => {
  const { userId, trackId } = req.body as { userId: string; trackId: string };
  res.json({ ok: growthPath.complete(userId ?? "", trackId ?? "") });
});

export default router;
