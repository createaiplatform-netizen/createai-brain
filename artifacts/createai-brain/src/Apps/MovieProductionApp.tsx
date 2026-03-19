import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SceneManifest {
  sceneIndex:  number;
  title:       string;
  imageUrl:    string;
  dialogue:    string;
  cameraDir:   string;
  musicCue:    string;
  moodColor:   string;
  durationSec: number;
}

interface MovieManifest {
  projectName: string;
  titleCard:   { title: string; tagline: string; creditLines: string[] };
  scenes:      SceneManifest[];
  generatedAt: string;
}

interface LogEntry {
  type:    "status" | "scene" | "done" | "error";
  text:    string;
  scene?:  number;
  total?:  number;
  step?:   string;
}

interface Props {
  projectId: string | number;
  projectName: string;
  projectType: string;
  onClose?: () => void;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDialogue(raw: string): Array<{ speaker: string; line: string }> {
  return raw
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const colonIdx = l.indexOf(":");
      if (colonIdx > 0 && colonIdx < 25) {
        return { speaker: l.slice(0, colonIdx).trim(), line: l.slice(colonIdx + 1).trim() };
      }
      return { speaker: "NARRATOR", line: l };
    });
}

function totalRuntime(scenes: SceneManifest[]): string {
  const secs = scenes.reduce((acc, s) => acc + s.durationSec, 0) + 15;
  const m    = Math.floor(secs / 60);
  const s    = secs % 60;
  return `${m}m ${s}s`;
}

// ─── Cinematic Player ────────────────────────────────────────────────────────

