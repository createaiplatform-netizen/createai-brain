import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { ProjectType } from "./ProjectTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SceneChoice {
  label:       string;
  targetIndex: number;
}

interface SceneManifest {
  sceneIndex:  number;
  title:       string;
  imageUrl:    string;
  dialogue:    string;
  cameraDir:   string;
  musicCue:    string;
  moodColor:   string;
  durationSec: number;
  choices?:    SceneChoice[];
}

interface MovieManifest {
  projectName: string;
  titleCard:   { title: string; tagline: string; creditLines: string[] };
  scenes:      SceneManifest[];
  generatedAt: string;
}

interface LogEntry {
  type:   "status" | "scene" | "done" | "error";
  text:   string;
  scene?: number;
  total?: number;
  step?:  string;
}

interface Props {
  projectId:   string | number;
  projectName: string;
  projectType: ProjectType | string;
  onClose?:    () => void;
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
  return `${m}m ${s < 10 ? "0" : ""}${s}s`;
}

// ─── Ambient Audio Engine ─────────────────────────────────────────────────────
// Generates mood-matched ambient soundscapes using Web Audio API — zero deps.

interface MoodParams {
  freq:       number;
  freq2:      number;
  filterFreq: number;
  volume:     number;
  lfoRate:    number;
  waveform:   OscillatorType;
  wave2:      OscillatorType;
  delayTime:  number;
  feedback:   number;
}

function getMoodParams(musicCue: string): MoodParams {
  const cue = (musicCue ?? "").toLowerCase();
  if (/tense|dark|horror|thriller|suspense|ominous|dread|sinister/.test(cue))
    return { freq: 55,    freq2: 73.4,  filterFreq: 220,  volume: 0.07, lfoRate: 0.12, waveform: "sawtooth", wave2: "sine",     delayTime: 0.6, feedback: 0.35 };
  if (/action|battle|intense|fight|chase|urgent|climax/.test(cue))
    return { freq: 110,   freq2: 164.8, filterFreq: 900,  volume: 0.08, lfoRate: 0.9,  waveform: "square",   wave2: "sawtooth", delayTime: 0.25, feedback: 0.20 };
  if (/romantic|gentle|love|soft|tender|warm|intimate/.test(cue))
    return { freq: 220,   freq2: 330,   filterFreq: 1400, volume: 0.05, lfoRate: 0.25, waveform: "sine",     wave2: "sine",     delayTime: 0.8, feedback: 0.28 };
  if (/sad|mournful|grief|sorrow|melancholy|tragedy|loss/.test(cue))
    return { freq: 146.8, freq2: 174.6, filterFreq: 550,  volume: 0.05, lfoRate: 0.18, waveform: "sine",     wave2: "triangle", delayTime: 1.0, feedback: 0.32 };
  if (/uplifting|triumph|victory|hope|joy|bright|happy|celebrate/.test(cue))
    return { freq: 261.6, freq2: 392,   filterFreq: 2200, volume: 0.06, lfoRate: 0.4,  waveform: "sine",     wave2: "sine",     delayTime: 0.5, feedback: 0.18 };
  if (/mystery|ethereal|dream|haunting|eerie|wonder|cosmic|space/.test(cue))
    return { freq: 174.6, freq2: 261.6, filterFreq: 1100, volume: 0.04, lfoRate: 0.08, waveform: "sine",     wave2: "sine",     delayTime: 1.2, feedback: 0.42 };
  if (/montage|nostalgic|memory|past|bittersweet/.test(cue))
    return { freq: 196,   freq2: 293.7, filterFreq: 900,  volume: 0.05, lfoRate: 0.22, waveform: "sine",     wave2: "triangle", delayTime: 0.7, feedback: 0.30 };
  return   { freq: 174.6, freq2: 220,   filterFreq: 800,  volume: 0.05, lfoRate: 0.20, waveform: "sine",     wave2: "sine",     delayTime: 0.9, feedback: 0.30 };
}

