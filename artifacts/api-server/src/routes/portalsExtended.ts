/**
 * routes/portalsExtended.ts — Public & Semi-Public Portals
 * ──────────────────────────────────────────────────────────
 * Public-facing portals (no admin auth required):
 *   /portal/book      → Appointment booking (public)
 *   /portal/review    → Review submission (public)
 *   /portal/consult   → Async consultation / AI pre-assessment (healthcare invention)
 *   /portal/donor     → Donor giving history (email-gated)
 *   /portal/student   → Student course access (email-gated)
 *   /portal/client    → Client project/time view (email-gated)
 */

import { Router, type Request, type Response } from "express";
import { openai }            from "@workspace/integrations-openai-ai-server";
import { getPublicBaseUrl }  from "../utils/publicUrl.js";
import {
  createAppointment,
  submitReview,
  findCustomersByEmail,
  getTrackers,
  getTimeEntries,
  getTimeSummary,
  getLoyaltyBalance,
  getApprovedReviews,
  saveAiGeneration,
  saveFormSubmission,
} from "../lib/db.js";

const router = Router();
const BASE   = getPublicBaseUrl();

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{--bg:#020617;--s1:#0d1526;--s2:#111827;--s3:#1e293b;--line:#1e293b;--line2:#2d3748;--t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;--ind:#6366f1;--em:#10b981;--am:#f59e0b;--re:#f87171;}
  html{scroll-behavior:smooth;}
  html,body{background:var(--bg);color:var(--t1);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;min-height:100vh;-webkit-font-smoothing:antialiased;line-height:1.5;}
  a{color:var(--ind);}
  .skip-link{position:absolute;top:-100%;left:8px;z-index:9999;background:var(--ind);color:#fff;padding:10px 18px;border-radius:0 0 10px 10px;font-size:13px;font-weight:700;text-decoration:none;transition:top .15s;}
  .skip-link:focus{top:0;}
  .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;}
  .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:40;}
  .hdr-inner{max-width:680px;margin:0 auto;height:56px;display:flex;align-items:center;gap:16px;}
  .logo{font-size:1rem;font-weight:900;letter-spacing:-.03em;color:var(--t1);text-decoration:none;}
  .logo span{color:var(--ind);}
  .hdr-nav{display:flex;gap:16px;margin-left:auto;align-items:center;}
  .hdr-link{font-size:.78rem;font-weight:600;color:var(--t3);text-decoration:none;transition:color .15s;}
  .hdr-link:hover,.hdr-link:focus-visible{color:var(--t1);}
  .hdr-link:focus-visible{outline:2px solid var(--ind);outline-offset:2px;border-radius:4px;}
  .wrap{max-width:680px;margin:0 auto;padding:36px 24px 64px;}
  h1{font-size:1.6rem;font-weight:900;letter-spacing:-.04em;margin-bottom:6px;}
  h1 em{color:#818cf8;font-style:normal;}
  .sub{font-size:.82rem;color:var(--t3);margin-bottom:28px;line-height:1.5;}
  .card{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:24px;margin-bottom:18px;}
  .form-row{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
  .form-row label{font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);}
  input,textarea,select{background:var(--s1);border:1.5px solid var(--line);border-radius:8px;padding:10px 12px;color:var(--t1);font-size:.9rem;font-family:inherit;width:100%;outline:none;transition:border-color .15s,box-shadow .15s;resize:vertical;}
  input:focus,textarea:focus,select:focus{border-color:var(--ind);box-shadow:0 0 0 3px rgba(99,102,241,.15);}
  input:focus-visible,textarea:focus-visible,select:focus-visible{border-color:var(--ind);box-shadow:0 0 0 3px rgba(99,102,241,.15);}
  input::placeholder,textarea::placeholder{color:var(--t4);}
  .btn{background:var(--ind);color:#fff;border:none;border-radius:10px;padding:13px 24px;font-size:.9rem;font-weight:800;cursor:pointer;transition:opacity .15s,box-shadow .15s;width:100%;}
  .btn:hover{opacity:.85;}
  .btn:focus-visible{opacity:.85;outline:2px solid #818cf8;outline-offset:2px;}
  .btn:disabled{opacity:.4;cursor:not-allowed;}
  .btn-out{background:transparent;color:var(--t2);border:1px solid var(--line2);border-radius:9px;padding:10px 20px;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .15s;margin-top:8px;width:100%;}
  .btn-out:hover{border-color:var(--ind);color:var(--t1);}
  .btn-out:focus-visible{border-color:var(--ind);color:var(--t1);outline:2px solid var(--ind);outline-offset:2px;}
  .status-bar{font-size:.78rem;padding:10px 14px;border-radius:8px;margin-bottom:14px;line-height:1.5;}
  .ok{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);color:var(--em);}
  .err-bar{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);color:var(--re);}
  .info{background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);color:#a5b4fc;}
  .success-screen{text-align:center;padding:40px 20px;}
  .success-icon{font-size:3rem;margin-bottom:12px;}
  .success-title{font-size:1.3rem;font-weight:900;margin-bottom:8px;}
  .success-sub{font-size:.84rem;color:var(--t2);line-height:1.6;}
  .purchase-card{background:var(--s1);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:10px;}
  .pc-title{font-weight:700;font-size:.9rem;}
  .pc-sub{font-size:.75rem;color:var(--t3);margin-top:3px;}
  .pc-price{font-size:.82rem;font-weight:700;color:var(--ind);margin-top:4px;}
  .stat-row{display:flex;gap:12px;margin-bottom:20px;}
  .stat{background:var(--s1);border:1px solid var(--line);border-radius:10px;padding:14px;flex:1;text-align:center;}
  .stat-val{font-size:1.3rem;font-weight:900;color:var(--ind);}
  .stat-lbl{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);margin-top:2px;}
  .stars{color:var(--am);font-size:1.1rem;}
  .output-box{background:var(--s1);border:1px solid var(--line);border-radius:10px;padding:16px;font-size:.82rem;line-height:1.7;color:var(--t2);white-space:pre-wrap;word-break:break-word;min-height:120px;}
  .divider{height:1px;background:var(--line);margin:20px 0;}
  .badge{display:inline-block;font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;padding:3px 8px;border-radius:99px;}
  .badge-green{background:rgba(16,185,129,.1);color:#34d399;border:1px solid rgba(16,185,129,.2);}
  .badge-blue{background:rgba(56,189,248,.1);color:#7dd3fc;border:1px solid rgba(56,189,248,.2);}
  .portal-footer{border-top:1px solid var(--line);padding:24px;text-align:center;font-size:.72rem;color:var(--t4);margin-top:32px;}
  .portal-footer a{color:var(--t3);text-decoration:none;margin:0 8px;}
  .portal-footer a:hover{color:var(--t1);}
  @media(max-width:600px){.hdr{padding:0 16px;}.wrap{padding:24px 16px 48px;}}
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;}}
`;

function portalPage(title: string, bodyHtml: string, footerNote = ""): string {
  const yr = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${title} — CreateAI Brain</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<a class="skip-link" href="#portal-main">Skip to main content</a>
<header>
  <nav class="hdr" aria-label="Portal navigation">
    <div class="hdr-inner">
      <a class="logo" href="${BASE}" aria-label="CreateAI Brain home">Create<span>AI</span> Brain</a>
      <div class="hdr-nav" role="navigation" aria-label="Portal links">
        <a class="hdr-link" href="${BASE}/api/semantic/store">Store</a>
        <a class="hdr-link" href="${BASE}/api/semantic/portal/me">My Downloads</a>
        <a class="hdr-link" href="${BASE}">Home</a>
      </div>
    </div>
  </nav>
</header>
<main id="portal-main">
  <div class="wrap">
    ${bodyHtml}
    ${footerNote ? `<p style="font-size:.68rem;color:var(--t4);margin-top:24px;text-align:center;line-height:1.5;">${footerNote}</p>` : ""}
  </div>
</main>
<footer class="portal-footer">
  <div>
    <a href="${BASE}/api/semantic/store">Store</a>
    <a href="${BASE}/api/semantic/portal/me">My Downloads</a>
    <a href="${BASE}/portal/book">Book Appointment</a>
    <a href="${BASE}/portal/review">Leave Review</a>
  </div>
  <div style="margin-top:8px;">© ${yr} CreateAI Brain · Lakeside Trinity LLC</div>
</footer>
</body>
</html>`;
}

