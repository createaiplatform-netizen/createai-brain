/**
 * routes/settings.js — Key/value settings store
 *
 * GET    /settings         — get all settings
 * GET    /settings/:key    — get one setting value
 * PUT    /settings         — bulk update (deep merge)
 * PUT    /settings/:key    — set a specific key
 * DELETE /settings/:key    — delete a specific key
 */

const express = require("express");
const { readFile, writeFile } = require("../storage");

const router = express.Router();
const FILE   = "settings.json";

function getSettings() {
  const data = readFile(FILE);
  return data.settings ?? {};
}

function saveSettings(settings) {
  writeFile(FILE, { settings });
}

// ── Get all ───────────────────────────────────────────────────────────────────
router.get("/", (_req, res) => {
  try {
    res.json({ settings: getSettings() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get one key ───────────────────────────────────────────────────────────────
router.get("/:key", (req, res) => {
  try {
    const settings = getSettings();
    const key      = req.params.key;
    if (!(key in settings)) return res.status(404).json({ error: `Setting "${key}" not found` });
    res.json({ key, value: settings[key] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Bulk update (merge) ───────────────────────────────────────────────────────
router.put("/", (req, res) => {
  try {
    if (typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Body must be a JSON object of key/value pairs" });
    }
    const settings = { ...getSettings(), ...req.body };
    saveSettings(settings);
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Set one key ───────────────────────────────────────────────────────────────
router.put("/:key", (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: "value is required in body" });

    const settings    = getSettings();
    settings[req.params.key] = value;
    saveSettings(settings);
    res.json({ key: req.params.key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete one key ────────────────────────────────────────────────────────────
router.delete("/:key", (req, res) => {
  try {
    const settings = getSettings();
    const key      = req.params.key;
    if (!(key in settings)) return res.status(404).json({ error: `Setting "${key}" not found` });

    delete settings[key];
    saveSettings(settings);
    res.json({ deleted: true, key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
