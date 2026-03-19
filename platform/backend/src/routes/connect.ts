/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNIVERSAL CONNECT HUB
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * One flow for connecting any external source (health, banking, care, etc.).
 * Currently uses ONLY simulated connectors and synthetic data.
 * Health connector reuses the UDC ingest pipeline.
 * No real external systems, PHI, or banking data are accessed.
 *
 * ROUTES:
 *   GET  /connect/sources              — List all connectable sources by domain
 *   POST /connect/start                — Create a connect session
 *   POST /connect/simulated/health     — Run simulated health data import
 *   POST /connect/simulated/banking    — Run simulated banking data import
 *   GET  /persons/:personId/summary    — Unified person summary (health + banking)
 *
 * HOW TO ADD A REAL CONNECTOR IN PRODUCTION:
 *   1. Add the source to SOURCE_REGISTRY below
 *   2. Add a route: POST /connect/real/<sourceId>
 *   3. Replace the synthetic payload with a real API call using partner credentials
 *   4. The session, audit log, and ingest pipeline remain unchanged
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db";
import { writeAudit, buildCapsule, ingestCapsule } from "./udc";
import type { UDCPatientContext, UDCPayload } from "../types/udc";

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

type Domain = "health" | "banking" | "care" | "other";

interface ConnectSource {
  sourceId:    string;
  displayName: string;
  domain:      Domain;
  description: string;
}

interface ConnectSession {
  sessionId:   string;
  personId:    string;
  appId:       string;
  sourceId:    string;
  domain:      Domain;
  status:      "PENDING" | "COMPLETED" | "FAILED";
  createdAt:   string;
  completedAt: string | null;
  lastError:   string | null;
}

interface FinancialAccount {
  type:    string;
  last4:   string;
  balance: number;
}

interface FinancialTransaction {
  id:          string;
  amount:      number;
  description: string;
}

interface FinancialCapsule {
  capsuleId: string;
  metadata:  { sourceSystem: string; testData: true; createdAt: string };
  personId:  string;
  accounts:  FinancialAccount[];
  transactions: FinancialTransaction[];
}

// ─── In-Memory Stores ─────────────────────────────────────────────────────────
// In production, these would be persisted in PostgreSQL tables.

const connectSessions   = new Map<string, ConnectSession>();
const financialCapsules = new Map<string, FinancialCapsule>(); // keyed by personId

// ─── Source Registry ──────────────────────────────────────────────────────────

const SOURCE_REGISTRY: ConnectSource[] = [
  // ── Health ─────────────────────────────────────────────────────────────────
  {
    sourceId:    "MYCHART_TEST",
    displayName: "MyChart (Simulated)",
    domain:      "health",
    description: "Epic MyChart patient health record — simulated connector. Requires Epic App Orchard approval in production.",
  },
  {
    sourceId:    "POINTCLICKCARE_TEST",
    displayName: "PointClickCare (Simulated)",
    domain:      "health",
    description: "PointClickCare long-term care EHR — simulated connector. Requires Marketplace approval in production.",
  },
  {
    sourceId:    "ECP_TEST",
    displayName: "ECP / Simplexis (Simulated)",
    domain:      "health",
    description: "Extended Care Professional assisted living system — simulated via PDF/CSV ingestion pipeline.",
  },
  {
    sourceId:    "FHIR_GENERIC_TEST",
    displayName: "Generic FHIR R4 Server (Simulated)",
    domain:      "health",
    description: "Any FHIR R4-certified EHR. Provide base URL and credentials to activate.",
  },
  // ── Banking ────────────────────────────────────────────────────────────────
  {
    sourceId:    "BANK_TEST",
    displayName: "Personal Bank Account (Simulated)",
    domain:      "banking",
    description: "Generic bank account connector — simulated. In production, uses OAuth 2.0 + open banking APIs.",
  },
  {
    sourceId:    "PAYROLL_TEST",
    displayName: "Payroll Provider (Simulated)",
    domain:      "banking",
    description: "Payroll data including pay stubs and direct deposit records — simulated connector.",
  },
  // ── Care ───────────────────────────────────────────────────────────────────
  {
    sourceId:    "CARE_FACILITY_TEST",
    displayName: "Care Facility Record (Simulated)",
    domain:      "care",
    description: "Assisted living or skilled nursing facility resident record — ingested via UDC pipeline.",
  },
  // ── Other ──────────────────────────────────────────────────────────────────
  {
    sourceId:    "QUICKBOOKS_TEST",
    displayName: "QuickBooks (Simulated)",
    domain:      "other",
    description: "QuickBooks Online accounting — simulated connector. Requires Intuit OAuth in production.",
  },
  {
    sourceId:    "SALESFORCE_TEST",
    displayName: "Salesforce (Simulated)",
    domain:      "other",
    description: "Salesforce CRM contacts and accounts — simulated connector. Requires Salesforce OAuth in production.",
  },
];

