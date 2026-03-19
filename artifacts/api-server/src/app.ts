import express, { type Express } from "express";
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

app.use(authMiddleware);
app.use(scopeMiddleware);

app.use("/api", router);

export default app;
