import {
  db,
  staffingClients, staffingCandidates, staffingRequisitions,
  staffingSubmissions, staffingInterviews, staffingPlacements,
} from "@workspace/db";

async function seed() {
  console.log("🌱 Seeding staffing data…");

  // ── Clients ───────────────────────────────────────────────────────────────
  const [techVision, globalHealth, constructPro, financeEdge, retailNow] = await db.insert(staffingClients).values([
    { companyName: "TechVision Corp",          industry: "Technology",      contactName: "Sarah Chen",    contactEmail: "sarah@techvision.co",  contactPhone: "555-0101", status: "active", notes: "Fast-growing SaaS company, focus on engineering roles" },
    { companyName: "GlobalHealth Solutions",   industry: "Healthcare",      contactName: "Dr. Michael Roberts", contactEmail: "m.roberts@ghsolutions.com", contactPhone: "555-0202", status: "active", notes: "Hospital network, needs clinical and admin staff" },
    { companyName: "ConstructPro Industries",  industry: "Construction",    contactName: "Jake Barnett",  contactEmail: "jake@constructpro.com", contactPhone: "555-0303", status: "active", notes: "Large GC firm, project managers and site supervisors" },
    { companyName: "FinanceEdge Partners",     industry: "Finance",         contactName: "Lisa Morales",  contactEmail: "l.morales@financeedge.com", contactPhone: "555-0404", status: "active", notes: "Private equity, looking for analysts and associates" },
    { companyName: "RetailNow Group",          industry: "Retail",          contactName: "Tom Nakamura",  contactEmail: "tom@retailnow.com",     contactPhone: "555-0505", status: "inactive", notes: "On-hold — seasonal hiring paused until Q3" },
  ]).returning();

  console.log("  ✓ 5 clients");

  // ── Candidates ────────────────────────────────────────────────────────────
  const [alexJ, priyaS, marcusW, linaT, davidK, rachelB, omarF, jessicaL] = await db.insert(staffingCandidates).values([
    { firstName: "Alex",    lastName: "Johnson",    email: "alex.j@email.com",     phone: "555-1001", title: "Senior Software Engineer",      location: "San Francisco, CA", skills: "React, Node.js, TypeScript, AWS, PostgreSQL", experience: 8,  availability: "2 weeks notice", status: "active",   source: "LinkedIn", notes: "Strong full-stack background, looking for remote-first" },
    { firstName: "Priya",   lastName: "Sharma",     email: "priya.s@email.com",    phone: "555-1002", title: "Product Manager",                location: "Austin, TX",         skills: "Product strategy, roadmapping, Agile, SQL, Figma", experience: 6, availability: "Immediate", status: "active",   source: "Referral", notes: "Previously at Stripe, excellent stakeholder management" },
    { firstName: "Marcus",  lastName: "Williams",   email: "marcus.w@email.com",   phone: "555-1003", title: "Registered Nurse",               location: "Chicago, IL",        skills: "ICU, ACLS, Epic EMR, Patient care, Med-Surg", experience: 5, availability: "1 month",       status: "active",   source: "Job Board", notes: "BSN + 5 yrs ICU experience, relocating to Chicago area" },
    { firstName: "Lina",    lastName: "Torres",     email: "lina.t@email.com",     phone: "555-1004", title: "Financial Analyst",              location: "New York, NY",       skills: "Financial modeling, Excel, Bloomberg, SQL, Python", experience: 4, availability: "Immediate", status: "active",   source: "LinkedIn", notes: "CFA Level II candidate, strong M&A background" },
    { firstName: "David",   lastName: "Kim",        email: "david.k@email.com",    phone: "555-1005", title: "Construction Project Manager",   location: "Denver, CO",         skills: "MS Project, Procore, OSHA 30, Estimating, AutoCAD", experience: 10, availability: "3 months", status: "active",  source: "Website",   notes: "Licensed PMP, managed $50M+ commercial projects" },
    { firstName: "Rachel",  lastName: "Bennett",    email: "rachel.b@email.com",   phone: "555-1006", title: "UX Designer",                    location: "Seattle, WA",        skills: "Figma, Sketch, User research, Prototyping, HTML/CSS", experience: 5, availability: "2 weeks", status: "active", source: "Portfolio", notes: "Strong mobile UX portfolio, healthcare experience" },
    { firstName: "Omar",    lastName: "Farouq",     email: "omar.f@email.com",     phone: "555-1007", title: "DevOps Engineer",                location: "Remote",             skills: "Kubernetes, Docker, Terraform, AWS, CI/CD, Python", experience: 7, availability: "Immediate", status: "placed",  source: "Referral", notes: "Placed at TechVision Corp in Jan 2025" },
    { firstName: "Jessica", lastName: "Liu",        email: "jessica.l@email.com",  phone: "555-1008", title: "Healthcare Administrator",       location: "Boston, MA",         skills: "Hospital ops, Revenue cycle, HIPAA, Epic, Lean", experience: 9, availability: "1 month", status: "active",  source: "LinkedIn",  notes: "COO-track candidate, built admissions dept from scratch" },
  ]).returning();

  console.log("  ✓ 8 candidates");

  // ── Requisitions ──────────────────────────────────────────────────────────
  const [seniorEng, pmRole, icuNurse, analystRole, constructMgr, uxRole] = await db.insert(staffingRequisitions).values([
    { clientId: techVision!.id,    title: "Senior Software Engineer",      department: "Engineering",   location: "San Francisco / Remote", type: "full-time", salaryMin: "160000", salaryMax: "200000", description: "Lead backend development for our core SaaS platform", requirements: "8+ yrs React/Node, TypeScript required, AWS preferred", status: "open", priority: "high",   targetDate: new Date("2026-04-15") },
    { clientId: techVision!.id,    title: "Product Manager — Platform",    department: "Product",       location: "Austin, TX",             type: "full-time", salaryMin: "130000", salaryMax: "165000", description: "Own the product roadmap for our B2B platform", requirements: "5+ yrs PM, SaaS required, technical background preferred", status: "open", priority: "high",   targetDate: new Date("2026-04-01") },
    { clientId: globalHealth!.id,  title: "ICU Registered Nurse",          department: "Critical Care", location: "Chicago, IL",             type: "full-time", salaryMin: "80000",  salaryMax: "105000", description: "ICU RN for our downtown hospital network", requirements: "BSN, 3+ yrs ICU, ACLS required, Epic EMR preferred", status: "open", priority: "high",   targetDate: new Date("2026-03-30") },
    { clientId: financeEdge!.id,   title: "Investment Analyst",            department: "Deal Team",     location: "New York, NY",            type: "full-time", salaryMin: "90000",  salaryMax: "120000", description: "Support deal sourcing and financial modeling for PE team", requirements: "3+ yrs finance, CFA preferred, Excel/Bloomberg required", status: "open", priority: "medium", targetDate: new Date("2026-05-01") },
    { clientId: constructPro!.id,  title: "Senior Project Manager",        department: "Operations",    location: "Denver, CO",              type: "full-time", salaryMin: "110000", salaryMax: "140000", description: "Lead commercial construction projects from pre-con to closeout", requirements: "PMP + 8+ yrs commercial, Procore/MS Project, OSHA 30", status: "open", priority: "medium", targetDate: new Date("2026-04-20") },
    { clientId: globalHealth!.id,  title: "UX Designer — Patient Portal",  department: "Digital Health", location: "Remote",                 type: "contract", salaryMin: "95000",  salaryMax: "120000", description: "Design patient-facing digital health experiences", requirements: "5+ yrs UX, healthcare experience required, Figma required", status: "filled", priority: "low", targetDate: new Date("2026-03-01") },
  ]).returning();

  console.log("  ✓ 6 requisitions");

  // ── Submissions ───────────────────────────────────────────────────────────
  const [sub1, sub2, sub3, sub4, sub5, sub6, sub7] = await db.insert(staffingSubmissions).values([
    { candidateId: alexJ!.id, requisitionId: seniorEng!.id, status: "shortlisted",  submittedAt: new Date("2026-03-01"), notes: "Strong match — 8 yrs React/Node, excellent GitHub portfolio", recruiterFeedback: "Top candidate, fast-track to final round", clientFeedback: "Great technical depth, want to schedule panel interview" },
    { candidateId: priyaS!.id, requisitionId: pmRole!.id,   status: "reviewing",    submittedAt: new Date("2026-03-03"), notes: "Stripe background is a strong signal for B2B SaaS", recruiterFeedback: "Meets all qualifications", clientFeedback: null },
    { candidateId: marcusW!.id, requisitionId: icuNurse!.id, status: "shortlisted", submittedAt: new Date("2026-03-05"), notes: "5 yrs ICU, ACLS current, Epic trained", recruiterFeedback: "Excellent credentials, recommend hiring", clientFeedback: "Want to do a skills assessment first" },
    { candidateId: linaT!.id, requisitionId: analystRole!.id, status: "submitted",  submittedAt: new Date("2026-03-08"), notes: "CFA L2 + strong modeling skills", recruiterFeedback: "Solid candidate", clientFeedback: null },
    { candidateId: davidK!.id, requisitionId: constructMgr!.id, status: "reviewing", submittedAt: new Date("2026-03-10"), notes: "PMP + 10 yrs experience, managed projects up to $80M", recruiterFeedback: "Perfect fit for the role", clientFeedback: null },
    { candidateId: rachelB!.id, requisitionId: uxRole!.id,  status: "shortlisted",  submittedAt: new Date("2026-02-10"), notes: "Strong healthcare UX portfolio, Figma expert", recruiterFeedback: "Great match", clientFeedback: "Impressed with portfolio" },
    { candidateId: alexJ!.id, requisitionId: pmRole!.id,    status: "rejected",     submittedAt: new Date("2026-02-20"), notes: "Considered for dual-submission, not a PM background", recruiterFeedback: "Not suited for this PM role", clientFeedback: "Looking for pure PM profile" },
  ]).returning();

  console.log("  ✓ 7 submissions");

  // ── Interviews ────────────────────────────────────────────────────────────
  await db.insert(staffingInterviews).values([
    { submissionId: sub1!.id, candidateId: alexJ!.id, requisitionId: seniorEng!.id, scheduledAt: new Date("2026-03-20T14:00:00Z"), durationMinutes: 60, type: "technical", status: "scheduled",  interviewerName: "Sarah Chen + Tom Yu", location: "Google Meet", notes: "Panel technical interview — system design + coding" },
    { submissionId: sub1!.id, candidateId: alexJ!.id, requisitionId: seniorEng!.id, scheduledAt: new Date("2026-03-10T11:00:00Z"), durationMinutes: 45, type: "phone",     status: "completed", interviewerName: "Sarah Chen", location: "Phone", notes: "Initial screen", feedback: "Strong communication, great problem-solving", outcome: "pass" },
    { submissionId: sub3!.id, candidateId: marcusW!.id, requisitionId: icuNurse!.id, scheduledAt: new Date("2026-03-22T09:00:00Z"), durationMinutes: 60, type: "in-person", status: "scheduled",  interviewerName: "Dr. Michael Roberts", location: "Global Health - Chicago Campus", notes: "Clinical skills assessment + culture fit interview" },
    { submissionId: sub6!.id, candidateId: rachelB!.id, requisitionId: uxRole!.id, scheduledAt: new Date("2026-02-15T15:00:00Z"), durationMinutes: 90, type: "portfolio",  status: "completed", interviewerName: "Design Team Lead", location: "Zoom", notes: "Portfolio review", feedback: "Outstanding work, clear understanding of patient UX needs", outcome: "pass" },
    { submissionId: sub2!.id, candidateId: priyaS!.id, requisitionId: pmRole!.id, scheduledAt: new Date("2026-03-25T13:00:00Z"), durationMinutes: 45, type: "video",     status: "scheduled",  interviewerName: "VP of Product",  location: "Zoom", notes: "Product sense + case study interview" },
  ]);

  console.log("  ✓ 5 interviews");

  // ── Placements ────────────────────────────────────────────────────────────
  await db.insert(staffingPlacements).values([
    { candidateId: omarF!.id, requisitionId: uxRole!.id, clientId: globalHealth!.id, startDate: new Date("2025-01-06"), endDate: new Date("2025-07-06"), type: "contract", salary: "110000", fee: "16500", status: "completed", notes: "Contract completed successfully — client requested extension but candidate accepted FTE at another company" },
    { candidateId: rachelB!.id, requisitionId: uxRole!.id, clientId: globalHealth!.id, startDate: new Date("2026-03-01"), type: "contract", salary: "108000", fee: "16200", status: "active", notes: "Placed as UX Designer on patient portal project" },
    { candidateId: jessicaL!.id, requisitionId: icuNurse!.id, clientId: globalHealth!.id, startDate: new Date("2025-09-01"), type: "full-time", salary: "145000", fee: "29000", status: "active", notes: "Placed as Director of Patient Services — promoted from Administrator candidate pool" },
  ]);

  console.log("  ✓ 3 placements");
  console.log("✅ Staffing seed complete!");
}

seed().catch(e => { console.error(e); process.exit(1); });
