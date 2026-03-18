import "dotenv/config";
import express from "express";
import cors from "cors";

import healthRouter from "./routes/health";
import usersRouter from "./routes/users";
import organizationsRouter from "./routes/organizations";
import projectsRouter from "./routes/projects";

// ─── Future imports ───────────────────────────────────────────────────────────
// import authRouter from "./routes/auth";
// import aiRouter from "./routes/ai";               // AI abstraction layer
// import complianceRouter from "./routes/compliance"; // Compliance engine
// import auditRouter from "./routes/audit";           // HIPAA audit trail

const app = express();
const PORT = parseInt(process.env.PORT ?? "4000", 10);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
);

// ─── Future middleware ────────────────────────────────────────────────────────
// app.use(sessionMiddleware);   // Cookie-based sessions
// app.use(authMiddleware);      // Attach req.user from session
// app.use(auditMiddleware);     // Log every request for HIPAA compliance
// app.use(rateLimiter);         // Prevent brute-force attacks

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/health",        healthRouter);
app.use("/users",         usersRouter);
app.use("/organizations", organizationsRouter);
app.use("/projects",      projectsRouter);

// ─── Future routes ────────────────────────────────────────────────────────────
// app.use("/auth",       authRouter);       // Login, logout, register, MFA
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] Universal Platform API running on port ${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV ?? "development"}`);
  console.log(`[server] Health check: http://localhost:${PORT}/health`);
});

export default app;
