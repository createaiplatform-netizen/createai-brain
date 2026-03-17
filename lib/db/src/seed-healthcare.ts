import { eq } from "drizzle-orm";
import { db, healthDepartments, healthDoctors, healthPatients, healthAppointments, healthMedicalRecords, healthPrescriptions, healthBilling } from ".";

async function seedHealthcare() {
  console.log("Seeding healthcare data...");

  // Check if already seeded
  const existing = await db.select().from(healthDepartments).limit(1);
  if (existing.length > 0) { console.log("Already seeded — skipping."); return; }

  // Departments
  const depts = await db.insert(healthDepartments).values([
    { name: "Emergency Medicine", description: "Critical and emergency care for life-threatening conditions", floor: "Floor 1", capacity: 80 },
    { name: "Cardiology", description: "Heart and cardiovascular disease treatment and prevention", floor: "Floor 3", capacity: 60 },
    { name: "Orthopedics", description: "Bone, joint, muscle, and tendon conditions", floor: "Floor 4", capacity: 45 },
    { name: "Neurology", description: "Brain, spinal cord, and nervous system disorders", floor: "Floor 5", capacity: 40 },
    { name: "Pediatrics", description: "Healthcare for infants, children, and adolescents", floor: "Floor 2", capacity: 70 },
    { name: "Oncology", description: "Cancer diagnosis, treatment, and care", floor: "Floor 6", capacity: 50 },
    { name: "Radiology", description: "Medical imaging and diagnostic radiology", floor: "Floor B1", capacity: 30 },
  ]).returning();

  const deptMap: Record<string, number> = {};
  depts.forEach(d => deptMap[d.name] = d.id);

  // Doctors
  const doctors = await db.insert(healthDoctors).values([
    { firstName: "Sarah", lastName: "Mitchell", specialty: "Emergency Medicine", departmentId: deptMap["Emergency Medicine"], email: "smitchell@healthos.med", phone: "555-0101", licenseNumber: "MD-20001", status: "active" },
    { firstName: "James", lastName: "Carver", specialty: "Cardiology", departmentId: deptMap["Cardiology"], email: "jcarver@healthos.med", phone: "555-0102", licenseNumber: "MD-20002", status: "active" },
    { firstName: "Elena", lastName: "Rodriguez", specialty: "Orthopedics", departmentId: deptMap["Orthopedics"], email: "erodriguez@healthos.med", phone: "555-0103", licenseNumber: "MD-20003", status: "active" },
    { firstName: "Michael", lastName: "Chen", specialty: "Neurology", departmentId: deptMap["Neurology"], email: "mchen@healthos.med", phone: "555-0104", licenseNumber: "MD-20004", status: "active" },
    { firstName: "Priya", lastName: "Patel", specialty: "Pediatrics", departmentId: deptMap["Pediatrics"], email: "ppatel@healthos.med", phone: "555-0105", licenseNumber: "MD-20005", status: "active" },
    { firstName: "David", lastName: "Kim", specialty: "Oncology", departmentId: deptMap["Oncology"], email: "dkim@healthos.med", phone: "555-0106", licenseNumber: "MD-20006", status: "active" },
    { firstName: "Amanda", lastName: "Torres", specialty: "Radiology", departmentId: deptMap["Radiology"], email: "atorres@healthos.med", phone: "555-0107", licenseNumber: "MD-20007", status: "on_leave" },
  ]).returning();

  const docMap: Record<string, number> = {};
  doctors.forEach(d => docMap[`${d.firstName} ${d.lastName}`] = d.id);

  // Update department heads
  await db.update(healthDepartments).set({ headDoctorId: docMap["Sarah Mitchell"] }).where(eq(healthDepartments.id, deptMap["Emergency Medicine"]));

  // Patients
  const now = new Date();
  const patients = await db.insert(healthPatients).values([
    { firstName: "Robert", lastName: "Johnson", dateOfBirth: new Date("1965-04-12"), gender: "male", email: "rjohnson@email.com", phone: "555-1001", bloodType: "O+", allergies: "Penicillin", status: "active", primaryDoctorId: docMap["James Carver"], departmentId: deptMap["Cardiology"] },
    { firstName: "Linda", lastName: "Williams", dateOfBirth: new Date("1978-09-23"), gender: "female", email: "lwilliams@email.com", phone: "555-1002", bloodType: "A-", allergies: "None", status: "active", primaryDoctorId: docMap["Elena Rodriguez"], departmentId: deptMap["Orthopedics"] },
    { firstName: "Marcus", lastName: "Thompson", dateOfBirth: new Date("1990-01-15"), gender: "male", email: "mthompson@email.com", phone: "555-1003", bloodType: "B+", allergies: "Sulfa drugs", status: "active", primaryDoctorId: docMap["Sarah Mitchell"], departmentId: deptMap["Emergency Medicine"] },
    { firstName: "Sophia", lastName: "Garcia", dateOfBirth: new Date("1955-07-08"), gender: "female", email: "sgarcia@email.com", phone: "555-1004", bloodType: "AB+", allergies: "Aspirin", status: "active", primaryDoctorId: docMap["Michael Chen"], departmentId: deptMap["Neurology"] },
    { firstName: "Nathan", lastName: "Kim", dateOfBirth: new Date("2010-03-20"), gender: "male", email: "nkim@email.com", phone: "555-1005", bloodType: "O-", allergies: "None", status: "active", primaryDoctorId: docMap["Priya Patel"], departmentId: deptMap["Pediatrics"] },
    { firstName: "Emily", lastName: "Davis", dateOfBirth: new Date("1985-11-30"), gender: "female", email: "edavis@email.com", phone: "555-1006", bloodType: "A+", allergies: "Latex", status: "inactive", primaryDoctorId: docMap["James Carver"], departmentId: deptMap["Cardiology"] },
    { firstName: "Carlos", lastName: "Rivera", dateOfBirth: new Date("1950-06-18"), gender: "male", email: "crivera@email.com", phone: "555-1007", bloodType: "B-", allergies: "None", status: "active", primaryDoctorId: docMap["David Kim"], departmentId: deptMap["Oncology"] },
    { firstName: "Patricia", lastName: "Brown", dateOfBirth: new Date("1972-12-05"), gender: "female", email: "pbrown@email.com", phone: "555-1008", bloodType: "O+", allergies: "Codeine", status: "active", primaryDoctorId: docMap["Michael Chen"], departmentId: deptMap["Neurology"] },
  ]).returning();

  const patMap: Record<string, number> = {};
  patients.forEach(p => patMap[`${p.firstName} ${p.lastName}`] = p.id);

  // Appointments
  const appts = await db.insert(healthAppointments).values([
    { patientId: patMap["Robert Johnson"], doctorId: docMap["James Carver"], departmentId: deptMap["Cardiology"], scheduledAt: new Date(Date.now() + 2 * 86400000), durationMinutes: 45, type: "follow-up", status: "scheduled", notes: "Post-procedure cardiac check" },
    { patientId: patMap["Linda Williams"], doctorId: docMap["Elena Rodriguez"], departmentId: deptMap["Orthopedics"], scheduledAt: new Date(Date.now() + 1 * 86400000), durationMinutes: 30, type: "check-up", status: "confirmed", notes: "Knee pain assessment, bring prior X-rays" },
    { patientId: patMap["Marcus Thompson"], doctorId: docMap["Sarah Mitchell"], departmentId: deptMap["Emergency Medicine"], scheduledAt: new Date(Date.now() - 3 * 86400000), durationMinutes: 60, type: "emergency", status: "completed", notes: "Chest pain evaluation — ruled out ACS" },
    { patientId: patMap["Sophia Garcia"], doctorId: docMap["Michael Chen"], departmentId: deptMap["Neurology"], scheduledAt: new Date(Date.now() + 5 * 86400000), durationMinutes: 45, type: "specialist", status: "scheduled", notes: "MRI results review" },
    { patientId: patMap["Nathan Kim"], doctorId: docMap["Priya Patel"], departmentId: deptMap["Pediatrics"], scheduledAt: new Date(Date.now() - 7 * 86400000), durationMinutes: 30, type: "check-up", status: "completed", notes: "Annual physical and immunizations" },
    { patientId: patMap["Robert Johnson"], doctorId: docMap["James Carver"], departmentId: deptMap["Cardiology"], scheduledAt: new Date(Date.now() - 14 * 86400000), durationMinutes: 60, type: "specialist", status: "completed", notes: "Cardiac stress test" },
    { patientId: patMap["Carlos Rivera"], doctorId: docMap["David Kim"], departmentId: deptMap["Oncology"], scheduledAt: new Date(Date.now() + 3 * 86400000), durationMinutes: 60, type: "treatment", status: "scheduled", notes: "Chemotherapy cycle 3" },
    { patientId: patMap["Patricia Brown"], doctorId: docMap["Michael Chen"], departmentId: deptMap["Neurology"], scheduledAt: new Date(Date.now() + 7 * 86400000), durationMinutes: 45, type: "follow-up", status: "scheduled", notes: "Migraine management review" },
    { patientId: patMap["Emily Davis"], doctorId: docMap["James Carver"], departmentId: deptMap["Cardiology"], scheduledAt: new Date(Date.now() - 30 * 86400000), durationMinutes: 30, type: "check-up", status: "no_show", notes: "Routine follow-up — patient did not attend" },
  ]).returning();

  // Medical Records
  await db.insert(healthMedicalRecords).values([
    { patientId: patMap["Robert Johnson"], doctorId: docMap["James Carver"], visitDate: new Date(Date.now() - 14 * 86400000), chiefComplaint: "Exertional chest pain and dyspnea", diagnosis: "Stable angina pectoris", treatment: "Metoprolol 50mg daily, Nitroglycerin PRN, dietary modifications. Cardiac stress test ordered.", notes: "EKG shows mild ST changes. Follow-up stress test scheduled. Referred to cardiac rehab.", followUpDate: new Date(Date.now() + 2 * 86400000) },
    { patientId: patMap["Linda Williams"], doctorId: docMap["Elena Rodriguez"], visitDate: new Date(Date.now() - 10 * 86400000), chiefComplaint: "Right knee pain worsening with activity", diagnosis: "Patellofemoral pain syndrome, right knee", treatment: "Physical therapy 3x/week x6 weeks. Ibuprofen 400mg TID PRN. Activity modification.", notes: "MRI shows no structural damage. Good prognosis with conservative management.", followUpDate: new Date(Date.now() + 1 * 86400000) },
    { patientId: patMap["Marcus Thompson"], doctorId: docMap["Sarah Mitchell"], visitDate: new Date(Date.now() - 3 * 86400000), chiefComplaint: "Acute chest pain 8/10, onset 2 hours ago", diagnosis: "Costochondritis — musculoskeletal etiology", treatment: "Ibuprofen 600mg TID x7 days, ice/heat alternating, activity rest", notes: "Troponin negative x2. EKG normal. Chest X-ray unremarkable. Discharge with return precautions.", followUpDate: null },
    { patientId: patMap["Sophia Garcia"], doctorId: docMap["Michael Chen"], visitDate: new Date(Date.now() - 21 * 86400000), chiefComplaint: "Recurring unilateral headaches with visual aura", diagnosis: "Chronic migraine with aura", treatment: "Sumatriptan 50mg PRN, Topiramate 25mg BID (prophylaxis), trigger diary", notes: "Brain MRI ordered to rule out secondary causes. Botox therapy discussed as future option.", followUpDate: new Date(Date.now() + 5 * 86400000) },
    { patientId: patMap["Nathan Kim"], doctorId: docMap["Priya Patel"], visitDate: new Date(Date.now() - 7 * 86400000), chiefComplaint: "Annual wellness examination", diagnosis: "Healthy child — normal growth and development", treatment: "MMR booster administered. Dental referral placed. Vision screening passed.", notes: "BMI 17.2 (normal for age). All developmental milestones met. Next visit in 12 months.", followUpDate: null },
    { patientId: patMap["Carlos Rivera"], doctorId: docMap["David Kim"], visitDate: new Date(Date.now() - 5 * 86400000), chiefComplaint: "Fatigue and weight loss follow-up", diagnosis: "Non-Hodgkin lymphoma, stage II — treatment ongoing", treatment: "CHOP chemotherapy cycle 3 scheduled. Antiemetics prescribed. Port-a-cath functioning well.", notes: "Interim PET scan shows partial response to treatment. Continue planned chemotherapy course.", followUpDate: new Date(Date.now() + 3 * 86400000) },
    { patientId: patMap["Patricia Brown"], doctorId: docMap["Michael Chen"], visitDate: new Date(Date.now() - 45 * 86400000), chiefComplaint: "Progressive headaches and occasional dizziness", diagnosis: "Migraine without aura, chronic", treatment: "Amitriptyline 25mg QHS prophylaxis. Sumatriptan PRN. Lifestyle modifications.", notes: "MRI brain normal. Continued neurological follow-up every 3 months.", followUpDate: new Date(Date.now() + 7 * 86400000) },
  ]);

  // Prescriptions
  await db.insert(healthPrescriptions).values([
    { patientId: patMap["Robert Johnson"], doctorId: docMap["James Carver"], medication: "Metoprolol Succinate", dosage: "50mg", frequency: "Once daily in the morning", startDate: new Date(Date.now() - 14 * 86400000), endDate: new Date(Date.now() + 180 * 86400000), refills: 5, status: "active" },
    { patientId: patMap["Robert Johnson"], doctorId: docMap["James Carver"], medication: "Nitroglycerin", dosage: "0.4mg sublingual", frequency: "PRN chest pain — max 3 doses/15 min", startDate: new Date(Date.now() - 14 * 86400000), endDate: null, refills: 3, status: "active" },
    { patientId: patMap["Robert Johnson"], doctorId: docMap["James Carver"], medication: "Atorvastatin", dosage: "40mg", frequency: "Once daily at bedtime", startDate: new Date(Date.now() - 14 * 86400000), endDate: new Date(Date.now() + 365 * 86400000), refills: 11, status: "active" },
    { patientId: patMap["Linda Williams"], doctorId: docMap["Elena Rodriguez"], medication: "Ibuprofen", dosage: "400mg", frequency: "Three times daily with food", startDate: new Date(Date.now() - 10 * 86400000), endDate: new Date(Date.now() + 14 * 86400000), refills: 0, status: "active" },
    { patientId: patMap["Sophia Garcia"], doctorId: docMap["Michael Chen"], medication: "Topiramate", dosage: "25mg", frequency: "Twice daily (am & pm)", startDate: new Date(Date.now() - 21 * 86400000), endDate: new Date(Date.now() + 90 * 86400000), refills: 2, status: "active" },
    { patientId: patMap["Sophia Garcia"], doctorId: docMap["Michael Chen"], medication: "Sumatriptan", dosage: "50mg", frequency: "PRN migraine — max 2 doses per 24 hours", startDate: new Date(Date.now() - 21 * 86400000), endDate: null, refills: 4, status: "active" },
    { patientId: patMap["Carlos Rivera"], doctorId: docMap["David Kim"], medication: "Ondansetron", dosage: "8mg", frequency: "Every 8 hours as needed for nausea", startDate: new Date(Date.now() - 5 * 86400000), endDate: new Date(Date.now() + 30 * 86400000), refills: 2, status: "active" },
    { patientId: patMap["Carlos Rivera"], doctorId: docMap["David Kim"], medication: "Filgrastim", dosage: "5mcg/kg subcutaneous", frequency: "Daily x10 days post-chemotherapy", startDate: new Date(Date.now() + 3 * 86400000), endDate: new Date(Date.now() + 13 * 86400000), refills: 0, status: "active" },
    { patientId: patMap["Patricia Brown"], doctorId: docMap["Michael Chen"], medication: "Amitriptyline", dosage: "25mg", frequency: "Once daily at bedtime", startDate: new Date(Date.now() - 45 * 86400000), endDate: new Date(Date.now() + 90 * 86400000), refills: 3, status: "active" },
    { patientId: patMap["Nathan Kim"], doctorId: docMap["Priya Patel"], medication: "Amoxicillin", dosage: "250mg", frequency: "Three times daily with food", startDate: new Date(Date.now() - 60 * 86400000), endDate: new Date(Date.now() - 50 * 86400000), refills: 0, status: "completed", notes: "Completed full course for otitis media" },
  ]);

  // Billing
  const dueIn30 = new Date(Date.now() + 30 * 86400000);
  const dueIn20 = new Date(Date.now() + 20 * 86400000);
  const dueIn15 = new Date(Date.now() + 15 * 86400000);
  const pastDue = new Date(Date.now() - 15 * 86400000);
  await db.insert(healthBilling).values([
    { patientId: patMap["Robert Johnson"], appointmentId: appts[0].id, description: "Cardiology Consultation + Stress Test + EKG", amount: "850.00", status: "pending", insuranceCoverage: "680.00", patientOwes: "170.00", dueDate: dueIn30 },
    { patientId: patMap["Linda Williams"], appointmentId: appts[1].id, description: "Orthopedic Evaluation + Right Knee X-ray (2 views)", amount: "420.00", status: "paid", insuranceCoverage: "336.00", patientOwes: "84.00", dueDate: new Date(Date.now() - 5 * 86400000), paidDate: new Date(Date.now() - 2 * 86400000) },
    { patientId: patMap["Marcus Thompson"], appointmentId: appts[2].id, description: "Emergency Department Visit — Level 4 + Labs", amount: "1200.00", status: "pending", insuranceCoverage: "900.00", patientOwes: "300.00", dueDate: dueIn20 },
    { patientId: patMap["Sophia Garcia"], appointmentId: appts[3].id, description: "Neurology Consultation", amount: "380.00", status: "partial", insuranceCoverage: "304.00", patientOwes: "76.00", dueDate: dueIn15 },
    { patientId: patMap["Nathan Kim"], appointmentId: appts[4].id, description: "Annual Physical Exam + Immunizations (MMR, Varicella)", amount: "280.00", status: "paid", insuranceCoverage: "280.00", patientOwes: "0.00", dueDate: new Date(Date.now() - 2 * 86400000), paidDate: new Date(Date.now() - 1 * 86400000) },
    { patientId: patMap["Emily Davis"], appointmentId: appts[8].id, description: "Cardiology Follow-up — No Show Fee", amount: "150.00", status: "overdue", insuranceCoverage: "0.00", patientOwes: "150.00", dueDate: pastDue },
    { patientId: patMap["Carlos Rivera"], appointmentId: appts[6].id, description: "Chemotherapy Administration — Cycle 3 (CHOP Protocol)", amount: "4800.00", status: "pending", insuranceCoverage: "4320.00", patientOwes: "480.00", dueDate: dueIn30 },
    { patientId: patMap["Patricia Brown"], appointmentId: appts[7].id, description: "Neurology Consultation + MRI Brain (without contrast)", amount: "920.00", status: "pending", insuranceCoverage: "736.00", patientOwes: "184.00", dueDate: dueIn30 },
  ]);

  console.log("Healthcare seed complete: 7 departments, 7 doctors, 8 patients, 9 appointments, 7 records, 10 prescriptions, 8 bills");
}

seedHealthcare().catch(e => { console.error("Seed failed:", e); process.exit(1); });
