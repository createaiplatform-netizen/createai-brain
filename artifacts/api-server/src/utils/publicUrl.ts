/**
 * utils/publicUrl.ts
 * ──────────────────
 * Single source of truth for the server's own public-facing base URL.
 *
 * getPublicBaseUrl() — runtime URL (dev + prod):
 *   1. PUBLIC_DOMAIN  — set this in Replit Secrets for a custom domain
 *   2. REPLIT_DEV_DOMAIN — auto-injected by Replit
 *   3. localhost:8080 — local fallback
 *
 * getCanonicalBaseUrl() — stable SEO URL (sitemap, structured data, ad feeds):
 *   1. BRAND_DOMAIN — purchased custom domain (no Replit domains)
 *   2. PUBLIC_DOMAIN — only if not a Replit/worf dev domain
 *   3. https://createai.digital — known production canonical fallback
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

export function getCanonicalBaseUrl(): string {
  const brand = process.env["BRAND_DOMAIN"];
  if (brand) {
    const clean = brand.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!clean.includes("replit") && !clean.includes("worf")) {
      return `https://${clean}`;
    }
  }
  const pub = process.env["PUBLIC_DOMAIN"];
  if (pub) {
    const clean = pub.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const isDevDomain =
      clean.includes(".replit.dev") ||
      clean.includes(".worf.replit") ||
      clean.includes(".replit.app") ||
      clean.endsWith(".repl.co");
    if (!isDevDomain) return `https://${clean}`;
  }
  return "https://createai.digital";
}
