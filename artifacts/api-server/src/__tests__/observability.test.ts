/**
 * observability.test.ts — Error observability + system metrics tests
 */

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  const { default: app } = await import("../app.js");
  request = supertest(app);
});

describe("Observability: Error Endpoint", () => {
  it("GET /api/system/errors → 200 with event list", async () => {
    const res = await request.get("/api/system/errors");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.total).toBe("number");
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.bySeverity).toBeDefined();
  });

  it("POST /api/system/errors → 200 ingests an error event", async () => {
    const res = await request
      .post("/api/system/errors")
      .send({ message: "Test error from integration test", severity: "low", route: "/test" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.event.message).toBe("Test error from integration test");
    expect(res.body.event.severity).toBe("low");
  });

  it("POST /api/system/errors (no message) → 400", async () => {
    const res = await request.post("/api/system/errors").send({ severity: "high" });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("GET /api/system/errors after ingest → total > 0", async () => {
    const res = await request.get("/api/system/errors");
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it("DELETE /api/system/errors → 200 clears log", async () => {
    const res = await request.delete("/api/system/errors");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("GET /api/system/errors after clear → total = 0", async () => {
    const res = await request.get("/api/system/errors");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });
});

describe("Observability: Dashboard HTML", () => {
  it("GET /api/system/errors/dashboard → 200 HTML with severity stats", async () => {
    const res = await request.get("/api/system/errors/dashboard");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("Error Observability");
    expect(res.text).toContain("Heap Used");
  });
});

describe("Observability: System Metrics", () => {
  it("GET /api/system/errors/metrics → 200 with process metrics", async () => {
    const res = await request.get("/api/system/errors/metrics");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.memory).toBeDefined();
    expect(typeof res.body.memory.heapUsed).toBe("number");
    expect(typeof res.body.nodeVersion).toBe("string");
    expect(typeof res.body.pid).toBe("number");
  });
});

describe("Credentials: TWILIO_PHONE Now In Defs", () => {
  it("GET /api/credentials/status → includes TWILIO_PHONE", async () => {
    const res = await request.get("/api/credentials/status");
    expect(res.status).toBe(200);
    const creds = res.body.credentials as Array<{ key: string }>;
    const keys = creds.map(c => c.key);
    expect(keys).toContain("TWILIO_PHONE");
    expect(keys).toContain("SENTRY_DSN");
    expect(keys).toContain("SHOPIFY_ACCESS_TOKEN");
  });

  it("GET /api/credentials/defs → 7 defs including new ones", async () => {
    const res = await request.get("/api/credentials/defs");
    expect(res.status).toBe(200);
    expect(res.body.defs.length).toBeGreaterThanOrEqual(7);
  });
});