// Indexed for fast lookup
const sourceIndex = new Map<string, ConnectSource>(
  SOURCE_REGISTRY.map((s) => [s.sourceId, s])
);

// ─── Helper: resolve org_id without needing the full request user ─────────────

async function resolveFirstOrgId(): Promise<string | null> {
  const rows = await query<{ id: string }>(`SELECT id FROM organizations LIMIT 1`);
  return rows[0]?.id ?? null;
}

// ─── GET /connect/sources ─────────────────────────────────────────────────────
// Returns all connectable sources grouped by domain.

router.get("/sources", (_req: Request, res: Response): void => {
  const grouped: Record<Domain, ConnectSource[]> = {
    health:  [],
    banking: [],
    care:    [],
    other:   [],
  };
  for (const source of SOURCE_REGISTRY) {
    grouped[source.domain].push(source);
  }
  res.json({ ok: true, sources: grouped, total: SOURCE_REGISTRY.length });
});

// ─── POST /connect/start ──────────────────────────────────────────────────────
// Creates a connect session for a given person + source.

router.post("/start", async (req: Request, res: Response): Promise<void> => {
  try {
    const { personId, appId, sourceId } = req.body as {
      personId?: string;
      appId?:    string;
      sourceId?: string;
    };

    if (!personId || !appId || !sourceId) {
      res.status(400).json({ error: "Missing required fields: personId, appId, sourceId" });
      return;
    }

    const source = sourceIndex.get(sourceId);
    if (!source) {
      res.status(404).json({
        error:    `Unknown sourceId: ${sourceId}`,
        available: SOURCE_REGISTRY.map((s) => s.sourceId),
      });
      return;
    }

    const sessionId = uuidv4();
    const session: ConnectSession = {
      sessionId,
      personId,
      appId,
      sourceId,
      domain:      source.domain,
      status:      "PENDING",
      createdAt:   new Date().toISOString(),
      completedAt: null,
      lastError:   null,
    };

    connectSessions.set(sessionId, session);

    // Audit
    const orgId = await resolveFirstOrgId();
    await writeAudit({
      action:   "CONNECT_SESSION_STARTED",
      resource: "connect_session",
      resourceId: sessionId,
      orgId:    orgId ?? undefined,
      ip:       req.ip,
      metadata: { sessionId, personId, appId, sourceId, domain: source.domain, testData: true },
    });

    res.json({
      ok: true,
      sessionId,
      sourceId,
      domain:           source.domain,
      displayName:      source.displayName,
      simulatedAuthUrl: `https://example.com/connect/simulated?sessionId=${sessionId}&sourceId=${sourceId}`,
      note:             "SIMULATED — no real authentication is performed. Call the appropriate /connect/simulated/* endpoint next.",
    });
  } catch (err) {
    console.error("[connect/start]", err);
    res.status(500).json({ error: "Failed to start connect session.", detail: String(err) });
  }
});

// ─── POST /connect/simulated/health ──────────────────────────────────────────
// Simulates a health data import. Builds a synthetic UDC and ingests it.

