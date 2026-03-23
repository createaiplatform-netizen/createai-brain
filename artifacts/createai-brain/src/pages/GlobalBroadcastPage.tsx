import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BroadcastResult {
  ok:           boolean;
  broadcast_id: string;
  link:         string;
  qr:           string;
  expires:      number;
  expires_iso:  string;
  regions:      string[];
  role:         string;
}

interface LogEntry {
  broadcast_id: string;
  link:         string;
  regions:      string[];
  timestamp:    string;
  expires_iso:  string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  "Initializing global broadcast…",
  "Syncing cloud nodes…",
  "Activating worldwide channels…",
  "Propagating universal onboarding link…",
  "Finalizing global signature…",
  "Broadcast delivered.",
];

const REGION_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  NA:  { x: 18,  y: 28,  label: "North America" },
  SA:  { x: 27,  y: 62,  label: "South America" },
  EU:  { x: 49,  y: 22,  label: "Europe"        },
  AF:  { x: 50,  y: 52,  label: "Africa"        },
  AS:  { x: 72,  y: 28,  label: "Asia"          },
  OC:  { x: 80,  y: 68,  label: "Oceania"       },
  EXT: { x: 50,  y: 88,  label: "Extended"      },
};

const STORAGE_KEY = "cai_broadcast_log";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadLog(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as LogEntry[];
  } catch { return []; }
}

function saveLog(entries: LogEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
}

function fmtExpiry(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── World Map SVG ────────────────────────────────────────────────────────────

function WorldMap({ regions, active }: { regions: string[]; active: boolean }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: "2/1", maxWidth: 560 }}>
      {/* Grid lines */}
      <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full opacity-20">
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(x => (
          <line key={x} x1={x} y1={0} x2={x} y2={50} stroke="#9CAF88" strokeWidth="0.2" />
        ))}
        {[10, 20, 30, 40].map(y => (
          <line key={y} x1={0} y1={y} x2={100} y2={y} stroke="#9CAF88" strokeWidth="0.2" />
        ))}
        <ellipse cx="50" cy="25" rx="49" ry="24" stroke="#9CAF88" strokeWidth="0.4" fill="none" />
      </svg>

      {/* Region nodes */}
      {Object.entries(REGION_POSITIONS).map(([code, pos]) => {
        const isActive = regions.includes(code) && active;
        return (
          <div
            key={code}
            className="absolute flex flex-col items-center"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
          >
            {/* Pulse rings */}
            {isActive && (
              <>
                <div className="absolute rounded-full border border-[#9CAF88] animate-ping"
                  style={{ width: 36, height: 36, opacity: 0.3 }} />
                <div className="absolute rounded-full border border-[#9CAF88] animate-ping"
                  style={{ width: 52, height: 52, opacity: 0.15, animationDelay: "0.3s" }} />
              </>
            )}
            {/* Core node */}
            <div
              className="relative z-10 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-700"
              style={{
                width: 28, height: 28,
                background:   isActive ? "rgba(156,175,136,0.25)" : "rgba(255,255,255,0.04)",
                border:       `1.5px solid ${isActive ? "#9CAF88" : "rgba(255,255,255,0.12)"}`,
                color:        isActive ? "#9CAF88" : "rgba(255,255,255,0.3)",
                boxShadow:    isActive ? "0 0 12px rgba(156,175,136,0.5)" : "none",
              }}
            >
              {code}
            </div>
            <span className="text-[8px] mt-1 whitespace-nowrap"
              style={{ color: isActive ? "rgba(156,175,136,0.7)" : "rgba(255,255,255,0.2)" }}>
              {pos.label}
            </span>
          </div>
        );
      })}

      {/* Connection lines between active nodes */}
      {active && (
        <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full pointer-events-none">
          {regions.flatMap((a, i) =>
            regions.slice(i + 1).map(b => {
              const pa = REGION_POSITIONS[a], pb = REGION_POSITIONS[b];
              if (!pa || !pb) return null;
              return (
                <line key={`${a}-${b}`}
                  x1={pa.x / 2} y1={pa.y / 2}
                  x2={pb.x / 2} y2={pb.y / 2}
                  stroke="#9CAF88" strokeWidth="0.15" opacity="0.2"
                  strokeDasharray="0.8 1.2"
                />
              );
            })
          )}
        </svg>
      )}
    </div>
  );
}

