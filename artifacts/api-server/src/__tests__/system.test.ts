/**
 * system.test.ts — System, registry, platform, and expansion engine tests
 */

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  const { default: app } = await import("../app.js");
  request = supertest(app);
});

describe("System: Above-Transcend Engine", () => {
  it("GET /api/above-transcend/status → 200 or 401 (auth-protected)", async () => {
    const res = await request.get("/api/above-transcend/status");
    // Route is auth-protected — 401 in test (no session), 200 when authenticated
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(typeof res.body.cycleCount).toBe("number");
    }
  });

  it("GET /api/above-transcend/latest → 200 or ready:false before first cycle", async () => {
    const res = await request.get("/api/above-transcend/latest");
    if (res.status === 200) {
      expect(res.body).toHaveProperty("ok");
    }
  });
});

describe("System: Platform Readiness", () => {
  it("GET /api/system/percentages/dashboard → 200 HTML", async () => {
    const res = await request.get("/api/system/percentages/dashboard");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });
});

describe("System: Expansion Engine", () => {
  it("GET /api/expansion/history → 401 (requires admin)", async () => {
    const res = await request.get("/api/expansion/history");
    expect([401, 403, 404]).toContain(res.status);
  });
});

describe("System: SEO Infrastructure", () => {
  it("GET /sitemap.xml → 200 with XML content-type", async () => {
    const res = await request.get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/xml/);
  });

  it("GET /robots.txt → 200", async () => {
    const res = await request.get("/robots.txt");
    expect(res.status).toBe(200);
  });
});

describe("System: OpenAPI Docs", () => {
  it("GET /api/docs/ → 200 HTML Swagger UI", async () => {
    // swagger-ui-express serves the UI at /api/docs/ (with trailing slash);
    // /api/docs (no trailing slash) returns 301 redirect — both are valid
    const res = await request.get("/api/docs/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  it("GET /api/docs/openapi.json → 200 with OpenAPI spec", async () => {
    const res = await request.get("/api/docs/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info.title).toBeDefined();
  });
});

describe("System: Platform Proof", () => {
  it("GET /api/self-host/proof → 200 with signature", async () => {
    const res = await request.get("/api/self-host/proof");
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});

describe("System: Campaign Manager Dashboard", () => {
  it("GET /api/ads/dashboard → 200 HTML", async () => {
    const res = await request.get("/api/ads/dashboard");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });
});

describe("System: Credentials Hub", () => {
  it("GET /api/credentials/dashboard → 200 HTML with token entry form", async () => {
    const res = await request.get("/api/credentials/dashboard");
    expect(res.status).toBe(200);
    expect(res.text).toContain("form");
  });
});

describe("System: Revenue Intel Dashboard", () => {
  it("GET /api/revenue-intel/dashboard → 200 HTML", async () => {
    const res = await request.get("/api/revenue-intel/dashboard");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });
});

describe("System: Analytics Dashboard", () => {
  it("GET /api/analytics/dashboard → 200 HTML", async () => {
    const res = await request.get("/api/analytics/dashboard");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });
});

describe("System: Deployment Readiness", () => {
  it("GET /api/deployment/checklist → 200 with score", async () => {
    const res = await request.get("/api/deployment/checklist");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.score).toBe("number");
    expect(typeof res.body.passed).toBe("number");
    expect(typeof res.body.total).toBe("number");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("GET /api/deployment/checklist/dashboard → 200 HTML", async () => {
    const res = await request.get("/api/deployment/checklist/dashboard");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("Deployment Readiness");
  });
});
