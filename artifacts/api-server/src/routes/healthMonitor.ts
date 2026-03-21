import { Router } from "express";
import { getHealthMonitorState } from "../services/healthMonitorEngine.js";

const router = Router();

router.get("/status", (_req, res) => {
  res.json({ ok: true, ...getHealthMonitorState() });
});

export default router;
