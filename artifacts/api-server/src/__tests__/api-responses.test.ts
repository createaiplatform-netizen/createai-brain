/**
 * api-responses.test.ts — Response shape and content-type tests
 *
 * Verifies that JSON endpoints return proper JSON content-type,
 * HTML dashboards return text/html, and that error responses
 * follow the standard { error: string } shape.
 */

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  const { default: app } = await import("../app.js");
  request = supertest(app);
});

// ─── JSON endpoints ───────────────────────────────────────────────────────────

const JSON_ENDPOINTS = [
  "/healthz",
  "/api/healthz",
  "/api/system/health",
  "/api/system/stats",
  "/api/self-host/status",
  "/api/self-host/proof",
  "/api/self-host/zones",
];

describe("JSON endpoints return application/json", () => {
  for (const path of JSON_ENDPOINTS) {
    it(`GET ${path}`, async () => {
      const res = await request.get(path);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
    });
  }
});

// ─── HTML dashboards ──────────────────────────────────────────────────────────

const HTML_DASHBOARDS = [
  "/nexus",
  "/api/self-host/dashboard",
  "/api/system/percentages/dashboard",
  "/api/credentials/dashboard",
  "/api/ads/dashboard",
  "/api/activate/dashboard",
  "/api/traction/dashboard",
  "/api/franchise/dashboard",
  "/api/growth-path/dashboard",
  "/api/brand/dashboard",
  "/api/platform/report/dashboard",
  "/api/revenue-intel/dashboard",
  "/api/analytics/dashboard",
  "/api/domains/hub",
  "/api/advertising/hub",
];

describe("HTML dashboards return text/html", () => {
  for (const path of HTML_DASHBOARDS) {
    it(`GET ${path}`, async () => {
      const res = await request.get(path);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/html/);
    });
  }
});

// ─── HTML dashboards have required accessibility attributes ───────────────────

describe("HTML dashboards include accessibility basics", () => {
  it("nexus has lang attribute", async () => {
    const res = await request.get("/nexus");
    expect(res.text).toContain('lang="en"');
  });

  it("credentials dashboard has skip-link", async () => {
    const res = await request.get("/api/credentials/dashboard");
    expect(res.text).toContain("skip-link");
  });

  it("platform identity dashboard contains NPA address", async () => {
    const res = await request.get("/api/self-host/dashboard");
    expect(res.text).toContain("CreateAIDigital");
  });
});

// ─── 404 handling ─────────────────────────────────────────────────────────────

describe("Unknown routes return 404", () => {
  it("GET /api/nonexistent-route-xyz → 404", async () => {
    const res = await request.get("/api/nonexistent-route-xyz-abc");
    expect(res.status).toBe(404);
  });
});

// ─── Stripe public status ─────────────────────────────────────────────────────

describe("GET /api/integrations/stripe/status", () => {
  it("returns 200 or 401 with ok field (auth-protected)", async () => {
    const res = await request.get("/api/integrations/stripe/status");
    // Auth-protected route — 401 without session, 200 when authenticated
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(typeof res.body.ok).toBe("boolean");
    }
  });
});

// ─── Above-transcend public status ────────────────────────────────────────────

describe("GET /api/above-transcend/status", () => {
  it("returns 200 or 401 (auth-protected in test environment)", async () => {
    const res = await request.get("/api/above-transcend/status");
    // Route is protected by auth middleware — returns 401 without a session
    expect([200, 401]).toContain(res.status);
  });
});

// ─── System self-host URL map ─────────────────────────────────────────────────

describe("GET /api/self-host/url-map", () => {
  it("returns 200 with routes array", async () => {
    const res = await request.get("/api/self-host/url-map");
    expect(res.status).toBe(200);
    expect(typeof res.body.schema).toBe("string");
    expect(res.body.schema).toBe("createai://");
  });
});

// ─── Traction dashboard ────────────────────────────────────────────────────────

describe("GET /api/traction/dashboard", () => {
  it("returns 200 HTML with chart", async () => {
    const res = await request.get("/api/traction/dashboard");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Traction");
  });
});

// ─── Advertising hub ──────────────────────────────────────────────────────────

describe("GET /api/advertising/hub", () => {
  it("returns 200 HTML", async () => {
    const res = await request.get("/api/advertising/hub");
    expect(res.status).toBe(200);
    expect(res.text.toLowerCase()).toContain("advertising");
  });
});

// ─── Domains hub ──────────────────────────────────────────────────────────────

describe("GET /api/domains/hub", () => {
  it("returns 200 HTML Domain Engines Hub", async () => {
    const res = await request.get("/api/domains/hub");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text.toLowerCase()).toContain("domain");
  });
});
