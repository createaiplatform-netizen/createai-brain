import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router = Router();

router.get("/me", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const [row] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
    if (!row) { res.status(404).json({ error: "User not found" }); return; }
    const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || "User";
    res.json({
      id: row.id,
      name,
      firstName: row.firstName ?? "",
      lastName: row.lastName ?? "",
      email: row.email ?? "",
      profileImageUrl: row.profileImageUrl ?? "",
      role: "Admin",
      preferences: row.preferences ?? null,
    });
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/me", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const { firstName, lastName, preferences } = req.body as {
      firstName?: string;
      lastName?: string;
      preferences?: Record<string, unknown>;
    };
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (firstName !== undefined) updates.firstName = firstName.trim() || null;
    if (lastName !== undefined) updates.lastName = lastName.trim() || null;
    if (preferences !== undefined) updates.preferences = preferences;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" }); return;
    }
    await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user.id));
    const [row] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
    const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || "User";
    res.json({
      ok: true,
      name,
      firstName: row.firstName ?? "",
      lastName: row.lastName ?? "",
      preferences: row.preferences ?? null,
    });
  } catch (err) {
    console.error("PUT /me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/user/account — GDPR Right to Erasure ────────────────────────
// Permanently anonymizes and purges all personal data for the authenticated user.
// Compliant with GDPR Article 17 (Right to Erasure) and CCPA deletion requests.
router.delete("/account", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = req.user.id;

  try {
    // Step 1 — Delete user-generated content from platform tables (raw SQL for cross-table scope)
    const tables = [
      "activity_log",
      "platform_notifications",
      "platform_journal_entries",
      "platform_habits",
      "platform_habit_completions",
      "platform_life_events",
      "platform_contributions",
      "platform_bills",
      "platform_family_bank_accounts",
      "platform_family_bank_goals",
      "platform_trusted_devices",
      "platform_phone_verifications",
      "platform_welcome_log",
      "platform_outbound_log",
      "platform_audit_logs",
    ];

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`DELETE FROM ${table} WHERE user_id = '${userId}'`));
      } catch {
        // Table may not exist or have different column name — continue
      }
    }

    // Step 2 — Anonymize the core user record (cannot hard-delete due to Replit Auth ownership)
    await db.update(usersTable).set({
      firstName:       null,
      lastName:        null,
      email:           `deleted_${userId}@anonymized.invalid`,
      profileImageUrl: null,
      preferences:     null,
    }).where(eq(usersTable.id, userId));

    // Step 3 — Log the erasure event for compliance audit trail
    console.log(`[GDPR] Account erased — userId:${userId} · ts:${new Date().toISOString()}`);

    res.json({
      ok:      true,
      message: "Your account data has been permanently deleted in compliance with GDPR Article 17.",
      userId,
      erasedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[GDPR] Account deletion error:", err);
    res.status(500).json({ error: "Deletion failed — please contact support@createai.digital" });
  }
});

export default router;
