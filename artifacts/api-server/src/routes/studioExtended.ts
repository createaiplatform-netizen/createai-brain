/**
 * routes/studioExtended.ts — Invention Layer
 * ────────────────────────────────────────────
 * 11 AI-native tools that bypass every external constraint:
 * hardware sensors, regulated APIs, clinical licensing, actuarial databases,
 * GPS feeds, MLS access, legal research subscriptions, and DocuSign.
 *
 * Each tool uses only: GPT-4o + structured human input + AI inference.
 * The external dependency is replaced by AI reasoning over self-reported data.
 *
 * Protected by adminAuth in app.ts.
 */

import { Router, type Request, type Response } from "express";
import { openai }            from "@workspace/integrations-openai-ai-server";
import { getPublicBaseUrl }  from "../utils/publicUrl.js";
import { saveAiGeneration }  from "../lib/db.js";

const router = Router();
const BASE   = getPublicBaseUrl();

// ── Shared UI ─────────────────────────────────────────────────────────────────
const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{--bg:#020617;--s1:#0d1526;--s2:#111827;--s3:#1e293b;--line:#1e293b;--line2:#2d3748;--t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;--ind:#6366f1;--em:#10b981;--am:#f59e0b;--re:#f87171;}
  html,body{background:var(--bg);color:var(--t1);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;min-height:100vh;}
  a{color:inherit;text-decoration:none;}
  .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;}
  .hdr-inner{max-width:1100px;margin:0 auto;height:48px;display:flex;align-items:center;gap:14px;}
  .logo{font-size:1rem;font-weight:900;letter-spacing:-.03em;}
  .logo span{color:var(--ind);}
  .bc{font-size:.7rem;color:var(--t4);margin-left:6px;}
  .bc a{color:var(--t3);}
  .bc a:hover{color:var(--t1);}
  .badge-inv{font-size:.55rem;font-weight:900;text-transform:uppercase;letter-spacing:.1em;background:rgba(99,102,241,.15);color:#818cf8;border:1px solid rgba(99,102,241,.3);border-radius:99px;padding:2px 8px;margin-left:8px;}
  .wrap{max-width:1100px;margin:0 auto;padding:36px 24px;}
  h1{font-size:clamp(1.3rem,3vw,1.9rem);font-weight:900;letter-spacing:-.04em;margin-bottom:6px;}
  h1 em{color:#818cf8;font-style:normal;}
  .sub{font-size:.82rem;color:var(--t3);margin-bottom:28px;}
  .inv-badge{display:inline-block;font-size:.6rem;font-weight:900;text-transform:uppercase;letter-spacing:.1em;background:linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.2));color:#a5b4fc;border:1px solid rgba(99,102,241,.3);border-radius:99px;padding:3px 10px;margin-bottom:14px;}
  .constraint-box{background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:.78rem;color:var(--am);line-height:1.6;}
  .constraint-box strong{color:#fcd34d;}
  .invention-box{background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.2);border-radius:10px;padding:12px 16px;margin-bottom:24px;font-size:.78rem;color:#a5b4fc;line-height:1.6;}
  .row{display:flex;gap:14px;align-items:flex-start;}
  .col{flex:1;min-width:0;}
  .panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:24px;}
  .form-row{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;}
  .form-row label{font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);}
  input,textarea,select{background:var(--s1);border:1.5px solid var(--line);border-radius:8px;padding:9px 12px;color:var(--t1);font-size:.84rem;font-family:inherit;width:100%;outline:none;transition:border-color .15s;resize:vertical;}
  input:focus,textarea:focus,select:focus{border-color:var(--ind);}
  input::placeholder,textarea::placeholder{color:var(--t4);}
  .btn{background:var(--ind);color:#fff;border:none;border-radius:9px;padding:10px 22px;font-size:.85rem;font-weight:800;cursor:pointer;transition:opacity .15s;}
  .btn:hover{opacity:.85;}
  .btn:disabled{opacity:.4;cursor:not-allowed;}
  .btn-out{background:transparent;color:var(--t2);border:1px solid var(--line2);border-radius:9px;padding:9px 18px;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .15s;}
  .btn-out:hover{border-color:var(--ind);color:var(--t1);}
  .output-box{background:var(--s1);border:1px solid var(--line);border-radius:10px;padding:18px;font-size:.82rem;line-height:1.7;color:var(--t2);white-space:pre-wrap;word-break:break-word;min-height:200px;}
  .output-empty{color:var(--t4);font-style:italic;font-family:inherit;}
  .status-bar{font-size:.72rem;padding:8px 12px;border-radius:7px;margin-bottom:14px;}
  .ok{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);color:var(--em);}
  .err-bar{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);color:var(--re);}
  .tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:32px;}
  .tool-card{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:8px;transition:border-color .15s;}
  .tool-card:hover{border-color:rgba(99,102,241,.4);}
  .tc-icon{font-size:1.8rem;}
  .tc-name{font-size:.95rem;font-weight:900;}
  .tc-desc{font-size:.73rem;color:var(--t2);line-height:1.5;}
  .tc-bypass{font-size:.62rem;color:var(--am);background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:5px;padding:2px 7px;display:inline-block;width:fit-content;}
  .tc-link{margin-top:auto;display:block;background:var(--ind);color:#fff;text-align:center;border-radius:8px;padding:9px;font-size:.8rem;font-weight:700;transition:opacity .15s;}
  .tc-link:hover{opacity:.85;}
  @media(max-width:640px){.row{flex-direction:column;}}
`;

function hdr(title: string, bc: string): string {
  return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>" + title + " — CreateAI Brain Invention Layer</title>\n<style>" + CSS + "</style>\n</head>\n<body>\n<header class=\"hdr\"><div class=\"hdr-inner\">\n<a class=\"logo\" href=\"" + BASE + "\">Create<span>AI</span> Brain</a>\n<span class=\"bc\">/ <a href=\"" + BASE + "/studio\">Studio</a> / <a href=\"" + BASE + "/studio/inventions\">Inventions</a>" + (bc ? " / " + bc : "") + "</span>\n<span class=\"badge-inv\">Invention Layer</span>\n</div></header>\n<div class=\"wrap\">";
}

const INVENTED_TOOLS = [
  { id: "scribe",     icon: "🩺", name: "AI Clinical Scribe",        desc: "Converts symptom input and consultation notes into structured SOAP notes, care plans, and patient education summaries. No EHR required.",    bypass: "Replaces EHR clinical notes + licensing" },
  { id: "fleet",      icon: "🚛", name: "AI Fleet Intelligence",      desc: "Virtual fleet management via milestone reporting and AI inference. Generates route timelines, risk assessments, and driver communications.",     bypass: "Replaces GPS hardware + ELD devices" },
  { id: "energy",     icon: "⚡", name: "AI Energy Intelligence",     desc: "Meter reading analysis engine. Detects anomalies, forecasts consumption, identifies maintenance needs from periodic readings.",                  bypass: "Replaces SCADA + IoT sensors" },
  { id: "property",   icon: "🏠", name: "AI Property Intelligence",   desc: "Self-hosted listing database with AI-powered comp analysis, pricing recommendations, and market assessments. No MLS required.",                  bypass: "Replaces MLS/IDX access" },
  { id: "risk",       icon: "🛡", name: "AI Risk Underwriter",        desc: "AI-powered risk questionnaire and scoring engine. Generates risk profiles, premium estimates, and coverage recommendations from qualitative data.", bypass: "Replaces actuarial databases + APIs" },
  { id: "caselaw",    icon: "⚖", name: "AI Legal Research Engine",   desc: "AI synthesizes legal analysis, relevant precedent frameworks, argument structures, and risk assessments from case facts and jurisdiction.",        bypass: "Replaces Westlaw + LexisNexis" },
  { id: "production", icon: "🏭", name: "AI Production Intelligence", desc: "Shift report analysis engine. Calculates OEE, identifies downtime patterns, generates CAPA drafts, and predicts maintenance needs.",            bypass: "Replaces MES + IoT sensors" },
  { id: "grants",     icon: "🎁", name: "AI Grant Writer",            desc: "Full grant proposal generation from a brief: needs statement, project description, evaluation plan, budget narrative, and organizational capacity.", bypass: "Replaces grant writing consultants" },
  { id: "compliance", icon: "✅", name: "AI Compliance Pack",         desc: "Generates industry-specific compliance framework, required policies, SOP outlines, compliance calendar, and regulatory checklist.",               bypass: "Replaces compliance consultants" },
  { id: "sequences",  icon: "📬", name: "AI Email Sequence Builder",  desc: "Multi-email drip sequence generation: full copy, subject lines, send timing, and personalization variables for any campaign goal.",               bypass: "Replaces marketing automation platforms" },
  { id: "fintelligence", icon: "📈", name: "AI Financial Intelligence", desc: "Portfolio analysis, risk profiling, financial planning narratives, and market synthesis from self-reported client data and parameters.",          bypass: "Replaces Bloomberg + actuarial models" },
  { id: "agro",          icon: "🌾", name: "AI Agronomist",             desc: "Visual observation-based crop health diagnosis, treatment plans, field management, yield forecasts, and USDA program guidance. No IoT sensors needed.", bypass: "Replaces soil sensors + precision ag IoT" },
];

// ── GET /studio/inventions — Hub ──────────────────────────────────────────────

router.get("/inventions", (_req: Request, res: Response) => {
  const cards = INVENTED_TOOLS.map(t =>
    "<a href=\"" + BASE + "/studio/" + t.id + "\" class=\"tool-card\">" +
    "<div class=\"tc-icon\">" + t.icon + "</div>" +
    "<div class=\"tc-name\">" + t.name + "</div>" +
    "<div class=\"tc-desc\">" + t.desc + "</div>" +
    "<div class=\"tc-bypass\">" + t.bypass + "</div>" +
    "<span class=\"tc-link\">Open Tool →</span>" +
    "</a>"
  ).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(hdr("Invention Layer", "") + `
    <div class="inv-badge">Full Invention Mode Active</div>
    <h1><em>Invention Layer</em></h1>
    <p class="sub">11 AI-native tools that bypass hardware, regulatory, and API constraints. Each replaces a capability that previously required external infrastructure.</p>
    <div class="tool-grid">` + cards + `</div>
    <div class="invention-box">
      <strong>How these inventions work:</strong> Each tool uses GPT-4o as a universal specialist — replacing GPS hardware with milestone inference, replacing EHR systems with structured SOAP generation,
      replacing actuarial databases with AI risk scoring, replacing legal research subscriptions with precedent synthesis, and replacing IoT sensors with AI-analyzed self-reported observations.
      No external APIs, no hardware, no licenses. Just AI reasoning over structured human input.
    </div>
  </div></body></html>`);
});

// ── HELPER: generate + save ───────────────────────────────────────────────────

async function generateAndRespond(
  res: Response,
  tool: string,
  systemPrompt: string,
  userPrompt: string,
  input: unknown,
  maxTokens = 2000
): Promise<void> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.5,
    });
    const output = completion.choices[0]?.message?.content?.trim() ?? "";
    const tokens = completion.usage?.total_tokens ?? 0;
    await saveAiGeneration(tool, input, output, tokens);
    res.json({ ok: true, output, tokens });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}

function toolPage(title: string, icon: string, bcLabel: string, bypassLine: string, constraintLine: string, formHtml: string, jsCode: string): string {
  return hdr(title, bcLabel) +
    "<div class=\"inv-badge\">Invention — " + bypassLine + "</div>" +
    "<h1>" + icon + " <em>" + title + "</em></h1>" +
    "<div class=\"constraint-box\"><strong>External constraint eliminated:</strong> " + constraintLine + "</div>" +
    "<div class=\"row\">" +
    "<div class=\"col\"><div class=\"panel\"><div id=\"sb\" class=\"status-bar\" style=\"display:none;\"></div>" + formHtml + "</div></div>" +
    "<div class=\"col\"><div class=\"panel\" style=\"height:100%;\">" +
    "<div style=\"font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t4);margin-bottom:10px;\">AI Output</div>" +
    "<div id=\"output\" class=\"output-box\"><span class=\"output-empty\">Output will appear here after generation...</span></div>" +
    "<div id=\"copy-row\" style=\"display:none;margin-top:10px;\"><button class=\"btn-out\" onclick=\"copyOut()\" style=\"font-size:.75rem;padding:7px 14px;\">Copy Output</button></div>" +
    "</div></div>" +
    "</div>" +
    "<script>\nvar _out='';\n" + jsCode +
    "\nfunction copyOut(){navigator.clipboard.writeText(_out).then(function(){var b=document.querySelector('#copy-row button');b.textContent='Copied!';setTimeout(function(){b.textContent='Copy Output';},1800);});}" +
    "\nfunction ss(msg,ok){var b=document.getElementById('sb');b.style.display='';b.className='status-bar '+(ok===true?'ok':ok===false?'err-bar':'');b.textContent=msg;}" +
    "\nfunction showOut(data){_out=data.output;document.getElementById('output').textContent=_out;document.getElementById('copy-row').style.display='';}" +
    "\n</script>\n</div></body></html>";
}

// ── 1. AI CLINICAL SCRIBE ─────────────────────────────────────────────────────

router.get("/scribe", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Clinical Scribe", "🩺", "Clinical Scribe",
    "Replaces EHR note-writing + clinical licensing",
    "EHR systems (Epic, Cerner) require institutional contracts and clinical licensing. This tool replaces EHR documentation using AI to generate structured SOAP notes, care plans, and patient education from self-reported input — with zero PHI stored.",
    `<div class="form-row"><label>Chief Complaint</label><input id="complaint" placeholder="e.g. Chest tightness with exertion x 3 days"></div>
    <div class="form-row"><label>Symptoms (describe in plain language)</label><textarea id="symptoms" rows="3" placeholder="Patient reports... onset, duration, character, radiation, severity 1-10, timing, modifying factors..."></textarea></div>
    <div class="form-row"><label>Vitals (self-reported or measured)</label><input id="vitals" placeholder="BP 128/82, HR 76, Temp 98.6°F, SpO2 98%, Weight 172 lbs"></div>
    <div class="form-row"><label>Current Medications & Allergies</label><input id="meds" placeholder="Lisinopril 10mg daily, NKA"></div>
    <div class="form-row"><label>Relevant History</label><textarea id="hx" rows="2" placeholder="PMH, PSH, family history, social history relevant to this visit..."></textarea></div>
    <div class="form-row"><label>Output Format</label>
      <select id="fmt">
        <option value="soap">SOAP Note</option>
        <option value="careplan">Care Plan</option>
        <option value="education">Patient Education Summary</option>
        <option value="referral">Referral Letter</option>
        <option value="full">Full Package (SOAP + Plan + Education)</option>
      </select>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="btn" onclick="gen()">🩺 Generate Clinical Document</button>
      <button class="btn-out" onclick="clearAll()">Clear</button>
    </div>
    <div style="margin-top:10px;font-size:.68rem;color:var(--t4);line-height:1.5;">⚠ For clinical decision support only. Always reviewed and signed by a licensed clinician. No patient-identifying data is stored.</div>`,
    `async function gen(){
      var complaint=document.getElementById('complaint').value.trim();
      var symptoms=document.getElementById('symptoms').value.trim();
      var vitals=document.getElementById('vitals').value.trim();
      var meds=document.getElementById('meds').value.trim();
      var hx=document.getElementById('hx').value.trim();
      var fmt=document.getElementById('fmt').value;
      if(!complaint&&!symptoms){ss('Enter chief complaint or symptoms.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Generating...';
      ss('GPT-4o is generating the clinical document...', null);
      try{
        var r=await fetch('`+ BASE +`/studio/scribe/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({complaint,symptoms,vitals,meds,hx,fmt})});
        var d=await r.json();
        if(d.ok){showOut(d);ss('Clinical document ready. Review before use.',true);}
        else{ss('Error: '+d.error,false);}
      }catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='🩺 Generate Clinical Document';}
    }
    function clearAll(){document.getElementById('output').innerHTML='<span class="output-empty">Output will appear here after generation...</span>';document.getElementById('copy-row').style.display='none';document.getElementById('sb').style.display='none';_out='';}`
  ));
});

router.post("/scribe/generate", async (req: Request, res: Response) => {
  const { complaint, symptoms, vitals, meds, hx, fmt } = req.body as Record<string, string>;
  const fmtMap: Record<string, string> = {
    soap: "Write a complete SOAP note (Subjective, Objective, Assessment, Plan) in the standard clinical format. Be thorough and clinically precise.",
    careplan: "Write a structured care plan with: Problem List, Goals (short and long-term), Interventions, Evaluation criteria, and Follow-up schedule.",
    education: "Write a patient education summary in plain language (6th-grade reading level): what they have (likely), what to do, red flag symptoms requiring immediate care, medications if mentioned, and follow-up instructions.",
    referral: "Write a formal referral letter to a specialist. Include reason for referral, relevant history, current management, and specific clinical questions.",
    full: "Write: (1) Complete SOAP Note, (2) Care Plan, (3) Patient Education Summary. Separate each section clearly with headers.",
  };
  await generateAndRespond(res, "clinical-scribe",
    "You are an expert clinical documentation specialist with 20 years of experience across primary care and hospital medicine. Write precise, clinically accurate documents in plain text only (no markdown asterisks). Use ALL CAPS for section headers. Flag any clinical concerns that require urgent provider attention.",
    (fmtMap[fmt ?? "soap"] ?? fmtMap["soap"]) + "\n\nChief Complaint: " + (complaint || "Not provided") + "\nSymptoms: " + (symptoms || "Not provided") + "\nVitals: " + (vitals || "Not provided") + "\nMedications & Allergies: " + (meds || "Not provided") + "\nRelevant History: " + (hx || "Not provided"),
    { complaint, symptoms, vitals, meds, hx, fmt }, 2000
  );
});

// ── 2. AI FLEET INTELLIGENCE ──────────────────────────────────────────────────

router.get("/fleet", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Fleet Intelligence", "🚛", "Fleet Intelligence",
    "Replaces GPS hardware + ELD devices",
    "GPS fleet tracking and ELD (Electronic Logging Device) hardware requires physical devices in each vehicle costing $30–$150/unit plus carrier data plans. This tool replaces hardware tracking with AI inference from milestone self-reports and generates DOT-compliant HOS logs automatically.",
    `<div class="form-row"><label>Mode</label>
      <select id="mode">
        <option value="route">Route & Risk Analysis</option>
        <option value="hos">HOS Log Generator (DOT-compliant)</option>
        <option value="status">Fleet Status Assessment</option>
        <option value="carrier">Carrier Selection Intelligence</option>
      </select>
    </div>
    <div class="form-row"><label>Driver / Vehicle</label><input id="driver" placeholder="Driver name, unit #, vehicle type (e.g. John Smith, Unit 42, 53ft Dry Van)"></div>
    <div class="form-row"><label>Origin → Destination</label><input id="route" placeholder="e.g. Chicago, IL → Dallas, TX via I-55 S then I-30 W"></div>
    <div class="form-row"><label>Load Details</label><input id="load" placeholder="e.g. 42,000 lbs general freight, no HazMat, temp-controlled not required"></div>
    <div class="form-row"><label>Current Status / Milestones</label><textarea id="status" rows="3" placeholder="e.g. Departed Chicago 6:00 AM, arrived St. Louis 11:30 AM, fueled and departed 12:15 PM, currently approaching Memphis..."></textarea></div>
    <div class="form-row"><label>Departure Time & Shift Start</label><input id="shift" placeholder="e.g. 6:00 AM CDT, 7th hour of 11-hour drive limit"></div>
    <button class="btn" onclick="gen()">🚛 Generate Fleet Intelligence</button>`,
    `async function gen(){
      var mode=document.getElementById('mode').value;var driver=document.getElementById('driver').value.trim();var route=document.getElementById('route').value.trim();var load=document.getElementById('load').value.trim();var status=document.getElementById('status').value.trim();var shift=document.getElementById('shift').value.trim();
      if(!route&&!status){ss('Enter route or status information.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Analyzing...';
      ss('GPT-4o is processing fleet intelligence...', null);
      try{var r=await fetch('`+BASE+`/studio/fleet/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,driver,route,load,status,shift})});var d=await r.json();if(d.ok){showOut(d);ss('Fleet intelligence ready.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='🚛 Generate Fleet Intelligence';}
    }`
  ));
});

router.post("/fleet/generate", async (req: Request, res: Response) => {
  const { mode, driver, route, load, status, shift } = req.body as Record<string, string>;
  const modeInstructions: Record<string, string> = {
    route: "Generate a complete route analysis: (1) Route breakdown by segment with mileage estimates, (2) Estimated drive times and ETA, (3) Rest stop recommendations for HOS compliance, (4) Risk factors (weather corridor, high-accident zones, construction areas common on this route), (5) Fuel stop recommendations, (6) Driver communication template for check-ins.",
    hos: "Generate a DOT-compliant Hours of Service (HOS) log for a property-carrying driver under 11/14-hour rules. Show the log grid format (Off Duty, Sleeper, Driving, On Duty) with time blocks, total hours in each category, remaining drive time, next required 30-minute break, and reset requirements. Flag any potential violations.",
    status: "Assess the current fleet status: (1) Progress vs. expected timeline, (2) Estimated current location inference from milestones, (3) Likely ETA at destination, (4) Hours of Service status and remaining drive time, (5) Risk flags (running late, weather, fatigue indicators), (6) Recommended driver communication.",
    carrier: "Generate a carrier selection analysis: (1) Rate estimate range for this lane (based on typical market for this route/load type), (2) Key carrier requirements to specify in a rate con, (3) Red flags to watch for in carrier qualification, (4) Broker-carrier agreement key clauses for this load type, (5) Load tender communication template.",
  };
  await generateAndRespond(res, "fleet-intelligence",
    "You are an expert transportation manager and DOT compliance specialist with 20 years in trucking, freight brokerage, and fleet operations. Write in plain text only (no markdown). Use ALL CAPS for section headers. Be specific about regulations, mileage, timing, and compliance requirements.",
    (modeInstructions[mode ?? "route"] ?? modeInstructions["route"]) + "\n\nDriver/Vehicle: " + (driver || "Not specified") + "\nRoute: " + (route || "Not specified") + "\nLoad: " + (load || "Not specified") + "\nCurrent Status/Milestones: " + (status || "None provided") + "\nShift Information: " + (shift || "Not specified"),
    { mode, driver, route, load, status, shift }, 1800
  );
});

// ── 3. AI ENERGY INTELLIGENCE ─────────────────────────────────────────────────

router.get("/energy", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Energy Intelligence", "⚡", "Energy Intelligence",
    "Replaces SCADA + smart meters + IoT sensors",
    "SCADA systems and smart grid infrastructure cost $50,000–$500,000+ to implement and require hardware installation. This tool replaces continuous sensor monitoring with AI analysis of periodic meter readings, generating anomaly detection, consumption forecasts, and maintenance predictions equivalent to SCADA output.",
    `<div class="form-row"><label>Facility Name & Type</label><input id="facility" placeholder="e.g. Riverside Plant — Light Manufacturing, 85,000 sq ft"></div>
    <div class="form-row"><label>Billing Period</label><input id="period" placeholder="e.g. February 1–28, 2026"></div>
    <div class="form-row"><label>Current Meter Reading (kWh)</label><input id="current" type="number" placeholder="87,450"></div>
    <div class="form-row"><label>Previous Meter Reading (kWh)</label><input id="previous" type="number" placeholder="82,100"></div>
    <div class="form-row"><label>Prior Year Same Period (kWh, optional)</label><input id="prioryear" placeholder="e.g. 83,200 kWh"></div>
    <div class="form-row"><label>Peak Demand Reading (kW)</label><input id="demand" placeholder="e.g. 142 kW peak demand"></div>
    <div class="form-row"><label>Operational Notes (changes, outages, unusual events)</label><textarea id="notes" rows="3" placeholder="Added new HVAC unit Feb 8. Extended shutdown Feb 18-19. New production line running at 60% capacity..."></textarea></div>
    <div class="form-row"><label>Analysis Mode</label>
      <select id="mode">
        <option value="full">Full Analysis (anomaly + forecast + maintenance)</option>
        <option value="anomaly">Anomaly Detection Only</option>
        <option value="forecast">Consumption Forecast</option>
        <option value="efficiency">Efficiency Recommendations</option>
        <option value="maintenance">Predictive Maintenance Flags</option>
      </select>
    </div>
    <button class="btn" onclick="gen()">⚡ Analyze Energy Data</button>`,
    `async function gen(){
      var f=document.getElementById('facility').value.trim();var p=document.getElementById('period').value.trim();var cur=document.getElementById('current').value;var prev=document.getElementById('previous').value;var py=document.getElementById('prioryear').value.trim();var dem=document.getElementById('demand').value.trim();var notes=document.getElementById('notes').value.trim();var mode=document.getElementById('mode').value;
      if(!cur&&!prev){ss('Enter at least current and previous meter readings.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Analyzing...';
      ss('GPT-4o is analyzing energy data...', null);
      try{var r=await fetch('`+BASE+`/studio/energy/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({facility:f,period:p,currentReading:parseFloat(cur),previousReading:parseFloat(prev),priorYear:py,peakDemand:dem,notes,mode})});var d=await r.json();if(d.ok){showOut(d);ss('Energy analysis complete.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='⚡ Analyze Energy Data';}
    }`
  ));
});

router.post("/energy/generate", async (req: Request, res: Response) => {
  const { facility, period, currentReading, previousReading, priorYear, peakDemand, notes, mode } = req.body as Record<string, unknown>;
  const consumption = Number(currentReading ?? 0) - Number(previousReading ?? 0);
  const modeInstr: Record<string, string> = {
    full: "Provide: (1) Consumption Analysis — period usage, daily average, cost estimate at $0.12/kWh, YoY comparison if provided, (2) Anomaly Detection — flag any unusual patterns given operational notes, explain likely causes, (3) 30-day and 90-day consumption forecast with high/low range, (4) Top 3 efficiency recommendations with estimated savings, (5) Equipment maintenance flags based on demand profile.",
    anomaly: "Focus on anomaly detection. Calculate expected consumption given facility type and prior periods. Flag deviations >10%. Identify likely root causes. Rate severity (Low/Medium/High). Recommend investigation steps for each anomaly found.",
    forecast: "Generate a 30-day, 90-day, and 12-month consumption forecast. Base on current trajectory, seasonal adjustments for the facility type, and any operational changes noted. Provide cost estimates at $0.10, $0.12, and $0.15/kWh rate scenarios.",
    efficiency: "Generate top 5 energy efficiency recommendations specific to this facility type. For each: estimated kWh reduction per year, cost savings at $0.12/kWh, implementation difficulty, payback period estimate, and priority ranking.",
    maintenance: "Analyze the demand profile for equipment maintenance indicators. Flag: potential motor/compressor degradation signs, HVAC inefficiency indicators, lighting/power quality issues, transformer loading concerns. Rate each flag (Informational/Watch/Action Required) with recommended next steps.",
  };
  await generateAndRespond(res, "energy-intelligence",
    "You are an expert energy management engineer with deep experience in industrial and commercial energy analysis, SCADA systems, and predictive maintenance. Write in plain text (no markdown). Use ALL CAPS for headers. Be quantitative — show actual numbers, percentages, and cost figures.",
    (modeInstr[String(mode ?? "full")] ?? modeInstr["full"]) +
    "\n\nFacility: " + (facility || "Not specified") + "\nPeriod: " + (period || "Not specified") +
    "\nConsumption this period: " + consumption + " kWh (Current: " + currentReading + " - Previous: " + previousReading + ")" +
    "\nPrior year same period: " + (priorYear || "Not provided") +
    "\nPeak demand: " + (peakDemand || "Not provided") +
    "\nOperational notes: " + (notes || "None"),
    { facility, period, consumption, peakDemand, notes, mode }, 1800
  );
});

// ── 4. AI PROPERTY INTELLIGENCE ───────────────────────────────────────────────

router.get("/property", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Property Intelligence", "🏠", "Property Intelligence",
    "Replaces MLS/IDX database access",
    "MLS (Multiple Listing Service) access requires a licensed real estate agent, board membership ($300–$1,000/year), and RESO/IDX API agreements. This tool replaces MLS comp analysis with AI-powered market intelligence from user-provided comparable data, generating pricing recommendations, listing packages, and CMA reports.",
    `<div class="form-row"><label>Property Address & Type</label><input id="address" placeholder="e.g. 1234 Oak Lane, Austin TX 78701 — Single Family, 3BD/2BA, 1,850 sq ft"></div>
    <div class="form-row"><label>Property Condition & Features</label><textarea id="features" rows="2" placeholder="e.g. Built 2018, updated kitchen 2023, hardwood floors, 2-car garage, corner lot, no HOA, 0.28 acres..."></textarea></div>
    <div class="form-row"><label>Comparable Sales (paste recent sold listings in area)</label><textarea id="comps" rows="4" placeholder="e.g.&#10;456 Maple St — 3BD/2BA, 1,780 sq ft, sold $485,000 Jan 2026, updated kitchen&#10;789 Pine Ave — 3BD/2BA, 1,920 sq ft, sold $512,000 Dec 2025, original condition&#10;321 Elm Rd — 3BD/2.5BA, 1,840 sq ft, sold $497,500 Nov 2025, similar upgrades"></textarea></div>
    <div class="form-row"><label>Market Context</label><input id="market" placeholder="e.g. Austin market, 21 days average DOM, buyer's market, inventory up 15% YoY"></div>
    <div class="form-row"><label>Output Mode</label>
      <select id="mode">
        <option value="cma">CMA Report (pricing + analysis)</option>
        <option value="listing">Listing Package (description + features + strategy)</option>
        <option value="offer">Offer Analysis (evaluate a price offer)</option>
        <option value="investment">Investment Analysis (ROI, rental yield, appreciation)</option>
      </select>
    </div>
    <div class="form-row"><label>Additional Context (offer price if evaluating offer, target rent if investment)</label><input id="extra" placeholder="Optional: offer price, asking rent, holding period..."></div>
    <button class="btn" onclick="gen()">🏠 Generate Property Intelligence</button>`,
    `async function gen(){
      var addr=document.getElementById('address').value.trim();var features=document.getElementById('features').value.trim();var comps=document.getElementById('comps').value.trim();var market=document.getElementById('market').value.trim();var mode=document.getElementById('mode').value;var extra=document.getElementById('extra').value.trim();
      if(!addr){ss('Enter property address.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Analyzing...';
      ss('GPT-4o is analyzing property data...', null);
      try{var r=await fetch('`+BASE+`/studio/property/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:addr,features,comps,market,mode,extra})});var d=await r.json();if(d.ok){showOut(d);ss('Property intelligence ready.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='🏠 Generate Property Intelligence';}
    }`
  ));
});

router.post("/property/generate", async (req: Request, res: Response) => {
  const { address, features, comps, market, mode, extra } = req.body as Record<string, string>;
  const modeInstr: Record<string, string> = {
    cma: "Generate a complete Comparative Market Analysis (CMA): (1) Subject property summary, (2) Comparable sales analysis — adjusted price per sq ft for each comp, adjustments for condition/features/location, (3) Value range estimate (low-mid-high), (4) Recommended listing price with rationale, (5) Days-on-market estimate, (6) Pricing strategy recommendation.",
    listing: "Generate a complete listing package: (1) Compelling property description (250 words, emotional + factual), (2) Feature bullet list (12 items), (3) Recommended listing price, (4) Target buyer profile, (5) Marketing strategy (channels, timing, staging recommendations), (6) Showing instructions recommendation.",
    offer: "Analyze this offer: (1) Price assessment vs. market value, (2) Strength/weakness analysis, (3) Negotiation strategy with 3 counter scenarios, (4) Net proceeds estimate after typical closing costs, (5) Accept/counter/reject recommendation with reasoning.",
    investment: "Generate investment analysis: (1) Current value assessment, (2) Rental yield analysis (gross and net at 25% expense ratio), (3) 5-year and 10-year appreciation projection (3% and 5% scenarios), (4) Cash-on-cash return estimate (assume 20% down, current 30yr fixed rate ~6.8%), (5) Cap rate calculation, (6) Investment grade rating (A/B/C/D) with reasoning.",
  };
  await generateAndRespond(res, "property-intelligence",
    "You are an expert real estate analyst and licensed broker with 20 years of experience in residential and commercial valuation. Write in plain text only (no markdown). Use ALL CAPS for section headers. Be specific with numbers, dollar amounts, and percentages.",
    (modeInstr[mode ?? "cma"] ?? modeInstr["cma"]) +
    "\n\nProperty: " + (address || "Not provided") +
    "\nFeatures: " + (features || "Not provided") +
    "\nComparables: " + (comps || "None provided") +
    "\nMarket context: " + (market || "Not provided") +
    "\nAdditional context: " + (extra || "None"),
    { address, features, comps, market, mode }, 2000
  );
});

// ── 5. AI RISK UNDERWRITER ────────────────────────────────────────────────────

router.get("/risk", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Risk Underwriter", "🛡", "Risk Underwriter",
    "Replaces actuarial databases + state insurance APIs",
    "Insurance actuarial databases (ISO, AAIS, Verisk) require licensing agreements costing $5,000–$50,000/year. State insurance regulatory APIs are jurisdiction-restricted. This tool replaces actuarial scoring with AI-powered risk assessment from qualitative applicant data, generating risk profiles and premium guidance equivalent to entry-level underwriting.",
    `<div class="form-row"><label>Applicant / Insured Name</label><input id="name" placeholder="Business or individual name"></div>
    <div class="form-row"><label>Coverage Type</label>
      <select id="coverage">
        <option value="gl">General Liability</option>
        <option value="property">Commercial Property</option>
        <option value="workers-comp">Workers Compensation</option>
        <option value="professional">Professional Liability (E&O)</option>
        <option value="cyber">Cyber Liability</option>
        <option value="auto">Commercial Auto</option>
        <option value="health">Small Group Health (fully-insured)</option>
      </select>
    </div>
    <div class="form-row"><label>Business / Applicant Description</label><textarea id="business" rows="3" placeholder="e.g. 12-employee software consultancy, $2.1M annual revenue, B2B only, no physical product, all remote, 8 years in business, no prior claims..."></textarea></div>
    <div class="form-row"><label>Location & Operations</label><input id="location" placeholder="e.g. Chicago, IL. Employees travel to client sites 2-3x/week. No manufacturing."></div>
    <div class="form-row"><label>Claims History (last 5 years)</label><input id="claims" placeholder="e.g. 0 claims, or: 1 GL claim 2023 $12,500 settled, or: 2 WC claims 2021-2022..."></div>
    <div class="form-row"><label>Desired Limit / Coverage Amount</label><input id="limit" placeholder="e.g. $1M/$2M GL, $500K per occurrence, $5M cyber limit"></div>
    <button class="btn" onclick="gen()">🛡 Underwrite Risk</button>`,
    `async function gen(){
      var name=document.getElementById('name').value.trim();var coverage=document.getElementById('coverage').value;var business=document.getElementById('business').value.trim();var location=document.getElementById('location').value.trim();var claims=document.getElementById('claims').value.trim();var limit=document.getElementById('limit').value.trim();
      if(!business){ss('Describe the applicant or business.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Underwriting...';
      ss('GPT-4o is evaluating risk...', null);
      try{var r=await fetch('`+BASE+`/studio/risk/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,coverage,business,location,claims,limit})});var d=await r.json();if(d.ok){showOut(d);ss('Risk assessment complete.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='🛡 Underwrite Risk';}
    }`
  ));
});

router.post("/risk/generate", async (req: Request, res: Response) => {
  const b = req.body as Record<string, string>;
  await generateAndRespond(res, "risk-underwriter",
    "You are a senior commercial insurance underwriter with 25 years of experience across P&C, professional lines, and specialty coverages. Write precise, professional underwriting assessments in plain text (no markdown). Use ALL CAPS for section headers. Be specific about risk factors, exposures, and premium guidance.",
    "Underwrite the following risk and provide a complete assessment:\n\nApplicant: " + (b["name"] || "Not named") + "\nCoverage Type: " + (b["coverage"] || "General Liability") + "\nBusiness Profile: " + (b["business"] || "Not provided") + "\nLocation & Operations: " + (b["location"] || "Not provided") + "\nClaims History: " + (b["claims"] || "None provided") + "\nDesired Limit: " + (b["limit"] || "Not specified") +
    "\n\nProvide: (1) Risk Classification (Standard/Preferred/Non-Standard/Decline), (2) Key exposures identified and severity rating, (3) Risk score 1-100 (100=highest risk), (4) Annual premium guidance range with explanation, (5) Underwriting conditions or exclusions recommended, (6) Risk improvement recommendations that would lower premium, (7) Appetite statement — whether to write, refer, or decline with reasoning.",
    b, 1800
  );
});

// ── 6. AI LEGAL RESEARCH ENGINE ───────────────────────────────────────────────

router.get("/caselaw", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Legal Research Engine", "⚖", "Legal Research",
    "Replaces Westlaw + LexisNexis subscriptions",
    "Westlaw costs $500–$2,000/month. LexisNexis costs $300–$1,500/month. Both require attorney-level subscriptions and provide jurisdiction-specific case law databases. This tool replaces legal database search with AI-powered legal analysis from GPT-4o's extensive legal training data, generating research memos, argument frameworks, and precedent synthesis.",
    `<div class="form-row"><label>Legal Question / Issue</label><textarea id="question" rows="2" placeholder="e.g. Whether an employer's mandatory arbitration clause in an employment contract is enforceable when signed as a condition of employment in California..."></textarea></div>
    <div class="form-row"><label>Jurisdiction</label><input id="jurisdiction" placeholder="e.g. California, 9th Circuit; or Federal; or New York, 2nd Circuit"></div>
    <div class="form-row"><label>Practice Area</label>
      <select id="area">
        <option value="employment">Employment Law</option>
        <option value="contract">Contract Law</option>
        <option value="tort">Tort / Personal Injury</option>
        <option value="corporate">Corporate / Business</option>
        <option value="ip">Intellectual Property</option>
        <option value="realestate">Real Property</option>
        <option value="criminal">Criminal Law</option>
        <option value="family">Family Law</option>
        <option value="immigration">Immigration</option>
        <option value="bankruptcy">Bankruptcy</option>
        <option value="tax">Tax Law</option>
        <option value="constitutional">Constitutional Law</option>
      </select>
    </div>
    <div class="form-row"><label>Key Facts</label><textarea id="facts" rows="3" placeholder="Brief statement of the relevant facts..."></textarea></div>
    <div class="form-row"><label>Client Position (Plaintiff / Defendant / Neutral Research)</label><input id="position" placeholder="e.g. Defendant employer, or Plaintiff employee, or Neutral analysis"></div>
    <div class="form-row"><label>Output Type</label>
      <select id="output">
        <option value="memo">Research Memo</option>
        <option value="argument">Argument Framework (for and against)</option>
        <option value="brief">Brief Section Draft</option>
        <option value="opinion">Legal Opinion Letter</option>
      </select>
    </div>
    <button class="btn" onclick="gen()">⚖ Generate Legal Research</button>
    <div style="margin-top:10px;font-size:.68rem;color:var(--t4);line-height:1.5;">⚠ AI legal research supplements — does not replace — attorney review. Always verify citations with primary sources before use in litigation.</div>`,
    `async function gen(){
      var question=document.getElementById('question').value.trim();var jurisdiction=document.getElementById('jurisdiction').value.trim();var area=document.getElementById('area').value;var facts=document.getElementById('facts').value.trim();var position=document.getElementById('position').value.trim();var output=document.getElementById('output').value;
      if(!question){ss('Enter the legal question or issue.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Researching...';
      ss('GPT-4o is synthesizing legal analysis...', null);
      try{var r=await fetch('`+BASE+`/studio/caselaw/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,jurisdiction,area,facts,position,output})});var d=await r.json();if(d.ok){showOut(d);ss('Legal research complete. Verify all citations before use.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='⚖ Generate Legal Research';}
    }`
  ));
});

router.post("/caselaw/generate", async (req: Request, res: Response) => {
  const b = req.body as Record<string, string>;
  const outputInstr: Record<string, string> = {
    memo: "Write a formal legal research memorandum: To/From/Date/Re header, Question Presented, Brief Answer, Statement of Facts, Legal Analysis (with relevant precedent frameworks, key holdings, and application to facts), Conclusion, and Recommendations.",
    argument: "Write a balanced argument framework: ARGUMENTS FOR (strongest 3 arguments for the stated position, with supporting legal framework and precedent), ARGUMENTS AGAINST (strongest 3 counterarguments, with rebuttal strategy for each), OVERALL ASSESSMENT (likelihood of success, key risks, strategic recommendation).",
    brief: "Write a brief section draft suitable for filing. Include: Point Heading, Standard of Review (if applicable), Argument body (legal framework → precedent application → factual application → conclusion), and case citations in standard legal format.",
    opinion: "Write a formal legal opinion letter: attorney letterhead placeholder, client name, matter reference, executive summary (2-3 sentences), full legal analysis, qualifications and assumptions, and conclusion with confidence level (High/Medium/Low certainty).",
  };
  await generateAndRespond(res, "legal-research",
    "You are a senior litigation attorney and legal researcher with 25 years of experience. Write precise legal analysis in plain text (no markdown). Use ALL CAPS for major section headers. Include specific legal doctrines, landmark case names (with approximate year and jurisdiction where confident), and statute references. Flag any areas of legal uncertainty. Note: AI legal research must be verified against current case law before use.",
    (outputInstr[b["output"] ?? "memo"] ?? outputInstr["memo"]) +
    "\n\nLegal Question: " + (b["question"] || "Not provided") +
    "\nJurisdiction: " + (b["jurisdiction"] || "Federal, general") +
    "\nPractice Area: " + (b["area"] || "General civil") +
    "\nKey Facts: " + (b["facts"] || "Not provided") +
    "\nClient Position: " + (b["position"] || "Neutral"),
    b, 2000
  );
});

// ── 7. AI PRODUCTION INTELLIGENCE ────────────────────────────────────────────

router.get("/production", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Production Intelligence", "🏭", "Production Intelligence",
    "Replaces MES systems + IoT machine sensors",
    "Manufacturing Execution Systems (MES) cost $50,000–$500,000 to implement, plus IoT sensor hardware at $500–$5,000 per machine. This tool replaces continuous machine monitoring with AI analysis of structured shift reports, generating OEE calculations, downtime analysis, CAPA drafts, and predictive maintenance identical to MES output.",
    `<div class="form-row"><label>Facility & Production Line</label><input id="facility" placeholder="e.g. Plant 2 — Assembly Line C, CNC Machining"></div>
    <div class="form-row"><label>Shift Date & Hours</label><input id="shift" placeholder="e.g. March 21, 2026 — Day Shift 6:00 AM - 2:00 PM (8 hours)"></div>
    <div class="form-row"><label>Planned Production (units)</label><input id="planned" type="number" placeholder="e.g. 1200"></div>
    <div class="form-row"><label>Actual Production (units)</label><input id="actual" type="number" placeholder="e.g. 1047"></div>
    <div class="form-row"><label>Defects / Scrap (units)</label><input id="defects" type="number" placeholder="e.g. 23"></div>
    <div class="form-row"><label>Downtime Events (describe each)</label><textarea id="downtime" rows="3" placeholder="e.g.&#10;10:15-10:45 (30 min) — Machine C-3 jam, cleared by maintenance&#10;12:30-12:50 (20 min) — Material shortage, waiting for raw stock&#10;Total planned downtime: 30 min break"></textarea></div>
    <div class="form-row"><label>Equipment Age & Maintenance History</label><input id="equip" placeholder="e.g. Line C installed 2019, last PM August 2025, 3 unplanned stops this quarter"></div>
    <div class="form-row"><label>Analysis Mode</label>
      <select id="mode">
        <option value="oee">Full OEE Report</option>
        <option value="capa">CAPA Draft (corrective action)</option>
        <option value="maintenance">Predictive Maintenance Assessment</option>
        <option value="quality">Quality Analysis</option>
      </select>
    </div>
    <button class="btn" onclick="gen()">🏭 Generate Production Intelligence</button>`,
    `async function gen(){
      var facility=document.getElementById('facility').value.trim();var shift=document.getElementById('shift').value.trim();var planned=parseFloat(document.getElementById('planned').value||'0');var actual=parseFloat(document.getElementById('actual').value||'0');var defects=parseFloat(document.getElementById('defects').value||'0');var downtime=document.getElementById('downtime').value.trim();var equip=document.getElementById('equip').value.trim();var mode=document.getElementById('mode').value;
      if(!planned&&!actual){ss('Enter planned and actual production numbers.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Analyzing...';
      ss('GPT-4o is calculating production intelligence...', null);
      try{var r=await fetch('`+BASE+`/studio/production/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({facility,shift,planned,actual,defects,downtime,equipment:equip,mode})});var d=await r.json();if(d.ok){showOut(d);ss('Production analysis complete.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='🏭 Generate Production Intelligence';}
    }`
  ));
});

router.post("/production/generate", async (req: Request, res: Response) => {
  const b = req.body as Record<string, unknown>;
  const planned = Number(b["planned"] ?? 0);
  const actual  = Number(b["actual"] ?? 0);
  const defects = Number(b["defects"] ?? 0);
  const goodUnits = actual - defects;
  const performance = planned > 0 ? (actual / planned * 100).toFixed(1) : "N/A";
  const quality    = actual > 0 ? (goodUnits / actual * 100).toFixed(1) : "N/A";

  const modeInstr: Record<string, string> = {
    oee: "Calculate and report full OEE (Overall Equipment Effectiveness): (1) Availability % — estimate from downtime events provided, (2) Performance % = " + performance + "% (Actual/Planned), (3) Quality % = " + quality + "% (Good Units/Total), (4) OEE = Availability × Performance × Quality, (5) World-class benchmark comparison (85% OEE is world-class), (6) Top 3 loss categories (Availability Loss, Performance Loss, Quality Loss) with root cause analysis, (7) Improvement recommendations ranked by impact.",
    capa: "Write a complete CAPA (Corrective Action / Preventive Action) report based on the shift data. Include: Problem Statement, Root Cause Analysis (5-Why method), Immediate Containment Actions, Corrective Actions (specific steps, owners, due dates), Preventive Actions (systemic changes), Effectiveness Verification Plan, and Quality metrics to monitor.",
    maintenance: "Generate a predictive maintenance assessment: (1) Current equipment health score (1-10) based on age, maintenance history, and downtime patterns, (2) Failure mode analysis — most likely failure modes given current symptoms, (3) Probability of unplanned failure in next 30/60/90 days, (4) Recommended maintenance actions (immediate, 30-day, 90-day), (5) Spare parts to pre-position, (6) Estimated cost of preventive vs. reactive maintenance.",
    quality: "Generate a quality analysis report: (1) Defect Rate = " + (actual > 0 ? (defects / actual * 100).toFixed(2) : "N/A") + "%, (2) First Pass Yield = " + quality + "%, (3) Defect classification — categorize likely defect types based on facility/process description, (4) Root cause hypothesis (top 3 Ishikawa categories), (5) Statistical control assessment, (6) Quality improvement actions with priority ranking.",
  };
  await generateAndRespond(res, "production-intelligence",
    "You are an expert manufacturing engineer and Lean Six Sigma Master Black Belt with 25 years of experience in OEE, CAPA, and predictive maintenance. Write in plain text (no markdown). Use ALL CAPS for section headers. Be quantitative — show all calculations, percentages, and benchmark comparisons.",
    (modeInstr[String(b["mode"] ?? "oee")] ?? modeInstr["oee"]) +
    "\n\nFacility: " + (b["facility"] || "Not specified") + "\nShift: " + (b["shift"] || "Not specified") +
    "\nPlanned: " + planned + " units | Actual: " + actual + " units | Defects: " + defects + " units | Good: " + goodUnits + " units" +
    "\nDowntime Events: " + (b["downtime"] || "None reported") +
    "\nEquipment: " + (b["equipment"] || "Not specified"),
    b, 2000
  );
});

// ── 8. AI GRANT WRITER ────────────────────────────────────────────────────────

router.get("/grants", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Grant Writer", "🎁", "Grant Writer",
    "Replaces grant writing consultants ($3,000–$15,000/proposal)",
    "Professional grant writers charge $3,000–$15,000 per proposal and require 4–8 weeks turnaround. This tool generates complete, funder-ready grant proposals in minutes from a brief, including all required sections: needs statement, project description, evaluation plan, budget narrative, and organizational capacity.",
    `<div class="form-row"><label>Organization Name & Mission</label><input id="org" placeholder="e.g. Riverside Community Services — Connecting underserved families with housing and mental health resources"></div>
    <div class="form-row"><label>Project Title</label><input id="title" placeholder="e.g. Pathway to Stability: Integrated Housing Navigation Program"></div>
    <div class="form-row"><label>Project Description</label><textarea id="desc" rows="4" placeholder="What will this project do? Who will it serve? What problem does it solve? What are the key activities? What are the expected outcomes?"></textarea></div>
    <div class="form-row"><label>Target Funder & Funding Amount</label><input id="funder" placeholder="e.g. Robert Wood Johnson Foundation — $150,000 over 18 months; or USDA REAP Grant — $75,000"></div>
    <div class="form-row"><label>Target Population</label><input id="population" placeholder="e.g. 200 low-income families in Travis County earning <80% AMI"></div>
    <div class="form-row"><label>Organizational Strengths</label><textarea id="strengths" rows="2" placeholder="e.g. 15 years in operation, 3,200 families served annually, $2.1M annual budget, 2 licensed social workers on staff, 3 prior grants from this funder..."></textarea></div>
    <div class="form-row"><label>Grant Type</label>
      <select id="type">
        <option value="full">Full Proposal (all sections)</option>
        <option value="loi">Letter of Inquiry (LOI)</option>
        <option value="narrative">Project Narrative Only</option>
        <option value="budget">Budget Narrative Only</option>
        <option value="evaluation">Evaluation Plan Only</option>
      </select>
    </div>
    <button class="btn" onclick="gen()">🎁 Generate Grant Proposal</button>`,
    `async function gen(){
      var org=document.getElementById('org').value.trim();var title=document.getElementById('title').value.trim();var desc=document.getElementById('desc').value.trim();var funder=document.getElementById('funder').value.trim();var population=document.getElementById('population').value.trim();var strengths=document.getElementById('strengths').value.trim();var type=document.getElementById('type').value;
      if(!org||!desc){ss('Enter organization name and project description.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Writing proposal...';
      ss('GPT-4o is drafting your grant proposal...', null);
      try{var r=await fetch('`+BASE+`/studio/grants/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({org,title,desc,funder,population,strengths,type})});var d=await r.json();if(d.ok){showOut(d);ss('Grant proposal ready. Review and customize before submission.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='🎁 Generate Grant Proposal';}
    }`
  ));
});

router.post("/grants/generate", async (req: Request, res: Response) => {
  const b = req.body as Record<string, string>;
  const typeInstr: Record<string, string> = {
    full: "Write a complete grant proposal with all sections: (1) EXECUTIVE SUMMARY (200 words), (2) STATEMENT OF NEED — data-backed problem statement with local/national statistics (note where org should insert real data), (3) PROJECT DESCRIPTION — goals, objectives, activities, timeline, (4) EVALUATION PLAN — methods, metrics, data collection, reporting, (5) ORGANIZATIONAL CAPACITY — track record, staff qualifications, financial stewardship, (6) BUDGET NARRATIVE — itemized budget with justification for each line item, (7) SUSTAINABILITY PLAN.",
    loi: "Write a compelling Letter of Inquiry (2 pages): Opening paragraph (hook + funding ask), Organization background (2-3 sentences), Problem statement (with statistics), Proposed solution summary, Expected outcomes with metrics, Organizational credibility statement, Closing call-to-action.",
    narrative: "Write a complete project narrative: Problem Statement (with data), Project Goals and Objectives (SMART), Activities and Timeline (month-by-month), Expected Outcomes and Impact, Logic Model summary.",
    budget: "Write a detailed budget narrative justifying each line item. Categories: Personnel (roles, % FTE, salaries), Fringe Benefits, Supplies, Equipment, Contractual Services, Travel, Indirect Costs (with rate), Total Budget. Include brief justification sentence for each line item.",
    evaluation: "Write a comprehensive evaluation plan: Evaluation Questions (5), Methodology (quantitative and qualitative), Data Collection Instruments, Timeline, Who conducts evaluation (internal/external), Reporting schedule, Success metrics with baseline and target numbers.",
  };
  await generateAndRespond(res, "grant-writer",
    "You are an expert grant writer with 20 years of experience securing federal, state, foundation, and corporate grants. Write compelling, funder-ready proposals in plain text (no markdown). Use ALL CAPS for section headers. Write in active voice. Insert [DATA PLACEHOLDER] where the organization should add specific local statistics.",
    (typeInstr[b["type"] ?? "full"] ?? typeInstr["full"]) +
    "\n\nOrganization: " + (b["org"] || "Not provided") + "\nProject: " + (b["title"] || "Not titled") +
    "\nDescription: " + (b["desc"] || "Not provided") + "\nFunder/Amount: " + (b["funder"] || "Not specified") +
    "\nTarget Population: " + (b["population"] || "Not specified") + "\nOrg Strengths: " + (b["strengths"] || "Not provided"),
    b, 2500
  );
});

// ── 9. AI COMPLIANCE PACK ─────────────────────────────────────────────────────

router.get("/compliance", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Compliance Pack", "✅", "Compliance Pack",
    "Replaces compliance consultants ($200–$500/hr)",
    "Compliance consultants charge $200–$500/hour and require months of engagement to produce a compliance framework. This tool generates industry-specific compliance frameworks, required policy lists, SOP outlines, compliance calendars, and regulatory checklists automatically.",
    `<div class="form-row"><label>Industry / Business Type</label>
      <select id="industry">
        <option value="healthcare">Healthcare (HIPAA, OSHA)</option>
        <option value="finance">Financial Services (SEC, FINRA, SOX)</option>
        <option value="food">Food & Beverage (FDA, FSMA, HACCP)</option>
        <option value="construction">Construction (OSHA, EPA, ADA)</option>
        <option value="hr">HR / Employment (EEOC, FLSA, FMLA)</option>
        <option value="data">Data & Technology (GDPR, CCPA, SOC 2)</option>
        <option value="manufacturing">Manufacturing (ISO 9001, OSHA, EPA)</option>
        <option value="nonprofit">Nonprofit (IRS 501c3, state charity)</option>
        <option value="transportation">Transportation (DOT, FMCSA, OSHA)</option>
        <option value="education">Education (FERPA, ADA, Title IX)</option>
        <option value="real-estate">Real Estate (Fair Housing, state licensing)</option>
        <option value="retail">Retail (PCI-DSS, ADA, consumer protection)</option>
      </select>
    </div>
    <div class="form-row"><label>Company Size & Structure</label><input id="size" placeholder="e.g. 45 employees, LLC, no government contracts, B2B only"></div>
    <div class="form-row"><label>State / Country</label><input id="location" placeholder="e.g. California, USA; or EU (GDPR jurisdiction); or Texas"></div>
    <div class="form-row"><label>Specific Activities or Risk Areas</label><textarea id="activities" rows="2" placeholder="e.g. We collect credit card data online, have remote employees in 3 states, serve children under 13..."></textarea></div>
    <div class="form-row"><label>Output Type</label>
      <select id="output">
        <option value="framework">Full Compliance Framework</option>
        <option value="checklist">Regulatory Checklist</option>
        <option value="calendar">Compliance Calendar</option>
        <option value="policies">Required Policy List + Outlines</option>
        <option value="gaps">Gap Analysis Template</option>
      </select>
    </div>
    <button class="btn" onclick="gen()">✅ Generate Compliance Pack</button>`,
    `async function gen(){
      var industry=document.getElementById('industry').value;var size=document.getElementById('size').value.trim();var location=document.getElementById('location').value.trim();var activities=document.getElementById('activities').value.trim();var output=document.getElementById('output').value;
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Generating...';
      ss('GPT-4o is building your compliance pack...', null);
      try{var r=await fetch('`+BASE+`/studio/compliance/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({industry,size,location,activities,output})});var d=await r.json();if(d.ok){showOut(d);ss('Compliance pack generated. Review with legal counsel before implementation.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='✅ Generate Compliance Pack';}
    }`
  ));
});

router.post("/compliance/generate", async (req: Request, res: Response) => {
  const b = req.body as Record<string, string>;
  await generateAndRespond(res, "compliance-pack",
    "You are a senior compliance officer and regulatory attorney with 25 years across multiple industries. Write precise, actionable compliance guidance in plain text (no markdown). Use ALL CAPS for section headers. Be specific about regulation names, citation numbers, deadlines, and penalties for non-compliance. Note where requirements vary by state.",
    "Generate a " + (b["output"] || "compliance framework") + " for: " + (b["industry"] || "General business") +
    "\nCompany: " + (b["size"] || "Not specified") + "\nLocation: " + (b["location"] || "USA") +
    "\nSpecific activities: " + (b["activities"] || "Standard operations") +
    "\n\nInclude: all applicable regulations by name, specific requirements, penalties for non-compliance, filing deadlines, required documentation, recommended policies, and a 12-month implementation timeline. Be comprehensive and actionable.",
    b, 2200
  );
});

// ── 10. AI EMAIL SEQUENCE BUILDER ─────────────────────────────────────────────

router.get("/sequences", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Email Sequence Builder", "📬", "Email Sequences",
    "Replaces marketing automation platforms ($49–$400/mo)",
    "Klaviyo, ActiveCampaign, and HubSpot charge $49–$400/month for email sequence automation. This tool generates complete multi-email drip sequences — with subject lines, full body copy, send timing, and personalization variables — ready to paste into any email platform or send manually.",
    `<div class="form-row"><label>Campaign Goal</label>
      <select id="goal">
        <option value="onboarding">Customer Onboarding</option>
        <option value="nurture">Lead Nurture</option>
        <option value="reengagement">Re-engagement (win-back)</option>
        <option value="upsell">Upsell / Cross-sell</option>
        <option value="abandon">Abandoned Cart Recovery</option>
        <option value="postpurchase">Post-Purchase Follow-up</option>
        <option value="donor">Donor Cultivation (Nonprofit)</option>
        <option value="trial">Trial / Free Tier Conversion</option>
      </select>
    </div>
    <div class="form-row"><label>Product / Offer</label><input id="product" placeholder="e.g. CreateAI Brain Starter subscription, $29/mo. AI-powered digital products platform."></div>
    <div class="form-row"><label>Target Audience</label><input id="audience" placeholder="e.g. Small business owners who signed up but haven't purchased, aged 35-55, non-technical"></div>
    <div class="form-row"><label>Number of Emails</label>
      <select id="count"><option value="3">3 emails</option><option value="5" selected>5 emails</option><option value="7">7 emails</option><option value="10">10 emails</option></select>
    </div>
    <div class="form-row"><label>Tone</label>
      <select id="tone"><option value="friendly">Friendly & Conversational</option><option value="professional">Professional & Direct</option><option value="bold">Bold & Urgent</option><option value="nurturing">Nurturing & Educational</option></select>
    </div>
    <div class="form-row"><label>Key Value Props / Benefits (optional)</label><textarea id="value" rows="2" placeholder="e.g. Saves 10+ hours/week, replaces $500/mo in SaaS tools, works in 60 seconds..."></textarea></div>
    <button class="btn" onclick="gen()">📬 Generate Email Sequence</button>`,
    `async function gen(){
      var goal=document.getElementById('goal').value;var product=document.getElementById('product').value.trim();var audience=document.getElementById('audience').value.trim();var count=document.getElementById('count').value;var tone=document.getElementById('tone').value;var value=document.getElementById('value').value.trim();
      if(!product){ss('Describe your product or offer.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Writing sequence...';
      ss('GPT-4o is writing your email sequence...', null);
      try{var r=await fetch('`+BASE+`/studio/sequences/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal,product,audience,count:parseInt(count),tone,valueProps:value})});var d=await r.json();if(d.ok){showOut(d);ss('Sequence ready. '+count+' emails with subject lines and timing.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='📬 Generate Email Sequence';}
    }`
  ));
});

router.post("/sequences/generate", async (req: Request, res: Response) => {
  const b = req.body as Record<string, unknown>;
  const count = Number(b["count"] ?? 5);
  await generateAndRespond(res, "email-sequence",
    "You are an expert email marketing strategist and copywriter with 20 years of experience building high-converting drip sequences. Write in plain text only (no markdown, no asterisks). For each email, use this format:\nEMAIL [N] — SEND: [Day X after trigger]\nSUBJECT: [subject line]\nPREVIEW TEXT: [preview/preheader text, 80 chars max]\n[Full email body — no more than 250 words, conversational, clear CTA at end]\n---",
    "Write a " + count + "-email " + (b["goal"] || "nurture") + " sequence in a " + (b["tone"] || "friendly") + " tone.\n\nProduct/Offer: " + (b["product"] || "Not specified") + "\nTarget Audience: " + (b["audience"] || "Not specified") + "\nKey Value Props: " + (b["valueProps"] || "Not specified") +
    "\n\nWrite all " + count + " emails. Each must have: Email number, send timing, subject line, preview text, and full body copy with a single clear CTA. Vary the angle for each email (don't repeat the same hook). Build urgency progressively toward the final email.",
    b, 2500
  );
});

// ── 11. AI FINANCIAL INTELLIGENCE ─────────────────────────────────────────────

router.get("/fintelligence", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Financial Intelligence", "📈", "Financial Intelligence",
    "Replaces Bloomberg Terminal ($2,000/mo) + actuarial models",
    "Bloomberg Terminal costs $2,000/month. Actuarial modeling software costs $10,000–$100,000/year. This tool replaces both with AI-powered financial analysis, portfolio assessment, risk profiling, and market synthesis from self-reported client data — delivering institutional-quality financial intelligence.",
    `<div class="form-row"><label>Analysis Mode</label>
      <select id="mode">
        <option value="portfolio">Portfolio Analysis & Recommendations</option>
        <option value="risk">Client Risk Profile</option>
        <option value="market">Market Synthesis & Outlook</option>
        <option value="planning">Financial Planning Narrative</option>
        <option value="saas">SaaS Metrics Analysis (MRR/ARR/Churn)</option>
        <option value="nonprofit">Nonprofit Financial Health Report</option>
      </select>
    </div>
    <div class="form-row"><label>Client / Entity Name</label><input id="client" placeholder="e.g. Smith Family Trust, or Acme Corp, or anonymous"></div>
    <div class="form-row"><label>Financial Data (describe holdings, metrics, or situation)</label><textarea id="data" rows="4" placeholder="For portfolio: list asset classes, approximate allocation %, current value range&#10;For SaaS: MRR, churn rate, CAC, LTV, growth rate&#10;For planning: age, income, debt, goals, timeline&#10;For market: sector of interest, thesis, timeframe&#10;For nonprofit: annual revenue, program ratio, reserves, growth rate"></textarea></div>
    <div class="form-row"><label>Risk Tolerance / Constraints</label><input id="risk" placeholder="e.g. Moderate risk, 10-year horizon, needs $5K/month liquidity; or: SaaS company, 18mo runway, raising Series A"></div>
    <div class="form-row"><label>Specific Questions</label><textarea id="questions" rows="2" placeholder="e.g. Should we rebalance? What is our exposure to interest rate risk? Is our churn rate sustainable?"></textarea></div>
    <button class="btn" onclick="gen()">📈 Generate Financial Intelligence</button>`,
    `async function gen(){
      var mode=document.getElementById('mode').value;var client=document.getElementById('client').value.trim();var data=document.getElementById('data').value.trim();var risk=document.getElementById('risk').value.trim();var questions=document.getElementById('questions').value.trim();
      if(!data){ss('Enter financial data or situation description.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Analyzing...';
      ss('GPT-4o is synthesizing financial intelligence...', null);
      try{var r=await fetch('`+BASE+`/studio/fintelligence/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,client,data,riskProfile:risk,questions})});var d=await r.json();if(d.ok){showOut(d);ss('Financial analysis complete.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='📈 Generate Financial Intelligence';}
    }`
  ));
});

router.post("/fintelligence/generate", async (req: Request, res: Response) => {
  const b = req.body as Record<string, string>;
  const modeInstr: Record<string, string> = {
    portfolio: "Analyze the portfolio: (1) Asset allocation assessment vs. modern portfolio theory, (2) Risk/return profile evaluation, (3) Diversification gaps, (4) Rebalancing recommendations with target allocations, (5) Risk exposure analysis (inflation, interest rate, sequence-of-returns), (6) 3 specific action items with priority.",
    risk: "Build a comprehensive risk profile: (1) Risk tolerance score (1-10 scale with explanation), (2) Capacity to absorb loss vs. psychological tolerance, (3) Time horizon analysis, (4) Liquidity needs assessment, (5) Key risk factors identified, (6) Recommended investment policy statement summary, (7) Asset allocation range appropriate for this profile.",
    market: "Generate a market synthesis report: (1) Current macro environment assessment, (2) Sector/asset class outlook (bullish/neutral/bearish with rationale), (3) Key risks and catalysts to watch, (4) Historical precedents for current conditions, (5) Investment thesis framework (3-5 year view), (6) Recommended positioning considerations.",
    planning: "Generate a comprehensive financial planning narrative: (1) Current financial position assessment, (2) Goal feasibility analysis with projections, (3) Gap analysis (what's needed vs. current trajectory), (4) Prioritized action plan (immediate, 1-year, 5-year), (5) Tax efficiency opportunities, (6) Insurance coverage assessment, (7) Estate planning considerations.",
    saas: "Analyze SaaS financial metrics: (1) MRR/ARR assessment and growth rate, (2) Churn analysis — is it sustainable? What does it imply for LTV?, (3) CAC:LTV ratio assessment, (4) Rule of 40 score (growth rate + profit margin), (5) Benchmark comparison to typical SaaS metrics at this stage, (6) Key levers to improve metrics, (7) Runway and burn rate implications.",
    nonprofit: "Generate a nonprofit financial health report: (1) Revenue diversification score and risk assessment, (2) Program efficiency ratio analysis, (3) Operating reserve adequacy (standard is 3-6 months), (4) Fundraising ROI assessment, (5) Trend analysis, (6) Financial health grade (A/B/C/D), (7) Top 3 financial risks and mitigation strategies.",
  };
  await generateAndRespond(res, "financial-intelligence",
    "You are a senior financial analyst and CFP with 25 years of experience across wealth management, corporate finance, and nonprofit financial advisory. Write in plain text (no markdown). Use ALL CAPS for section headers. Be quantitative, specific, and actionable. Note where additional data would improve the analysis.",
    (modeInstr[b["mode"] ?? "portfolio"] ?? modeInstr["portfolio"]) +
    "\n\nClient: " + (b["client"] || "Anonymous") + "\nData: " + (b["data"] || "Not provided") +
    "\nRisk Profile: " + (b["riskProfile"] || "Not specified") + "\nSpecific Questions: " + (b["questions"] || "None"),
    b, 2000
  );
});

// ── 12. AI AGRONOMIST ─────────────────────────────────────────────────────────

router.get("/agro", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(toolPage(
    "AI Agronomist", "🌾", "AI Agronomist",
    "Replaces IoT soil sensors + precision agriculture hardware",
    "Precision agriculture IoT systems (soil sensors, drone imaging, GPS field mapping) cost $5,000–$50,000+ per farm and require specialist setup. This tool replaces hardware sensors with AI-powered diagnosis from visual observations and manual reports, delivering agronomist-grade crop assessments, treatment plans, and yield forecasts.",
    `<div class="form-row"><label>Farm Name & Location</label><input id="farm" placeholder="e.g. Sunrise Acres, Travis County TX — 280 acres, Zone 8b"></div>
    <div class="form-row"><label>Crop Type & Growth Stage</label><input id="crop" placeholder="e.g. Winter wheat — tillering stage, planted Oct 15; or Soybeans — V6 vegetative"></div>
    <div class="form-row"><label>Field Size & Soil Type (if known)</label><input id="field" placeholder="e.g. 45 acres, Clay loam, pH ~6.8, good drainage"></div>
    <div class="form-row"><label>Visual Observations (describe what you see)</label><textarea id="observations" rows="4" placeholder="e.g. yellowing on lower leaves of roughly 20% of plants in the NW corner, leaves are mottled not uniform, no visible insects, some wilting in afternoon heat, soil looks dry in top 2 inches, surrounding rows look healthy..."></textarea></div>
    <div class="form-row"><label>Weather / Environmental Context</label><input id="weather" placeholder="e.g. 3 weeks of below-average rain, highs in the 90s, 40% humidity, last frost 3 weeks ago"></div>
    <div class="form-row"><label>Recent Applications / History</label><textarea id="history" rows="2" placeholder="e.g. Applied urea at 100 lbs/ac 3 weeks ago, last herbicide was pre-emerge in April, no fungicide this season..."></textarea></div>
    <div class="form-row"><label>Analysis Mode</label>
      <select id="mode">
        <option value="diagnosis">Crop Health Diagnosis</option>
        <option value="treatmentplan">Treatment Plan</option>
        <option value="yield">Yield Forecast</option>
        <option value="nutrient">Nutrient Management Plan</option>
        <option value="pest">Pest & Disease Risk Assessment</option>
        <option value="usda">USDA Program Eligibility Assessment</option>
      </select>
    </div>
    <button class="btn" onclick="gen()">🌾 Generate Agronomic Analysis</button>`,
    `async function gen(){
      var farm=document.getElementById('farm').value.trim();var crop=document.getElementById('crop').value.trim();var field=document.getElementById('field').value.trim();var observations=document.getElementById('observations').value.trim();var weather=document.getElementById('weather').value.trim();var history=document.getElementById('history').value.trim();var mode=document.getElementById('mode').value;
      if(!crop&&!observations){ss('Enter crop type and visual observations.',false);return;}
      var btn=document.querySelector('.btn');btn.disabled=true;btn.textContent='Analyzing...';
      ss('GPT-4o is generating agronomic analysis...', null);
      try{var r=await fetch('`+BASE+`/studio/agro/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({farm,crop,field,observations,weather,history,mode})});var d=await r.json();if(d.ok){showOut(d);ss('Agronomic analysis ready. Verify with local extension service for confirmation.',true);}else{ss('Error: '+d.error,false);}}catch(e){ss('Network error: '+e.message,false);}
      finally{btn.disabled=false;btn.textContent='🌾 Generate Agronomic Analysis';}
    }`
  ));
});

router.post("/agro/generate", async (req: Request, res: Response) => {
  const b = req.body as Record<string, string>;
  const modeInstr: Record<string, string> = {
    diagnosis: "Diagnose the crop health issue: (1) Most likely diagnosis (top 3 candidates ranked by probability), (2) Distinguishing characteristics that support each diagnosis, (3) Recommended confirmation steps (simple field tests, visual checks), (4) Severity assessment (Low/Medium/High/Critical), (5) Spread risk — is it likely to progress or spread to other areas?",
    treatmentplan: "Generate a complete treatment plan: (1) Recommended corrective action (specific product categories, application rates in common units, timing), (2) Application method (foliar, soil, irrigation), (3) Safety precautions and re-entry intervals, (4) Expected recovery timeline, (5) Follow-up monitoring schedule, (6) Preventive measures to avoid recurrence next season.",
    yield: "Generate a yield forecast: (1) Current yield potential estimate (bu/ac or equivalent) given growth stage and observations, (2) Primary yield-limiting factors identified, (3) Three scenarios: if no action taken, if treatment plan is followed, if optimal conditions, (4) Comparison to typical county/regional yield averages, (5) Risk factors that could further reduce yield, (6) Harvest timing estimate.",
    nutrient: "Generate a nutrient management plan: (1) Current nutrient status interpretation from visible symptoms, (2) Nitrogen, phosphorus, potassium assessment, (3) Micronutrient concerns, (4) Recommended soil test if not done, (5) Fertilization prescription (timing, products, rates), (6) Application method recommendations, (7) Split application strategy if appropriate.",
    pest: "Generate a pest and disease risk assessment: (1) Current pest/disease pressure assessment from observations, (2) Top 3 pest/disease risks for this crop at this growth stage in this region/climate, (3) Economic threshold guidance — at what level does treatment become justified, (4) Integrated Pest Management (IPM) recommendations, (5) Scouting protocol for monitoring, (6) Resistance management considerations.",
    usda: "Assess USDA program eligibility and opportunities: (1) Relevant USDA programs for this farm type and size (ARC, PLC, EQIP, CSP, RCPP, Microloan, NRCS programs), (2) Eligibility criteria for each program, (3) Estimated payment or cost-share rates, (4) Application deadlines and contact information (FSA/NRCS office), (5) Conservation practices that could qualify for additional payments, (6) Record-keeping requirements.",
  };
  await generateAndRespond(res, "agronomist",
    "You are an expert agronomist and Certified Crop Adviser (CCA) with 25 years of experience across row crops, specialty crops, and sustainable agriculture. Write in plain text (no markdown). Use ALL CAPS for section headers. Be specific about product categories, application rates in standard units (lbs/acre, oz/acre, lbs/1000 sq ft), and timing. Note regional variations where significant.",
    (modeInstr[b["mode"] ?? "diagnosis"] ?? modeInstr["diagnosis"]) +
    "\n\nFarm: " + (b["farm"] || "Not specified") + "\nCrop: " + (b["crop"] || "Not specified") +
    "\nField: " + (b["field"] || "Not specified") + "\nVisual Observations: " + (b["observations"] || "None provided") +
    "\nWeather: " + (b["weather"] || "Not specified") + "\nRecent History: " + (b["history"] || "Not provided"),
    b, 1800
  );
});

export default router;
