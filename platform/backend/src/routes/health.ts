import { Router, type Request, type Response } from "express";
import { checkConnection } from "../db";

const router = Router();

// ─── GET /health ──────────────────────────────────────────────────────────────
// Used by Docker healthchecks, load balancers, and uptime monitors.
// Returns the status of the API and its database connection.

router.get("/", async (_req: Request, res: Response) => {
  const dbOk = await checkConnection();

  const status = {
    status: dbOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
    services: {
      api: "ok",
      database: dbOk ? "ok" : "unreachable",
      // Future: ai_layer: checkAIConnection()
      // Future: compliance_engine: checkComplianceEngine()
    },
  };

  res.status(dbOk ? 200 : 503).json(status);
});

export default router;
