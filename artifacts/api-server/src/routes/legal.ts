import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import {
  db,
  legalClients, legalMatters, legalTimeEntries,
  legalInvoices, legalInvoiceItems, legalTasks, legalNotes,
} from "@workspace/db";

const router: IRouter = Router();

function isAuth(_req: Request, _res: Response): boolean {
  return true;
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
router.get("/dashboard", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [clientCount] = await db.select({ count: sql<number>`count(*)::int` }).from(legalClients);
    const [matterCount] = await db.select({ count: sql<number>`count(*)::int` }).from(legalMatters);
    const [openCount]   = await db.select({ count: sql<number>`count(*)::int` }).from(legalMatters).where(eq(legalMatters.status, "open"));
    const [overdueCount]= await db.select({ count: sql<number>`count(*)::int` }).from(legalInvoices).where(eq(legalInvoices.status, "overdue"));

    const unbilledRows = await db.select({
      hours: legalTimeEntries.hours,
      rate:  legalTimeEntries.rate,
    }).from(legalTimeEntries).where(eq(legalTimeEntries.isBilled, false));
    const unbilledHours  = unbilledRows.reduce((s, r) => s + Number(r.hours), 0);
    const unbilledAmount = unbilledRows.reduce((s, r) => s + Number(r.hours) * Number(r.rate), 0);

    const monthEntries = await db.select({ amount: legalTimeEntries.amount })
      .from(legalTimeEntries)
      .where(sql`${legalTimeEntries.date} >= ${firstOfMonth}`);
    const totalBilledThisMonth = monthEntries.reduce((s, r) => s + Number(r.amount), 0);

    const upcomingTasks = await db.select({
      id: legalTasks.id, matterId: legalTasks.matterId, title: legalTasks.title,
      description: legalTasks.description, priority: legalTasks.priority,
      isCompleted: legalTasks.isCompleted, dueAt: legalTasks.dueAt,
      completedAt: legalTasks.completedAt, createdAt: legalTasks.createdAt,
      matterTitle: legalMatters.title,
    })
      .from(legalTasks)
      .innerJoin(legalMatters, eq(legalTasks.matterId, legalMatters.id))
      .where(and(eq(legalTasks.isCompleted, false), isNull(legalTasks.completedAt)))
      .orderBy(legalTasks.dueAt)
      .limit(5);

    const recentMatters = await db.select({
      id: legalMatters.id, clientId: legalMatters.clientId, title: legalMatters.title,
      type: legalMatters.type, status: legalMatters.status, description: legalMatters.description,
      billingType: legalMatters.billingType, hourlyRate: legalMatters.hourlyRate,
      flatFee: legalMatters.flatFee, openedAt: legalMatters.openedAt,
      closedAt: legalMatters.closedAt, createdAt: legalMatters.createdAt,
      clientName: legalClients.name,
    })
      .from(legalMatters)
      .innerJoin(legalClients, eq(legalMatters.clientId, legalClients.id))
      .orderBy(desc(legalMatters.createdAt))
      .limit(5);

    res.json({
      totalClients: clientCount.count,
      totalMatters: matterCount.count,
      openMatters: openCount.count,
      totalHoursThisMonth: monthEntries.reduce((s, _r) => s, 0),
      unbilledHours: Math.round(unbilledHours * 100) / 100,
      unbilledAmount: Math.round(unbilledAmount * 100) / 100,
      totalBilledThisMonth: Math.round(totalBilledThisMonth * 100) / 100,
      overdueInvoices: overdueCount.count,
      upcomingTasks: upcomingTasks.map(t => ({ ...t, dueAt: t.dueAt?.toISOString(), completedAt: t.completedAt?.toISOString(), createdAt: t.createdAt.toISOString() })),
      recentMatters: recentMatters.map(m => ({
        ...m,
        hourlyRate: m.hourlyRate ? Number(m.hourlyRate) : null,
        flatFee: m.flatFee ? Number(m.flatFee) : null,
        openedAt: m.openedAt.toISOString(),
        closedAt: m.closedAt?.toISOString(),
        createdAt: m.createdAt.toISOString(),
        totalHours: null, totalBilled: null,
      })),
    });
  } catch (err) { console.error("[legal] dashboard", err); res.status(500).json({ error: "Failed" }); }
});

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
router.get("/clients", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const rows = await db.select().from(legalClients).orderBy(desc(legalClients.createdAt));
    const counts = await db.select({
      clientId: legalMatters.clientId,
      count: sql<number>`count(*)::int`,
    }).from(legalMatters).groupBy(legalMatters.clientId);
    const countMap = Object.fromEntries(counts.map(c => [c.clientId, c.count]));
    res.json({ clients: rows.map(c => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(), matterCount: countMap[c.id] ?? 0 })) });
  } catch (err) { console.error("[legal] GET /clients", err); res.status(500).json({ error: "Failed" }); }
});

