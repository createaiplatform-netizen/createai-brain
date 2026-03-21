/**
 * routes/ops.ts — Operations Hub
 * ───────────────────────────────
 * Cross-industry operational engine. 6 integrated subsystems:
 *   Tracker · Lead Pipeline · Appointments · Time Logger · Loyalty · Reviews
 *
 * All routes protected by adminAuth in app.ts.
 */

import { Router, type Request, type Response } from "express";
import { openai }          from "@workspace/integrations-openai-ai-server";
import { getPublicBaseUrl } from "../utils/publicUrl.js";
import {
  createTracker, getTrackers, getTrackerById, updateTrackerStatus,
  addTrackerItem, getTrackerItems, updateTrackerItemStatus,
  createLead, getLeads, updateLeadStage, updateLeadAiScore,
  createAppointment, getAppointments, updateAppointmentStatus,
  logTimeEntry, getTimeEntries, getTimeSummary,
  awardLoyaltyPoints, getLoyaltyLeaderboard, getLoyaltyBalance,
  submitReview, getReviews, updateReviewStatus, getApprovedReviews,
  saveAiGeneration,
} from "../lib/db.js";

const router = Router();
const BASE   = getPublicBaseUrl();

// ── Shared CSS ────────────────────────────────────────────────────────────────
const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#020617;--s1:#0d1526;--s2:#111827;--s3:#1e293b;--s4:#243044;
    --line:#1e293b;--line2:#2d3748;
    --t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;
    --ind:#6366f1;--em:#10b981;--am:#f59e0b;--re:#f87171;--bl:#38bdf8;
  }
  html,body{background:var(--bg);color:var(--t1);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;min-height:100vh;}
  a{color:inherit;text-decoration:none;}
  .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;}
  .hdr-inner{max-width:1200px;margin:0 auto;height:48px;display:flex;align-items:center;gap:14px;}
  .logo{font-size:1rem;font-weight:900;letter-spacing:-.03em;color:var(--t1);}
  .logo span{color:var(--ind);}
  .bc{font-size:.7rem;color:var(--t4);margin-left:6px;}
  .bc a{color:var(--t3);}
  .bc a:hover{color:var(--t1);}
  .nav-links{margin-left:auto;display:flex;gap:4px;}
  .nav-link{font-size:.7rem;font-weight:700;padding:5px 10px;border-radius:6px;color:var(--t3);transition:all .15s;}
  .nav-link:hover{background:var(--s3);color:var(--t1);}
  .nav-link.active{background:rgba(99,102,241,.15);color:var(--ind);}
  .wrap{max-width:1200px;margin:0 auto;padding:36px 24px;}
  h1{font-size:clamp(1.3rem,3vw,1.9rem);font-weight:900;letter-spacing:-.04em;margin-bottom:6px;}
  h1 em{color:#818cf8;font-style:normal;}
  h2{font-size:1.1rem;font-weight:800;letter-spacing:-.02em;margin-bottom:16px;}
  .sub{font-size:.82rem;color:var(--t3);margin-bottom:28px;}
  .grid{display:grid;gap:14px;}
  .grid-2{grid-template-columns:repeat(auto-fill,minmax(280px,1fr));}
  .grid-3{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));}
  .card{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px;transition:border-color .15s;}
  .card:hover{border-color:rgba(99,102,241,.35);}
  .card-icon{font-size:1.8rem;margin-bottom:8px;}
  .card-title{font-size:1rem;font-weight:800;}
  .card-desc{font-size:.75rem;color:var(--t2);line-height:1.5;margin-top:4px;}
  .card-count{font-size:1.6rem;font-weight:900;color:var(--ind);margin:8px 0 4px;}
  .card-label{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);}
  .btn{background:var(--ind);color:#fff;border:none;border-radius:9px;padding:10px 20px;font-size:.84rem;font-weight:800;cursor:pointer;transition:opacity .15s;display:inline-block;}
  .btn:hover{opacity:.85;}
  .btn:disabled{opacity:.4;cursor:not-allowed;}
  .btn-sm{padding:6px 14px;font-size:.75rem;}
  .btn-out{background:transparent;color:var(--t2);border:1px solid var(--line2);border-radius:8px;padding:8px 16px;font-size:.8rem;font-weight:700;cursor:pointer;transition:all .15s;}
  .btn-out:hover{border-color:var(--ind);color:var(--t1);}
  .btn-green{background:#059669;}
  .btn-red{background:#dc2626;}
  .btn-amber{background:#d97706;}
  .panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:24px;margin-bottom:20px;}
  .form-row{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;}
  .form-row label{font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);}
  input,textarea,select{background:var(--s1);border:1.5px solid var(--line);border-radius:8px;padding:9px 12px;color:var(--t1);font-size:.84rem;font-family:inherit;width:100%;outline:none;transition:border-color .15s;resize:vertical;}
  input:focus,textarea:focus,select:focus{border-color:var(--ind);}
  input::placeholder,textarea::placeholder{color:var(--t4);}
  .row{display:flex;gap:14px;align-items:flex-start;}
  .col{flex:1;min-width:0;}
  .table{width:100%;border-collapse:collapse;}
  .table th{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);text-align:left;padding:8px 12px;border-bottom:1px solid var(--line);}
  .table td{font-size:.8rem;padding:10px 12px;border-bottom:1px solid var(--s3);vertical-align:middle;}
  .table tr:last-child td{border-bottom:none;}
  .table tr:hover td{background:var(--s1);}
  .badge{display:inline-block;font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;padding:3px 8px;border-radius:99px;}
  .badge-green{background:rgba(16,185,129,.1);color:#34d399;border:1px solid rgba(16,185,129,.2);}
  .badge-amber{background:rgba(245,158,11,.1);color:#fcd34d;border:1px solid rgba(245,158,11,.2);}
  .badge-red{background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2);}
  .badge-blue{background:rgba(56,189,248,.1);color:#7dd3fc;border:1px solid rgba(56,189,248,.2);}
  .badge-gray{background:var(--s3);color:var(--t4);border:1px solid var(--line);}
  .badge-ind{background:rgba(99,102,241,.1);color:#a5b4fc;border:1px solid rgba(99,102,241,.2);}
  .status-bar{font-size:.72rem;padding:8px 12px;border-radius:7px;margin-bottom:14px;}
  .ok{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);color:var(--em);}
  .err-bar{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);color:var(--re);}
  .output-box{background:var(--s1);border:1px solid var(--line);border-radius:10px;padding:16px;font-size:.8rem;line-height:1.7;color:var(--t2);white-space:pre-wrap;word-break:break-word;min-height:80px;}
  .stat-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px;}
  .stat{background:var(--s2);border:1px solid var(--line);border-radius:12px;padding:18px 22px;flex:1;min-width:130px;}
  .stat-val{font-size:1.5rem;font-weight:900;color:var(--ind);}
  .stat-lbl{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);margin-top:2px;}
  .tab-nav{display:flex;gap:4px;margin-bottom:20px;flex-wrap:wrap;}
  .tab{padding:7px 14px;font-size:.75rem;font-weight:700;border-radius:8px;cursor:pointer;border:1px solid var(--line);color:var(--t3);background:transparent;transition:all .15s;}
  .tab.active{background:rgba(99,102,241,.15);color:var(--ind);border-color:rgba(99,102,241,.3);}
  .tab:hover:not(.active){border-color:var(--line2);color:var(--t1);}
  .empty{text-align:center;padding:40px;color:var(--t4);font-size:.82rem;}
  .progress{background:var(--s3);border-radius:99px;height:6px;overflow:hidden;}
  .progress-bar{height:100%;background:var(--ind);border-radius:99px;transition:width .3s;}
  @media(max-width:640px){.row{flex-direction:column;}.stat-row{flex-direction:column;}}
