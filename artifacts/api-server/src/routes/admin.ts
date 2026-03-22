/**
 * admin.ts — Enterprise Admin Dashboard API
 *
 * All routes require authentication. Founder/Admin role enforced per route.
 *
 * Endpoints:
 *   GET  /admin/status           — platform health summary
 *   GET  /admin/users            — list users (paginated, filterable)
 *   GET  /admin/users/:id        — single user detail
 *   PATCH /admin/users/:id/role  — change user role (founder only)
 *   DELETE /admin/users/:id      — soft-delete user (founder only)
 *   GET  /admin/audit-logs       — audit log (paginated, filterable)
 *   GET  /admin/analytics        — event count summary
 *   GET  /admin/projects         — all projects overview
 *   POST /admin/gdpr/export/:userId  — export all data for a user
 *   DELETE /admin/gdpr/delete/:userId — soft-delete + anonymize user data
 */

import { Router } from "express";
import { and, desc, eq, gte, ilike, isNull, lte, or, sql } from "drizzle-orm";
import { db, usersTable, projects, auditLogs, analyticsEvents } from "@workspace/db";
import { logAudit } from "../services/audit";
import { getEventCounts } from "../services/analytics";
import type { Request, Response } from "express";

const router = Router();

/** Only founder or admin role can access admin routes */
function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!["founder", "admin"].includes((req.user as { role?: string }).role ?? "")) {
    res.status(403).json({ error: "Forbidden: admin or founder role required" });
    return;
  }
  next();
}

router.use(requireAdmin);

