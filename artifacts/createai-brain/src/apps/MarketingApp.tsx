import React from "react";

const ASSETS = [
  { type: "Website Copy", icon: "🌐", desc: "Hero, features, about, CTA" },
  { type: "Pitch Deck", icon: "📊", desc: "Slide-by-slide outline" },
  { type: "Social Posts", icon: "📱", desc: "LinkedIn, Instagram, X, Facebook" },
  { type: "Brand Kit", icon: "🎨", desc: "Voice, tone, taglines, values" },
  { type: "Email Sequence", icon: "📧", desc: "Outreach, follow-up, re-engage" },
  { type: "Brochure", icon: "📋", desc: "One-pager or multi-section" },
];

export function MarketingApp() {
  const [active, setActive] = React.useState<string | null>(null);
  const [brief, setBrief] = React.useState("");
  const [output, setOutput] = React.useState<string | null>(null);

  const generate = () => {
    if (!active || !brief.trim()) return;
    const asset = ASSETS.find(a => a.type === active)!;
    setOutput(`[Mock ${asset.type} — CreateAI Brain]\n\nBrief: "${brief}"\n\n--- Generated Content ---\n\nHeadline: The Platform That Builds Everything\nSubheadline: From idea to execution — instantly, intelligently, and beautifully.\n\nSection 1 — The Problem\nEvery business needs a system. Most systems take months to build, cost thousands, and still leave gaps.\n\nSection 2 — The Solution\nCreateAI Brain is the infrastructure underneath your business — the brain that builds the things so you don't have to.\n\nSection 3 — Key Benefits\n• Instant creation across every industry\n• Adaptive to every user, every role, every workflow\n• Safe, mock, and structurally ready for real-world expansion\n\nCTA: Request a Demo → [Link Placeholder]\n\n[All content is mock and for planning purposes only. Not professional marketing advice.]`);
  };

  if (active) {
    const asset = ASSETS.find(a => a.type === active)!;
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => { setActive(null); setOutput(null); setBrief(""); }} className="text-primary text-sm font-medium">‹ Marketing</button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{asset.icon}</span>
          <h2 className="text-xl font-bold text-foreground">{asset.type}</h2>
        </div>
        <textarea value={brief} onChange={e => setBrief(e.target.value)}
          placeholder="Describe your product, audience, tone, and goals..."
          className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all" rows={4} />
        <button onClick={generate} disabled={!brief.trim()} className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
          Generate (Mock)
        </button>
        {output && (
          <div className="bg-muted/50 border border-border/50 rounded-xl p-4">
            <pre className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">{output}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-xl font-bold text-foreground">Marketing Studio</h2>
      <p className="text-[13px] text-muted-foreground">Select an asset type and describe what you need. The Marketing Engine generates fully structured mock content instantly.</p>
      <div className="grid grid-cols-2 gap-3">
        {ASSETS.map(a => (
          <button key={a.type} onClick={() => setActive(a.type)}
            className="flex flex-col items-start gap-2 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
            <span className="text-2xl">{a.icon}</span>
            <p className="font-semibold text-[13px] text-foreground">{a.type}</p>
            <p className="text-[11px] text-muted-foreground">{a.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
