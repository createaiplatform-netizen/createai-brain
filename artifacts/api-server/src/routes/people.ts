import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, people } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const list = await db.select().from(people)
      .where(eq(people.userId, req.user.id))
      .orderBy(desc(people.createdAt));
    res.json({ people: list });
  } catch (err) {
    console.error("GET /people error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { name, email, phone, role, department, status, notes, isOwner } = req.body as {
    name: string; email?: string; phone?: string; role?: string;
    department?: string; status?: string; notes?: string; isOwner?: boolean;
  };
  if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
  try {
    const [person] = await db.insert(people).values({
      userId: req.user.id,
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      role: role?.trim() || "Member",
      department: department?.trim() || null,
      status: status || "Active",
      notes: notes?.trim() || null,
      avatarInitial: name.trim()[0]?.toUpperCase() || "?",
      isOwner: isOwner ?? false,
    }).returning();
    res.json({ person });
  } catch (err) {
    console.error("POST /people error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id);
  const { name, email, phone, role, department, status, notes } = req.body as {
    name?: string; email?: string; phone?: string; role?: string;
    department?: string; status?: string; notes?: string;
  };
  try {
    const [row] = await db.select().from(people)
      .where(and(eq(people.id, id), eq(people.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Person not found" }); return; }
    const [updated] = await db.update(people).set({
      ...(name !== undefined ? { name: name.trim(), avatarInitial: name.trim()[0]?.toUpperCase() } : {}),
      ...(email !== undefined ? { email: email.trim() || null } : {}),
      ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
      ...(role !== undefined ? { role: role.trim() } : {}),
      ...(department !== undefined ? { department: department.trim() || null } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(notes !== undefined ? { notes: notes.trim() || null } : {}),
      updatedAt: new Date(),
    }).where(eq(people.id, id)).returning();
    res.json({ person: updated });
  } catch (err) {
    console.error("PUT /people/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id);
  try {
    const [row] = await db.select().from(people)
      .where(and(eq(people.id, id), eq(people.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Person not found" }); return; }
    await db.delete(people).where(eq(people.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /people/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
