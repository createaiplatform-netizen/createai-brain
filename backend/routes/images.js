/**
 * routes/images.js — CRUD for images
 *
 * Images are stored as either:
 *   - base64 data URIs (field: data)
 *   - external/local references (field: url)
 *
 * GET    /images              — list all (metadata only, no base64 data)
 * GET    /images/:id          — get one (includes base64 data if stored)
 * GET    /images/:id/data     — get raw base64 data string only
 * POST   /images              — create (provide data or url)
 * PUT    /images/:id          — update metadata or replace data
 * DELETE /images/:id          — delete
 */

const express = require("express");
const { readArray, writeArray, generateId } = require("../storage");

const router = express.Router();
const FILE   = "images.json";
const KEY    = "images";

// ── List all (metadata only — no base64 blobs in list) ───────────────────────
router.get("/", (req, res) => {
  try {
    let images = readArray(FILE, KEY);
    if (req.query.userId)    images = images.filter(i => i.userId    === req.query.userId);
    if (req.query.projectId) images = images.filter(i => i.projectId === req.query.projectId);

    const summary = images.map(({ id, name, mimeType, size, url, hasData, userId, projectId, tags, metadata, createdAt, updatedAt }) =>
      ({ id, name, mimeType, size, url, hasData: !!hasData, userId, projectId, tags, metadata, createdAt, updatedAt }));

    res.json({ images: summary, total: summary.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get one (with data) ───────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  try {
    const images = readArray(FILE, KEY);
    const image  = images.find(i => i.id === req.params.id);
    if (!image) return res.status(404).json({ error: "Image not found" });
    res.json({ image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get raw base64 data only ──────────────────────────────────────────────────
router.get("/:id/data", (req, res) => {
  try {
    const images = readArray(FILE, KEY);
    const image  = images.find(i => i.id === req.params.id);
    if (!image)       return res.status(404).json({ error: "Image not found" });
    if (!image.data)  return res.status(404).json({ error: "Image has no stored data (url-reference only)" });
    res.json({ id: image.id, data: image.data, mimeType: image.mimeType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Create ────────────────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  try {
    const {
      name = "untitled", data = null, url = null, mimeType = "image/png",
      userId = null, projectId = null, tags = [], metadata = {},
    } = req.body;

    if (!data && !url) {
      return res.status(400).json({ error: "Either data (base64) or url is required" });
    }

    const size = data ? Math.round(data.length * 0.75) : null;
    const now  = new Date().toISOString();

    const image = {
      id: generateId(), name, data, url, mimeType,
      size, hasData: !!data, userId, projectId,
      tags, metadata, createdAt: now, updatedAt: now,
    };

    const images = readArray(FILE, KEY);
    images.push(image);
    writeArray(FILE, KEY, images);

    const { data: _omit, ...summary } = image;
    res.status(201).json({ image: { ...summary, hasData: !!data } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Update ────────────────────────────────────────────────────────────────────
router.put("/:id", (req, res) => {
  try {
    const images = readArray(FILE, KEY);
    const idx    = images.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Image not found" });

    const { name, data, url, mimeType, tags, metadata } = req.body;
    const now = new Date().toISOString();

    images[idx] = {
      ...images[idx],
      ...(name     !== undefined && { name }),
      ...(data     !== undefined && { data, hasData: !!data, size: data ? Math.round(data.length * 0.75) : null }),
      ...(url      !== undefined && { url }),
      ...(mimeType !== undefined && { mimeType }),
      ...(tags     !== undefined && { tags }),
      ...(metadata !== undefined && { metadata: { ...images[idx].metadata, ...metadata } }),
      updatedAt: now,
    };

    writeArray(FILE, KEY, images);
    const { data: _omit, ...summary } = images[idx];
    res.json({ image: { ...summary, hasData: !!images[idx].data } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  try {
    const images = readArray(FILE, KEY);
    const before = images.length;
    const after  = images.filter(i => i.id !== req.params.id);
    if (after.length === before) return res.status(404).json({ error: "Image not found" });

    writeArray(FILE, KEY, after);
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
