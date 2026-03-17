import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, and, sql, ilike, or } from "drizzle-orm";
import {
  db,
  staffingClients, staffingCandidates, staffingRequisitions,
  staffingSubmissions, staffingInterviews, staffingPlacements,
} from "@workspace/db";

const router: IRouter = Router();

const fmt = (d: Date | null | undefined) => d instanceof Date ? d.toISOString() : d ?? null;
const fmtRow = (r: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) {
    out[k] = v instanceof Date ? v.toISOString() : v;
  }
  return out;
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const weekEnd   = new Date(Date.now() + 7 * 86400000);

    const [candidateCount]  = await db.select({ count: sql<number>`count(*)::int` }).from(staffingCandidates).where(eq(staffingCandidates.status, "active"));
    const [placementCount]  = await db.select({ count: sql<number>`count(*)::int` }).from(staffingPlacements).where(eq(staffingPlacements.status, "active"));
    const [requisitionCount]= await db.select({ count: sql<number>`count(*)::int` }).from(staffingRequisitions).where(eq(staffingRequisitions.status, "open"));
    const [interviewCount]  = await db.select({ count: sql<number>`count(*)::int` }).from(staffingInterviews).where(and(eq(staffingInterviews.status, "scheduled"), sql`${staffingInterviews.scheduledAt} >= ${now}`, sql`${staffingInterviews.scheduledAt} < ${weekEnd}`));
    const [revenueRow]      = await db.select({ total: sql<number>`coalesce(sum(fee),0)::float` }).from(staffingPlacements);

    const recentCandidates = await db.select({
      id: staffingCandidates.id, firstName: staffingCandidates.firstName, lastName: staffingCandidates.lastName,
      email: staffingCandidates.email, phone: staffingCandidates.phone, title: staffingCandidates.title,
      location: staffingCandidates.location, skills: staffingCandidates.skills, experience: staffingCandidates.experience,
      availability: staffingCandidates.availability, status: staffingCandidates.status, source: staffingCandidates.source,
      resumeUrl: staffingCandidates.resumeUrl, notes: staffingCandidates.notes, createdAt: staffingCandidates.createdAt,
    }).from(staffingCandidates).orderBy(desc(staffingCandidates.createdAt)).limit(5);

    const upcomingInterviews = await db.select({
      id: staffingInterviews.id, submissionId: staffingInterviews.submissionId,
      candidateId: staffingInterviews.candidateId, requisitionId: staffingInterviews.requisitionId,
      scheduledAt: staffingInterviews.scheduledAt, durationMinutes: staffingInterviews.durationMinutes,
      type: staffingInterviews.type, status: staffingInterviews.status,
      interviewerName: staffingInterviews.interviewerName, location: staffingInterviews.location,
      notes: staffingInterviews.notes, feedback: staffingInterviews.feedback, outcome: staffingInterviews.outcome,
      createdAt: staffingInterviews.createdAt,
      candidateName: sql<string>`coalesce((select first_name || ' ' || last_name from staffing_candidates sc where sc.id = staffing_interviews.candidate_id), null)`,
      requisitionTitle: sql<string>`coalesce((select title from staffing_requisitions sr where sr.id = staffing_interviews.requisition_id), null)`,
    }).from(staffingInterviews).where(and(eq(staffingInterviews.status, "scheduled"), sql`${staffingInterviews.scheduledAt} >= ${now}`)).orderBy(staffingInterviews.scheduledAt).limit(8);

    res.json({
      totalCandidates:     candidateCount?.count  ?? 0,
      activePlacements:    placementCount?.count   ?? 0,
      openRequisitions:    requisitionCount?.count ?? 0,
      interviewsThisWeek:  interviewCount?.count   ?? 0,
      placementRevenue:    revenueRow?.total       ?? 0,
      recentCandidates:    recentCandidates.map(r => fmtRow(r as any)),
      upcomingInterviews:  upcomingInterviews.map(r => fmtRow(r as any)),
    });
  } catch (err) { console.error("[staffing] dashboard", err); res.status(500).json({ error: "Failed" }); }
});