// ─── Cinematic Sequence ───────────────────────────────────────────────────────

function CinematicStep({ text, done }: { text: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 transition-all duration-500"
      style={{ opacity: done ? 1 : 0.4 }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-500"
        style={{
          background:  done ? "#9CAF88" : "rgba(156,175,136,0.2)",
          boxShadow:   done ? "0 0 8px rgba(156,175,136,0.6)" : "none",
        }} />
      <span className="text-sm font-mono" style={{ color: done ? "#9CAF88" : "rgba(255,255,255,0.3)" }}>
        {text}
      </span>
    </div>
  );
}

// ─── Broadcast Log ────────────────────────────────────────────────────────────

function BroadcastLog() {
  const [log, setLog] = useState<LogEntry[]>([]);
  useEffect(() => { setLog(loadLog()); }, []);

  if (log.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: "rgba(255,255,255,0.25)" }}>
        <div className="text-2xl mb-2">📡</div>
        <p className="text-sm">No broadcasts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {log.map((entry, i) => (
        <div key={i} className="rounded-xl p-4 border"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(156,175,136,0.15)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono" style={{ color: "#9CAF88" }}>
              {entry.broadcast_id}
            </span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {entry.regions.map(r => (
              <span key={r} className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                style={{ background: "rgba(156,175,136,0.12)", color: "#9CAF88", border: "1px solid rgba(156,175,136,0.2)" }}>
                {r}
              </span>
            ))}
          </div>
          <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
            {entry.link}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
            Expires {fmtExpiry(entry.expires_iso)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Phase = "idle" | "broadcasting" | "done" | "error";

export default function GlobalBroadcastPage() {
  const [phase,       setPhase]       = useState<Phase>("idle");
  const [stepIndex,   setStepIndex]   = useState(-1);
  const [result,      setResult]      = useState<BroadcastResult | null>(null);
  const [errMsg,      setErrMsg]      = useState("");
  const [copied,      setCopied]      = useState(false);
  const [showLog,     setShowLog]     = useState(false);
  const [logEntries,  setLogEntries]  = useState<LogEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLogEntries(loadLog());
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const runBroadcast = useCallback(async () => {
    setPhase("broadcasting");
    setStepIndex(0);
    setCopied(false);

    // Tick through cinematic steps
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      setStepIndex(step);
      if (step >= STEPS.length - 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 700);

    // Fire API call in parallel with the animation
    try {
      const res  = await fetch("/api/broadcast/global", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ role: "member" }),
      });
      const data = await res.json() as BroadcastResult & { error?: string };

      // Wait until at least step 4 is shown before revealing result
      const wait = Math.max(0, 5 * 700 - 200);
      await new Promise(r => setTimeout(r, wait));

      if (!res.ok || !data.ok) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setErrMsg(data.error ?? "Broadcast failed");
        setPhase("error");
        return;
      }

      setResult(data);
      setPhase("done");

      // Persist to log
      const entry: LogEntry = {
        broadcast_id: data.broadcast_id,
        link:         data.link,
        regions:      data.regions,
        timestamp:    new Date().toISOString(),
        expires_iso:  data.expires_iso,
      };
      const updated = [entry, ...loadLog()];
      saveLog(updated);
      setLogEntries(updated);

    } catch (err) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setErrMsg((err as Error).message);
      setPhase("error");
    }
  }, []);

  const copyLink = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [result]);

  const shareBroadcast = useCallback(async () => {
    if (!result) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join CreateAI Brain",
          text:  "You've been invited to join CreateAI Brain — the AI OS for everything.",
          url:   result.link,
        });
        return;
      } catch { /* fall through */ }
    }
    copyLink();
  }, [result, copyLink]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #07100a 0%, #0d1a10 50%, #070d0f 100%)" }}>

      {/* Header */}
      <div className="w-full max-w-2xl mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
          style={{ background: "rgba(156,175,136,0.1)", border: "1px solid rgba(156,175,136,0.25)" }}>
          <span className="text-xs font-mono" style={{ color: "#9CAF88" }}>
            📡 GLOBAL BROADCAST CONSOLE
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
          Global Broadcast Activation
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          Generate a signed worldwide onboarding link. Share it with anyone, anywhere.
        </p>
      </div>

      {/* World Map */}
      <div className="w-full max-w-2xl mb-8 flex justify-center">
        <WorldMap
          regions={result?.regions ?? (phase === "broadcasting" ? ["NA","SA","EU","AF","AS","OC","EXT"] : [])}
          active={phase === "broadcasting" || phase === "done"}
        />
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl rounded-2xl p-6 mb-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(156,175,136,0.2)" }}>

        {/* IDLE */}
        {phase === "idle" && (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🌐</div>
            <p className="text-white mb-2 font-semibold">Ready to broadcast</p>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
              This will generate a signed 7-day onboarding link valid for all regions.
            </p>
            <button onClick={runBroadcast}
              className="px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #7a9068, #9CAF88)", color: "#0d1a10" }}>
              🚀 Launch Global Broadcast
            </button>
          </div>
        )}

        {/* BROADCASTING */}
        {phase === "broadcasting" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#9CAF88" }} />
              <span className="text-sm font-mono font-semibold" style={{ color: "#9CAF88" }}>
                BROADCAST IN PROGRESS
              </span>
            </div>
            {STEPS.map((step, i) => (
              <CinematicStep key={i} text={step} done={i <= stepIndex} />
            ))}
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-white mb-1 font-semibold">Broadcast failed</p>
            <p className="text-xs mb-5" style={{ color: "rgba(255,100,100,0.8)" }}>{errMsg}</p>
            <button onClick={() => { setPhase("idle"); setStepIndex(-1); }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(156,175,136,0.15)", color: "#9CAF88", border: "1px solid rgba(156,175,136,0.3)" }}>
              Try Again
            </button>
          </div>
        )}

        {/* DONE */}
        {phase === "done" && result && (
          <div className="space-y-6">
            {/* Status banner */}
            <div className="rounded-xl p-4 text-center"
              style={{ background: "rgba(156,175,136,0.1)", border: "1px solid rgba(156,175,136,0.3)" }}>
              <div className="text-2xl mb-1">✅</div>
              <p className="font-bold text-white mb-0.5">Your platform has been broadcast to the world.</p>
              <p className="text-xs" style={{ color: "#9CAF88" }}>
                Anyone with this link can join instantly. Global onboarding is now active.
              </p>
            </div>

            {/* QR + Link side by side */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* QR */}
              <div className="flex-shrink-0 rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <img
                  src={result.qr}
                  alt="Onboarding QR Code"
                  width={160} height={160}
                  className="rounded-lg"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              {/* Link details */}
              <div className="flex-1 space-y-3 min-w-0">
                <div>
                  <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Onboarding Link</p>
                  <div className="rounded-lg px-3 py-2 text-xs font-mono break-all"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#9CAF88", border: "1px solid rgba(156,175,136,0.2)" }}>
                    {result.link}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {result.regions.map(r => (
                    <span key={r} className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                      style={{ background: "rgba(156,175,136,0.15)", color: "#9CAF88", border: "1px solid rgba(156,175,136,0.25)" }}>
                      {r}
                    </span>
                  ))}
                </div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Expires: {fmtExpiry(result.expires_iso)}
                </div>
                <div className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
                  ID: {result.broadcast_id}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <button onClick={copyLink}
                className="flex-1 min-w-[140px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: copied ? "rgba(156,175,136,0.25)" : "rgba(156,175,136,0.15)", color: "#9CAF88", border: "1px solid rgba(156,175,136,0.35)" }}>
                {copied ? "✅ Copied!" : "📋 Copy Global Link"}
              </button>
              <button onClick={shareBroadcast}
                className="flex-1 min-w-[140px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, #7a9068, #9CAF88)", color: "#0d1a10" }}>
                🌐 Share Broadcast
              </button>
            </div>

            {/* New broadcast */}
            <div className="text-center pt-2">
              <button onClick={() => { setPhase("idle"); setStepIndex(-1); setResult(null); }}
                className="text-xs underline-offset-2 hover:underline"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                Generate new broadcast
              </button>
            </div>

            {/* UX copy */}
            <div className="text-center text-xs space-y-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
              <p>Global onboarding is now active.</p>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Log toggle */}
      <div className="w-full max-w-2xl">
        <button
          onClick={() => setShowLog(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
          <span>📋 Global Broadcast Log ({logEntries.length})</span>
          <span style={{ fontSize: 10 }}>{showLog ? "▲ Hide" : "▼ Show"}</span>
        </button>

        {showLog && (
          <div className="mt-3 rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <BroadcastLog />
          </div>
        )}
      </div>
    </div>
  );
}
