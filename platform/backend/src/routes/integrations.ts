import { Router, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// ─── Integration registry ─────────────────────────────────────────────────────
// Defines the integration connectors the platform supports (or plans to support).
// "status" reflects current implementation state.

const INTEGRATION_REGISTRY = [
  {
    id:          "fhir-r4",
    name:        "FHIR R4 API",
    description: "HL7 FHIR R4 REST API. Supported by modern EHR systems including PointClickCare Marketplace, Epic, and Cerner. Used for patient demographics, encounters, medications, and observations.",
    category:    "ehr",
    protocol:    "FHIR R4 / REST",
    status:      "test-stub",
    testServer:  "https://hapi.fhir.org/baseR4",
    docsUrl:     "https://hl7.org/fhir/R4/",
    vendors:     ["PointClickCare", "MatrixCare", "Epic", "Cerner"],
  },
  {
    id:          "hl7-v2-mllp",
    name:        "HL7 v2 MLLP",
    description: "HL7 version 2 messages over MLLP (Minimum Lower Layer Protocol). Used by most legacy nursing home EHRs, pharmacy systems (PharMerica, Omnicare), and lab systems. ADT, ORU, RDE, RDS message types.",
    category:    "ehr",
    protocol:    "HL7 v2 / TCP",
    status:      "planned",
    docsUrl:     "https://www.hl7.org/implement/standards/product_brief.cfm?product_id=185",
    vendors:     ["PointClickCare (HL7)", "MatrixCare", "American HealthTech", "PharMerica", "Omnicare"],
  },
  {
    id:          "sftp-flat-file",
    name:        "SFTP Flat File Import",
    description: "Scheduled flat file transfers via SFTP. Used by pharmacy systems (nightly medication reconciliation), billing vendors (835 remittance files), and HR systems (schedule exports).",
    category:    "file",
    protocol:    "SFTP / CSV / Fixed-width",
    status:      "planned",
    vendors:     ["PharMerica", "Omnicare", "Waystar", "OnShift"],
  },
  {
    id:          "clearinghouse-api",
    name:        "Billing Clearinghouse API",
    description: "REST API integration with a healthcare claims clearinghouse for 837 claim submission and 835 remittance retrieval.",
    category:    "billing",
    protocol:    "REST / X12 EDI",
    status:      "planned",
    vendors:     ["Waystar", "Change Healthcare", "ABILITY Network"],
  },
  {
    id:          "smart-on-fhir",
    name:        "SMART on FHIR Auth",
    description: "OAuth 2.0 / SMART on FHIR authorization layer required by EHR vendor Marketplace APIs (e.g., PointClickCare Marketplace). Enables secure delegated access to patient data.",
    category:    "auth",
    protocol:    "OAuth 2.0 / SMART on FHIR",
    status:      "planned",
    docsUrl:     "https://docs.smarthealthit.org/",
    vendors:     ["PointClickCare Marketplace", "Epic App Orchard"],
  },
];

// ─── GET /integrations ────────────────────────────────────────────────────────
// Returns the full integration registry.

router.get("/", (_req: Request, res: Response): void => {
  res.json({ integrations: INTEGRATION_REGISTRY });
});

// ─── GET /integrations/fhir-r4/test ──────────────────────────────────────────
// Calls the public HAPI FHIR R4 test server and returns a small Patient bundle.
// This demonstrates FHIR connectivity against synthetic test data.
// IMPORTANT: Never proxy real EHR endpoints here — real PHI must only flow
// after a BAA is signed and encryption is in place.

router.get("/fhir-r4/test", requireRole("admin", "super_admin"), async (_req: Request, res: Response): Promise<void> => {
  const HAPI_FHIR_BASE = "https://hapi.fhir.org/baseR4";
  try {
    const response = await fetch(`${HAPI_FHIR_BASE}/Patient?_count=3&_format=json`, {
      headers: { Accept: "application/fhir+json" },
      signal:  AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      res.status(502).json({
        error: `HAPI FHIR test server returned ${response.status}. It may be temporarily unavailable.`,
      });
      return;
    }

    const bundle = await response.json() as {
      resourceType: string;
      total: number;
      entry?: { resource: { resourceType: string; id: string; name?: { family?: string }[] } }[];
    };

    const patients = (bundle.entry ?? []).map((e) => ({
      resourceType: e.resource.resourceType,
      id:           e.resource.id,
      familyName:   e.resource.name?.[0]?.family ?? "(no name)",
    }));

    res.json({
      source:        "HAPI FHIR public test server (synthetic data only)",
      serverUrl:     HAPI_FHIR_BASE,
      resourceType:  bundle.resourceType,
      total:         bundle.total,
      patients,
      note: "These are synthetic test patients from hapi.fhir.org. No PHI is involved.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({
      error: "Could not reach HAPI FHIR test server.",
      detail: message,
      note:   "Check internet connectivity from the backend container.",
    });
  }
});

// ─── GET /integrations/hl7-v2/test ───────────────────────────────────────────
// Returns a sample HL7 v2 ADT^A01 (Admit) message for schema validation testing.
// Shows the message structure the platform would need to parse from an MLLP
// connection to a real EHR.

router.get("/hl7-v2/test", requireRole("admin", "super_admin"), (_req: Request, res: Response): void => {
  const sampleADT = [
    "MSH|^~\\&|SENDING_APP|SENDING_FACILITY|UNIVERSAL_PLATFORM|PLATFORM_FACILITY|20240315120000||ADT^A01|MSG00001|P|2.5.1",
    "EVN|A01|20240315120000",
    "PID|1||TEST-MRN-001^^^FACILITY&2.16.840.1.113883.19.5&ISO^MR||Smith^John^A||19420315|M|||123 Main St^^Springfield^IL^62701||555-555-1234|||S",
    "PV1|1|I|MED-WEST^101^A^FACILITY|E|||123456789^Attending^Doctor|||||||||||V123456|||||||||||||||||||||||||20240315120000",
    "DG1|1||J18.9^Pneumonia, unspecified organism^ICD10|||A",
  ].join("\r");

  res.json({
    source:         "Synthetic HL7 v2.5.1 ADT^A01 sample",
    messageType:    "ADT^A01 (Patient Admission)",
    segments: {
      MSH: "Message header — sending/receiving system identity, message type, timestamp",
      EVN: "Event type — A01 = Admit",
      PID: "Patient identification — MRN, name, DOB, sex, address",
      PV1: "Patient visit — location (room/bed), attending physician, visit ID",
      DG1: "Diagnosis — ICD-10 code, description",
    },
    rawMessage: sampleADT,
    parsingNote: [
      "To receive real HL7 v2 messages, this platform needs an MLLP TCP listener.",
      "Recommended approach: deploy Mirth Connect as integration middleware.",
      "Mirth transforms HL7 segments into JSON and POSTs to /api/integrations/hl7-v2/ingest.",
    ],
    note: "This is a sample message with SYNTHETIC data only. No PHI is present.",
  });
});

export default router;