// ── GET /portal/book — Public Booking Page ────────────────────────────────────

router.get("/book", (_req: Request, res: Response) => {
  const html = `
    <h1>📅 <em>Book an Appointment</em></h1>
    <p class="sub">Fill out the form below and we'll confirm your appointment within 24 hours.</p>
    <div class="card">
      <div id="book-status" class="status-bar" style="display:none;"></div>
      <div id="book-form">
        <div class="form-row"><label>Full Name</label><input id="b-name" placeholder="Your full name"></div>
        <div class="form-row"><label>Email</label><input id="b-email" type="email" placeholder="you@example.com"></div>
        <div class="form-row"><label>Phone (optional)</label><input id="b-phone" type="tel" placeholder="+1 555 000 0000"></div>
        <div class="form-row"><label>Appointment Type</label>
          <select id="b-type">
            <option value="consultation">Initial Consultation</option>
            <option value="discovery-call">Discovery Call</option>
            <option value="service-appointment">Service Appointment</option>
            <option value="intake">Intake Session</option>
            <option value="coaching">Coaching Session</option>
            <option value="demo">Demo / Walkthrough</option>
            <option value="inspection">Inspection / Site Visit</option>
            <option value="follow-up">Follow-up Appointment</option>
          </select>
        </div>
        <div class="form-row"><label>Preferred Date & Time</label><input id="b-date" placeholder="e.g. Tuesday March 25 anytime after 2pm, or flexible this week"></div>
        <div class="form-row"><label>Notes / What This Is About</label><textarea id="b-notes" rows="3" placeholder="Tell us what you'd like to discuss or what brings you here..."></textarea></div>
        <button class="btn" onclick="submitBook()">Request Appointment</button>
      </div>
      <div id="book-success" style="display:none;" class="success-screen">
        <div class="success-icon">✅</div>
        <div class="success-title">Request Received!</div>
        <div class="success-sub">We've received your appointment request and will confirm within 24 hours. Check your inbox for a confirmation email.</div>
      </div>
    </div>
  `;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(portalPage("Book an Appointment", html + `
    <script>
    async function submitBook(){
      var name=document.getElementById('b-name').value.trim();
      var email=document.getElementById('b-email').value.trim();
      var phone=document.getElementById('b-phone').value.trim();
      var type=document.getElementById('b-type').value;
      var date=document.getElementById('b-date').value.trim();
      var notes=document.getElementById('b-notes').value.trim();
      if(!name||!email){showBS('Please enter your name and email.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Submitting...';
      try{
        var r=await fetch('`+BASE+`/portal/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,phone,type,preferredDate:date,notes})});
        var d=await r.json();
        if(d.ok){document.getElementById('book-form').style.display='none';document.getElementById('book-success').style.display='';}
        else{showBS('Submission error: '+d.error,false);btn.disabled=false;btn.textContent='Request Appointment';}
      }catch(e){showBS('Network error. Please try again.',false);btn.disabled=false;btn.textContent='Request Appointment';}
    }
    function showBS(msg,ok){var b=document.getElementById('book-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'info');b.textContent=msg;}
    </script>
  `));
});

