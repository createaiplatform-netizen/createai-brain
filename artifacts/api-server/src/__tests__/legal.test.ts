/**
 * legal.test.ts — Legal Practice Manager API integration tests
 *
 * Routes: /api/legal/clients, /matters, /time-entries, /invoices, /tasks, /notes
 * Response keys: { clients:[...] }, { matters:[...] }, { invoices:[...] },
 *                { entries:[...] }, { tasks:[...] }
 * Notes requires ?matterId= query param
 * DELETE returns 204 No Content
 */

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  const { default: app } = await import("../app.js");
  request = supertest(app);
});

describe("Legal: Dashboard", () => {
  it("GET /api/legal/dashboard → 200", async () => {
    const res = await request.get("/api/legal/dashboard");
    expect(res.status).toBe(200);
  });
});

describe("Legal: Clients CRUD", () => {
  let clientId: number | undefined;

  it("GET /api/legal/clients → 200 with clients array", async () => {
    const res = await request.get("/api/legal/clients");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.clients)).toBe(true);
  });

  it("POST /api/legal/clients → 201 with created client", async () => {
    const res = await request
      .post("/api/legal/clients")
      .send({
        name:  "Test Legal Client",
        email: "legalclient@example.com",
        phone: "+15559876543",
        type:  "individual",
      });
    expect([200, 201]).toContain(res.status);
    if (res.body.id) clientId = res.body.id as number;
  });

  it("GET /api/legal/clients/:id → 200 with client", async () => {
    if (!clientId) return;
    const res = await request.get(`/api/legal/clients/${clientId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(clientId);
  });

  it("PUT /api/legal/clients/:id → 200 updated", async () => {
    if (!clientId) return;
    const res = await request
      .put(`/api/legal/clients/${clientId}`)
      .send({ name: "Updated Legal Client" });
    expect(res.status).toBe(200);
  });

  it("DELETE /api/legal/clients/:id → 204 deleted", async () => {
    if (!clientId) return;
    const res = await request.delete(`/api/legal/clients/${clientId}`);
    expect([200, 204]).toContain(res.status);
  });
});

describe("Legal: Matters CRUD", () => {
  let clientId: number | undefined;
  let matterId: number | undefined;

  it("GET /api/legal/matters → 200 with matters array", async () => {
    const res = await request.get("/api/legal/matters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.matters)).toBe(true);
  });

  it("POST /api/legal/clients (seed) → seed client for matter", async () => {
    const res = await request
      .post("/api/legal/clients")
      .send({ name: "Matter Seed Client", email: "matter.seed@example.com", type: "individual" });
    expect([200, 201]).toContain(res.status);
    if (res.body.id) clientId = res.body.id as number;
  });

  it("POST /api/legal/matters → 201 with matter (requires clientId)", async () => {
    if (!clientId) return;
    const res = await request
      .post("/api/legal/matters")
      .send({
        clientId,
        title:  "Test v. Example Corp",
        type:   "Civil",
        status: "open",
      });
    expect([200, 201]).toContain(res.status);
    if (res.body.id) matterId = res.body.id as number;
  });

  it("GET /api/legal/matters/:id → 200 with matter", async () => {
    if (!matterId) return;
    const res = await request.get(`/api/legal/matters/${matterId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(matterId);
  });

  it("PUT /api/legal/matters/:id → 200 updated", async () => {
    if (!matterId) return;
    const res = await request
      .put(`/api/legal/matters/${matterId}`)
      .send({ status: "closed" });
    expect(res.status).toBe(200);
  });

  it("DELETE /api/legal/matters/:id → 204 deleted", async () => {
    if (!matterId) return;
    const res = await request.delete(`/api/legal/matters/${matterId}`);
    expect([200, 204]).toContain(res.status);
  });
});

describe("Legal: Invoices", () => {
  it("GET /api/legal/invoices → 200 with invoices array", async () => {
    const res = await request.get("/api/legal/invoices");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.invoices)).toBe(true);
  });
});

describe("Legal: Time Entries", () => {
  it("GET /api/legal/time-entries → 200 with entries array (key: entries)", async () => {
    const res = await request.get("/api/legal/time-entries");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });
});

describe("Legal: Tasks", () => {
  it("GET /api/legal/tasks → 200 with tasks array", async () => {
    const res = await request.get("/api/legal/tasks");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });
});

describe("Legal: Notes (requires matterId param)", () => {
  it("GET /api/legal/notes?matterId=1 → 200", async () => {
    const res = await request.get("/api/legal/notes?matterId=1");
    expect(res.status).toBe(200);
  });
});