function useAmbientAudio() {
  const ctxRef     = useRef<AudioContext | null>(null);
  const nodesRef   = useRef<AudioNode[]>([]);
  const masterRef  = useRef<GainNode | null>(null);
  const enabledRef = useRef(true);

  const ensureCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext ?? (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      masterRef.current = ctxRef.current.createGain();
      masterRef.current.gain.value = 0;
      masterRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const stopCurrent = useCallback(() => {
    nodesRef.current.forEach(n => {
      try { (n as OscillatorNode).stop?.(); } catch {}
      try { n.disconnect(); } catch {}
    });
    nodesRef.current = [];
  }, []);

  const play = useCallback((musicCue: string) => {
    if (!enabledRef.current) return;
    const ctx = ensureCtx();
    stopCurrent();

    const p   = getMoodParams(musicCue);
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    osc1.type = p.waveform;
    osc1.frequency.value = p.freq;

    const osc2 = ctx.createOscillator();
    osc2.type = p.wave2;
    osc2.frequency.value = p.freq2;

    // LFO — slow amplitude breathing
    const lfo     = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = p.lfoRate;
    lfoGain.gain.value  = 0.28;
    lfo.connect(lfoGain);

    const padGain = ctx.createGain();
    padGain.gain.value = p.volume;
    lfoGain.connect(padGain.gain);

    // Warmth filter
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = p.filterFreq;
    filter.Q.value = 1.8;

    // Pseudo-reverb via feedback delay
    const delay    = ctx.createDelay(2.0);
    const fbGain   = ctx.createGain();
    delay.delayTime.value = p.delayTime;
    fbGain.gain.value     = p.feedback;
    delay.connect(fbGain);
    fbGain.connect(delay);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(padGain);
    padGain.connect(delay);
    padGain.connect(masterRef.current!);
    delay.connect(masterRef.current!);

    masterRef.current!.gain.cancelScheduledValues(now);
    masterRef.current!.gain.setValueAtTime(masterRef.current!.gain.value, now);
    masterRef.current!.gain.linearRampToValueAtTime(1, now + 2.5);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    nodesRef.current = [osc1, osc2, lfo, lfoGain, padGain, filter, delay, fbGain];
  }, [ensureCtx, stopCurrent]);

  const fadeOut = useCallback((durationSec = 1.2) => {
    if (!masterRef.current || !ctxRef.current) return;
    const now = ctxRef.current.currentTime;
    masterRef.current.gain.cancelScheduledValues(now);
    masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
    masterRef.current.gain.linearRampToValueAtTime(0, now + durationSec);
  }, []);

  const fadeIn = useCallback((durationSec = 1.2) => {
    if (!masterRef.current || !ctxRef.current) return;
    const now = ctxRef.current.currentTime;
    masterRef.current.gain.cancelScheduledValues(now);
    masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
    masterRef.current.gain.linearRampToValueAtTime(1, now + durationSec);
  }, []);

  const crossfade = useCallback((musicCue: string) => {
    fadeOut(1.5);
    setTimeout(() => play(musicCue), 1500);
  }, [fadeOut, play]);

  const setEnabled = useCallback((on: boolean) => {
    enabledRef.current = on;
    if (!on) fadeOut(0.5);
    else fadeIn(0.8);
  }, [fadeOut, fadeIn]);

  useEffect(() => () => { stopCurrent(); ctxRef.current?.close(); }, [stopCurrent]);

  return { play, crossfade, fadeOut, fadeIn, setEnabled };
}

// ─── Cinematic Player ─────────────────────────────────────────────────────────

function CinematicPlayer({
  manifest, projectId, onRestart,
}: {
  manifest:  MovieManifest;
  projectId: string | number;
  onRestart: () => void;
}) {
  const totalScenes = manifest.scenes.length;

  // -1 = title card  |  0..N-1 = scenes  |  N = credits
  const [frameIdx, setFrameIdx]       = useState<number>(-1);
  const [playing, setPlaying]         = useState(false);
  const [autoPlay, setAutoPlay]       = useState(true);
  const [muted, setMuted]             = useState(false);
  const [volume, setVolume]           = useState(0.75);
  const [speaking, setSpeaking]       = useState(false);
  const [fadeOp, setFadeOp]           = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [progress, setProgress]       = useState(0);

  const visitedRef  = useRef<Set<number>>(new Set());
  const choicesLog  = useRef<{ scene: number; label: string }[]>([]);
  const startedAt   = useRef(new Date().toISOString());
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const synthRef    = useRef<SpeechSynthesis | null>(null);
  const ttsDoneRef  = useRef<(() => void) | null>(null);

  const ambient = useAmbientAudio();

  useEffect(() => {
    synthRef.current = window.speechSynthesis ?? null;
    return () => { synthRef.current?.cancel(); };
  }, []);

  useEffect(() => { ambient.setEnabled(!muted); }, [muted, ambient]);

  // ── Derived ──
  const isTitleCard = frameIdx === -1;
  const isCredits   = frameIdx === totalScenes;
  const scene       = (!isTitleCard && !isCredits && frameIdx >= 0)
    ? (manifest.scenes[frameIdx] ?? null) : null;

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const stopTTS = useCallback(() => {
    synthRef.current?.cancel();
    setSpeaking(false);
    ttsDoneRef.current = null;
  }, []);

  // ── Cross-fade transition ──
  const goTo = useCallback((target: number, skipFade = false) => {
    const idx = Math.max(-1, Math.min(target, totalScenes));
    clearTimer();
    stopTTS();
    setShowChoices(false);

    const commit = () => {
      setFrameIdx(idx);
      setProgress(0);
      if (idx >= 0 && idx < totalScenes) visitedRef.current.add(idx);
      setTimeout(() => setFadeOp(0), 60);
    };

    if (skipFade) { commit(); return; }
    setFadeOp(1);
    setTimeout(commit, 520);
  }, [totalScenes, clearTimer, stopTTS]);

  // ── TTS playback ──
  const speakScene = useCallback((sc: SceneManifest, onDone: () => void) => {
    if (!synthRef.current || muted) { onDone(); return; }
    synthRef.current.cancel();
    setSpeaking(true);
    ttsDoneRef.current = onDone;

    const lines = formatDialogue(sc.dialogue);
    if (!lines.length) { setSpeaking(false); onDone(); return; }

    let i = 0;
    const sayNext = () => {
      if (i >= lines.length) {
        setSpeaking(false);
        const cb = ttsDoneRef.current;
        ttsDoneRef.current = null;
        cb?.();
        return;
      }
      const utt      = new SpeechSynthesisUtterance(lines[i]!.line);
      utt.rate       = 0.88;
      utt.pitch      = lines[i]!.speaker === "NARRATOR" ? 0.92 : 1.06;
      utt.volume     = volume;
      utt.onend      = () => { i++; sayNext(); };
      utt.onerror    = () => { setSpeaking(false); ttsDoneRef.current?.(); };
      synthRef.current!.speak(utt);
      i++;
    };
    sayNext();
  }, [muted, volume]);

  // ── Core auto-play engine ──
  const runScene = useCallback((idx: number) => {
    clearTimer();
    stopTTS();
    if (!playing || !autoPlay) return;

    const advance = () => {
      const next = idx + 1;
      if (next > totalScenes) return;
      const sc = manifest.scenes[idx];
      if (sc?.choices?.length) { setShowChoices(true); return; }
      goTo(next);
    };

    // Fixed durations for non-scene frames
    if (idx === -1 || idx === totalScenes) {
      const capMs = idx === -1 ? 5000 : 9000;
      let e = 0;
      timerRef.current = setInterval(() => {
        e += 100;
        setProgress(Math.min(1, e / capMs));
        if (e >= capMs) { clearTimer(); if (idx === -1) advance(); }
      }, 100);
      return;
    }

    // Scene: TTS drives timing, timer caps the maximum
    const sc    = manifest.scenes[idx]!;
    const capMs = Math.max((sc.durationSec ?? 45) * 1000, 6000);
    let elapsed = 0;
    let timerCapped = false;
    let ttsDone     = false;

    const tryAdvance = () => { if (timerCapped && ttsDone) advance(); };

    timerRef.current = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min(1, elapsed / capMs));
      if (elapsed >= capMs && !timerCapped) {
        timerCapped = true;
        clearTimer();
        tryAdvance();
      }
    }, 100);

    speakScene(sc, () => { ttsDone = true; tryAdvance(); });
    ambient.crossfade(sc.musicCue ?? "");
  }, [playing, autoPlay, totalScenes, manifest.scenes, goTo, clearTimer, stopTTS, speakScene, ambient]);

  // Re-run engine when frame or playing state changes
  useEffect(() => {
    if (playing && autoPlay) {
      runScene(frameIdx);
    } else if (!playing) {
      clearTimer();
      stopTTS();
      ambient.fadeOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIdx, playing]);

  // Ambient resume on unpause
  useEffect(() => {
    if (playing && (scene || isTitleCard)) ambient.fadeIn();
  }, [playing, scene, isTitleCard, ambient]);

  // ── Branching ──
  const handleChoice = useCallback((choice: SceneChoice) => {
    choicesLog.current.push({ scene: frameIdx, label: choice.label });
    setShowChoices(false);
    goTo(choice.targetIndex);
  }, [frameIdx, goTo]);

  const skipChoices = useCallback(() => {
    setShowChoices(false);
    goTo(frameIdx + 1);
  }, [frameIdx, goTo]);

  // ── Controls ──
  const togglePlay = useCallback(() => {
    setPlaying(p => {
      const next = !p;
      if (!next) { clearTimer(); stopTTS(); ambient.fadeOut(); }
      return next;
    });
  }, [clearTimer, stopTTS, ambient]);

  const toggleTTS = useCallback(() => {
    if (speaking) { stopTTS(); return; }
    if (scene) speakScene(scene, () => {});
  }, [speaking, scene, stopTTS, speakScene]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space")      { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowRight") { e.preventDefault(); goTo(frameIdx + 1); }
      if (e.code === "ArrowLeft")  { e.preventDefault(); goTo(frameIdx - 1); }
      if (e.code === "KeyM")       setMuted(m => !m);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [togglePlay, goTo, frameIdx]);

  // ── Save session ──
  const saveSession = useCallback(async () => {
    setSaving(true);
    const body = {
      name:     `Cinematic Session — ${new Date().toLocaleDateString()}`,
      fileType: "json",
      content:  JSON.stringify({
        movie:        manifest.projectName,
        generatedAt:  manifest.generatedAt,
        sessionStart: startedAt.current,
        sessionEnd:   new Date().toISOString(),
        totalScenes,
        scenesVisited: [...visitedRef.current],
        choicesMade:   choicesLog.current,
        scenes: manifest.scenes.map((sc, i) => ({
          index:   i,
          title:   sc.title,
          visited: visitedRef.current.has(i),
        })),
      }, null, 2),
      folderId: null,
    };
    try {
      const r = await fetch(`/api/projects/${projectId}/files`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(body),
      });
      if (r.ok) setSaved(true);
    } catch {}
    setSaving(false);
  }, [manifest, projectId, totalScenes]);

  // ── Movie-level progress (for outer scrubber) ──
  const moviePct = useMemo(() => {
    const pos = frameIdx + 1; // -1→0, 0→1, N→N+1
    return ((pos + progress) / (totalScenes + 2)) * 100;
  }, [frameIdx, progress, totalScenes]);

  const bgGradient = isTitleCard
    ? "radial-gradient(ellipse at 40% 50%, #0f172a 0%, #020617 100%)"
    : isCredits
      ? "radial-gradient(ellipse at 50% 40%, #0a0a0f 0%, #000 100%)"
      : `radial-gradient(ellipse at 40% 60%, ${scene?.moodColor ?? "#1e293b"}40 0%, #030712 100%)`;

  const dialogueLines = useMemo(() => scene ? formatDialogue(scene.dialogue) : [], [scene]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#000", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", position: "relative", userSelect: "none" }}>

      {/* ── Fade overlay ─────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0, background: "#000", zIndex: 60,
        opacity: fadeOp, pointerEvents: "none",
        transition: fadeOp === 0 ? "opacity 0.52s ease" : "opacity 0.42s ease",
      }} />

      {/* ── Main visual ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Scene image */}
        {scene?.imageUrl && (
          <img
            key={scene.imageUrl}
            src={scene.imageUrl}
            alt={scene.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {/* Base gradient */}
        <div style={{
          position: "absolute", inset: 0,
          background: scene?.imageUrl
            ? "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.6) 72%, rgba(0,0,0,0.94) 100%)"
            : bgGradient,
        }} />

        {/* ── Title card ── */}
        {isTitleCard && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 52px", textAlign: "center", zIndex: 10 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#64748b", textTransform: "uppercase", marginBottom: 22 }}>A Film by CreateAI Brain</div>
            <h1 style={{ fontSize: "clamp(26px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 14px", lineHeight: 1.08, textShadow: "0 4px 40px rgba(0,0,0,0.9)" }}>
              {manifest.titleCard.title}
            </h1>
            <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", margin: "0 0 36px", maxWidth: 460, lineHeight: 1.6 }}>
              {manifest.titleCard.tagline}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 36 }}>
              {manifest.titleCard.creditLines.slice(0, 4).map((l, i) => (
                <div key={i} style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em" }}>{l}</div>
              ))}
            </div>
            {!playing && (
              <button
                onClick={() => setPlaying(true)}
                style={{
                  padding: "13px 38px", borderRadius: 32,
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", letterSpacing: "0.04em",
                  boxShadow: "0 8px 32px rgba(99,102,241,0.5)",
                }}
              >
                ▶ PLAY FILM
              </button>
            )}
            <div style={{ marginTop: 14, fontSize: 9, color: "#334155", letterSpacing: "0.06em" }}>
              {totalScenes} scenes · {totalRuntime(manifest.scenes)} · AI-generated
            </div>
          </div>
        )}

        {/* ── Credits ── */}
        {isCredits && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 48px", textAlign: "center", zIndex: 10 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#334155", textTransform: "uppercase", marginBottom: 18 }}>The End</div>
            <h2 style={{ fontSize: "clamp(18px,4vw,32px)", fontWeight: 700, color: "#f1f5f9", margin: "0 0 10px" }}>
              {manifest.titleCard.title}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 16, maxHeight: 180, overflow: "hidden" }}>
              {manifest.titleCard.creditLines.map((l, i) => (
                <div key={i} style={{ fontSize: 11, color: "#334155", letterSpacing: "0.06em" }}>{l}</div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 9, color: "#1e293b" }}>
              Scenes visited: {visitedRef.current.size}/{totalScenes}
              {choicesLog.current.length > 0 && ` · ${choicesLog.current.length} choices made`}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              <button
                onClick={onRestart}
                style={{ padding: "8px 20px", borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                ↩ New Version
              </button>
              <button
                onClick={saveSession}
                disabled={saved || saving}
                style={{ padding: "8px 20px", borderRadius: 20, background: saved ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.15)", border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.3)"}`, color: saved ? "#34d399" : "#818cf8", fontSize: 11, fontWeight: 600, cursor: saved || saving ? "default" : "pointer" }}>
                {saved ? "✓ Saved" : saving ? "Saving…" : "💾 Save Session"}
              </button>
            </div>
          </div>
        )}

        {/* ── Active scene overlays ── */}
        {scene && (
          <>
            {/* Top-left: scene counter + speaking indicator */}
            <div style={{ position: "absolute", top: 14, left: 18, zIndex: 20, display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ padding: "3px 9px", borderRadius: 4, background: "rgba(0,0,0,0.55)", fontSize: 9, color: "#64748b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {frameIdx + 1} / {totalScenes}
              </div>
              {speaking && (
                <div style={{ padding: "3px 9px", borderRadius: 4, background: "rgba(99,102,241,0.28)", fontSize: 9, color: "#818cf8", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8", display: "inline-block", animation: "blink 0.9s infinite" }} />
                  SPEAKING
                </div>
              )}
            </div>

            {/* Top-right: camera direction */}
            <div style={{ position: "absolute", top: 14, right: 18, zIndex: 20, padding: "3px 9px", borderRadius: 4, background: "rgba(0,0,0,0.45)", fontSize: 9, color: "#475569", maxWidth: 220, textAlign: "right" }}>
              {scene.cameraDir}
            </div>

            {/* Top-center: music cue tag */}
            {!muted && scene.musicCue && (
              <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 20, padding: "3px 10px", borderRadius: 4, background: "rgba(0,0,0,0.4)", fontSize: 9, color: "#334155", whiteSpace: "nowrap" }}>
                ♪ {scene.musicCue.slice(0, 32)}{scene.musicCue.length > 32 ? "…" : ""}
              </div>
            )}

            {/* Subtitles + dialogue block */}
            <div style={{ position: "absolute", bottom: 68, left: 0, right: 0, zIndex: 20, padding: "0 44px" }}>
              <div style={{ maxWidth: 660, margin: "0 auto" }}>
                {/* Scene title */}
                <div style={{ textAlign: "center", fontSize: 9, color: "#334155", marginBottom: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {scene.title}
                </div>
                {/* Dialogue lines */}
                {dialogueLines.slice(0, 3).map((dl, i) => (
                  <div key={i} style={{ textAlign: "center", marginBottom: 5 }}>
                    {dl.speaker !== "NARRATOR" && (
                      <div style={{ fontSize: 8, color: "#818cf8", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 2 }}>
                        {dl.speaker}
                      </div>
                    )}
                    <span style={{
                      fontSize: 13, color: "#f1f5f9", lineHeight: 1.55,
                      textShadow: "0 2px 14px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.8)",
                      fontStyle: dl.speaker === "NARRATOR" ? "italic" : "normal",
                    }}>
                      {dl.line}
                    </span>
                  </div>
                ))}
                {dialogueLines.length > 3 && (
                  <div style={{ textAlign: "center", fontSize: 9, color: "#334155", marginTop: 2 }}>
                    +{dialogueLines.length - 3} more lines
                  </div>
                )}
              </div>
            </div>

            {/* ── Interactive choices overlay ── */}
            {showChoices && scene.choices?.length && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 50,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.78)", backdropFilter: "blur(4px)",
              }}>
                <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18, fontWeight: 700 }}>
                  What happens next?
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, width: "min(420px, 88%)" }}>
                  {scene.choices.map((ch, ci) => (
                    <button
                      key={ci}
                      onClick={() => handleChoice(ch)}
                      style={{
                        padding: "13px 22px", borderRadius: 12,
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
                        color: "#e2e8f0", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.18)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                    >
                      <span style={{ color: "#818cf8", marginRight: 10, fontWeight: 800 }}>
                        {["A", "B", "C"][ci]}
                      </span>
                      {ch.label}
                    </button>
                  ))}
                  <button
                    onClick={skipChoices}
                    style={{ padding: "9px 22px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.07)", color: "#334155", fontSize: 10, cursor: "pointer" }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Scene dots navigation */}
        {!isTitleCard && !isCredits && (
          <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, zIndex: 20, display: "flex", justifyContent: "center", gap: 5 }}>
            {manifest.scenes.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                style={{
                  width: i === frameIdx ? 22 : 6, height: 6, borderRadius: 3, border: "none", cursor: "pointer", padding: 0,
                  background: i === frameIdx ? "#6366f1" : visitedRef.current.has(i) ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.15)",
                  transition: "all 0.25s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Transport bar ─────────────────────────────────────────────────── */}
      <div style={{ background: "#06060e", padding: "9px 16px 7px", display: "flex", flexDirection: "column", gap: 5, flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.04)" }}>

        {/* Movie-level scrubber */}
        <div
          style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, cursor: "pointer" }}
          onClick={e => {
            const r   = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - r.left) / r.width;
            const idx = Math.round(pct * (totalScenes + 2)) - 1;
            goTo(Math.max(-1, Math.min(idx, totalScenes)));
          }}
          title="Click to jump to scene"
        >
          <div style={{ width: `${moviePct}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#a78bfa)", borderRadius: 2, transition: "width 0.15s linear" }} />
        </div>

        {/* Scene-level progress */}
        <div style={{ height: 1.5, background: "rgba(255,255,255,0.04)", borderRadius: 1 }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "rgba(99,102,241,0.45)", transition: "width 0.15s linear" }} />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>

          {/* ⏮ Rewind to start */}
          <button onClick={() => goTo(-1)} title="Restart (rewind to title)" style={{ background: "none", border: "none", color: "#2d3748", fontSize: 13, cursor: "pointer", padding: "0 2px" }}>⏮</button>

          {/* ◀ Prev scene */}
          <button onClick={() => goTo(frameIdx - 1)} disabled={frameIdx <= -1}
            style={{ background: "none", border: "none", color: frameIdx <= -1 ? "#1a202c" : "#4a5568", fontSize: 13, cursor: frameIdx <= -1 ? "default" : "pointer", padding: "0 2px" }}>◀</button>

          {/* ⏸/▶ Play/Pause */}
          <button onClick={togglePlay} title="Play/Pause (Space)"
            style={{ width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: playing ? "rgba(99,102,241,0.9)" : "rgba(255,255,255,0.08)", color: "#fff" }}>
            {playing ? "⏸" : "▶"}
          </button>

          {/* ▶ Next scene */}
          <button onClick={() => goTo(frameIdx + 1)} disabled={frameIdx >= totalScenes}
            style={{ background: "none", border: "none", color: frameIdx >= totalScenes ? "#1a202c" : "#4a5568", fontSize: 13, cursor: frameIdx >= totalScenes ? "default" : "pointer", padding: "0 2px" }}>▶</button>

          {/* AUTO badge */}
          <button onClick={() => setAutoPlay(a => !a)} title="Toggle auto-advance"
            style={{ fontSize: 8, fontWeight: 700, padding: "2px 8px", borderRadius: 5, border: "none", cursor: "pointer", letterSpacing: "0.06em", background: autoPlay ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)", color: autoPlay ? "#818cf8" : "#2d3748" }}>
            AUTO
          </button>

          <div style={{ flex: 1 }} />

          {/* 🎙 Voice */}
          {scene && (
            <button onClick={toggleTTS} title="Read dialogue aloud"
              style={{ fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 5, border: "none", cursor: "pointer", background: speaking ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.04)", color: speaking ? "#818cf8" : "#2d3748" }}>
              🎙 {speaking ? "Stop" : "Voice"}
            </button>
          )}

          {/* ♪/🔇 Mute ambient */}
          <button onClick={() => setMuted(m => !m)} title="Mute ambient audio (M)"
            style={{ fontSize: 11, background: "rgba(255,255,255,0.03)", border: "none", cursor: "pointer", color: muted ? "#1a202c" : "#4a5568", padding: "3px 6px", borderRadius: 4 }}>
            {muted ? "🔇" : "♪"}
          </button>

          {/* Volume */}
          <input type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{ width: 56, accentColor: "#6366f1", cursor: "pointer" }} title="Volume" />

          {/* 💾 Save */}
          <button onClick={saveSession} disabled={saved || saving} title="Save session to project"
            style={{ fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 5, border: "none", cursor: saved || saving ? "default" : "pointer", background: saved ? "rgba(16,185,129,0.14)" : "rgba(255,255,255,0.04)", color: saved ? "#34d399" : "#2d3748" }}>
            {saved ? "✓ Saved" : saving ? "…" : "💾"}
          </button>

          {/* Position readout */}
          <div style={{ fontSize: 9, color: "#1a202c", fontVariantNumeric: "tabular-nums", minWidth: 44, textAlign: "right" }}>
            {isTitleCard ? "Title" : isCredits ? "End" : `${frameIdx + 1}/${totalScenes}`}
          </div>
        </div>

        {/* Hint row */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#111827" }}>
          <span>SPACE play/pause · ← → scenes · M mute</span>
          <span>{totalRuntime(manifest.scenes)}</span>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{ opacity:1 } 50%{ opacity:0.25 } }
      `}</style>
    </div>
  );
}

// ─── Production Console ───────────────────────────────────────────────────────

function ProductionConsole({
  projectId, projectName, projectType, onComplete,
}: {
  projectId:   string | number;
  projectName: string;
  projectType: string;
  onComplete:  (manifest: MovieManifest) => void;
}) {
  const [log, setLog]                 = useState<LogEntry[]>([]);
  const [producing, setProducing]     = useState(false);
  const [error, setError]             = useState("");
  const [scenesDone, setScenesDone]   = useState(0);
  const [scenesTotal, setScenesTotal] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const logRef   = useRef<HTMLDivElement>(null);

  const appendLog = useCallback((entry: LogEntry) =>
    setLog(prev => [...prev.slice(-80), entry]), []);

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
        const err = await resp.json().catch(() => ({ error: "Network error" })) as { error?: string };
        throw new Error(err.error ?? `HTTP ${resp.status}`);
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
              setScenesDone(p => p + 1);
              appendLog({ type: "scene", text: `✓ Scene ${evt.scene}/${evt.total} — "${(evt.data?.title ?? "").slice(0, 50)}" complete`, scene: evt.scene });
            } else if (evt.type === "done" && evt.manifest) {
              appendLog({ type: "done", text: `🎬 Production complete — entering cinematic playback` });
              setProducing(false);
              setTimeout(() => onComplete(evt.manifest!), 600);
            } else if (evt.type === "error") {
              throw new Error(evt.message ?? "Unknown error");
            }
          } catch (parseErr) {
            if ((parseErr as Error).message && !/JSON/.test((parseErr as Error).message)) throw parseErr;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      appendLog({ type: "error", text: `✗ ${msg}` });
      setProducing(false);
    }
  }, [projectId, appendLog, onComplete]);

  // Auto-start generation as soon as the component mounts
  useEffect(() => { void startProduction(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = scenesTotal > 0 ? Math.round((scenesDone / scenesTotal) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#050508", color: "#e2e8f0", fontFamily: "'Inter', system-ui" }}>

      {/* Initialising spinner — visible only for the first instant before SSE starts */}
      {!producing && !log.length && !error && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ fontSize: 32 }}>🎬</div>
          <div style={{ fontSize: 13, color: "#475569" }}>Starting cinematic engine…</div>
        </div>
      )}

      {/* Log stream */}
      {(producing || log.length > 0) && (
        <>
          {producing && (
            <div style={{ padding: "10px 16px 6px", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#334155", marginBottom: 5 }}>
                <span>{currentStep}</span>
                {scenesTotal > 0 && <span>{scenesDone}/{scenesTotal} scenes · {pct}%</span>}
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>
            </div>
          )}
          <div ref={logRef} style={{ flex: 1, overflow: "auto", padding: "10px 16px", display: "flex", flexDirection: "column", gap: 2, fontFamily: "monospace" }}>
            {log.map((e, i) => (
              <div key={i} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, color: e.type === "error" ? "#f87171" : e.type === "done" ? "#34d399" : e.type === "scene" ? "#818cf8" : "#334155" }}>
                {e.text}
              </div>
            ))}
          </div>
        </>
      )}

      {error && !producing && (
        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(248,113,113,0.1)", flexShrink: 0, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, fontSize: 11, color: "#f87171" }}>{error}</div>
          <button onClick={startProduction} style={{ padding: "5px 14px", borderRadius: 7, background: "rgba(99,102,241,0.12)", border: "1px solid #6366f1", color: "#818cf8", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Retry</button>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function MovieProductionApp({ projectId, projectName, projectType, onClose }: Props) {
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#050508" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "#09090b", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", flex: 1 }}>🎬 {projectName}</div>
        {manifest && (
          <>
            <button onClick={() => setView("player")}
              style={{ fontSize: 10, fontWeight: 600, padding: "3px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: view === "player" ? "#6366f1" : "rgba(255,255,255,0.06)", color: view === "player" ? "#fff" : "#64748b" }}>
              ▶ Player
            </button>
            <button onClick={() => setView("console")}
              style={{ fontSize: 10, fontWeight: 600, padding: "3px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: view === "console" ? "#6366f1" : "rgba(255,255,255,0.06)", color: view === "console" ? "#fff" : "#64748b" }}>
              ⚙ Console
            </button>
          </>
        )}
        {onClose && <button onClick={onClose} style={{ background: "none", border: "none", color: "#334155", fontSize: 16, cursor: "pointer" }}>✕</button>}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {view === "console" || !manifest ? (
          <ProductionConsole projectId={projectId} projectName={projectName} projectType={projectType} onComplete={handleComplete} />
        ) : (
          <CinematicPlayer manifest={manifest} projectId={projectId} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}

export default MovieProductionApp;

// Named alias used by RenderEngineApp and any consumer that imports by name
export const UltimateRenderEngineApp = MovieProductionApp;