`;

function header(title: string, bc: string, active: string): string {
  const links = [
    { href: "/ops", label: "Hub" },
    { href: "/ops/tracker", label: "Tracker" },
    { href: "/ops/leads", label: "Leads" },
    { href: "/ops/appointments", label: "Bookings" },
    { href: "/ops/time", label: "Time" },
    { href: "/ops/loyalty", label: "Loyalty" },
    { href: "/ops/reviews", label: "Reviews" },
  ];
  const nav = links.map(l =>
    '<a class="nav-link' + (l.label === active ? " active" : "") + '" href="' + BASE + l.href + '">' + l.label + "</a>"
  ).join("");
  return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>" + title + " — Ops Hub</title>\n<style>" + CSS + "</style>\n</head>\n<body>\n<header class=\"hdr\">\n<div class=\"hdr-inner\">\n<a class=\"logo\" href=\"" + BASE + "\">Create<span>AI</span> Brain</a>\n<span class=\"bc\">/ <a href=\"" + BASE + "/ops\">Ops</a>" + (bc ? " / " + bc : "") + "</span>\n<nav class=\"nav-links\">" + nav + "</nav>\n</div>\n</header>\n<div class=\"wrap\">";
}

function badgeFor(status: string): string {
  const map: Record<string, string> = {
    active: "badge-green", open: "badge-green", confirmed: "badge-green", approved: "badge-green",
    pending: "badge-amber", new: "badge-amber", contacted: "badge-amber",
    "on-hold": "badge-amber", qualified: "badge-blue", proposal: "badge-ind",
    completed: "badge-gray", closed: "badge-gray", done: "badge-gray",
    won: "badge-green", lost: "badge-red", rejected: "badge-red",
    negotiation: "badge-ind", cancelled: "badge-red",
    high: "badge-red", medium: "badge-amber", low: "badge-blue",
  };
  const cls = map[status] ?? "badge-gray";
  return "<span class=\"badge " + cls + "\">" + status + "</span>";
}

// ── GET /ops — Hub ────────────────────────────────────────────────────────────

router.get("/", async (_req: Request, res: Response) => {
  let trackerCount = 0, leadCount = 0, aptCount = 0, reviewCount = 0;
  try {
    const [trackers, leads, apts, reviews] = await Promise.all([
      getTrackers(), getLeads(), getAppointments("pending"), getReviews("pending"),
    ]);
    trackerCount = trackers.length;
    leadCount    = leads.length;
    aptCount     = apts.length;
    reviewCount  = reviews.length;
  } catch { /* ignore */ }

  const hubs = [
    { href: "/ops/tracker",      icon: "🗂", name: "Universal Tracker",    desc: "Projects · Cases · Matters · Work Orders · Permits · Grants — any domain, one engine.", count: trackerCount, label: "active trackers" },
    { href: "/ops/leads",        icon: "💼", name: "Lead Pipeline",         desc: "CRM-grade pipeline with stages, AI scoring, and follow-up management.", count: leadCount, label: "total leads" },
    { href: "/ops/appointments", icon: "📅", name: "Booking System",        desc: "Appointment management. Accept public bookings. Confirm, reschedule, or cancel.", count: aptCount, label: "pending bookings" },
    { href: "/ops/time",         icon: "⏱", name: "Time Logger & Billing", desc: "Log billable hours, set rates per project, generate AI invoices instantly.", count: 0, label: "time entries" },
    { href: "/ops/loyalty",      icon: "⭐", name: "Loyalty Engine",        desc: "Award and track points. View leaderboard. Auto-awards on purchase.", count: 0, label: "point transactions" },
    { href: "/ops/reviews",      icon: "⭐", name: "Review Manager",        desc: "Approve, reject, and respond to product reviews. Published reviews display on store.", count: reviewCount, label: "pending reviews" },
  ];

  const cards = hubs.map(h =>
    "<a href=\"" + BASE + h.href + "\" class=\"card\" style=\"display:block;\">" +
    "<div class=\"card-icon\">" + h.icon + "</div>" +
    "<div class=\"card-title\">" + h.name + "</div>" +
    "<div class=\"card-desc\">" + h.desc + "</div>" +
    "<div class=\"card-count\">" + h.count + "</div>" +
    "<div class=\"card-label\">" + h.label + "</div>" +
    "</a>"
  ).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("Operations Hub", "", "Hub") + `
    <h1><em>Operations Hub</em></h1>
    <p class="sub">Cross-industry operational infrastructure. 6 integrated engines powering every vertical.</p>
    <div class="grid grid-2">` + cards + `</div>
    <div style="margin-top:32px;padding:20px;background:var(--s2);border:1px solid var(--line);border-radius:12px;">
      <div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Quick Links</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="` + BASE + `/portal/book" class="btn btn-out btn-sm">Public Booking Page →</a>
        <a href="` + BASE + `/portal/donor" class="btn btn-out btn-sm">Donor Portal →</a>
        <a href="` + BASE + `/portal/client" class="btn btn-out btn-sm">Client Portal →</a>
        <a href="` + BASE + `/portal/student" class="btn btn-out btn-sm">Student Portal →</a>
        <a href="` + BASE + `/studio/grants" class="btn btn-out btn-sm">AI Grant Writer →</a>
        <a href="` + BASE + `/studio/sequences" class="btn btn-out btn-sm">Email Sequences →</a>
        <a href="` + BASE + `/studio/compliance" class="btn btn-out btn-sm">Compliance Docs →</a>
        <a href="` + BASE + `/studio/industry" class="btn btn-out btn-sm">Industry Analytics →</a>
      </div>
    </div>
  </div></body></html>`);
});

// ── TRACKER SYSTEM ─────────────────────────────────────────────────────────────

router.get("/tracker", async (req: Request, res: Response) => {
  const typeFilter = String(req.query["type"] ?? "");
  let trackers: Array<Record<string, unknown>> = [];
  try { trackers = await getTrackers(typeFilter || undefined); } catch { /* ignore */ }

  const types = ["project", "case", "matter", "work-order", "permit", "grant", "campaign", "deal", "shipment", "policy"];
  const typeTabs = types.map(t =>
    "<button class=\"tab" + (typeFilter === t ? " active" : "") + "\" onclick=\"filterType('" + t + "')\">" + t + "</button>"
  ).join("");

  const rows = trackers.length === 0
    ? "<tr><td colspan=\"6\" class=\"empty\">No trackers yet. Create your first one.</td></tr>"
    : trackers.map(t =>
        "<tr>" +
        "<td><a href=\"" + BASE + "/ops/tracker/" + String(t["id"]) + "\" style=\"color:var(--ind);font-weight:700;\">" + String(t["title"] ?? "") + "</a></td>" +
        "<td><span class=\"badge badge-blue\">" + String(t["type"] ?? "") + "</span></td>" +
        "<td>" + badgeFor(String(t["status"] ?? "active")) + "</td>" +
        "<td>" + badgeFor(String(t["priority"] ?? "medium")) + "</td>" +
        "<td style=\"color:var(--t3);font-size:.75rem;\">" + (t["due_date"] ? String(t["due_date"]).slice(0, 10) : "—") + "</td>" +
        "<td style=\"color:var(--t3);font-size:.75rem;\">" + String(t["owner_email"] ?? "").slice(0, 28) + "</td>" +
        "</tr>"
      ).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("Tracker", "Tracker", "Tracker") + `
    <div class="row" style="align-items:center;margin-bottom:20px;">
      <div><h1>🗂 <em>Universal Tracker</em></h1><p class="sub" style="margin:0;">Track anything across any industry. ` + trackers.length + ` total.</p></div>
      <div style="margin-left:auto;"><button class="btn btn-sm" onclick="openCreate()">+ New Tracker</button></div>
    </div>

    <div id="create-panel" class="panel" style="display:none;margin-bottom:20px;">
      <h2>Create New Tracker</h2>
      <div id="create-status" style="display:none;" class="status-bar"></div>
      <div class="row">
        <div class="col">
          <div class="form-row"><label>Title</label><input id="c-title" placeholder="e.g. Q2 Product Launch, Smith v. Jones, ISO 9001 Audit..."></div>
          <div class="form-row"><label>Type</label>
            <select id="c-type">
              <option value="project">Project</option><option value="case">Case (Legal/Insurance)</option>
              <option value="matter">Matter (Legal)</option><option value="work-order">Work Order</option>
              <option value="permit">Permit Application</option><option value="grant">Grant</option>
              <option value="campaign">Marketing Campaign</option><option value="deal">Sales Deal</option>
              <option value="shipment">Shipment</option><option value="policy">Policy (Insurance/Gov)</option>
            </select>
          </div>
          <div class="form-row"><label>Priority</label>
            <select id="c-priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select>
          </div>
        </div>
        <div class="col">
          <div class="form-row"><label>Description</label><textarea id="c-desc" rows="3" placeholder="Brief description of this tracker..."></textarea></div>
          <div class="form-row"><label>Owner Email</label><input id="c-email" type="email" placeholder="you@example.com"></div>
          <div class="form-row"><label>Due Date (optional)</label><input id="c-due" type="date"></div>
        </div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn" onclick="createTracker()">Create Tracker</button>
        <button class="btn-out" onclick="closeCreate()">Cancel</button>
      </div>
    </div>

    <div class="tab-nav">
      <button class="tab` + (!typeFilter ? " active" : "") + `" onclick="filterType('')">All</button>
      ` + typeTabs + `
    </div>

    <div class="panel" style="padding:0;overflow:hidden;">
      <table class="table">
        <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Priority</th><th>Due</th><th>Owner</th></tr></thead>
        <tbody>` + rows + `</tbody>
      </table>
    </div>

    <script>
    function openCreate(){document.getElementById('create-panel').style.display='';}
    function closeCreate(){document.getElementById('create-panel').style.display='none';}
    function filterType(t){window.location.href='` + BASE + `/ops/tracker'+(t?'?type='+t:'');}
    async function createTracker(){
      var title=document.getElementById('c-title').value.trim();
      var type=document.getElementById('c-type').value;
      var priority=document.getElementById('c-priority').value;
      var desc=document.getElementById('c-desc').value.trim();
      var email=document.getElementById('c-email').value.trim();
      var due=document.getElementById('c-due').value;
      if(!title){showCS('Title is required.',false);return;}
      var btn=document.querySelector('#create-panel .btn');btn.disabled=true;btn.textContent='Creating...';
      try{
        var r=await fetch('` + BASE + `/ops/tracker',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,type,priority,description:desc,ownerEmail:email,dueDate:due})});
        var d=await r.json();
        if(d.ok){window.location.href='` + BASE + `/ops/tracker/'+d.id;}
        else{showCS('Error: '+d.error,false);}
      }catch(e){showCS('Network error.',false);}
      finally{btn.disabled=false;btn.textContent='Create Tracker';}
    }
    function showCS(msg,ok){var b=document.getElementById('create-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg;}
    </script>
  </div></body></html>`);
});

router.post("/tracker", async (req: Request, res: Response) => {
  try {
    const { title, type, priority, description, ownerEmail, dueDate } = req.body as {
      title?: string; type?: string; priority?: string; description?: string; ownerEmail?: string; dueDate?: string;
    };
    if (!title) { res.status(400).json({ ok: false, error: "title required" }); return; }
    const id = await createTracker(type ?? "project", title, description ?? "", ownerEmail ?? "", priority ?? "medium", dueDate || undefined);
    res.json({ ok: true, id });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

router.get("/tracker/:id", async (req: Request, res: Response) => {
  try {
    const tid = String(req.params["id"] ?? "");
    const [tracker, items] = await Promise.all([getTrackerById(tid), getTrackerItems(tid)]);
    if (!tracker) { res.status(404).send("Tracker not found"); return; }

    const itemRows = items.length === 0
      ? "<tr><td colspan=\"5\" class=\"empty\">No items yet. Add your first task or milestone.</td></tr>"
      : items.map(i =>
          "<tr id=\"item-" + String(i["id"]) + "\">" +
          "<td style=\"font-weight:" + (String(i["status"]) === "done" ? "400;text-decoration:line-through;color:var(--t4)" : "600") + "\">" + String(i["title"] ?? "") + "</td>" +
          "<td style=\"font-size:.75rem;color:var(--t3);\">" + (String(i["assignee"] ?? "") || "—") + "</td>" +
          "<td>" + badgeFor(String(i["status"] ?? "open")) + "</td>" +
          "<td style=\"font-size:.75rem;color:var(--t3);\">" + (i["due_date"] ? String(i["due_date"]).slice(0, 10) : "—") + "</td>" +
          "<td style=\"display:flex;gap:6px;\">" +
          "<button class=\"btn btn-sm btn-green\" onclick=\"setItemStatus('" + String(i["id"]) + "','done')\">Done</button>" +
          "<button class=\"btn btn-sm\" style=\"background:var(--s3);\" onclick=\"setItemStatus('" + String(i["id"]) + "','in-progress')\">In Progress</button>" +
          "</td></tr>"
        ).join("");

    const doneCount = items.filter(i => String(i["status"]) === "done").length;
    const pct = items.length ? Math.round(doneCount / items.length * 100) : 0;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(header(String(tracker["title"]), "Tracker / Detail", "Tracker") + `
      <div style="margin-bottom:20px;">
        <a href="` + BASE + `/ops/tracker" style="color:var(--t3);font-size:.8rem;">← All Trackers</a>
      </div>
      <div class="row" style="align-items:flex-start;margin-bottom:24px;">
        <div class="col">
          <h1><em>` + String(tracker["title"]) + `</em></h1>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
            <span class="badge badge-blue">` + String(tracker["type"] ?? "") + `</span>
            ` + badgeFor(String(tracker["status"] ?? "active")) + `
            ` + badgeFor(String(tracker["priority"] ?? "medium")) + `
            ` + (tracker["due_date"] ? `<span class="badge badge-amber">Due: ` + String(tracker["due_date"]).slice(0, 10) + `</span>` : "") + `
          </div>
          <p style="font-size:.82rem;color:var(--t3);margin-top:10px;">` + (String(tracker["description"] ?? "") || "No description.") + `</p>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;">
          <button class="btn btn-sm btn-amber" onclick="updateStatus('on-hold')">Hold</button>
          <button class="btn btn-sm btn-green" onclick="updateStatus('completed')">Complete</button>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat"><div class="stat-val">` + items.length + `</div><div class="stat-lbl">Total Items</div></div>
        <div class="stat"><div class="stat-val">` + doneCount + `</div><div class="stat-lbl">Completed</div></div>
        <div class="stat"><div class="stat-val">` + pct + `%</div><div class="stat-lbl">Progress</div></div>
      </div>
      <div class="progress" style="margin-bottom:24px;"><div class="progress-bar" style="width:` + pct + `%;"></div></div>

      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="margin:0;">Items / Tasks</h2>
          <button class="btn btn-sm" onclick="toggleAdd()">+ Add Item</button>
        </div>
        <div id="add-item-form" style="display:none;background:var(--s1);padding:16px;border-radius:10px;margin-bottom:14px;">
          <div id="ai-status" style="display:none;" class="status-bar"></div>
          <div class="row">
            <div class="col"><div class="form-row"><label>Item Title</label><input id="i-title" placeholder="Task, milestone, or deliverable name"></div></div>
            <div class="col"><div class="form-row"><label>Assignee</label><input id="i-assignee" placeholder="Name or email"></div></div>
            <div class="col"><div class="form-row"><label>Due Date</label><input id="i-due" type="date"></div></div>
          </div>
          <div class="form-row"><label>Description / Notes</label><textarea id="i-desc" rows="2" placeholder="Optional details..."></textarea></div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm" onclick="addItem()">Add Item</button>
            <button class="btn-out btn-sm" onclick="aiSuggestItems()">✦ AI Suggest Items</button>
            <button class="btn-out btn-sm" onclick="toggleAdd()">Cancel</button>
          </div>
        </div>
        <table class="table">
          <thead><tr><th>Title</th><th>Assignee</th><th>Status</th><th>Due</th><th>Actions</th></tr></thead>
          <tbody id="items-tbody">` + itemRows + `</tbody>
        </table>
      </div>

      <script>
      var TRACKER_ID = '` + String(tracker["id"]) + `';
      var TRACKER_TITLE = '` + String(tracker["title"]).replace(/'/g, "\\'") + `';
      var TRACKER_TYPE = '` + String(tracker["type"] ?? "project") + `';
      function toggleAdd(){var f=document.getElementById('add-item-form');f.style.display=f.style.display===''?'none':'';}
      async function addItem(){
        var title=document.getElementById('i-title').value.trim();
        var assignee=document.getElementById('i-assignee').value.trim();
        var due=document.getElementById('i-due').value;
        var desc=document.getElementById('i-desc').value.trim();
        if(!title){showAIS('Item title required.',false);return;}
        try{
          var r=await fetch('` + BASE + `/ops/tracker/'+TRACKER_ID+'/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,assignee,dueDate:due,description:desc})});
          var d=await r.json();
          if(d.ok){location.reload();}else{showAIS('Error: '+d.error,false);}
        }catch(e){showAIS('Network error.',false);}
      }
      async function setItemStatus(itemId,status){
        await fetch('` + BASE + `/ops/tracker/'+TRACKER_ID+'/items/'+itemId+'/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
        location.reload();
      }
      async function updateStatus(status){
        await fetch('` + BASE + `/ops/tracker/'+TRACKER_ID+'/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
        location.reload();
      }
      async function aiSuggestItems(){
        showAIS('GPT-4o is generating suggested items for this '+TRACKER_TYPE+'...', null);
        try{
          var r=await fetch('` + BASE + `/ops/tracker/ai-suggest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:TRACKER_TITLE,type:TRACKER_TYPE})});
          var d=await r.json();
          if(d.ok && d.items && d.items.length){
            document.getElementById('i-title').value=d.items[0];
            showAIS('Suggested: '+d.items.join(' | '),true);
          }else{showAIS('Could not generate suggestions.',false);}
        }catch(e){showAIS('Network error.',false);}
      }
      function showAIS(msg,ok){var b=document.getElementById('ai-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg;}
      </script>
    </div></body></html>`);
  } catch (e: unknown) {
    res.status(500).send("Error: " + (e instanceof Error ? e.message : String(e)));
  }
});

