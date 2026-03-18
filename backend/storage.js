/**
 * storage.js — Safe, atomic JSON file I/O helper
 *
 * All reads/writes go through this module.
 * Atomic writes: data is written to a .tmp file first, then renamed
 * so a crash mid-write never corrupts the target file.
 */

const fs   = require("fs");
const path = require("path");

const STORAGE_DIR = path.resolve(__dirname, "../storage");

// ── Default initial content for each storage file ────────────────────────────

const DEFAULTS = {
  "main.json": {
    version:      "1.0.0",
    createdAt:    new Date().toISOString(),
    lastModified: new Date().toISOString(),
    description:  "CreateAI Brain — local storage system",
  },
  "users.json":     { users: [] },
  "projects.json":  { projects: [] },
  "settings.json":  {
    settings: {
      theme:    "dark",
      language: "en",
      timezone: "UTC",
    },
  },
  "documents.json": { documents: [] },
  "chat.json":      { sessions: [] },
  "images.json":    { images: [] },
};

// ── Ensure storage directory and all required files exist ────────────────────

function ensureFiles() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    console.log(`[storage] Created directory: ${STORAGE_DIR}`);
  }

  for (const [filename, defaultData] of Object.entries(DEFAULTS)) {
    const filepath = path.join(STORAGE_DIR, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2), "utf8");
      console.log(`[storage] Created: ${filename}`);
    }
  }
}

// ── Read a JSON storage file ──────────────────────────────────────────────────

function readFile(filename) {
  const filepath = path.join(STORAGE_DIR, filename);
  try {
    const raw = fs.readFileSync(filepath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      const defaultData = DEFAULTS[filename] ?? {};
      writeFile(filename, defaultData);
      return defaultData;
    }
    throw new Error(`[storage] Failed to read ${filename}: ${err.message}`);
  }
}

// ── Write a JSON storage file atomically ─────────────────────────────────────

function writeFile(filename, data) {
  const filepath    = path.join(STORAGE_DIR, filename);
  const tmpFilepath = filepath + ".tmp";

  try {
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(tmpFilepath, json, "utf8");
    fs.renameSync(tmpFilepath, filepath);

    // Touch main.json lastModified on every write
    if (filename !== "main.json") {
      try {
        const main = readFile("main.json");
        main.lastModified = new Date().toISOString();
        const mainJson = JSON.stringify(main, null, 2);
        const mainPath = path.join(STORAGE_DIR, "main.json");
        fs.writeFileSync(mainPath + ".tmp", mainJson, "utf8");
        fs.renameSync(mainPath + ".tmp", mainPath);
      } catch (_) {}
    }
  } catch (err) {
    if (fs.existsSync(tmpFilepath)) {
      try { fs.unlinkSync(tmpFilepath); } catch (_) {}
    }
    throw new Error(`[storage] Failed to write ${filename}: ${err.message}`);
  }
}

// ── Convenience: read a top-level array from a file ──────────────────────────

function readArray(filename, key) {
  const data = readFile(filename);
  return Array.isArray(data[key]) ? data[key] : [];
}

// ── Convenience: write a top-level array back to a file ──────────────────────

function writeArray(filename, key, array) {
  const data  = readFile(filename);
  data[key]   = array;
  writeFile(filename, data);
}

// ── Generate a unique ID (no external deps) ───────────────────────────────────

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

module.exports = {
  ensureFiles,
  readFile,
  writeFile,
  readArray,
  writeArray,
  generateId,
  STORAGE_DIR,
};
