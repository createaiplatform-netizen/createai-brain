// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL WORKFLOW ENGINE
// Simulates workflows for ALL industries. INTERNAL + MOCK + DEMO-ONLY.
// No real processes are triggered. All outcomes are fictional.
// ═══════════════════════════════════════════════════════════════════════════

export const WORKFLOW_STORAGE_KEY = "createai_workflows_v1";

// ─── Types ────────────────────────────────────────────────────────────────

export type StepStatus = "pending" | "in-progress" | "complete" | "error" | "skipped" | "warning";
export type WorkflowStatus = "not-started" | "in-progress" | "complete" | "failed" | "paused";
export type MockOutcome = "success" | "failure" | "partial" | "pending-review";

export interface StepOutcomes {
  success: string;
  failure: string;
  warning: string;
}

export interface WorkflowStep {
  id:          string;
  index:       number;
  title:       string;
  description: string;
  actor:       string;
  inputs:      string[];
  outputs:     string[];
  duration:    string;
  status:      StepStatus;
  outcomes:    StepOutcomes;
  completedAt: string | null;
  errorNote:   string | null;
}

export interface WorkflowLog {
  timestamp: string;
  step:      string;
  action:    string;
  result:    string;
  actor:     string;
}

export interface Workflow {
  id:          string;
  name:        string;
  industry:    string;
  domain:      string;
  description: string;
  steps:       WorkflowStep[];
  currentStep: number;
  status:      WorkflowStatus;
  mockOutcome: MockOutcome;
  log:         WorkflowLog[];
  createdAt:   string;
  updatedAt:   string;
  safetyNote:  string;
}

// ─── Pre-built Workflow Templates ─────────────────────────────────────────

