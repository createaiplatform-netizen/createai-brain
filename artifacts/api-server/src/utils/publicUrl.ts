/**
 * utils/publicUrl.ts
 * ──────────────────
 * Single source of truth for the server's own public-facing base URL.
 *
 * Priority chain (first match wins):
 *   1. PUBLIC_DOMAIN  — set this in Replit Secrets when using a custom domain
 *                       e.g.  PUBLIC_DOMAIN=createai.digital
 *   2. REPLIT_DEV_DOMAIN — injected by Replit in dev mode
 *   3. localhost:8080    — local fallback
 *
 * Usage in any route file:
 *   import { getPublicBaseUrl } from "../utils/publicUrl.js";
 *   const STORE_URL = getPublicBaseUrl();
 */

export function getPublicBaseUrl(): string {
  const custom = process.env["PUBLIC_DOMAIN"];
  if (custom) {
    const clean = custom.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${clean}`;
  }
  const dev = process.env["REPLIT_DEV_DOMAIN"];
  if (dev) return `https://${dev}`;
  return "http://localhost:8080";
}
