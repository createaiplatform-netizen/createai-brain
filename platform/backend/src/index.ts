import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { migrate } from "./db/migrate";
import { loadUser } from "./middleware/auth";

import healthRouter        from "./routes/health";
import authRouter          from "./routes/auth";
import usersRouter         from "./routes/users";
import organizationsRouter from "./routes/organizations";
import projectsRouter      from "./routes/projects";
import auditRouter         from "./routes/audit";
import integrationsRouter  from "./routes/integrations";

const app = express();
const PORT           = parseInt(process.env.PORT ?? "4000", 10);
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

// ─── Startup guards ───────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  console.error("[server] FATAL: DATABASE_URL is not set.");
  console.error("[server]   Dev:  set it in platform/backend/.env");
  console.error("[server]   Prod: add it to the backend service environment in docker-compose.yml");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && SESSION_SECRET === "dev-secret-change-in-production") {
  console.error("[server] FATAL: SESSION_SECRET must be set in production.");
  console.error("[server]   Generate: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
  process.exit(1);
}

// ─── Security headers (Helmet) ────────────────────────────────────────────────
// Sets X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
// Referrer-Policy, Permissions-Policy, and more.
// crossOriginResourcePolicy is relaxed for API use (assets served separately).

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Handled at nginx/Caddy level for the SPA
  })
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Prevents brute-force on auth endpoints. General API is more permissive.

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many requests. Please try again in a few minutes." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      10,              // 10 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many login attempts. Please wait 15 minutes before trying again." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      5,               // 5 registrations per hour per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many registration attempts. Please try again in an hour." },
});

app.use(generalLimiter);

// ─── Core middleware ──────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin:      process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
);

// cookie-parser must come before loadUser (reads signed cookies)
app.use(cookieParser(SESSION_SECRET));

// Attaches req.user from the session cookie on every request.
// Also enforces inactivity timeout (SESSION_INACTIVITY_MINUTES env var).
app.use(loadUser);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/health",        healthRouter);
app.use("/auth/login",    authLimiter);
app.use("/auth/register", registerLimiter);
app.use("/auth/setup",    registerLimiter);
app.use("/auth",          authRouter);
app.use("/users",         usersRouter);
app.use("/organizations", organizationsRouter);
app.use("/projects",      projectsRouter);
app.use("/audit",         auditRouter);
app.use("/integrations",  integrationsRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────

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

async function cleanExpiredSessions(): Promise<void> {
  const { default: pool } = await import("./db");
  const client = await pool.connect();
  try {
    const result = await client.query(
      "DELETE FROM sessions WHERE expires_at < NOW()"
    );
    if (result.rowCount && result.rowCount > 0) {
      console.log(`[sessions] Cleaned ${result.rowCount} expired session(s).`);
    }
    // Also clean expired pending MFA tokens
    await client.query("DELETE FROM pending_mfa WHERE expires_at < NOW()");
  } catch (err) {
    console.error("[sessions] Cleanup error:", err);
  } finally {
    client.release();
  }
}

async function start(): Promise<void> {
  await migrateWithRetry();
  await cleanExpiredSessions();
  setInterval(cleanExpiredSessions, 60 * 60 * 1000); // hourly

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] Universal Platform API running on port ${PORT}`);
    console.log(`[server] Environment:      ${process.env.NODE_ENV ?? "development"}`);
    console.log(`[server] Inactivity limit: ${process.env.SESSION_INACTIVITY_MINUTES ?? "30"} min`);
    console.log(`[server] Health check:     http://localhost:${PORT}/health`);
  });
}

start().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});

export default app;
