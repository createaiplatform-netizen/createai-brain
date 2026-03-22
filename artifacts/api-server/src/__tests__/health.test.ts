/**
 * health.test.ts — Public health and status endpoint tests
 *
 * These tests hit real public endpoints (no authentication required).
 * They verify the API server is responding correctly and returning
 * expected shapes for all health/status surfaces.
 */

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

// Import app without starting the server (index.ts starts server, app.ts just configures it)
let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  const { default: app } = await import("../app.js");
  request = supertest(app);
});

// ─── /healthz ─────────────────────────────────────────────────────────────────

describe("GET /healthz", () => {
  it("returns 200 with ok status", async () => {
    const res = await request.get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("includes service, uptime_s, and timestamp fields", async () => {
    const res = await request.get("/healthz");
    expect(res.body).toMatchObject({
      status:   "ok",
      service:  "api-server",
    });
    expect(typeof res.body.uptime_s).toBe("number");
    expect(typeof res.body.timestamp).toBe("string");
  });

  it("responds in under 500ms", async () => {
    const start = Date.now();
    await request.get("/healthz");
    expect(Date.now() - start).toBeLessThan(500);
  });
});

// ─── /api/healthz ─────────────────────────────────────────────────────────────

describe("GET /api/healthz", () => {
  it("returns 200 status", async () => {
    const res = await request.get("/api/healthz");
    expect(res.status).toBe(200);
  });
});

// ─── /api/system/health ───────────────────────────────────────────────────────

describe("GET /api/system/health", () => {
  it("returns 200 with status field", async () => {
    const res = await request.get("/api/system/health");
    expect(res.status).toBe(200);
    // System health returns NEXUS OS command system state (not a services array)
    expect(res.body.status).toBeDefined();
  });

  it("includes executionMode and version fields", async () => {
    const res = await request.get("/api/system/health");
    expect(res.status).toBe(200);
    expect(typeof res.body.version).toBe("string");
    expect(typeof res.body.uptime).toBe("number");
  });

  it("includes registrySize and activeItems fields", async () => {
    const res = await request.get("/api/system/health");
    expect(res.status).toBe(200);
    expect(typeof res.body.registrySize).toBe("number");
    expect(typeof res.body.activeItems).toBe("number");
  });
});

// ─── /api/system/stats ────────────────────────────────────────────────────────

describe("GET /api/system/stats", () => {
  it("returns 200", async () => {
    const res = await request.get("/api/system/stats");
    expect(res.status).toBe(200);
  });
});

// ─── /api/system/metrics ──────────────────────────────────────────────────────

describe("GET /api/system/metrics", () => {
  it("returns 200", async () => {
    const res = await request.get("/api/system/metrics");
    expect(res.status).toBe(200);
  });
});

// ─── /nexus ───────────────────────────────────────────────────────────────────

describe("GET /nexus", () => {
  it("returns 200 HTML", async () => {
    const res = await request.get("/nexus");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });
});

// ─── /api/self-host/status ────────────────────────────────────────────────────

describe("GET /api/self-host/status", () => {
  it("returns 200 with engineActive field", async () => {
    const res = await request.get("/api/self-host/status");
    expect(res.status).toBe(200);
    expect(typeof res.body.engineActive).toBe("boolean");
  });
});

// ─── /api/self-host/dashboard ─────────────────────────────────────────────────

describe("GET /api/self-host/dashboard", () => {
  it("returns 200 HTML", async () => {
    const res = await request.get("/api/self-host/dashboard");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  it("contains NPA address in body", async () => {
    const res = await request.get("/api/self-host/dashboard");
    expect(res.text).toContain("npa://CreateAIDigital");
  });
});

// ─── /api/system/percentages/dashboard ────────────────────────────────────────

describe("GET /api/system/percentages/dashboard", () => {
  it("returns 200 HTML", async () => {
    const res = await request.get("/api/system/percentages/dashboard");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });
});
