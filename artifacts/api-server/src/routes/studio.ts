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
import { openai }          from "@workspace/integrations-openai-ai-server";
import { sendEmailNotification } from "../utils/notifications.js";
import { getPublicBaseUrl } from "../utils/publicUrl.js";

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
  { id: "email",    icon: "✉",  name: "AI Email Engine",         desc: "Write and send newsletters, campaigns, or one-off emails using GPT-4o. Resend delivers. No Mailchimp required.",        live: true },
  { id: "docs",     icon: "📄", name: "AI Document Generator",   desc: "Generate contracts, proposals, SOPs, intake forms, or any structured document from a brief in seconds.",              live: true },
  { id: "schedule", icon: "📅", name: "AI Scheduling Layer",     desc: "Booking links, appointment reminders, and calendar management — AI-driven, no Calendly.",                             live: false },
  { id: "training", icon: "🎓", name: "AI Training System",      desc: "Turn any document into a full training module with quiz and certificate. No LMS required.",                           live: false },
  { id: "crm",      icon: "👥", name: "AI CRM & Follow-up",      desc: "AI-generated follow-up sequences, churn prediction, and customer intelligence. Powered by your purchase data.",       live: false },
  { id: "analytics",icon: "📊", name: "AI Analytics Summaries",  desc: "Zero-config weekly business intelligence reports in plain English. The platform writes the summary automatically.",    live: false },
  { id: "social",   icon: "📱", name: "AI Social Scheduler",     desc: "Generate a month of social posts from your product catalog. Queue and publish with one action.",                       live: false },
  { id: "forms",    icon: "📋", name: "AI Form Builder",         desc: "Describe any form in natural language. Platform generates it as a hosted page and collects responses natively.",        live: false },
  { id: "helpdesk", icon: "🎧", name: "AI Helpdesk",             desc: "FAQ generation, draft email responses, and knowledge base creation from your product and service data.",               live: false },
  { id: "content",  icon: "✍",  name: "AI Content Engine",       desc: "Product descriptions, social captions, SEO copy, and sales emails from a single brief.",                              live: false },
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

export default router;
