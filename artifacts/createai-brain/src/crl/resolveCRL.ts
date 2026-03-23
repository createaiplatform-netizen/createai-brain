/**
 * resolveCRL.ts — Client-side CRL resolver
 * ──────────────────────────────────────────
 * Resolves CRL URIs via the backend API.
 *
 * Sync fast-path: known schemes resolve instantly in the browser
 * without a network round-trip. Unknown schemes fall back to the API.
 *
 * Usage:
 *   import { resolveCRL, resolveCRLSync } from "@/crl/resolveCRL";
 *   const { url } = await resolveCRL("brain://tools/writer");
 *   const url = resolveCRLSync("os://settings"); // instant, no await
 */

export interface CRLResolution {
  crl:    string;
  url:    string;
  scheme: string;
  path:   string;
  label?: string;
  icon?:  string;
}

// ── Sync fast-path registry (mirrors crlRegistry.ts on the server) ────────────
// Format: [scheme, basePath] — default resolver is basePath + "/" + subpath
const SYNC_REGISTRY: Record<string, string> = {
  brain:  "",
  family: "/family-hub",
  os:     "",
  hub:    "/for",
  user:   "/settings",
  space:  "/projects",
  invite: "/join",
  api:    "/api",
  store:  "/semantic-store",
  agent:  "/command-center",
  pulse:  "/broadcast",
};

// OS-specific sync overrides
const OS_SYNC: Record<string, string> = {
  "":              "/",
  dashboard:       "/dashboard",
  settings:        "/settings",
  billing:         "/billing",
  library:         "/output-library",
  "output-library":"/output-library",
  projects:        "/projects",
  team:            "/team",
  analytics:       "/analytics",
  admin:           "/admin",
  cmd:             "/?cmd=open",
  command:         "/?cmd=open",
};

const FAMILY_SYNC: Record<string, string> = {
  "":      "/family-hub",
  hub:     "/family-hub",
  bank:    "/family-hub",
  goals:   "/family-hub",
  kids:    "/family/kids",
  portal:  "/family-portal-intro",
};

const INVITE_SYNC: Record<string, string> = {
  "":        "/join",
  join:      "/join",
  broadcast: "/broadcast",
  discover:  "/discover",
  subscribe: "/api/opt-in/info",
};

const AGENT_SYNC: Record<string, string> = {
  ucpx:    "/command-center",
  nova:    "/family-hub",
  atlas:   "/family-hub",
  aurora:  "/family-hub",
  brain:   "/above-transcend",
  semantic:"/semantic-store",
};

/**
 * Resolve a CRL URI instantly in the browser — no network call.
 * Returns null if the scheme is unknown (use async resolveCRL instead).
 */
export function resolveCRLSync(crl: string): string | null {
  const match = crl.match(/^([a-z][a-z0-9+\-.]*):\/\/(.*)$/i);
  if (!match) return null;

  const [, scheme, path] = match;
  const s = scheme.toLowerCase();
  const p = path.replace(/^\/+/, "");

  if (!(s in SYNC_REGISTRY)) return null;

  switch (s) {
    case "os":
      return OS_SYNC[p] ?? "/" + p;
    case "family":
      if (p.startsWith("agents/")) return AGENT_SYNC[p.replace("agents/", "")] ?? "/family-hub";
      return FAMILY_SYNC[p] ?? "/family-hub";
    case "invite":
      return INVITE_SYNC[p] ?? "/" + p;
    case "agent":
      return AGENT_SYNC[p] ?? "/command-center";
    case "hub":
      return `/for/${p}`;
    case "user":
      return !p || p === "me" ? "/settings" : `/u/${p}`;
    case "api":
      return `/api/${p}`;
    case "pulse": {
      const pm: Record<string, string> = { "": "/broadcast", broadcast: "/broadcast", stream: "/api/global-pulse/stream", rss: "/api/global-pulse/feed.xml", subscribe: "/api/opt-in" };
      return pm[p] ?? "/" + p;
    }
    default: {
      const base = SYNC_REGISTRY[s];
      if (!p) return base || "/";
      return `${base}/${p}`.replace(/\/+/g, "/");
    }
  }
}

/**
 * Resolve a CRL URI via the backend API.
 * Falls back to sync resolution if the backend is unavailable.
 */
export async function resolveCRL(crl: string): Promise<CRLResolution> {
  // Try sync fast-path first
  const syncPath = resolveCRLSync(crl);
  if (syncPath !== null) {
    const scheme = crl.split("://")[0] ?? "";
    const path   = crl.split("://")[1] ?? "";
    return { crl, url: syncPath, scheme, path };
  }

  // Fall back to API for unknown / dynamic schemes
  const params = new URLSearchParams({ crl });
  const res = await fetch(`/api/crl/resolve?${params.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error((data as {error?: string}).error ?? "Failed to resolve CRL");
  }
  return res.json() as Promise<CRLResolution>;
}
