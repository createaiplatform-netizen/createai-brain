import React, { useState, useRef, useEffect } from "react";
import { useOS } from "@/os/OSContext";
import { BrainGen } from "@/engine/BrainGen";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";
import { streamEngine } from "@/controller";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Opportunity {
  id: string;
  title: string;
  type: string;
  description: string;
  estimatedValue: string;
  effort: "Low" | "Medium" | "High";
  readiness: number;
}

const SEED_OPPORTUNITIES: Opportunity[] = [
  { id: "o1", title: "Horse Boarding Membership Package", type: "Subscription", description: "Monthly recurring membership for horse boarding clients with tiered access levels.", estimatedValue: "$2,400–$4,800/mo", effort: "Low", readiness: 85 },
  { id: "o2", title: "Healthcare Demo Tour Package", type: "Service", description: "Guided demo sessions for healthcare organizations exploring digital transformation.", estimatedValue: "$500–$1,500/session", effort: "Low", readiness: 92 },
  { id: "o3", title: "CreateAI Brain Creator License", type: "SaaS", description: "Monthly creator license for individuals building with the platform.", estimatedValue: "$79/mo per user", effort: "Medium", readiness: 78 },
  { id: "o4", title: "Marketing Content Bundle", type: "Digital Product", description: "Done-for-you monthly content bundles: social, email, ads, blogs.", estimatedValue: "$300–$800/bundle", effort: "Low", readiness: 88 },
  { id: "o5", title: "Operations System Build Service", type: "Done-For-You", description: "Custom operations system scaffold built to the client's industry and team.", estimatedValue: "$1,500–$5,000/project", effort: "High", readiness: 65 },
  { id: "o6", title: "Group Training: AI Platform Foundations", type: "Education", description: "Live group training session on using CreateAI for business automation.", estimatedValue: "$200–$500/person", effort: "Medium", readiness: 72 },
  { id: "o7", title: "Multilingual Content Service", type: "Service", description: "Content generation in English + Tamil + Spanish for multi-cultural audiences.", estimatedValue: "$400–$1,200/mo", effort: "Medium", readiness: 68 },
  { id: "o8", title: "White-Label Platform License", type: "Enterprise", description: "Platform licensed under the client's brand for their own user base.", estimatedValue: "Custom — $5,000+/mo", effort: "High", readiness: 45 },
];

