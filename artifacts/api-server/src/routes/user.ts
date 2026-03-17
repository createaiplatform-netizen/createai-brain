import { Router } from "express";
import { eq } from "drizzle-orm";
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

export default router;