router.post("/clients", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const { name, email, phone, address, type = "individual", notes } = req.body as { name: string; email?: string; phone?: string; address?: string; type?: string; notes?: string };
    if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
    const [row] = await db.insert(legalClients).values({ name: name.trim(), email: email?.trim() || null, phone: phone?.trim() || null, address: address?.trim() || null, type, notes: notes?.trim() || null }).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), matterCount: 0 });
  } catch (err) { console.error("[legal] POST /clients", err); res.status(500).json({ error: "Failed" }); }
});

router.get("/clients/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const [row] = await db.select().from(legalClients).where(eq(legalClients.id, Number(req.params.id as string)));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), matterCount: 0 });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/clients/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const id = Number(req.params.id as string);
    const { name, email, phone, address, type, notes } = req.body as { name?: string; email?: string; phone?: string; address?: string; type?: string; notes?: string };
    const [row] = await db.update(legalClients).set({ ...(name && { name }), ...(email !== undefined && { email: email || null }), ...(phone !== undefined && { phone: phone || null }), ...(address !== undefined && { address: address || null }), ...(type && { type }), ...(notes !== undefined && { notes: notes || null }), updatedAt: new Date() }).where(eq(legalClients.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), matterCount: 0 });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/clients/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    await db.delete(legalClients).where(eq(legalClients.id, Number(req.params.id as string)));
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── MATTERS ─────────────────────────────────────────────────────────────────
function formatMatter(m: typeof legalMatters.$inferSelect & { clientName?: string; totalHours?: number; totalBilled?: number }) {
  return {
    ...m,
    hourlyRate: m.hourlyRate ? Number(m.hourlyRate) : null,
    flatFee: m.flatFee ? Number(m.flatFee) : null,
    openedAt: m.openedAt.toISOString(),
    closedAt: m.closedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: (m as any).updatedAt ? new Date((m as any).updatedAt).toISOString() : undefined,
    totalHours: m.totalHours ?? null,
    totalBilled: m.totalBilled ?? null,
  };
}

router.get("/matters", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const rows = await db.select({
      id: legalMatters.id, clientId: legalMatters.clientId, title: legalMatters.title,
      type: legalMatters.type, status: legalMatters.status, description: legalMatters.description,
      billingType: legalMatters.billingType, hourlyRate: legalMatters.hourlyRate,
      flatFee: legalMatters.flatFee, openedAt: legalMatters.openedAt,
      closedAt: legalMatters.closedAt, createdAt: legalMatters.createdAt,
      clientName: legalClients.name,
    }).from(legalMatters).innerJoin(legalClients, eq(legalMatters.clientId, legalClients.id)).orderBy(desc(legalMatters.createdAt));
    res.json({ matters: rows.map(m => formatMatter(m as any)) });
  } catch (err) { console.error("[legal] GET /matters", err); res.status(500).json({ error: "Failed" }); }
});

router.post("/matters", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const { clientId, title, type = "General", status = "open", description, billingType = "hourly", hourlyRate, flatFee, openedAt } = req.body as {
      clientId: number; title: string; type?: string; status?: string; description?: string;
      billingType?: string; hourlyRate?: number; flatFee?: number; openedAt?: string;
    };
    const [row] = await db.insert(legalMatters).values({
      clientId, title: title.trim(), type, status, description: description?.trim() || null,
      billingType, hourlyRate: hourlyRate?.toString() || null, flatFee: flatFee?.toString() || null,
      openedAt: openedAt ? new Date(openedAt) : new Date(),
    }).returning();
    const [client] = await db.select({ name: legalClients.name }).from(legalClients).where(eq(legalClients.id, clientId));
    res.status(201).json(formatMatter({ ...row, clientName: client?.name }));
  } catch (err) { console.error("[legal] POST /matters", err); res.status(500).json({ error: "Failed" }); }
});

