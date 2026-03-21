/**
 * credentialsBridge.ts — In-OS Credential Bridge API
 *
 * GET  /api/credentials/status         — which tokens are connected, source (bridge/env/none)
 * POST /api/credentials/set            — enter a token from the OS (owner only)
 * DELETE /api/credentials/clear/:key   — remove a stored token
 * GET  /api/credentials/dns-records    — fetch Resend DNS records for domain verification
 * GET  /api/credentials/defs           — full credential definitions (labels, help URLs)
 */

import { Router, type Request, type Response } from "express";
import {
  setCredential,
  clearCredential,
  getCredentialStatus,
  CREDENTIAL_DEFS,
} from "../services/credentialsBridge.js";

const router = Router();

// ─── GET /api/credentials/status ─────────────────────────────────────────────

router.get("/status", (_req: Request, res: Response) => {
  const status = getCredentialStatus();
  const live   = status.filter(s => s.set).length;

  res.json({
    ok:         true,
    checkedAt:  new Date().toISOString(),
    live,
    total:      status.length,
    summary:    live === 0
      ? "No marketplace tokens connected yet. Enter them here — no Replit Secrets navigation required."
      : `${live} of ${status.length} marketplace channels connected.`,
    credentials: status,
  });
});

// ─── GET /api/credentials/defs ────────────────────────────────────────────────

router.get("/defs", (_req: Request, res: Response) => {
  res.json({ ok: true, defs: CREDENTIAL_DEFS });
});

// ─── POST /api/credentials/set ────────────────────────────────────────────────

router.post("/set", (req: Request, res: Response) => {
  const { key, value } = req.body as { key?: string; value?: string };

  if (!key || typeof key !== "string" || key.trim().length === 0) {
    res.status(400).json({ ok: false, error: "key is required" });
    return;
  }

  if (!value || typeof value !== "string" || value.trim().length === 0) {
    res.status(400).json({ ok: false, error: "value is required" });
    return;
  }

  const allowed = CREDENTIAL_DEFS.map(d => d.key);
  if (!allowed.includes(key.trim())) {
    res.status(400).json({ ok: false, error: "Unknown credential key. Must be one of: " + allowed.join(", ") });
    return;
  }

  setCredential(key.trim(), value.trim());

  res.json({
    ok:      true,
    key:     key.trim(),
    message: `${key.trim()} saved and injected — ${CREDENTIAL_DEFS.find(d => d.key === key.trim())?.channel ?? key} is now active.`,
    note:    "This credential persists across server restarts. No Replit Secrets navigation required.",
  });
});

// ─── DELETE /api/credentials/clear/:key ──────────────────────────────────────

router.delete("/clear/:key", (req: Request, res: Response) => {
  const key = String(req.params["key"] ?? "").trim();

  if (!key) {
    res.status(400).json({ ok: false, error: "key is required" });
    return;
  }

  clearCredential(key);
  res.json({ ok: true, key, message: `${key} cleared from bridge store and process.env.` });
});

// ─── GET /api/credentials/dns-records ────────────────────────────────────────
// Fetches Resend domain verification records and formats them for all major registrars.

router.get("/dns-records", async (_req: Request, res: Response) => {
  const apiKey = process.env["RESEND_API_KEY"];
  const domain = "LakesideTrinity.com";

  if (!apiKey) {
    res.json({
      ok:      false,
      domain,
      error:   "RESEND_API_KEY not set",
      records: [],
    });
    return;
  }

  try {
    const r = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: "Bearer " + apiKey },
    });

    if (!r.ok) {
      throw new Error("Resend API returned " + r.status);
    }

    const data = await r.json() as { data?: Array<{ name: string; status: string; records?: unknown[] }> };
    const domains = data.data ?? [];

    const match = domains.find(d => d.name?.toLowerCase().includes("lakesidetrinity") || d.name?.toLowerCase().includes("createai"));

    if (match && match.records && Array.isArray(match.records) && match.records.length > 0) {
      const records = match.records as Array<Record<string, string>>;

      const formatted = records.map((rec: Record<string, string>) => ({
        type:     rec["type"]   ?? "TXT",
        name:     rec["name"]   ?? "@",
        value:    rec["value"]  ?? "",
        ttl:      rec["ttl"]    ?? "Auto",
        verified: rec["status"] === "verified",
        godaddy: {
          type:  rec["type"]  ?? "TXT",
          host:  rec["name"]  ?? "@",
          value: rec["value"] ?? "",
          ttl:   "1 Hour",
        },
        namecheap: {
          type:  rec["type"]  ?? "TXT",
          host:  rec["name"]  ?? "@",
          value: rec["value"] ?? "",
          ttl:   "Automatic",
        },
        cloudflare: {
          type:    rec["type"]  ?? "TXT",
          name:    rec["name"]  ?? "@",
          content: rec["value"] ?? "",
          proxy:   false,
          ttl:     "Auto",
        },
      }));

      res.json({
        ok:           true,
        domain:       match.name,
        status:       match.status,
        verified:     match.status === "verified",
        recordCount:  records.length,
        records:      formatted,
        instructions: match.status === "verified"
          ? "Domain is already verified. Email delivery is active."
          : "Add each record to your domain registrar DNS settings. Verification typically completes within 48 hours.",
        registrars: ["GoDaddy", "Namecheap", "Cloudflare", "Google Domains", "Route 53"],
      });
      return;
    }

    // Domain exists but no records array, or domain not found
    // Return generic Resend TXT format for manual entry
    res.json({
      ok:           true,
      domain,
      status:       match?.status ?? "not_found",
      verified:     false,
      recordCount:  0,
      records:      [],
      instructions: match
        ? "Domain found but DNS records could not be retrieved from Resend API. Visit resend.com/domains to view your verification records."
        : "Domain not found in Resend account. Add " + domain + " at resend.com/domains first, then return here to copy the DNS records.",
      actionUrl:    "https://resend.com/domains",
    });

  } catch (err) {
    res.json({
      ok:           false,
      domain,
      error:        (err as Error).message,
      instructions: "Could not reach Resend API. Visit resend.com/domains to copy your DNS records manually.",
      actionUrl:    "https://resend.com/domains",
    });
  }
});

export default router;
