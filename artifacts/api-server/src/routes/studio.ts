/**
 * routes/studio.ts — AI Studio
 * ──────────────────────────────
 * Real, working AI-native capabilities accessible to subscribers.
 *
 * GET  /studio              → Studio hub (all tools)
 * GET  /studio/email        → AI Email & Newsletter Engine
 * POST /studio/email/draft  → Generate email draft (GPT-4o)
 * POST /studio/email/send   → Send email via Resend
 * GET  /studio/docs         → AI Document & Contract Generator
 * POST /studio/docs/draft   → Generate document (GPT-4o)
 */

import { Router, type Request, type Response } from "express";
import { openai }              from "@workspace/integrations-openai-ai-server";
import { sendEmailNotification }  from "../utils/notifications.js";
import { getPublicBaseUrl }       from "../utils/publicUrl.js";
import { getRegistry }            from "../semantic/registry.js";
import {
  getCustomerStats,
  getRecentCustomers,
  getRevenueTimeline,
  findCustomersByEmail,
  saveAiGeneration,
} from "../lib/db.js";

const router = Router();
const BASE   = getPublicBaseUrl();
const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";

// ─── Shared CSS ──────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:#020617; --s1:#0d1526; --s2:#111827; --s3:#1e293b; --s4:#243044;
    --line:#1e293b; --line2:#2d3748;
    --t1:#e2e8f0; --t2:#94a3b8; --t3:#64748b; --t4:#475569;
    --ind:#6366f1; --em:#10b981; --am:#f59e0b; --re:#f87171;
  }
  html,body{background:var(--bg);color:var(--t1);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;min-height:100vh;}
  a{color:inherit;text-decoration:none;}
  .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,0.97);position:sticky;top:0;z-index:100;}
  .hdr-inner{max-width:1100px;margin:0 auto;height:48px;display:flex;align-items:center;gap:14px;}
  .logo{font-size:1rem;font-weight:900;letter-spacing:-0.03em;color:var(--t1);}
  .logo span{color:var(--ind);}
  .bc{font-size:0.7rem;color:var(--t4);margin-left:6px;}
  .bc a{color:var(--t3);}
  .bc a:hover{color:var(--t1);}
  .mode{font-size:0.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;border-radius:99px;padding:3px 9px;margin-left:auto;}
  .test-mode{background:rgba(245,158,11,.12);color:#fcd34d;border:1px solid rgba(245,158,11,.22);}
  .live-mode{background:rgba(16,185,129,.12);color:#6ee7b7;border:1px solid rgba(16,185,129,.22);}
  .wrap{max-width:1100px;margin:0 auto;padding:40px 24px;}
  h1{font-size:clamp(1.4rem,3vw,2rem);font-weight:900;letter-spacing:-0.04em;margin-bottom:8px;}
  h1 em{color:#818cf8;font-style:normal;}
  .sub{font-size:0.85rem;color:var(--t3);margin-bottom:32px;}
  .tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;}
  .tool-card{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:8px;transition:border-color .15s;}
  .tool-card:hover{border-color:rgba(99,102,241,.4);}
  .tc-icon{font-size:1.8rem;}
  .tc-name{font-size:1rem;font-weight:900;color:var(--t1);}
  .tc-desc{font-size:0.75rem;color:var(--t2);line-height:1.5;}
  .tc-status{font-size:0.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;border-radius:99px;padding:2px 9px;display:inline-block;width:fit-content;}
  .live{color:var(--em);background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);}
  .soon{color:var(--t4);background:var(--s1);border:1px solid var(--line);}
  .tc-link{margin-top:auto;display:block;background:var(--ind);color:#fff;text-align:center;border-radius:8px;padding:9px;font-size:0.8rem;font-weight:700;transition:opacity .15s;}
  .tc-link:hover{opacity:.85;}
  .tc-link.disabled{background:var(--s3);color:var(--t4);cursor:not-allowed;pointer-events:none;}
  .panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:28px;}
  .form-row{display:flex;flex-direction:column;gap:6px;margin-bottom:18px;}
  .form-row label{font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);}
  input,textarea,select{background:var(--s1);border:1.5px solid var(--line);border-radius:8px;padding:10px 13px;color:var(--t1);font-size:0.85rem;font-family:inherit;width:100%;outline:none;transition:border-color .15s;resize:vertical;}
  input:focus,textarea:focus,select:focus{border-color:var(--ind);}
  input::placeholder,textarea::placeholder{color:var(--t4);}
  .btn{background:var(--ind);color:#fff;border:none;border-radius:9px;padding:11px 22px;font-size:0.88rem;font-weight:800;cursor:pointer;transition:opacity .15s;}
  .btn:hover{opacity:.85;}
  .btn:disabled{opacity:.4;cursor:not-allowed;}
  .btn-out{background:transparent;color:var(--t2);border:1px solid var(--line2);border-radius:9px;padding:10px 20px;font-size:0.85rem;font-weight:700;cursor:pointer;transition:all .15s;}
  .btn-out:hover{border-color:var(--ind);color:var(--t1);}
  .output-box{background:var(--s1);border:1px solid var(--line);border-radius:10px;padding:18px;font-size:0.82rem;line-height:1.7;color:var(--t2);white-space:pre-wrap;word-break:break-word;min-height:120px;font-family:'SF Mono','Fira Code',monospace;}
  .output-empty{color:var(--t4);font-style:italic;font-family:inherit;}
  .status-bar{font-size:0.72rem;padding:8px 12px;border-radius:7px;margin-bottom:16px;}
  .ok{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);color:var(--em);}
  .err-bar{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);color:var(--re);}
  .row{display:flex;gap:12px;align-items:flex-start;}
  .col{flex:1;}
  @media(max-width:640px){.row{flex-direction:column;}.tool-grid{grid-template-columns:1fr;}}
`;

function header(title: string, breadcrumb?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — CreateAI Brain Studio</title>
  <style>${CSS}</style>
</head>
<body>
<header class="hdr">
  <div class="hdr-inner">
    <a class="logo" href="${BASE}">Create<span>AI</span> Brain</a>
    <span class="bc">/ <a href="${BASE}/studio">Studio</a>${breadcrumb ? " / " + breadcrumb : ""}</span>
    <span class="mode ${IS_PROD ? "live-mode" : "test-mode"}">${IS_PROD ? "⚡ Live" : "🧪 Test"}</span>
  </div>
</header>
<div class="wrap">`;
}

const TOOLS = [
  { id: "email",     icon: "✉",  name: "AI Email Engine",         desc: "Write and send newsletters, campaigns, or one-off emails using GPT-4o. Resend delivers. No Mailchimp required.",        live: true },
  { id: "docs",      icon: "📄", name: "AI Document Generator",   desc: "Generate contracts, proposals, SOPs, intake forms, or any structured document from a brief in seconds.",              live: true },
  { id: "analytics", icon: "📊", name: "AI Analytics Reports",    desc: "One-click weekly business intelligence report. GPT-4o reads your live DB stats and writes a plain-English summary.",  live: true },
  { id: "crm",       icon: "👥", name: "AI CRM & Follow-up",      desc: "View customers from your live DB. Generate personalized AI follow-up emails for any customer with one click.",        live: true },
  { id: "social",    icon: "📱", name: "AI Social Scheduler",     desc: "Generate 30 days of social media posts from your live product catalog. Includes captions, hashtags, and CTAs.",       live: true },
  { id: "content",   icon: "✍",  name: "AI Content Engine",       desc: "Product descriptions, landing page copy, SEO meta tags, and sales emails from a single brief.",                       live: true },
  { id: "schedule",  icon: "📅", name: "AI Scheduling Layer",     desc: "Generate structured meeting agendas, action items, and follow-up schedules for any meeting type in seconds.",       live: true },
  { id: "training",  icon: "🎓", name: "AI Training System",      desc: "Turn any topic into a full training module with learning objectives, structured sections, and quiz questions.",         live: true },
  { id: "forms",     icon: "📋", name: "AI Form Builder",         desc: "Describe any form in plain language. Platform generates the complete HTML form code, ready to embed anywhere.",         live: true },
  { id: "helpdesk",  icon: "🎧", name: "AI Helpdesk",             desc: "Draft customer replies, generate FAQ entries, and build KB articles from your product and customer data.",              live: true },
];

// ── GET /studio ──────────────────────────────────────────────────────────────

