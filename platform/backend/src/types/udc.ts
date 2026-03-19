/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Universal Data Capsule (UDC) — Type Definitions + JSON Schema
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * WHAT IS A UNIVERSAL DATA CAPSULE?
 * A UDC is a single, portable, self-describing JSON bundle that carries clinical
 * or operational data extracted from any source system (ECP PDF exports, HL7
 * messages, FHIR resources, CSV files, etc.) without requiring a live API
 * connection to that system.
 *
 * WHY IT EXISTS:
 * Most long-term care EHRs (ECP, PointClickCare, MatrixCare) do not expose open
 * APIs. Facilities can always export data as PDF/CSV — those exports are the
 * patient's own data. A UDC wraps those exports into a structured, validated,
 * cryptographically identified bundle that this platform can ingest directly.
 *
 * HOW IT FITS INTO THE INTEGRATION HUB:
 *   1. Source system exports data  →  PDF / CSV / XML / CCD / JSON
 *   2. POST /udc/generate          →  Files uploaded; extraction runs; UDC produced
 *   3. POST /udc/ingest            →  UDC validated; written to clinical schema
 *   4. Audit log records every step — immutable, timestamped
 *
 * SAFETY RULES (enforced in code):
 *   - metadata.testData is always true in this implementation — synthetic only
 *   - No real PHI until BAA signed + risk analysis + column encryption + RLS
 *   - No connection to any external system is made during generate or ingest
 *   - All ingest operations are user-authorized or explicitly system-labeled
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─── Metadata ─────────────────────────────────────────────────────────────────

export interface UDCMetadata {
  capsuleId:    string;        // UUID v4 — unique per capsule
  version:      string;        // Capsule schema version, e.g. "1.0"
  createdAt:    string;        // ISO-8601 UTC timestamp
  createdBy:    string;        // userId, facilityId, or "system"
  sourceSystem: string;        // "ECP" | "PointClickCare" | "MANUAL" | "TEST"
  testData:     true;          // Always true — synthetic test data only (v1)
}

// ─── Patient Context ──────────────────────────────────────────────────────────

export interface UDCPatientContext {
  mrn:           string;       // Master Resident Number / external ID
  firstName:     string;
  lastName:      string;
  dateOfBirth:   string;       // YYYY-MM-DD
  sex?:          string;       // "M" | "F" | "U"
  room?:         string;
  admissionDate?: string;      // YYYY-MM-DD
}

// ─── Clinical Payload ─────────────────────────────────────────────────────────

export interface UDCMedication {
  name:        string;         // Drug name
  dose:        string;         // e.g. "10mg"
  route:       string;         // e.g. "PO"
  frequency:   string;         // e.g. "Daily" | "BID" | "TID"
  prn?:        boolean;        // As-needed flag
  rxnormCode?: string;         // Optional RxNorm code
}

export interface UDCAllergy {
  substance:  string;          // e.g. "Penicillin"
  reaction:   string;          // e.g. "Rash"
  severity?:  string;          // "Mild" | "Moderate" | "Severe"
}

export interface UDCDiagnosis {
  code:    string;             // e.g. "E11.9"
  system:  string;             // "ICD-10" | "SNOMED"
  display: string;             // e.g. "Type 2 Diabetes"
}

export interface UDCVital {
  loincCode:   string;         // e.g. "55126-3" (Fall risk score)
  displayName: string;         // e.g. "Fall Risk Score"
  value:       number | string;
  unit?:       string;
  observedAt?: string;         // ISO-8601 UTC
}

export interface UDCNote {
  noteType: string;            // "progress" | "advance_directive" | "preferences"
  content:  string;
}

export interface UDCPayload {
  medications?:  UDCMedication[];
  allergies?:    UDCAllergy[];
  diagnoses?:    UDCDiagnosis[];
  vitals?:       UDCVital[];
  notes?:        UDCNote[];
  fallRiskScore?: number;      // Numeric score; ≥25 = high risk
  codeStatus?:   string;       // "DNR" | "Full Code" | "Comfort Care"
  adlScores?:    Record<string, number>;
}

// ─── Original File Artifacts ──────────────────────────────────────────────────

export interface UDCArtifact {
  filename:  string;           // Original filename, e.g. "face_sheet.pdf"
  mimeType:  string;           // e.g. "application/pdf"
  sizeBytes: number;
  sha256:    string;           // SHA-256 hex of the file content
}

// ─── Integrity Signature ──────────────────────────────────────────────────────

export interface UDCSignature {
  algorithm: string;           // "HMAC-SHA256" (v1 placeholder — upgrade to JWS later)
  value:     string;           // HMAC hex string
  signedAt:  string;           // ISO-8601 UTC
}

// ─── Top-Level Capsule ────────────────────────────────────────────────────────

export interface UniversalDataCapsule {
  metadata:       UDCMetadata;
  patientContext: UDCPatientContext;
  payload:        UDCPayload;
  artifacts:      UDCArtifact[];
  signature:      UDCSignature;
}

// ─── JSON Schema (for runtime validation) ─────────────────────────────────────
// Used in POST /udc/ingest to reject malformed capsules before any DB write.

export const UDC_JSON_SCHEMA = {
  $schema:  "http://json-schema.org/draft-07/schema#",
  title:    "UniversalDataCapsule",
  type:     "object",
  required: ["metadata", "patientContext", "payload", "artifacts", "signature"],
  properties: {
    metadata: {
      type:     "object",
      required: ["capsuleId", "version", "createdAt", "createdBy", "sourceSystem", "testData"],
      properties: {
        capsuleId:    { type: "string", format: "uuid" },
        version:      { type: "string" },
        createdAt:    { type: "string" },
        createdBy:    { type: "string" },
        sourceSystem: { type: "string" },
        testData:     { type: "boolean", enum: [true] },
      },
    },
    patientContext: {
      type:     "object",
      required: ["mrn", "firstName", "lastName", "dateOfBirth"],
      properties: {
        mrn:           { type: "string" },
        firstName:     { type: "string" },
        lastName:      { type: "string" },
        dateOfBirth:   { type: "string" },
        sex:           { type: "string" },
        room:          { type: "string" },
        admissionDate: { type: "string" },
      },
    },
    payload: {
      type: "object",
      properties: {
        medications:   { type: "array" },
        allergies:     { type: "array" },
        diagnoses:     { type: "array" },
        vitals:        { type: "array" },
        notes:         { type: "array" },
        fallRiskScore: { type: "number" },
        codeStatus:    { type: "string" },
        adlScores:     { type: "object" },
      },
    },
    artifacts: { type: "array" },
    signature: {
      type:     "object",
      required: ["algorithm", "value", "signedAt"],
      properties: {
        algorithm: { type: "string" },
        value:     { type: "string" },
        signedAt:  { type: "string" },
      },
    },
  },
} as const;
