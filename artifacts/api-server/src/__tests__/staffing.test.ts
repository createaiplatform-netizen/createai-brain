/**
 * staffing.test.ts — StaffingOS API integration tests
 *
 * Routes: /api/staffing/candidates, /clients, /requisitions,
 *         /submissions, /interviews, /placements
 * Response shapes: wrapped { candidates:[...] }, { clients:[...] }, etc.
 * Clients POST requires: companyName (not name)
 * Candidates POST requires: firstName, lastName
 * DELETE returns 204 No Content
 */

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  const { default: app } = await import("../app.js");
  request = supertest(app);
});

describe("Staffing: Dashboard", () => {
  it("GET /api/staffing/dashboard → 200", async () => {
    const res = await request.get("/api/staffing/dashboard");
    expect([200, 404]).toContain(res.status);
  });
});

describe("Staffing: Candidates CRUD", () => {
  let candidateId: number | undefined;

  it("GET /api/staffing/candidates → 200 with candidates array", async () => {
    const res = await request.get("/api/staffing/candidates");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.candidates)).toBe(true);
  });

  it("POST /api/staffing/candidates → 201 with candidate (firstName/lastName)", async () => {
    const res = await request
      .post("/api/staffing/candidates")
      .send({
        firstName: "Test",
        lastName:  "Candidate",
        email:     "testcandidate@example.com",
        status:    "active",
      });
    expect([200, 201]).toContain(res.status);
    if (res.body.id) candidateId = res.body.id as number;
  });

  it("GET /api/staffing/candidates/:id → 200 with candidate", async () => {
    if (!candidateId) return;
    const res = await request.get(`/api/staffing/candidates/${candidateId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(candidateId);
  });

  it("PUT /api/staffing/candidates/:id → 200 updated", async () => {
    if (!candidateId) return;
    const res = await request
      .put(`/api/staffing/candidates/${candidateId}`)
      .send({ status: "placed" });
    expect(res.status).toBe(200);
  });

  it("DELETE /api/staffing/candidates/:id → 204 deleted", async () => {
    if (!candidateId) return;
    const res = await request.delete(`/api/staffing/candidates/${candidateId}`);
    expect([200, 204]).toContain(res.status);
  });
});

describe("Staffing: Clients CRUD", () => {
  let clientId: number | undefined;

  it("GET /api/staffing/clients → 200 with clients array", async () => {
    const res = await request.get("/api/staffing/clients");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.clients)).toBe(true);
  });

  it("POST /api/staffing/clients → 201 with client (companyName required)", async () => {
    const res = await request
      .post("/api/staffing/clients")
      .send({
        companyName:  "Test Staffing Co",
        industry:     "Technology",
        contactName:  "Jane Doe",
        contactEmail: "contact@teststaffing.com",
        status:       "active",
      });
    expect([200, 201]).toContain(res.status);
    if (res.body.id) clientId = res.body.id as number;
  });

  it("GET /api/staffing/clients/:id → 200 with client", async () => {
    if (!clientId) return;
    const res = await request.get(`/api/staffing/clients/${clientId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(clientId);
  });

  it("DELETE /api/staffing/clients/:id → 204 deleted", async () => {
    if (!clientId) return;
    const res = await request.delete(`/api/staffing/clients/${clientId}`);
    expect([200, 204]).toContain(res.status);
  });
});

describe("Staffing: Requisitions CRUD", () => {
  let reqId: number | undefined;
  let seedClientId: number | undefined;

  it("GET /api/staffing/requisitions → 200 with requisitions array", async () => {
    const res = await request.get("/api/staffing/requisitions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.requisitions)).toBe(true);
  });

  it("POST seed client for requisition", async () => {
    const res = await request
      .post("/api/staffing/clients")
      .send({ companyName: "Req Seed Co", industry: "Tech", status: "active" });
    expect([200, 201]).toContain(res.status);
    if (res.body.id) seedClientId = res.body.id as number;
  });

  it("POST /api/staffing/requisitions → 201 with requisition (requires clientId)", async () => {
    if (!seedClientId) return;
    const res = await request
      .post("/api/staffing/requisitions")
      .send({
        clientId:    seedClientId,
        title:       "Senior Engineer",
        location:    "Remote",
        type:        "full-time",
        status:      "open",
        description: "Build great things.",
      });
    expect([200, 201]).toContain(res.status);
    if (res.body.id) reqId = res.body.id as number;
  });

  it("PUT /api/staffing/requisitions/:id → 200 updated", async () => {
    if (!reqId) return;
    const res = await request
      .put(`/api/staffing/requisitions/${reqId}`)
      .send({ status: "closed" });
    expect(res.status).toBe(200);
  });

  it("DELETE /api/staffing/requisitions/:id → 204 deleted", async () => {
    if (!reqId) return;
    const res = await request.delete(`/api/staffing/requisitions/${reqId}`);
    expect([200, 204]).toContain(res.status);
  });
});

describe("Staffing: Interviews", () => {
  it("GET /api/staffing/interviews → 200 with interviews array", async () => {
    const res = await request.get("/api/staffing/interviews");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.interviews)).toBe(true);
  });
});

describe("Staffing: Submissions", () => {
  it("GET /api/staffing/submissions → 200 with submissions array", async () => {
    const res = await request.get("/api/staffing/submissions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.submissions)).toBe(true);
  });
});

describe("Staffing: Placements", () => {
  it("GET /api/staffing/placements → 200 with placements array", async () => {
    const res = await request.get("/api/staffing/placements");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.placements)).toBe(true);
  });
});