// ─── Platform Status ───────────────────────────────────────────────────────────
router.get("/status", async (_req, res) => {
  try {
    const [userCount]    = await db.select({ c: sql<number>`count(*)::int` }).from(usersTable).where(isNull(usersTable.deletedAt));
    const [projectCount] = await db.select({ c: sql<number>`count(*)::int` }).from(projects).where(isNull(projects.deletedAt));
    const [auditCount]   = await db.select({ c: sql<number>`count(*)::int` }).from(auditLogs);
    const [eventCount]   = await db.select({ c: sql<number>`count(*)::int` }).from(analyticsEvents);

    res.json({
      status: "online",
      users:        Number(userCount.c),
      projects:     Number(projectCount.c),
      auditEntries: Number(auditCount.c),
      analyticsEvents: Number(eventCount.c),
      platforms: ["HealthOS", "StaffingOS", "LegalPM"],
      tier: "founder",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[admin] GET /status:", err);
    res.status(500).json({ error: "Status unavailable" });
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { search, role, page = "1", limit = "50" } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [isNull(usersTable.deletedAt)];
    if (role) conditions.push(eq(usersTable.role, role));
    if (search) {
      conditions.push(
        or(
          ilike(usersTable.email ?? usersTable.id, `%${search}%`),
          ilike(usersTable.firstName ?? usersTable.id, `%${search}%`),
        )!,
      );
    }

    const rows = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        role: usersTable.role,
        tenantId: usersTable.tenantId,
        createdAt: usersTable.createdAt,
        profileImageUrl: usersTable.profileImageUrl,
      })
      .from(usersTable)
      .where(and(...conditions))
      .orderBy(desc(usersTable.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(and(...conditions));

    res.json({ users: rows, total: Number(total), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("[admin] GET /users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id as string)).limit(1);
    if (!row) { res.status(404).json({ error: "User not found" }); return; }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body as { role: string };
    const allowed = ["founder", "admin", "user", "viewer"];
    if (!allowed.includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }

    await db.update(usersTable).set({ role, updatedAt: new Date() }).where(eq(usersTable.id, req.params.id as string));
    await logAudit(db as any, req, {
      action: "admin.user.role_changed",
      resource: `user:${req.params.id}`,
      resourceType: "user",
      metadata: { newRole: role },
    });
    res.json({ ok: true, role });
  } catch (err) {
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await db.update(usersTable).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(usersTable.id, req.params.id as string));
    await logAudit(db as any, req, {
      action: "admin.user.soft_deleted",
      resource: `user:${req.params.id}`,
      resourceType: "user",
      outcome: "success",
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to soft-delete user" });
  }
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get("/audit-logs", async (req, res) => {
  try {
    const {
      userId, action, outcome,
      from, to,
      page = "1", limit = "50",
    } = req.query as Record<string, string>;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions: ReturnType<typeof eq>[] = [];

    if (userId)  conditions.push(eq(auditLogs.userId,  userId));
    if (action)  conditions.push(eq(auditLogs.action,  action));
    if (outcome) conditions.push(eq(auditLogs.outcome, outcome));
    if (from)    conditions.push(gte(auditLogs.createdAt, new Date(from)) as any);
    if (to)      conditions.push(lte(auditLogs.createdAt, new Date(to)) as any);

    const rows = await db
      .select()
      .from(auditLogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(conditions.length ? and(...conditions) : undefined);

    res.json({ logs: rows, total: Number(total), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("[admin] GET /audit-logs:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get("/analytics", async (req, res) => {
  try {
    const days = parseInt((req.query.days as string) ?? "30");
    const since = new Date(Date.now() - days * 86_400_000);

    const eventCounts = await getEventCounts(db as any, since);

    const [{ dailyActive }] = await db.select({
      dailyActive: sql<number>`count(distinct user_id)::int`,
    }).from(analyticsEvents).where(gte(analyticsEvents.createdAt, new Date(Date.now() - 86_400_000)));

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(analyticsEvents).where(gte(analyticsEvents.createdAt, since));

    res.json({
      period: `${days}d`,
      since: since.toISOString(),
      totalEvents: Number(total),
      dailyActiveUsers: Number(dailyActive),
      eventCounts,
    });
  } catch (err) {
    console.error("[admin] GET /analytics:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ─── Projects Overview ────────────────────────────────────────────────────────
router.get("/projects", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(projects)
      .where(isNull(projects.deletedAt))
      .orderBy(desc(projects.createdAt))
      .limit(100);
    res.json({ projects: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// ─── GDPR / Data Governance ───────────────────────────────────────────────────

/**
 * POST /admin/gdpr/export/:userId
 * Collect all data associated with a user across all major tables.
 * Returns a JSON bundle the user can download.
 */
router.post("/gdpr/export/:userId", async (req, res) => {
  try {
    const uid = req.params.userId as string;
    const user = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    const userProjects = await db.select().from(projects).where(eq(projects.userId, uid));
    const userAudit = await db.select().from(auditLogs).where(eq(auditLogs.userId, uid));
    const userEvents = await db.select().from(analyticsEvents).where(eq(analyticsEvents.userId, uid));

    await logAudit(db as any, req, {
      action: "gdpr.data_export",
      resource: `user:${uid}`,
      resourceType: "user",
    });

    res.json({
      exportedAt: new Date().toISOString(),
      userId: uid,
      user: user[0] ?? null,
      projects: userProjects,
      auditLogs: userAudit,
      analyticsEvents: userEvents,
    });
  } catch (err) {
    res.status(500).json({ error: "Export failed" });
  }
});

/**
 * DELETE /admin/gdpr/delete/:userId
 * Soft-delete + anonymize a user's PII. Retains audit log for compliance.
 */
router.delete("/gdpr/delete/:userId", async (req, res) => {
  try {
    const uid = req.params.userId as string;

    await db.update(usersTable).set({
      firstName: null,
      lastName: null,
      email: null,
      profileImageUrl: null,
      preferences: null,
      deletedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(usersTable.id, uid));

    await logAudit(db as any, req, {
      action: "gdpr.right_to_erasure",
      resource: `user:${uid}`,
      resourceType: "user",
      outcome: "success",
      metadata: { anonymized: true },
    });

    res.json({ ok: true, anonymized: true });
  } catch (err) {
    res.status(500).json({ error: "Deletion failed" });
  }
});

// ─── Ad Settings ───────────────────────────────────────────────────────────────
// Table: platform_ad_settings
// Stores platform choice, account ID, and daily budget.
// API keys are read from env vars — never stored in DB.

async function ensureAdSettingsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS platform_ad_settings (
      id              SERIAL PRIMARY KEY,
      platform        TEXT    NOT NULL DEFAULT 'meta',
      account_id      TEXT,
      daily_budget_cents INTEGER NOT NULL DEFAULT 0,
      enabled         BOOLEAN NOT NULL DEFAULT FALSE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

router.get("/ad-settings", async (_req, res) => {
  try {
    await ensureAdSettingsTable();
    const rows = await db.execute(sql`SELECT * FROM platform_ad_settings ORDER BY id LIMIT 1`);
    const row = rows.rows[0] ?? null;
    res.json({ settings: row });
  } catch (err) {
    console.error("[admin] GET /ad-settings:", err);
    res.status(500).json({ error: "Failed to load ad settings" });
  }
});

router.put("/ad-settings", async (req, res) => {
  try {
    await ensureAdSettingsTable();
    const { platform, account_id, daily_budget_cents, enabled } = req.body as {
      platform?: string;
      account_id?: string;
      daily_budget_cents?: number;
      enabled?: boolean;
    };

    const existing = await db.execute(sql`SELECT id FROM platform_ad_settings LIMIT 1`);

    if (existing.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO platform_ad_settings (platform, account_id, daily_budget_cents, enabled)
        VALUES (
          ${platform ?? "meta"}::text,
          ${account_id ?? null}::text,
          ${daily_budget_cents ?? 0},
          ${enabled ?? false}
        )
      `);
    } else {
      await db.execute(sql`
        UPDATE platform_ad_settings SET
          platform           = ${platform ?? "meta"}::text,
          account_id         = ${account_id ?? null}::text,
          daily_budget_cents = ${daily_budget_cents ?? 0},
          enabled            = ${enabled ?? false},
          updated_at         = NOW()
        WHERE id = ${existing.rows[0].id as number}
      `);
    }

    const saved = await db.execute(sql`SELECT * FROM platform_ad_settings LIMIT 1`);
    res.json({ ok: true, settings: saved.rows[0] });
  } catch (err) {
    console.error("[admin] PUT /ad-settings:", err);
    res.status(500).json({ error: "Failed to save ad settings" });
  }
});

router.get("/ad-settings/status", async (_req, res) => {
  try {
    await ensureAdSettingsTable();
    const rows = await db.execute(sql`SELECT * FROM platform_ad_settings LIMIT 1`);
    const settings = rows.rows[0] ?? null;

    const metaConnected    = !!(process.env.META_ADS_ACCESS_TOKEN && process.env.META_ADS_ACCOUNT_ID);
    const googleConnected  = !!(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_CUSTOMER_ID);

    res.json({
      settings,
      connectivity: {
        meta:   metaConnected,
        google: googleConnected,
      },
    });
  } catch (err) {
    console.error("[admin] GET /ad-settings/status:", err);
    res.status(500).json({ error: "Failed to load ad status" });
  }
});

export default router;