router.get("/", (_req: Request, res: Response) => {
  const cards = TOOLS.map(t => {
    const href = t.live ? `${BASE}/studio/${t.id}` : "#";
    return `<div class="tool-card">
      <div class="tc-icon">${t.icon}</div>
      <div class="tc-name">${t.name}</div>
      <div class="tc-desc">${t.desc}</div>
      <span class="tc-status ${t.live ? "live" : "soon"}">${t.live ? "● Live" : "Coming Soon"}</span>
      <a class="tc-link${t.live ? "" : " disabled"}" href="${href}">${t.live ? "Open Tool →" : "Not yet available"}</a>
    </div>`;
  }).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI Studio") + `
    <h1><em>AI Studio</em></h1>
    <p class="sub">Your complete AI-native capability workspace. ${TOOLS.filter(t => t.live).length} tools live now · ${TOOLS.filter(t => !t.live).length} in development.</p>
    <div class="tool-grid">${cards}</div>
  </div></body></html>`);
});

// ── GET /studio/email ─────────────────────────────────────────────────────────

router.get("/email", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI Email Engine", "Email Engine") + `
    <h1>✉ <em>AI Email Engine</em></h1>
    <p class="sub">Write and send AI-generated email campaigns in one place. GPT-4o drafts. Resend delivers.</p>
    <div class="row">
      <div class="col">
        <div class="panel">
          <div id="status-bar" style="display:none;" class="status-bar"></div>
          <div class="form-row"><label>From Name</label><input id="from-name" type="text" placeholder="Sara Stadler" value="CreateAI Brain"></div>
          <div class="form-row"><label>To (email addresses, comma-separated)</label><input id="to" type="text" placeholder="customer@example.com, another@example.com"></div>
          <div class="form-row"><label>Subject Line</label><input id="subject" type="text" placeholder="AI-generated or write your own"></div>
          <div class="form-row">
            <label>Topic / Brief</label>
            <textarea id="brief" rows="4" placeholder="Describe what the email should say. E.g. 'A weekly update about the new AI scheduling feature, warm tone, 200 words, include a CTA to visit /studio'"></textarea>
          </div>
          <div class="form-row">
            <label>Tone</label>
            <select id="tone">
              <option value="professional">Professional</option>
              <option value="friendly" selected>Friendly & Warm</option>
              <option value="urgent">Urgent / Action-oriented</option>
              <option value="educational">Educational / Informative</option>
              <option value="minimal">Minimal / Direct</option>
            </select>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn" onclick="draftEmail()" id="draft-btn">✦ Generate Draft</button>
            <button class="btn-out" onclick="sendEmail()" id="send-btn" style="display:none;">Send Email →</button>
            <button class="btn-out" onclick="clearEmail()">Clear</button>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="panel" style="height:100%;">
          <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Generated Draft</div>
          <div id="output" class="output-box"><span class="output-empty">Draft will appear here after generation...</span></div>
          <div style="margin-top:10px;display:flex;gap:8px;" id="copy-row" style="display:none!important;">
            <button class="btn-out" onclick="copyDraft()" id="copy-btn" style="display:none;font-size:0.75rem;padding:7px 14px;">Copy Draft</button>
          </div>
        </div>
      </div>
    </div>

    <script>
    let currentDraft = '';

    async function draftEmail() {
      const brief = document.getElementById('brief').value.trim();
      const tone  = document.getElementById('tone').value;
      const subj  = document.getElementById('subject').value.trim();
      if (!brief) { showStatus('Enter a topic or brief first.', false); return; }
      const btn = document.getElementById('draft-btn');
      btn.disabled = true; btn.textContent = '...Generating';
      showStatus('GPT-4o is drafting your email...', null);
      try {
        const resp = await fetch('/studio/email/draft', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ brief, tone, subject: subj })
        });
        const data = await resp.json();
        if (!data.ok) { showStatus('Error: ' + data.error, false); return; }
        currentDraft = data.body;
        document.getElementById('output').textContent = data.body;
        if (data.subject && !document.getElementById('subject').value) {
          document.getElementById('subject').value = data.subject;
        }
        document.getElementById('send-btn').style.display = '';
        document.getElementById('copy-btn').style.display = '';
        showStatus('Draft ready. Review it, then send when ready.', true);
      } catch(e) { showStatus('Network error: ' + e.message, false); }
      finally { btn.disabled = false; btn.textContent = '✦ Generate Draft'; }
    }

    async function sendEmail() {
      const toRaw = document.getElementById('to').value.trim();
      const subj  = document.getElementById('subject').value.trim();
      const from  = document.getElementById('from-name').value.trim() || 'CreateAI Brain';
      if (!toRaw) { showStatus('Enter at least one recipient email address.', false); return; }
      if (!subj)  { showStatus('Enter a subject line.', false); return; }
      if (!currentDraft) { showStatus('Generate a draft first.', false); return; }
      const tos = toRaw.split(',').map(e => e.trim()).filter(Boolean);
      const btn = document.getElementById('send-btn');
      btn.disabled = true; btn.textContent = 'Sending...';
      showStatus('Sending via Resend...', null);
      try {
        const resp = await fetch('/studio/email/send', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ to: tos, subject: subj, body: currentDraft, fromName: from })
        });
        const data = await resp.json();
        if (!data.ok) { showStatus('Send failed: ' + data.error, false); return; }
        showStatus('Email sent to ' + tos.length + ' recipient' + (tos.length>1?'s':'') + '.', true);
        btn.style.display = 'none';
      } catch(e) { showStatus('Network error: ' + e.message, false); }
      finally { btn.disabled = false; btn.textContent = 'Send Email →'; }
    }

    function copyDraft() {
      navigator.clipboard.writeText(currentDraft).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Draft', 1800);
      });
    }

    function clearEmail() {
      currentDraft = '';
      document.getElementById('output').innerHTML = '<span class="output-empty">Draft will appear here after generation...</span>';
      document.getElementById('send-btn').style.display = 'none';
      document.getElementById('copy-btn').style.display = 'none';
      document.getElementById('brief').value = '';
      document.getElementById('subject').value = '';
      document.getElementById('status-bar').style.display = 'none';
    }

    function showStatus(msg, ok) {
      const bar = document.getElementById('status-bar');
      bar.style.display = '';
      bar.className = 'status-bar ' + (ok === true ? 'ok' : ok === false ? 'err-bar' : '');
      bar.textContent = msg;
    }
    </script>
  </div></body></html>`);
});

// ── POST /studio/email/draft ──────────────────────────────────────────────────

router.post("/email/draft", async (req: Request, res: Response) => {
  try {
    const { brief, tone, subject } = req.body as { brief?: string; tone?: string; subject?: string };
    if (!brief) { res.status(400).json({ ok: false, error: "brief is required" }); return; }

    const toneMap: Record<string, string> = {
      professional:  "professional and polished",
      friendly:      "friendly, warm, and conversational",
      urgent:        "urgent and action-oriented with clear CTAs",
      educational:   "educational, informative, and structured",
      minimal:       "minimal, direct, and concise",
    };
    const toneLabel = toneMap[tone ?? "friendly"] ?? "friendly and warm";

    const systemPrompt = `You are an expert email copywriter. Write emails that are ${toneLabel}.
Write clean, flowing email body copy — no markdown, no HTML, no asterisks.
If asked to generate a subject line, prefix it with "Subject: " on the first line, then a blank line, then the body.
Keep it under 300 words unless the brief requests longer.`;

    const userPrompt = subject
      ? `Write an email body for this subject: "${subject}"\n\nBrief: ${brief}`
      : `Write a complete email (subject line first, then body) for this brief:\n\n${brief}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let subjectLine = subject ?? "";
    let body = raw.trim();

    if (!subject && raw.startsWith("Subject:")) {
      const lines = raw.split("\n");
      subjectLine = lines[0]?.replace(/^Subject:\s*/i, "").trim() ?? "";
      body = lines.slice(2).join("\n").trim();
    }

    res.json({ ok: true, subject: subjectLine, body });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── POST /studio/email/send ───────────────────────────────────────────────────

