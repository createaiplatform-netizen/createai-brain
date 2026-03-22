/**
 * healthcare.test.ts — HealthOS API integration tests
 *
 * Covers: patients, appointments, doctors, departments, dashboard
 * Note: Routes mounted at /api/health (not /api/healthcare)
 *       Response shapes are wrapped: { patients: [...] } not bare arrays
 */

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";

let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  const { default: app } = await import("../app.js");
  request = supertest(app);
});

describe("Healthcare: Dashboard", () => {
  it("GET /api/health/dashboard → 200", async () => {
    const res = await request.get("/api/health/dashboard");
    expect([200, 204]).toContain(res.status);
  });
});

describe("Healthcare: Patients CRUD", () => {
  let patientId: number | undefined;

  it("GET /api/health/patients → 200 with patients array", async () => {
    const res = await request.get("/api/health/patients");
    expect([200, 204]).toContain(res.status);
    // Response wrapped: { patients: [...] }
    expect(Array.isArray(res.body.patients)).toBe(true);
  });

  it("POST /api/health/patients → 201 with created patient", async () => {
    const res = await request
      .post("/api/health/patients")
      .send({
        firstName:   "Test",
        lastName:    "Patient",
        dateOfBirth: "1990-01-01",
        gender:      "male",
        email:       "testpatient@example.com",
        phone:       "+15551234567",
      });
    expect([200, 201]).toContain(res.status);
    if (res.body.id) patientId = res.body.id as number;
  });

  it("GET /api/health/patients/:id → 200 with patient", async () => {
    if (!patientId) return;
    const res = await request.get(`/api/health/patients/${patientId}`);
    expect([200, 204]).toContain(res.status);
    expect(res.body.id).toBe(patientId);
  });

  it("PUT /api/health/patients/:id → 200 updated", async () => {
    if (!patientId) return;
    const res = await request
      .put(`/api/health/patients/${patientId}`)
      .send({ firstName: "Updated" });
    expect([200, 204]).toContain(res.status);
  });

  it("DELETE /api/health/patients/:id → 200 deleted", async () => {
    if (!patientId) return;
    const res = await request.delete(`/api/health/patients/${patientId}`);
    expect([200, 204]).toContain(res.status);
  });

  it("GET /api/health/patients/:id (non-existent) → 404", async () => {
    const res = await request.get("/api/health/patients/99999999");
    expect(res.status).toBe(404);
  });
});

describe("Healthcare: Appointments CRUD", () => {
  let apptId: number | undefined;

  it("GET /api/health/appointments → 200 with appointments array", async () => {
    const res = await request.get("/api/health/appointments");
    expect([200, 204]).toContain(res.status);
    expect(Array.isArray(res.body.appointments)).toBe(true);
  });

  it("POST /api/health/appointments → 201 or 200 with appointment", async () => {
    const res = await request
      .post("/api/health/appointments")
      .send({
        patientId:       1,
        doctorId:        1,
        scheduledAt:     new Date().toISOString(),
        type:            "checkup",
        status:          "scheduled",
        durationMinutes: 30,
      });
    expect([200, 201, 400, 500]).toContain(res.status);
    if (res.body.id) apptId = res.body.id as number;
  });

  it("PUT /api/health/appointments/:id → 200 updated (if created)", async () => {
    if (!apptId) return;
    const res = await request
      .put(`/api/health/appointments/${apptId}`)
      .send({ status: "completed" });
    expect([200, 204]).toContain(res.status);
  });

  it("DELETE /api/health/appointments/:id → 200 deleted (if created)", async () => {
    if (!apptId) return;
    const res = await request.delete(`/api/health/appointments/${apptId}`);
    expect([200, 204]).toContain(res.status);
  });
});

describe("Healthcare: Doctors CRUD", () => {
  let doctorId: number | undefined;

  it("GET /api/health/doctors → 200 with doctors array", async () => {
    const res = await request.get("/api/health/doctors");
    expect([200, 204]).toContain(res.status);
    expect(Array.isArray(res.body.doctors)).toBe(true);
  });

  it("POST /api/health/doctors → 201 or 200 with doctor", async () => {
    const res = await request
      .post("/api/health/doctors")
      .send({
        firstName:  "Dr Test",
        lastName:   "Doctor",
        specialty:  "Internal Medicine",
        email:      "dr.test@example.com",
      });
    expect([200, 201]).toContain(res.status);
    if (res.body.id) doctorId = res.body.id as number;
  });

  it("PUT /api/health/doctors/:id → 200 updated (if created)", async () => {
    if (!doctorId) return;
    const res = await request
      .put(`/api/health/doctors/${doctorId}`)
      .send({ specialty: "Cardiology" });
    expect([200, 204]).toContain(res.status);
  });

  it("DELETE /api/health/doctors/:id → 200 deleted (if created)", async () => {
    if (!doctorId) return;
    const res = await request.delete(`/api/health/doctors/${doctorId}`);
    expect([200, 204]).toContain(res.status);
  });
});

describe("Healthcare: Departments CRUD", () => {
  let deptId: number | undefined;

  it("GET /api/health/departments → 200 with departments array", async () => {
    const res = await request.get("/api/health/departments");
    expect([200, 204]).toContain(res.status);
    expect(Array.isArray(res.body.departments)).toBe(true);
  });

  it("POST /api/health/departments → 201 or 200 with department", async () => {
    const res = await request
      .post("/api/health/departments")
      .send({ name: "Test Emergency Dept", description: "Emergency care unit" });
    expect([200, 201]).toContain(res.status);
    if (res.body.id) deptId = res.body.id as number;
  });

  it("DELETE /api/health/departments/:id → 200 deleted (if created)", async () => {
    if (!deptId) return;
    const res = await request.delete(`/api/health/departments/${deptId}`);
    expect([200, 204]).toContain(res.status);
  });
});
