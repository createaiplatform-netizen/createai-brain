/**
 * routes/projects.js — CRUD for projects
 *
 * GET    /projects              — list all (supports ?userId=)
 * GET    /projects/:id          — get one
 * POST   /projects              — create
 * PUT    /projects/:id          — update
 * DELETE /projects/:id          — delete
 */

const express = require("express");
const { readArray, writeArray, generateId } = require("../storage");

const router = express.Router();
const FILE   = "projects.json";
const KEY    = "projects";

// ── List all ──────────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  try {
    let projects = readArray(FILE, KEY);
    if (req.query.userId) projects = projects.filter(p => p.userId === req.query.userId);
    if (req.query.status)  projects = projects.filter(p => p.status === req.query.status);
    res.json({ projects, total: projects.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get one ───────────────────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  try {
    const projects = readArray(FILE, KEY);
    const project  = projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Create ────────────────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  try {
    const { name, description = "", userId = null, status = "active", tags = [], metadata = {} } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const now     = new Date().toISOString();
    const project = {
      id: generateId(), name, description, userId, status,
      tags, metadata, createdAt: now, updatedAt: now,
    };

    const projects = readArray(FILE, KEY);
    projects.push(project);
    writeArray(FILE, KEY, projects);
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Update ────────────────────────────────────────────────────────────────────
router.put("/:id", (req, res) => {
  try {
    const projects = readArray(FILE, KEY);
    const idx      = projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Project not found" });

    const { name, description, status, tags, metadata } = req.body;
    const now = new Date().toISOString();

    projects[idx] = {
      ...projects[idx],
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(status      !== undefined && { status }),
      ...(tags        !== undefined && { tags }),
      ...(metadata    !== undefined && { metadata: { ...projects[idx].metadata, ...metadata } }),
      updatedAt: now,
    };

    writeArray(FILE, KEY, projects);
    res.json({ project: projects[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  try {
    const projects = readArray(FILE, KEY);
    const before   = projects.length;
    const after    = projects.filter(p => p.id !== req.params.id);
    if (after.length === before) return res.status(404).json({ error: "Project not found" });

    writeArray(FILE, KEY, after);
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