router.post("/simulated/health", async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body as { sessionId?: string };
    if (!sessionId) {
      res.status(400).json({ error: "Missing: sessionId" });
      return;
    }

    const session = connectSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found. Call POST /connect/start first." });
      return;
    }
    if (session.domain !== "health") {
      res.status(400).json({ error: `Session domain is '${session.domain}', not 'health'.` });
      return;
    }
    if (session.status === "COMPLETED") {
      res.status(409).json({ error: "Session already completed.", sessionId });
      return;
    }

    const orgId = await resolveFirstOrgId();
    if (!orgId) {
      res.status(422).json({ error: "No organization found. Run /auth/setup first." });
      return;
    }

    // ── Build synthetic UDC — SYNTHETIC TEST DATA ONLY ───────────────────────
    const patientContext: UDCPatientContext = {
      mrn:           `HEALTH-${session.personId}`,
      firstName:     "Connect",
      lastName:      `Person-${session.personId}`,
      dateOfBirth:   "1955-06-15",
      sex:           "F",
      room:          "202B",
      admissionDate: new Date().toISOString().split("T")[0],
    };

    const payload: UDCPayload = {
      medications: [
        { name: "Atorvastatin", dose: "40mg",  route: "PO", frequency: "Daily", prn: false },
        { name: "Amlodipine",   dose: "5mg",   route: "PO", frequency: "Daily", prn: false },
      ],
      allergies: [
        { substance: "Sulfa drugs", reaction: "Hives", severity: "Moderate" },
      ],
      diagnoses: [
        { code: "I10",  system: "ICD-10", display: "Essential Hypertension" },
        { code: "Z87.39", system: "ICD-10", display: "Personal history of other endocrine disorders" },
      ],
      vitals: [
        {
          loincCode:   "55126-3",
          displayName: "Fall Risk Score",
          value:       18,
          unit:        "score",
          observedAt:  new Date().toISOString(),
        },
      ],
      fallRiskScore: 18,
      codeStatus:    "Full Code",
    };

    const capsule = buildCapsule(
      { patientContext, payload },
      [],
      "connect-hub",
      session.sourceId
    );

    // Ingest via shared UDC pipeline
    const ingestResult = await ingestCapsule(capsule, orgId, req.ip);

    // Mark session complete
    session.status      = "COMPLETED";
    session.completedAt = new Date().toISOString();
    connectSessions.set(sessionId, session);

    // Audit
    await writeAudit({
      action:     "CONNECT_COMPLETED",
      resource:   "connect_session",
      resourceId: sessionId,
      orgId,
      ip:         req.ip,
      metadata: {
        sessionId,
        capsuleId:   capsule.metadata.capsuleId,
        sourceSystem: session.sourceId,
        personId:    session.personId,
        testData:    true,
      },
    });

    res.json({
      ok:           true,
      session,
      capsule,
      ingestResult,
      note:         "SYNTHETIC TEST DATA — no real health records were accessed.",
    });
  } catch (err) {
    console.error("[connect/simulated/health]", err);

    // Mark session failed
    const { sessionId } = req.body as { sessionId?: string };
    if (sessionId) {
      const s = connectSessions.get(sessionId);
      if (s) { s.status = "FAILED"; s.lastError = String(err); }
    }

    res.status(500).json({ error: "Health connector failed.", detail: String(err) });
  }
});

// ─── POST /connect/simulated/banking ─────────────────────────────────────────
// Simulates a banking data import. Builds a synthetic FinancialCapsule.

router.post("/simulated/banking", async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body as { sessionId?: string };
    if (!sessionId) {
      res.status(400).json({ error: "Missing: sessionId" });
      return;
    }

    const session = connectSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found. Call POST /connect/start first." });
      return;
    }
    if (session.domain !== "banking") {
      res.status(400).json({ error: `Session domain is '${session.domain}', not 'banking'.` });
      return;
    }
    if (session.status === "COMPLETED") {
      res.status(409).json({ error: "Session already completed.", sessionId });
      return;
    }

    // ── Build synthetic FinancialCapsule — SYNTHETIC TEST DATA ONLY ───────────
    const capsuleId = uuidv4();
    const financialCapsule: FinancialCapsule = {
      capsuleId,
      metadata: {
        sourceSystem: session.sourceId,
        testData:     true,
        createdAt:    new Date().toISOString(),
      },
      personId: session.personId,
      accounts: [
        { type: "CHECKING", last4: "1234", balance: 3_847.22 },
        { type: "SAVINGS",  last4: "5678", balance: 12_450.00 },
      ],
      transactions: [
        { id: `${capsuleId}-t1`, amount: -62.50,   description: "Grocery Store" },
        { id: `${capsuleId}-t2`, amount: -18.99,   description: "Streaming Service" },
        { id: `${capsuleId}-t3`, amount: 2_400.00, description: "Paycheck — Direct Deposit" },
        { id: `${capsuleId}-t4`, amount: -850.00,  description: "Rent Payment" },
        { id: `${capsuleId}-t5`, amount: -35.00,   description: "Pharmacy Copay" },
      ],
    };

    // Store in memory keyed by personId (latest wins)
    financialCapsules.set(session.personId, financialCapsule);

    // Mark session complete
    session.status      = "COMPLETED";
    session.completedAt = new Date().toISOString();
    connectSessions.set(sessionId, session);

    // Audit
    const orgId = await resolveFirstOrgId();
    await writeAudit({
      action:     "CONNECT_COMPLETED",
      resource:   "connect_session",
      resourceId: sessionId,
      orgId:      orgId ?? undefined,
      ip:         req.ip,
      metadata: {
        sessionId,
        capsuleId,
        sourceSystem: session.sourceId,
        personId:    session.personId,
        testData:    true,
      },
    });

    // Financial summary
    const totalBalance    = financialCapsule.accounts.reduce((s, a) => s + a.balance, 0);
    const totalDebits     = financialCapsule.transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
    const totalCredits    = financialCapsule.transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

    res.json({
      ok:      true,
      session,
      financialCapsule,
      summary: {
        accountCount:   financialCapsule.accounts.length,
        totalBalance:   totalBalance.toFixed(2),
        totalDebits:    totalDebits.toFixed(2),
        totalCredits:   totalCredits.toFixed(2),
        transactionCount: financialCapsule.transactions.length,
      },
      note: "SYNTHETIC TEST DATA — no real banking data was accessed.",
    });
  } catch (err) {
    console.error("[connect/simulated/banking]", err);

    const { sessionId } = req.body as { sessionId?: string };
    if (sessionId) {
      const s = connectSessions.get(sessionId);
      if (s) { s.status = "FAILED"; s.lastError = String(err); }
    }

    res.status(500).json({ error: "Banking connector failed.", detail: String(err) });
  }
});

