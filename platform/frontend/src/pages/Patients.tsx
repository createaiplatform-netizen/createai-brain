export function Patients() {
  return (
    <div>
      <h1 style={styles.heading}>Patients</h1>
      <p style={styles.sub}>Clinical records module — schema scaffold ready.</p>

      <div style={styles.notice}>
        <div style={styles.noticeIcon}>⚠️</div>
        <div>
          <strong>PHI Guard — Schema Only</strong>
          <p style={styles.noticeText}>
            The clinical tables (<code>patients</code>, <code>encounters</code>,{" "}
            <code>medications</code>, <code>observations</code>,{" "}
            <code>clinical_notes</code>) are deployed as schema scaffolding.
            No real patient data may be entered until all four conditions are met:
          </p>
          <ol style={styles.noticeList}>
            <li>A signed Business Associate Agreement (BAA) is on file.</li>
            <li>A HIPAA Security Risk Analysis is complete and documented.</li>
            <li>Column-level encryption is implemented for all PHI columns.</li>
            <li>PostgreSQL Row-Level Security (RLS) policies are in place.</li>
          </ol>
          <p style={styles.noticeText}>
            Until then, use only the synthetic test records below for development
            and demonstration purposes.
          </p>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Synthetic Test Patients</h2>
          <span style={styles.syntheticChip}>SYNTHETIC DATA ONLY</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              {["MRN", "Name", "DOB", "Room", "Status"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SYNTHETIC_PATIENTS.map((p) => (
              <tr key={p.mrn} style={styles.tr}>
                <td style={styles.td}><code style={styles.mrn}>{p.mrn}</code></td>
                <td style={styles.td}><span style={styles.name}>{p.name}</span></td>
                <td style={styles.td}><span style={styles.meta}>{p.dob}</span></td>
                <td style={styles.td}><span style={styles.meta}>{p.room}</span></td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusChip,
                    background: p.status === "admitted" ? "#dcfce7" : "#f1f5f9",
                    color:      p.status === "admitted" ? "#15803d" : "#64748b",
                  }}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schema overview */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Clinical Schema Overview</h2>
        <div style={styles.schemaGrid}>
          {SCHEMA_TABLES.map((t) => (
            <div key={t.name} style={styles.schemaCard}>
              <div style={styles.schemaName}>{t.name}</div>
              <div style={styles.schemaDesc}>{t.desc}</div>
              <div style={styles.schemaFhir}>{t.fhir}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Synthetic data (NOT real PHI) ────────────────────────────────────────────

const SYNTHETIC_PATIENTS = [
  { mrn: "TEST-001", name: "John Smith (Synthetic)", dob: "1942-03-15", room: "MED-WEST 101A", status: "admitted" },
  { mrn: "TEST-002", name: "Mary Johnson (Synthetic)", dob: "1938-07-22", room: "MEM-EAST 204B", status: "admitted" },
  { mrn: "TEST-003", name: "Robert Davis (Synthetic)", dob: "1945-11-08", room: "Rehab 301", status: "admitted" },
  { mrn: "TEST-004", name: "Patricia Wilson (Synthetic)", dob: "1950-04-30", room: "—", status: "discharged" },
];

const SCHEMA_TABLES = [
  { name: "patients",           desc: "Demographics + admission status. MRN-keyed, org-scoped.", fhir: "FHIR: Patient" },
  { name: "patient_identifiers",desc: "Cross-system ID mapping (EHR MRN, pharmacy, lab, billing).", fhir: "FHIR: Patient.identifier" },
  { name: "encounters",         desc: "ADT events — admission, transfer, discharge. From HL7 ADT messages.", fhir: "FHIR: Encounter" },
  { name: "medications",        desc: "Formulary reference data (RxNorm, NDC coded).", fhir: "FHIR: Medication" },
  { name: "medication_orders",  desc: "Active medication orders (MAR source). From HL7 RDE/RDS messages.", fhir: "FHIR: MedicationRequest" },
  { name: "observations",       desc: "Vitals + lab results. LOINC-coded. From HL7 ORU messages.", fhir: "FHIR: Observation" },
  { name: "clinical_notes",     desc: "Nursing, physician, and therapy notes. Requires signature.", fhir: "FHIR: DocumentReference" },
  { name: "audit_log",          desc: "Append-only access log. HIPAA §164.312(b).", fhir: "AuditEvent" },
];

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 },
  sub:     { fontSize: 13, color: "#64748b", marginBottom: 20 },
  notice: {
    background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
    padding: "16px 18px", marginBottom: 24,
    display: "flex", gap: 12, alignItems: "flex-start",
  },
  noticeIcon: { fontSize: 20, flexShrink: 0 },
  noticeText: { fontSize: 13, color: "#92400e", marginTop: 6, lineHeight: 1.6 },
  noticeList: { fontSize: 13, color: "#92400e", paddingLeft: 20, margin: "8px 0" },
  section: { background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: "18px 20px", marginBottom: 16, overflowX: "auto" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: "#0f172a" },
  syntheticChip: { fontSize: 10, fontWeight: 700, background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "3px 8px", textTransform: "uppercase", letterSpacing: "0.04em" },
  table: { width: "100%", borderCollapse: "collapse" },
  th:    { textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 12px 12px" },
  tr:    { borderBottom: "1px solid rgba(0,0,0,0.05)" },
  td:    { padding: "11px 12px", verticalAlign: "middle" },
  mrn:   { fontFamily: "monospace", fontSize: 12, color: "#64748b" },
  name:  { fontSize: 13, fontWeight: 500, color: "#0f172a" },
  meta:  { fontSize: 12, color: "#64748b" },
  statusChip: { fontSize: 11, fontWeight: 700, borderRadius: 4, padding: "2px 7px" },
  schemaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
  schemaCard: { background: "#f8fafc", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(0,0,0,0.05)" },
  schemaName: { fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "monospace", marginBottom: 6 },
  schemaDesc: { fontSize: 12, color: "#64748b", marginBottom: 6, lineHeight: 1.5 },
  schemaFhir: { fontSize: 11, color: "#4f46e5", fontWeight: 600 },
};
