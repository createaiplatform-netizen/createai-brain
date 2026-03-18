// ─── API Configuration ────────────────────────────────────────────────────────
// In development, Vite's proxy forwards /api/* → backend:4000 so this base
// URL works seamlessly without CORS issues.
//
// In production (Docker), nginx routes /api/* to the backend container and
// serves the frontend build from /. No change needed here.
//
// Future: Add per-organization config (custom domain, AI provider, theme).
// Future: Add feature flags fetched from /api/config on startup.

export const API_BASE_URL = "/api";

export const config = {
  apiBase: API_BASE_URL,

  // Future: Auth
  // sessionTimeout: 30 * 60 * 1000, // 30 minutes — enforce in nursing home context

  // Future: AI Abstraction Layer
  // aiProvider: "openai" | "ollama" | "azure",

  // Future: Compliance Engine
  // hipaaMode: true, // Enables audit logging, session timeouts, and data masking

  appName: "Universal Platform",
  version: "1.0.0",
} as const;