interface WorkflowTemplate {
  id:          string;
  name:        string;
  industry:    string;
  domain:      string;
  description: string;
  steps: Omit<WorkflowStep, "status" | "completedAt" | "errorNote">[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "wf-patient-intake",
    name: "Patient Intake Workflow",
    industry: "healthcare",
    domain: "Clinical",
    description: "End-to-end patient registration and intake simulation",
    steps: [
      { id: "s1", index: 0, title: "Pre-Registration", description: "Collect demographic and insurance info (mock)", actor: "Front Desk", inputs: ["Patient ID", "Insurance Card"], outputs: ["Registration Form"], duration: "5 min", outcomes: { success: "Patient pre-registered in system", failure: "Insurance verification failed", warning: "Duplicate record detected" } },
      { id: "s2", index: 1, title: "Insurance Verification", description: "Verify coverage eligibility (mock — no real payer connection)", actor: "Billing Specialist", inputs: ["Registration Form"], outputs: ["Eligibility Response"], duration: "3 min", outcomes: { success: "Coverage verified — active plan confirmed", failure: "Patient not found in payer system", warning: "Policy may have lapsed — manual review needed" } },
      { id: "s3", index: 2, title: "Clinical Intake", description: "Collect chief complaint and vitals (mock data)", actor: "Nurse / MA", inputs: ["Patient ID", "Visit Reason"], outputs: ["Intake Notes", "Vital Signs"], duration: "10 min", outcomes: { success: "Intake complete — provider notified", failure: "Critical vital sign flagged — escalating", warning: "Patient declined to provide history" } },
      { id: "s4", index: 3, title: "Provider Assignment", description: "Route patient to available provider", actor: "Charge Nurse", inputs: ["Intake Notes"], outputs: ["Provider Assignment"], duration: "2 min", outcomes: { success: "Provider assigned — room ready", failure: "No available provider — queue extended", warning: "Wait time exceeds 30 min threshold" } },
      { id: "s5", index: 4, title: "Visit Documentation", description: "Provider completes encounter note (mock SOAP format)", actor: "Provider", inputs: ["Intake Notes", "Clinical Orders"], outputs: ["Encounter Note", "Orders"], duration: "15 min", outcomes: { success: "Note signed — ready for coding", failure: "Note incomplete — attestation required", warning: "Diagnosis code needs specificity" } },
    ],
  },
  {
    id: "wf-grant-application",
    name: "Grant Application Workflow",
    industry: "nonprofit",
    domain: "Grants Management",
    description: "Full grant application cycle from identification to submission",
    steps: [
      { id: "s1", index: 0, title: "Opportunity Identification", description: "Identify and qualify grant opportunity (mock)", actor: "Development Officer", inputs: ["Funder Research"], outputs: ["Opportunity Brief"], duration: "1 day", outcomes: { success: "Opportunity qualified — proceed to LOI", failure: "Mission misalignment — pass on opportunity", warning: "Deadline in 14 days — expedited track" } },
      { id: "s2", index: 1, title: "Letter of Intent", description: "Draft and submit LOI (fictional — no real submission)", actor: "Grant Writer", inputs: ["Opportunity Brief", "Program Data"], outputs: ["LOI Document"], duration: "3 days", outcomes: { success: "LOI submitted — awaiting funder response", failure: "LOI requirements unclear — clarification requested", warning: "Word limit exceeded — revision needed" } },
      { id: "s3", index: 2, title: "Full Proposal Writing", description: "Develop full narrative, budget, and attachments (mock)", actor: "Grant Writer + Program Lead", inputs: ["LOI Approval", "Program Budget"], outputs: ["Draft Proposal"], duration: "10 days", outcomes: { success: "Draft approved — final review queued", failure: "Budget variance identified — finance review needed", warning: "Impact data needs verification" } },
      { id: "s4", index: 3, title: "Internal Review", description: "ED, Finance, and Program review and sign-off", actor: "Executive Director", inputs: ["Draft Proposal"], outputs: ["Approved Proposal"], duration: "2 days", outcomes: { success: "Proposal approved for submission", failure: "Major revisions required", warning: "Minor edits requested" } },
      { id: "s5", index: 4, title: "Submission", description: "Submit via funder portal (mock — no real submission)", actor: "Grant Writer", inputs: ["Approved Proposal"], outputs: ["Submission Confirmation"], duration: "1 hour", outcomes: { success: "Submitted! Confirmation #MOCK-2024-001 received", failure: "Portal technical error — retry required", warning: "Submission received but attachments not confirmed" } },
    ],
  },
  {
    id: "wf-incident-response",
    name: "IT Security Incident Response",
    industry: "technology",
    domain: "Cybersecurity",
    description: "Simulated incident detection through resolution workflow",
    steps: [
      { id: "s1", index: 0, title: "Detection & Alert", description: "SIEM alert triggered — classify severity (mock)", actor: "Security Analyst", inputs: ["SIEM Alert"], outputs: ["Incident Ticket"], duration: "5 min", outcomes: { success: "Severity 2 incident logged — team notified", failure: "Alert misclassified — re-triage required", warning: "Duplicate alert — possible noise" } },
      { id: "s2", index: 1, title: "Containment", description: "Isolate affected system(s) — mock network action", actor: "Security Engineer", inputs: ["Incident Ticket"], outputs: ["Containment Report"], duration: "20 min", outcomes: { success: "System isolated — lateral movement halted", failure: "Containment failed — escalate to P1", warning: "Partial containment — monitoring active" } },
      { id: "s3", index: 2, title: "Root Cause Analysis", description: "Identify attack vector and scope (mock forensics)", actor: "Threat Analyst", inputs: ["Containment Report"], outputs: ["RCA Draft"], duration: "2 hours", outcomes: { success: "Phishing email identified as entry point", failure: "Root cause unclear — external forensics needed", warning: "Scope larger than initially assessed" } },
      { id: "s4", index: 3, title: "Remediation", description: "Patch, reconfigure, and restore (mock actions)", actor: "DevOps + Security", inputs: ["RCA Draft"], outputs: ["Remediation Report"], duration: "4 hours", outcomes: { success: "Patch applied — systems restored", failure: "Patch incompatible — rollback required", warning: "Residual risk remains — monitoring extended" } },
      { id: "s5", index: 4, title: "Post-Incident Review", description: "Document lessons learned and update runbook", actor: "Security Manager", inputs: ["Remediation Report"], outputs: ["PIR Document", "Updated Runbook"], duration: "1 day", outcomes: { success: "PIR complete — process improvements identified", failure: "Team unavailable for review — rescheduled", warning: "Regulatory notification may be required" } },
    ],
  },
  {
    id: "wf-loan-origination",
    name: "Commercial Loan Origination",
    industry: "finance",
    domain: "Lending",
    description: "Full commercial loan application through decisioning (mock)",
    steps: [
      { id: "s1", index: 0, title: "Application Receipt", description: "Receive and log loan application (all mock data)", actor: "Loan Officer", inputs: ["Application Form", "Business Plan"], outputs: ["Application Ticket"], duration: "30 min", outcomes: { success: "Application complete — assigned to underwriting", failure: "Missing documents — applicant notified", warning: "High-risk flag on preliminary review" } },
      { id: "s2", index: 1, title: "Credit Analysis", description: "Review credit profile and financials (mock scoring)", actor: "Credit Analyst", inputs: ["Application Ticket", "Credit Report"], outputs: ["Credit Memo"], duration: "2 days", outcomes: { success: "Credit score 720 — within policy guidelines", failure: "Credit score below threshold — decline recommended", warning: "Thin file — additional collateral may be required" } },
      { id: "s3", index: 2, title: "Underwriting Review", description: "Full underwriting analysis and risk rating", actor: "Underwriter", inputs: ["Credit Memo", "Financials"], outputs: ["Underwriting Report"], duration: "3 days", outcomes: { success: "Loan approved — proceed to committee", failure: "Loan declined — risk exceeds appetite", warning: "Conditional approval — guarantor required" } },
      { id: "s4", index: 3, title: "Loan Committee", description: "Present to approval committee (mock quorum)", actor: "Credit Committee", inputs: ["Underwriting Report"], outputs: ["Committee Decision"], duration: "1 day", outcomes: { success: "Approved by committee — term sheet issued", failure: "Declined — insufficient collateral", warning: "Approved with conditions — 30-day satisfaction deadline" } },
      { id: "s5", index: 4, title: "Closing & Funding", description: "Document execution and fund disbursement (mock)", actor: "Closing Specialist", inputs: ["Committee Decision", "Loan Documents"], outputs: ["Closed Loan File"], duration: "5 days", outcomes: { success: "Loan funded — $500K disbursed (mock)", failure: "Title issue — closing delayed", warning: "Rate lock expiring — expedite closing" } },
    ],
  },
  {
    id: "wf-product-launch",
    name: "Product Launch Workflow",
    industry: "technology",
    domain: "Product",
    description: "End-to-end product launch from feature freeze to GA (mock)",
    steps: [
      { id: "s1", index: 0, title: "Feature Freeze", description: "Lock feature scope for release (mock sprint closure)", actor: "Product Manager", inputs: ["Roadmap", "Sprint Backlog"], outputs: ["Release Notes Draft"], duration: "1 day", outcomes: { success: "Feature freeze confirmed — QA begins", failure: "Critical bug discovered — freeze postponed", warning: "2 features descoped — stakeholders notified" } },
      { id: "s2", index: 1, title: "QA & Testing", description: "Functional, regression, and load testing (mock results)", actor: "QA Engineering", inputs: ["Build", "Test Plans"], outputs: ["QA Report"], duration: "5 days", outcomes: { success: "All critical tests passed — go/no-go ready", failure: "P1 bug blocking launch — dev handoff", warning: "Performance regression in edge case — acceptable risk" } },
      { id: "s3", index: 2, title: "Go/No-Go Review", description: "Cross-functional review of readiness criteria", actor: "Leadership Team", inputs: ["QA Report", "Risk Summary"], outputs: ["Launch Decision"], duration: "2 hours", outcomes: { success: "Go! Launch approved for Saturday 2AM (mock)", failure: "No-Go — revisit in 2 weeks", warning: "Go with monitoring — on-call coverage required" } },
      { id: "s4", index: 3, title: "Deployment", description: "Deploy to production (mock CI/CD pipeline)", actor: "DevOps", inputs: ["Launch Decision", "Deployment Plan"], outputs: ["Deployment Log"], duration: "3 hours", outcomes: { success: "Deployed successfully — error rates nominal", failure: "Deployment failed — rollback initiated", warning: "Latency spike at 2% — monitoring" } },
      { id: "s5", index: 4, title: "Post-Launch Monitoring", description: "24-hour watch period with on-call team", actor: "Engineering + Product", inputs: ["Deployment Log"], outputs: ["Launch Report"], duration: "24 hours", outcomes: { success: "Stable launch — metrics nominal — customers adopting", failure: "Critical issue — hotfix required", warning: "Adoption slower than projected — CS notified" } },
    ],
  },
  {
    id: "wf-hiring",
    name: "Full-Cycle Recruiting Workflow",
    industry: "hr-workforce",
    domain: "Talent Acquisition",
    description: "Job requisition through offer acceptance (mock candidates)",
    steps: [
      { id: "s1", index: 0, title: "Job Requisition", description: "Create and approve job req (mock approval chain)", actor: "HR / Hiring Manager", inputs: ["Headcount Plan"], outputs: ["Approved Job Req"], duration: "2 days", outcomes: { success: "Req approved — posted to job boards", failure: "Req rejected — budget review needed", warning: "Req approved but delayed due to comp band issue" } },
      { id: "s2", index: 1, title: "Sourcing & Screening", description: "Source and phone screen candidates (mock applicant pool)", actor: "Recruiter", inputs: ["Job Posting"], outputs: ["Candidate Slate"], duration: "1 week", outcomes: { success: "10 qualified candidates — 4 advancing to interview", failure: "Low applicant quality — sourcing strategy revision needed", warning: "Strong candidate received competing offer" } },
      { id: "s3", index: 2, title: "Interviews", description: "Panel interviews and technical assessments (mock)", actor: "Interview Panel", inputs: ["Candidate Slate"], outputs: ["Interview Scorecards"], duration: "1 week", outcomes: { success: "Top candidate selected — unanimous recommendation", failure: "No consensus — additional round required", warning: "Strong second candidate — may offer alternate role" } },
      { id: "s4", index: 3, title: "Reference & Background Check", description: "Reference calls and background check (mock)", actor: "Recruiter", inputs: ["Candidate Selection"], outputs: ["Check Clearance"], duration: "3 days", outcomes: { success: "References excellent — background clear", failure: "Background discrepancy — legal review required", warning: "Gap in employment history — candidate explanation requested" } },
      { id: "s5", index: 4, title: "Offer & Acceptance", description: "Extend offer and negotiate (mock compensation)", actor: "Recruiter + Hiring Manager", inputs: ["Check Clearance"], outputs: ["Signed Offer Letter"], duration: "2 days", outcomes: { success: "Offer accepted — start date confirmed", failure: "Offer declined — candidate accepted competing offer", warning: "Counter-offer pending — 24-hour response window" } },
    ],
  },
  {
    id: "wf-content-production",
    name: "Content Production Workflow",
    industry: "creative-media",
    domain: "Production",
    description: "Script to publish content production pipeline (mock)",
    steps: [
      { id: "s1", index: 0, title: "Brief & Concept", description: "Define creative brief and concept (mock client brief)", actor: "Creative Director", inputs: ["Client Brief"], outputs: ["Creative Concept"], duration: "2 days", outcomes: { success: "Concept approved — pre-production begins", failure: "Concept misaligned with brand — rework needed", warning: "Client wants revisions before greenlight" } },
      { id: "s2", index: 1, title: "Script / Storyboard", description: "Develop script and visual storyboard (fictional content)", actor: "Writer + Art Director", inputs: ["Creative Concept"], outputs: ["Script", "Storyboard"], duration: "5 days", outcomes: { success: "Script approved — storyboard in review", failure: "Script tone misses target audience", warning: "Storyboard needs CG/VFX budget adjustment" } },
      { id: "s3", index: 2, title: "Production", description: "Shoot / record / animate content (mock production)", actor: "Production Team", inputs: ["Script", "Storyboard"], outputs: ["Raw Footage"], duration: "3 days", outcomes: { success: "Production wrapped — all coverage captured", failure: "Equipment failure — partial footage only", warning: "Lead talent unavailable for day 2 — schedule adjusted" } },
      { id: "s4", index: 3, title: "Post-Production", description: "Edit, grade, mix audio (mock post pipeline)", actor: "Editor + Sound Designer", inputs: ["Raw Footage"], outputs: ["Rough Cut", "Final Cut"], duration: "7 days", outcomes: { success: "Final cut approved — ready for delivery", failure: "Audio sync issue — ADR session required", warning: "Color grade needs revision per client feedback" } },
      { id: "s5", index: 4, title: "Distribution & Publish", description: "Upload, schedule, and publish across channels (mock)", actor: "Distribution Manager", inputs: ["Final Cut"], outputs: ["Published Asset", "Analytics Dashboard"], duration: "1 day", outcomes: { success: "Published! 1.2M impressions in 24h (mock)", failure: "Platform encoding error — resubmission required", warning: "Geographic restriction flagged — licensing check needed" } },
    ],
  },
  {
    id: "wf-emergency-response",
    name: "Emergency Incident Response",
    industry: "emergency-services",
    domain: "Incident Command",
    description: "ICS-based emergency incident management (fictional scenario)",
    steps: [
      { id: "s1", index: 0, title: "Dispatch & Notification", description: "Receive call and dispatch resources (mock CAD)", actor: "Dispatcher", inputs: ["Emergency Call"], outputs: ["Incident Ticket", "Units Dispatched"], duration: "2 min", outcomes: { success: "Units en route — ETA 4 minutes", failure: "All units unavailable — mutual aid requested", warning: "Traffic delay — extended ETA" } },
      { id: "s2", index: 1, title: "Scene Size-Up", description: "First arriving unit establishes command (mock ICS)", actor: "Incident Commander", inputs: ["Dispatch Info"], outputs: ["Situation Report"], duration: "5 min", outcomes: { success: "Scene secured — hazards identified — command established", failure: "Scene unsafe — staging required — await HAZMAT", warning: "Multiple patients — MCI protocols activated" } },
      { id: "s3", index: 2, title: "Resource Deployment", description: "Deploy and assign resources by ICS role", actor: "Operations Section", inputs: ["Situation Report"], outputs: ["Resource Assignment"], duration: "10 min", outcomes: { success: "All resources assigned — ICS positions filled", failure: "Resource shortage — additional units requested", warning: "Staging area congested — traffic control needed" } },
      { id: "s4", index: 3, title: "Incident Stabilization", description: "Contain incident and protect life safety (mock)", actor: "All Units", inputs: ["Resource Assignment"], outputs: ["Stabilization Report"], duration: "45 min", outcomes: { success: "Incident stabilized — no civilian casualties", failure: "Escalation — structure collapse — USAR activated", warning: "2 minor injuries treated on scene — transport declined" } },
      { id: "s5", index: 4, title: "Demobilization & After-Action", description: "Clear scene and conduct after-action review", actor: "Incident Commander", inputs: ["Stabilization Report"], outputs: ["After-Action Report"], duration: "2 hours", outcomes: { success: "Clean AAR — best practices documented", failure: "Communication failure identified — remediation required", warning: "Equipment damage — apparatus out of service" } },
    ],
  },
];

