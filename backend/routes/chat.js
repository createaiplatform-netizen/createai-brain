/**
 * routes/chat.js — CRUD for chat sessions and messages
 *
 * GET    /chat                      — list all sessions
 * GET    /chat/:id                  — get session with messages
 * POST   /chat                      — create session
 * POST   /chat/:id/messages         — append a message to session
 * PUT    /chat/:id                  — update session metadata
 * DELETE /chat/:id                  — delete session
 * DELETE /chat/:id/messages/:msgId  — delete one message
 */

const express = require("express");
const { readArray, writeArray, generateId } = require("../storage");

const router = express.Router();
const FILE   = "chat.json";
const KEY    = "sessions";

// ── List all sessions ─────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  try {
    let sessions = readArray(FILE, KEY);
    if (req.query.userId) sessions = sessions.filter(s => s.userId === req.query.userId);

    const summary = sessions.map(({ id, title, userId, appId, messageCount, createdAt, updatedAt }) =>
      ({ id, title, userId, appId, messageCount: messageCount ?? 0, createdAt, updatedAt }));

    res.json({ sessions: summary, total: summary.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get one session (with messages) ───────────────────────────────────────────
router.get("/:id", (req, res) => {
  try {
    const sessions = readArray(FILE, KEY);
    const session  = sessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Create session ────────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  try {
    const { title = "New Chat", userId = null, appId = null, metadata = {} } = req.body;
    const now     = new Date().toISOString();
    const session = {
      id: generateId(), title, userId, appId,
      messages: [], messageCount: 0, metadata,
      createdAt: now, updatedAt: now,
    };

    const sessions = readArray(FILE, KEY);
    sessions.push(session);
    writeArray(FILE, KEY, sessions);
    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Append message ────────────────────────────────────────────────────────────
router.post("/:id/messages", (req, res) => {
  try {
    const sessions = readArray(FILE, KEY);
    const idx      = sessions.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Session not found" });

    const { role, content, metadata = {} } = req.body;
    if (!role)    return res.status(400).json({ error: "role is required (user|assistant|system)" });
    if (!content) return res.status(400).json({ error: "content is required" });

    const now     = new Date().toISOString();
    const message = { id: generateId(), role, content, metadata, createdAt: now };

    if (!Array.isArray(sessions[idx].messages)) sessions[idx].messages = [];
    sessions[idx].messages.push(message);
    sessions[idx].messageCount = sessions[idx].messages.length;
    sessions[idx].updatedAt    = now;

    writeArray(FILE, KEY, sessions);
    res.status(201).json({ message, sessionId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Update session metadata ───────────────────────────────────────────────────
router.put("/:id", (req, res) => {
  try {
    const sessions = readArray(FILE, KEY);
    const idx      = sessions.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Session not found" });

    const { title, metadata } = req.body;
    const now = new Date().toISOString();

    sessions[idx] = {
      ...sessions[idx],
      ...(title    !== undefined && { title }),
      ...(metadata !== undefined && { metadata: { ...sessions[idx].metadata, ...metadata } }),
      updatedAt: now,
    };

    writeArray(FILE, KEY, sessions);
    res.json({ session: sessions[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete session ────────────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  try {
    const sessions = readArray(FILE, KEY);
    const before   = sessions.length;
    const after    = sessions.filter(s => s.id !== req.params.id);
    if (after.length === before) return res.status(404).json({ error: "Session not found" });

    writeArray(FILE, KEY, after);
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete one message ────────────────────────────────────────────────────────
router.delete("/:id/messages/:msgId", (req, res) => {
  try {
    const sessions = readArray(FILE, KEY);
    const idx      = sessions.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Session not found" });

    const before = (sessions[idx].messages ?? []).length;
    sessions[idx].messages     = (sessions[idx].messages ?? []).filter(m => m.id !== req.params.msgId);
    sessions[idx].messageCount = sessions[idx].messages.length;
    sessions[idx].updatedAt    = new Date().toISOString();

    if (sessions[idx].messages.length === before) {
      return res.status(404).json({ error: "Message not found" });
    }

    writeArray(FILE, KEY, sessions);
    res.json({ deleted: true, msgId: req.params.msgId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