router.get("/matters/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const id = Number(req.params.id as string);
    const [matter] = await db.select({
      id: legalMatters.id, clientId: legalMatters.clientId, title: legalMatters.title,
      type: legalMatters.type, status: legalMatters.status, description: legalMatters.description,
      billingType: legalMatters.billingType, hourlyRate: legalMatters.hourlyRate,
      flatFee: legalMatters.flatFee, openedAt: legalMatters.openedAt,
      closedAt: legalMatters.closedAt, createdAt: legalMatters.createdAt,
      clientName: legalClients.name,
    }).from(legalMatters).innerJoin(legalClients, eq(legalMatters.clientId, legalClients.id)).where(eq(legalMatters.id, id));
    if (!matter) { res.status(404).json({ error: "Not found" }); return; }
    const timeEntries = await db.select().from(legalTimeEntries).where(eq(legalTimeEntries.matterId, id)).orderBy(desc(legalTimeEntries.date));
    const tasks       = await db.select().from(legalTasks).where(eq(legalTasks.matterId, id)).orderBy(legalTasks.dueAt);
    const notes       = await db.select().from(legalNotes).where(eq(legalNotes.matterId, id)).orderBy(desc(legalNotes.createdAt));
    res.json({
      ...formatMatter(matter as any),
      timeEntries: timeEntries.map(e => ({ ...e, hours: Number(e.hours), rate: Number(e.rate), amount: Number(e.amount), date: e.date.toISOString(), createdAt: e.createdAt.toISOString() })),
      tasks: tasks.map(t => ({ ...t, dueAt: t.dueAt?.toISOString(), completedAt: t.completedAt?.toISOString(), createdAt: t.createdAt.toISOString() })),
      notes: notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() })),
    });
  } catch (err) { console.error("[legal] GET /matters/:id", err); res.status(500).json({ error: "Failed" }); }
});

router.put("/matters/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const id = Number(req.params.id as string);
    const { clientId, title, type, status, description, billingType, hourlyRate, flatFee, openedAt } = req.body as {
      clientId?: number; title?: string; type?: string; status?: string; description?: string;
      billingType?: string; hourlyRate?: number; flatFee?: number; openedAt?: string;
    };
    const updates: Partial<typeof legalMatters.$inferInsert> = { updatedAt: new Date() };
    if (clientId)    updates.clientId    = clientId;
    if (title)       updates.title       = title.trim();
    if (type)        updates.type        = type;
    if (status)      updates.status      = status;
    if (description !== undefined) updates.description = description || null;
    if (billingType) updates.billingType = billingType;
    if (hourlyRate !== undefined) updates.hourlyRate = hourlyRate?.toString() || null;
    if (flatFee !== undefined)    updates.flatFee    = flatFee?.toString() || null;
    if (openedAt)    updates.openedAt    = new Date(openedAt);
    if (status === "closed") updates.closedAt = new Date();
    const [row] = await db.update(legalMatters).set(updates).where(eq(legalMatters.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    const [client] = await db.select({ name: legalClients.name }).from(legalClients).where(eq(legalClients.id, row.clientId));
    res.json(formatMatter({ ...row, clientName: client?.name }));
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/matters/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    await db.delete(legalMatters).where(eq(legalMatters.id, Number(req.params.id as string)));
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── TIME ENTRIES ─────────────────────────────────────────────────────────────
router.get("/time-entries", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const matterId = req.query.matterId ? Number(req.query.matterId as string) : null;
    const rows = await db.select({
      id: legalTimeEntries.id, matterId: legalTimeEntries.matterId,
      description: legalTimeEntries.description, hours: legalTimeEntries.hours,
      rate: legalTimeEntries.rate, amount: legalTimeEntries.amount,
      date: legalTimeEntries.date, isBilled: legalTimeEntries.isBilled,
      invoiceId: legalTimeEntries.invoiceId, createdAt: legalTimeEntries.createdAt,
      matterTitle: legalMatters.title, clientName: legalClients.name,
    })
      .from(legalTimeEntries)
      .innerJoin(legalMatters, eq(legalTimeEntries.matterId, legalMatters.id))
      .innerJoin(legalClients, eq(legalMatters.clientId, legalClients.id))
      .where(matterId ? eq(legalTimeEntries.matterId, matterId) : sql`1=1`)
      .orderBy(desc(legalTimeEntries.date));
    res.json({ entries: rows.map(e => ({ ...e, hours: Number(e.hours), rate: Number(e.rate), amount: Number(e.amount), date: e.date.toISOString(), createdAt: e.createdAt.toISOString() })) });
  } catch (err) { console.error("[legal] GET /time-entries", err); res.status(500).json({ error: "Failed" }); }
});

router.post("/time-entries", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const { matterId, description, hours, rate, date, isBilled = false } = req.body as { matterId: number; description: string; hours: number; rate: number; date: string; isBilled?: boolean };
    const amount = hours * rate;
    const [row] = await db.insert(legalTimeEntries).values({ matterId, description: description.trim(), hours: hours.toString(), rate: rate.toString(), amount: amount.toString(), date: new Date(date), isBilled }).returning();
    res.status(201).json({ ...row, hours: Number(row.hours), rate: Number(row.rate), amount: Number(row.amount), date: row.date.toISOString(), createdAt: row.createdAt.toISOString() });
  } catch (err) { console.error("[legal] POST /time-entries", err); res.status(500).json({ error: "Failed" }); }
});

