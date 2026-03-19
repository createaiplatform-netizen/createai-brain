// ═══════════════════════════════════════════════════════════════════════════
// MEMORY ROUTES — Encrypted key-value store endpoints.
//
// POST   /api/memory/set            — encrypt + store a value
// GET    /api/memory/get?key=       — decrypt + return a value
// DELETE /api/memory/delete?key=    — remove a stored value
// GET    /api/memory/keys           — list all stored key names (no values)
//
// All routes require an authenticated session (req.user).
// Values are AES-256-GCM encrypted before storage. The raw encrypted
// string is never returned — only the decrypted value to its owner.
// ═══════════════════════════════════════════════════════════════════════════

import { Router } from "express";
import {
  saveMemory,
  loadMemory,
  deleteMemory,
  listMemoryKeys,
} from "../services/memoryService";

const router = Router();

// ─── POST /api/memory/set ─────────────────────────────────────────────────────

router.post("/set", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { key, value } = req.body as { key?: string; value?: string };
  if (!key || typeof key !== "string" || !key.trim()) {
    res.status(400).json({ error: "key is required" }); return;
  }
  if (value === undefined || value === null || typeof value !== "string") {
    res.status(400).json({ error: "value is required" }); return;
  }
  try {
    await saveMemory(req.user.id, key.trim(), value);
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /memory/set error:", err);
    res.status(500).json({ error: "Failed to save memory entry" });
  }
});

// ─── GET /api/memory/get?key= ────────────────────────────────────────────────

router.get("/get", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const key = typeof req.query.key === "string" ? req.query.key.trim() : "";
  if (!key) { res.status(400).json({ error: "key query param is required" }); return; }
  try {
    const value = await loadMemory(req.user.id, key);
    if (value === null) {
      res.status(404).json({ error: "Key not found" }); return;
    }
    res.json({ ok: true, value });
  } catch (err) {
    console.error("GET /memory/get error:", err);
    res.status(500).json({ error: "Failed to load memory entry" });
  }
});

// ─── DELETE /api/memory/delete?key= ─────────────────────────────────────────

router.delete("/delete", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const key = typeof req.query.key === "string" ? req.query.key.trim() : "";
  if (!key) { res.status(400).json({ error: "key query param is required" }); return; }
  try {
    await deleteMemory(req.user.id, key);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /memory/delete error:", err);
    res.status(500).json({ error: "Failed to delete memory entry" });
  }
});

// ─── GET /api/memory/keys ────────────────────────────────────────────────────

router.get("/keys", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const keys = await listMemoryKeys(req.user.id);
    res.json({ ok: true, keys });
  } catch (err) {
    console.error("GET /memory/keys error:", err);
    res.status(500).json({ error: "Failed to list memory keys" });
  }
});

export default router;