const PLANS = [
  { name: "Starter",    price: "$29/mo", features: ["5 projects", "Basic tools", "Chat access", "Email support"],                                              color: "#34C759" },
  { name: "Creator",    price: "$79/mo", features: ["Unlimited projects", "All tools", "Priority AI", "Marketing engine", "Phone support"],                    color: "#007AFF" },
  { name: "Enterprise", price: "Custom", features: ["White-label", "Custom engines", "Dedicated support", "API access", "Live mode ready"],                    color: "#BF5AF2" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function effortBadge(effort: Opportunity["effort"]) {
  const map = {
    Low:    "text-green-400",
    Medium: "text-orange-400",
    High:   "text-red-400",
  };
  const bg = {
    Low:    "rgba(34,197,94,0.12)",
    Medium: "rgba(249,115,22,0.12)",
    High:   "rgba(239,68,68,0.12)",
  };
  const border = {
    Low:    "rgba(34,197,94,0.25)",
    Medium: "rgba(249,115,22,0.25)",
    High:   "rgba(239,68,68,0.25)",
  };
  return { className: map[effort], bg: bg[effort], border: border[effort] };
}

// ─── Opportunity detail ───────────────────────────────────────────────────────
function OpportunityDetail({ opp, onBack }: { opp: Opportunity; onBack: () => void }) {
  const [staged, setStaged]         = useState(false);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan]             = useState<{email: string; campaign: string; adCopy: string} | null>(null);
  const [copied, setCopied]         = useState<string | null>(null);

  const handleStage = async () => {
    setGenerating(true);
    const [emailRes, campaignRes, adRes] = await Promise.all([
      BrainGen.generateEmail(
        `${opp.title} — write a compelling 3-email launch sequence for this offer: ${opp.description}. First email announces it, second shows value, third drives action.`,
        "Launch",
        "Empowering",
      ),
      BrainGen.generateCampaign(
        `${opp.title} — create a 30-day launch campaign plan including social posts, email dates, ad targeting, and a soft-launch strategy. Estimated value: ${opp.estimatedValue}.`,
        "Entrepreneurs",
        "30 days",
      ),
      BrainGen.generateAdCopy(
        `${opp.title} — ${opp.description}`,
        "General",
      ),
    ]);
    setPlan({ email: emailRes.content, campaign: campaignRes.content, adCopy: adRes.content });
    setStaged(true);
    setGenerating(false);
  };

  const copy = (what: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="p-5 space-y-5 overflow-y-auto">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ Opportunities</button>
      <div>
        <h2 className="text-xl font-bold text-foreground">{opp.title}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(14,165,233,0.12)", color: "#38bdf8", border: "1px solid rgba(14,165,233,0.22)" }}>{opp.type}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${effortBadge(opp.effort).className}`} style={{ background: effortBadge(opp.effort).bg, border: `1px solid ${effortBadge(opp.effort).border}` }}>{opp.effort} Effort</span>
        </div>
      </div>

      <div className="rounded-2xl border divide-y divide-white/5">
        {[
          { label: "Description",       value: opp.description },
          { label: "Estimated Value",   value: opp.estimatedValue },
          { label: "Readiness Score",   value: `${opp.readiness}% — ready to test` },
          { label: "Recommended Action",value: "Generate the content plan below, review it, then soft-launch to existing contacts." },
          { label: "Next Revenue Step", value: "Share via email or text to warm contacts. No cold outreach required." },
        ].map(row => (
          <div key={row.label} className="px-4 py-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{row.label}</p>
            <p className="text-[13px] text-foreground mt-0.5">{row.value}</p>
          </div>
        ))}
      </div>

      {/* Stage button */}
      {!staged && !generating && (
        <button onClick={handleStage}
          className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          🧠 Generate Full Content Plan &amp; Stage
        </button>
      )}

      {generating && (
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-[14px] text-foreground">Brain is building your content plan…</p>
          <p className="text-[12px] text-muted-foreground">Email sequence · Campaign plan · Ad copy — all generating now</p>
        </div>
      )}

      {/* Generated plan */}
      {staged && plan && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="font-bold text-green-400 text-[14px]">✓ Content Plan Generated — Ready for Your Review</p>
            <p className="text-[12px] text-green-600 mt-1">Review each section below. Copy what you want to use. Nothing is sent automatically.</p>
          </div>

          {[
            { key: "email",    label: "📧 Email Sequence (3-Part)", content: plan.email },
            { key: "campaign", label: "📅 30-Day Campaign Plan",    content: plan.campaign },
            { key: "adCopy",   label: "📣 Ad Copy",                 content: plan.adCopy },
          ].map(({ key, label, content }) => (
            <div key={key} className="border rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[13px] text-foreground flex-1">{label}</p>
                <button onClick={() => copy(key, content)}
                  className="text-[11px] bg-muted text-muted-foreground font-semibold px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-colors flex-shrink-0">
                  {copied === key ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <div className="bg-muted/15 rounded-xl p-3 max-h-40 overflow-y-auto">
                <pre className="text-[11px] text-foreground whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">All content is generated for your review. No real revenue flows are created without your explicit approval.</p>
    </div>
  );
}

// ─── Smart 24H Engine ─────────────────────────────────────────────────────────
function SmartEngine() {
  const [running, setRunning] = useState(false);
  const [discovered, setDiscovered] = useState<Opportunity[]>([]);
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  if (selectedOpp) return <OpportunityDetail opp={selectedOpp} onBack={() => setSelectedOpp(null)} />;

  const runCycle = () => {
    setPhase("scanning");
    setRunning(true);
    setDiscovered([]);
    setCycleCount(c => c + 1);

    const shuffled = [...SEED_OPPORTUNITIES].sort(() => Math.random() - 0.5);
    const toDiscover = shuffled.slice(0, 5 + Math.floor(Math.random() * 3));

    toDiscover.forEach((opp, i) => {
      const t = setTimeout(() => {
        setDiscovered(prev => {
          if (prev.find(p => p.id === opp.id)) return prev;
          return [...prev, opp];
        });
      }, 600 + i * 700);
      timerRef.current.push(t);
    });

    const done = setTimeout(() => {
      setPhase("done");
      setRunning(false);
    }, 600 + toDiscover.length * 700 + 400);
    timerRef.current.push(done);
  };

  const reset = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setPhase("idle");
    setRunning(false);
    setDiscovered([]);
  };

  useEffect(() => () => { timerRef.current.forEach(clearTimeout); }, []);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-[14px] text-foreground">Smart 24H Opportunity Engine</p>
            <p className="text-[12px] text-muted-foreground">Simulates a full 24-hour revenue opportunity search — surfacing packages, services, and offers instantly.</p>
          </div>
          <div className="flex-shrink-0">
            {phase === "scanning" && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
            {phase === "done" && <span className="text-green-500 text-xl">✓</span>}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={runCycle} disabled={running}
            className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
            {phase === "idle" ? "▶ Run Cycle" : phase === "scanning" ? "Scanning…" : `▶ Run Again (${cycleCount} done)`}
          </button>
          {discovered.length > 0 && !running && (
            <button onClick={reset} className="px-4 py-2.5 border border-white/8 rounded-xl text-[12px] text-muted-foreground hover:bg-muted transition-colors">
              Reset
            </button>
          )}
        </div>
      </div>

      {phase === "scanning" && discovered.length === 0 && (
        <div className="flex items-center gap-3 text-muted-foreground text-[13px] py-4 justify-center">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Scanning your platform, industry, and market context…</span>
        </div>
      )}

      {discovered.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {phase === "scanning" ? `Discovering… (${discovered.length} found)` : `${discovered.length} Opportunities Found`}
          </p>
          {discovered.map((opp, i) => (
            <button key={opp.id} onClick={() => setSelectedOpp(opp)}
              className="w-full flex items-start gap-3 p-4 rounded-2xl border hover:border-primary/20 hover:shadow-sm transition-all text-left animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {opp.type === "Subscription" ? "♻️" : opp.type === "SaaS" ? "☁️" : opp.type === "Education" ? "🎓" : opp.type === "Enterprise" ? "🏢" : "💡"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[13px] text-foreground leading-tight">{opp.title}</p>
                  <span className="text-[10px] font-bold text-green-600 flex-shrink-0">{opp.readiness}% ready</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{opp.estimatedValue}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(14,165,233,0.12)", color: "#38bdf8", border: "1px solid rgba(14,165,233,0.22)" }}>{opp.type}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${effortBadge(opp.effort).className}`} style={{ background: effortBadge(opp.effort).bg, border: `1px solid ${effortBadge(opp.effort).border}` }}>{opp.effort}</span>
                </div>
              </div>
              <span className="text-muted-foreground text-xs mt-1 flex-shrink-0">→</span>
            </button>
          ))}
        </div>
      )}

      {phase === "done" && (
        <p className="text-[11px] text-muted-foreground text-center">All opportunities are mock and structural only. No real revenue flows created.</p>
      )}
    </div>
  );
}

// ─── Offer & Funnel Generator ─────────────────────────────────────────────────
function FunnelGenerator() {
  const { preferences } = useOS();
  const [offerName, setOfferName] = useState("");
  const [price, setPrice] = useState("");
  const [audience, setAudience] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    if (!offerName.trim()) return;
    setStreaming(true);
    setStreamText("");
    setDone(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let acc = "";
      await streamEngine({
        engineId: "MonetizationEngine",
        topic: [
          `OFFER & FUNNEL GENERATOR`,
          `Offer Name: ${offerName}`,
          price ? `Price: ${price}` : "",
          audience ? `Target Audience: ${audience}` : "",
          preferences.tone ? `Tone: ${preferences.tone}` : "",
          `\nGenerate a complete offer package: compelling offer write-up, full funnel stages, 3 follow-up emails, ad copy, and a sales script.`,
        ].filter(Boolean).join("\n"),
        signal: controller.signal,
        onChunk: chunk => { acc += chunk; setStreamText(acc); },
        onDone: () => setDone(true),
      });
    } catch (err: any) {
      if (err.name !== "AbortError") setStreamText("[Generation error — please try again.]");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(streamText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const reset = () => {
    abortRef.current?.abort();
    setStreamText(""); setDone(false); setStreaming(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-orange-500/5 to-pink-500/5 border border-orange-200/50 rounded-2xl p-4">
        <p className="font-bold text-[14px] text-foreground">Offer & Funnel Generator</p>
        <p className="text-[12px] text-muted-foreground">Creates your full offer package: offer write-up, funnel stages, 3 emails, ad copy, and a sales script.</p>
      </div>

      {!streamText && (
        <div className="space-y-3">
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Offer / Product Name</label>
            <input value={offerName} onChange={e => setOfferName(e.target.value)} placeholder="e.g. Monthly Horse Boarding Membership"
              className="w-full border rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Price (optional)</label>
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. $297/mo or Custom"
              className="w-full border rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Target Audience</label>
            <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Horse owners in rural Minnesota"
              className="w-full border rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <p className="text-[11px] text-muted-foreground">Tone from your Preference Brain: <strong>{preferences.tone}</strong></p>
          <button onClick={generate} disabled={!offerName.trim() || streaming}
            className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
            ✨ Generate Full Offer Package
          </button>
        </div>
      )}

      {streaming && !streamText && (
        <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground text-[13px]">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Building your offer + funnel package…</span>
        </div>
      )}

      {streamText && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {streaming && <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />}
            {done && !streaming && <span className="text-green-500 text-sm">✓ Complete</span>}
            <div className="flex gap-2 ml-auto">
              {!streaming && (
                <>
                  <button onClick={copy} className="text-[12px] bg-muted border border-white/8 rounded-lg px-3 py-1.5 text-foreground hover:bg-muted/80 transition-colors">
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                  <button onClick={reset} className="text-[12px] bg-primary text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity">
                    New Offer
                  </button>
                </>
              )}
              {streaming && (
                <button onClick={reset} className="text-[12px] rounded-lg px-3 py-1.5 transition-colors" style={{ background: "rgba(239,68,68,0.10)", color: "#f87171", border: "1px solid rgba(239,68,68,0.20)" }}>
                  Stop
                </button>
              )}
            </div>
          </div>
          <div className="bg-muted/20 border border-white/6 rounded-2xl p-4 max-h-[55vh] overflow-y-auto">
            <pre className="text-[12px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {streamText}
              {streaming && <span className="inline-block w-2 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" />}
            </pre>
          </div>
          {!streaming && (
            <div className="flex gap-2">
              <button onClick={() => setShowSaveModal(true)}
                className="flex-1 text-[12px] font-semibold py-2.5 rounded-xl text-white transition-all"
                style={{ background: "rgba(99,102,241,0.70)" }}>
                💾 Save to Project
              </button>
              <button onClick={() => {
                  const blob = new Blob([streamText], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url;
                  a.download = `${offerName.replace(/\s+/g, "_")}_funnel.txt`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 text-[12px] font-semibold py-2.5 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}>
                ↓ Export
              </button>
            </div>
          )}
          {!streaming && <p className="text-[10px] text-muted-foreground text-center">All content is mock and structural only. Stage for review before any real use.</p>}
        </div>
      )}
      {showSaveModal && (
        <SaveToProjectModal
          content={streamText}
          label={`${offerName} — Offer Package`}
          defaultFileType="Offer Funnel"
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

// ─── Preference Brain ─────────────────────────────────────────────────────────
function PreferenceBrainPanel() {
  const { preferences, updatePreferences } = useOS();
  const [saved, setSaved] = useState(false);

  const TONES = ["Professional", "Plain Language", "Executive Brief", "Educational", "Empowering", "Clinical Structural"] as const;
  const LANGUAGES = ["English", "Tamil", "Tamil–English", "Spanish", "French"] as const;
  const STYLES = ["Guided", "Smart", "Fast", "Adaptive"] as const;
  const INTERESTS_OPTIONS = ["Healthcare", "Marketing", "Operations", "Finance", "Construction", "Education", "Retail", "Technology", "Nonprofit"];

  const save = () => {
    // updatePreferences is already called on each interaction (tone/language/style/interests).
    // This button gives explicit confirmation and also forces a server sync via updatePreferences.
    updatePreferences({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleInterest = (interest: string) => {
    const current = preferences.interests;
    if (current.includes(interest)) {
      updatePreferences({ interests: current.filter(i => i !== interest) });
    } else {
      updatePreferences({ interests: [...current, interest] });
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-200/50 rounded-2xl p-4">
        <p className="font-bold text-[14px] text-foreground">Personal Preference Brain</p>
        <p className="text-[12px] text-muted-foreground">Your preferences shape tone, language, and interaction style across all engines. Group memory manages your team.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Preferred Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button key={t} onClick={() => updatePreferences({ tone: t })}
                className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${preferences.tone === t ? "bg-primary text-white border-primary" : "border-white/8 text-muted-foreground hover:border-primary/30"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Platform Language</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => updatePreferences({ language: l })}
                className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${preferences.language === l ? "bg-primary text-white border-primary" : "border-white/8 text-muted-foreground hover:border-primary/30"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Interaction Style</label>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map(s => (
              <button key={s} onClick={() => updatePreferences({ interactionStyle: s })}
                className={`py-2 rounded-xl text-[12px] font-semibold border transition-all ${preferences.interactionStyle === s ? "bg-primary text-white border-primary" : "border-white/8 text-muted-foreground hover:border-primary/30"}`}>
                {s}
                <span className="block text-[10px] opacity-70 font-normal">
                  {s === "Guided" ? "Step by step" : s === "Smart" ? "Contextual help" : s === "Fast" ? "Skip intro" : "Reads the room"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Industry Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS_OPTIONS.map(ind => (
              <button key={ind} onClick={() => toggleInterest(ind)}
                className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${preferences.interests.includes(ind) ? "bg-primary/10 text-primary border-primary/30" : "border-white/8 text-muted-foreground hover:border-primary/30"}`}>
                {ind}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Revenue Share (%)</label>
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={50} step={1} value={preferences.revenueShare}
              onChange={e => updatePreferences({ revenueShare: parseInt(e.target.value) })}
              className="flex-1 accent-primary" />
            <span className="text-[14px] font-bold text-foreground w-12 text-right">{preferences.revenueShare}%</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Platform revenue share — default 25%, adjustable including 0%. Mock only.</p>
        </div>

        <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-white/8">
          <div>
            <p className="font-semibold text-[13px] text-foreground">Zero Overwhelm Mode</p>
            <p className="text-[11px] text-muted-foreground">Reduce visible options across all apps</p>
          </div>
          <button onClick={() => updatePreferences({ zeroOverwhelmMode: !preferences.zeroOverwhelmMode })}
            className={`relative w-11 h-6 rounded-full transition-colors ${preferences.zeroOverwhelmMode ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${preferences.zeroOverwhelmMode ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        <div className="rounded-2xl border p-4 space-y-2">
          <p className="font-semibold text-[13px] text-foreground">Group Memory (Mock)</p>
          {preferences.groupMembers.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">{m[0]}</div>
              <p className="text-[12px] text-foreground">{m}</p>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground">Group memory adapts engine behavior for each member's role and preferences.</p>
        </div>

        <button onClick={save}
          className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">
          {saved ? "✓ Preferences Saved" : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

// ─── Plans tab ─────────────────────────────────────────────────────────────────
function PlansTab() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {PLANS.map(plan => (
        <div key={plan.name} className="p-4 rounded-2xl border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-[15px] text-foreground">{plan.name}</p>
              <p className="text-[13px] font-semibold" style={{ color: plan.color }}>{plan.price}</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.22)" }}>MOCK</span>
          </div>
          <div className="space-y-1 mb-3">
            {plan.features.map(f => (
              <p key={f} className="text-[12px] text-muted-foreground flex items-center gap-2">
                <span className="text-green-500">✓</span> {f}
              </p>
            ))}
          </div>
          <button onClick={() => setSelected(selected === plan.name ? null : plan.name)}
            className="w-full py-2 rounded-xl text-[12px] font-semibold border transition-all border-primary/20 text-primary hover:bg-primary/5">
            {selected === plan.name ? "✓ Selected (Mock)" : "Select Plan (Mock)"}
          </button>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground text-center">All plans are mock. No real billing occurs.</p>
    </div>
  );
}

// ─── Revenue tab ─────────────────────────────────────────────────────────────
function RevenueTab() {
  const { preferences } = useOS();
  const stats = [
    { label: "Monthly Revenue (Mock)", value: "$3,240", color: "#34C759" },
    { label: `Platform Share (${preferences.revenueShare}%)`, value: `$${Math.round(3240 * preferences.revenueShare / 100)}`, color: "#007AFF" },
    { label: "Active Users (Mock)", value: "14", color: "#5856D6" },
    { label: "Pending Payouts", value: `$${Math.round(3240 * (1 - preferences.revenueShare / 100))}`, color: "#FF9500" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl border p-4 text-center">
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border p-4 space-y-2">
        <p className="font-semibold text-[13px] text-foreground">Revenue Breakdown (Mock)</p>
        {[
          { source: "Creator Licenses", amount: "$1,580" },
          { source: "Service Packages", amount: "$920" },
          { source: "Digital Products", amount: "$740" },
        ].map(row => (
          <div key={row.source} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
            <p className="text-[12px] text-foreground">{row.source}</p>
            <p className="text-[12px] font-semibold text-foreground">{row.amount}</p>
          </div>
        ))}
      </div>
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
        <p className="text-[12px] text-orange-700">All figures are mock. Revenue share is {preferences.revenueShare}% — adjustable in Preferences tab. No real transactions processed.</p>
      </div>
    </div>
  );
}

// ─── Main MonetizationApp ────────────────────────────────────────────────────
type MonetizeTab = "engine" | "funnel" | "preferences" | "plans" | "revenue";

export function MonetizationApp() {
  const [tab, setTab] = useState<MonetizeTab>("engine");

  const TABS: { id: MonetizeTab; label: string; icon: string }[] = [
    { id: "engine",      label: "Opportunities", icon: "⚡" },
    { id: "funnel",      label: "Funnels",        icon: "🎯" },
    { id: "preferences", label: "Brain",          icon: "🧠" },
    { id: "plans",       label: "Plans",          icon: "📦" },
    { id: "revenue",     label: "Revenue",        icon: "💰" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4 pb-0 space-y-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Monetization Hub</h2>
          <p className="text-[12px] text-muted-foreground">Smart 24H Engine · Offer Builder · Preference Brain · Plans · Revenue</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-3">
        {tab === "engine"      && <SmartEngine />}
        {tab === "funnel"      && <FunnelGenerator />}
        {tab === "preferences" && <PreferenceBrainPanel />}
        {tab === "plans"       && <PlansTab />}
        {tab === "revenue"     && <RevenueTab />}
      </div>
    </div>
  );
}