function CinematicPlayer({ manifest, onRestart }: { manifest: MovieManifest; onRestart: () => void }) {
  const totalScenes  = manifest.scenes.length;
  // -1 = title card, 0..N-1 = scenes, N = credits
  const [frameIdx, setFrameIdx]   = useState<number>(-1);
  const [playing, setPlaying]     = useState(true);
  const [progress, setProgress]   = useState(0);
  const [speaking, setSpeaking]   = useState(false);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const synthRef  = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis ?? null;
    return () => { synthRef.current?.cancel(); };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const goTo = useCallback((idx: number) => {
    synthRef.current?.cancel();
    setSpeaking(false);
    setFrameIdx(Math.max(-1, Math.min(idx, totalScenes)));
    setProgress(0);
  }, [totalScenes]);

  const currentDuration = useCallback((): number => {
    if (frameIdx === -1) return 5;
    if (frameIdx === totalScenes) return 8;
    return manifest.scenes[frameIdx]?.durationSec ?? 45;
  }, [frameIdx, totalScenes, manifest.scenes]);

  // Auto-advance timer
  useEffect(() => {
    clearTimer();
    if (!playing) return;
    const duration = currentDuration();
    const tick = 200;
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += tick;
      setProgress(Math.min(1, elapsed / (duration * 1000)));
      if (elapsed >= duration * 1000) {
        clearTimer();
        setFrameIdx(prev => {
          const next = prev + 1;
          if (next > totalScenes) return prev;
          setProgress(0);
          return next;
        });
      }
    }, tick);
    return clearTimer;
  }, [playing, frameIdx, currentDuration, clearTimer, totalScenes]);

  const speakDialogue = useCallback(() => {
    if (!synthRef.current) return;
    if (speaking) { synthRef.current.cancel(); setSpeaking(false); return; }
    const scene = manifest.scenes[frameIdx];
    if (!scene?.dialogue) return;
    const lines = formatDialogue(scene.dialogue);
    let i = 0;
    const sayNext = () => {
      if (i >= lines.length) { setSpeaking(false); return; }
      const utt = new SpeechSynthesisUtterance(`${lines[i]!.speaker}: ${lines[i]!.line}`);
      utt.rate  = 0.9;
      utt.pitch = lines[i]!.speaker === "NARRATOR" ? 0.95 : 1.05;
      utt.onend = () => { i++; sayNext(); };
      synthRef.current!.speak(utt);
      i++;
    };
    setSpeaking(true);
    sayNext();
  }, [frameIdx, manifest.scenes, speaking]);

  const isTitleCard = frameIdx === -1;
  const isCredits   = frameIdx === totalScenes;
  const scene       = !isTitleCard && !isCredits ? manifest.scenes[frameIdx] ?? null : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#000", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", position: "relative" }}>

      {/* ── Main Visual Area ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Background image / gradient */}
        {scene?.imageUrl ? (
          <img
            src={scene.imageUrl}
            alt={scene.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.8s ease" }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: isTitleCard
              ? "radial-gradient(ellipse at center, #1e1b4b 0%, #000 70%)"
              : isCredits
                ? "linear-gradient(180deg, #000 0%, #0f172a 100%)"
                : `radial-gradient(ellipse at 50% 60%, ${scene?.moodColor ?? "#1e293b"}44 0%, #000 80%)`,
          }} />
        )}

        {/* Cinematic letterbox bars */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "10%", background: "#000", zIndex: 2 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "10%", background: "#000", zIndex: 2 }} />

        {/* Overlay gradient for readability */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.5) 100%)", zIndex: 3 }} />

        {/* ── Title Card ─────────────────────────────────────────────── */}
        {isTitleCard && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, padding: "20px 40px", textAlign: "center" }}>
            <div style={{ fontSize: "clamp(24px, 5vw, 48px)", fontWeight: 900, letterSpacing: "0.05em", textShadow: "0 2px 30px rgba(99,102,241,0.8)", marginBottom: 12, lineHeight: 1.1 }}>
              {manifest.titleCard.title}
            </div>
            {manifest.titleCard.tagline && (
              <div style={{ fontSize: "clamp(11px, 2vw, 16px)", color: "rgba(255,255,255,0.7)", fontStyle: "italic", maxWidth: 460, lineHeight: 1.5 }}>
                {manifest.titleCard.tagline}
              </div>
            )}
            <div style={{ marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              {manifest.scenes.length} Scenes · {totalRuntime(manifest.scenes)} · AI-Generated
            </div>
          </div>
        )}

        {/* ── Credits ────────────────────────────────────────────────── */}
        {isCredits && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, padding: "20px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 24 }}>End Credits</div>
            <div style={{ fontSize: "clamp(18px, 4vw, 32px)", fontWeight: 800, letterSpacing: "0.04em", marginBottom: 20 }}>
              {manifest.titleCard.title}
            </div>
            {manifest.titleCard.creditLines.map((line, i) => (
              <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 2 }}>{line}</div>
            ))}
            <div style={{ marginTop: 28, fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}>
              PRODUCED WITH CREATEAI BRAIN
            </div>
            <button onClick={onRestart} style={{ marginTop: 24, padding: "10px 24px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", fontSize: 12, cursor: "pointer", letterSpacing: "0.06em" }}>
              ↺ REPRODUCE
            </button>
          </div>
        )}

        {/* ── Scene Dialogue overlay ─────────────────────────────────── */}
        {scene && (
          <div style={{ position: "absolute", bottom: "12%", left: 0, right: 0, zIndex: 10, padding: "0 5%" }}>
            {/* Scene label */}
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>
              Scene {scene.sceneIndex + 1} of {totalScenes} · {scene.title.slice(0, 60)}
            </div>

            {/* Dialogue lines */}
            <div style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(6px)", borderRadius: 8, padding: "10px 16px", borderLeft: `3px solid ${scene.moodColor}` }}>
              {formatDialogue(scene.dialogue).map((dl, i) => (
                <div key={i} style={{ marginBottom: i < formatDialogue(scene.dialogue).length - 1 ? 6 : 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: scene.moodColor, textTransform: "uppercase", marginRight: 6 }}>
                    {dl.speaker}
                  </span>
                  <span style={{ fontSize: "clamp(11px, 1.8vw, 14px)", color: "rgba(255,255,255,0.92)", lineHeight: 1.6 }}>
                    {dl.line}
                  </span>
                </div>
              ))}
            </div>

            {/* Direction badges */}
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {scene.cameraDir && (
                <div style={{ fontSize: 9, padding: "3px 8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
                  📷 {scene.cameraDir.slice(0, 60)}
                </div>
              )}
              {scene.musicCue && (
                <div style={{ fontSize: 9, padding: "3px 8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
                  🎵 {scene.musicCue.slice(0, 60)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scene index dots */}
        {!isTitleCard && !isCredits && (
          <div style={{ position: "absolute", top: "13%", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 10 }}>
            {manifest.scenes.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                style={{ width: i === frameIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === frameIdx ? "#6366f1" : "rgba(255,255,255,0.25)", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
            ))}
          </div>
        )}
      </div>

      {/* ── Controls Bar ──────────────────────────────────────────────────── */}
      <div style={{ background: "#0a0a0a", padding: "8px 16px", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>

        {/* Progress bar */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1, cursor: "pointer" }}
          onClick={e => {
            const r = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - r.left) / r.width;
            const idx = Math.floor(pct * (totalScenes + 2)) - 1;
            goTo(Math.max(-1, Math.min(idx, totalScenes)));
          }}>
          <div style={{ width: `${((frameIdx + 1) / (totalScenes + 1)) * 100}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 1, transition: "width 0.3s" }} />
        </div>

        {/* Scene progress inner */}
        <div style={{ height: 1.5, background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "rgba(99,102,241,0.5)", transition: "width 0.2s linear" }} />
        </div>

        {/* Buttons row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Prev */}
          <button onClick={() => goTo(frameIdx - 1)} disabled={frameIdx <= -1}
            style={{ background: "none", border: "none", color: frameIdx <= -1 ? "#333" : "#fff", fontSize: 16, cursor: frameIdx <= -1 ? "default" : "pointer", padding: 0 }}>
            ⏮
          </button>

          {/* Play/Pause */}
          <button onClick={() => setPlaying(p => !p)}
            style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", padding: 0 }}>
            {playing ? "⏸" : "▶"}
          </button>

          {/* Next */}
          <button onClick={() => goTo(frameIdx + 1)} disabled={frameIdx >= totalScenes}
            style={{ background: "none", border: "none", color: frameIdx >= totalScenes ? "#333" : "#fff", fontSize: 16, cursor: frameIdx >= totalScenes ? "default" : "pointer", padding: 0 }}>
            ⏭
          </button>

          {/* TTS voice button */}
          {scene && window.speechSynthesis && (
            <button onClick={speakDialogue}
              style={{ background: speaking ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.07)", border: `1px solid ${speaking ? "#6366f1" : "rgba(255,255,255,0.12)"}`, borderRadius: 6, color: speaking ? "#818cf8" : "#94a3b8", fontSize: 10, padding: "3px 10px", cursor: "pointer", fontWeight: 600 }}>
              {speaking ? "🔊 Speaking…" : "🎙 Voice"}
            </button>
          )}

          {/* Position display */}
          <div style={{ fontSize: 10, color: "#475569", marginLeft: 4 }}>
            {isTitleCard ? "Title" : isCredits ? "Credits" : `${frameIdx + 1}/${totalScenes}`}
          </div>

          {/* Runtime */}
          <div style={{ fontSize: 10, color: "#334155", marginLeft: "auto" }}>
            {totalRuntime(manifest.scenes)} total
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Production Console ───────────────────────────────────────────────────────

function ProductionConsole({
  projectId, projectName, projectType,
  onComplete,
}: {
  projectId: string | number;
  projectName: string;
  projectType: string;
  onComplete: (manifest: MovieManifest) => void;
}) {
  const [log, setLog]           = useState<LogEntry[]>([]);
  const [producing, setProducing] = useState(false);
  const [error, setError]       = useState("");
  const [scenesDone, setScenesDone] = useState(0);
  const [scenesTotal, setScenesTotal] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const logRef   = useRef<HTMLDivElement>(null);

  const appendLog = useCallback((entry: LogEntry) => {
    setLog(prev => [...prev.slice(-80), entry]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const startProduction = useCallback(async () => {
    setProducing(true);
    setError("");
    setLog([]);
    setScenesDone(0);
    setCurrentStep("Initializing…");

    abortRef.current = new AbortController();

    try {
      const resp = await fetch("/api/movie/generate", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ projectId }),
        signal:      abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: "Network error" })) as { error?: string };
        throw new Error(errData.error ?? `HTTP ${resp.status}`);
      }

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.replace(/^data:\s*/, "").trim();
          if (!line) continue;

          try {
            const evt = JSON.parse(line) as {
              type: string; message?: string; scene?: number; total?: number;
              step?: string; data?: SceneManifest; manifest?: MovieManifest;
            };

            if (evt.type === "status") {
              setCurrentStep(evt.message ?? "");
              appendLog({ type: "status", text: evt.message ?? "" });

            } else if (evt.type === "start") {
              setScenesTotal(evt.total ?? 0);
              appendLog({ type: "status", text: `🎬 Production started — ${evt.total} scenes detected` });

            } else if (evt.type === "progress") {
              setCurrentStep(evt.message ?? "");
              appendLog({ type: "scene", text: evt.message ?? "", scene: evt.scene, total: evt.total, step: evt.step });

            } else if (evt.type === "scene_done") {
              setScenesDone(prev => prev + 1);
              appendLog({
                type: "scene",
                text: `✅ Scene ${evt.scene}/${evt.total} — "${(evt.data?.title ?? "").slice(0, 50)}" complete`,
                scene: evt.scene, total: evt.total,
              });

            } else if (evt.type === "done" && evt.manifest) {
              appendLog({ type: "done", text: `🎬 Production complete — ${evt.manifest.scenes.length} scenes` });
              setProducing(false);
              setTimeout(() => onComplete(evt.manifest!), 800);

            } else if (evt.type === "error") {
              throw new Error(evt.message ?? "Unknown error");
            }
          } catch (parseErr) {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setProducing(false);
    }
  }, [projectId, appendLog, onComplete]);

  const stopProduction = useCallback(() => {
    abortRef.current?.abort();
    setProducing(false);
  }, []);

  const progress = scenesTotal > 0 ? scenesDone / scenesTotal : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#09090b", color: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
            🎬
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Movie Production Suite</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
              {projectName} · {projectType}
            </div>
          </div>
        </div>
      </div>

      {!producing && !log.length && (
        /* ── Launch Screen ───────────────────────────────────────────── */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
          <div style={{ fontSize: 52 }}>🎬</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{projectName}</div>
          <div style={{ fontSize: 12, color: "#64748b", maxWidth: 380, lineHeight: 1.7 }}>
            The production engine reads your project script and files, generates a DALL‑E 3 cinematic keyframe for every scene, writes professional dialogue and direction, then assembles a fully watchable cinematic experience with voice narration.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
            {[
              ["🖼 DALL-E 3 Keyframes", "#6366f1"],
              ["✍️ AI Dialogue & Direction", "#8b5cf6"],
              ["🎵 Music Cue Generation", "#0ea5e9"],
              ["🎙 Browser Voice Synthesis", "#10b981"],
            ].map(([label, color]) => (
              <div key={label as string} style={{ fontSize: 10, padding: "4px 12px", borderRadius: 20, background: `${color as string}15`, border: `1px solid ${color as string}30`, color: color as string, fontWeight: 600 }}>
                {label}
              </div>
            ))}
          </div>
          <button
            onClick={startProduction}
            style={{
              marginTop: 8,
              padding: "14px 40px",
              borderRadius: 30,
              border: "none",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(99,102,241,0.45)",
              letterSpacing: "0.02em",
            }}
          >
            🎬 Begin Production
          </button>
          <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>
            Reads your project files · Generates up to 6 scenes · ~2–4 min
          </div>
        </div>
      )}

      {/* ── Active Production Console ─────────────────────────────── */}
      {(producing || log.length > 0) && (
        <>
          {/* Progress */}
          <div style={{ padding: "14px 24px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {producing && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", animation: "pulse 1.5s infinite" }} />
              )}
              <div style={{ fontSize: 11, fontWeight: 600, color: producing ? "#818cf8" : "#10b981" }}>
                {producing ? currentStep : "Production complete"}
              </div>
            </div>

            {scenesTotal > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 10, color: "#475569" }}>Scene progress</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{scenesDone}/{scenesTotal}</div>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                  <div style={{
                    width: `${progress * 100}%`, height: "100%",
                    background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                    borderRadius: 2, transition: "width 0.4s ease",
                  }} />
                </div>

                {/* Scene dots */}
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  {Array.from({ length: scenesTotal }, (_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i < scenesDone ? "#6366f1" : i === scenesDone && producing ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)",
                      transition: "background 0.4s",
                    }} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Log stream */}
          <div ref={logRef} style={{ flex: 1, overflowY: "auto", padding: "12px 24px", display: "flex", flexDirection: "column", gap: 4, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
            {log.map((entry, i) => (
              <div key={i} style={{
                fontSize: 11,
                color: entry.type === "done"    ? "#4ade80"
                     : entry.type === "error"   ? "#f87171"
                     : entry.type === "scene"   ? (entry.step === "visual" ? "#818cf8" : "#94a3b8")
                     : "#64748b",
                lineHeight: 1.6,
                display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <span style={{ color: "#334155", flexShrink: 0, fontSize: 10 }}>
                  {entry.type === "done" ? "✓" : entry.type === "error" ? "✗" : entry.scene ? `S${entry.scene}` : "·"}
                </span>
                <span>{entry.text}</span>
              </div>
            ))}
            {producing && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569", fontSize: 11, marginTop: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                Processing…
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "10px 24px", background: "rgba(239,68,68,0.08)", borderTop: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 11, flexShrink: 0 }}>
              ✗ {error}
              <button onClick={startProduction} style={{ marginLeft: 12, color: "#818cf8", background: "none", border: "none", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>Retry</button>
            </div>
          )}

          {/* Stop / Retry */}
          {producing && (
            <div style={{ padding: "10px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
              <button onClick={stopProduction} style={{ fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 14px", cursor: "pointer" }}>
                Stop Production
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function MovieProductionApp({ projectId, projectName, projectType, onClose }: Props) {
  const [manifest, setManifest] = useState<MovieManifest | null>(null);
  const [view, setView]         = useState<"console" | "player">("console");

  const handleComplete = useCallback((m: MovieManifest) => {
    setManifest(m);
    setView("player");
  }, []);

  const handleRestart = useCallback(() => {
    setManifest(null);
    setView("console");
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#000", position: "relative" }}>

      {/* Header bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
        background: "#09090b", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", flex: 1 }}>
          🎬 Movie Production · {projectName}
        </div>

        {manifest && (
          <>
            <button
              onClick={() => setView("player")}
              style={{ fontSize: 10, fontWeight: 600, padding: "3px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: view === "player" ? "#6366f1" : "rgba(255,255,255,0.07)", color: view === "player" ? "#fff" : "#94a3b8" }}
            >
              ▶ Player
            </button>
            <button
              onClick={() => setView("console")}
              style={{ fontSize: 10, fontWeight: 600, padding: "3px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: view === "console" ? "#6366f1" : "rgba(255,255,255,0.07)", color: view === "console" ? "#fff" : "#94a3b8" }}
            >
              ⚙ Console
            </button>
          </>
        )}

        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>✕</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {view === "console" || !manifest ? (
          <ProductionConsole
            projectId={projectId}
            projectName={projectName}
            projectType={projectType}
            onComplete={handleComplete}
          />
        ) : (
          <CinematicPlayer manifest={manifest} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}

export default MovieProductionApp;
