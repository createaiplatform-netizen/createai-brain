/**
 * domainEngines2.ts — Extended Domain Engine Suite v2.0
 *
 * 10 new industry-equivalent engines:
 *  1. Project Command  — full PM (projects, tasks, sprints, milestones)
 *  2. Partner Network  — affiliates, commissions, referral chains
 *  3. Event & Booking  — events, seats, reservations, attendance
 *  4. Education Engine — courses, modules, enrollments, certificates
 *  5. Social Command   — posts, platforms, scheduling, analytics
 *  6. Supply Chain     — vendors, POs, shipments, fulfillment
 *  7. Franchise Hub    — locations, operators, royalties, compliance
 *  8. Brand Vault      — assets, guidelines, usage licensing
 *  9. Revenue Intel    — cohorts, LTV, churn, forecasting
 * 10. AI Strategy      — GPT-4o strategic insight engine
 */

import { randomUUID } from "crypto";

function record<T extends object>(data: T): T & { id: string; createdAt: string; updatedAt: string } {
  return { ...data, id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

// ─── 1. Project Command Engine ────────────────────────────────────────────────

export type ProjectStatus = "planning" | "active" | "on-hold" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done";

export interface Project {
  id: string; name: string; description: string;
  status: ProjectStatus; priority: TaskPriority;
  owner: string; team: string[];
  startDate: string; dueDate: string;
  progress: number; budget: number; spent: number;
  tags: string[]; createdAt: string; updatedAt: string;
}

export interface ProjectTask {
  id: string; projectId: string; title: string;
  status: TaskStatus; priority: TaskPriority;
  assignee: string; estimatedHours: number; loggedHours: number;
  dueDate: string; tags: string[];
  createdAt: string; updatedAt: string;
}

const _projects: Project[] = [];
const _projectTasks: ProjectTask[] = [];

export const projectCommand = {
  create(data: Partial<Project>): Project {
    const p = record({
      name: data.name ?? "Untitled Project",
      description: data.description ?? "",
      status: (data.status ?? "planning") as ProjectStatus,
      priority: (data.priority ?? "medium") as TaskPriority,
      owner: data.owner ?? "unassigned",
      team: data.team ?? [],
      startDate: data.startDate ?? new Date().toISOString().split("T")[0],
      dueDate: data.dueDate ?? "",
      progress: data.progress ?? 0,
      budget: data.budget ?? 0,
      spent: data.spent ?? 0,
      tags: data.tags ?? [],
    }) as Project;
    _projects.push(p); return p;
  },
  addTask(data: Partial<ProjectTask>): ProjectTask {
    const t = record({
      projectId: data.projectId ?? "",
      title: data.title ?? "Untitled Task",
      status: (data.status ?? "todo") as TaskStatus,
      priority: (data.priority ?? "medium") as TaskPriority,
      assignee: data.assignee ?? "unassigned",
      estimatedHours: data.estimatedHours ?? 0,
      loggedHours: data.loggedHours ?? 0,
      dueDate: data.dueDate ?? "",
      tags: data.tags ?? [],
    }) as ProjectTask;
    _projectTasks.push(t); return t;
  },
  updateStatus(projectId: string, status: ProjectStatus): boolean {
    const p = _projects.find(p => p.id === projectId);
    if (!p) return false;
    p.status = status; p.updatedAt = new Date().toISOString(); return true;
  },
  list(): Project[] { return [..._projects]; },
  tasks(projectId?: string): ProjectTask[] {
    return projectId ? _projectTasks.filter(t => t.projectId === projectId) : [..._projectTasks];
  },
  stats() {
    const byStatus: Record<string, number> = {};
    for (const s of ["planning","active","on-hold","completed","cancelled"]) byStatus[s] = 0;
    for (const p of _projects) byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    const totalBudget = _projects.reduce((s, p) => s + p.budget, 0);
    const totalSpent = _projects.reduce((s, p) => s + p.spent, 0);
    return {
      totalProjects: _projects.length,
      totalTasks: _projectTasks.length,
      byStatus, totalBudget, totalSpent,
      completionRate: _projects.length ? Math.round((_projects.filter(p => p.status === "completed").length / _projects.length) * 100) : 0,
      engine: "Project Command Engine v1.0",
    };
  },
};

// ─── 2. Partner Network Engine ────────────────────────────────────────────────

export type PartnerTier = "bronze" | "silver" | "gold" | "platinum" | "elite";
export type PartnerType = "affiliate" | "reseller" | "referral" | "integration" | "strategic";

export interface Partner {
  id: string; name: string; email: string; type: PartnerType;
  tier: PartnerTier; commissionRate: number;
  totalReferrals: number; totalRevenue: number; totalCommissions: number;
  status: "active" | "pending" | "suspended"; joinedAt: string;
  createdAt: string; updatedAt: string;
}

export interface PartnerReferral {
  id: string; partnerId: string; leadName: string; leadEmail: string;
  dealValue: number; commission: number; status: "pending" | "won" | "lost";
  createdAt: string; updatedAt: string;
}

const _partners: Partner[] = [];
const _referrals: PartnerReferral[] = [];

export const partnerNetwork = {
  enroll(data: Partial<Partner>): Partner {
    const p = record({
      name: data.name ?? "",
      email: data.email ?? "",
      type: (data.type ?? "affiliate") as PartnerType,
      tier: (data.tier ?? "bronze") as PartnerTier,
      commissionRate: data.commissionRate ?? 0.1,
      totalReferrals: 0, totalRevenue: 0, totalCommissions: 0,
      status: "active" as const,
      joinedAt: new Date().toISOString(),
    }) as Partner;
    _partners.push(p); return p;
  },
  logReferral(partnerId: string, leadName: string, leadEmail: string, dealValue: number): PartnerReferral {
    const partner = _partners.find(p => p.id === partnerId);
    const commission = partner ? dealValue * partner.commissionRate : 0;
    const r = record({ partnerId, leadName, leadEmail, dealValue, commission, status: "pending" as const }) as PartnerReferral;
    _referrals.push(r);
    if (partner) { partner.totalReferrals++; partner.updatedAt = new Date().toISOString(); }
    return r;
  },
  convertReferral(referralId: string): boolean {
    const r = _referrals.find(r => r.id === referralId);
    if (!r) return false;
    r.status = "won"; r.updatedAt = new Date().toISOString();
    const partner = _partners.find(p => p.id === r.partnerId);
    if (partner) {
      partner.totalRevenue += r.dealValue;
      partner.totalCommissions += r.commission;
      const rev = partner.totalRevenue;
      partner.tier = rev > 500000 ? "elite" : rev > 100000 ? "platinum" : rev > 25000 ? "gold" : rev > 5000 ? "silver" : "bronze";
      partner.updatedAt = new Date().toISOString();
    }
    return true;
  },
  list(): Partner[] { return [..._partners]; },
  referrals(partnerId?: string): PartnerReferral[] {
    return partnerId ? _referrals.filter(r => r.partnerId === partnerId) : [..._referrals];
  },
  leaderboard(): Partner[] {
    return [..._partners].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
  },
  stats() {
    const totalCommissions = _partners.reduce((s, p) => s + p.totalCommissions, 0);
    const totalRevenue = _partners.reduce((s, p) => s + p.totalRevenue, 0);
    const byTier: Record<string, number> = {};
    for (const p of _partners) byTier[p.tier] = (byTier[p.tier] ?? 0) + 1;
    return {
      totalPartners: _partners.length,
      totalReferrals: _referrals.length,
      wonReferrals: _referrals.filter(r => r.status === "won").length,
      totalRevenue, totalCommissions, byTier,
      conversionRate: _referrals.length ? Math.round((_referrals.filter(r => r.status === "won").length / _referrals.length) * 100) : 0,
      engine: "Partner Network Engine v1.0",
    };
  },
};

// ─── 3. Event & Booking Engine ────────────────────────────────────────────────

export type EventType = "webinar" | "workshop" | "conference" | "meetup" | "training" | "product-launch" | "vip";
export type BookingStatus = "confirmed" | "waitlisted" | "cancelled" | "attended";

export interface Event {
  id: string; title: string; type: EventType;
  description: string; startDate: string; endDate: string;
  location: string; isVirtual: boolean; maxAttendees: number;
  currentAttendees: number; price: number; revenue: number;
  status: "draft" | "open" | "sold-out" | "completed" | "cancelled";
  tags: string[]; createdAt: string; updatedAt: string;
}

export interface Booking {
  id: string; eventId: string; attendeeName: string; attendeeEmail: string;
  status: BookingStatus; amountPaid: number; checkInTime?: string;
  createdAt: string; updatedAt: string;
}

const _events: Event[] = [];
const _bookings: Booking[] = [];

export const eventBooking = {
  createEvent(data: Partial<Event>): Event {
    const e = record({
      title: data.title ?? "Untitled Event",
      type: (data.type ?? "webinar") as EventType,
      description: data.description ?? "",
      startDate: data.startDate ?? new Date().toISOString(),
      endDate: data.endDate ?? new Date().toISOString(),
      location: data.location ?? "Online",
      isVirtual: data.isVirtual ?? true,
      maxAttendees: data.maxAttendees ?? 100,
      currentAttendees: 0, price: data.price ?? 0, revenue: 0,
      status: "open" as const,
      tags: data.tags ?? [],
    }) as Event;
    _events.push(e); return e;
  },
  book(eventId: string, name: string, email: string): Booking | null {
    const event = _events.find(e => e.id === eventId);
    if (!event || event.status === "cancelled") return null;
    const status: BookingStatus = event.currentAttendees >= event.maxAttendees ? "waitlisted" : "confirmed";
    const b = record({ eventId, attendeeName: name, attendeeEmail: email, status, amountPaid: event.price }) as Booking;
    _bookings.push(b);
    if (status === "confirmed") {
      event.currentAttendees++;
      event.revenue += event.price;
      if (event.currentAttendees >= event.maxAttendees) event.status = "sold-out";
      event.updatedAt = new Date().toISOString();
    }
    return b;
  },
  checkIn(bookingId: string): boolean {
    const b = _bookings.find(b => b.id === bookingId);
    if (!b) return false;
    b.status = "attended"; b.checkInTime = new Date().toISOString(); b.updatedAt = new Date().toISOString();
    return true;
  },
  listEvents(status?: string): Event[] {
    return status ? _events.filter(e => e.status === status) : [..._events];
  },
  listBookings(eventId?: string): Booking[] {
    return eventId ? _bookings.filter(b => b.eventId === eventId) : [..._bookings];
  },
  stats() {
    const totalRevenue = _events.reduce((s, e) => s + e.revenue, 0);
    return {
      totalEvents: _events.length,
      totalBookings: _bookings.length,
      confirmedBookings: _bookings.filter(b => b.status === "confirmed").length,
      attendedBookings: _bookings.filter(b => b.status === "attended").length,
      totalRevenue, totalAttendees: _events.reduce((s, e) => s + e.currentAttendees, 0),
      engine: "Event & Booking Engine v1.0",
    };
  },
};

// ─── 4. Education Engine ──────────────────────────────────────────────────────

export type CourseLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type CourseStatus = "draft" | "published" | "archived";

export interface Course {
  id: string; title: string; description: string;
  category: string; level: CourseLevel; status: CourseStatus;
  instructor: string; price: number; modules: number;
  duration: number; enrolled: number; completions: number;
  rating: number; ratingCount: number; certificate: boolean;
  createdAt: string; updatedAt: string;
}

export interface CourseEnrollment {
  id: string; courseId: string; studentId: string; studentName: string;
  progress: number; status: "enrolled" | "in-progress" | "completed" | "dropped";
  completedAt?: string; certificateId?: string;
  createdAt: string; updatedAt: string;
}

const _courses: Course[] = [];
const _enrollments: CourseEnrollment[] = [];

export const educationEngine = {
  createCourse(data: Partial<Course>): Course {
    const c = record({
      title: data.title ?? "Untitled Course",
      description: data.description ?? "",
      category: data.category ?? "general",
      level: (data.level ?? "beginner") as CourseLevel,
      status: "published" as const,
      instructor: data.instructor ?? "CreateAI Brain",
      price: data.price ?? 0,
      modules: data.modules ?? 1,
      duration: data.duration ?? 60,
      enrolled: 0, completions: 0,
      rating: 0, ratingCount: 0,
      certificate: data.certificate ?? true,
    }) as Course;
    _courses.push(c); return c;
  },
  enroll(courseId: string, studentId: string, studentName: string): CourseEnrollment {
    const e = record({ courseId, studentId, studentName, progress: 0, status: "enrolled" as const }) as CourseEnrollment;
    _enrollments.push(e);
    const course = _courses.find(c => c.id === courseId);
    if (course) { course.enrolled++; course.updatedAt = new Date().toISOString(); }
    return e;
  },
  progress(enrollmentId: string, progress: number): CourseEnrollment | null {
    const e = _enrollments.find(e => e.id === enrollmentId);
    if (!e) return null;
    e.progress = Math.min(100, progress);
    if (e.progress >= 100) {
      e.status = "completed"; e.completedAt = new Date().toISOString();
      e.certificateId = `CERT-${randomUUID().slice(0, 8).toUpperCase()}`;
      const course = _courses.find(c => c.id === e.courseId);
      if (course) { course.completions++; course.updatedAt = new Date().toISOString(); }
    } else if (e.progress > 0) {
      e.status = "in-progress";
    }
    e.updatedAt = new Date().toISOString();
    return e;
  },
  listCourses(category?: string): Course[] {
    return category ? _courses.filter(c => c.category === category) : [..._courses];
  },
  listEnrollments(courseId?: string): CourseEnrollment[] {
    return courseId ? _enrollments.filter(e => e.courseId === courseId) : [..._enrollments];
  },
  stats() {
    const totalRevenue = _courses.reduce((s, c) => s + c.price * c.enrolled, 0);
    return {
      totalCourses: _courses.length,
      publishedCourses: _courses.filter(c => c.status === "published").length,
      totalEnrollments: _enrollments.length,
      completions: _enrollments.filter(e => e.status === "completed").length,
      certificates: _enrollments.filter(e => e.certificateId).length,
      totalRevenue,
      completionRate: _enrollments.length ? Math.round((_enrollments.filter(e => e.status === "completed").length / _enrollments.length) * 100) : 0,
      engine: "Education Engine v1.0",
    };
  },
};

// ─── 5. Social Command Engine ─────────────────────────────────────────────────

export type SocialPlatform = "instagram" | "tiktok" | "linkedin" | "twitter" | "facebook" | "youtube" | "pinterest" | "threads";
export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export interface SocialPost {
  id: string; content: string; platform: SocialPlatform; status: PostStatus;
  scheduledAt?: string; publishedAt?: string;
  impressions: number; reach: number; engagement: number; clicks: number;
  mediaUrls: string[]; hashtags: string[];
  createdAt: string; updatedAt: string;
}

export interface SocialAccount {
  platform: SocialPlatform; handle: string; followers: number;
  following: number; posts: number; engagementRate: number;
  connected: boolean; lastSync: string;
}

const _posts: SocialPost[] = [];
const _accounts: SocialAccount[] = [
  { platform: "instagram", handle: "@CreateAIDigital", followers: 0, following: 0, posts: 0, engagementRate: 0, connected: false, lastSync: new Date().toISOString() },
  { platform: "tiktok", handle: "@CreateAIDigital", followers: 0, following: 0, posts: 0, engagementRate: 0, connected: false, lastSync: new Date().toISOString() },
  { platform: "linkedin", handle: "Lakeside Trinity LLC", followers: 0, following: 0, posts: 0, engagementRate: 0, connected: false, lastSync: new Date().toISOString() },
  { platform: "youtube", handle: "CreateAI Digital", followers: 0, following: 0, posts: 0, engagementRate: 0, connected: false, lastSync: new Date().toISOString() },
];

export const socialCommand = {
  schedulePost(data: Partial<SocialPost>): SocialPost {
    const p = record({
      content: data.content ?? "",
      platform: (data.platform ?? "instagram") as SocialPlatform,
      status: "scheduled" as const,
      scheduledAt: data.scheduledAt ?? new Date().toISOString(),
      impressions: 0, reach: 0, engagement: 0, clicks: 0,
      mediaUrls: data.mediaUrls ?? [],
      hashtags: data.hashtags ?? [],
    }) as SocialPost;
    _posts.push(p); return p;
  },
  publish(postId: string): boolean {
    const p = _posts.find(p => p.id === postId);
    if (!p) return false;
    p.status = "published"; p.publishedAt = new Date().toISOString(); p.updatedAt = new Date().toISOString();
    return true;
  },
  updateMetrics(postId: string, metrics: { impressions?: number; reach?: number; engagement?: number; clicks?: number }): boolean {
    const p = _posts.find(p => p.id === postId);
    if (!p) return false;
    if (metrics.impressions !== undefined) p.impressions = metrics.impressions;
    if (metrics.reach !== undefined) p.reach = metrics.reach;
    if (metrics.engagement !== undefined) p.engagement = metrics.engagement;
    if (metrics.clicks !== undefined) p.clicks = metrics.clicks;
    p.updatedAt = new Date().toISOString();
    return true;
  },
  accounts(): SocialAccount[] { return [..._accounts]; },
  posts(platform?: string): SocialPost[] {
    return platform ? _posts.filter(p => p.platform === platform) : [..._posts];
  },
  calendar(): SocialPost[] {
    return [..._posts].filter(p => p.status === "scheduled" || p.status === "published").sort((a, b) =>
      new Date(a.scheduledAt ?? a.createdAt).getTime() - new Date(b.scheduledAt ?? b.createdAt).getTime()
    );
  },
  stats() {
    const published = _posts.filter(p => p.status === "published");
    return {
      totalPosts: _posts.length,
      publishedPosts: published.length,
      scheduledPosts: _posts.filter(p => p.status === "scheduled").length,
      totalImpressions: published.reduce((s, p) => s + p.impressions, 0),
      totalReach: published.reduce((s, p) => s + p.reach, 0),
      totalEngagement: published.reduce((s, p) => s + p.engagement, 0),
      connectedAccounts: _accounts.filter(a => a.connected).length,
      totalAccounts: _accounts.length,
      engine: "Social Command Engine v1.0",
    };
  },
};

// ─── 6. Supply Chain Engine ───────────────────────────────────────────────────

export type POStatus = "draft" | "sent" | "acknowledged" | "partial" | "received" | "cancelled";

export interface Vendor {
  id: string; name: string; category: string; email: string;
  phone: string; leadTimeDays: number; reliabilityScore: number;
  totalOrders: number; totalSpend: number; status: "active" | "inactive" | "approved";
  createdAt: string; updatedAt: string;
}

export interface PurchaseOrder {
  id: string; vendorId: string; vendorName: string;
  lineItems: Array<{ sku: string; description: string; qty: number; unitCost: number }>;
  total: number; status: POStatus; expectedDate: string; receivedDate?: string;
  createdAt: string; updatedAt: string;
}

const _vendors: Vendor[] = [];
const _purchaseOrders: PurchaseOrder[] = [];

export const supplyChain = {
  addVendor(data: Partial<Vendor>): Vendor {
    const v = record({
      name: data.name ?? "",
      category: data.category ?? "general",
      email: data.email ?? "",
      phone: data.phone ?? "",
      leadTimeDays: data.leadTimeDays ?? 7,
      reliabilityScore: data.reliabilityScore ?? 80,
      totalOrders: 0, totalSpend: 0,
      status: "approved" as const,
    }) as Vendor;
    _vendors.push(v); return v;
  },
  createPO(vendorId: string, lineItems: PurchaseOrder["lineItems"], expectedDate: string): PurchaseOrder {
    const vendor = _vendors.find(v => v.id === vendorId);
    const total = lineItems.reduce((s, i) => s + i.qty * i.unitCost, 0);
    const po = record({
      vendorId, vendorName: vendor?.name ?? "Unknown Vendor",
      lineItems, total, status: "draft" as const, expectedDate,
    }) as PurchaseOrder;
    _purchaseOrders.push(po);
    if (vendor) { vendor.totalOrders++; vendor.totalSpend += total; vendor.updatedAt = new Date().toISOString(); }
    return po;
  },
  updatePOStatus(poId: string, status: POStatus): boolean {
    const po = _purchaseOrders.find(p => p.id === poId);
    if (!po) return false;
    po.status = status;
    if (status === "received") po.receivedDate = new Date().toISOString();
    po.updatedAt = new Date().toISOString();
    return true;
  },
  vendors(): Vendor[] { return [..._vendors]; },
  purchaseOrders(vendorId?: string): PurchaseOrder[] {
    return vendorId ? _purchaseOrders.filter(po => po.vendorId === vendorId) : [..._purchaseOrders];
  },
  stats() {
    const totalSpend = _purchaseOrders.reduce((s, po) => s + po.total, 0);
    const pending = _purchaseOrders.filter(po => ["draft","sent","acknowledged","partial"].includes(po.status));
    return {
      totalVendors: _vendors.length,
      activeVendors: _vendors.filter(v => v.status === "active" || v.status === "approved").length,
      totalPOs: _purchaseOrders.length,
      pendingPOs: pending.length,
      pendingValue: pending.reduce((s, po) => s + po.total, 0),
      totalSpend, receivedPOs: _purchaseOrders.filter(po => po.status === "received").length,
      engine: "Supply Chain Engine v1.0",
    };
  },
};

// ─── 7. Franchise Hub Engine ──────────────────────────────────────────────────

export interface FranchiseLocation {
  id: string; name: string; address: string; city: string; state: string;
  operator: string; operatorEmail: string;
  openDate: string; territory: string;
  monthlyRevenue: number; royaltyRate: number; royaltiesPaid: number;
  complianceScore: number; status: "open" | "pending" | "suspended" | "closed";
  staff: number; createdAt: string; updatedAt: string;
}

const _locations: FranchiseLocation[] = [];

export const franchiseHub = {
  addLocation(data: Partial<FranchiseLocation>): FranchiseLocation {
    const l = record({
      name: data.name ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      operator: data.operator ?? "",
      operatorEmail: data.operatorEmail ?? "",
      openDate: data.openDate ?? new Date().toISOString().split("T")[0],
      territory: data.territory ?? "",
      monthlyRevenue: data.monthlyRevenue ?? 0,
      royaltyRate: data.royaltyRate ?? 0.06,
      royaltiesPaid: 0,
      complianceScore: 100,
      status: "open" as const,
      staff: data.staff ?? 0,
    }) as FranchiseLocation;
    _locations.push(l); return l;
  },
  reportRevenue(locationId: string, monthlyRevenue: number): boolean {
    const l = _locations.find(l => l.id === locationId);
    if (!l) return false;
    l.monthlyRevenue = monthlyRevenue;
    l.royaltiesPaid += monthlyRevenue * l.royaltyRate;
    l.updatedAt = new Date().toISOString();
    return true;
  },
  updateCompliance(locationId: string, score: number): boolean {
    const l = _locations.find(l => l.id === locationId);
    if (!l) return false;
    l.complianceScore = Math.min(100, Math.max(0, score));
    if (score < 50) l.status = "suspended";
    l.updatedAt = new Date().toISOString();
    return true;
  },
  list(status?: string): FranchiseLocation[] {
    return status ? _locations.filter(l => l.status === status) : [..._locations];
  },
  stats() {
    const totalRevenue = _locations.reduce((s, l) => s + l.monthlyRevenue, 0);
    const totalRoyalties = _locations.reduce((s, l) => s + l.royaltiesPaid, 0);
    return {
      totalLocations: _locations.length,
      openLocations: _locations.filter(l => l.status === "open").length,
      pendingLocations: _locations.filter(l => l.status === "pending").length,
      suspendedLocations: _locations.filter(l => l.status === "suspended").length,
      totalMonthlyRevenue: totalRevenue,
      totalRoyalties, totalStaff: _locations.reduce((s, l) => s + l.staff, 0),
      avgComplianceScore: _locations.length ? Math.round(_locations.reduce((s, l) => s + l.complianceScore, 0) / _locations.length) : 0,
      engine: "Franchise Hub Engine v1.0",
    };
  },
};

// ─── 8. Brand Vault Engine ────────────────────────────────────────────────────

export type AssetType = "logo" | "icon" | "banner" | "template" | "video" | "audio" | "font" | "color-palette" | "guideline" | "photography";
export type LicenseType = "internal-only" | "partner" | "commercial" | "open";

export interface BrandAsset {
  id: string; name: string; type: AssetType;
  description: string; fileUrl: string; fileSize: number;
  license: LicenseType; version: string;
  tags: string[]; usageCount: number;
  approvedBy: string; expiresAt?: string;
  createdAt: string; updatedAt: string;
}

export interface BrandGuideline {
  id: string; section: string; rule: string;
  rationale: string; example: string;
  priority: "must" | "should" | "may";
  createdAt: string; updatedAt: string;
}

const _brandAssets: BrandAsset[] = [
  { id: "brand-primary-logo", name: "CreateAI Brain Primary Logo", type: "logo", description: "Main wordmark logo in SVG format", fileUrl: "/assets/brand/logo-primary.svg", fileSize: 12400, license: "internal-only", version: "2.0", tags: ["logo","primary","wordmark"], usageCount: 0, approvedBy: "Sara Stadler", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "brand-color-palette", name: "Brand Color System", type: "color-palette", description: "Indigo #6366f1 primary, Dark #020617 background", fileUrl: "/assets/brand/colors.json", fileSize: 1024, license: "internal-only", version: "2.0", tags: ["colors","palette","brand"], usageCount: 0, approvedBy: "Sara Stadler", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const _guidelines: BrandGuideline[] = [
  { id: "bg-1", section: "Color", rule: "Always use Indigo #6366f1 as the primary accent color", rationale: "Consistent brand recognition across all touchpoints", example: "Button backgrounds, active states, links", priority: "must", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "bg-2", section: "Background", rule: "Use #020617 or #0f172a for admin and system pages", rationale: "Dark theme for professional AI-tool aesthetic", example: "Dashboard backgrounds, modal overlays", priority: "must", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "bg-3", section: "Typography", rule: "Inter or system-ui for all body text, never Comic Sans", rationale: "Clean, readable, professional", example: "All text elements", priority: "must", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const brandVault = {
  addAsset(data: Partial<BrandAsset>): BrandAsset {
    const a = record({
      name: data.name ?? "Untitled Asset",
      type: (data.type ?? "logo") as AssetType,
      description: data.description ?? "",
      fileUrl: data.fileUrl ?? "",
      fileSize: data.fileSize ?? 0,
      license: (data.license ?? "internal-only") as LicenseType,
      version: data.version ?? "1.0",
      tags: data.tags ?? [],
      usageCount: 0,
      approvedBy: data.approvedBy ?? "Sara Stadler",
      expiresAt: data.expiresAt,
    }) as BrandAsset;
    _brandAssets.push(a); return a;
  },
  addGuideline(data: Partial<BrandGuideline>): BrandGuideline {
    const g = record({
      section: data.section ?? "General",
      rule: data.rule ?? "",
      rationale: data.rationale ?? "",
      example: data.example ?? "",
      priority: (data.priority ?? "should") as BrandGuideline["priority"],
    }) as BrandGuideline;
    _guidelines.push(g); return g;
  },
  assets(type?: string): BrandAsset[] {
    return type ? _brandAssets.filter(a => a.type === type) : [..._brandAssets];
  },
  guidelines(section?: string): BrandGuideline[] {
    return section ? _guidelines.filter(g => g.section === section) : [..._guidelines];
  },
  recordUsage(assetId: string): boolean {
    const a = _brandAssets.find(a => a.id === assetId);
    if (!a) return false;
    a.usageCount++; a.updatedAt = new Date().toISOString(); return true;
  },
  stats() {
    return {
      totalAssets: _brandAssets.length,
      totalGuidelines: _guidelines.length,
      byType: _brandAssets.reduce((acc, a) => { acc[a.type] = (acc[a.type] ?? 0) + 1; return acc; }, {} as Record<string, number>),
      totalUsage: _brandAssets.reduce((s, a) => s + a.usageCount, 0),
      sections: [...new Set(_guidelines.map(g => g.section))],
      engine: "Brand Vault Engine v1.0",
    };
  },
};

// ─── 9. Revenue Intelligence Engine ──────────────────────────────────────────

export interface RevenueSnapshot {
  id: string; date: string; channel: string;
  newCustomers: number; churned: number; mrr: number;
  arr: number; ltv: number; cac: number; arpu: number;
  churnRate: number; netRevRetention: number;
  createdAt: string; updatedAt: string;
}

export interface CustomerCohort {
  id: string; cohortMonth: string; size: number;
  retainedAt30: number; retainedAt60: number; retainedAt90: number;
  revenueAt30: number; revenueAt60: number; revenueAt90: number;
  createdAt: string; updatedAt: string;
}

const _snapshots: RevenueSnapshot[] = [];
const _cohorts: CustomerCohort[] = [];

export const revenueIntel = {
  snapshot(data: Partial<RevenueSnapshot>): RevenueSnapshot {
    const s = record({
      date: data.date ?? new Date().toISOString().split("T")[0],
      channel: data.channel ?? "all",
      newCustomers: data.newCustomers ?? 0,
      churned: data.churned ?? 0,
      mrr: data.mrr ?? 0,
      arr: data.arr ?? (data.mrr ?? 0) * 12,
      ltv: data.ltv ?? 0,
      cac: data.cac ?? 0,
      arpu: data.arpu ?? 0,
      churnRate: data.churnRate ?? 0,
      netRevRetention: data.netRevRetention ?? 100,
    }) as RevenueSnapshot;
    _snapshots.push(s); return s;
  },
  addCohort(data: Partial<CustomerCohort>): CustomerCohort {
    const c = record({
      cohortMonth: data.cohortMonth ?? new Date().toISOString().slice(0, 7),
      size: data.size ?? 0,
      retainedAt30: data.retainedAt30 ?? 0,
      retainedAt60: data.retainedAt60 ?? 0,
      retainedAt90: data.retainedAt90 ?? 0,
      revenueAt30: data.revenueAt30 ?? 0,
      revenueAt60: data.revenueAt60 ?? 0,
      revenueAt90: data.revenueAt90 ?? 0,
    }) as CustomerCohort;
    _cohorts.push(c); return c;
  },
  latestSnapshot(): RevenueSnapshot | null {
    return _snapshots.length ? _snapshots[_snapshots.length - 1] : null;
  },
  trend(days = 30): RevenueSnapshot[] {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    return _snapshots.filter(s => s.createdAt >= cutoff);
  },
  cohorts(): CustomerCohort[] { return [..._cohorts]; },
  stats() {
    const latest = _snapshots.length ? _snapshots[_snapshots.length - 1] : null;
    return {
      totalSnapshots: _snapshots.length,
      totalCohorts: _cohorts.length,
      latestMRR: latest?.mrr ?? 0,
      latestARR: latest?.arr ?? 0,
      latestLTV: latest?.ltv ?? 0,
      latestChurnRate: latest?.churnRate ?? 0,
      latestNRR: latest?.netRevRetention ?? 0,
      engine: "Revenue Intelligence Engine v1.0",
    };
  },
};

// ─── 10. AI Strategy Engine (GPT-4o powered) ─────────────────────────────────

export interface StrategyRequest {
  id: string; topic: string; context: string; industry: string;
  mode: "analyze" | "plan" | "compete" | "grow" | "pivot";
  output: string; tokensUsed: number; model: string;
  createdAt: string; updatedAt: string;
}

const _strategies: StrategyRequest[] = [];

export const aiStrategy = {
  record(data: Partial<StrategyRequest> & { output: string }): StrategyRequest {
    const s = record({
      topic: data.topic ?? "General Strategy",
      context: data.context ?? "",
      industry: data.industry ?? "General",
      mode: (data.mode ?? "analyze") as StrategyRequest["mode"],
      output: data.output,
      tokensUsed: data.tokensUsed ?? 0,
      model: data.model ?? "gpt-4o",
    }) as StrategyRequest;
    _strategies.push(s); return s;
  },
  list(): StrategyRequest[] { return [..._strategies].reverse(); },
  stats() {
    return {
      totalRequests: _strategies.length,
      totalTokens: _strategies.reduce((s, r) => s + r.tokensUsed, 0),
      byMode: _strategies.reduce((acc, r) => { acc[r.mode] = (acc[r.mode] ?? 0) + 1; return acc; }, {} as Record<string, number>),
      byIndustry: [...new Set(_strategies.map(s => s.industry))].length,
      engine: "AI Strategy Engine v1.0 (GPT-4o)",
    };
  },
};
