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

// ─── Future imports ───────────────────────────────────────────────────────────
// import aiRouter          from "./routes/ai";          // AI abstraction layer
// import complianceRouter  from "./routes/compliance";  // Compliance engine
// import auditRouter       from "./routes/audit";       // HIPAA audit trail

const app = express();
const PORT = parseInt(process.env.PORT ?? "4000", 10);
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

if (process.env.NODE_ENV === "production" && SESSION_SECRET === "dev-secret-change-in-production") {
  console.error("[server] FATAL: SESSION_SECRET must be set in production.");
  process.exit(1);
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,   // Required for cookies to be sent cross-origin
  })
);

// cookie-parser verifies the HMAC signature on signed cookies.
// The "sid" session cookie is always signed.
app.use(cookieParser(SESSION_SECRET));

// Attach req.user from the session cookie on every request.
app.use(loadUser);

// ─── Future middleware ────────────────────────────────────────────────────────
// app.use(rateLimiter);     // Prevent brute-force attacks
// app.use(auditMiddleware); // Log every request for HIPAA compliance

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/health",        healthRouter);
app.use("/auth",          authRouter);
app.use("/users",         usersRouter);
app.use("/organizations", organizationsRouter);
app.use("/projects",      projectsRouter);

// ─── Future routes ────────────────────────────────────────────────────────────
// app.use("/ai",         aiRouter);         // AI abstraction — OpenAI / Ollama / Azure
// app.use("/compliance", complianceRouter); // HIPAA checklists, audit reports
// app.use("/audit",      auditRouter);      // Audit trail viewer (admin only)

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

// ─── Start ────────────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  // Apply database schema on startup (idempotent — safe to run every time).
  await migrate();

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