router.put("/time-entries/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const id = Number(req.params.id as string);
    const { description, hours, rate, date, isBilled } = req.body as { description?: string; hours?: number; rate?: number; date?: string; isBilled?: boolean };
    const updates: Record<string, unknown> = {};
    if (description) updates.description = description.trim();
    if (hours !== undefined) updates.hours = hours.toString();
    if (rate !== undefined)  updates.rate  = rate.toString();
    if (hours !== undefined && rate !== undefined) updates.amount = (hours * rate).toString();
    if (date)   updates.date    = new Date(date);
    if (isBilled !== undefined) updates.isBilled = isBilled;
    const [row] = await db.update(legalTimeEntries).set(updates as any).where(eq(legalTimeEntries.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, hours: Number(row.hours), rate: Number(row.rate), amount: Number(row.amount), date: row.date.toISOString(), createdAt: row.createdAt.toISOString() });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/time-entries/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    await db.delete(legalTimeEntries).where(eq(legalTimeEntries.id, Number(req.params.id as string)));
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── INVOICES ────────────────────────────────────────────────────────────────
router.get("/invoices", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const rows = await db.select({
      id: legalInvoices.id, clientId: legalInvoices.clientId, matterId: legalInvoices.matterId,
      invoiceNumber: legalInvoices.invoiceNumber, status: legalInvoices.status,
      total: legalInvoices.total, notes: legalInvoices.notes, issuedAt: legalInvoices.issuedAt,
      dueAt: legalInvoices.dueAt, paidAt: legalInvoices.paidAt, createdAt: legalInvoices.createdAt,
      clientName: legalClients.name, matterTitle: legalMatters.title,
    })
      .from(legalInvoices)
      .innerJoin(legalClients, eq(legalInvoices.clientId, legalClients.id))
      .leftJoin(legalMatters, eq(legalInvoices.matterId, legalMatters.id))
      .orderBy(desc(legalInvoices.createdAt));
    res.json({ invoices: rows.map(i => ({ ...i, total: Number(i.total), issuedAt: i.issuedAt.toISOString(), dueAt: i.dueAt?.toISOString(), paidAt: i.paidAt?.toISOString(), createdAt: i.createdAt.toISOString(), items: [] })) });
  } catch (err) { console.error("[legal] GET /invoices", err); res.status(500).json({ error: "Failed" }); }
});