router.post("/book", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, type, preferredDate, notes } = req.body as Record<string, string>;
    if (!name || !email) { res.status(400).json({ ok: false, error: "name and email required" }); return; }
    const id = await createAppointment({ type: type ?? "consultation", name, email, phone: phone ?? "", preferredDate: preferredDate ?? "", notes: notes ?? "" });
    res.json({ ok: true, id });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// ── GET /portal/review — Review Submission ─────────────────────────────────────

router.get("/review", (req: Request, res: Response) => {
  const productId    = String(req.query["product"] ?? "");
  const productTitle = String(req.query["title"] ?? "a product");

  const html = `
    <h1>⭐ <em>Leave a Review</em></h1>
    <p class="sub">Your feedback helps others and supports our community. Thank you for taking a moment to share.</p>
    <div class="card">
      <div id="rev-status" class="status-bar" style="display:none;"></div>
      <div id="rev-form">
        <div style="margin-bottom:16px;font-size:.84rem;color:var(--t2);">Reviewing: <strong style="color:var(--t1);">${productTitle}</strong></div>
        <div class="form-row"><label>Your Name</label><input id="r-name" placeholder="First name, or initials"></div>
        <div class="form-row"><label>Your Email</label><input id="r-email" type="email" placeholder="Used to verify purchase — not displayed publicly"></div>
        <div class="form-row"><label>Rating</label>
          <select id="r-rating">
            <option value="5">★★★★★ — Excellent (5/5)</option>
            <option value="4">★★★★☆ — Very Good (4/5)</option>
            <option value="3">★★★☆☆ — Good (3/5)</option>
            <option value="2">★★☆☆☆ — Fair (2/5)</option>
            <option value="1">★☆☆☆☆ — Poor (1/5)</option>
          </select>
        </div>
        <div class="form-row"><label>Your Review</label><textarea id="r-text" rows="4" placeholder="What did you like about it? Who would you recommend it to? How did it help you?"></textarea></div>
        <button class="btn" onclick="submitRev()">Submit Review</button>
      </div>
      <div id="rev-success" style="display:none;" class="success-screen">
        <div class="success-icon">⭐</div>
        <div class="success-title">Review Submitted!</div>
        <div class="success-sub">Thank you! Your review will appear after a quick approval check. We appreciate you taking the time.</div>
      </div>
    </div>
  `;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(portalPage("Leave a Review", html + `
    <script>
    async function submitRev(){
      var name=document.getElementById('r-name').value.trim();var email=document.getElementById('r-email').value.trim();var rating=document.getElementById('r-rating').value;var text=document.getElementById('r-text').value.trim();
      if(!name||!email||!text){showRS('Please fill in all fields.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Submitting...';
      try{
        var r=await fetch('`+BASE+`/portal/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:'`+productId+`',productTitle:'`+productTitle.replace(/'/g, "\\'")+`',customerName:name,customerEmail:email,rating:parseInt(rating),reviewText:text})});
        var d=await r.json();
        if(d.ok){document.getElementById('rev-form').style.display='none';document.getElementById('rev-success').style.display='';}
        else{showRS('Error: '+d.error,false);btn.disabled=false;btn.textContent='Submit Review';}
      }catch(e){showRS('Network error.',false);btn.disabled=false;btn.textContent='Submit Review';}
    }
    function showRS(msg,ok){var b=document.getElementById('rev-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'info');b.textContent=msg;}
    </script>
  `));
});

router.post("/review", async (req: Request, res: Response) => {
  try {
    const { productId, productTitle, customerEmail, customerName, rating, reviewText } = req.body as Record<string, unknown>;
    if (!customerEmail || !reviewText) { res.status(400).json({ ok: false, error: "email and review required" }); return; }
    const id = await submitReview({ productId: String(productId ?? ""), productTitle: String(productTitle ?? ""), customerEmail: String(customerEmail), customerName: String(customerName ?? ""), rating: Number(rating ?? 5), reviewText: String(reviewText) });
    res.json({ ok: true, id });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// ── GET /portal/consult — Async Consultation (Healthcare Invention) ────────────

router.get("/consult", (_req: Request, res: Response) => {
  const html = `
    <h1>🩺 <em>Async Consultation</em></h1>
    <p class="sub">No video call required. Complete this secure health assessment and receive an AI-prepared summary your provider will review and respond to within 24–48 hours.</p>
    <div class="card" style="background:rgba(245,158,11,.04);border-color:rgba(245,158,11,.2);padding:12px 16px;margin-bottom:18px;">
      <div style="font-size:.75rem;color:var(--am);line-height:1.5;"><strong style="color:#fcd34d;">⚠ Important:</strong> This is not emergency care. If you are experiencing a medical emergency, call 911 immediately. This tool supports — it does not replace — in-person clinical evaluation.</div>
    </div>
    <div class="card">
      <div id="c-status" class="status-bar" style="display:none;"></div>
      <div id="c-form">
        <div style="font-size:.78rem;font-weight:700;color:var(--t3);margin-bottom:14px;text-transform:uppercase;letter-spacing:.07em;">Step 1 — Your Information</div>
        <div class="form-row"><label>First Name (or initials for privacy)</label><input id="c-name" placeholder="e.g. Sara or S.S."></div>
        <div class="form-row"><label>Contact Email</label><input id="c-email" type="email" placeholder="your@email.com — for provider response"></div>
        <div class="form-row"><label>Date of Birth</label><input id="c-dob" type="date"></div>
        <div class="form-row"><label>Biological Sex</label>
          <select id="c-sex"><option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other / Non-binary</option></select>
        </div>
        <div class="divider"></div>
        <div style="font-size:.78rem;font-weight:700;color:var(--t3);margin-bottom:14px;text-transform:uppercase;letter-spacing:.07em;">Step 2 — Chief Complaint</div>
        <div class="form-row"><label>What is the main reason for this consultation?</label><textarea id="c-complaint" rows="2" placeholder="e.g. Persistent lower back pain that started 2 weeks ago after moving boxes..."></textarea></div>
        <div class="form-row"><label>How long have you had this problem?</label><input id="c-duration" placeholder="e.g. 2 weeks, or 3 days, or ongoing for 6 months"></div>
        <div class="form-row"><label>Rate your symptom severity (1=mild, 10=severe)</label>
          <select id="c-severity"><option value="1">1 — Very Mild</option><option value="3">3 — Mild</option><option value="5">5 — Moderate</option><option value="7">7 — Moderately Severe</option><option value="9">9 — Severe</option><option value="10">10 — Very Severe / Unbearable</option></select>
        </div>
        <div class="divider"></div>
        <div style="font-size:.78rem;font-weight:700;color:var(--t3);margin-bottom:14px;text-transform:uppercase;letter-spacing:.07em;">Step 3 — Symptom Details</div>
        <div class="form-row"><label>Describe your symptoms in detail</label><textarea id="c-symptoms" rows="4" placeholder="Where is it located? Does it spread anywhere? What does it feel like (sharp, dull, burning, aching)? What makes it better or worse? Does it come and go or is it constant?"></textarea></div>
        <div class="form-row"><label>Current Medications & Dosages</label><textarea id="c-meds" rows="2" placeholder="List all current medications including OTC, vitamins, supplements..."></textarea></div>
        <div class="form-row"><label>Known Allergies</label><input id="c-allergies" placeholder="Drug allergies, or 'NKA' for none"></div>
        <div class="form-row"><label>Relevant Medical History</label><textarea id="c-history" rows="2" placeholder="Past diagnoses, surgeries, hospitalizations relevant to this complaint..."></textarea></div>
        <div class="form-row"><label>Anything else you want the provider to know?</label><textarea id="c-extra" rows="2" placeholder="Recent travel, stress, dietary changes, any other concerns..."></textarea></div>
        <button class="btn" onclick="submitConsult()">Submit Health Assessment</button>
      </div>
      <div id="c-success" style="display:none;" class="success-screen">
        <div class="success-icon">🩺</div>
        <div class="success-title">Assessment Submitted</div>
        <div class="success-sub">Your AI-prepared clinical summary has been generated and is ready for provider review. You will receive a response at your contact email within 24–48 hours.<br><br>If symptoms worsen significantly before then, please seek in-person care.</div>
        <div id="c-ai-summary" class="output-box" style="margin-top:16px;text-align:left;display:none;"></div>
      </div>
    </div>
  `;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(portalPage("Async Health Consultation", html + `
    <script>
    async function submitConsult(){
      var name=document.getElementById('c-name').value.trim();var email=document.getElementById('c-email').value.trim();var complaint=document.getElementById('c-complaint').value.trim();var symptoms=document.getElementById('c-symptoms').value.trim();
      if(!email||!complaint){showCS('Please enter your contact email and chief complaint.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Submitting & generating AI summary...';
      showCS('Generating AI-prepared clinical summary for your provider...', null);
      try{
        var payload={name,email,dob:document.getElementById('c-dob').value,sex:document.getElementById('c-sex').value,complaint,duration:document.getElementById('c-duration').value,severity:document.getElementById('c-severity').value,symptoms,medications:document.getElementById('c-meds').value.trim(),allergies:document.getElementById('c-allergies').value.trim(),history:document.getElementById('c-history').value.trim(),extra:document.getElementById('c-extra').value.trim()};
        var r=await fetch('`+BASE+`/portal/consult',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        var d=await r.json();
        if(d.ok){
          document.getElementById('c-form').style.display='none';
          document.getElementById('c-success').style.display='';
          if(d.summary){var box=document.getElementById('c-ai-summary');box.style.display='';box.textContent='YOUR AI-PREPARED PROVIDER SUMMARY:\n\n'+d.summary;}
        }else{showCS('Error: '+d.error,false);btn.disabled=false;btn.textContent='Submit Health Assessment';}
      }catch(e){showCS('Network error.',false);btn.disabled=false;btn.textContent='Submit Health Assessment';}
    }
    function showCS(msg,ok){var b=document.getElementById('c-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'info');b.textContent=msg;}
    </script>
  `, "This async consultation service does not establish a patient-provider relationship and does not constitute medical advice. Always consult a licensed healthcare provider for diagnosis and treatment."));
});

router.post("/consult", async (req: Request, res: Response) => {
  try {
    const b = req.body as Record<string, string>;
    await saveFormSubmission("async-consult", "Async Health Consultation", { email: b["email"], complaint: b["complaint"], duration: b["duration"], severity: b["severity"] }, "");

    let summary = "";
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: "You are a clinical documentation specialist preparing an async consultation summary for a licensed provider to review. Write a structured clinical intake summary in plain text. This is provider-facing — be clinical, precise, and flag any concerning features. Do NOT provide diagnoses or treatment recommendations — only organize the patient's self-reported information into a structured format for the provider. Note any red flag symptoms that require urgent evaluation."
        }, {
          role: "user",
          content: "Prepare a provider-ready clinical intake summary for the following patient self-report:\n\nChief Complaint: " + (b["complaint"] || "") + "\nDuration: " + (b["duration"] || "Not specified") + "\nSeverity: " + (b["severity"] || "") + "/10\nSymptoms: " + (b["symptoms"] || "") + "\nMedications: " + (b["medications"] || "None listed") + "\nAllergies: " + (b["allergies"] || "Not specified") + "\nMedical History: " + (b["history"] || "Not provided") + "\nAdditional Notes: " + (b["extra"] || "None") + "\nPatient Sex: " + (b["sex"] || "Not specified") + "\n\nFormat as: CHIEF COMPLAINT, HISTORY OF PRESENT ILLNESS, MEDICATIONS & ALLERGIES, RELEVANT HISTORY, RED FLAG SYMPTOMS (list any urgent indicators), SUGGESTED EVALUATION FOCUS."
        }],
        max_tokens: 1200,
        temperature: 0.3,
      });
      summary = completion.choices[0]?.message?.content?.trim() ?? "";
      await saveAiGeneration("async-consult", { email: b["email"], complaint: b["complaint"] }, summary, completion.usage?.total_tokens ?? 0);
    } catch { /* don't fail the whole submission if AI errors */ }

    res.json({ ok: true, summary });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// ── GET /portal/donor — Donor Portal ─────────────────────────────────────────

router.get("/donor", (_req: Request, res: Response) => {
  const html = `
    <h1>💝 <em>Donor Portal</em></h1>
    <p class="sub">View your giving history, impact summary, and loyalty points. Enter your email to access your donor account.</p>
    <div class="card">
      <div id="d-lookup-status" class="status-bar" style="display:none;"></div>
      <div id="d-lookup">
        <div class="form-row"><label>Your Email Address</label><input id="d-email" type="email" placeholder="email@example.com" onkeydown="if(event.key==='Enter')lookupDonor()"></div>
        <button class="btn" onclick="lookupDonor()">View My Giving History</button>
      </div>
      <div id="d-results" style="display:none;"></div>
    </div>
  `;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(portalPage("Donor Portal", html + `
    <script>
    async function lookupDonor(){
      var email=document.getElementById('d-email').value.trim();
      if(!email){showDLS('Please enter your email.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Looking up...';
      try{
        var r=await fetch('`+BASE+`/portal/donor/lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
        var d=await r.json();
        if(d.ok){renderDonor(d);}
        else{showDLS(d.error||'Not found.',false);}
      }catch(e){showDLS('Network error.',false);}
      finally{btn.disabled=false;btn.textContent='View My Giving History';}
    }
    function showDLS(msg,ok){var b=document.getElementById('d-lookup-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'info');b.textContent=msg;}
    function renderDonor(d){
      document.getElementById('d-lookup').style.display='none';
      var html='<div style="font-size:.82rem;color:var(--t3);margin-bottom:16px;">Account: <strong style="color:var(--t1);">'+d.email+'</strong></div>';
      html+='<div class="stat-row">';
      html+='<div class="stat"><div class="stat-val">'+d.transactions+'</div><div class="stat-lbl">Transactions</div></div>';
      html+='<div class="stat"><div class="stat-val">$'+d.totalGiven+'</div><div class="stat-lbl">Total Given</div></div>';
      html+='<div class="stat"><div class="stat-val">'+d.loyaltyBalance+'</div><div class="stat-lbl">Loyalty Points</div></div>';
      html+='</div>';
      if(d.purchases&&d.purchases.length){
        html+='<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);margin-bottom:10px;">Giving History</div>';
        d.purchases.forEach(function(p){
          html+='<div class="purchase-card"><div class="pc-title">'+p.productTitle+'</div><div class="pc-sub">'+new Date(p.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})+'</div><div class="pc-price">$'+(p.priceCents/100).toFixed(2)+'</div></div>';
        });
      }else{
        html+='<div style="text-align:center;color:var(--t4);font-size:.82rem;padding:20px;">No transactions found for this email.</div>';
      }
      if(d.loyaltyBalance>0){html+='<div class="card" style="margin-top:16px;background:rgba(99,102,241,.05);border-color:rgba(99,102,241,.2);"><div style="font-size:.82rem;color:#a5b4fc;line-height:1.6;"><strong style="color:var(--t1);">⭐ Your Loyalty Points: '+d.loyaltyBalance+'</strong><br>Points can be redeemed for discounts on future purchases. Contact us to redeem.</div></div>';}
      document.getElementById('d-results').innerHTML=html;
      document.getElementById('d-results').style.display='';
    }
    </script>
  `));
});

router.post("/donor/lookup", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ ok: false, error: "email required" }); return; }
    const [purchases, loyaltyBalance] = await Promise.all([findCustomersByEmail(email), getLoyaltyBalance(email)]);
    if (purchases.length === 0 && loyaltyBalance === 0) {
      res.json({ ok: false, error: "No account found for this email. Please check your email or contact us." });
      return;
    }
    const totalGiven = (purchases.reduce((s, p) => s + p.priceCents, 0) / 100).toFixed(2);
    res.json({ ok: true, email: email.toLowerCase(), transactions: purchases.length, totalGiven, loyaltyBalance, purchases: purchases.slice(0, 20).map(p => ({ productTitle: p.productTitle, priceCents: p.priceCents, createdAt: p.createdAt })) });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// ── GET /portal/student — Student Portal ──────────────────────────────────────

router.get("/student", (_req: Request, res: Response) => {
  const html = `
    <h1>🎓 <em>Student Portal</em></h1>
    <p class="sub">Access your purchased courses and digital materials. Enter your email to view your library.</p>
    <div class="card">
      <div id="s-status" class="status-bar" style="display:none;"></div>
      <div id="s-lookup">
        <div class="form-row"><label>Your Email Address</label><input id="s-email" type="email" placeholder="email@example.com" onkeydown="if(event.key==='Enter')lookupStudent()"></div>
        <button class="btn" onclick="lookupStudent()">Access My Library</button>
      </div>
      <div id="s-results" style="display:none;"></div>
    </div>
  `;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(portalPage("Student Portal", html + `
    <script>
    async function lookupStudent(){
      var email=document.getElementById('s-email').value.trim();
      if(!email){showSS('Please enter your email.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Loading...';
      try{
        var r=await fetch('`+BASE+`/portal/student/lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
        var d=await r.json();
        if(d.ok){renderStudent(d);}
        else{showSS(d.error||'No account found.',false);}
      }catch(e){showSS('Network error.',false);}
      finally{btn.disabled=false;btn.textContent='Access My Library';}
    }
    function showSS(msg,ok){var b=document.getElementById('s-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'info');b.textContent=msg;}
    function renderStudent(d){
      document.getElementById('s-lookup').style.display='none';
      var html='<div class="stat-row"><div class="stat"><div class="stat-val">'+d.items.length+'</div><div class="stat-lbl">Items in Library</div></div><div class="stat"><div class="stat-val">'+d.loyaltyBalance+'</div><div class="stat-lbl">Loyalty Points</div></div></div>';
      if(d.items.length){
        html+='<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);margin-bottom:10px;">Your Library</div>';
        d.items.forEach(function(item){
          html+='<div class="purchase-card"><div class="pc-title">'+item.productTitle+'</div><div class="pc-sub"><span class="badge badge-blue">'+item.productFormat+'</span></div><div class="pc-sub" style="margin-top:6px;">Purchased: '+new Date(item.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})+'</div></div>';
        });
      }else{
        html+='<div style="text-align:center;color:var(--t4);font-size:.82rem;padding:24px;">No purchases found for this email. <a href="'+`+"`"+BASE+"`"+`+'/store" style="color:var(--ind);">Visit the store →</a></div>';
      }
      document.getElementById('s-results').innerHTML=html;
      document.getElementById('s-results').style.display='';
    }
    </script>
  `));
});

router.post("/student/lookup", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ ok: false, error: "email required" }); return; }
    const [purchases, loyaltyBalance] = await Promise.all([findCustomersByEmail(email), getLoyaltyBalance(email)]);
    if (purchases.length === 0) {
      res.json({ ok: false, error: "No purchases found. Please check your email or visit the store." });
      return;
    }
    res.json({ ok: true, email: email.toLowerCase(), loyaltyBalance, items: purchases.slice(0, 30).map(p => ({ productTitle: p.productTitle, productFormat: p.productFormat, createdAt: p.createdAt })) });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// ── GET /portal/client — Client Portal ───────────────────────────────────────

router.get("/client", (_req: Request, res: Response) => {
  const html = `
    <h1>💼 <em>Client Portal</em></h1>
    <p class="sub">View your project status, time log, and purchase history. Enter your email to access your account.</p>
    <div class="card">
      <div id="cl-status" class="status-bar" style="display:none;"></div>
      <div id="cl-lookup">
        <div class="form-row"><label>Your Email Address</label><input id="cl-email" type="email" placeholder="email@example.com" onkeydown="if(event.key==='Enter')lookupClient()"></div>
        <button class="btn" onclick="lookupClient()">Access My Account</button>
      </div>
      <div id="cl-results" style="display:none;"></div>
    </div>
  `;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(portalPage("Client Portal", html + `
    <script>
    async function lookupClient(){
      var email=document.getElementById('cl-email').value.trim();
      if(!email){showCLS('Please enter your email.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Loading...';
      try{
        var r=await fetch('`+BASE+`/portal/client/lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
        var d=await r.json();
        if(d.ok){renderClient(d);}
        else{showCLS(d.error||'No account found.',false);}
      }catch(e){showCLS('Network error.',false);}
      finally{btn.disabled=false;btn.textContent='Access My Account';}
    }
    function showCLS(msg,ok){var b=document.getElementById('cl-status');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'info');b.textContent=msg;}
    function renderClient(d){
      document.getElementById('cl-lookup').style.display='none';
      var html='<div style="font-size:.82rem;color:var(--t3);margin-bottom:14px;">Account: <strong style="color:var(--t1);">'+d.email+'</strong></div>';
      html+='<div class="stat-row"><div class="stat"><div class="stat-val">'+d.purchases+'</div><div class="stat-lbl">Purchases</div></div><div class="stat"><div class="stat-val">'+d.loyaltyBalance+'</div><div class="stat-lbl">Loyalty Pts</div></div></div>';
      if(d.trackers&&d.trackers.length){
        html+='<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--t4);margin-bottom:10px;">Your Projects</div>';
        d.trackers.forEach(function(t){
          html+='<div class="purchase-card"><div class="pc-title">'+t.title+'</div><div class="pc-sub"><span class="badge badge-blue">'+t.type+'</span> <span class="badge '+(t.status==='active'?'badge-green':'')+'">'+t.status+'</span></div><div class="pc-sub" style="margin-top:4px;">Priority: '+t.priority+' '+(t.due_date?'· Due: '+String(t.due_date).slice(0,10):'')+'</div></div>';
        });
      }
      html+='<div style="margin-top:16px;font-size:.78rem;color:var(--t3);">Questions? <a href="'+`+"`"+BASE+"`"+`+'/portal/book?type=follow-up" style="color:var(--ind);">Book a follow-up appointment →</a></div>';
      document.getElementById('cl-results').innerHTML=html;
      document.getElementById('cl-results').style.display='';
    }
    </script>
  `));
});

router.post("/client/lookup", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ ok: false, error: "email required" }); return; }
    const [purchases, trackers, loyaltyBalance] = await Promise.all([
      findCustomersByEmail(email),
      getTrackers().then(t => t.filter(tr => String(tr["owner_email"] ?? "").toLowerCase() === email.toLowerCase())),
      getLoyaltyBalance(email),
    ]);
    if (purchases.length === 0 && trackers.length === 0) {
      res.json({ ok: false, error: "No account found for this email. Please check your email or contact us." });
      return;
    }
    res.json({ ok: true, email: email.toLowerCase(), purchases: purchases.length, loyaltyBalance, trackers: trackers.slice(0, 10).map(t => ({ id: t["id"], title: t["title"], type: t["type"], status: t["status"], priority: t["priority"], due_date: t["due_date"] })) });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

export default router;
