/**
 * routes/documents.js — CRUD for documents
 *
 * GET    /documents              — list all (supports ?userId= ?projectId= ?type=)
 * GET    /documents/:id          — get one
 * POST   /documents              — create
 * PUT    /documents/:id          — update
 * DELETE /documents/:id          — delete
 */

const express = require("express");
const { readArray, writeArray, generateId } = require("../storage");

const router = express.Router();
const FILE   = "documents.json";
const KEY    = "documents";

// ── List all ──────────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  try {
    let docs = readArray(FILE, KEY);
    if (req.query.userId)    docs = docs.filter(d => d.userId    === req.query.userId);
    if (req.query.projectId) docs = docs.filter(d => d.projectId === req.query.projectId);
    if (req.query.type)      docs = docs.filter(d => d.type      === req.query.type);

    const summary = docs.map(({ id, title, type, userId, projectId, isPinned, tags, createdAt, updatedAt }) =>
      ({ id, title, type, userId, projectId, isPinned, tags, createdAt, updatedAt }));

    res.json({ documents: summary, total: summary.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get one ───────────────────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  try {
    const docs = readArray(FILE, KEY);
    const doc  = docs.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Create ────────────────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  try {
    const {
      title, content = "", type = "text", userId = null,
      projectId = null, tags = [], isPinned = false, isTemplate = false, metadata = {},
    } = req.body;

    if (!title) return res.status(400).json({ error: "title is required" });

    const now = new Date().toISOString();
    const doc = {
      id: generateId(), title, content, type, userId, projectId,
      tags, isPinned, isTemplate, metadata, createdAt: now, updatedAt: now,
    };

    const docs = readArray(FILE, KEY);
    docs.push(doc);
    writeArray(FILE, KEY, docs);
    res.status(201).json({ document: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Update ────────────────────────────────────────────────────────────────────
router.put("/:id", (req, res) => {
  try {
    const docs = readArray(FILE, KEY);
    const idx  = docs.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Document not found" });

    const { title, content, type, tags, isPinned, isTemplate, metadata } = req.body;
    const now = new Date().toISOString();

    docs[idx] = {
      ...docs[idx],
      ...(title      !== undefined && { title }),
      ...(content    !== undefined && { content }),
      ...(type       !== undefined && { type }),
      ...(tags       !== undefined && { tags }),
      ...(isPinned   !== undefined && { isPinned }),
      ...(isTemplate !== undefined && { isTemplate }),
      ...(metadata   !== undefined && { metadata: { ...docs[idx].metadata, ...metadata } }),
      updatedAt: now,
    };

    writeArray(FILE, KEY, docs);
    res.json({ document: docs[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  try {
    const docs   = readArray(FILE, KEY);
    const before = docs.length;
    const after  = docs.filter(d => d.id !== req.params.id);
    if (after.length === before) return res.status(404).json({ error: "Document not found" });

    writeArray(FILE, KEY, after);
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
