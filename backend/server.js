/**
 * server.js — CreateAI Brain local backend
 *
 * Fully local, zero-cost, zero-external-dependencies.
 * Uses only Node.js built-ins + express.
 *
 * Start:  node backend/server.js
 * Port:   LOCAL_PORT env var (default 3001)
 */

const express = require("express");
const path    = require("path");
const { ensureFiles } = require("./storage");

// ── Ensure storage directory and all JSON files exist before routes load ──────
ensureFiles();

// ── App setup ─────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.LOCAL_PORT || 3001;

// JSON body parsing (up to 50mb to support base64 images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS — open for local development
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/users",     require("./routes/users"));
app.use("/projects",  require("./routes/projects"));
app.use("/settings",  require("./routes/settings"));
app.use("/documents", require("./routes/documents"));
app.use("/chat",      require("./routes/chat"));
app.use("/images",    require("./routes/images"));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  const { readFile } = require("./storage");
  const main = readFile("main.json");
  res.json({
    status:       "ok",
    version:      main.version,
    createdAt:    main.createdAt,
    lastModified: main.lastModified,
    uptime:       process.uptime(),
    port:         PORT,
  });
});

// ── Storage info ──────────────────────────────────────────────────────────────
app.get("/storage-info", (_req, res) => {
  const { readArray, STORAGE_DIR } = require("./storage");
  try {
    res.json({
      storageDir: STORAGE_DIR,
      counts: {
        users:     readArray("users.json",     "users").length,
        projects:  readArray("projects.json",  "projects").length,
        documents: readArray("documents.json", "documents").length,
        chat:      readArray("chat.json",      "sessions").length,
        images:    readArray("images.json",    "images").length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error:     "Not found",
    path:      req.path,
    available: ["/users", "/projects", "/settings", "/documents", "/chat", "/images", "/health", "/storage-info"],
  });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[error]", err.message);
  res.status(500).json({ error: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("");
  console.log("╔══════════════════════════════════════╗");
  console.log(`║  CreateAI Brain — Local Backend       ║`);
  console.log(`║  http://localhost:${PORT}               ║`);
  console.log("╠══════════════════════════════════════╣");
  console.log("║  Routes:                              ║");
  console.log("║    GET/POST/PUT/DELETE /users         ║");
  console.log("║    GET/POST/PUT/DELETE /projects      ║");
  console.log("║    GET/PUT/DELETE      /settings      ║");
  console.log("║    GET/POST/PUT/DELETE /documents     ║");
  console.log("║    GET/POST/PUT/DELETE /chat          ║");
  console.log("║    GET/POST/PUT/DELETE /images        ║");
  console.log("║    GET                 /health        ║");
  console.log("║    GET                 /storage-info  ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("");
});

module.exports = app;