router.post("/invoices", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const { clientId, matterId, notes, dueAt, timeEntryIds = [] } = req.body as { clientId: number; matterId?: number; notes?: string; dueAt?: string; timeEntryIds?: number[] };
    const [countRow] = await db.select({ count: sql<number>`count(*)::int` }).from(legalInvoices);
    const invoiceNumber = `INV-${String((countRow.count ?? 0) + 1).padStart(4, "0")}`;
    let total = 0;
    const items: Array<{ description: string; quantity: number; rate: number; amount: number }> = [];
    if (timeEntryIds.length > 0) {
      const entries = await db.select().from(legalTimeEntries).where(sql`${legalTimeEntries.id} = ANY(${timeEntryIds})`);
      for (const e of entries) {
        items.push({ description: e.description, quantity: Number(e.hours), rate: Number(e.rate), amount: Number(e.amount) });
        total += Number(e.amount);
      }
    }
    const [invoice] = await db.insert(legalInvoices).values({ clientId, matterId: matterId || null, invoiceNumber, status: "draft", total: total.toString(), notes: notes?.trim() || null, dueAt: dueAt ? new Date(dueAt) : null }).returning();
    const insertedItems = items.length > 0
      ? await db.insert(legalInvoiceItems).values(items.map(i => ({ invoiceId: invoice.id, description: i.description, quantity: i.quantity.toString(), rate: i.rate.toString(), amount: i.amount.toString() }))).returning()
      : [];
    if (timeEntryIds.length > 0) {
      await db.update(legalTimeEntries).set({ isBilled: true, invoiceId: invoice.id }).where(sql`${legalTimeEntries.id} = ANY(${timeEntryIds})`);
    }
    const [client] = await db.select({ name: legalClients.name }).from(legalClients).where(eq(legalClients.id, clientId));
    res.status(201).json({ ...invoice, total: Number(invoice.total), issuedAt: invoice.issuedAt.toISOString(), dueAt: invoice.dueAt?.toISOString(), paidAt: invoice.paidAt?.toISOString(), createdAt: invoice.createdAt.toISOString(), clientName: client?.name, items: insertedItems.map(i => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate), amount: Number(i.amount) })) });
  } catch (err) { console.error("[legal] POST /invoices", err); res.status(500).json({ error: "Failed" }); }
});

router.get("/invoices/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const id = Number(req.params.id as string);
    const [invoice] = await db.select({
      id: legalInvoices.id, clientId: legalInvoices.clientId, matterId: legalInvoices.matterId,
      invoiceNumber: legalInvoices.invoiceNumber, status: legalInvoices.status,
      total: legalInvoices.total, notes: legalInvoices.notes, issuedAt: legalInvoices.issuedAt,
      dueAt: legalInvoices.dueAt, paidAt: legalInvoices.paidAt, createdAt: legalInvoices.createdAt,
      clientName: legalClients.name, matterTitle: legalMatters.title,
    }).from(legalInvoices).innerJoin(legalClients, eq(legalInvoices.clientId, legalClients.id)).leftJoin(legalMatters, eq(legalInvoices.matterId, legalMatters.id)).where(eq(legalInvoices.id, id));
    if (!invoice) { res.status(404).json({ error: "Not found" }); return; }
    const items = await db.select().from(legalInvoiceItems).where(eq(legalInvoiceItems.invoiceId, id));
    res.json({ ...invoice, total: Number(invoice.total), issuedAt: invoice.issuedAt.toISOString(), dueAt: invoice.dueAt?.toISOString(), paidAt: invoice.paidAt?.toISOString(), createdAt: invoice.createdAt.toISOString(), items: items.map(i => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate), amount: Number(i.amount) })) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/invoices/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const id = Number(req.params.id as string);
    const { status, notes, dueAt, paidAt } = req.body as { status: string; notes?: string; dueAt?: string; paidAt?: string };
    const updates: Record<string, unknown> = { status };
    if (notes !== undefined) updates.notes = notes || null;
    if (dueAt)  updates.dueAt  = new Date(dueAt);
    if (paidAt) updates.paidAt = new Date(paidAt);
    if (status === "paid" && !paidAt) updates.paidAt = new Date();
    const [row] = await db.update(legalInvoices).set(updates as any).where(eq(legalInvoices.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    const [client] = await db.select({ name: legalClients.name }).from(legalClients).where(eq(legalClients.id, row.clientId));
    const items = await db.select().from(legalInvoiceItems).where(eq(legalInvoiceItems.invoiceId, id));
    res.json({ ...row, total: Number(row.total), issuedAt: row.issuedAt.toISOString(), dueAt: row.dueAt?.toISOString(), paidAt: row.paidAt?.toISOString(), createdAt: row.createdAt.toISOString(), clientName: client?.name, items: items.map(i => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate), amount: Number(i.amount) })) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/invoices/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    await db.delete(legalInvoices).where(eq(legalInvoices.id, Number(req.params.id as string)));
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── TASKS ────────────────────────────────────────────────────────────────────
router.get("/tasks", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const matterId = req.query.matterId ? Number(req.query.matterId as string) : null;
    const rows = await db.select({
      id: legalTasks.id, matterId: legalTasks.matterId, title: legalTasks.title,
      description: legalTasks.description, priority: legalTasks.priority,
      isCompleted: legalTasks.isCompleted, dueAt: legalTasks.dueAt,
      completedAt: legalTasks.completedAt, createdAt: legalTasks.createdAt,
      matterTitle: legalMatters.title,
    })
      .from(legalTasks)
      .innerJoin(legalMatters, eq(legalTasks.matterId, legalMatters.id))
      .where(matterId ? eq(legalTasks.matterId, matterId) : sql`1=1`)
      .orderBy(legalTasks.dueAt);
    res.json({ tasks: rows.map(t => ({ ...t, dueAt: t.dueAt?.toISOString(), completedAt: t.completedAt?.toISOString(), createdAt: t.createdAt.toISOString() })) });
  } catch (err) { console.error("[legal] GET /tasks", err); res.status(500).json({ error: "Failed" }); }
});

