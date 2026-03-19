/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Universal Data Capsule (UDC) — API Routes
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SAFETY NOTICE: This module uses SYNTHETIC TEST DATA ONLY.
 * No real PHI is stored or processed.
 * No connection is made to any external system (ECP, MyChart, PointClickCare, etc.).
 * No scraping, browser automation, or credential handling is used.
 * All operations are user-authorized and vendor-independent.
 *
 * ROUTES:
 *   POST /udc/generate   — Upload files → get a UDC JSON bundle back
 *   POST /udc/ingest     — Submit a UDC → write to clinical schema
 *   GET  /udc/test       — Full synthetic round-trip (generate + ingest in memory)
 *
 * HOW EXTRACTION WILL WORK IN PRODUCTION:
 *   Replace the `extractFromFiles()` stub below with your real AI/OCR pipeline.
 *   The UDC format and ingest logic do not change.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db";
import type {
  UniversalDataCapsule,
  UDCMetadata,
  UDCPatientContext,
  UDCPayload,
  UDCArtifact,
} from "../types/udc";

const router = Router();

// ─── Multer — in-memory storage (files never touch disk) ─────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024, files: 10 }, // 20 MB / 10 files max
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** HMAC-SHA256 of the capsule body using SESSION_SECRET. */
function signCapsule(body: object): { algorithm: string; value: string; signedAt: string } {
  const secret  = process.env.SESSION_SECRET ?? "dev-udc-secret";
  const payload = JSON.stringify(body);
  const value   = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return { algorithm: "HMAC-SHA256", value, signedAt: new Date().toISOString() };
}

/** Validate the required top-level fields of a UDC before ingest. */
function validateCapsule(obj: unknown): string | null {
  if (typeof obj !== "object" || obj === null) return "Body must be a JSON object.";
  const c = obj as Record<string, unknown>;
  if (!c.metadata)       return "Missing: metadata";
  if (!c.patientContext) return "Missing: patientContext";
  if (!c.payload)        return "Missing: payload";
  if (!Array.isArray(c.artifacts)) return "Missing: artifacts (must be array)";
  if (!c.signature)      return "Missing: signature";

  const m = c.metadata as Record<string, unknown>;
  if (!m.capsuleId)    return "Missing: metadata.capsuleId";
  if (!m.sourceSystem) return "Missing: metadata.sourceSystem";
  if (m.testData !== true) return "metadata.testData must be true (synthetic data only in v1)";

  const p = c.patientContext as Record<string, unknown>;
  if (!p.mrn)         return "Missing: patientContext.mrn";
  if (!p.firstName)   return "Missing: patientContext.firstName";
  if (!p.lastName)    return "Missing: patientContext.lastName";
  if (!p.dateOfBirth) return "Missing: patientContext.dateOfBirth";

  return null; // valid
}

