/**
 * new-routes.test.ts — T009+T012+T013+T006+T007: Integration tests
 * Tests for: email dashboard, marketplace hub, financial hub,
 *             execute endpoint, Resend DNS records
 */

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  const { default: app } = await import("../app.js");
  request = supertest(app);
});

// ─── Email Dashboard (T013) ────────────────────────────────────────────────────

describe("Email Dashboard — /api/email", () => {
  it("GET /api/email/status → 200 with ok:true and structured payload", async () => {
    const res = await request.get("/api/email/status");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty("emailConfigured");
    expect(res.body).toHaveProperty("fromConfigured");
    expect(res.body).toHaveProperty("emailsSentTotal");
    expect(res.body).toHaveProperty("smsSentTotal");
    expect(res.body).toHaveProperty("transactionalTriggers");
    expect(Array.isArray(res.body.transactionalTriggers)).toBe(true);
    expect(res.body.transactionalTriggers.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty("dnsVerification");
    expect(res.body.dnsVerification).toHaveProperty("endpoint");
  });

  it("GET /api/email/dashboard → 200 HTML page", async () => {
    const res = await request.get("/api/email/dashboard");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("Email Dashboard");
    expect(res.text).toContain("Resend");
    expect(res.text).toContain("Transactional Email Triggers");
    expect(res.text).toContain("skip-link"); // accessibility
    expect(res.text).toContain("aria-");     // aria attributes
    expect(res.text).toContain("Inter");     // font
  });

  it("GET /api/email/status — transactionalTriggers has wired and pending events", async () => {
    const res = await request.get("/api/email/status");
    const triggers = res.body.transactionalTriggers as Array<{ status: string }>;
    const wired   = triggers.filter(t => t.status === "wired");
    const pending = triggers.filter(t => t.status === "pending");
    expect(wired.length).toBeGreaterThanOrEqual(4);
    expect(pending.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /api/email/test → 200 with to field (sandbox may fail but structure is correct)", async () => {
    const res = await request
      .post("/api/email/test")
      .send({ to: "sivh@mail.com" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok");
    expect(res.body).toHaveProperty("to");
    expect(res.body.to).toBe("sivh@mail.com");
    expect(res.body).toHaveProperty("results");
    expect(Array.isArray(res.body.results)).toBe(true);
  });
});

// ─── Marketplace Activation (T012) ────────────────────────────────────────────

describe("Marketplace Hub — /api/marketplace-hub", () => {
  it("GET /api/marketplace-hub/status → 200 with channel list", async () => {
    const res = await request.get("/api/marketplace-hub/status");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty("configured");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("channels");
    expect(Array.isArray(res.body.channels)).toBe(true);
    expect(res.body.channels.length).toBe(5); // Shopify, Etsy, Amazon, eBay, CreativeMarket
  });

  it("GET /api/marketplace-hub/status — channels have required fields", async () => {
    const res = await request.get("/api/marketplace-hub/status");
    const channels = res.body.channels as Array<{
      name: string; configured: boolean; capability: string; key: string;
    }>;
    for (const ch of channels) {
      expect(ch).toHaveProperty("name");
      expect(ch).toHaveProperty("configured");
      expect(ch).toHaveProperty("capability");
      expect(ch).toHaveProperty("key");
      expect(typeof ch.configured).toBe("boolean");
    }
    const names = channels.map(c => c.name);
    expect(names).toContain("Shopify");
    expect(names).toContain("Etsy");
    expect(names).toContain("Amazon");
    expect(names).toContain("eBay");
    expect(names).toContain("CreativeMarket");
  });

  it("GET /api/marketplace-hub/dashboard → 200 HTML page", async () => {
    const res = await request.get("/api/marketplace-hub/dashboard");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("Marketplace Activation");
    expect(res.text).toContain("Shopify");
    expect(res.text).toContain("Etsy");
    expect(res.text).toContain("Amazon");
    expect(res.text).toContain("eBay");
    expect(res.text).toContain("CreativeMarket");
    expect(res.text).toContain("skip-link"); // accessibility
    expect(res.text).toContain("aria-");     // aria attributes
    expect(res.text).toContain("Inter");     // font
  });

  it("POST /api/marketplace-hub/probe/invalid → 404", async () => {
    const res = await request
      .post("/api/marketplace-hub/probe/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/Unknown channel/);
  });

  it("POST /api/marketplace-hub/probe/shopify → returns not configured when no token", async () => {
    const res = await request
      .post("/api/marketplace-hub/probe/shopify");
    expect(res.status).toBe(200);
    expect(res.body.channel).toBe("Shopify");
    // No SHOPIFY_ACCESS_TOKEN set so configured should be false
    expect(res.body.configured).toBe(false);
    expect(res.body).toHaveProperty("getKeyUrl");
  });

  it("GET /api/marketplace-hub/status — activation endpoint references correct routes", async () => {
    const res = await request.get("/api/marketplace-hub/status");
    expect(res.body.activation).toHaveProperty("internalCredentialsRoute");
    expect(res.body.activation.internalCredentialsRoute).toBe("/api/credentials/set");
  });
});

// ─── Financial Hub Redirects (T006) ───────────────────────────────────────────

describe("Financial Hub — /api/finance", () => {
  it("GET /api/finance/hub → 200 with route map", async () => {
    const res = await request.get("/api/finance/hub");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty("routes");
    expect(res.body.routes).toHaveProperty("records");
    expect(res.body.routes).toHaveProperty("wealth");
    expect(res.body.routes).toHaveProperty("ledger");
    expect(res.body.routes).toHaveProperty("revenueIntel");
    expect(res.body.routes).toHaveProperty("vault");
    expect(res.body).toHaveProperty("shortcuts");
  });

  it("GET /api/finance/wealth → 301 redirect to /api/wealth", async () => {
    const res = await request.get("/api/finance/wealth");
    expect(res.status).toBe(301);
    expect(res.headers["location"]).toBe("/api/wealth");
  });

  it("GET /api/finance/ledger → 301 redirect to /api/ledger", async () => {
    const res = await request.get("/api/finance/ledger");
    expect(res.status).toBe(301);
    expect(res.headers["location"]).toBe("/api/ledger");
  });

  it("GET /api/finance/revenue-intel → 301 redirect to /api/revenue-intel", async () => {
    const res = await request.get("/api/finance/revenue-intel");
    expect(res.status).toBe(301);
    expect(res.headers["location"]).toBe("/api/revenue-intel");
  });
});

// ─── Execute Endpoint (T007) ──────────────────────────────────────────────────

describe("Autonomous Execute — /api/above-transcend/execute", () => {
  it("POST /api/above-transcend/execute without auth → 401", async () => {
    const res = await request
      .post("/api/above-transcend/execute")
      .send({ actionType: "log_only" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("POST /api/above-transcend/execute is a real endpoint (not 404)", async () => {
    // Without auth we should get 401, not 404. Confirms route is mounted.
    const res = await request
      .post("/api/above-transcend/execute")
      .send({ actionType: "log_only" });
    expect(res.status).not.toBe(404);
    // Should be 401 (auth gate) rather than 404 (route not found)
    expect(res.status).toBe(401);
  });

  it("POST /api/above-transcend/execute returns JSON with error field on 401", async () => {
    const res = await request
      .post("/api/above-transcend/execute")
      .send({ actionType: "email_campaign" });
    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toBe("Unauthorized");
  });

  it("GET /api/above-transcend/next-moves without auth → 401 (execute relies on same auth)", async () => {
    const res = await request.get("/api/above-transcend/next-moves");
    expect(res.status).toBe(401);
  });

  it("POST /api/above-transcend/run without auth → 401", async () => {
    const res = await request.post("/api/above-transcend/run").send({});
    expect(res.status).toBe(401);
  });
});

// ─── Resend DNS Records (T013) ────────────────────────────────────────────────

describe("Resend DNS Records — /api/credentials/dns-records", () => {
  it("GET /api/credentials/dns-records → 200 with domain info", async () => {
    const res = await request.get("/api/credentials/dns-records");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok");
    expect(res.body).toHaveProperty("domain");
    expect(res.body).toHaveProperty("instructions");
    // Either records or actionUrl for manual entry
    const hasRecords  = Array.isArray(res.body.records);
    const hasAction   = typeof res.body.actionUrl === "string";
    expect(hasRecords || hasAction).toBe(true);
  });
});
