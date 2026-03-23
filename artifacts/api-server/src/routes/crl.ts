/**
 * crl.ts — CreateAI Resolution Layer (CRL) API
 * ──────────────────────────────────────────────
 * GET  /api/crl/resolve?crl=brain://tools/writer  → { crl, url, meta }
 * GET  /api/crl/resolve?uri=brain://tools/writer  → same (alias)
 * GET  /api/crl/namespaces                        → all registered TLDs
 * POST /api/crl/register                          → register new namespace (founder/admin)
 * GET  /api/crl/lookup/:scheme/:path              → direct lookup
 */

import { Router, type Request, type Response } from "express";
import {
  resolveCRL,
  NAMESPACES,
  registerNamespace,
  getNamespace,
  type CRLNamespace,
} from "../config/crlRegistry.js";
import { getCanonicalBaseUrl } from "../utils/publicUrl.js";

const router = Router();

// ── GET /resolve ──────────────────────────────────────────────────────────────

router.get("/resolve", (req: Request, res: Response) => {
  const uri = (req.query.crl ?? req.query.uri) as string | undefined;
  if (!uri) {
    res.status(400).json({ ok: false, error: "Missing crl or uri parameter" });
    return;
  }

  const result = resolveCRL(uri);
  if (!result) {
    res.status(400).json({ ok: false, error: `Cannot resolve CRL: ${uri}` });
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  res.json({
    ok:     true,
    crl:    uri,
    url:    result.resolvedUrl,
    scheme: result.scheme,
    path:   result.path,
    label:  result.label,
    icon:   result.icon,
    public: result.public,
  });
});

// ── GET /namespaces ───────────────────────────────────────────────────────────

router.get("/namespaces", (_req: Request, res: Response) => {
  const base = getCanonicalBaseUrl();

  const namespaces = NAMESPACES.map(ns => ({
    scheme:      ns.scheme,
    label:       ns.label,
    description: ns.description,
    icon:        ns.icon,
    baseUrl:     base + ns.baseRoute,
    public:      ns.public,
    examples:    ns.examples.map(e => ({
      uri:      e.uri,
      resolves: base + e.resolves,
    })),
  }));

  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({ ok: true, count: namespaces.length, namespaces });
});

// ── GET /lookup?scheme=hub&path=healthcare — direct lookup via query params ───

router.get("/lookup", (req: Request, res: Response) => {
  const scheme = req.query.scheme as string | undefined;
  const path   = (req.query.path as string | undefined) ?? "";

  if (!scheme) {
    res.status(400).json({ ok: false, error: "scheme query param is required" });
    return;
  }

  const uri    = `${scheme}://${path}`;
  const result = resolveCRL(uri);
  if (!result) {
    res.status(404).json({ ok: false, error: `Unknown scheme: ${scheme}` });
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  res.json({ ok: true, uri, url: result.resolvedUrl, label: result.label, icon: result.icon });
});

// ── POST /register — runtime namespace registration (founder/admin only) ──────

router.post("/register", (req: Request, res: Response) => {
  const user = req.user as { role?: string } | undefined;
  if (!user || !["founder", "admin"].includes(user.role ?? "")) {
    res.status(403).json({ ok: false, error: "founder or admin role required" });
    return;
  }

  const { scheme, label, description, icon, baseRoute, isPublic } = req.body as {
    scheme:     string;
    label:      string;
    description: string;
    icon?:      string;
    baseRoute:  string;
    isPublic?:  boolean;
  };

  if (!scheme || !baseRoute) {
    res.status(400).json({ ok: false, error: "scheme and baseRoute are required" });
    return;
  }
  if (!/^[a-z][a-z0-9+\-.]*$/.test(scheme)) {
    res.status(400).json({ ok: false, error: "scheme must be lowercase alphanumeric" });
    return;
  }

  const base = getCanonicalBaseUrl();

  const ns: CRLNamespace = {
    scheme,
    label:       label ?? scheme,
    description: description ?? "",
    icon:        icon ?? "🔗",
    baseRoute,
    public:      isPublic ?? false,
    resolver:    (path, b) => {
      if (!path) return b + baseRoute;
      return `${b}${baseRoute}/${path}`.replace(/\/+/g, "/");
    },
    examples: [{ uri: `${scheme}://`, resolves: baseRoute }],
  };

  registerNamespace(ns);

  res.status(201).json({
    ok:      true,
    message: `Namespace ${scheme}:// registered`,
    scheme,
    baseUrl: base + baseRoute,
  });
});

export default router;
