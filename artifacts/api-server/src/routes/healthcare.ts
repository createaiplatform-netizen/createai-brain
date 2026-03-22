import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, and, sql, ilike, or } from "drizzle-orm";
import {
  db,
  healthDepartments, healthDoctors, healthPatients,
  healthAppointments, healthMedicalRecords, healthPrescriptions, healthBilling,
} from "@workspace/db";

const router: IRouter = Router();

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [totalPatientsRow] = await db.select({ count: sql<number>`count(*)::int` }).from(healthPatients).where(eq(healthPatients.status, "active"));
    const [activeDoctorsRow] = await db.select({ count: sql<number>`count(*)::int` }).from(healthDoctors).where(eq(healthDoctors.status, "active"));
    const [todayApptRow]     = await db.select({ count: sql<number>`count(*)::int` }).from(healthAppointments).where(and(sql`${healthAppointments.scheduledAt} >= ${todayStart}`, sql`${healthAppointments.scheduledAt} < ${todayEnd}`));
    const [pendingBillsRow]  = await db.select({ count: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(amount),0)::float` }).from(healthBilling).where(eq(healthBilling.status, "pending"));

    const recentPatients = await db.select({
      id: healthPatients.id, firstName: healthPatients.firstName, lastName: healthPatients.lastName,
      gender: healthPatients.gender, status: healthPatients.status, bloodType: healthPatients.bloodType,
      allergies: healthPatients.allergies, email: healthPatients.email, phone: healthPatients.phone,
      address: healthPatients.address, dateOfBirth: healthPatients.dateOfBirth,
      primaryDoctorId: healthPatients.primaryDoctorId, departmentId: healthPatients.departmentId, createdAt: healthPatients.createdAt,
    }).from(healthPatients).orderBy(desc(healthPatients.createdAt)).limit(5);

    const upcomingAppts = await db.select({
      id: healthAppointments.id, patientId: healthAppointments.patientId, doctorId: healthAppointments.doctorId,
      departmentId: healthAppointments.departmentId, scheduledAt: healthAppointments.scheduledAt,
      durationMinutes: healthAppointments.durationMinutes, type: healthAppointments.type, status: healthAppointments.status,
      notes: healthAppointments.notes, createdAt: healthAppointments.createdAt,
      patientName: sql<string>`(select first_name || ' ' || last_name from health_patients hp where hp.id = health_appointments.patient_id)`,
      doctorName:  sql<string>`(select first_name || ' ' || last_name from health_doctors hd where hd.id = health_appointments.doctor_id)`,
    })
      .from(healthAppointments)
      .where(sql`${healthAppointments.scheduledAt} >= ${now}`)
      .orderBy(healthAppointments.scheduledAt)
      .limit(8);

    res.json({
      totalPatients: totalPatientsRow?.count ?? 0,
      todayAppointments: todayApptRow?.count ?? 0,
      activeDoctors: activeDoctorsRow?.count ?? 0,
      pendingBills: pendingBillsRow?.count ?? 0,
      pendingBillAmount: pendingBillsRow?.total ?? 0,
      recentPatients: recentPatients.map(p => formatPatient(p as any)),
      upcomingAppointments: upcomingAppts.map(a => formatAppt(a as any)),
    });
  } catch (err) { console.error("[healthcare] dashboard", err); res.status(500).json({ error: "Failed" }); }
});

function formatPatient(p: any) {
  return {
    ...p,
    dateOfBirth: p.dateOfBirth instanceof Date ? p.dateOfBirth.toISOString() : p.dateOfBirth ?? null,
    createdAt:   p.createdAt instanceof Date   ? p.createdAt.toISOString()   : p.createdAt,
  };
}
function formatAppt(a: any) {
  return {
    ...a,
    scheduledAt: a.scheduledAt instanceof Date ? a.scheduledAt.toISOString() : a.scheduledAt,
    createdAt:   a.createdAt   instanceof Date ? a.createdAt.toISOString()   : a.createdAt,
  };
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
router.get("/patients", async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query as { search?: string; status?: string };
    const rows = await db.select({
      id: healthPatients.id, firstName: healthPatients.firstName, lastName: healthPatients.lastName,
      gender: healthPatients.gender, status: healthPatients.status, bloodType: healthPatients.bloodType,
      allergies: healthPatients.allergies, email: healthPatients.email, phone: healthPatients.phone,
      address: healthPatients.address, dateOfBirth: healthPatients.dateOfBirth,
      primaryDoctorId: healthPatients.primaryDoctorId, departmentId: healthPatients.departmentId, createdAt: healthPatients.createdAt,
      primaryDoctorName: sql<string>`coalesce((select first_name || ' ' || last_name from health_doctors hd where hd.id = health_patients.primary_doctor_id), null)`,
      departmentName:    sql<string>`coalesce((select name from health_departments hd where hd.id = health_patients.department_id), null)`,
    })
      .from(healthPatients)
      .where(
        and(
          status ? eq(healthPatients.status, status) : undefined,
          search ? or(ilike(healthPatients.firstName, `%${search}%`), ilike(healthPatients.lastName, `%${search}%`)) : undefined,
        )
      )
      .orderBy(desc(healthPatients.createdAt));
    res.json({ patients: rows.map(p => formatPatient(p)) });
  } catch (err) { console.error("[healthcare] patients", err); res.status(500).json({ error: "Failed" }); }
});

router.post("/patients", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, dateOfBirth, gender = "other", email, phone, address, bloodType, allergies, status = "active", primaryDoctorId, departmentId } = req.body;
    const [row] = await db.insert(healthPatients).values({
      firstName, lastName, gender, email: email || null, phone: phone || null,
      address: address || null, bloodType: bloodType || null, allergies: allergies || null,
      status, primaryDoctorId: primaryDoctorId || null, departmentId: departmentId || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    }).returning();
    res.status(201).json(formatPatient(row));
  } catch (err) { console.error("[healthcare] POST patient", err); res.status(500).json({ error: "Failed" }); }
});

router.get("/patients/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const [patient] = await db.select({
      id: healthPatients.id, firstName: healthPatients.firstName, lastName: healthPatients.lastName,
      gender: healthPatients.gender, status: healthPatients.status, bloodType: healthPatients.bloodType,
      allergies: healthPatients.allergies, email: healthPatients.email, phone: healthPatients.phone,
      address: healthPatients.address, dateOfBirth: healthPatients.dateOfBirth,
      primaryDoctorId: healthPatients.primaryDoctorId, departmentId: healthPatients.departmentId, createdAt: healthPatients.createdAt,
      primaryDoctorName: sql<string>`coalesce((select first_name || ' ' || last_name from health_doctors hd where hd.id = health_patients.primary_doctor_id), null)`,
      departmentName:    sql<string>`coalesce((select name from health_departments hd where hd.id = health_patients.department_id), null)`,
    }).from(healthPatients).where(eq(healthPatients.id, id));
    if (!patient) { res.status(404).json({ error: "Not found" }); return; }

    const appointments   = await db.select({ id: healthAppointments.id, patientId: healthAppointments.patientId, doctorId: healthAppointments.doctorId, departmentId: healthAppointments.departmentId, scheduledAt: healthAppointments.scheduledAt, durationMinutes: healthAppointments.durationMinutes, type: healthAppointments.type, status: healthAppointments.status, notes: healthAppointments.notes, createdAt: healthAppointments.createdAt, doctorName: sql<string>`coalesce((select first_name || ' ' || last_name from health_doctors hd where hd.id = health_appointments.doctor_id), null)` }).from(healthAppointments).where(eq(healthAppointments.patientId, id)).orderBy(desc(healthAppointments.scheduledAt));
    const medicalRecords = await db.select({ id: healthMedicalRecords.id, patientId: healthMedicalRecords.patientId, doctorId: healthMedicalRecords.doctorId, visitDate: healthMedicalRecords.visitDate, chiefComplaint: healthMedicalRecords.chiefComplaint, diagnosis: healthMedicalRecords.diagnosis, treatment: healthMedicalRecords.treatment, notes: healthMedicalRecords.notes, followUpDate: healthMedicalRecords.followUpDate, createdAt: healthMedicalRecords.createdAt, doctorName: sql<string>`coalesce((select first_name || ' ' || last_name from health_doctors hd where hd.id = health_medical_records.doctor_id), null)` }).from(healthMedicalRecords).where(eq(healthMedicalRecords.patientId, id)).orderBy(desc(healthMedicalRecords.visitDate));
    const prescriptions  = await db.select({ id: healthPrescriptions.id, patientId: healthPrescriptions.patientId, doctorId: healthPrescriptions.doctorId, medication: healthPrescriptions.medication, dosage: healthPrescriptions.dosage, frequency: healthPrescriptions.frequency, startDate: healthPrescriptions.startDate, endDate: healthPrescriptions.endDate, refills: healthPrescriptions.refills, status: healthPrescriptions.status, notes: healthPrescriptions.notes, createdAt: healthPrescriptions.createdAt, doctorName: sql<string>`coalesce((select first_name || ' ' || last_name from health_doctors hd where hd.id = health_prescriptions.doctor_id), null)` }).from(healthPrescriptions).where(eq(healthPrescriptions.patientId, id)).orderBy(desc(healthPrescriptions.createdAt));
    const bills          = await db.select().from(healthBilling).where(eq(healthBilling.patientId, id)).orderBy(desc(healthBilling.createdAt));

    res.json({
      ...formatPatient(patient),
      appointments:  appointments.map(a => formatAppt(a as any)),
      medicalRecords: medicalRecords.map(r => ({ ...r, visitDate: r.visitDate instanceof Date ? r.visitDate.toISOString() : r.visitDate, followUpDate: r.followUpDate instanceof Date ? r.followUpDate.toISOString() : null, createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt })),
      prescriptions: prescriptions.map(p => ({ ...p, startDate: p.startDate instanceof Date ? p.startDate.toISOString() : p.startDate, endDate: p.endDate instanceof Date ? p.endDate.toISOString() : null, createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt })),
      bills: bills.map(b => ({ ...b, amount: Number(b.amount), insuranceCoverage: Number(b.insuranceCoverage ?? 0), patientOwes: b.patientOwes ? Number(b.patientOwes) : null, dueDate: b.dueDate instanceof Date ? b.dueDate.toISOString() : null, paidDate: b.paidDate instanceof Date ? b.paidDate.toISOString() : null, createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt })),
    });
  } catch (err) { console.error("[healthcare] GET patient/:id", err); res.status(500).json({ error: "Failed" }); }
});

router.put("/patients/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const { firstName, lastName, dateOfBirth, gender, email, phone, address, bloodType, allergies, status, primaryDoctorId, departmentId } = req.body;
    const updates: Record<string, unknown> = {};
    if (firstName !== undefined)  updates.firstName = firstName;
    if (lastName !== undefined)   updates.lastName  = lastName;
    if (gender !== undefined)     updates.gender    = gender;
    if (status !== undefined)     updates.status    = status;
    if (email !== undefined)      updates.email     = email || null;
    if (phone !== undefined)      updates.phone     = phone || null;
    if (address !== undefined)    updates.address   = address || null;
    if (bloodType !== undefined)  updates.bloodType = bloodType || null;
    if (allergies !== undefined)  updates.allergies = allergies || null;
    if (primaryDoctorId !== undefined) updates.primaryDoctorId = primaryDoctorId || null;
    if (departmentId !== undefined)    updates.departmentId    = departmentId || null;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    const [row] = await db.update(healthPatients).set(updates as any).where(eq(healthPatients.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatPatient(row));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/patients/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(healthPatients).where(eq(healthPatients.id, Number(req.params.id as string)));
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
router.get("/appointments", async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, date } = req.query as { patientId?: string; doctorId?: string; date?: string };
    const conditions: any[] = [];
    if (patientId) conditions.push(eq(healthAppointments.patientId, Number(patientId)));
    if (doctorId)  conditions.push(eq(healthAppointments.doctorId, Number(doctorId)));
    if (date) {
      const d = new Date(date); const next = new Date(d); next.setDate(next.getDate() + 1);
      conditions.push(and(sql`${healthAppointments.scheduledAt} >= ${d}`, sql`${healthAppointments.scheduledAt} < ${next}`));
    }
    const rows = await db.select({
      id: healthAppointments.id, patientId: healthAppointments.patientId, doctorId: healthAppointments.doctorId,
      departmentId: healthAppointments.departmentId, scheduledAt: healthAppointments.scheduledAt,
      durationMinutes: healthAppointments.durationMinutes, type: healthAppointments.type, status: healthAppointments.status,
      notes: healthAppointments.notes, createdAt: healthAppointments.createdAt,
      patientName: sql<string>`coalesce((select first_name || ' ' || last_name from health_patients hp where hp.id = health_appointments.patient_id), null)`,
      doctorName:  sql<string>`coalesce((select first_name || ' ' || last_name from health_doctors hd where hd.id = health_appointments.doctor_id), null)`,
      departmentName: sql<string>`coalesce((select name from health_departments hd where hd.id = health_appointments.department_id), null)`,
    })
      .from(healthAppointments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(healthAppointments.scheduledAt));
    res.json({ appointments: rows.map(a => formatAppt(a as any)) });
  } catch (err) { console.error("[healthcare] appointments", err); res.status(500).json({ error: "Failed" }); }
});

router.post("/appointments", async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, departmentId, scheduledAt, durationMinutes = 30, type = "check-up", status = "scheduled", notes } = req.body;
    const [row] = await db.insert(healthAppointments).values({ patientId, doctorId, departmentId: departmentId || null, scheduledAt: new Date(scheduledAt), durationMinutes, type, status, notes: notes || null }).returning();
    res.status(201).json(formatAppt(row as any));
  } catch (err) { console.error("[healthcare] POST appointment", err); res.status(500).json({ error: "Failed" }); }
});

router.put("/appointments/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const updates: Record<string, unknown> = {};
    const { patientId, doctorId, departmentId, scheduledAt, durationMinutes, type, status, notes } = req.body;
    if (patientId  !== undefined) updates.patientId  = patientId;
    if (doctorId   !== undefined) updates.doctorId   = doctorId;
    if (departmentId !== undefined) updates.departmentId = departmentId || null;
    if (scheduledAt  !== undefined) updates.scheduledAt  = new Date(scheduledAt);
    if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
    if (type   !== undefined) updates.type   = type;
    if (status !== undefined) updates.status = status;
    if (notes  !== undefined) updates.notes  = notes || null;
    const [row] = await db.update(healthAppointments).set(updates as any).where(eq(healthAppointments.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatAppt(row as any));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/appointments/:id", async (req: Request, res: Response) => {
  try { await db.delete(healthAppointments).where(eq(healthAppointments.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── DOCTORS ──────────────────────────────────────────────────────────────────
router.get("/doctors", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select({
      id: healthDoctors.id, firstName: healthDoctors.firstName, lastName: healthDoctors.lastName,
      specialty: healthDoctors.specialty, departmentId: healthDoctors.departmentId,
      email: healthDoctors.email, phone: healthDoctors.phone, licenseNumber: healthDoctors.licenseNumber,
      status: healthDoctors.status, createdAt: healthDoctors.createdAt,
      departmentName: sql<string>`coalesce((select name from health_departments hd where hd.id = health_doctors.department_id), null)`,
    }).from(healthDoctors).orderBy(healthDoctors.lastName);
    const patientCounts = await db.select({ doctorId: healthPatients.primaryDoctorId, count: sql<number>`count(*)::int` }).from(healthPatients).groupBy(healthPatients.primaryDoctorId);
    const countMap = Object.fromEntries(patientCounts.map(c => [c.doctorId, c.count]));
    res.json({ doctors: rows.map(d => ({ ...d, createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt, patientCount: countMap[d.id] ?? 0 })) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/doctors", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, specialty, departmentId, email, phone, licenseNumber, status = "active" } = req.body;
    const [row] = await db.insert(healthDoctors).values({ firstName, lastName, specialty, departmentId: departmentId || null, email: email || null, phone: phone || null, licenseNumber: licenseNumber || null, status }).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt, patientCount: 0 });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/doctors/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const updates: Record<string, unknown> = {};
    const { firstName, lastName, specialty, departmentId, email, phone, licenseNumber, status } = req.body;
    if (firstName !== undefined) updates.firstName = firstName; if (lastName !== undefined) updates.lastName = lastName;
    if (specialty !== undefined) updates.specialty = specialty; if (status   !== undefined) updates.status   = status;
    if (departmentId  !== undefined) updates.departmentId  = departmentId || null;
    if (email         !== undefined) updates.email         = email || null;
    if (phone         !== undefined) updates.phone         = phone || null;
    if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber || null;
    const [row] = await db.update(healthDoctors).set(updates as any).where(eq(healthDoctors.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt, patientCount: 0 });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/doctors/:id", async (req: Request, res: Response) => {
  try { await db.delete(healthDoctors).where(eq(healthDoctors.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── DEPARTMENTS ──────────────────────────────────────────────────────────────
router.get("/departments", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select({
      id: healthDepartments.id, name: healthDepartments.name, description: healthDepartments.description,
      headDoctorId: healthDepartments.headDoctorId, floor: healthDepartments.floor, capacity: healthDepartments.capacity, createdAt: healthDepartments.createdAt,
      headDoctorName: sql<string>`coalesce((select first_name || ' ' || last_name from health_doctors hd where hd.id = health_departments.head_doctor_id), null)`,
    }).from(healthDepartments).orderBy(healthDepartments.name);
    res.json({ departments: rows.map(d => ({ ...d, createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt })) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/departments", async (req: Request, res: Response) => {
  try {
    const { name, description, headDoctorId, floor, capacity } = req.body;
    const [row] = await db.insert(healthDepartments).values({ name, description: description || null, headDoctorId: headDoctorId || null, floor: floor || null, capacity: capacity || 50 }).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/departments/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const [deleted] = await db.delete(healthDepartments).where(eq(healthDepartments.id, id)).returning({ id: healthDepartments.id });
    if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).end();
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── MEDICAL RECORDS ──────────────────────────────────────────────────────────
router.get("/medical-records", async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.query.patientId as string);
    const rows = await db.select({
      id: healthMedicalRecords.id, patientId: healthMedicalRecords.patientId, doctorId: healthMedicalRecords.doctorId,
      visitDate: healthMedicalRecords.visitDate, chiefComplaint: healthMedicalRecords.chiefComplaint,
      diagnosis: healthMedicalRecords.diagnosis, treatment: healthMedicalRecords.treatment,
      notes: healthMedicalRecords.notes, followUpDate: healthMedicalRecords.followUpDate, createdAt: healthMedicalRecords.createdAt,
      doctorName: sql<string>`coalesce((select first_name || ' ' || last_name from health_doctors hd where hd.id = health_medical_records.doctor_id), null)`,
    }).from(healthMedicalRecords).where(eq(healthMedicalRecords.patientId, patientId)).orderBy(desc(healthMedicalRecords.visitDate));
    res.json({ records: rows.map(r => ({ ...r, visitDate: r.visitDate instanceof Date ? r.visitDate.toISOString() : r.visitDate, followUpDate: r.followUpDate instanceof Date ? r.followUpDate.toISOString() : null, createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt })) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/medical-records", async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, visitDate, chiefComplaint, diagnosis, treatment, notes, followUpDate } = req.body;
    const [row] = await db.insert(healthMedicalRecords).values({ patientId, doctorId, visitDate: new Date(visitDate), chiefComplaint: chiefComplaint || null, diagnosis, treatment: treatment || null, notes: notes || null, followUpDate: followUpDate ? new Date(followUpDate) : null }).returning();
    res.status(201).json({ ...row, visitDate: row.visitDate instanceof Date ? row.visitDate.toISOString() : row.visitDate, followUpDate: row.followUpDate instanceof Date ? row.followUpDate.toISOString() : null, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/medical-records/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const updates: Record<string, unknown> = {};
    const { visitDate, chiefComplaint, diagnosis, treatment, notes, followUpDate } = req.body;
    if (visitDate        !== undefined) updates.visitDate        = new Date(visitDate);
    if (chiefComplaint   !== undefined) updates.chiefComplaint   = chiefComplaint || null;
    if (diagnosis        !== undefined) updates.diagnosis        = diagnosis;
    if (treatment        !== undefined) updates.treatment        = treatment || null;
    if (notes            !== undefined) updates.notes            = notes || null;
    if (followUpDate     !== undefined) updates.followUpDate     = followUpDate ? new Date(followUpDate) : null;
    const [row] = await db.update(healthMedicalRecords).set(updates as any).where(eq(healthMedicalRecords.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, visitDate: row.visitDate instanceof Date ? row.visitDate.toISOString() : row.visitDate, followUpDate: row.followUpDate instanceof Date ? row.followUpDate.toISOString() : null, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/medical-records/:id", async (req: Request, res: Response) => {
  try { await db.delete(healthMedicalRecords).where(eq(healthMedicalRecords.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── PRESCRIPTIONS ────────────────────────────────────────────────────────────
router.get("/prescriptions", async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId ? Number(req.query.patientId as string) : null;
    const rows = await db.select({
      id: healthPrescriptions.id, patientId: healthPrescriptions.patientId, doctorId: healthPrescriptions.doctorId,
      medication: healthPrescriptions.medication, dosage: healthPrescriptions.dosage, frequency: healthPrescriptions.frequency,
      startDate: healthPrescriptions.startDate, endDate: healthPrescriptions.endDate,
      refills: healthPrescriptions.refills, status: healthPrescriptions.status, notes: healthPrescriptions.notes, createdAt: healthPrescriptions.createdAt,
      patientName: sql<string>`coalesce((select first_name || ' ' || last_name from health_patients hp where hp.id = health_prescriptions.patient_id), null)`,
      doctorName:  sql<string>`coalesce((select first_name || ' ' || last_name from health_doctors hd where hd.id = health_prescriptions.doctor_id), null)`,
    }).from(healthPrescriptions).where(patientId ? eq(healthPrescriptions.patientId, patientId) : sql`1=1`).orderBy(desc(healthPrescriptions.createdAt));
    res.json({ prescriptions: rows.map(p => ({ ...p, startDate: p.startDate instanceof Date ? p.startDate.toISOString() : p.startDate, endDate: p.endDate instanceof Date ? p.endDate.toISOString() : null, createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt })) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/prescriptions", async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, medication, dosage, frequency, startDate, endDate, refills = 0, status = "active", notes } = req.body;
    const [row] = await db.insert(healthPrescriptions).values({ patientId, doctorId, medication, dosage, frequency, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, refills, status, notes: notes || null }).returning();
    res.status(201).json({ ...row, startDate: row.startDate instanceof Date ? row.startDate.toISOString() : row.startDate, endDate: row.endDate instanceof Date ? row.endDate.toISOString() : null, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/prescriptions/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const updates: Record<string, unknown> = {};
    const { medication, dosage, frequency, startDate, endDate, refills, status, notes } = req.body;
    if (medication !== undefined) updates.medication = medication;
    if (dosage     !== undefined) updates.dosage     = dosage;
    if (frequency  !== undefined) updates.frequency  = frequency;
    if (startDate  !== undefined) updates.startDate  = new Date(startDate);
    if (endDate    !== undefined) updates.endDate    = endDate ? new Date(endDate) : null;
    if (refills    !== undefined) updates.refills    = refills;
    if (status     !== undefined) updates.status     = status;
    if (notes      !== undefined) updates.notes      = notes || null;
    const [row] = await db.update(healthPrescriptions).set(updates as any).where(eq(healthPrescriptions.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, startDate: row.startDate instanceof Date ? row.startDate.toISOString() : row.startDate, endDate: row.endDate instanceof Date ? row.endDate.toISOString() : null, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/prescriptions/:id", async (req: Request, res: Response) => {
  try { await db.delete(healthPrescriptions).where(eq(healthPrescriptions.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── BILLING ──────────────────────────────────────────────────────────────────
router.get("/billing", async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId ? Number(req.query.patientId as string) : null;
    const rows = await db.select({
      id: healthBilling.id, patientId: healthBilling.patientId, appointmentId: healthBilling.appointmentId,
      description: healthBilling.description, amount: healthBilling.amount, status: healthBilling.status,
      insuranceCoverage: healthBilling.insuranceCoverage, patientOwes: healthBilling.patientOwes,
      dueDate: healthBilling.dueDate, paidDate: healthBilling.paidDate, createdAt: healthBilling.createdAt,
      patientName: sql<string>`coalesce((select first_name || ' ' || last_name from health_patients hp where hp.id = health_billing.patient_id), null)`,
    }).from(healthBilling).where(patientId ? eq(healthBilling.patientId, patientId) : sql`1=1`).orderBy(desc(healthBilling.createdAt));
    res.json({ bills: rows.map(b => ({ ...b, amount: Number(b.amount), insuranceCoverage: Number(b.insuranceCoverage ?? 0), patientOwes: b.patientOwes ? Number(b.patientOwes) : null, dueDate: b.dueDate instanceof Date ? b.dueDate.toISOString() : null, paidDate: b.paidDate instanceof Date ? b.paidDate.toISOString() : null, createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt })) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/billing", async (req: Request, res: Response) => {
  try {
    const { patientId, appointmentId, description, amount, status = "pending", insuranceCoverage = 0, dueDate } = req.body;
    const patientOwes = amount - insuranceCoverage;
    const [row] = await db.insert(healthBilling).values({ patientId, appointmentId: appointmentId || null, description, amount: amount.toString(), status, insuranceCoverage: insuranceCoverage.toString(), patientOwes: patientOwes.toString(), dueDate: dueDate ? new Date(dueDate) : null }).returning();
    res.status(201).json({ ...row, amount: Number(row.amount), insuranceCoverage: Number(row.insuranceCoverage ?? 0), patientOwes: row.patientOwes ? Number(row.patientOwes) : null, dueDate: row.dueDate instanceof Date ? row.dueDate.toISOString() : null, paidDate: null, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/billing/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const { status, paidDate, insuranceCoverage } = req.body;
    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (paidDate !== undefined) updates.paidDate = new Date(paidDate);
    if (status === "paid" && !paidDate) updates.paidDate = new Date();
    if (insuranceCoverage !== undefined) updates.insuranceCoverage = insuranceCoverage.toString();
    const [row] = await db.update(healthBilling).set(updates as any).where(eq(healthBilling.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, amount: Number(row.amount), insuranceCoverage: Number(row.insuranceCoverage ?? 0), patientOwes: row.patientOwes ? Number(row.patientOwes) : null, dueDate: row.dueDate instanceof Date ? row.dueDate.toISOString() : null, paidDate: row.paidDate instanceof Date ? row.paidDate.toISOString() : null, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/billing/:id", async (req: Request, res: Response) => {
  try { await db.delete(healthBilling).where(eq(healthBilling.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

export default router;