// ─── CANDIDATES ───────────────────────────────────────────────────────────────
router.get("/candidates", async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query as { search?: string; status?: string };
    const rows = await db.select({
      id: staffingCandidates.id, firstName: staffingCandidates.firstName, lastName: staffingCandidates.lastName,
      email: staffingCandidates.email, phone: staffingCandidates.phone, title: staffingCandidates.title,
      location: staffingCandidates.location, skills: staffingCandidates.skills, experience: staffingCandidates.experience,
      availability: staffingCandidates.availability, status: staffingCandidates.status, source: staffingCandidates.source,
      resumeUrl: staffingCandidates.resumeUrl, notes: staffingCandidates.notes, createdAt: staffingCandidates.createdAt,
    }).from(staffingCandidates).where(
      and(
        status ? eq(staffingCandidates.status, status) : undefined,
        search ? or(ilike(staffingCandidates.firstName, `%${search}%`), ilike(staffingCandidates.lastName, `%${search}%`), ilike(staffingCandidates.email, `%${search}%`)) : undefined,
      )
    ).orderBy(desc(staffingCandidates.createdAt));
    res.json({ candidates: rows.map(r => fmtRow(r as any)) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/candidates", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, title, location, skills, experience, availability, status = "active", source, resumeUrl, notes } = req.body;
    const [row] = await db.insert(staffingCandidates).values({ firstName, lastName, email, phone: phone || null, title: title || null, location: location || null, skills: skills || null, experience: experience || null, availability: availability || null, status, source: source || null, resumeUrl: resumeUrl || null, notes: notes || null }).returning();
    res.status(201).json(fmtRow(row as any));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.get("/candidates/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const [candidate] = await db.select().from(staffingCandidates).where(eq(staffingCandidates.id, id));
    if (!candidate) { res.status(404).json({ error: "Not found" }); return; }

    const submissions = await db.select({
      id: staffingSubmissions.id, candidateId: staffingSubmissions.candidateId, requisitionId: staffingSubmissions.requisitionId,
      status: staffingSubmissions.status, submittedAt: staffingSubmissions.submittedAt, notes: staffingSubmissions.notes,
      recruiterFeedback: staffingSubmissions.recruiterFeedback, clientFeedback: staffingSubmissions.clientFeedback, createdAt: staffingSubmissions.createdAt,
      requisitionTitle: sql<string>`coalesce((select title from staffing_requisitions sr where sr.id = staffing_submissions.requisition_id), null)`,
      clientName: sql<string>`coalesce((select company_name from staffing_clients sc join staffing_requisitions sr on sr.client_id = sc.id where sr.id = staffing_submissions.requisition_id), null)`,
    }).from(staffingSubmissions).where(eq(staffingSubmissions.candidateId, id)).orderBy(desc(staffingSubmissions.createdAt));

    const interviews = await db.select({
      id: staffingInterviews.id, submissionId: staffingInterviews.submissionId, candidateId: staffingInterviews.candidateId,
      requisitionId: staffingInterviews.requisitionId, scheduledAt: staffingInterviews.scheduledAt, durationMinutes: staffingInterviews.durationMinutes,
      type: staffingInterviews.type, status: staffingInterviews.status, interviewerName: staffingInterviews.interviewerName,
      location: staffingInterviews.location, notes: staffingInterviews.notes, feedback: staffingInterviews.feedback, outcome: staffingInterviews.outcome, createdAt: staffingInterviews.createdAt,
      requisitionTitle: sql<string>`coalesce((select title from staffing_requisitions sr where sr.id = staffing_interviews.requisition_id), null)`,
    }).from(staffingInterviews).where(eq(staffingInterviews.candidateId, id)).orderBy(desc(staffingInterviews.scheduledAt));

    const placements = await db.select({
      id: staffingPlacements.id, candidateId: staffingPlacements.candidateId, requisitionId: staffingPlacements.requisitionId,
      clientId: staffingPlacements.clientId, startDate: staffingPlacements.startDate, endDate: staffingPlacements.endDate,
      type: staffingPlacements.type, salary: staffingPlacements.salary, fee: staffingPlacements.fee, status: staffingPlacements.status,
      notes: staffingPlacements.notes, createdAt: staffingPlacements.createdAt,
      clientName: sql<string>`coalesce((select company_name from staffing_clients sc where sc.id = staffing_placements.client_id), null)`,
      requisitionTitle: sql<string>`coalesce((select title from staffing_requisitions sr where sr.id = staffing_placements.requisition_id), null)`,
    }).from(staffingPlacements).where(eq(staffingPlacements.candidateId, id)).orderBy(desc(staffingPlacements.startDate));

    res.json({ ...fmtRow(candidate as any), submissions: submissions.map(r => fmtRow(r as any)), interviews: interviews.map(r => fmtRow(r as any)), placements: placements.map(r => fmtRow(r as any)) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/candidates/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const updates: Record<string, unknown> = {};
    const fields = ["firstName","lastName","email","phone","title","location","skills","experience","availability","status","source","resumeUrl","notes"];
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] || (typeof req.body[f] === "number" ? req.body[f] : null); });
    if (req.body.firstName !== undefined) updates.firstName = req.body.firstName;
    if (req.body.lastName  !== undefined) updates.lastName  = req.body.lastName;
    if (req.body.email     !== undefined) updates.email     = req.body.email;
    if (req.body.status    !== undefined) updates.status    = req.body.status;
    const [row] = await db.update(staffingCandidates).set(updates as any).where(eq(staffingCandidates.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmtRow(row as any));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/candidates/:id", async (req: Request, res: Response) => {
  try { await db.delete(staffingCandidates).where(eq(staffingCandidates.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
router.get("/clients", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select({
      id: staffingClients.id, companyName: staffingClients.companyName, industry: staffingClients.industry,
      contactName: staffingClients.contactName, contactEmail: staffingClients.contactEmail, contactPhone: staffingClients.contactPhone,
      address: staffingClients.address, website: staffingClients.website, status: staffingClients.status, notes: staffingClients.notes, createdAt: staffingClients.createdAt,
      openRequisitions: sql<number>`(select count(*)::int from staffing_requisitions sr where sr.client_id = staffing_clients.id and sr.status = 'open')`,
      activePlacements:  sql<number>`(select count(*)::int from staffing_placements sp where sp.client_id = staffing_clients.id and sp.status = 'active')`,
    }).from(staffingClients).orderBy(staffingClients.companyName);
    res.json({ clients: rows.map(r => fmtRow(r as any)) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/clients", async (req: Request, res: Response) => {
  try {
    const { companyName, industry, contactName, contactEmail, contactPhone, address, website, status = "active", notes } = req.body;
    const [row] = await db.insert(staffingClients).values({ companyName, industry: industry || null, contactName: contactName || null, contactEmail: contactEmail || null, contactPhone: contactPhone || null, address: address || null, website: website || null, status, notes: notes || null }).returning();
    res.status(201).json(fmtRow(row as any));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.get("/clients/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const [row] = await db.select().from(staffingClients).where(eq(staffingClients.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmtRow(row as any));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/clients/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const updates: Record<string, unknown> = {};
    const { companyName, industry, contactName, contactEmail, contactPhone, address, website, status, notes } = req.body;
    if (companyName !== undefined) updates.companyName = companyName;
    if (industry    !== undefined) updates.industry    = industry || null;
    if (contactName !== undefined) updates.contactName = contactName || null;
    if (contactEmail!== undefined) updates.contactEmail= contactEmail || null;
    if (contactPhone!== undefined) updates.contactPhone= contactPhone || null;
    if (address     !== undefined) updates.address     = address || null;
    if (website     !== undefined) updates.website     = website || null;
    if (status      !== undefined) updates.status      = status;
    if (notes       !== undefined) updates.notes       = notes || null;
    const [row] = await db.update(staffingClients).set(updates as any).where(eq(staffingClients.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmtRow(row as any));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/clients/:id", async (req: Request, res: Response) => {
  try { await db.delete(staffingClients).where(eq(staffingClients.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── REQUISITIONS ─────────────────────────────────────────────────────────────
router.get("/requisitions", async (req: Request, res: Response) => {
  try {
    const { clientId, status } = req.query as { clientId?: string; status?: string };
    const rows = await db.select({
      id: staffingRequisitions.id, clientId: staffingRequisitions.clientId, title: staffingRequisitions.title,
      department: staffingRequisitions.department, location: staffingRequisitions.location, type: staffingRequisitions.type,
      salaryMin: staffingRequisitions.salaryMin, salaryMax: staffingRequisitions.salaryMax, description: staffingRequisitions.description,
      requirements: staffingRequisitions.requirements, status: staffingRequisitions.status, priority: staffingRequisitions.priority,
      targetDate: staffingRequisitions.targetDate, createdAt: staffingRequisitions.createdAt,
      clientName: sql<string>`coalesce((select company_name from staffing_clients sc where sc.id = staffing_requisitions.client_id), null)`,
      submissionCount: sql<number>`(select count(*)::int from staffing_submissions ss where ss.requisition_id = staffing_requisitions.id)`,
    }).from(staffingRequisitions).where(
      and(
        clientId ? eq(staffingRequisitions.clientId, Number(clientId)) : undefined,
        status   ? eq(staffingRequisitions.status, status) : undefined,
      )
    ).orderBy(desc(staffingRequisitions.createdAt));
    res.json({ requisitions: rows.map(r => ({ ...fmtRow(r as any), salaryMin: r.salaryMin ? Number(r.salaryMin) : null, salaryMax: r.salaryMax ? Number(r.salaryMax) : null })) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/requisitions", async (req: Request, res: Response) => {
  try {
    const { clientId, title, department, location, type = "full-time", salaryMin, salaryMax, description, requirements, status = "open", priority = "medium", targetDate } = req.body;
    const [row] = await db.insert(staffingRequisitions).values({ clientId, title, department: department || null, location: location || null, type, salaryMin: salaryMin ? String(salaryMin) : null, salaryMax: salaryMax ? String(salaryMax) : null, description: description || null, requirements: requirements || null, status, priority, targetDate: targetDate ? new Date(targetDate) : null }).returning();
    res.status(201).json({ ...fmtRow(row as any), salaryMin: row.salaryMin ? Number(row.salaryMin) : null, salaryMax: row.salaryMax ? Number(row.salaryMax) : null });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.get("/requisitions/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const [row] = await db.select().from(staffingRequisitions).where(eq(staffingRequisitions.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...fmtRow(row as any), salaryMin: row.salaryMin ? Number(row.salaryMin) : null, salaryMax: row.salaryMax ? Number(row.salaryMax) : null });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/requisitions/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const updates: Record<string, unknown> = {};
    const { title, department, location, type, salaryMin, salaryMax, description, requirements, status, priority, targetDate } = req.body;
    if (title       !== undefined) updates.title       = title;
    if (department  !== undefined) updates.department  = department || null;
    if (location    !== undefined) updates.location    = location || null;
    if (type        !== undefined) updates.type        = type;
    if (salaryMin   !== undefined) updates.salaryMin   = salaryMin ? String(salaryMin) : null;
    if (salaryMax   !== undefined) updates.salaryMax   = salaryMax ? String(salaryMax) : null;
    if (description !== undefined) updates.description = description || null;
    if (requirements!== undefined) updates.requirements= requirements || null;
    if (status      !== undefined) updates.status      = status;
    if (priority    !== undefined) updates.priority    = priority;
    if (targetDate  !== undefined) updates.targetDate  = targetDate ? new Date(targetDate) : null;
    const [row] = await db.update(staffingRequisitions).set(updates as any).where(eq(staffingRequisitions.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...fmtRow(row as any), salaryMin: row.salaryMin ? Number(row.salaryMin) : null, salaryMax: row.salaryMax ? Number(row.salaryMax) : null });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/requisitions/:id", async (req: Request, res: Response) => {
  try { await db.delete(staffingRequisitions).where(eq(staffingRequisitions.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────────
router.get("/submissions", async (req: Request, res: Response) => {
  try {
    const { candidateId, requisitionId } = req.query as { candidateId?: string; requisitionId?: string };
    const rows = await db.select({
      id: staffingSubmissions.id, candidateId: staffingSubmissions.candidateId, requisitionId: staffingSubmissions.requisitionId,
      status: staffingSubmissions.status, submittedAt: staffingSubmissions.submittedAt, notes: staffingSubmissions.notes,
      recruiterFeedback: staffingSubmissions.recruiterFeedback, clientFeedback: staffingSubmissions.clientFeedback, createdAt: staffingSubmissions.createdAt,
      candidateName: sql<string>`coalesce((select first_name || ' ' || last_name from staffing_candidates sc where sc.id = staffing_submissions.candidate_id), null)`,
      requisitionTitle: sql<string>`coalesce((select title from staffing_requisitions sr where sr.id = staffing_submissions.requisition_id), null)`,
      clientName: sql<string>`coalesce((select company_name from staffing_clients sc join staffing_requisitions sr on sr.client_id = sc.id where sr.id = staffing_submissions.requisition_id), null)`,
    }).from(staffingSubmissions).where(
      and(
        candidateId   ? eq(staffingSubmissions.candidateId, Number(candidateId))     : undefined,
        requisitionId ? eq(staffingSubmissions.requisitionId, Number(requisitionId)) : undefined,
      )
    ).orderBy(desc(staffingSubmissions.createdAt));
    res.json({ submissions: rows.map(r => fmtRow(r as any)) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/submissions", async (req: Request, res: Response) => {
  try {
    const { candidateId, requisitionId, status = "submitted", notes, recruiterFeedback, clientFeedback } = req.body;
    const [row] = await db.insert(staffingSubmissions).values({ candidateId, requisitionId, status, submittedAt: new Date(), notes: notes || null, recruiterFeedback: recruiterFeedback || null, clientFeedback: clientFeedback || null }).returning();
    res.status(201).json(fmtRow(row as any));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/submissions/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const updates: Record<string, unknown> = {};
    const { status, notes, recruiterFeedback, clientFeedback } = req.body;
    if (status !== undefined) updates.status = status;
    if (notes  !== undefined) updates.notes  = notes || null;
    if (recruiterFeedback !== undefined) updates.recruiterFeedback = recruiterFeedback || null;
    if (clientFeedback    !== undefined) updates.clientFeedback    = clientFeedback    || null;
    const [row] = await db.update(staffingSubmissions).set(updates as any).where(eq(staffingSubmissions.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmtRow(row as any));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/submissions/:id", async (req: Request, res: Response) => {
  try { await db.delete(staffingSubmissions).where(eq(staffingSubmissions.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────
router.get("/interviews", async (req: Request, res: Response) => {
  try {
    const { candidateId, submissionId } = req.query as { candidateId?: string; submissionId?: string };
    const rows = await db.select({
      id: staffingInterviews.id, submissionId: staffingInterviews.submissionId, candidateId: staffingInterviews.candidateId,
      requisitionId: staffingInterviews.requisitionId, scheduledAt: staffingInterviews.scheduledAt, durationMinutes: staffingInterviews.durationMinutes,
      type: staffingInterviews.type, status: staffingInterviews.status, interviewerName: staffingInterviews.interviewerName,
      location: staffingInterviews.location, notes: staffingInterviews.notes, feedback: staffingInterviews.feedback, outcome: staffingInterviews.outcome, createdAt: staffingInterviews.createdAt,
      candidateName:    sql<string>`coalesce((select first_name || ' ' || last_name from staffing_candidates sc where sc.id = staffing_interviews.candidate_id), null)`,
      requisitionTitle: sql<string>`coalesce((select title from staffing_requisitions sr where sr.id = staffing_interviews.requisition_id), null)`,
    }).from(staffingInterviews).where(
      and(
        candidateId  ? eq(staffingInterviews.candidateId, Number(candidateId))   : undefined,
        submissionId ? eq(staffingInterviews.submissionId, Number(submissionId)) : undefined,
      )
    ).orderBy(desc(staffingInterviews.scheduledAt));
    res.json({ interviews: rows.map(r => fmtRow(r as any)) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/interviews", async (req: Request, res: Response) => {
  try {
    const { submissionId, candidateId, requisitionId, scheduledAt, durationMinutes = 60, type = "phone", status = "scheduled", interviewerName, location, notes, feedback, outcome } = req.body;
    const [row] = await db.insert(staffingInterviews).values({ submissionId, candidateId, requisitionId, scheduledAt: new Date(scheduledAt), durationMinutes, type, status, interviewerName: interviewerName || null, location: location || null, notes: notes || null, feedback: feedback || null, outcome: outcome || null }).returning();
    res.status(201).json(fmtRow(row as any));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/interviews/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const updates: Record<string, unknown> = {};
    const { scheduledAt, durationMinutes, type, status, interviewerName, location, notes, feedback, outcome } = req.body;
    if (scheduledAt    !== undefined) updates.scheduledAt    = new Date(scheduledAt);
    if (durationMinutes!== undefined) updates.durationMinutes= durationMinutes;
    if (type           !== undefined) updates.type           = type;
    if (status         !== undefined) updates.status         = status;
    if (interviewerName!== undefined) updates.interviewerName= interviewerName || null;
    if (location       !== undefined) updates.location       = location || null;
    if (notes          !== undefined) updates.notes          = notes || null;
    if (feedback       !== undefined) updates.feedback       = feedback || null;
    if (outcome        !== undefined) updates.outcome        = outcome || null;
    const [row] = await db.update(staffingInterviews).set(updates as any).where(eq(staffingInterviews.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmtRow(row as any));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/interviews/:id", async (req: Request, res: Response) => {
  try { await db.delete(staffingInterviews).where(eq(staffingInterviews.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── PLACEMENTS ───────────────────────────────────────────────────────────────
router.get("/placements", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select({
      id: staffingPlacements.id, candidateId: staffingPlacements.candidateId, requisitionId: staffingPlacements.requisitionId,
      clientId: staffingPlacements.clientId, startDate: staffingPlacements.startDate, endDate: staffingPlacements.endDate,
      type: staffingPlacements.type, salary: staffingPlacements.salary, fee: staffingPlacements.fee, status: staffingPlacements.status,
      notes: staffingPlacements.notes, createdAt: staffingPlacements.createdAt,
      candidateName:    sql<string>`coalesce((select first_name || ' ' || last_name from staffing_candidates sc where sc.id = staffing_placements.candidate_id), null)`,
      clientName:       sql<string>`coalesce((select company_name from staffing_clients sc where sc.id = staffing_placements.client_id), null)`,
      requisitionTitle: sql<string>`coalesce((select title from staffing_requisitions sr where sr.id = staffing_placements.requisition_id), null)`,
    }).from(staffingPlacements).orderBy(desc(staffingPlacements.startDate));
    res.json({ placements: rows.map(r => ({ ...fmtRow(r as any), salary: r.salary ? Number(r.salary) : null, fee: r.fee ? Number(r.fee) : null })) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/placements", async (req: Request, res: Response) => {
  try {
    const { candidateId, requisitionId, clientId, startDate, endDate, type = "permanent", salary, fee, status = "active", notes } = req.body;
    const [row] = await db.insert(staffingPlacements).values({ candidateId, requisitionId, clientId, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, type, salary: salary ? String(salary) : null, fee: fee ? String(fee) : null, status, notes: notes || null }).returning();
    res.status(201).json({ ...fmtRow(row as any), salary: row.salary ? Number(row.salary) : null, fee: row.fee ? Number(row.fee) : null });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/placements/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const updates: Record<string, unknown> = {};
    const { startDate, endDate, type, salary, fee, status, notes } = req.body;
    if (startDate !== undefined) updates.startDate = new Date(startDate);
    if (endDate   !== undefined) updates.endDate   = endDate ? new Date(endDate) : null;
    if (type      !== undefined) updates.type      = type;
    if (salary    !== undefined) updates.salary    = salary ? String(salary) : null;
    if (fee       !== undefined) updates.fee       = fee    ? String(fee)    : null;
    if (status    !== undefined) updates.status    = status;
    if (notes     !== undefined) updates.notes     = notes  || null;
    const [row] = await db.update(staffingPlacements).set(updates as any).where(eq(staffingPlacements.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...fmtRow(row as any), salary: row.salary ? Number(row.salary) : null, fee: row.fee ? Number(row.fee) : null });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/placements/:id", async (req: Request, res: Response) => {
  try { await db.delete(staffingPlacements).where(eq(staffingPlacements.id, Number(req.params.id as string))); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Failed" }); }
});

export default router;