/** Write one row to audit_log. Fire-and-forget — never throws. */
async function writeAudit(params: {
  action:      string;
  resource:    string;
  resourceId?: string;
  orgId?:      string;
  userId?:     string;
  userEmail?:  string;
  ip?:         string;
  metadata?:   Record<string, unknown>;
}): Promise<void> {
  await query(
    `INSERT INTO audit_log
       (user_id, user_email, org_id, action, resource, resource_id, ip_address, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      params.userId    ?? null,
      params.userEmail ?? null,
      params.orgId     ?? null,
      params.action,
      params.resource,
      params.resourceId ?? null,
      params.ip         ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ]
  ).catch((err) => console.error("[udc] audit write failed:", err));
}

/**
 * STUB: Extraction pipeline.
 * In production, replace this with your real AI/OCR pipeline.
 * The function signature and return shape do not change.
 */
function extractFromFiles(
  _files: Express.Multer.File[],
  sourceSystem: string
): { patientContext: UDCPatientContext; payload: UDCPayload } {
  // ── SYNTHETIC TEST DATA — NOT REAL PHI ────────────────────────────────────
  console.log(`[udc] STUB extraction — returning synthetic test data (sourceSystem: ${sourceSystem})`);
  return {
    patientContext: {
      mrn:          "UDC-TEST-001",
      firstName:    "Test",
      lastName:     "Resident",
      dateOfBirth:  "1940-01-01",
      sex:          "M",
      room:         "101A",
      admissionDate: new Date().toISOString().split("T")[0],
    },
    payload: {
      medications: [
        { name: "Lisinopril",  dose: "10mg",  route: "PO", frequency: "Daily", prn: false },
        { name: "Metformin",   dose: "500mg", route: "PO", frequency: "BID",   prn: false },
      ],
      allergies: [
        { substance: "Penicillin", reaction: "Rash", severity: "Moderate" },
      ],
      diagnoses: [
        { code: "E11.9", system: "ICD-10", display: "Type 2 Diabetes" },
      ],
      vitals: [
        {
          loincCode:   "55126-3",
          displayName: "Fall Risk Score",
          value:       45,
          unit:        "score",
          observedAt:  new Date().toISOString(),
        },
      ],
      fallRiskScore: 45,
      codeStatus:    "DNR",
    },
  };
}

/** Build a complete UDC from extracted data + file list. */
function buildCapsule(
  extracted: { patientContext: UDCPatientContext; payload: UDCPayload },
  artifacts: UDCArtifact[],
  createdBy: string,
  sourceSystem: string
): UniversalDataCapsule {
  const capsuleId = uuidv4();
  const metadata: UDCMetadata = {
    capsuleId,
    version:      "1.0",
    createdAt:    new Date().toISOString(),
    createdBy,
    sourceSystem,
    testData:     true,
  };

  const bodyToSign = { metadata, patientContext: extracted.patientContext, payload: extracted.payload, artifacts };
  const signature  = signCapsule(bodyToSign);

  return { metadata, patientContext: extracted.patientContext, payload: extracted.payload, artifacts, signature };
}

// ─── Ingest Logic (shared by /ingest and /test) ────────────────────────────────

async function ingestCapsule(
  capsule: UniversalDataCapsule,
  orgId:   string,
  ip?:     string
): Promise<{
  patient:      Record<string, unknown>;
  medications:  unknown[];
  observations: unknown[];
}> {
  const { patientContext: pc, payload, metadata } = capsule;

  // ── 1. Upsert patient ─────────────────────────────────────────────────────
  const patientRows = await query<{
    id: string; mrn: string; first_name: string; last_name: string;
    date_of_birth: string; sex: string; status: string; source_system: string;
  }>(
    `INSERT INTO patients
       (organization_id, mrn, first_name, last_name, date_of_birth, sex, admission_date, status, source_system)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'admitted', $8)
     ON CONFLICT (organization_id, mrn)
     DO UPDATE SET
       first_name   = EXCLUDED.first_name,
       last_name    = EXCLUDED.last_name,
       date_of_birth= EXCLUDED.date_of_birth,
       sex          = EXCLUDED.sex,
       source_system= EXCLUDED.source_system,
       updated_at   = NOW()
     RETURNING *`,
    [
      orgId,
      pc.mrn,
      pc.firstName,
      pc.lastName,
      pc.dateOfBirth,
      pc.sex    ?? null,
      pc.admissionDate ?? null,
      metadata.sourceSystem,
    ]
  );
  const patient = patientRows[0];
  const patientId = patient.id;

  // ── 2. Add patient_identifier (external MRN mapping) ──────────────────────
  await query(
    `INSERT INTO patient_identifiers (patient_id, system, value)
     VALUES ($1, $2, $3)
     ON CONFLICT (system, value) DO NOTHING`,
    [patientId, `UDC:${metadata.sourceSystem}`, pc.mrn]
  ).catch(() => {}); // ignore duplicate safely

  // ── 3. Upsert medication orders ───────────────────────────────────────────
  const medicationRows: unknown[] = [];
  if (payload.medications?.length) {
    for (const med of payload.medications) {
      const medRows = await query<{ id: string; med_name: string; dose: string; route: string; frequency: string; status: string }>(
        `INSERT INTO medication_orders
           (patient_id, organization_id, med_name, dose, route, frequency, prn, status, source_system, start_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_confirmation', $8, NOW()::date)
         RETURNING *`,
        [patientId, orgId, med.name, med.dose, med.route, med.frequency, med.prn ?? false, metadata.sourceSystem]
      ).catch(() => [] as { id: string; med_name: string; dose: string; route: string; frequency: string; status: string }[]);
      if (medRows[0]) medicationRows.push(medRows[0]);
    }
  }

  // ── 4. Observations: allergies ────────────────────────────────────────────
  const observationRows: unknown[] = [];
  if (payload.allergies?.length) {
    for (const allergy of payload.allergies) {
      const obsRows = await query<{ id: string; category: string; display_name: string; value_text: string }>(
        `INSERT INTO observations
           (patient_id, organization_id, category, loinc_code, display_name, value_text, source_system)
         VALUES ($1, $2, 'allergy', '52473-6', $3, $4, $5)
         RETURNING *`,
        [patientId, orgId, `${allergy.substance} allergy`, `${allergy.reaction} (${allergy.severity ?? "unspecified"})`, metadata.sourceSystem]
      ).catch(() => [] as { id: string; category: string; display_name: string; value_text: string }[]);
      if (obsRows[0]) observationRows.push(obsRows[0]);
    }
  }

  // ── 5. Observations: fall risk score ─────────────────────────────────────
  if (payload.fallRiskScore !== undefined) {
    const obsRows = await query<{ id: string }>(
      `INSERT INTO observations
         (patient_id, organization_id, category, loinc_code, display_name, value_numeric, unit, abnormal_flag, source_system)
       VALUES ($1, $2, 'vital-signs', '55126-3', 'Fall Risk Score', $3, 'score', $4, $5)
       RETURNING *`,
      [
        patientId, orgId, payload.fallRiskScore,
        payload.fallRiskScore >= 25 ? "HIGH" : "NORMAL",
        metadata.sourceSystem,
      ]
    ).catch(() => [] as { id: string }[]);
    if (obsRows[0]) observationRows.push(obsRows[0]);
  }

  // ── 6. Observations: diagnoses ────────────────────────────────────────────
  if (payload.diagnoses?.length) {
    for (const dx of payload.diagnoses) {
      const obsRows = await query<{ id: string }>(
        `INSERT INTO observations
           (patient_id, organization_id, category, loinc_code, display_name, value_text, source_system)
         VALUES ($1, $2, 'diagnosis', $3, $4, $5, $6)
         RETURNING *`,
        [patientId, orgId, dx.code, dx.display, `${dx.system}: ${dx.code}`, metadata.sourceSystem]
      ).catch(() => [] as { id: string }[]);
      if (obsRows[0]) observationRows.push(obsRows[0]);
    }
  }

  // ── 7. Audit log ──────────────────────────────────────────────────────────
  await writeAudit({
    action:     "UDC_INGESTED",
    resource:   "patient",
    resourceId: patientId,
    orgId,
    ip,
    metadata: {
      capsuleId:    metadata.capsuleId,
      sourceSystem: metadata.sourceSystem,
      mrn:          pc.mrn,
      testData:     true,
      medsCreated:  medicationRows.length,
      obsCreated:   observationRows.length,
    },
  });

  return { patient, medications: medicationRows, observations: observationRows };
}

// ─── Helper: resolve a valid org_id to use for system-level operations ─────────

async function resolveOrgId(req: Request): Promise<string | null> {
  // Use authenticated user's org if available
  const user = (req as Request & { user?: { organizationId?: string } }).user;
  if (user?.organizationId) return user.organizationId;
  // Fall back to first org in DB (suitable for test/demo only)
  const rows = await query<{ id: string }>(`SELECT id FROM organizations LIMIT 1`);
  return rows[0]?.id ?? null;
}

// ─── POST /udc/generate ───────────────────────────────────────────────────────
// Accepts uploaded files, runs (stub) extraction, returns a UDC JSON bundle.

router.post(
  "/generate",
  upload.array("files", 10),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files        = (req.files as Express.Multer.File[]) ?? [];
      const sourceSystem = (req.body.sourceSystem as string) || "MANUAL";
      const user         = (req as Request & { user?: { id?: string; email?: string; organizationId?: string } }).user;
      const createdBy    = user?.id ?? "system";
      const orgId        = await resolveOrgId(req);

      // Build artifact descriptors from uploaded files (no content stored — hashes only)
      const artifacts: UDCArtifact[] = files.map((f) => ({
        filename:  f.originalname,
        mimeType:  f.mimetype,
        sizeBytes: f.size,
        sha256:    crypto.createHash("sha256").update(f.buffer).digest("hex"),
      }));

      // Extraction pipeline (stub — replace with real AI/OCR in production)
      const extracted = extractFromFiles(files, sourceSystem);

      // Build and sign the capsule
      const capsule = buildCapsule(extracted, artifacts, createdBy, sourceSystem);

      // Audit log
      await writeAudit({
        action:     "UDC_GENERATED",
        resource:   "udc",
        resourceId: capsule.metadata.capsuleId,
        orgId:      orgId ?? undefined,
        userId:     user?.id,
        userEmail:  user?.email,
        ip:         req.ip,
        metadata: {
          capsuleId:     capsule.metadata.capsuleId,
          sourceSystem,
          artifactCount: artifacts.length,
          testData:      true,
        },
      });

      res.json({
        ok:        true,
        capsule,
        note:      "SYNTHETIC TEST DATA — extraction was stubbed. Plug in real pipeline at extractFromFiles().",
        artifacts: artifacts.length > 0
          ? `${artifacts.length} file(s) received and hashed.`
          : "No files uploaded — synthetic data used.",
      });
    } catch (err) {
      console.error("[udc/generate]", err);
      res.status(500).json({ error: "UDC generation failed.", detail: String(err) });
    }
  }
);

// ─── POST /udc/ingest ─────────────────────────────────────────────────────────
// Accepts a UDC JSON body, validates it, writes to clinical schema.

router.post("/ingest", async (req: Request, res: Response): Promise<void> => {
  try {
    const capsule = req.body as UniversalDataCapsule;

    // Validate structure
    const validationError = validateCapsule(capsule);
    if (validationError) {
      res.status(400).json({ error: "Invalid UDC.", detail: validationError });
      return;
    }

    // Resolve org
    const orgId = await resolveOrgId(req);
    if (!orgId) {
      res.status(422).json({ error: "No organization found. Run /auth/setup first." });
      return;
    }

    const result = await ingestCapsule(capsule, orgId, req.ip);

    res.json({
      ok:      true,
      capsuleId: capsule.metadata.capsuleId,
      result,
      note:    "SYNTHETIC TEST DATA — no real PHI was stored.",
    });
  } catch (err) {
    console.error("[udc/ingest]", err);
    res.status(500).json({ error: "UDC ingestion failed.", detail: String(err) });
  }
});

// ─── GET /udc/test ────────────────────────────────────────────────────────────
// Generates a synthetic UDC in memory, immediately ingests it, returns full result.
// No file upload required. Pure end-to-end proof-of-concept.

router.get("/test", async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) {
      res.status(422).json({ error: "No organization found. Run /auth/setup first to create one." });
      return;
    }

    // Build a synthetic capsule entirely in memory
    const extracted  = extractFromFiles([], "TEST");
    const capsule    = buildCapsule(extracted, [], "system-test", "TEST");

    // Audit: generation
    await writeAudit({
      action:   "UDC_GENERATED",
      resource: "udc",
      resourceId: capsule.metadata.capsuleId,
      orgId,
      ip:       req.ip,
      metadata: { capsuleId: capsule.metadata.capsuleId, sourceSystem: "TEST", testData: true, route: "GET /udc/test" },
    });

    // Immediately ingest
    const result = await ingestCapsule(capsule, orgId, req.ip);

    res.json({
      ok: true,
      note: [
        "SYNTHETIC TEST DATA — this is a full UDC round-trip using fake resident data.",
        "No real PHI was generated or stored.",
        "No external system was contacted.",
        "To use with real (future) data: POST /udc/generate with actual files, then POST /udc/ingest.",
      ],
      capsule,
      ingestResult: result,
    });
  } catch (err) {
    console.error("[udc/test]", err);
    res.status(500).json({ error: "UDC test flow failed.", detail: String(err) });
  }
});

export default router;
