import { pgTable, serial, text, integer, decimal, timestamp, varchar } from "drizzle-orm/pg-core";

export const staffingClients = pgTable("staffing_clients", {
  id:           serial("id").primaryKey(),
  companyName:  text("company_name").notNull(),
  industry:     text("industry"),
  contactName:  text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address:      text("address"),
  website:      text("website"),
  status:       varchar("status", { length: 30 }).notNull().default("active"),
  notes:        text("notes"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

export const staffingCandidates = pgTable("staffing_candidates", {
  id:           serial("id").primaryKey(),
  firstName:    text("first_name").notNull(),
  lastName:     text("last_name").notNull(),
  email:        text("email").notNull(),
  phone:        text("phone"),
  title:        text("title"),
  location:     text("location"),
  skills:       text("skills"),
  experience:   integer("experience"),
  availability: text("availability"),
  status:       varchar("status", { length: 30 }).notNull().default("active"),
  source:       text("source"),
  resumeUrl:    text("resume_url"),
  notes:        text("notes"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

export const staffingRequisitions = pgTable("staffing_requisitions", {
  id:           serial("id").primaryKey(),
  clientId:     integer("client_id").notNull().references(() => staffingClients.id),
  title:        text("title").notNull(),
  department:   text("department"),
  location:     text("location"),
  type:         varchar("type", { length: 30 }).notNull().default("full-time"),
  salaryMin:    decimal("salary_min", { precision: 12, scale: 2 }),
  salaryMax:    decimal("salary_max", { precision: 12, scale: 2 }),
  description:  text("description"),
  requirements: text("requirements"),
  status:       varchar("status", { length: 30 }).notNull().default("open"),
  priority:     varchar("priority", { length: 20 }).notNull().default("medium"),
  targetDate:   timestamp("target_date"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

export const staffingSubmissions = pgTable("staffing_submissions", {
  id:                serial("id").primaryKey(),
  candidateId:       integer("candidate_id").notNull().references(() => staffingCandidates.id),
  requisitionId:     integer("requisition_id").notNull().references(() => staffingRequisitions.id),
  status:            varchar("status", { length: 30 }).notNull().default("submitted"),
  submittedAt:       timestamp("submitted_at").notNull().defaultNow(),
  notes:             text("notes"),
  recruiterFeedback: text("recruiter_feedback"),
  clientFeedback:    text("client_feedback"),
  createdAt:         timestamp("created_at").notNull().defaultNow(),
});

export const staffingInterviews = pgTable("staffing_interviews", {
  id:               serial("id").primaryKey(),
  submissionId:     integer("submission_id").notNull().references(() => staffingSubmissions.id),
  candidateId:      integer("candidate_id").notNull().references(() => staffingCandidates.id),
  requisitionId:    integer("requisition_id").notNull().references(() => staffingRequisitions.id),
  scheduledAt:      timestamp("scheduled_at").notNull(),
  durationMinutes:  integer("duration_minutes").notNull().default(60),
  type:             varchar("type", { length: 30 }).notNull().default("phone"),
  status:           varchar("status", { length: 30 }).notNull().default("scheduled"),
  interviewerName:  text("interviewer_name"),
  location:         text("location"),
  notes:            text("notes"),
  feedback:         text("feedback"),
  outcome:          varchar("outcome", { length: 30 }),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
});

export const staffingPlacements = pgTable("staffing_placements", {
  id:             serial("id").primaryKey(),
  candidateId:    integer("candidate_id").notNull().references(() => staffingCandidates.id),
  requisitionId:  integer("requisition_id").notNull().references(() => staffingRequisitions.id),
  clientId:       integer("client_id").notNull().references(() => staffingClients.id),
  startDate:      timestamp("start_date").notNull(),
  endDate:        timestamp("end_date"),
  type:           varchar("type", { length: 30 }).notNull().default("permanent"),
  salary:         decimal("salary", { precision: 12, scale: 2 }),
  fee:            decimal("fee", { precision: 12, scale: 2 }),
  status:         varchar("status", { length: 30 }).notNull().default("active"),
  notes:          text("notes"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});
