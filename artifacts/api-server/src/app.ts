import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authMiddleware }  from "./middlewares/authMiddleware";
import { scopeMiddleware } from "./middlewares/scopeMiddleware";
import router from "./routes";

export { chatLimiter, heavyLimiter, editLimiter } from "./middlewares/rateLimiters";

const app: Express = express();

// ── Trust Replit's reverse proxy so req.ip is the real client IP ─────────────
// Required for rate limiters to key correctly on real IPs for unauthenticated
// requests (authenticated requests already key by userId, but defence in depth).
app.set("trust proxy", 1);

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ── CORS: explicit allowlist — never reflect arbitrary origins ───────────────
const ALLOWED_ORIGINS = [
  /\.replit\.app$/,
  /\.replit\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/,
];

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some(p => p.test(origin));
    callback(allowed ? null : new Error("CORS: origin not allowed"), allowed);
  },
}));

// ── Body size limits ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));
app.use(cookieParser());

// ── Public health check (no auth) ────────────────────────────────────────────
app.get("/healthz", (_req: Request, res: Response) => {
  res.json({
    status:    "ok",
    service:   "api-server",
    uptime_s:  Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use(authMiddleware);
app.use(scopeMiddleware);

app.use("/api", router);

// ── Global error handler (M-17) ──────────────────────────────────────────────
// Must be registered AFTER all routes. Express identifies error handlers by
// their 4-argument signature; the unused _next is required.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("[global-error]", err.stack ?? err.message);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
