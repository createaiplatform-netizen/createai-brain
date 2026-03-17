import { boolean, integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const healthDepartments = pgTable("health_departments", {
  id:            serial("id").primaryKey(),
  name:          text("name").notNull(),
  description:   text("description"),
  headDoctorId:  integer("head_doctor_id"),
  floor:         text("floor"),
  capacity:      integer("capacity").default(50),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const healthDoctors = pgTable("health_doctors", {
  id:            serial("id").primaryKey(),
  firstName:     text("first_name").notNull(),
  lastName:      text("last_name").notNull(),
  specialty:     text("specialty").notNull(),
  departmentId:  integer("department_id").references(() => healthDepartments.id),
  email:         text("email"),
  phone:         text("phone"),
  licenseNumber: text("license_number"),
  status:        text("status").notNull().default("active"),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const healthPatients = pgTable("health_patients", {
  id:              serial("id").primaryKey(),
  firstName:       text("first_name").notNull(),
  lastName:        text("last_name").notNull(),
  dateOfBirth:     timestamp("date_of_birth", { withTimezone: true }),
  gender:          text("gender").notNull().default("other"),
  email:           text("email"),
  phone:           text("phone"),
  address:         text("address"),
  bloodType:       text("blood_type"),
  allergies:       text("allergies"),
  status:          text("status").notNull().default("active"),
  primaryDoctorId: integer("primary_doctor_id").references(() => healthDoctors.id),
  departmentId:    integer("department_id").references(() => healthDepartments.id),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const healthAppointments = pgTable("health_appointments", {
  id:              serial("id").primaryKey(),
  patientId:       integer("patient_id").notNull().references(() => healthPatients.id, { onDelete: "cascade" }),
  doctorId:        integer("doctor_id").notNull().references(() => healthDoctors.id),
  departmentId:    integer("department_id").references(() => healthDepartments.id),
  scheduledAt:     timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  type:            text("type").notNull().default("check-up"),
  status:          text("status").notNull().default("scheduled"),
  notes:           text("notes"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const healthMedicalRecords = pgTable("health_medical_records", {
  id:             serial("id").primaryKey(),
  patientId:      integer("patient_id").notNull().references(() => healthPatients.id, { onDelete: "cascade" }),
  doctorId:       integer("doctor_id").notNull().references(() => healthDoctors.id),
  visitDate:      timestamp("visit_date", { withTimezone: true }).notNull(),
  chiefComplaint: text("chief_complaint"),
  diagnosis:      text("diagnosis").notNull(),
  treatment:      text("treatment"),
  notes:          text("notes"),
  followUpDate:   timestamp("follow_up_date", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const healthPrescriptions = pgTable("health_prescriptions", {
  id:         serial("id").primaryKey(),
  patientId:  integer("patient_id").notNull().references(() => healthPatients.id, { onDelete: "cascade" }),
  doctorId:   integer("doctor_id").notNull().references(() => healthDoctors.id),
  medication: text("medication").notNull(),
  dosage:     text("dosage").notNull(),
  frequency:  text("frequency").notNull(),
  startDate:  timestamp("start_date", { withTimezone: true }).notNull(),
  endDate:    timestamp("end_date", { withTimezone: true }),
  refills:    integer("refills").notNull().default(0),
  status:     text("status").notNull().default("active"),
  notes:      text("notes"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const healthBilling = pgTable("health_billing", {
  id:                serial("id").primaryKey(),
  patientId:         integer("patient_id").notNull().references(() => healthPatients.id, { onDelete: "cascade" }),
  appointmentId:     integer("appointment_id").references(() => healthAppointments.id),
  description:       text("description").notNull(),
  amount:            numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status:            text("status").notNull().default("pending"),
  insuranceCoverage: numeric("insurance_coverage", { precision: 10, scale: 2 }).default("0"),
  patientOwes:       numeric("patient_owes", { precision: 10, scale: 2 }),
  dueDate:           timestamp("due_date", { withTimezone: true }),
  paidDate:          timestamp("paid_date", { withTimezone: true }),
  createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type HealthDepartment  = typeof healthDepartments.$inferSelect;
export type HealthDoctor      = typeof healthDoctors.$inferSelect;
export type HealthPatient     = typeof healthPatients.$inferSelect;
export type HealthAppointment = typeof healthAppointments.$inferSelect;
export type HealthMedRecord   = typeof healthMedicalRecords.$inferSelect;
export type HealthPrescription= typeof healthPrescriptions.$inferSelect;
export type HealthBillingRecord = typeof healthBilling.$inferSelect;
