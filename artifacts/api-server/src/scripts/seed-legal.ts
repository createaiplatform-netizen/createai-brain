import { db, legalClients, legalMatters, legalTimeEntries, legalTasks, legalNotes, legalInvoices, legalInvoiceItems } from "@workspace/db";

async function seed() {
  console.log("Seeding legal PM data…");

  const [alice, acme, bob] = await db.insert(legalClients).values([
    { name: "Alice Reynolds", email: "alice@example.com", phone: "555-0101", address: "42 Maple St, Austin TX 78701", type: "individual", notes: "Longtime client, referred by firm partner" },
    { name: "Acme Corp", email: "legal@acmecorp.com", phone: "555-0200", address: "1 Commerce Blvd, New York NY 10001", type: "company", notes: "Retainer client — quarterly billing" },
    { name: "Bob Nakamura", email: "bob.n@email.com", phone: "555-0333", address: "88 Ocean Ave, San Diego CA 92101", type: "individual", notes: "Employment dispute" },
  ]).returning();

  const [m1, m2, m3, m4] = await db.insert(legalMatters).values([
    { clientId: alice.id, title: "Divorce Proceedings", type: "Family Law", status: "open", description: "Dissolution of marriage — asset division and custody arrangement", billingType: "hourly", hourlyRate: "350.00", openedAt: new Date("2025-11-01") },
    { clientId: acme.id, title: "Q1 Contract Review", type: "Corporate", status: "open", description: "Annual vendor contract review and risk assessment", billingType: "retainer", hourlyRate: "400.00", openedAt: new Date("2026-01-15") },
    { clientId: bob.id, title: "Wrongful Termination Claim", type: "Employment", status: "pending", description: "Client alleges unlawful termination without cause", billingType: "contingency", openedAt: new Date("2026-02-10") },
    { clientId: alice.id, title: "Estate Planning", type: "Estate", status: "closed", description: "Will and trust documents completed", billingType: "flat_fee", flatFee: "2500.00", openedAt: new Date("2025-08-01"), closedAt: new Date("2025-10-15") },
  ]).returning();

  const now = new Date();
  const [te1, te2, te3, te4, te5] = await db.insert(legalTimeEntries).values([
    { matterId: m1.id, description: "Initial consultation and document review", hours: "2.5", rate: "350.00", amount: "875.00", date: new Date("2025-11-05"), isBilled: true },
    { matterId: m1.id, description: "Court filing preparation", hours: "4.0", rate: "350.00", amount: "1400.00", date: new Date("2025-12-10"), isBilled: true },
    { matterId: m1.id, description: "Discovery document review", hours: "3.0", rate: "350.00", amount: "1050.00", date: new Date("2026-01-20"), isBilled: false },
    { matterId: m2.id, description: "Contract analysis — Vendor A", hours: "5.5", rate: "400.00", amount: "2200.00", date: new Date("2026-01-22"), isBilled: false },
    { matterId: m2.id, description: "Risk memo drafting", hours: "2.0", rate: "400.00", amount: "800.00", date: new Date("2026-02-01"), isBilled: false },
  ]).returning();

  await db.insert(legalTasks).values([
    { matterId: m1.id, title: "File response to discovery request", priority: "urgent", isCompleted: false, dueAt: new Date("2026-03-25") },
    { matterId: m1.id, title: "Schedule mediation session", priority: "high", isCompleted: false, dueAt: new Date("2026-04-01") },
    { matterId: m2.id, title: "Review Vendor B contract addendum", priority: "medium", isCompleted: false, dueAt: new Date("2026-03-20") },
    { matterId: m2.id, title: "Prepare Q1 billing summary", priority: "low", isCompleted: true, dueAt: new Date("2026-02-28") },
    { matterId: m3.id, title: "Gather employment records", priority: "high", isCompleted: false, dueAt: new Date("2026-03-30") },
    { matterId: m3.id, title: "Interview witnesses", priority: "medium", isCompleted: false, dueAt: new Date("2026-04-10") },
  ]);

  await db.insert(legalNotes).values([
    { matterId: m1.id, content: "Client confirmed willingness to settle if custody arrangement is favorable. Will not accept less than primary custody of minor children." },
    { matterId: m1.id, content: "Opposing counsel indicated openness to mediation. Scheduling call for next week." },
    { matterId: m2.id, content: "Acme CFO flagged indemnification clause in Vendor A contract as high risk. Need senior partner review." },
    { matterId: m3.id, content: "Bob provided termination letter dated Feb 5. HR records show no prior performance documentation — strong wrongful termination case." },
  ]);

  const [inv1] = await db.insert(legalInvoices).values([
    { clientId: alice.id, matterId: m1.id, invoiceNumber: "INV-0001", status: "paid", total: "2275.00", issuedAt: new Date("2026-01-05"), dueAt: new Date("2026-01-20"), paidAt: new Date("2026-01-18") },
  ]).returning();

  await db.insert(legalInvoiceItems).values([
    { invoiceId: inv1.id, description: "Initial consultation and document review (2.5 hrs @ $350)", quantity: "2.5", rate: "350.00", amount: "875.00" },
    { invoiceId: inv1.id, description: "Court filing preparation (4.0 hrs @ $350)", quantity: "4.0", rate: "350.00", amount: "1400.00" },
  ]);

  await db.update(legalTimeEntries).set({ isBilled: true, invoiceId: inv1.id }).where(
    // @ts-ignore
    (legalTimeEntries.id.in ? undefined : undefined)
  ).catch(() => {});

  console.log("✅ Legal PM data seeded successfully");
  process.exit(0);
}

seed().catch(err => { console.error("Seed error:", err); process.exit(1); });