router.post("/tasks", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const { matterId, title, description, priority = "medium", isCompleted = false, dueAt } = req.body as { matterId: number; title: string; description?: string; priority?: string; isCompleted?: boolean; dueAt?: string };
    const [row] = await db.insert(legalTasks).values({ matterId, title: title.trim(), description: description?.trim() || null, priority, isCompleted, dueAt: dueAt ? new Date(dueAt) : null }).returning();
    res.status(201).json({ ...row, dueAt: row.dueAt?.toISOString(), completedAt: row.completedAt?.toISOString(), createdAt: row.createdAt.toISOString() });
  } catch (err) { console.error("[legal] POST /tasks", err); res.status(500).json({ error: "Failed" }); }
});

router.put("/tasks/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const id = Number(req.params.id as string);
    const { title, description, priority, isCompleted, dueAt } = req.body as { title?: string; description?: string; priority?: string; isCompleted?: boolean; dueAt?: string };
    const updates: Record<string, unknown> = {};
    if (title)       updates.title       = title.trim();
    if (description !== undefined) updates.description = description || null;
    if (priority)    updates.priority    = priority;
    if (isCompleted !== undefined) {
      updates.isCompleted  = isCompleted;
      updates.completedAt  = isCompleted ? new Date() : null;
    }
    if (dueAt !== undefined) updates.dueAt = dueAt ? new Date(dueAt) : null;
    const [row] = await db.update(legalTasks).set(updates as any).where(eq(legalTasks.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, dueAt: row.dueAt?.toISOString(), completedAt: row.completedAt?.toISOString(), createdAt: row.createdAt.toISOString() });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/tasks/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    await db.delete(legalTasks).where(eq(legalTasks.id, Number(req.params.id as string)));
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// ─── NOTES ────────────────────────────────────────────────────────────────────
router.get("/notes", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const matterId = Number(req.query.matterId as string);
    if (!matterId) { res.status(400).json({ error: "matterId required" }); return; }
    const rows = await db.select().from(legalNotes).where(eq(legalNotes.matterId, matterId)).orderBy(desc(legalNotes.createdAt));
    res.json({ notes: rows.map(n => ({ ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() })) });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.post("/notes", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const { matterId, content } = req.body as { matterId: number; content: string };
    if (!content?.trim()) { res.status(400).json({ error: "content required" }); return; }
    const [row] = await db.insert(legalNotes).values({ matterId, content: content.trim() }).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.put("/notes/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    const id = Number(req.params.id as string);
    const { content } = req.body as { content: string };
    const [row] = await db.update(legalNotes).set({ content: content.trim(), updatedAt: new Date() }).where(eq(legalNotes.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

router.delete("/notes/:id", async (req: Request, res: Response) => {
  if (!isAuth(req, res)) return;
  try {
    await db.delete(legalNotes).where(eq(legalNotes.id, Number(req.params.id as string)));
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

export default router;
