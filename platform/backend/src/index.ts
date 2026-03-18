import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { migrate } from "./db/migrate";
import { loadUser } from "./middleware/auth";

import healthRouter        from "./routes/health";
import authRouter          from "./routes/auth";
import usersRouter         from "./routes/users";
import organizationsRouter from "./routes/organizations";
import projectsRouter      from "./routes/projects";

// Future: import aiRouter         from "./routes/ai";
// Future: import complianceRouter from "./routes/compliance";
// Future: import auditRouter      from "./routes/audit";

const app = express();
const PORT = parseInt(process.env.PORT ?? "4000", 10);
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

// ─── Startup guards ───────────────────────────────────────────────────────────
// Fail loudly and immediately rather than silently misbehaving.

if (!process.env.DATABASE_URL) {
  console.error("[server] FATAL: DATABASE_URL is not set.");
  console.error("[server] Set it in .env (dev) or the docker-compose environment block (prod).");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && SESSION_SECRET === "dev-secret-change-in-production") {
  console.error("[server] FATAL: SESSION_SECRET must be set in production.");
  console.error("[server] Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
  process.exit(1);
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser(SESSION_SECRET));
app.use(loadUser);

// Future: app.use(rateLimiter);
// Future: app.use(auditMiddleware);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/health",        healthRouter);
app.use("/auth",          authRouter);
app.use("/users",         usersRouter);
app.use("/organizations", organizationsRouter);
app.use("/projects",      projectsRouter);

// Future: app.use("/ai",         aiRouter);
// Future: app.use("/compliance", complianceRouter);
// Future: app.use("/audit",      auditRouter);

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[server] Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// ─── Start with retry ────────────────────────────────────────────────────────
// PostgreSQL may still be initialising when the backend starts (even with
// Docker healthchecks). We retry the migration up to 5 times with
// exponential backoff before giving up.

async function migrateWithRetry(attempts = 5, delayMs = 2000): Promise<void> {
  for (let i = 1; i <= attempts; i++) {
    try {
      await migrate();
      return;
    } catch (err) {
      if (i === attempts) throw err;
      console.warn(`[migrate] Attempt ${i} failed — retrying in ${delayMs}ms…`);
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs *= 2;
    }
  }
}

async function start(): Promise<void> {
  await migrateWithRetry();

  // Clean up expired sessions on startup, then every hour.
  // Prevents unbounded session table growth over time.
  async function cleanExpiredSessions(): Promise<void> {
    const { default: pool } = await import("./db");
    const client = await pool.connect();
    try {
      const result = await client.query("DELETE FROM sessions WHERE expires_at < NOW()");
      if (result.rowCount && result.rowCount > 0) {
        console.log(`[sessions] Cleaned ${result.rowCount} expired session(s).`);
      }
    } catch (err) {
      console.error("[sessions] Cleanup error:", err);
    } finally {
      client.release();
    }
  }

  await cleanExpiredSessions();
  setInterval(cleanExpiredSessions, 60 * 60 * 1000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] Universal Platform API running on port ${PORT}`);
    console.log(`[server] Environment: ${process.env.NODE_ENV ?? "development"}`);
    console.log(`[server] Health check: http://localhost:${PORT}/health`);
  });
}

start().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});

export default app;