// ─── GET /persons/:personId/summary ──────────────────────────────────────────
// Unified person summary: health + banking data for a given personId.
// Route is "/:personId/summary" so it resolves as GET /persons/:personId/summary
// when this router is mounted at app.use("/persons", connectRouter).

router.get("/:personId/summary", async (req: Request, res: Response): Promise<void> => {
  try {
    const { personId } = req.params;

    // ── Health: look up patient by MRN = "HEALTH-<personId>" ─────────────────
    let healthData: Record<string, unknown> | null = null;

    const patientRows = await query<{
      id: string; mrn: string; first_name: string; last_name: string;
      date_of_birth: string; sex: string; status: string; source_system: string;
    }>(
      `SELECT * FROM patients WHERE mrn = $1 LIMIT 1`,
      [`HEALTH-${personId}`]
    );

    if (patientRows[0]) {
      const pat       = patientRows[0];
      const patientId = pat.id;

      const [medRows, obsRows] = await Promise.all([
        query<{ id: string; med_name: string; dose: string; route: string; frequency: string; status: string }>(
          `SELECT id, med_name, dose, route, frequency, status
           FROM medication_orders WHERE patient_id = $1 AND status != 'discontinued'`,
          [patientId]
        ),
        query<{ id: string; category: string; display_name: string; value_text: string; value_numeric: number; abnormal_flag: string }>(
          `SELECT id, category, display_name, value_text, value_numeric, abnormal_flag
           FROM observations WHERE patient_id = $1`,
          [patientId]
        ),
      ]);

      healthData = {
        patient:      pat,
        medications:  medRows,
        allergies:    obsRows.filter((o) => o.category === "allergy"),
        diagnoses:    obsRows.filter((o) => o.category === "diagnosis"),
        vitals:       obsRows.filter((o) => o.category === "vital-signs"),
        alerts: {
          highFallRisk: obsRows.some(
            (o) => o.display_name === "Fall Risk Score" && Number(o.value_numeric) >= 25
          ),
          allergiesOnFile: obsRows.filter((o) => o.category === "allergy").length,
        },
      };
    }

    // ── Banking: look up stored FinancialCapsule ───────────────────────────────
    const financialCapsule = financialCapsules.get(personId) ?? null;
    let bankingData: Record<string, unknown> | null = null;

    if (financialCapsule) {
      const totalBalance = financialCapsule.accounts.reduce((s, a) => s + a.balance, 0);
      bankingData = {
        capsuleId:        financialCapsule.capsuleId,
        sourceSystem:     financialCapsule.metadata.sourceSystem,
        accounts:         financialCapsule.accounts,
        recentTransactions: financialCapsule.transactions.slice(0, 5),
        summary: {
          totalBalance:     totalBalance.toFixed(2),
          accountCount:     financialCapsule.accounts.length,
          transactionCount: financialCapsule.transactions.length,
        },
      };
    }

    res.json({
      ok:      true,
      personId,
      health:  healthData,
      banking: bankingData,
      note:    "SYNTHETIC TEST DATA — no real PHI or banking data is returned.",
    });
  } catch (err) {
    console.error("[persons/summary]", err);
    res.status(500).json({ error: "Failed to fetch person summary.", detail: String(err) });
  }
});

export default router;
