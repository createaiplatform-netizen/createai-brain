/**
 * adapters.ts — Universal Adapter API
 * Phase 3 · Phase 2 (credential management) · Phase 6 (dashboard visibility)
 *
 * GET    /api/adapters              — list all adapters with per-user connection status
 * GET    /api/adapters/industries   — return industry grouping + meta
 * GET    /api/adapters/:id          — get single adapter definition
 * POST   /api/adapters/:id/test     — run live connectivity test
 * POST   /api/adapters/:id/credentials — save credentials to DB (via configJson)
 * DELETE /api/adapters/:id/credentials — remove credentials
 */

import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db, integrations } from "@workspace/db";
import {
  ADAPTERS, getAdapter, getAdaptersByIndustry, INDUSTRY_META, testAdapter,
} from "../adapters/registry";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getUserAdapterRow(userId: string, adapterId: string) {
  const [row] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.type, "adapter"), eq(integrations.name, adapterId)))
    .limit(1);
  return row ?? null;
}

function connectionStatus(row: typeof integrations.$inferSelect | null): "not-connected" | "sandbox" | "live" {
  if (!row || !row.isEnabled) return "not-connected";
  const cfg = row.configJson as Record<string, unknown> | null;
  const hasCreds = cfg && Object.keys(cfg).some(k => k !== "__meta" && !!cfg[k]);
  if (!hasCreds) return "not-connected";
  return row.status === "live" ? "live" : "sandbox";
}

// ─── List all adapters ────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const rows = await db.select().from(integrations)
      .where(and(eq(integrations.userId, req.user.id), eq(integrations.type, "adapter")));

    const rowByName: Record<string, typeof integrations.$inferSelect> = {};
    for (const r of rows) rowByName[r.name] = r;

    const list = ADAPTERS.map(a => {
      const row = rowByName[a.id] ?? null;
      const status = connectionStatus(row);
      return {
        id: a.id, label: a.label, industry: a.industry, icon: a.icon,
        description: a.description, authType: a.authType, docsUrl: a.docsUrl,
        website: a.website, complianceFlags: a.complianceFlags ?? [],
        credentialFields: a.credentialFields.map(f => ({ key: f.key, label: f.label, placeholder: f.placeholder, secret: f.secret })),
        status,
        connectedAt: row?.updatedAt ?? null,
      };
    });

    res.json({ adapters: list, total: list.length });
  } catch (err) {
    console.error("GET /adapters error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Industry grouping ────────────────────────────────────────────────────────
router.get("/industries", (_req, res) => {
  const grouped = getAdaptersByIndustry();
  const result = Object.entries(INDUSTRY_META).map(([id, meta]) => ({
    id,
    ...meta,
    count: grouped[id as keyof typeof grouped]?.length ?? 0,
    adapters: grouped[id as keyof typeof grouped]?.map(a => a.id) ?? [],
  }));
  res.json({ industries: result });
});

// ─── Single adapter ───────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const adapter = getAdapter(req.params.id as string);
  if (!adapter) { res.status(404).json({ error: "Adapter not found" }); return; }
  const row = await getUserAdapterRow(req.user.id, adapter.id);
  res.json({
    adapter: {
      id: adapter.id, label: adapter.label, industry: adapter.industry, icon: adapter.icon,
      description: adapter.description, authType: adapter.authType,
      docsUrl: adapter.docsUrl, website: adapter.website,
      complianceFlags: adapter.complianceFlags ?? [],
      credentialFields: adapter.credentialFields,
      status: connectionStatus(row),
      connectedAt: row?.updatedAt ?? null,
    },
  });
});

// ─── Test connection ──────────────────────────────────────────────────────────
router.post("/:id/test", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const adapter = getAdapter(req.params.id as string);
  if (!adapter) { res.status(404).json({ error: "Adapter not found" }); return; }

  // Load stored credentials
  const row = await getUserAdapterRow(req.user.id, adapter.id);
  const storedCreds = (row?.configJson ?? {}) as Record<string, string>;

  // Allow override credentials from request body (for testing before saving)
  const overrideCreds = (req.body?.credentials ?? {}) as Record<string, string>;
  const creds = { ...storedCreds, ...overrideCreds };

  const result = await testAdapter(adapter, creds);

  // Log to integration event log (from integrations route in-memory store)
  // We emit a structured test result back — the frontend logs it
  res.json({
    ok: result.ok,
    latencyMs: result.latencyMs,
    statusCode: result.statusCode,
    message: result.message,
    detail: result.detail,
    adapterId: adapter.id,
    adapterLabel: adapter.label,
    testedAt: new Date().toISOString(),
  });
});

// ─── Save credentials ─────────────────────────────────────────────────────────
router.post("/:id/credentials", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const adapter = getAdapter(req.params.id as string);
  if (!adapter) { res.status(404).json({ error: "Adapter not found" }); return; }

  const credentials = (req.body?.credentials ?? {}) as Record<string, string>;
  const mode = (req.body?.mode ?? "sandbox") as "sandbox" | "live";

  // Validate that required credential fields are present
  const missing = adapter.credentialFields
    .filter(f => f.secret)
    .filter(f => !credentials[f.key]?.trim());

  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required fields: ${missing.map(f => f.label).join(", ")}` });
    return;
  }

  try {
    const existing = await getUserAdapterRow(req.user.id, adapter.id);
    if (existing) {
      const [updated] = await db.update(integrations).set({
        configJson: credentials,
        status: mode,
        isEnabled: true,
        updatedAt: new Date(),
      }).where(eq(integrations.id, existing.id)).returning();
      res.json({ ok: true, integration: updated });
    } else {
      const [created] = await db.insert(integrations).values({
        userId: req.user.id,
        name: adapter.id,
        type: "adapter",
        category: adapter.industry,
        status: mode,
        configJson: credentials,
        isEnabled: true,
      }).returning();
      res.json({ ok: true, integration: created });
    }
  } catch (err) {
    console.error("POST /adapters/:id/credentials error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Remove credentials ───────────────────────────────────────────────────────
router.delete("/:id/credentials", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const adapter = getAdapter(req.params.id as string);
  if (!adapter) { res.status(404).json({ error: "Adapter not found" }); return; }

  try {
    const existing = await getUserAdapterRow(req.user.id, adapter.id);
    if (!existing) { res.json({ ok: true }); return; }
    await db.update(integrations).set({
      configJson: null, isEnabled: false, status: "ready", updatedAt: new Date(),
    }).where(eq(integrations.id, existing.id));
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /adapters/:id/credentials error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
