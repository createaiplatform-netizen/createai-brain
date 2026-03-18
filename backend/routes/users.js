/**
 * routes/users.js — CRUD for users
 *
 * GET    /users           — list all users
 * GET    /users/:id       — get one user
 * POST   /users           — create user
 * PUT    /users/:id       — update user
 * DELETE /users/:id       — delete user
 */

const express = require("express");
const { readArray, writeArray, generateId } = require("../storage");

const router = express.Router();
const FILE   = "users.json";
const KEY    = "users";

// ── List all ──────────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  try {
    const users = readArray(FILE, KEY);
    res.json({ users, total: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get one ───────────────────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  try {
    const users = readArray(FILE, KEY);
    const user  = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Create ────────────────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  try {
    const { name, email, role = "user", settings = {} } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const now   = new Date().toISOString();
    const user  = { id: generateId(), name, email: email || null, role, settings, createdAt: now, updatedAt: now };
    const users = readArray(FILE, KEY);

    if (email && users.find(u => u.email === email)) {
      return res.status(409).json({ error: "A user with that email already exists" });
    }

    users.push(user);
    writeArray(FILE, KEY, users);
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Update ────────────────────────────────────────────────────────────────────
router.put("/:id", (req, res) => {
  try {
    const users = readArray(FILE, KEY);
    const idx   = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "User not found" });

    const { name, email, role, settings } = req.body;
    const now = new Date().toISOString();

    users[idx] = {
      ...users[idx],
      ...(name     !== undefined && { name }),
      ...(email    !== undefined && { email }),
      ...(role     !== undefined && { role }),
      ...(settings !== undefined && { settings: { ...users[idx].settings, ...settings } }),
      updatedAt: now,
    };

    writeArray(FILE, KEY, users);
    res.json({ user: users[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  try {
    const users  = readArray(FILE, KEY);
    const before = users.length;
    const after  = users.filter(u => u.id !== req.params.id);
    if (after.length === before) return res.status(404).json({ error: "User not found" });

    writeArray(FILE, KEY, after);
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