router.post("/email/send", async (req: Request, res: Response) => {
  try {
    const { to, subject, body, fromName } = req.body as { to?: string[]; subject?: string; body?: string; fromName?: string };
    if (!to?.length)  { res.status(400).json({ ok: false, error: "to is required" }); return; }
    if (!subject)     { res.status(400).json({ ok: false, error: "subject is required" }); return; }
    if (!body)        { res.status(400).json({ ok: false, error: "body is required" }); return; }

    const htmlBody = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1e293b;line-height:1.7;font-size:15px;">${body.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</div>`;

    const batch = await sendEmailNotification(to, subject, htmlBody);
    res.json({
      ok:      batch.successCount > 0,
      sent:    batch.successCount,
      failed:  batch.failCount,
      details: batch.results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /studio/docs ──────────────────────────────────────────────────────────

router.get("/docs", (_req: Request, res: Response) => {
  const docTypes = [
    "Service Agreement", "NDA / Confidentiality Agreement", "Client Proposal",
    "Standard Operating Procedure (SOP)", "Onboarding Checklist", "Invoice",
    "Job Description", "Privacy Policy", "Terms of Service",
    "Partnership Agreement", "Freelance Contract", "Consulting Engagement Letter",
  ];
  const opts = docTypes.map(d => `<option value="${d}">${d}</option>`).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI Document Generator", "Document Generator") + `
    <h1>📄 <em>AI Document Generator</em></h1>
    <p class="sub">Generate any legal, operational, or business document in seconds. GPT-4o drafts it from your brief. Copy, download, or email immediately.</p>
    <div class="row">
      <div class="col">
        <div class="panel">
          <div id="status-bar" style="display:none;" class="status-bar"></div>
          <div class="form-row">
            <label>Document Type</label>
            <select id="doc-type"><option value="">— Custom type —</option>${opts}</select>
          </div>
          <div class="form-row">
            <label>Custom Document Type (overrides dropdown)</label>
            <input id="custom-type" type="text" placeholder="e.g. Photography Session Contract, Lease Addendum...">
          </div>
          <div class="form-row">
            <label>Your Details (party name, business, role)</label>
            <input id="party-a" type="text" placeholder="e.g. Sara Stadler, Lakeside Trinity LLC, Consultant">
          </div>
          <div class="form-row">
            <label>Other Party / Recipient (if applicable)</label>
            <input id="party-b" type="text" placeholder="e.g. Acme Corp, John Smith (Client)">
          </div>
          <div class="form-row">
            <label>Key Terms / Brief</label>
            <textarea id="brief" rows="5" placeholder="Describe the key terms, scope, payment, timeline, or any specific clauses. The more detail, the better the output. E.g. 'Monthly retainer of $3,000, 10 hours/week, 30-day notice to terminate, Delaware law governs...'"></textarea>
          </div>
          <div class="form-row">
            <label>Jurisdiction (optional)</label>
            <input id="jurisdiction" type="text" placeholder="e.g. State of California, Delaware, England & Wales">
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn" onclick="generateDoc()" id="gen-btn">✦ Generate Document</button>
            <button class="btn-out" onclick="copyDoc()" id="copy-btn" style="display:none;">Copy Text</button>
            <button class="btn-out" onclick="clearDoc()">Clear</button>
          </div>
          <div style="margin-top:12px;font-size:0.7rem;color:var(--t4);line-height:1.5;">⚠ AI-generated documents are a starting point. Always have legal documents reviewed by a qualified attorney before use.</div>
        </div>
      </div>
      <div class="col">
        <div class="panel" style="height:100%;">
          <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Generated Document</div>
          <div id="output" class="output-box" style="min-height:400px;"><span class="output-empty">Document will appear here after generation...</span></div>
        </div>
      </div>
    </div>

    <script>
    let currentDoc = '';

    async function generateDoc() {
      const docType   = document.getElementById('custom-type').value.trim() || document.getElementById('doc-type').value || 'Business Document';
      const partyA    = document.getElementById('party-a').value.trim();
      const partyB    = document.getElementById('party-b').value.trim();
      const brief     = document.getElementById('brief').value.trim();
      const juris     = document.getElementById('jurisdiction').value.trim();
      if (!brief) { showStatus('Enter key terms or a brief first.', false); return; }
      const btn = document.getElementById('gen-btn');
      btn.disabled = true; btn.textContent = '...Generating';
      showStatus('GPT-4o is drafting your document...', null);
      try {
        const resp = await fetch('/studio/docs/draft', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ docType, partyA, partyB, brief, jurisdiction: juris })
        });
        const data = await resp.json();
        if (!data.ok) { showStatus('Error: ' + data.error, false); return; }
        currentDoc = data.document;
        document.getElementById('output').textContent = data.document;
        document.getElementById('copy-btn').style.display = '';
        showStatus('Document generated. Review carefully before use.', true);
      } catch(e) { showStatus('Network error: ' + e.message, false); }
      finally { btn.disabled = false; btn.textContent = '✦ Generate Document'; }
    }

    function copyDoc() {
      navigator.clipboard.writeText(currentDoc).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Text', 1800);
      });
    }

    function clearDoc() {
      currentDoc = '';
      document.getElementById('output').innerHTML = '<span class="output-empty">Document will appear here after generation...</span>';
      document.getElementById('copy-btn').style.display = 'none';
      document.getElementById('brief').value = '';
      document.getElementById('status-bar').style.display = 'none';
    }

    function showStatus(msg, ok) {
      const bar = document.getElementById('status-bar');
      bar.style.display = '';
      bar.className = 'status-bar ' + (ok === true ? 'ok' : ok === false ? 'err-bar' : '');
      bar.textContent = msg;
    }
    </script>
  </div></body></html>`);
});

// ── POST /studio/docs/draft ───────────────────────────────────────────────────

router.post("/docs/draft", async (req: Request, res: Response) => {
  try {
    const { docType, partyA, partyB, brief, jurisdiction } = req.body as {
      docType?: string; partyA?: string; partyB?: string; brief?: string; jurisdiction?: string;
    };
    if (!brief) { res.status(400).json({ ok: false, error: "brief is required" }); return; }

    const prompt = `Generate a professional ${docType ?? "business document"}.

${partyA ? `Party A / Provider: ${partyA}` : ""}
${partyB ? `Party B / Client: ${partyB}` : ""}
${jurisdiction ? `Governing law: ${jurisdiction}` : ""}

Key terms and scope:
${brief}

Instructions:
- Write in clear, professional legal/business language
- Use proper headings and numbered sections
- Include all standard clauses for this document type
- Add signature blocks at the end
- Do not use markdown — use plain text with ALL CAPS section headings
- Target 500-900 words unless scope requires more`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a professional business and legal document drafter. Generate complete, well-structured documents in plain text with clear section headings." },
        { role: "user",   content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const document = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ ok: true, document, wordCount: document.split(/\s+/).length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AI ANALYTICS REPORTS
// ══════════════════════════════════════════════════════════════════════════════

router.get("/analytics", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI Analytics Reports", "Analytics") + `
    <h1>&#x1F4CA; <em>AI Analytics Reports</em></h1>
    <p class="sub">GPT-4o reads your live platform data and writes a comprehensive business intelligence summary in plain English.</p>
    <div class="row">
      <div class="col" style="max-width:380px;">
        <div class="panel">
          <div id="status-bar" style="display:none;" class="status-bar"></div>
          <div class="form-row">
            <label>Report Period</label>
            <select id="period">
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30" selected>Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div class="form-row">
            <label>Focus Area</label>
            <select id="focus">
              <option value="revenue">Revenue &amp; Growth</option>
              <option value="customers">Customer Insights</option>
              <option value="products">Product Performance</option>
              <option value="full" selected>Full Platform Overview</option>
            </select>
          </div>
          <div class="form-row">
            <label>Additional Context (optional)</label>
            <textarea id="context" rows="3" placeholder="E.g. 'We launched a new email campaign last week' or 'Black Friday sale ended 3 days ago'"></textarea>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn" onclick="generateReport()" id="gen-btn">&#x2726; Generate Report</button>
            <button class="btn-out" onclick="copyReport()" id="copy-btn" style="display:none;">Copy Report</button>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="panel" style="min-height:400px;">
          <div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Generated Report</div>
          <div id="output" class="output-box" style="min-height:360px;"><span class="output-empty">Click Generate to produce your AI business intelligence report...</span></div>
        </div>
      </div>
    </div>
    <script>
    var currentReport = '';
    async function generateReport() {
      var period = document.getElementById('period').value;
      var focus  = document.getElementById('focus').value;
      var ctx    = document.getElementById('context').value.trim();
      var btn    = document.getElementById('gen-btn');
      btn.disabled = true; btn.textContent = '...Analyzing';
      showStatus('Loading platform data and generating report...', null);
      try {
        var resp = await fetch('/studio/analytics/generate', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ period, focus, context: ctx })
        });
        var data = await resp.json();
        if (!data.ok) { showStatus('Error: ' + data.error, false); return; }
        currentReport = data.report;
        document.getElementById('output').textContent = data.report;
        document.getElementById('copy-btn').style.display = '';
        showStatus('Report generated from live platform data.', true);
      } catch(e) { showStatus('Network error: ' + e.message, false); }
      finally { btn.disabled = false; btn.textContent = '&#x2726; Generate Report'; }
    }
    function copyReport() {
      navigator.clipboard.writeText(currentReport).then(function() {
        var btn = document.getElementById('copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(function(){ btn.textContent = 'Copy Report'; }, 1800);
      });
    }
    function showStatus(msg, ok) {
      var bar = document.getElementById('status-bar');
      bar.style.display = '';
      bar.className = 'status-bar ' + (ok === true ? 'ok' : ok === false ? 'err-bar' : '');
      bar.textContent = msg;
    }
    </script>
  </div></body></html>`);
});

router.post("/analytics/generate", async (req: Request, res: Response) => {
  try {
    const { period, focus, context } = req.body as { period?: string; focus?: string; context?: string };
    const [stats, timeline, products] = await Promise.all([
      getCustomerStats(),
      getRevenueTimeline(),
      getRegistry(),
    ]);

    const daysLimit = period === "all" ? 9999 : parseInt(period ?? "30", 10);
    const filteredTimeline = daysLimit >= 9999 ? timeline : timeline.slice(-daysLimit);
    const totalRevenue = filteredTimeline.reduce((s, d) => s + d.revenue, 0);
    const totalOrders  = filteredTimeline.reduce((s, d) => s + d.orders, 0);
    const growthDays   = filteredTimeline.filter(d => d.revenue > 0).length;
    const avgDaily     = growthDays > 0 ? totalRevenue / growthDays : 0;

    const platformData = [
      "PLATFORM DATA SNAPSHOT:",
      "Period: " + (period === "all" ? "All time" : "Last " + period + " days"),
      "Total Revenue: $" + (totalRevenue / 100).toFixed(2),
      "Total Orders: " + totalOrders,
      "Active Revenue Days: " + growthDays,
      "Avg Daily Revenue: $" + (avgDaily / 100).toFixed(2),
      "All-Time Total Customers: " + stats.totalCustomers,
      "All-Time Unique Emails: " + stats.uniqueEmails,
      "Average Order Value: $" + (stats.averageOrderCents / 100).toFixed(2),
      "Top Products: " + stats.topProducts.slice(0, 3).map(p => p.productTitle + " (" + p.count + " sold)").join(", "),
      "Top Formats: " + stats.topFormats.slice(0, 3).map(f => f.format + " (" + f.count + ")").join(", "),
      "Catalog Size: " + products.length + " active products",
      "Catalog Value: $" + (products.reduce((s, p) => s + p.priceCents, 0) / 100).toFixed(2),
      context ? "\nAdditional context from operator: " + context : "",
    ].join("\n");

    const focusMap: Record<string, string> = {
      revenue:   "Focus your analysis on revenue trends, growth rate, and financial performance.",
      customers: "Focus your analysis on customer behavior, retention, repeat buyers, and LTV.",
      products:  "Focus your analysis on which products are selling, format performance, and catalog optimization.",
      full:      "Provide a full platform overview covering revenue, customers, products, and strategic recommendations.",
    };
    const focusInstruction = focusMap[focus ?? "full"] ?? focusMap["full"];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a senior business analyst and growth strategist. Write clear, actionable business intelligence reports based on real platform data. Be specific, cite the numbers directly, and always end with 3 concrete next steps. Use plain text with section headers in ALL CAPS. Avoid generic advice — everything should be grounded in the actual data provided.",
        },
        {
          role: "user",
          content: platformData + "\n\n" + focusInstruction + "\n\nWrite the report now.",
        },
      ],
      max_tokens: 1500,
      temperature: 0.4,
    });

    const report = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ ok: true, report, dataPoints: { totalRevenue, totalOrders, customers: stats.totalCustomers } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AI CRM & FOLLOW-UP
// ══════════════════════════════════════════════════════════════════════════════

router.get("/crm", async (_req: Request, res: Response) => {
  let customers: Array<{ email: string; productTitle: string; priceCents: number; createdAt: string }> = [];
  try {
    const raw = await getRecentCustomers(50);
    customers = raw.map(c => ({
      email:        c.email,
      productTitle: c.productTitle,
      priceCents:   c.priceCents,
      createdAt:    c.createdAt,
    }));
  } catch { /* DB not ready */ }

  const rows = customers.length === 0
    ? "<tr><td colspan='4' style='text-align:center;color:var(--t4);padding:24px;'>No customers yet. Purchase data will appear here automatically.</td></tr>"
    : customers.map((c, i) => {
        const date = c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
        const masked = c.email.replace(/(?<=.{2}).(?=.*@)/g, "*");
        return "<tr>" +
          "<td style='padding:10px 12px;font-size:.78rem;color:var(--t1);'>" + masked + "</td>" +
          "<td style='padding:10px 12px;font-size:.75rem;color:var(--t2);'>" + c.productTitle.slice(0, 45) + (c.productTitle.length > 45 ? "…" : "") + "</td>" +
          "<td style='padding:10px 12px;font-size:.78rem;color:#34d399;font-weight:700;'>$" + (c.priceCents / 100).toFixed(2) + "</td>" +
          "<td style='padding:10px 12px;font-size:.72rem;color:var(--t4);'>" + date + "</td>" +
          "<td style='padding:10px 12px;'><button class='btn-out' style='font-size:.7rem;padding:4px 10px;' onclick='followUp(" + JSON.stringify(c.email) + "," + JSON.stringify(c.productTitle) + ")'>AI Follow-up</button></td>" +
          "</tr>";
      }).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI CRM & Follow-up", "CRM") + `
    <h1>&#x1F465; <em>AI CRM</em> &amp; Follow-up</h1>
    <p class="sub">Your customer database, live from PostgreSQL. Click "AI Follow-up" to generate a personalized follow-up email for any customer.</p>
    <div class="panel" style="margin-bottom:20px;">
      <div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:14px;">Recent Customers (last 50)</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid var(--line);">
              <th style="padding:8px 12px;font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);text-align:left;">Email</th>
              <th style="padding:8px 12px;font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);text-align:left;">Product</th>
              <th style="padding:8px 12px;font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);text-align:left;">Paid</th>
              <th style="padding:8px 12px;font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);text-align:left;">Date</th>
              <th style="padding:8px 12px;font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);text-align:left;">Action</th>
            </tr>
          </thead>
          <tbody id="cust-rows">` + rows + `</tbody>
        </table>
      </div>
    </div>
    <div id="followup-panel" style="display:none;" class="panel">
      <div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Generated Follow-up Email</div>
      <div id="status-bar" style="display:none;" class="status-bar"></div>
      <div id="followup-output" class="output-box" style="min-height:200px;"></div>
      <div style="margin-top:10px;display:flex;gap:8px;">
        <button class="btn-out" onclick="copyFollowup()" id="copy-fu-btn" style="font-size:.75rem;padding:7px 14px;">Copy Email</button>
        <button class="btn-out" onclick="closeFollowup()" style="font-size:.75rem;padding:7px 14px;">Close</button>
      </div>
    </div>
    <script>
    var currentFollowup = '';
    async function followUp(email, product) {
      document.getElementById('followup-panel').style.display = '';
      var out = document.getElementById('followup-output');
      out.innerHTML = '<span class="output-empty">Generating personalized follow-up for ' + email.replace(/(?<=.{2}).(?=.*@)/g,'*') + '...</span>';
      showStatus('GPT-4o is writing a personalized follow-up...', null);
      try {
        var resp = await fetch('/studio/crm/followup', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, productTitle: product })
        });
        var data = await resp.json();
        if (!data.ok) { showStatus('Error: ' + data.error, false); return; }
        currentFollowup = data.email;
        out.textContent = data.email;
        showStatus('Follow-up ready. Review before sending.', true);
      } catch(e) { showStatus('Network error: ' + e.message, false); }
    }
    function copyFollowup() {
      navigator.clipboard.writeText(currentFollowup).then(function(){
        var b = document.getElementById('copy-fu-btn');
        b.textContent='Copied!';
        setTimeout(function(){b.textContent='Copy Email';},1800);
      });
    }
    function closeFollowup() { document.getElementById('followup-panel').style.display='none'; }
    function showStatus(msg, ok) {
      var bar = document.getElementById('status-bar');
      bar.style.display = '';
      bar.className = 'status-bar ' + (ok===true?'ok':ok===false?'err-bar':'');
      bar.textContent = msg;
    }
    </script>
  </div></body></html>`);
});

router.post("/crm/followup", async (req: Request, res: Response) => {
  try {
    const { email, productTitle } = req.body as { email?: string; productTitle?: string };
    if (!email) { res.status(400).json({ ok: false, error: "email is required" }); return; }

    let purchaseHistory = "1 purchase: " + (productTitle ?? "a digital product");
    try {
      const history = await findCustomersByEmail(email);
      if (history.length > 0) {
        purchaseHistory = history.length + " purchase(s): " + history.map(c => c.productTitle).join(", ");
      }
    } catch { /* DB unavailable */ }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a thoughtful customer success manager for CreateAI Brain, a platform selling AI-generated digital products. Write warm, helpful follow-up emails that feel personal, not automated. Reference the customer's actual purchase(s). No markdown. Start with Subject: on the first line.",
        },
        {
          role: "user",
          content: "Write a follow-up email for a customer with purchase history: " + purchaseHistory + ". Goals: thank them, check satisfaction, offer 1 complementary recommendation from our catalog, mention our membership plans. Keep it under 200 words.",
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ ok: true, email: raw });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AI SOCIAL SCHEDULER
// ══════════════════════════════════════════════════════════════════════════════

router.get("/social", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI Social Scheduler", "Social") + `
    <h1>&#x1F4F1; <em>AI Social Scheduler</em></h1>
    <p class="sub">Generate 30 days of social media content from your product catalog. One click — a month of posts.</p>
    <div class="row">
      <div class="col" style="max-width:380px;">
        <div class="panel">
          <div id="status-bar" style="display:none;" class="status-bar"></div>
          <div class="form-row">
            <label>Platform</label>
            <select id="platform">
              <option value="twitter">Twitter / X</option>
              <option value="linkedin" selected>LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="all">All Platforms (one per day)</option>
            </select>
          </div>
          <div class="form-row">
            <label>Number of Posts</label>
            <select id="count">
              <option value="7">7 posts (1 week)</option>
              <option value="14">14 posts (2 weeks)</option>
              <option value="30" selected>30 posts (1 month)</option>
            </select>
          </div>
          <div class="form-row">
            <label>Tone / Style</label>
            <select id="tone">
              <option value="professional" selected>Professional &amp; Thought-leadership</option>
              <option value="casual">Casual &amp; Conversational</option>
              <option value="educational">Educational &amp; Value-first</option>
              <option value="promotional">Promotional &amp; Sales-focused</option>
            </select>
          </div>
          <div class="form-row">
            <label>Brand Name / Handle</label>
            <input id="brand" type="text" value="CreateAI Brain" placeholder="Your brand or handle">
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn" onclick="generatePosts()" id="gen-btn">&#x2726; Generate Posts</button>
            <button class="btn-out" onclick="copyPosts()" id="copy-btn" style="display:none;">Copy All</button>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="panel" style="min-height:500px;">
          <div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Generated Posts</div>
          <div id="output" class="output-box" style="min-height:460px;"><span class="output-empty">Posts will appear here after generation...</span></div>
        </div>
      </div>
    </div>
    <script>
    var currentPosts = '';
    async function generatePosts() {
      var platform = document.getElementById('platform').value;
      var count    = document.getElementById('count').value;
      var tone     = document.getElementById('tone').value;
      var brand    = document.getElementById('brand').value.trim() || 'CreateAI Brain';
      var btn      = document.getElementById('gen-btn');
      btn.disabled = true; btn.textContent = '...Generating';
      showStatus('Fetching your product catalog and generating ' + count + ' posts...', null);
      try {
        var resp = await fetch('/studio/social/generate', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ platform, count: parseInt(count), tone, brand })
        });
        var data = await resp.json();
        if (!data.ok) { showStatus('Error: ' + data.error, false); return; }
        currentPosts = data.posts;
        document.getElementById('output').textContent = data.posts;
        document.getElementById('copy-btn').style.display = '';
        showStatus(data.postCount + ' posts generated from ' + data.productsUsed + ' products.', true);
      } catch(e) { showStatus('Network error: ' + e.message, false); }
      finally { btn.disabled = false; btn.textContent = '&#x2726; Generate Posts'; }
    }
    function copyPosts() {
      navigator.clipboard.writeText(currentPosts).then(function(){
        var b = document.getElementById('copy-btn');
        b.textContent='Copied!';
        setTimeout(function(){b.textContent='Copy All';},1800);
      });
    }
    function showStatus(msg, ok) {
      var bar = document.getElementById('status-bar');
      bar.style.display = '';
      bar.className = 'status-bar ' + (ok===true?'ok':ok===false?'err-bar':'');
      bar.textContent = msg;
    }
    </script>
  </div></body></html>`);
});

router.post("/social/generate", async (req: Request, res: Response) => {
  try {
    const { platform, count, tone, brand } = req.body as {
      platform?: string; count?: number; tone?: string; brand?: string;
    };
    const postCount = Math.min(Math.max(parseInt(String(count ?? 30)), 7), 30);

    const products = await getRegistry();
    const sample = products
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(15, products.length));
    const productList = sample.map(p =>
      `- "${p.title}" (${p.format}, $${(p.priceCents / 100).toFixed(2)})`
    ).join("\n");

    const platformGuide: Record<string, string> = {
      twitter:   "Twitter/X (under 280 chars each, conversational, use hashtags)",
      linkedin:  "LinkedIn (professional, 150-300 chars, include insights and value, relevant hashtags)",
      instagram: "Instagram (visual, emotional, 150-200 chars, use emojis sparingly, 5-8 hashtags at end)",
      facebook:  "Facebook (friendly, 100-200 chars, ask questions to drive engagement)",
      all:       "mix of platforms — label each with [Twitter], [LinkedIn], [Instagram], or [Facebook]",
    };
    const platformNote = platformGuide[platform ?? "linkedin"] ?? platformGuide["linkedin"];

    const toneNote: Record<string, string> = {
      professional: "thought-leadership and authority positioning",
      casual:       "casual, approachable, relatable",
      educational:  "educational, value-first, teaching moments",
      promotional:  "promotional, benefit-focused, clear CTAs",
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a social media strategist who specializes in content for digital product creators. Write engaging posts that drive traffic and sales without feeling spammy. Each post should feel unique.",
        },
        {
          role: "user",
          content: "Create " + postCount + " social media posts for " + (brand ?? "CreateAI Brain") + ".\n\nPlatform: " + platformNote + "\nTone: " + (toneNote[tone ?? "professional"] ?? toneNote["professional"]) + "\n\nProduct catalog (use these for inspiration, mix it up):\n" + productList + "\n\nFormat: number each post (1., 2., etc.) with a blank line between them. Vary the angle — some product spotlights, some tips, some behind-the-scenes, some testimonial-style. Always include a store link or CTA.",
        },
      ],
      max_tokens: 3000,
      temperature: 0.8,
    });

    const posts = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ ok: true, posts, postCount, productsUsed: sample.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AI CONTENT ENGINE
// ══════════════════════════════════════════════════════════════════════════════

router.get("/content", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI Content Engine", "Content Engine") + `
    <h1>&#x270D; <em>AI Content Engine</em></h1>
    <p class="sub">Generate product descriptions, landing page copy, SEO meta tags, and sales emails from a single brief. GPT-4o writes it all.</p>
    <div class="row">
      <div class="col" style="max-width:380px;">
        <div class="panel">
          <div id="status-bar" style="display:none;" class="status-bar"></div>
          <div class="form-row">
            <label>Content Type</label>
            <select id="content-type">
              <option value="product-description">Product Description</option>
              <option value="landing-page">Landing Page Copy</option>
              <option value="seo-meta">SEO Meta Title + Description</option>
              <option value="sales-email">Sales / Promotional Email</option>
              <option value="social-bio">Brand Bio / About Section</option>
              <option value="faq">FAQ Section (5 Q&amp;As)</option>
              <option value="testimonial-request">Testimonial Request Email</option>
              <option value="upsell">Upsell / Cross-sell Copy</option>
            </select>
          </div>
          <div class="form-row">
            <label>Product or Topic</label>
            <input id="topic" type="text" placeholder="e.g. AI Business Starter Kit (ebook, $29)">
          </div>
          <div class="form-row">
            <label>Target Audience</label>
            <input id="audience" type="text" placeholder="e.g. solopreneurs, small business owners, coaches">
          </div>
          <div class="form-row">
            <label>Key Benefits / Unique Angle</label>
            <textarea id="brief" rows="4" placeholder="What makes this product special? What problem does it solve? What transformation does the buyer experience?"></textarea>
          </div>
          <div class="form-row">
            <label>Tone</label>
            <select id="tone">
              <option value="professional" selected>Professional</option>
              <option value="friendly">Friendly &amp; Warm</option>
              <option value="bold">Bold &amp; Direct</option>
              <option value="educational">Educational</option>
            </select>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn" onclick="generateContent()" id="gen-btn">&#x2726; Generate Content</button>
            <button class="btn-out" onclick="copyContent()" id="copy-btn" style="display:none;">Copy</button>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="panel" style="min-height:400px;">
          <div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Generated Content</div>
          <div id="output" class="output-box" style="min-height:360px;"><span class="output-empty">Content will appear here after generation...</span></div>
        </div>
      </div>
    </div>
    <script>
    var currentContent = '';
    async function generateContent() {
      var type     = document.getElementById('content-type').value;
      var topic    = document.getElementById('topic').value.trim();
      var audience = document.getElementById('audience').value.trim();
      var brief    = document.getElementById('brief').value.trim();
      var tone     = document.getElementById('tone').value;
      if (!topic && !brief) { showStatus('Enter a product or topic first.', false); return; }
      var btn = document.getElementById('gen-btn');
      btn.disabled = true; btn.textContent = '...Generating';
      showStatus('GPT-4o is writing your content...', null);
      try {
        var resp = await fetch('/studio/content/generate', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contentType: type, topic, audience, brief, tone })
        });
        var data = await resp.json();
        if (!data.ok) { showStatus('Error: ' + data.error, false); return; }
        currentContent = data.content;
        document.getElementById('output').textContent = data.content;
        document.getElementById('copy-btn').style.display = '';
        showStatus('Content generated. Ready to use.', true);
      } catch(e) { showStatus('Network error: ' + e.message, false); }
      finally { btn.disabled = false; btn.textContent = '&#x2726; Generate Content'; }
    }
    function copyContent() {
      navigator.clipboard.writeText(currentContent).then(function(){
        var b = document.getElementById('copy-btn');
        b.textContent='Copied!';
        setTimeout(function(){b.textContent='Copy';},1800);
      });
    }
    function showStatus(msg, ok) {
      var bar = document.getElementById('status-bar');
      bar.style.display = '';
      bar.className = 'status-bar ' + (ok===true?'ok':ok===false?'err-bar':'');
      bar.textContent = msg;
    }
    </script>
  </div></body></html>`);
});

router.post("/content/generate", async (req: Request, res: Response) => {
  try {
    const { contentType, topic, audience, brief, tone } = req.body as {
      contentType?: string; topic?: string; audience?: string; brief?: string; tone?: string;
    };
    if (!topic && !brief) { res.status(400).json({ ok: false, error: "topic or brief is required" }); return; }

    const typeInstructions: Record<string, string> = {
      "product-description": "Write a compelling product description (200-300 words) with a hook, bullet point benefits, and a CTA.",
      "landing-page":        "Write a complete landing page copy structure: Hero headline, sub-headline, 3 key benefits, social proof placeholder, and CTA section.",
      "seo-meta":            "Write: (1) SEO title tag (max 60 chars), (2) Meta description (max 160 chars), (3) 5 target keywords. Label each clearly.",
      "sales-email":         "Write a complete sales email: Subject line, personalized opening, problem agitation, solution reveal, key benefits, social proof placeholder, CTA. Under 300 words.",
      "social-bio":          "Write 3 variations of a brand bio for different contexts: (1) Twitter/X bio (160 chars max), (2) LinkedIn About (300 chars), (3) Instagram bio (150 chars).",
      "faq":                 "Write 5 FAQ entries (Q&A format) that address common buyer hesitations, objections, and questions. Make answers concise and reassuring.",
      "testimonial-request": "Write a polite, effective testimonial request email. Subject line first, then body. Under 150 words.",
      "upsell":              "Write an upsell/cross-sell message (100-150 words) that appears after purchase. Warm, not pushy. Suggest a complementary product.",
    };
    const instruction = typeInstructions[contentType ?? "product-description"] ?? typeInstructions["product-description"];

    const toneMap: Record<string, string> = {
      professional: "professional and authoritative",
      friendly:     "friendly, warm, and approachable",
      bold:         "bold, direct, and confident",
      educational:  "educational and value-first",
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert conversion copywriter for digital products. Write in a " + (toneMap[tone ?? "professional"] ?? "professional") + " tone. Use plain text only — no markdown, no asterisks, no hash symbols. Use ALL CAPS for headers and section labels.",
        },
        {
          role: "user",
          content: instruction + "\n\nProduct/Topic: " + (topic ?? "") + (audience ? "\nTarget Audience: " + audience : "") + (brief ? "\nKey Details: " + brief : ""),
        },
      ],
      max_tokens: 1200,
      temperature: 0.65,
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ ok: true, content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AI SCHEDULING LAYER
// ═══════════════════════════════════════════════════════════════════════════

router.get("/schedule", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI Scheduling Layer", "Scheduling") + `
    <h1>📅 <em>AI Scheduling Layer</em></h1>
    <p class="sub">Generate structured meeting agendas, action items, and follow-up schedules for any meeting type. No Calendly required.</p>
    <div class="row">
      <div class="col">
        <div class="panel">
          <div id="status-bar" style="display:none;" class="status-bar"></div>
          <div class="form-row">
            <label>Meeting Type</label>
            <select id="meeting-type">
              <option value="kickoff">Project Kickoff</option>
              <option value="1on1">1:1 Check-in</option>
              <option value="client-review">Client Review</option>
              <option value="standup">Team Standup</option>
              <option value="retrospective">Sprint Retrospective</option>
              <option value="sales-call">Sales Discovery Call</option>
              <option value="onboarding">Onboarding Session</option>
              <option value="strategy">Quarterly Strategy</option>
            </select>
          </div>
          <div class="form-row"><label>Attendees (roles or names)</label><input id="attendees" type="text" placeholder="e.g. CEO, Head of Marketing, Dev Lead"></div>
          <div class="form-row"><label>Duration (minutes)</label><select id="duration"><option>30</option><option selected>60</option><option>90</option><option>120</option></select></div>
          <div class="form-row"><label>Key Topics / Goals</label><textarea id="topics" rows="3" placeholder="What needs to be covered or decided? e.g. Q2 roadmap, pricing strategy, launch blockers"></textarea></div>
          <div class="form-row"><label>Follow-up Period</label><select id="followup"><option value="1week">1 Week</option><option value="2weeks" selected>2 Weeks</option><option value="1month">1 Month</option><option value="none">No follow-up schedule</option></select></div>
          <button class="btn" onclick="generateSchedule()" id="gen-btn">📅 Generate Agenda</button>
        </div>
      </div>
      <div class="col">
        <div class="panel" style="height:100%;">
          <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Generated Agenda & Action Plan</div>
          <div id="output" class="output-box" style="min-height:380px;"><span class="output-empty">Agenda will appear here...</span></div>
          <div id="copy-row" style="display:none;margin-top:10px;"><button class="btn-out" onclick="copyOut()" style="font-size:0.75rem;padding:7px 14px;">Copy Agenda</button></div>
        </div>
      </div>
    </div>
    <script>
    var out = '';
    async function generateSchedule() {
      var t = document.getElementById('meeting-type').value;
      var a = document.getElementById('attendees').value.trim();
      var d = document.getElementById('duration').value;
      var topics = document.getElementById('topics').value.trim();
      var fu = document.getElementById('followup').value;
      var btn = document.getElementById('gen-btn'); btn.disabled=true; btn.textContent='Generating...';
      showStatus('GPT-4o is building your agenda...', null);
      try {
        var r = await fetch('/studio/schedule/generate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({meetingType:t,attendees:a,duration:d,topics,followupPeriod:fu})});
        var data = await r.json();
        if (!data.ok) { showStatus('Error: '+data.error, false); return; }
        out = data.agenda;
        document.getElementById('output').textContent = out;
        document.getElementById('copy-row').style.display='';
        showStatus('Agenda ready. Copy or adjust as needed.', true);
      } catch(e) { showStatus('Network error: '+e.message, false); }
      finally { btn.disabled=false; btn.textContent='📅 Generate Agenda'; }
    }
    function copyOut() { navigator.clipboard.writeText(out).then(function(){var b=document.querySelector('#copy-row button');b.textContent='Copied!';setTimeout(function(){b.textContent='Copy Agenda';},1800);}); }
    function showStatus(msg, ok) { var b=document.getElementById('status-bar');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg; }
    </script>
  </div></body></html>`);
});

router.post("/schedule/generate", async (req: Request, res: Response) => {
  try {
    const { meetingType, attendees, duration, topics, followupPeriod } = req.body as {
      meetingType?: string; attendees?: string; duration?: string; topics?: string; followupPeriod?: string;
    };

    const typeLabels: Record<string, string> = {
      kickoff: "Project Kickoff", "1on1": "1:1 Check-in", "client-review": "Client Review",
      standup: "Team Standup", retrospective: "Sprint Retrospective",
      "sales-call": "Sales Discovery Call", onboarding: "Onboarding Session",
      strategy: "Quarterly Strategy Review",
    };
    const typeLabel = typeLabels[meetingType ?? "kickoff"] ?? "Business Meeting";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert meeting facilitator and operations consultant. Write structured, actionable meeting agendas in plain text only (no markdown, no asterisks, no hash symbols). Use ALL CAPS for section headers. Be concise and practical.`,
        },
        {
          role: "user",
          content: `Create a complete ${typeLabel} agenda for a ${duration ?? "60"}-minute meeting.
Attendees: ${attendees || "Team members"}
Key Topics/Goals: ${topics || "General alignment and planning"}
Follow-up schedule: ${followupPeriod === "none" ? "Not required" : followupPeriod ?? "2 weeks"}

Include:
1. Meeting header (type, duration, objective)
2. Pre-meeting prep (1-2 items attendees should review)
3. Timed agenda items with owner and expected output for each
4. Decision log template (3 rows)
5. Action items table (who, what, by when)
6. Follow-up schedule (if requested) — specific dates or intervals for check-ins
Keep each section clearly labeled. Total output under 600 words.`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.6,
    });

    const agenda = completion.choices[0]?.message?.content?.trim() ?? "";
    const tokensUsed = completion.usage?.total_tokens ?? 0;
    await saveAiGeneration("schedule", { meetingType, attendees, duration, topics }, agenda, tokensUsed);
    res.json({ ok: true, agenda, tokensUsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AI TRAINING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

router.get("/training", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI Training System", "Training") + `
    <h1>🎓 <em>AI Training System</em></h1>
    <p class="sub">Turn any topic or document into a complete training module with learning objectives, structured content, and a knowledge quiz. No LMS required.</p>
    <div class="row">
      <div class="col">
        <div class="panel">
          <div id="status-bar" style="display:none;" class="status-bar"></div>
          <div class="form-row"><label>Training Subject / Topic</label><input id="subject" type="text" placeholder="e.g. AI Prompt Engineering, Customer Service Excellence, GDPR Compliance"></div>
          <div class="form-row"><label>Content Brief or Outline</label><textarea id="brief" rows="4" placeholder="Paste key points, an existing document, or describe what learners need to know. The richer the input, the more targeted the module."></textarea></div>
          <div class="form-row">
            <label>Audience Level</label>
            <select id="level"><option value="beginner">Beginner — no prior knowledge</option><option value="intermediate" selected>Intermediate — some familiarity</option><option value="expert">Expert — deep dive, advanced detail</option></select>
          </div>
          <div class="form-row">
            <label>Number of Sections</label>
            <select id="sections"><option value="3">3 sections</option><option value="5" selected>5 sections</option><option value="7">7 sections</option></select>
          </div>
          <div class="form-row">
            <label>Include Knowledge Quiz?</label>
            <select id="quiz"><option value="yes" selected>Yes — 5 quiz questions</option><option value="no">No quiz</option></select>
          </div>
          <button class="btn" onclick="generateModule()" id="gen-btn">🎓 Generate Training Module</button>
        </div>
      </div>
      <div class="col">
        <div class="panel" style="height:100%;">
          <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Generated Training Module</div>
          <div id="output" class="output-box" style="min-height:400px;"><span class="output-empty">Training module will appear here...</span></div>
          <div id="copy-row" style="display:none;margin-top:10px;"><button class="btn-out" onclick="copyOut()" style="font-size:0.75rem;padding:7px 14px;">Copy Module</button></div>
        </div>
      </div>
    </div>
    <script>
    var out = '';
    async function generateModule() {
      var sub = document.getElementById('subject').value.trim();
      var brief = document.getElementById('brief').value.trim();
      var level = document.getElementById('level').value;
      var sections = document.getElementById('sections').value;
      var quiz = document.getElementById('quiz').value;
      if (!sub) { showStatus('Enter a training subject first.', false); return; }
      var btn = document.getElementById('gen-btn'); btn.disabled=true; btn.textContent='Building module...';
      showStatus('GPT-4o is building your training module...', null);
      try {
        var r = await fetch('/studio/training/generate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subject:sub,brief,level,sections:parseInt(sections),includeQuiz:quiz==='yes'})});
        var data = await r.json();
        if (!data.ok) { showStatus('Error: '+data.error, false); return; }
        out = data.module;
        document.getElementById('output').textContent = out;
        document.getElementById('copy-row').style.display='';
        showStatus('Module ready. Copy or use as-is.', true);
      } catch(e) { showStatus('Network error: '+e.message, false); }
      finally { btn.disabled=false; btn.textContent='🎓 Generate Training Module'; }
    }
    function copyOut() { navigator.clipboard.writeText(out).then(function(){var b=document.querySelector('#copy-row button');b.textContent='Copied!';setTimeout(function(){b.textContent='Copy Module';},1800);}); }
    function showStatus(msg, ok) { var b=document.getElementById('status-bar');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg; }
    </script>
  </div></body></html>`);
});

router.post("/training/generate", async (req: Request, res: Response) => {
  try {
    const { subject, brief, level, sections, includeQuiz } = req.body as {
      subject?: string; brief?: string; level?: string; sections?: number; includeQuiz?: boolean;
    };
    if (!subject) { res.status(400).json({ ok: false, error: "subject is required" }); return; }

    const levelMap: Record<string, string> = {
      beginner: "beginner level — define all terms, use simple analogies, no jargon",
      intermediate: "intermediate level — assume some baseline knowledge, go deeper on application",
      expert: "expert level — assume strong prior knowledge, focus on nuance, edge cases, and advanced application",
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert instructional designer and L&D consultant. Write training modules in plain text only (no markdown, no asterisks). Use ALL CAPS for section headers and numbered lists for content. Be precise, educational, and practically focused.`,
        },
        {
          role: "user",
          content: `Create a complete training module on: "${subject}"
Level: ${levelMap[level ?? "intermediate"] ?? levelMap["intermediate"]}
Additional context: ${brief || "No additional context provided"}

Structure the module as follows:
1. MODULE OVERVIEW — title, learning duration estimate, 3-5 learning objectives
2. PRE-REQUISITES — what learners should know beforehand
3-${(sections ?? 5) + 2}. SECTION [N]: [TITLE] — each section has: key concept, explanation (150-200 words), 2-3 practical examples or exercises
${includeQuiz ? `KNOWLEDGE CHECK — 5 multiple choice questions with 4 options each and the correct answer marked with [CORRECT]
ANSWER KEY — list all correct answers` : ""}
NEXT STEPS — 3 recommended actions to apply this training immediately

Total output: 700-900 words. Plain text only.`,
        },
      ],
      max_tokens: 1800,
      temperature: 0.6,
    });

    const module = completion.choices[0]?.message?.content?.trim() ?? "";
    const tokensUsed = completion.usage?.total_tokens ?? 0;
    await saveAiGeneration("training", { subject, level, sections, includeQuiz }, module, tokensUsed);
    res.json({ ok: true, module, tokensUsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AI FORM BUILDER
// ═══════════════════════════════════════════════════════════════════════════

router.get("/forms", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI Form Builder", "Form Builder") + `
    <h1>📋 <em>AI Form Builder</em></h1>
    <p class="sub">Describe any form in plain language. GPT-4o generates complete, ready-to-embed HTML with validation, styling, and field logic.</p>
    <div class="row">
      <div class="col">
        <div class="panel">
          <div id="status-bar" style="display:none;" class="status-bar"></div>
          <div class="form-row"><label>What does this form do? (describe plainly)</label><textarea id="purpose" rows="3" placeholder="e.g. Client intake form for a marketing agency — collects name, company, goals, budget range, and best time to contact. Professional style."></textarea></div>
          <div class="form-row">
            <label>Form Style</label>
            <select id="style">
              <option value="minimal">Minimal (clean white, sharp borders)</option>
              <option value="branded" selected>Branded (indigo accent, professional)</option>
              <option value="dark">Dark (dark background, light fields)</option>
              <option value="friendly">Friendly (rounded, warm, conversational)</option>
            </select>
          </div>
          <div class="form-row">
            <label>Submit Button Action</label>
            <select id="action">
              <option value="alert">Show thank-you message</option>
              <option value="redirect">Redirect to URL</option>
              <option value="api" selected>POST to API endpoint</option>
            </select>
          </div>
          <div class="form-row"><label>Additional Notes</label><input id="notes" type="text" placeholder="e.g. All fields required, add GDPR consent checkbox, max 6 fields"></div>
          <button class="btn" onclick="generateForm()" id="gen-btn">📋 Generate Form Code</button>
        </div>
      </div>
      <div class="col">
        <div class="panel" style="height:100%;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);">Generated HTML Form</span>
            <div id="copy-row" style="display:none;gap:8px;display:none;">
              <button class="btn-out" onclick="copyCode()" style="font-size:0.75rem;padding:7px 14px;">Copy HTML</button>
              <button class="btn-out" onclick="previewForm()" style="font-size:0.75rem;padding:7px 14px;">Preview</button>
            </div>
          </div>
          <div id="output" class="output-box" style="min-height:400px;font-size:0.78rem;"><span class="output-empty">HTML form code will appear here. Copy and embed anywhere.</span></div>
        </div>
      </div>
    </div>
    <script>
    var out = '';
    async function generateForm() {
      var purpose = document.getElementById('purpose').value.trim();
      var style = document.getElementById('style').value;
      var action = document.getElementById('action').value;
      var notes = document.getElementById('notes').value.trim();
      if (!purpose) { showStatus('Describe what this form should do first.', false); return; }
      var btn = document.getElementById('gen-btn'); btn.disabled=true; btn.textContent='Generating form...';
      showStatus('GPT-4o is writing your form code...', null);
      try {
        var r = await fetch('/studio/forms/generate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({purpose,style,action,notes})});
        var data = await r.json();
        if (!data.ok) { showStatus('Error: '+data.error, false); return; }
        out = data.html;
        document.getElementById('output').textContent = out;
        document.getElementById('copy-row').style.display='flex';
        showStatus('Form code ready. Copy and paste into any webpage.', true);
      } catch(e) { showStatus('Network error: '+e.message, false); }
      finally { btn.disabled=false; btn.textContent='📋 Generate Form Code'; }
    }
    function copyCode() { navigator.clipboard.writeText(out).then(function(){var b=document.querySelector('#copy-row button');b.textContent='Copied!';setTimeout(function(){b.textContent='Copy HTML';},1800);}); }
    function previewForm() { var w=window.open('','_blank'); w.document.write(out); w.document.close(); }
    function showStatus(msg, ok) { var b=document.getElementById('status-bar');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg; }
    </script>
  </div></body></html>`);
});

router.post("/forms/generate", async (req: Request, res: Response) => {
  try {
    const { purpose, style, action, notes } = req.body as {
      purpose?: string; style?: string; action?: string; notes?: string;
    };
    if (!purpose) { res.status(400).json({ ok: false, error: "purpose is required" }); return; }

    const styleGuide: Record<string, string> = {
      minimal:  "white background, 1px #e5e7eb borders, no box-shadow, clean sans-serif",
      branded:  "white background, indigo (#6366f1) accent for labels/focus/button, subtle box-shadow",
      dark:     "#0f172a background, #1e293b fields, #e2e8f0 text, indigo accent",
      friendly: "white background, 20px border-radius on fields, soft purple accent, conversational spacing",
    };

    const actionCode: Record<string, string> = {
      alert:    "show a styled thank-you message inside the form on submit (no page reload)",
      redirect: "redirect to a configurable URL after submit (use a data-action or placeholder URL)",
      api:      "POST form data as JSON to the form's action attribute URL (default '/api/form-submit'), show loading state and success/error message",
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert front-end developer specializing in HTML forms. Generate complete, self-contained HTML form code with inline CSS and vanilla JavaScript. Output ONLY the HTML code — no explanation, no markdown fences, no backtick wrappers. The code must be directly pasteable into a web page and work immediately.`,
        },
        {
          role: "user",
          content: `Generate a complete HTML form for: ${purpose}

Style requirements: ${styleGuide[style ?? "branded"] ?? styleGuide["branded"]}
Submit action: ${actionCode[action ?? "api"] ?? actionCode["api"]}
Additional requirements: ${notes || "None — use best judgment"}

Requirements:
- Complete self-contained HTML with DOCTYPE, head, and body
- Inline CSS only (no external stylesheets or CDN links)
- Vanilla JavaScript only (no libraries)
- Client-side validation with helpful error messages
- Accessible labels and ARIA attributes
- Mobile responsive (max-width: 480px centered container)
- All interactive states (focus, hover, disabled during submit, success, error)
Output the raw HTML code only. No explanation. No markdown.`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.4,
    });

    let html = completion.choices[0]?.message?.content?.trim() ?? "";
    // Strip any markdown code fences if GPT wrapped them
    html = html.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
    const tokensUsed = completion.usage?.total_tokens ?? 0;
    await saveAiGeneration("forms", { purpose, style, action }, html, tokensUsed);
    res.json({ ok: true, html, tokensUsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AI HELPDESK
// ═══════════════════════════════════════════════════════════════════════════

router.get("/helpdesk", async (_req: Request, res: Response) => {
  const catalog = await getRegistry().catch(() => []);
  const sampleProducts = catalog.slice(0, 8).map(p => p.title).join(", ");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(header("AI Helpdesk", "Helpdesk") + `
    <h1>🎧 <em>AI Helpdesk</em></h1>
    <p class="sub">Draft customer replies, generate FAQ entries, and create knowledge base articles from your product data. One input, three outputs.</p>
    <div style="display:flex;gap:10px;margin-bottom:18px;border-bottom:1px solid var(--line);padding-bottom:12px;">
      <button class="btn" id="tab-reply" onclick="switchTab('reply')" style="font-size:0.78rem;padding:8px 16px;">Reply Drafter</button>
      <button class="btn-out" id="tab-faq" onclick="switchTab('faq')" style="font-size:0.78rem;padding:8px 16px;">FAQ Generator</button>
      <button class="btn-out" id="tab-kb" onclick="switchTab('kb')" style="font-size:0.78rem;padding:8px 16px;">KB Article</button>
    </div>

    <div id="pane-reply">
      <div class="row">
        <div class="col">
          <div class="panel">
            <div id="status-reply" style="display:none;" class="status-bar"></div>
            <div class="form-row"><label>Customer Message</label><textarea id="customer-msg" rows="5" placeholder="Paste the customer's email or support message here. Include all context."></textarea></div>
            <div class="form-row"><label>Product Context (optional)</label><input id="product-ctx" type="text" placeholder="e.g. AI Writing Assistant (ebook)" value="${sampleProducts.split(",")[0] ?? ""}"></div>
            <div class="form-row"><label>Response Tone</label><select id="reply-tone"><option value="empathetic" selected>Empathetic & Helpful</option><option value="professional">Professional & Direct</option><option value="concise">Concise (under 100 words)</option><option value="detailed">Detailed & Thorough</option></select></div>
            <button class="btn" onclick="draftReply()" id="reply-btn">🎧 Draft Reply</button>
          </div>
        </div>
        <div class="col">
          <div class="panel" style="height:100%;">
            <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Drafted Response</div>
            <div id="reply-output" class="output-box" style="min-height:300px;"><span class="output-empty">Your drafted reply will appear here...</span></div>
            <div id="reply-copy" style="display:none;margin-top:10px;"><button class="btn-out" onclick="copyEl('reply-output','reply-copy')" style="font-size:0.75rem;padding:7px 14px;">Copy Reply</button></div>
          </div>
        </div>
      </div>
    </div>

    <div id="pane-faq" style="display:none;">
      <div class="row">
        <div class="col">
          <div class="panel">
            <div id="status-faq" style="display:none;" class="status-bar"></div>
            <div class="form-row"><label>Product or Service to Write FAQs For</label><input id="faq-product" type="text" placeholder="e.g. AI Writing Assistant (ebook, $22.80)" value="${sampleProducts.split(",")[0] ?? ""}"></div>
            <div class="form-row"><label>Common Concern Areas</label><textarea id="faq-concerns" rows="3" placeholder="e.g. refund policy, how to download, what software is needed, will this work on Mac..."></textarea></div>
            <div class="form-row"><label>Number of FAQ Entries</label><select id="faq-count"><option value="5" selected>5 entries</option><option value="8">8 entries</option><option value="12">12 entries</option></select></div>
            <button class="btn" onclick="generateFaq()" id="faq-btn">📋 Generate FAQ</button>
          </div>
        </div>
        <div class="col">
          <div class="panel" style="height:100%;">
            <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Generated FAQ</div>
            <div id="faq-output" class="output-box" style="min-height:300px;"><span class="output-empty">FAQ entries will appear here...</span></div>
            <div id="faq-copy" style="display:none;margin-top:10px;"><button class="btn-out" onclick="copyEl('faq-output','faq-copy')" style="font-size:0.75rem;padding:7px 14px;">Copy FAQ</button></div>
          </div>
        </div>
      </div>
    </div>

    <div id="pane-kb" style="display:none;">
      <div class="row">
        <div class="col">
          <div class="panel">
            <div id="status-kb" style="display:none;" class="status-bar"></div>
            <div class="form-row"><label>Article Topic</label><input id="kb-topic" type="text" placeholder="e.g. How to download and access your digital product"></div>
            <div class="form-row"><label>Key Points to Cover</label><textarea id="kb-points" rows="4" placeholder="List the main steps, concepts, or information this article should cover."></textarea></div>
            <div class="form-row"><label>Target Reader</label><select id="kb-reader"><option value="customer" selected>End Customer (non-technical)</option><option value="technical">Technical User</option><option value="reseller">Reseller / Partner</option></select></div>
            <button class="btn" onclick="generateKb()" id="kb-btn">📖 Write KB Article</button>
          </div>
        </div>
        <div class="col">
          <div class="panel" style="height:100%;">
            <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;">Knowledge Base Article</div>
            <div id="kb-output" class="output-box" style="min-height:300px;"><span class="output-empty">KB article will appear here...</span></div>
            <div id="kb-copy" style="display:none;margin-top:10px;"><button class="btn-out" onclick="copyEl('kb-output','kb-copy')" style="font-size:0.75rem;padding:7px 14px;">Copy Article</button></div>
          </div>
        </div>
      </div>
    </div>

    <script>
    function switchTab(t) {
      ['reply','faq','kb'].forEach(function(id){ document.getElementById('pane-'+id).style.display = id===t?'':'none'; document.getElementById('tab-'+id).className = id===t?'btn':'btn-out'; });
    }
    async function draftReply() {
      var msg = document.getElementById('customer-msg').value.trim();
      var ctx = document.getElementById('product-ctx').value.trim();
      var tone = document.getElementById('reply-tone').value;
      if (!msg) { showS('status-reply','Enter the customer message first.',false); return; }
      var btn = document.getElementById('reply-btn'); btn.disabled=true; btn.textContent='Drafting...';
      showS('status-reply','GPT-4o is drafting your reply...', null);
      try {
        var r = await fetch('/studio/helpdesk/draft', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customerMessage:msg,productContext:ctx,tone})});
        var d = await r.json();
        if (!d.ok) { showS('status-reply','Error: '+d.error,false); return; }
        document.getElementById('reply-output').textContent = d.reply;
        document.getElementById('reply-copy').style.display='';
        showS('status-reply','Reply drafted. Edit as needed before sending.', true);
      } catch(e) { showS('status-reply','Network error: '+e.message,false); }
      finally { btn.disabled=false; btn.textContent='🎧 Draft Reply'; }
    }
    async function generateFaq() {
      var product = document.getElementById('faq-product').value.trim();
      var concerns = document.getElementById('faq-concerns').value.trim();
      var count = document.getElementById('faq-count').value;
      if (!product) { showS('status-faq','Enter a product name first.',false); return; }
      var btn = document.getElementById('faq-btn'); btn.disabled=true; btn.textContent='Generating...';
      showS('status-faq','GPT-4o is writing your FAQ...', null);
      try {
        var r = await fetch('/studio/helpdesk/faq', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product,concerns,count:parseInt(count)})});
        var d = await r.json();
        if (!d.ok) { showS('status-faq','Error: '+d.error,false); return; }
        document.getElementById('faq-output').textContent = d.faq;
        document.getElementById('faq-copy').style.display='';
        showS('status-faq','FAQ ready.', true);
      } catch(e) { showS('status-faq','Network error: '+e.message,false); }
      finally { btn.disabled=false; btn.textContent='📋 Generate FAQ'; }
    }
    async function generateKb() {
      var topic = document.getElementById('kb-topic').value.trim();
      var points = document.getElementById('kb-points').value.trim();
      var reader = document.getElementById('kb-reader').value;
      if (!topic) { showS('status-kb','Enter the article topic first.',false); return; }
      var btn = document.getElementById('kb-btn'); btn.disabled=true; btn.textContent='Writing...';
      showS('status-kb','GPT-4o is writing your KB article...', null);
      try {
        var r = await fetch('/studio/helpdesk/kb', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,keyPoints:points,targetReader:reader})});
        var d = await r.json();
        if (!d.ok) { showS('status-kb','Error: '+d.error,false); return; }
        document.getElementById('kb-output').textContent = d.article;
        document.getElementById('kb-copy').style.display='';
        showS('status-kb','Article ready.', true);
      } catch(e) { showS('status-kb','Network error: '+e.message,false); }
      finally { btn.disabled=false; btn.textContent='📖 Write KB Article'; }
    }
    function copyEl(elId, rowId) {
      var text = document.getElementById(elId).textContent;
      navigator.clipboard.writeText(text).then(function(){ var b=document.querySelector('#'+rowId+' button'); b.textContent='Copied!'; setTimeout(function(){b.textContent=b.textContent.includes('FAQ')?'Copy FAQ':b.textContent.includes('Article')?'Copy Article':'Copy Reply';},1800); });
    }
    function showS(barId, msg, ok) { var b=document.getElementById(barId);b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg; }
    </script>
  </div></body></html>`);
});

router.post("/helpdesk/draft", async (req: Request, res: Response) => {
  try {
    const { customerMessage, productContext, tone } = req.body as {
      customerMessage?: string; productContext?: string; tone?: string;
    };
    if (!customerMessage) { res.status(400).json({ ok: false, error: "customerMessage is required" }); return; }

    const toneMap: Record<string, string> = {
      empathetic:   "empathetic, warm, and genuinely helpful — acknowledge the customer's situation first",
      professional: "professional, direct, and solution-focused",
      concise:      "very concise — under 100 words — polite but efficient",
      detailed:     "thorough and detailed — walk through every step clearly",
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert customer support specialist for a digital products platform (CreateAI Brain). Write support replies in plain text only — no markdown, no asterisks. Be ${toneMap[tone ?? "empathetic"] ?? toneMap["empathetic"]}. Always end with a clear next step or offer to help further.`,
        },
        {
          role: "user",
          content: `Draft a customer support reply to this message:\n\n"${customerMessage}"${productContext ? `\n\nProduct context: ${productContext}` : ""}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.5,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    const tokensUsed = completion.usage?.total_tokens ?? 0;
    await saveAiGeneration("helpdesk-reply", { tone, productContext }, reply, tokensUsed);
    res.json({ ok: true, reply, tokensUsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post("/helpdesk/faq", async (req: Request, res: Response) => {
  try {
    const { product, concerns, count } = req.body as {
      product?: string; concerns?: string; count?: number;
    };
    if (!product) { res.status(400).json({ ok: false, error: "product is required" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert customer success writer. Write FAQ entries in plain text only (no markdown). Format each entry as: Q: [question] / A: [answer]. Number each entry. Answers should be 2-4 sentences — reassuring, clear, and action-oriented.`,
        },
        {
          role: "user",
          content: `Write ${count ?? 5} FAQ entries for: "${product}"${concerns ? `\n\nFocus on these concern areas: ${concerns}` : ""}

Cover the most common buyer questions: how to access/download, format compatibility, refund policy, licensing, what's included, how to use it, and support options. Make answers confident and reassuring.`,
        },
      ],
      max_tokens: 900,
      temperature: 0.5,
    });

    const faq = completion.choices[0]?.message?.content?.trim() ?? "";
    const tokensUsed = completion.usage?.total_tokens ?? 0;
    await saveAiGeneration("helpdesk-faq", { product, count }, faq, tokensUsed);
    res.json({ ok: true, faq, tokensUsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post("/helpdesk/kb", async (req: Request, res: Response) => {
  try {
    const { topic, keyPoints, targetReader } = req.body as {
      topic?: string; keyPoints?: string; targetReader?: string;
    };
    if (!topic) { res.status(400).json({ ok: false, error: "topic is required" }); return; }

    const readerMap: Record<string, string> = {
      customer:  "non-technical end customer — use simple language, step-by-step instructions, no jargon",
      technical: "technical user who is comfortable with software and web concepts",
      reseller:  "reseller or affiliate partner who needs to understand the product to sell it",
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert technical writer for a digital products platform. Write knowledge base articles in plain text only (no markdown). Use ALL CAPS for section headers. Write for: ${readerMap[targetReader ?? "customer"] ?? readerMap["customer"]}. Be clear, complete, and scannable.`,
        },
        {
          role: "user",
          content: `Write a knowledge base article about: "${topic}"${keyPoints ? `\n\nKey points to cover: ${keyPoints}` : ""}

Structure:
OVERVIEW — 2-sentence summary of what this article covers
WHO THIS IS FOR — target audience and prerequisites
STEP BY STEP (if procedural) or KEY CONCEPTS (if informational) — the main content
COMMON ISSUES — 2-3 troubleshooting scenarios with solutions
RELATED RESOURCES — 2-3 suggested next steps or related topics
NEED MORE HELP — brief support CTA

Total: 350-500 words. Plain text only.`,
        },
      ],
      max_tokens: 900,
      temperature: 0.5,
    });

    const article = completion.choices[0]?.message?.content?.trim() ?? "";
    const tokensUsed = completion.usage?.total_tokens ?? 0;
    await saveAiGeneration("helpdesk-kb", { topic, targetReader }, article, tokensUsed);
    res.json({ ok: true, article, tokensUsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

export default router;