router.post("/tracker/:id/items", async (req: Request, res: Response) => {
  try {
    const tid = String(req.params["id"] ?? "");
    const { title, description, assignee, dueDate } = req.body as { title?: string; description?: string; assignee?: string; dueDate?: string };
    if (!title) { res.status(400).json({ ok: false, error: "title required" }); return; }
    const id = await addTrackerItem(tid, title, description ?? "", assignee ?? "", dueDate || undefined);
    res.json({ ok: true, id });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

router.post("/tracker/:id/items/:itemId/status", async (req: Request, res: Response) => {
  try {
    const itemId = String(req.params["itemId"] ?? "");
    const { status } = req.body as { status?: string };
    await updateTrackerItemStatus(itemId, status ?? "open");
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

router.post("/tracker/:id/status", async (req: Request, res: Response) => {
  try {
    const id = String(req.params["id"] ?? "");
    const { status } = req.body as { status?: string };
    await updateTrackerStatus(id, status ?? "active");
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

router.post("/tracker/ai-suggest", async (req: Request, res: Response) => {
  try {
    const { title, type } = req.body as { title?: string; type?: string };
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: "You are a project management expert. Respond with ONLY a JSON array of 7 concise task/milestone titles for the given tracker. No explanation. Just the array."
      }, {
        role: "user",
        content: "Generate 7 task/milestone titles for a " + (type ?? "project") + " tracker titled: \"" + (title ?? "") + "\". Return only a JSON array of strings."
      }],
      max_tokens: 400,
      temperature: 0.5,
    });
    const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";
    const items = JSON.parse(raw.replace(/```json|```/g, "").trim()) as string[];
    await saveAiGeneration("tracker-suggest", { title, type }, raw, completion.usage?.total_tokens ?? 0);
    res.json({ ok: true, items });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// ── LEAD PIPELINE ─────────────────────────────────────────────────────────────

router.get("/leads", async (_req: Request, res: Response) => {
  let leads: Array<Record<string, unknown>> = [];
  try { leads = await getLeads(); } catch { /* ignore */ }

  const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
  const stageColors: Record<string, string> = {
    new: "badge-amber", contacted: "badge-blue", qualified: "badge-ind",
    proposal: "badge-ind", negotiation: "badge-amber", won: "badge-green", lost: "badge-red",
  };

  const totalValue = leads.filter(l => String(l["stage"]) !== "lost").reduce((s, l) => s + Number(l["value_cents"] ?? 0), 0);
  const wonValue   = leads.filter(l => String(l["stage"]) === "won").reduce((s, l) => s + Number(l["value_cents"] ?? 0), 0);

  const rows = leads.length === 0
    ? "<tr><td colspan=\"7\" class=\"empty\">No leads yet. Add your first one.</td></tr>"
    : leads.map(l => {
        const stg = String(l["stage"] ?? "new");
        const sc  = stageColors[stg] ?? "badge-gray";
        const score = l["ai_score"] ? Number(l["ai_score"]) : null;
        const scoreHtml = score !== null
          ? "<span style=\"font-weight:900;color:" + (score >= 70 ? "var(--em)" : score >= 40 ? "var(--am)" : "var(--re)") + ";\">" + score + "</span>"
          : "<button class=\"btn btn-sm\" style=\"font-size:.62rem;padding:3px 8px;\" onclick=\"scoreLead('" + String(l["id"]) + "')\">Score</button>";
        return "<tr>" +
          "<td style=\"font-weight:700;\">" + String(l["name"] ?? "") + "</td>" +
          "<td style=\"font-size:.75rem;color:var(--t3);\">" + (String(l["company"] ?? "") || "—") + "</td>" +
          "<td><span class=\"badge " + sc + "\">" + stg + "</span></td>" +
          "<td style=\"font-size:.75rem;\">" + (Number(l["value_cents"] ?? 0) > 0 ? "$" + (Number(l["value_cents"]) / 100).toLocaleString() : "—") + "</td>" +
          "<td>" + scoreHtml + "</td>" +
          "<td style=\"font-size:.75rem;color:var(--t3);\">" + (l["follow_up_date"] ? String(l["follow_up_date"]).slice(0, 10) : "—") + "</td>" +
          "<td><select onchange=\"moveStage('" + String(l["id"]) + "',this.value)\" style=\"width:auto;padding:4px 8px;font-size:.72rem;\">" +
          stages.map(s => "<option value=\"" + s + "\"" + (s === stg ? " selected" : "") + ">" + s + "</option>").join("") +
          "</select></td>" +
          "</tr>";
      }).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("Lead Pipeline", "Leads", "Leads") + `
    <div class="row" style="align-items:center;margin-bottom:20px;">
      <div><h1>💼 <em>Lead Pipeline</em></h1><p class="sub" style="margin:0;">` + leads.length + ` leads tracked.</p></div>
      <div style="margin-left:auto;"><button class="btn btn-sm" onclick="openAdd()">+ New Lead</button></div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-val">` + leads.length + `</div><div class="stat-lbl">Total Leads</div></div>
      <div class="stat"><div class="stat-val">$` + (totalValue / 100).toLocaleString() + `</div><div class="stat-lbl">Pipeline Value</div></div>
      <div class="stat"><div class="stat-val">$` + (wonValue / 100).toLocaleString() + `</div><div class="stat-lbl">Won Revenue</div></div>
      <div class="stat"><div class="stat-val">` + leads.filter(l => String(l["stage"]) === "won").length + `</div><div class="stat-lbl">Won Deals</div></div>
    </div>

    <div id="add-panel" class="panel" style="display:none;margin-bottom:20px;">
      <h2>Add New Lead</h2>
      <div id="add-status" class="status-bar" style="display:none;"></div>
      <div class="row">
        <div class="col">
          <div class="form-row"><label>Name</label><input id="l-name" placeholder="Full name"></div>
          <div class="form-row"><label>Email</label><input id="l-email" type="email" placeholder="email@company.com"></div>
          <div class="form-row"><label>Phone</label><input id="l-phone" placeholder="+1 555 000 0000"></div>
        </div>
        <div class="col">
          <div class="form-row"><label>Company</label><input id="l-company" placeholder="Company name"></div>
          <div class="form-row"><label>Source</label>
            <select id="l-source"><option value="manual">Manual</option><option value="website">Website</option><option value="referral">Referral</option><option value="social">Social</option><option value="email">Email Campaign</option><option value="cold-outreach">Cold Outreach</option></select>
          </div>
          <div class="form-row"><label>Deal Value ($)</label><input id="l-value" type="number" placeholder="0" min="0"></div>
        </div>
        <div class="col">
          <div class="form-row"><label>Follow-up Date</label><input id="l-follow" type="date"></div>
          <div class="form-row"><label>Notes</label><textarea id="l-notes" rows="3" placeholder="Key details, pain points, context..."></textarea></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn" onclick="addLead()">Add Lead</button>
        <button class="btn-out" onclick="closeAdd()">Cancel</button>
      </div>
    </div>

    <div class="panel" style="padding:0;overflow:auto;">
      <table class="table">
        <thead><tr><th>Name</th><th>Company</th><th>Stage</th><th>Value</th><th>AI Score</th><th>Follow-up</th><th>Move Stage</th></tr></thead>
        <tbody>` + rows + `</tbody>
      </table>
    </div>

    <script>
    function openAdd(){document.getElementById('add-panel').style.display='';}
    function closeAdd(){document.getElementById('add-panel').style.display='none';}
    async function addLead(){
      var n=document.getElementById('l-name').value.trim();
      if(!n){showAS('Name required.',false);return;}
      var payload={name:n,email:document.getElementById('l-email').value.trim(),phone:document.getElementById('l-phone').value.trim(),company:document.getElementById('l-company').value.trim(),source:document.getElementById('l-source').value,valueCents:Math.round(parseFloat(document.getElementById('l-value').value||'0')*100),followUpDate:document.getElementById('l-follow').value,notes:document.getElementById('l-notes').value.trim()};
      try{var r=await fetch('` + BASE + `/ops/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});var d=await r.json();if(d.ok){location.reload();}else{showAS('Error: '+d.error,false);}}catch(e){showAS('Network error.',false);}
    }
    async function moveStage(id,stage){
      await fetch('` + BASE + `/ops/leads/'+id+'/stage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stage})});
    }
    async function scoreLead(id){
      var btn=event.target;btn.textContent='...';btn.disabled=true;
      try{var r=await fetch('` + BASE + `/ops/leads/'+id+'/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});var d=await r.json();if(d.ok){location.reload();}}catch(e){}finally{btn.disabled=false;}
    }
    function showAS(msg,ok){var b=document.getElementById('add-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg;}
    </script>
  </div></body></html>`);
});

router.post("/leads", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, source, valueCents, notes, followUpDate } = req.body as {
      name?: string; email?: string; phone?: string; company?: string; source?: string;
      valueCents?: number; notes?: string; followUpDate?: string;
    };
    if (!name) { res.status(400).json({ ok: false, error: "name required" }); return; }
    const id = await createLead({ name, email: email ?? "", phone: phone ?? "", company: company ?? "", source: source ?? "manual", valueCents: valueCents ?? 0, notes: notes ?? "", followUpDate: followUpDate || undefined });
    res.json({ ok: true, id });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

router.post("/leads/:id/stage", async (req: Request, res: Response) => {
  try {
    const id = String(req.params["id"] ?? "");
    const { stage } = req.body as { stage?: string };
    await updateLeadStage(id, stage ?? "new");
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

router.post("/leads/:id/score", async (req: Request, res: Response) => {
  try {
    const id = String(req.params["id"] ?? "");
    const leads = await getLeads();
    const lead = leads.find(l => String(l["id"]) === id);
    if (!lead) { res.status(404).json({ ok: false, error: "Lead not found" }); return; }

    const prompt = "Score this sales lead from 0-100 (100 = highest priority). Return JSON only: {\"score\": number, \"summary\": \"one sentence reason\"}\n\nLead: " +
      JSON.stringify({ name: lead["name"], company: lead["company"], source: lead["source"], stage: lead["stage"], value_cents: lead["value_cents"], notes: lead["notes"] });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    });
    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as { score?: number; summary?: string };
    await updateLeadAiScore(id, parsed.score ?? 50, parsed.summary ?? "");
    res.json({ ok: true, score: parsed.score, summary: parsed.summary });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// ── APPOINTMENTS ──────────────────────────────────────────────────────────────

router.get("/appointments", async (_req: Request, res: Response) => {
  let apts: Array<Record<string, unknown>> = [];
  try { apts = await getAppointments(); } catch { /* ignore */ }

  const pending   = apts.filter(a => String(a["status"]) === "pending").length;
  const confirmed = apts.filter(a => String(a["status"]) === "confirmed").length;

  const rows = apts.length === 0
    ? "<tr><td colspan=\"7\" class=\"empty\">No appointments yet. Share your booking page to receive requests.</td></tr>"
    : apts.map(a =>
        "<tr>" +
        "<td style=\"font-weight:700;\">" + String(a["name"] ?? "") + "</td>" +
        "<td style=\"font-size:.75rem;\">" + String(a["email"] ?? "") + "</td>" +
        "<td><span class=\"badge badge-blue\">" + String(a["type"] ?? "") + "</span></td>" +
        "<td style=\"font-size:.75rem;color:var(--t3);\">" + (String(a["preferred_date"] ?? "")).slice(0, 30) + "</td>" +
        "<td>" + badgeFor(String(a["status"] ?? "pending")) + "</td>" +
        "<td style=\"font-size:.75rem;color:var(--t3);max-width:160px;overflow:hidden;text-overflow:ellipsis;\">" + (String(a["notes"] ?? "")).slice(0, 60) + "</td>" +
        "<td style=\"display:flex;gap:6px;\">" +
        (String(a["status"]) !== "confirmed" ? "<button class=\"btn btn-sm btn-green\" onclick=\"setApt('" + String(a["id"]) + "','confirmed')\">Confirm</button>" : "") +
        "<button class=\"btn btn-sm btn-red\" onclick=\"setApt('" + String(a["id"]) + "','cancelled')\">Cancel</button>" +
        "</td>" +
        "</tr>"
      ).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("Bookings", "Appointments", "Bookings") + `
    <div class="row" style="align-items:center;margin-bottom:20px;">
      <div><h1>📅 <em>Booking System</em></h1><p class="sub" style="margin:0;">` + apts.length + ` total appointments.</p></div>
      <div style="margin-left:auto;"><a href="` + BASE + `/portal/book" class="btn btn-sm" target="_blank">Public Booking Page →</a></div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-val">` + apts.length + `</div><div class="stat-lbl">Total</div></div>
      <div class="stat"><div class="stat-val">` + pending + `</div><div class="stat-lbl">Pending</div></div>
      <div class="stat"><div class="stat-val">` + confirmed + `</div><div class="stat-lbl">Confirmed</div></div>
    </div>
    <div class="panel" style="padding:0;overflow:auto;">
      <table class="table">
        <thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Preferred Date</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
        <tbody>` + rows + `</tbody>
      </table>
    </div>
    <script>
    async function setApt(id,status){
      await fetch('` + BASE + `/ops/appointments/'+id+'/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
      location.reload();
    }
    </script>
  </div></body></html>`);
});

router.post("/appointments/:id/status", async (req: Request, res: Response) => {
  try {
    const id = String(req.params["id"] ?? "");
    const { status } = req.body as { status?: string };
    await updateAppointmentStatus(id, status ?? "pending");
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// ── TIME LOGGER ───────────────────────────────────────────────────────────────

router.get("/time", async (_req: Request, res: Response) => {
  let entries: Array<Record<string, unknown>> = [];
  let summary = { totalHours: 0, billableHours: 0, totalValueCents: 0 };
  try {
    [entries, summary] = await Promise.all([getTimeEntries(), getTimeSummary()]);
  } catch { /* ignore */ }

  const rows = entries.length === 0
    ? "<tr><td colspan=\"7\" class=\"empty\">No time logged yet.</td></tr>"
    : entries.slice(0, 50).map(e =>
        "<tr>" +
        "<td style=\"font-size:.75rem;\">" + String(e["work_date"] ?? "").slice(0, 10) + "</td>" +
        "<td style=\"font-weight:600;\">" + String(e["project"] ?? "") + "</td>" +
        "<td style=\"font-size:.75rem;color:var(--t3);\">" + String(e["client_name"] ?? "").slice(0, 20) + "</td>" +
        "<td style=\"font-size:.75rem;\">" + String(e["description"] ?? "").slice(0, 40) + "</td>" +
        "<td style=\"font-weight:700;\">" + Number(e["hours_decimal"] ?? 0).toFixed(2) + "h</td>" +
        "<td style=\"font-size:.75rem;\">" + (Number(e["rate_cents"] ?? 0) > 0 ? "$" + (Number(e["rate_cents"]) / 100).toFixed(0) + "/hr" : "—") + "</td>" +
        "<td>" + (e["billable"] ? "<span class=\"badge badge-green\">Billable</span>" : "<span class=\"badge badge-gray\">Non-bill</span>") + "</td>" +
        "</tr>"
      ).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("Time Logger", "Time", "Time") + `
    <div class="row" style="align-items:center;margin-bottom:20px;">
      <div><h1>⏱ <em>Time Logger & Billing</em></h1><p class="sub" style="margin:0;">Log hours, set rates, generate AI invoices.</p></div>
      <div style="margin-left:auto;display:flex;gap:8px;">
        <button class="btn btn-sm" onclick="openLog()">+ Log Time</button>
        <button class="btn-out btn-sm" onclick="genInvoice()">✦ Generate Invoice</button>
      </div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-val">` + summary.totalHours.toFixed(1) + `h</div><div class="stat-lbl">Total Hours</div></div>
      <div class="stat"><div class="stat-val">` + summary.billableHours.toFixed(1) + `h</div><div class="stat-lbl">Billable Hours</div></div>
      <div class="stat"><div class="stat-val">$` + (summary.totalValueCents / 100).toLocaleString() + `</div><div class="stat-lbl">Billable Value</div></div>
    </div>

    <div id="log-panel" class="panel" style="display:none;margin-bottom:20px;">
      <h2>Log Time Entry</h2>
      <div id="log-status" class="status-bar" style="display:none;"></div>
      <div class="row">
        <div class="col">
          <div class="form-row"><label>Date</label><input id="t-date" type="date"></div>
          <div class="form-row"><label>Project</label><input id="t-project" placeholder="Project or matter name"></div>
          <div class="form-row"><label>Client Name</label><input id="t-client" placeholder="Client or organization"></div>
        </div>
        <div class="col">
          <div class="form-row"><label>Description</label><textarea id="t-desc" rows="3" placeholder="What did you work on?"></textarea></div>
          <div class="form-row"><label>Hours</label><input id="t-hours" type="number" step="0.25" min="0" placeholder="1.5"></div>
          <div class="form-row"><label>Hourly Rate ($)</label><input id="t-rate" type="number" min="0" placeholder="150"></div>
        </div>
        <div class="col">
          <div class="form-row"><label>Your Email</label><input id="t-email" type="email" placeholder="you@example.com"></div>
          <div class="form-row"><label>Billable?</label><select id="t-bill"><option value="true" selected>Yes — billable</option><option value="false">No — internal</option></select></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn" onclick="logTime()">Log Entry</button>
        <button class="btn-out" onclick="closeLog()">Cancel</button>
      </div>
    </div>

    <div id="invoice-panel" class="panel" style="display:none;margin-bottom:20px;">
      <h2>AI Invoice Generator</h2>
      <div id="inv-status" class="status-bar" style="display:none;"></div>
      <div class="row">
        <div class="col">
          <div class="form-row"><label>Your Business Name</label><input id="inv-from" placeholder="Sara Stadler Consulting"></div>
          <div class="form-row"><label>Client Name</label><input id="inv-to" placeholder="Acme Corp"></div>
        </div>
        <div class="col">
          <div class="form-row"><label>Invoice Number</label><input id="inv-num" placeholder="INV-2026-001"></div>
          <div class="form-row"><label>Payment Terms</label><select id="inv-terms"><option>Net 30</option><option>Net 15</option><option>Due on Receipt</option><option>Net 60</option></select></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button class="btn" onclick="generateInvoice()">✦ Generate Invoice</button>
        <button class="btn-out" onclick="document.getElementById('invoice-panel').style.display='none'">Cancel</button>
      </div>
      <div id="inv-output" class="output-box" style="margin-top:14px;display:none;font-family:monospace;"></div>
    </div>

    <div class="panel" style="padding:0;overflow:auto;">
      <table class="table">
        <thead><tr><th>Date</th><th>Project</th><th>Client</th><th>Description</th><th>Hours</th><th>Rate</th><th>Type</th></tr></thead>
        <tbody>` + rows + `</tbody>
      </table>
    </div>

    <script>
    function openLog(){var d=new Date();document.getElementById('t-date').value=d.toISOString().slice(0,10);document.getElementById('log-panel').style.display='';}
    function closeLog(){document.getElementById('log-panel').style.display='none';}
    function genInvoice(){document.getElementById('invoice-panel').style.display='';}
    async function logTime(){
      var date=document.getElementById('t-date').value;var project=document.getElementById('t-project').value.trim();var desc=document.getElementById('t-desc').value.trim();var hours=parseFloat(document.getElementById('t-hours').value||'0');var rate=parseFloat(document.getElementById('t-rate').value||'0');var email=document.getElementById('t-email').value.trim();var billable=document.getElementById('t-bill').value==='true';var client=document.getElementById('t-client').value.trim();
      if(!project||!desc||!hours){showLS('Project, description, and hours are required.',false);return;}
      try{var r=await fetch('` + BASE + `/ops/time',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({professionalEmail:email,project,clientName:client,description:desc,hoursDecimal:hours,rateCents:Math.round(rate*100),workDate:date||new Date().toISOString().slice(0,10),billable})});var d=await r.json();if(d.ok){location.reload();}else{showLS('Error: '+d.error,false);}}catch(e){showLS('Network error.',false);}
    }
    async function generateInvoice(){
      var from=document.getElementById('inv-from').value.trim();var to=document.getElementById('inv-to').value.trim();var num=document.getElementById('inv-num').value.trim();var terms=document.getElementById('inv-terms').value;
      if(!from||!to){showIS('Enter your business name and client name.',false);return;}
      var btn=document.querySelector('#invoice-panel .btn');btn.disabled=true;btn.textContent='Generating...';
      showIS('GPT-4o is generating your invoice...', null);
      try{var r=await fetch('` + BASE + `/ops/time/invoice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from,to,invoiceNumber:num,paymentTerms:terms})});var d=await r.json();if(d.ok){var out=document.getElementById('inv-output');out.style.display='';out.textContent=d.invoice;showIS('Invoice generated. Copy and use immediately.',true);}else{showIS('Error: '+d.error,false);}}catch(e){showIS('Network error.',false);}finally{btn.disabled=false;btn.textContent='✦ Generate Invoice';}
    }
    function showLS(msg,ok){var b=document.getElementById('log-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg;}
    function showIS(msg,ok){var b=document.getElementById('inv-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg;}
    </script>
  </div></body></html>`);
});

router.post("/time", async (req: Request, res: Response) => {
  try {
    const { professionalEmail, project, clientName, description, hoursDecimal, rateCents, workDate, billable } = req.body as {
      professionalEmail?: string; project?: string; clientName?: string; description?: string;
      hoursDecimal?: number; rateCents?: number; workDate?: string; billable?: boolean;
    };
    if (!project || !description) { res.status(400).json({ ok: false, error: "project and description required" }); return; }
    const id = await logTimeEntry({ professionalEmail: professionalEmail ?? "", project, clientName: clientName ?? "", description, hoursDecimal: hoursDecimal ?? 0, rateCents: rateCents ?? 0, workDate: workDate ?? new Date().toISOString().slice(0, 10), billable: billable ?? true });
    res.json({ ok: true, id });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

router.post("/time/invoice", async (req: Request, res: Response) => {
  try {
    const { from: fromName, to: toName, invoiceNumber, paymentTerms } = req.body as { from?: string; to?: string; invoiceNumber?: string; paymentTerms?: string };
    const [entries, summary] = await Promise.all([getTimeEntries(), getTimeSummary()]);
    const billable = entries.filter(e => e["billable"]).slice(0, 20);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: "You are an expert business document generator. Write professional invoices in plain text (no HTML, no markdown). Use clear columns and alignment."
      }, {
        role: "user",
        content: "Generate a professional invoice:\n\nFROM: " + (fromName ?? "") + "\nTO: " + (toName ?? "") + "\nINVOICE #: " + (invoiceNumber ?? "INV-001") + "\nDATE: " + new Date().toISOString().slice(0, 10) + "\nPAYMENT TERMS: " + (paymentTerms ?? "Net 30") + "\n\nLINE ITEMS (from time log):\n" + billable.map(e => "- " + String(e["work_date"] ?? "").slice(0, 10) + " | " + String(e["project"] ?? "") + " | " + String(e["description"] ?? "").slice(0, 60) + " | " + Number(e["hours_decimal"]).toFixed(2) + "h @ $" + (Number(e["rate_cents"]) / 100).toFixed(0) + "/hr = $" + (Number(e["hours_decimal"]) * Number(e["rate_cents"]) / 100).toFixed(2)).join("\n") + "\n\nSUMMARY:\nTotal Billable Hours: " + summary.billableHours.toFixed(2) + "\nTotal Amount Due: $" + (summary.totalValueCents / 100).toFixed(2) + "\n\nInclude: header, line item table, subtotal, total due, payment instructions section, and a professional closing note."
      }],
      max_tokens: 1200,
      temperature: 0.3,
    });
    const invoice = completion.choices[0]?.message?.content?.trim() ?? "";
    await saveAiGeneration("invoice", { from: fromName, to: toName }, invoice, completion.usage?.total_tokens ?? 0);
    res.json({ ok: true, invoice });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// ── LOYALTY ENGINE ────────────────────────────────────────────────────────────

router.get("/loyalty", async (_req: Request, res: Response) => {
  let leaders: Array<{ email: string; balance: number }> = [];
  try { leaders = await getLoyaltyLeaderboard(30); } catch { /* ignore */ }
  const totalPoints = leaders.reduce((s, l) => s + l.balance, 0);

  const rows = leaders.length === 0
    ? "<tr><td colspan=\"3\" class=\"empty\">No loyalty points awarded yet. Points auto-award on purchase.</td></tr>"
    : leaders.map((l, i) =>
        "<tr><td style=\"font-weight:700;color:" + (i === 0 ? "var(--am)" : "var(--t1)") + ";\">" + (i + 1) + ". " + l.email + "</td>" +
        "<td style=\"font-weight:900;color:var(--ind);\">" + l.balance.toLocaleString() + " pts</td>" +
        "<td style=\"font-size:.75rem;color:var(--t3);\">$" + (l.balance / 100).toFixed(2) + " value</td></tr>"
      ).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("Loyalty Engine", "Loyalty", "Loyalty") + `
    <div class="row" style="align-items:center;margin-bottom:20px;">
      <div><h1>⭐ <em>Loyalty Engine</em></h1><p class="sub" style="margin:0;">Points auto-award on every purchase: 1 point per $1 spent.</p></div>
      <div style="margin-left:auto;"><button class="btn btn-sm" onclick="openAward()">+ Award Points</button></div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-val">` + leaders.length + `</div><div class="stat-lbl">Members</div></div>
      <div class="stat"><div class="stat-val">` + totalPoints.toLocaleString() + `</div><div class="stat-lbl">Total Points</div></div>
      <div class="stat"><div class="stat-val">$` + (totalPoints / 100).toFixed(0) + `</div><div class="stat-lbl">Points Value</div></div>
    </div>

    <div id="award-panel" class="panel" style="display:none;margin-bottom:20px;">
      <h2>Manually Award Points</h2>
      <div id="award-status" class="status-bar" style="display:none;"></div>
      <div class="row">
        <div class="col"><div class="form-row"><label>Customer Email</label><input id="aw-email" type="email" placeholder="customer@example.com"></div></div>
        <div class="col"><div class="form-row"><label>Points to Award</label><input id="aw-points" type="number" min="1" placeholder="100"></div></div>
        <div class="col"><div class="form-row"><label>Reason / Note</label><input id="aw-note" placeholder="Loyalty bonus, referral reward, etc."></div></div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn" onclick="awardPoints()">Award Points</button>
        <button class="btn-out" onclick="document.getElementById('award-panel').style.display='none'">Cancel</button>
      </div>
    </div>

    <div class="panel" style="padding:0;overflow:hidden;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--line);font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);">Points Leaderboard</div>
      <table class="table">
        <thead><tr><th>Member</th><th>Points Balance</th><th>Approx Value</th></tr></thead>
        <tbody>` + rows + `</tbody>
      </table>
    </div>

    <div class="panel" style="margin-top:20px;">
      <div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);margin-bottom:10px;">How It Works</div>
      <div style="font-size:.82rem;color:var(--t2);line-height:1.7;">
        <strong style="color:var(--t1);">Earning:</strong> 1 point per $1 spent, auto-awarded on checkout completion via Stripe webhook.<br>
        <strong style="color:var(--t1);">Balance:</strong> Customers can see their balance in the Customer Portal at <a href="` + BASE + `/portal/me" style="color:var(--ind);">/portal/me</a>.<br>
        <strong style="color:var(--t1);">Redemption:</strong> Award Stripe discount codes manually, or contact customers directly with redemption offers.
      </div>
    </div>

    <script>
    function openAward(){document.getElementById('award-panel').style.display='';}
    async function awardPoints(){
      var email=document.getElementById('aw-email').value.trim();var pts=parseInt(document.getElementById('aw-points').value||'0');var note=document.getElementById('aw-note').value.trim();
      if(!email||!pts){showAW('Email and points required.',false);return;}
      try{var r=await fetch('` + BASE + `/ops/loyalty/award',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,points:pts,notes:note})});var d=await r.json();if(d.ok){location.reload();}else{showAW('Error: '+d.error,false);}}catch(e){showAW('Network error.',false);}
    }
    function showAW(msg,ok){var b=document.getElementById('award-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg;}
    </script>
  </div></body></html>`);
});

router.post("/loyalty/award", async (req: Request, res: Response) => {
  try {
    const { email, points, notes } = req.body as { email?: string; points?: number; notes?: string };
    if (!email || !points) { res.status(400).json({ ok: false, error: "email and points required" }); return; }
    await awardLoyaltyPoints(email, points, "manual-award", "admin", notes ?? "Manual award");
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// ── REVIEWS MANAGEMENT ────────────────────────────────────────────────────────

router.get("/reviews", async (_req: Request, res: Response) => {
  let reviews: Array<Record<string, unknown>> = [];
  try { reviews = await getReviews(); } catch { /* ignore */ }
  const pending  = reviews.filter(r => String(r["status"]) === "pending").length;
  const approved = reviews.filter(r => String(r["status"]) === "approved").length;

  const rows = reviews.length === 0
    ? "<tr><td colspan=\"6\" class=\"empty\">No reviews yet. Send review request emails from the AI Email Engine.</td></tr>"
    : reviews.map(r =>
        "<tr>" +
        "<td style=\"font-weight:700;\">" + String(r["product_title"] ?? "").slice(0, 30) + "</td>" +
        "<td style=\"font-size:.75rem;\">" + String(r["customer_name"] ?? "") + "</td>" +
        "<td>" + "★".repeat(Math.min(5, Number(r["rating"] ?? 0))) + "<span style=\"color:var(--t4);\">" + "★".repeat(5 - Math.min(5, Number(r["rating"] ?? 0))) + "</span></td>" +
        "<td style=\"font-size:.78rem;color:var(--t2);max-width:200px;\">" + String(r["review_text"] ?? "").slice(0, 100) + (String(r["review_text"] ?? "").length > 100 ? "..." : "") + "</td>" +
        "<td>" + badgeFor(String(r["status"] ?? "pending")) + "</td>" +
        "<td style=\"display:flex;gap:5px;\">" +
        "<button class=\"btn btn-sm btn-green\" onclick=\"setReview('" + String(r["id"]) + "','approved')\">Approve</button>" +
        "<button class=\"btn btn-sm btn-red\" onclick=\"setReview('" + String(r["id"]) + "','rejected')\">Reject</button>" +
        "</td></tr>"
      ).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("Reviews", "Reviews", "Reviews") + `
    <div class="row" style="align-items:center;margin-bottom:20px;">
      <div><h1>⭐ <em>Review Manager</em></h1><p class="sub" style="margin:0;">Approve reviews to display them on product pages.</p></div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-val">` + reviews.length + `</div><div class="stat-lbl">Total Reviews</div></div>
      <div class="stat"><div class="stat-val">` + pending + `</div><div class="stat-lbl">Pending</div></div>
      <div class="stat"><div class="stat-val">` + approved + `</div><div class="stat-lbl">Approved & Live</div></div>
    </div>
    <div class="panel" style="padding:0;overflow:auto;">
      <table class="table">
        <thead><tr><th>Product</th><th>Reviewer</th><th>Rating</th><th>Review</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>` + rows + `</tbody>
      </table>
    </div>
    <div class="panel" style="margin-top:20px;">
      <div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);margin-bottom:8px;">How to Get Reviews</div>
      <div style="font-size:.82rem;color:var(--t2);line-height:1.7;">
        1. Use <strong style="color:var(--t1);">AI Email Engine</strong> → "Testimonial Request" content type to draft review request emails.<br>
        2. Include the review submission URL: <code style="background:var(--s3);padding:2px 6px;border-radius:4px;font-size:.78rem;">` + BASE + `/portal/review</code><br>
        3. Approved reviews display on product pages under the "Customer Reviews" section.
      </div>
    </div>
    <script>
    async function setReview(id,status){
      await fetch('` + BASE + `/ops/reviews/'+id+'/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
      location.reload();
    }
    </script>
  </div></body></html>`);
});

router.post("/reviews/:id/status", async (req: Request, res: Response) => {
  try {
    const id = String(req.params["id"] ?? "");
    const { status } = req.body as { status?: string };
    await updateReviewStatus(id, status ?? "pending");
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

export default router;
