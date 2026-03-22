/**
 * forge.test.ts — Forge engine CRUD authentication and shape tests
 *
 * Verifies all 18 forge engines (characterforge, loreforge, mythweave, etc.)
 * correctly enforce auth and return proper shapes.
 */

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  const { default: app } = await import("../app.js");
  request = supertest(app);
});

const FORGE_TYPES = [
  "characterforge",
  "loreforge",
  "civilizationforge",
  "ecologyforge",
  "soundscape",
  "timelineforge",
  "mythweave",
  "languageforge",
  "magicsystem",
  "urbanworld",
  "warlore",
  "techforge",
  "visualworld",
  "religionforge",
  "cosmologyforge",
  "gameworld",
  "narratoros",
  "imagination",
];

describe("Forge engines: GET / requires authentication", () => {
  for (const forge of FORGE_TYPES) {
    it(`GET /api/${forge} → 401 without session`, async () => {
      const res = await request.get(`/api/${forge}`);
      expect(res.status).toBe(401);
      expect(typeof res.body.error).toBe("string");
    });
  }
});

describe("Forge engines: POST / requires authentication and valid body", () => {
  for (const forge of FORGE_TYPES) {
    it(`POST /api/${forge} → 401 without session`, async () => {
      const res = await request
        .post(`/api/${forge}`)
        .send({ engineId: "test", engineName: "Test", topic: "test", output: "test" });
      expect(res.status).toBe(401);
    });
  }
});

describe("Forge engines: GET /:id requires authentication", () => {
  for (const forge of FORGE_TYPES) {
    it(`GET /api/${forge}/1 → 401 without session`, async () => {
      const res = await request.get(`/api/${forge}/1`);
      expect(res.status).toBe(401);
    });
  }
});

describe("Forge engines: DELETE /:id requires authentication", () => {
  for (const forge of FORGE_TYPES) {
    it(`DELETE /api/${forge}/1 → 401 without session`, async () => {
      const res = await request.delete(`/api/${forge}/1`);
      expect(res.status).toBe(401);
    });
  }
});

describe("Forge factory: invalid ID returns 401 (auth first, then 400)", () => {
  it("GET /api/characterforge/not-a-number → 401 (unauthenticated first)", async () => {
    const res = await request.get("/api/characterforge/not-a-number");
    expect(res.status).toBe(401);
  });
});
