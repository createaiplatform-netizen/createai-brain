/**
 * internalRouter.ts — createai:// Internal URL Addressing System
 * ──────────────────────────────────────────────────────────────────
 *
 * Defines the "createai://" internal protocol. This is the platform's
 * own URL scheme — similar to how "mailto:" or "tel:" work in browsers,
 * but for internal platform navigation and service addressing.
 *
 * FORMAT:
 *   createai://[zone]/[path]
 *
 * ZONES:
 *   app      — frontend OS screens         createai://app/home
 *   api      — backend API endpoints       createai://api/platform-identity
 *   store    — product catalog             createai://store/healthcare
 *   portal   — client self-service         createai://portal/me
 *   tool     — AI invention tools          createai://tool/clinical-scribe
 *   system   — system pages                createai://system/health
 *
 * RESOLUTION:
 *   resolve("createai://app/home")          → { type: "frontend", url: "/#/home" }
 *   resolve("createai://api/leads")         → { type: "api",      url: "/api/leads" }
 *   resolve("createai://store/healthcare")  → { type: "public",   url: "/for/healthcare" }
 *
 * The frontend uses this via the useCREATEAIUrl() hook.
 * The backend resolves it via GET /api/internal/resolve?npa=createai://...
 */

export interface NPAResolution {
  input:    string;
  zone:     string;
  path:     string;
  type:     "frontend" | "api" | "public" | "well-known" | "unknown";
  url:      string;
  absolute: string;
  valid:    boolean;
}

const ZONE_PREFIXES: Record<string, { type: NPAResolution["type"]; prefix: string }> = {
  app:     { type: "frontend",   prefix: "/#"       },
  api:     { type: "api",        prefix: "/api"      },
  store:   { type: "public",     prefix: "/store"    },
  portal:  { type: "public",     prefix: "/portal"   },
  tool:    { type: "frontend",   prefix: "/#/tool"   },
  system:  { type: "api",        prefix: "/api"      },
  wk:      { type: "well-known", prefix: "/.well-known" },
};

const STATIC_MAP: Record<string, Omit<NPAResolution, "input" | "valid">> = {
  "createai://home":               { zone: "app",  path: "home",            type: "frontend",   url: "/",                                absolute: "" },
  "createai://app/home":           { zone: "app",  path: "home",            type: "frontend",   url: "/",                                absolute: "" },
  "createai://app/health":         { zone: "app",  path: "health",          type: "frontend",   url: "/#/health",                        absolute: "" },
  "createai://app/store":          { zone: "app",  path: "store",           type: "public",     url: "/store",                           absolute: "" },
  "createai://api/identity":       { zone: "api",  path: "identity",        type: "api",        url: "/api/platform-identity",           absolute: "" },
  "createai://api/leads":          { zone: "api",  path: "leads",           type: "api",        url: "/api/leads",                       absolute: "" },
  "createai://api/health":         { zone: "api",  path: "health",          type: "api",        url: "/api/health",                      absolute: "" },
  "createai://api/analytics":      { zone: "api",  path: "analytics",       type: "api",        url: "/api/analytics",                   absolute: "" },
  "createai://api/status":         { zone: "api",  path: "status",          type: "api",        url: "/api/self-host/status",            absolute: "" },
  "createai://store/healthcare":   { zone: "store", path: "healthcare",     type: "public",     url: "/for/healthcare",                  absolute: "" },
  "createai://store/legal":        { zone: "store", path: "legal",          type: "public",     url: "/for/legal",                       absolute: "" },
  "createai://store/staffing":     { zone: "store", path: "staffing",       type: "public",     url: "/for/staffing",                    absolute: "" },
  "createai://portal/me":          { zone: "portal", path: "me",            type: "public",     url: "/portal/me",                       absolute: "" },
  "createai://tool/scribe":        { zone: "tool",  path: "scribe",         type: "frontend",   url: "/#/tool/clinical-scribe",          absolute: "" },
  "createai://wk/identity":        { zone: "wk",    path: "identity",       type: "well-known", url: "/.well-known/platform-id.json",    absolute: "" },
  "createai://wk/npa":             { zone: "wk",    path: "npa",            type: "well-known", url: "/.well-known/npa-resolve.json",    absolute: "" },
  "createai://wk/proof":           { zone: "wk",    path: "proof",          type: "well-known", url: "/.well-known/platform-proof.json", absolute: "" },
};

export function resolveNPA(input: string, baseUrl = ""): NPAResolution {
  if (!input.startsWith("createai://")) {
    return { input, zone: "", path: "", type: "unknown", url: input, absolute: input, valid: false };
  }

  const staticMatch = STATIC_MAP[input];
  if (staticMatch) {
    return { ...staticMatch, input, absolute: baseUrl + staticMatch.url, valid: true };
  }

  const withoutScheme = input.slice("createai://".length);
  const [zone, ...rest] = withoutScheme.split("/");
  const tail = rest.join("/");
  const zoneConf = ZONE_PREFIXES[zone ?? ""];

  if (!zoneConf) {
    return { input, zone: zone ?? "", path: tail, type: "unknown", url: "/" + withoutScheme, absolute: baseUrl + "/" + withoutScheme, valid: false };
  }

  const url = zoneConf.prefix + (tail ? "/" + tail : "");
  return { input, zone: zone ?? "", path: tail, type: zoneConf.type, url, absolute: baseUrl + url, valid: true };
}

export function getFullUrlMap(): Array<{ npa: string; url: string; type: string; zone: string }> {
  return Object.entries(STATIC_MAP).map(([npa, res]) => ({
    npa,
    url:  res.url,
    type: res.type,
    zone: res.zone,
  }));
}

export function getAllZones(): Array<{ zone: string; prefix: string; type: string; example: string }> {
  return Object.entries(ZONE_PREFIXES).map(([zone, conf]) => ({
    zone,
    prefix:  "createai://" + zone + "/",
    type:    conf.type,
    example: "createai://" + zone + "/[path]",
  }));
}