// ─── Engine Class ─────────────────────────────────────────────────────────

class UniversalWorkflowEngineClass {
  private workflows: Map<string, Workflow> = new Map();

  constructor() { this.load(); }

  private load() {
    try {
      const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Workflow[];
        data.forEach(w => this.workflows.set(w.id, w));
      }
    } catch { /* ignore */ }
  }

  private save() {
    try {
      localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify([...this.workflows.values()]));
    } catch { /* ignore */ }
  }

  private hydrateTemplate(tpl: WorkflowTemplate): Workflow {
    return {
      ...tpl,
      steps: tpl.steps.map(s => ({ ...s, status: "pending" as StepStatus, completedAt: null, errorNote: null })),
      currentStep: 0,
      status: "not-started",
      mockOutcome: "success",
      log: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      safetyNote: "This workflow is entirely fictional and internal. No real actions are taken. All outcomes are mock.",
    };
  }

  private addLog(wf: Workflow, step: string, action: string, result: string, actor: string) {
    wf.log = [{
      timestamp: new Date().toISOString(), step, action, result, actor,
    }, ...wf.log].slice(0, 100);
  }

  getTemplates(): WorkflowTemplate[] { return WORKFLOW_TEMPLATES; }
  getTemplatesByIndustry(industryId: string): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(t => t.industry === industryId);
  }

  getAll(): Workflow[] { return [...this.workflows.values()]; }
  get(id: string): Workflow | undefined { return this.workflows.get(id); }

  startWorkflow(templateId: string): Workflow {
    const tpl = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) throw new Error(`Template ${templateId} not found`);

    const wf = this.hydrateTemplate(tpl);
    wf.id = `${templateId}_${Date.now()}`;
    wf.status = "in-progress";
    wf.steps[0].status = "in-progress";
    this.addLog(wf, wf.steps[0].title, "START", "Workflow initiated — step 1 began", wf.steps[0].actor);
    this.workflows.set(wf.id, wf);
    this.save();
    return wf;
  }

  advanceStep(workflowId: string, outcome: MockOutcome = "success"): Workflow {
    const wf = this.workflows.get(workflowId);
    if (!wf) throw new Error(`Workflow ${workflowId} not found`);

    const cur = wf.steps[wf.currentStep];
    if (!cur) return wf;

    // Mark current step
    if (outcome === "success") {
      cur.status = "complete";
      cur.completedAt = new Date().toISOString();
      this.addLog(wf, cur.title, "COMPLETE", cur.outcomes.success, cur.actor);
    } else if (outcome === "failure") {
      cur.status = "error";
      cur.errorNote = cur.outcomes.failure;
      this.addLog(wf, cur.title, "ERROR", cur.outcomes.failure, cur.actor);
    } else {
      cur.status = "warning";
      this.addLog(wf, cur.title, "WARNING", cur.outcomes.warning, cur.actor);
    }

    if (outcome === "failure") {
      wf.status = "failed";
      wf.mockOutcome = "failure";
    } else {
      wf.currentStep += 1;
      if (wf.currentStep >= wf.steps.length) {
        wf.status = "complete";
        wf.mockOutcome = outcome === "success" ? "success" : "partial";
        this.addLog(wf, "Workflow", "COMPLETE", "All steps finished (mock)", "System");
      } else {
        wf.steps[wf.currentStep].status = "in-progress";
        this.addLog(wf, wf.steps[wf.currentStep].title, "START", "Step initiated", wf.steps[wf.currentStep].actor);
      }
    }

    wf.updatedAt = new Date().toISOString();
    this.save();
    return wf;
  }

  resetWorkflow(workflowId: string): Workflow {
    const wf = this.workflows.get(workflowId);
    if (!wf) throw new Error(`Workflow ${workflowId} not found`);
    wf.steps.forEach(s => { s.status = "pending"; s.completedAt = null; s.errorNote = null; });
    wf.steps[0].status = "in-progress";
    wf.currentStep = 0;
    wf.status = "in-progress";
    wf.log = [];
    wf.updatedAt = new Date().toISOString();
    this.addLog(wf, "Workflow", "RESET", "Workflow reset to beginning", "System");
    this.save();
    return wf;
  }

  deleteWorkflow(id: string) {
    this.workflows.delete(id);
    this.save();
  }

  getStats() {
    const all = this.getAll();
    return {
      total:      all.length,
      active:     all.filter(w => w.status === "in-progress").length,
      complete:   all.filter(w => w.status === "complete").length,
      failed:     all.filter(w => w.status === "failed").length,
      industries: [...new Set(all.map(w => w.industry))],
    };
  }
}

export const WorkflowEngine = new UniversalWorkflowEngineClass();
