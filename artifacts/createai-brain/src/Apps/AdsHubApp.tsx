import { useState, useEffect } from "react";

const API = "/api";

type Platform = {
  id: string; name: string; icon: string; color: string; handle: string;
  bio: string; adFormatsCount: number; hasContentTemplates: boolean;
  strategy: { objective: string; audience: string; budget: string; bestTimes: string; frequency: string; kpis: string[] };
};
type Asset = {
  brand: any; platforms: any[]; hashtagSets: any;
  totalAdFormats: number; totalContentTemplates: number;
};
type CalendarDay = { day: number; theme: string; focus: string; platform: string; type: string; status: string };

export default function AdsHubApp() {
  const [tab, setTab] = useState<"dashboard"|"platforms"|"calendar"|"scripts"|"banners"|"funnels"|"generate">("dashboard");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [assets, setAssets] = useState<Asset | null>(null);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [funnels, setFunnels] = useState<any[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<any | null>(null);
  const [brand, setBrand] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ platform: "linkedin", format: "Single Image Ad", industry: "Healthcare", context: "", tone: "professional" });
  const [genResult, setGenResult] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/advertising/platforms`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/advertising/assets`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/advertising/calendar`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/advertising/scripts`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/advertising/banners`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/advertising/funnels`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/advertising/brand`, { credentials: "include" }).then(r => r.json()),
    ]).then(([pl, as, ca, sc, bn, fn, br]) => {
      if (pl.ok) setPlatforms(pl.platforms);
      if (as.ok) setAssets(as.assets);
      if (ca.ok) setCalendar(ca.calendar);
      if (sc.ok) setScripts(sc.scripts);
      if (bn.ok) setBanners(bn.banners);
      if (fn.ok) setFunnels(fn.funnels);
      if (br.ok) setBrand(br.brand);
    }).finally(() => setLoading(false));
  }, []);

  async function loadPlatformDetail(id: string) {
    const r = await fetch(`${API}/advertising/platform/${id}`, { credentials: "include" });
    const d = await r.json();
    if (d.ok) { setSelectedPlatform(d.platform); setTab("platforms"); }
  }

  async function handleGenerate() {
    setGenerating(true); setGenResult("");
    try {
      const r = await fetch(`${API}/advertising/generate`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genForm)
      });
      const d = await r.json();
      setGenResult(d.generated ?? d.error ?? "No result");
    } catch { setGenResult("Network error"); } finally { setGenerating(false); }
  }

  const T = {
    tab: "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
    active: "bg-indigo-600 text-white",
    inactive: "text-slate-400 hover:text-white hover:bg-slate-800",
    card: "bg-slate-900 border border-slate-800 rounded-xl p-5",
    badge: "px-2 py-0.5 rounded text-xs font-bold",
    h2: "text-lg font-bold text-white mb-4",
    label: "text-xs text-slate-500 uppercase tracking-wider mb-1",
    val: "text-sm text-slate-200",
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-4xl mb-4">📢</div>
        <div className="text-slate-400 text-sm">Loading Advertising Hub…</div>
      </div>
    </div>
  );

  const TABS = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "platforms", label: "🌐 Platforms" },
    { id: "calendar", label: "📅 Calendar" },
    { id: "scripts", label: "🎬 Scripts" },
    { id: "banners", label: "🖼️ Banners" },
    { id: "funnels", label: "🔀 Funnels" },
    { id: "generate", label: "✨ AI Generate" },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Advertising Hub</h1>
            <p className="text-xs text-slate-500 mt-0.5">All platform assets, ad templates, scripts & content — internal only</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30">FULLY READY</span>
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded border border-indigo-500/30">INTERNAL ONLY</span>
          </div>
        </div>
        <div className="flex gap-1 mt-3 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id as any); setSelectedPlatform(null); }}
              className={`${T.tab} ${tab === t.id ? T.active : T.inactive} whitespace-nowrap flex-shrink-0`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            {brand && (
              <div className={T.card}>
                <div className={T.h2}>Brand Identity</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className={T.label}>Platform Name</div>
                    <div className="text-indigo-400 font-black text-xl">{brand.name}</div>
                    <div className="text-slate-400 text-sm mt-1">{brand.tagline}</div>
                  </div>
                  <div>
                    <div className={T.label}>Alt Tagline</div>
                    <div className="text-slate-300 text-sm font-semibold">{brand.taglineAlt}</div>
                    <div className="text-slate-500 text-xs mt-1">{brand.company}</div>
                  </div>
                </div>
                <div className={T.label}>Voice & Tone</div>
                <div className={T.val}>{brand.voice.tone}</div>
                <div className="mt-3">
                  <div className={T.label}>Core Value Props</div>
                  <div className="space-y-1 mt-1">
                    {brand.valueProps?.map((v: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-indigo-400 mt-0.5">✓</span><span>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className={T.card}>
                <div className={T.label}>Total Platforms</div>
                <div className="text-3xl font-black text-indigo-400">{platforms.length}</div>
                <div className="text-slate-500 text-xs mt-1">TikTok, FB, IG, Snap, YT, Pinterest, LinkedIn, X, Google, Reddit, Threads, Email</div>
              </div>
              <div className={T.card}>
                <div className={T.label}>Total Ad Formats</div>
                <div className="text-3xl font-black text-purple-400">{assets?.totalAdFormats ?? 0}</div>
                <div className="text-slate-500 text-xs mt-1">All formats across all platforms</div>
              </div>
              <div className={T.card}>
                <div className={T.label}>Content Templates</div>
                <div className="text-3xl font-black text-emerald-400">{assets?.totalContentTemplates ?? 0}</div>
                <div className="text-slate-500 text-xs mt-1">Ready-to-use templates</div>
              </div>
              <div className={T.card}>
                <div className={T.label}>Calendar Days Ready</div>
                <div className="text-3xl font-black text-amber-400">{calendar.length}</div>
                <div className="text-slate-500 text-xs mt-1">30-day content calendar</div>
              </div>
            </div>
            <div className={T.card}>
              <div className={T.h2}>Target Audiences</div>
              <div className="grid grid-cols-2 gap-3">
                {brand?.targetAudiences?.map((a: any, i: number) => (
                  <div key={i} className="bg-slate-800 rounded-lg p-3">
                    <div className="text-sm font-bold text-white">{a.segment}</div>
                    <div className="text-xs text-slate-400 mt-1">Pain: {a.pain}</div>
                    <div className="text-xs text-indigo-400 mt-1">→ {a.solution}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={T.card}>
              <div className={T.h2}>Pricing Offers</div>
              <div className="grid grid-cols-2 gap-3">
                {brand?.offers?.map((o: any, i: number) => (
                  <div key={i} className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">{o.name}</span>
                      <span className="text-indigo-400 font-black text-sm">{o.price}</span>
                    </div>
                    <div className="text-xs text-slate-400">{o.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PLATFORMS */}
        {tab === "platforms" && !selectedPlatform && (
          <div className="grid grid-cols-2 gap-4">
            {platforms.map(p => (
              <div key={p.id} onClick={() => loadPlatformDetail(p.id)}
                className={`${T.card} cursor-pointer hover:border-indigo-500/50 transition-all hover:bg-slate-800`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <div className="font-bold text-white">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.handle}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 mb-3">{p.bio}</div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`${T.badge} bg-indigo-500/20 text-indigo-400`}>{p.adFormatsCount} formats</span>
                  {p.hasContentTemplates && <span className={`${T.badge} bg-emerald-500/20 text-emerald-400`}>templates ✓</span>}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="text-xs text-slate-500">{p.strategy.objective}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "platforms" && selectedPlatform && (
          <div className="space-y-5">
            <button onClick={() => setSelectedPlatform(null)} className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1">
              ← Back to All Platforms
            </button>
            <div className={T.card}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{selectedPlatform.icon ?? "🌐"}</span>
                <div>
                  <div className="text-xl font-black text-white">{selectedPlatform.name}</div>
                  <div className="text-sm text-slate-400">{selectedPlatform.profile?.handle}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={T.label}>Display Name</div>
                  <div className={T.val}>{selectedPlatform.profile?.displayName}</div>
                </div>
                <div>
                  <div className={T.label}>Category / CTA</div>
                  <div className={T.val}>{selectedPlatform.profile?.category} · {selectedPlatform.profile?.cta}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className={T.label}>Bio ({selectedPlatform.profile?.bio?.length ?? 0} / {selectedPlatform.profile?.bioCharLimit ?? "∞"} chars)</div>
                <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-200 mt-1 whitespace-pre-wrap font-mono text-xs">{selectedPlatform.profile?.bio}</div>
              </div>
              {selectedPlatform.profile?.description && (
                <div className="mt-4">
                  <div className={T.label}>Full Description / About</div>
                  <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300 mt-1 whitespace-pre-wrap text-xs leading-relaxed">{selectedPlatform.profile?.description ?? selectedPlatform.profile?.about ?? selectedPlatform.profile?.companyAbout}</div>
                </div>
              )}
            </div>

            {selectedPlatform.adFormats?.length > 0 && (
              <div className={T.card}>
                <div className={T.h2}>Ad Formats ({selectedPlatform.adFormats.length})</div>
                <div className="space-y-4">
                  {selectedPlatform.adFormats.map((f: any, i: number) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm">{f.name}</span>
                        <span className={`${T.badge} bg-indigo-500/20 text-indigo-400`}>{f.objective}</span>
                      </div>
                      <div className="text-xs text-slate-500 mb-3">{f.specs}</div>
                      <div className={T.label}>Ad Copy</div>
                      <div className="bg-slate-900 rounded p-3 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed mt-1 font-mono">{typeof f.copy === "string" ? f.copy : JSON.stringify(f.copy, null, 2)}</div>
                      {f.hashtags?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {f.hashtags.map((h: string, j: number) => (
                            <span key={j} className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{h}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPlatform.contentTemplates?.length > 0 && (
              <div className={T.card}>
                <div className={T.h2}>Content Templates</div>
                <div className="space-y-3">
                  {selectedPlatform.contentTemplates.map((t: any, i: number) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`${T.badge} bg-purple-500/20 text-purple-400`}>{t.type}</span>
                        <span className="font-semibold text-white text-sm">{t.title}</span>
                      </div>
                      <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{t.caption}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={T.card}>
              <div className={T.h2}>Platform Strategy</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Objective", selectedPlatform.strategy?.objective],
                  ["Budget", selectedPlatform.strategy?.budget],
                  ["Best Times", selectedPlatform.strategy?.bestTimes],
                  ["Frequency", selectedPlatform.strategy?.frequency],
                ].map(([l, v]) => v && (
                  <div key={l as string}>
                    <div className={T.label}>{l as string}</div>
                    <div className="text-sm text-slate-300">{v as string}</div>
                  </div>
                ))}
                <div className="col-span-2">
                  <div className={T.label}>Audience</div>
                  <div className="text-sm text-slate-300">{selectedPlatform.strategy?.audience}</div>
                </div>
                <div className="col-span-2">
                  <div className={T.label}>KPIs</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedPlatform.strategy?.kpis?.map((k: string, i: number) => (
                      <span key={i} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {tab === "calendar" && (
          <div className="space-y-4">
            <div className={`${T.card} mb-2`}>
              <div className="text-sm font-semibold text-white mb-1">30-Day Content Calendar — CreateAI Brain</div>
              <div className="text-xs text-slate-500">Full publishing plan across all platforms. All content ready for activation.</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {calendar.map(day => (
                <div key={day.day} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">DAY {day.day}</span>
                    <span className={`${T.badge} ${day.type === "Video" ? "bg-red-500/20 text-red-400" : day.type === "Case Study" ? "bg-amber-500/20 text-amber-400" : day.type === "Thread" ? "bg-blue-500/20 text-blue-400" : "bg-slate-700 text-slate-400"}`}>{day.type}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">{day.theme}</div>
                  <div className="text-xs text-slate-400 mb-2">{day.focus}</div>
                  <div className="text-xs text-indigo-400">{day.platform}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCRIPTS */}
        {tab === "scripts" && (
          <div className="space-y-4">
            {scripts.map((s, i) => (
              <div key={i} className={T.card}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-white">{s.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.type} · {s.duration}</div>
                  </div>
                  {s.thumbnailCopy && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded px-2 py-1 text-xs text-red-400 max-w-48 text-right">{s.thumbnailCopy}</div>
                  )}
                </div>
                <div className={T.label}>Script</div>
                <div className="bg-slate-800 rounded-lg p-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono mt-1">{s.script}</div>
              </div>
            ))}
          </div>
        )}

        {/* BANNERS */}
        {tab === "banners" && (
          <div className="space-y-4">
            {banners.map((b, i) => (
              <div key={i} className={T.card}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-white">{b.platform} — {b.type}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">{b.specs}</div>
                  </div>
                  {b.safeZone && <div className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Safe zone: {b.safeZone}</div>}
                </div>
                <div className={T.label}>Copy / Headline</div>
                <div className="bg-slate-800 rounded p-3 text-sm text-slate-200 mt-1">{b.copy}</div>
                {b.elements && (
                  <div className="mt-3">
                    <div className={T.label}>Required Elements</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {b.elements.map((el: string, j: number) => (
                        <span key={j} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">{el}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* FUNNELS */}
        {tab === "funnels" && (
          <div className="space-y-6">
            {funnels.map((funnel, i) => (
              <div key={i} className={T.card}>
                <div className="font-bold text-white text-base mb-4">{funnel.name}</div>
                <div className="relative">
                  {funnel.stages.map((stage: any, j: number) => (
                    <div key={j} className="flex gap-4 mb-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{j + 1}</div>
                        {j < funnel.stages.length - 1 && <div className="w-0.5 h-full bg-slate-700 mt-1 min-h-8" />}
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3 flex-1 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white text-sm">{stage.stage}</span>
                          <span className="text-xs text-indigo-400">{stage.channel}</span>
                        </div>
                        <div className="text-xs text-slate-400">{stage.content}</div>
                        {stage.cta && <div className="mt-2 text-xs font-bold text-emerald-400">→ {stage.cta}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI GENERATE */}
        {tab === "generate" && (
          <div className="space-y-5">
            <div className={T.card}>
              <div className={T.h2}>AI Ad Generator</div>
              <p className="text-xs text-slate-500 mb-5">Generate custom advertising content for any platform and format using GPT-4o. All assets stored internally.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className={T.label}>Platform</div>
                  <select value={genForm.platform} onChange={e => setGenForm(f => ({ ...f, platform: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mt-1 focus:border-indigo-500 outline-none">
                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className={T.label}>Ad Format</div>
                  <input value={genForm.format} onChange={e => setGenForm(f => ({ ...f, format: e.target.value }))}
                    placeholder="e.g. Single Image Ad, Carousel, Reels Script"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mt-1 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <div className={T.label}>Target Industry</div>
                  <input value={genForm.industry} onChange={e => setGenForm(f => ({ ...f, industry: e.target.value }))}
                    placeholder="e.g. Healthcare, Legal, Staffing"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mt-1 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <div className={T.label}>Tone</div>
                  <select value={genForm.tone} onChange={e => setGenForm(f => ({ ...f, tone: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mt-1 focus:border-indigo-500 outline-none">
                    <option value="professional">Professional</option>
                    <option value="confident">Confident + Direct</option>
                    <option value="urgent">Urgent + Compelling</option>
                    <option value="educational">Educational + Helpful</option>
                    <option value="casual">Casual + Relatable</option>
                  </select>
                </div>
              </div>
              <div className="mb-5">
                <div className={T.label}>Additional Context (optional)</div>
                <textarea value={genForm.context} onChange={e => setGenForm(f => ({ ...f, context: e.target.value }))}
                  rows={3} placeholder="Specific product, offer, campaign goal, or targeting details..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mt-1 focus:border-indigo-500 outline-none resize-none" />
              </div>
              <button onClick={handleGenerate} disabled={generating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-sm font-bold text-white transition-colors">
                {generating ? "Generating with GPT-4o…" : "✨ Generate Ad Content"}
              </button>
            </div>
            {genResult && (
              <div className={T.card}>
                <div className={T.h2}>Generated Content</div>
                <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">{genResult}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
