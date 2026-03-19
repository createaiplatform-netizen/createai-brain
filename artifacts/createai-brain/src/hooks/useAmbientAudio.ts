import { useRef, useCallback, useEffect } from "react";

// ─── Mood → ambient pad params ────────────────────────────────────────────────

export interface MoodParams {
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

export function getMoodParams(musicCue: string): MoodParams {
  const cue = (musicCue ?? "").toLowerCase();
  if (/tense|dark|horror|thriller|suspense|ominous|dread|sinister/.test(cue))
    return { freq: 55,    freq2: 73.4,  filterFreq: 220,  volume: 0.07, lfoRate: 0.12, waveform: "sawtooth", wave2: "sine",     delayTime: 0.6,  feedback: 0.35 };
  if (/action|battle|intense|fight|chase|urgent|climax/.test(cue))
    return { freq: 110,   freq2: 164.8, filterFreq: 900,  volume: 0.08, lfoRate: 0.9,  waveform: "square",   wave2: "sawtooth", delayTime: 0.25, feedback: 0.20 };
  if (/romantic|gentle|love|soft|tender|warm|intimate/.test(cue))
    return { freq: 220,   freq2: 330,   filterFreq: 1400, volume: 0.05, lfoRate: 0.25, waveform: "sine",     wave2: "sine",     delayTime: 0.8,  feedback: 0.28 };
  if (/sad|mournful|grief|sorrow|melancholy|tragedy|loss/.test(cue))
    return { freq: 146.8, freq2: 174.6, filterFreq: 550,  volume: 0.05, lfoRate: 0.18, waveform: "sine",     wave2: "triangle", delayTime: 1.0,  feedback: 0.32 };
  if (/uplifting|triumph|victory|hope|joy|bright|happy|celebrat/.test(cue))
    return { freq: 261.6, freq2: 392,   filterFreq: 2200, volume: 0.06, lfoRate: 0.4,  waveform: "sine",     wave2: "sine",     delayTime: 0.5,  feedback: 0.18 };
  if (/mystery|ethereal|dream|haunting|eerie|wonder|cosmic|space/.test(cue))
    return { freq: 174.6, freq2: 261.6, filterFreq: 1100, volume: 0.04, lfoRate: 0.08, waveform: "sine",     wave2: "sine",     delayTime: 1.2,  feedback: 0.42 };
  if (/montage|nostalgic|memory|past|bittersweet/.test(cue))
    return { freq: 196,   freq2: 293.7, filterFreq: 900,  volume: 0.05, lfoRate: 0.22, waveform: "sine",     wave2: "triangle", delayTime: 0.7,  feedback: 0.30 };
  return   { freq: 174.6, freq2: 220,   filterFreq: 800,  volume: 0.05, lfoRate: 0.20, waveform: "sine",     wave2: "sine",     delayTime: 0.9,  feedback: 0.30 };
}

// ─── Mood → pentatonic arpeggiator params ────────────────────────────────────

export function getArpParams(cue: string): { root: number; scale: number[]; bpm: number; vol: number } {
  const c = (cue ?? "").toLowerCase();
  if (/uplift|triumph|hope|joy|victory|celebrat/.test(c))
    return { root: 261.63, scale: [0, 2, 4, 7, 9],  bpm: 92,  vol: 0.055 };
  if (/sad|melan|grief|loss|sorrow|mourn/.test(c))
    return { root: 220.00, scale: [0, 3, 5, 7, 10], bpm: 56,  vol: 0.045 };
  if (/tense|dark|fear|danger|threat|ominous/.test(c))
    return { root: 196.00, scale: [0, 2, 4, 6, 8],  bpm: 112, vol: 0.060 };
  if (/action|battle|chase|intense|epic|combat/.test(c))
    return { root: 233.08, scale: [0, 3, 5, 7, 10], bpm: 142, vol: 0.065 };
  if (/mystery|ethereal|dream|haunt|eerie|cosmic/.test(c))
    return { root: 246.94, scale: [0, 3, 5, 7, 10], bpm: 50,  vol: 0.038 };
  if (/romance|tender|gentle|love|warm/.test(c))
    return { root: 261.63, scale: [0, 2, 4, 7, 9],  bpm: 68,  vol: 0.042 };
  return   { root: 261.63, scale: [0, 2, 4, 7, 9],  bpm: 80,  vol: 0.048 };
}

// ─── useAmbientAudio hook ─────────────────────────────────────────────────────
// Shared ambient Web Audio engine: layered pads + pentatonic arpeggiator.
// Usage: const audio = useAmbientAudio();
//        audio.play("uplifting");   // start ambient + arp
//        audio.crossfade("tense");  // smooth transition to new mood
//        audio.setEnabled(false);   // mute / unmute

export function useAmbientAudio() {
  const ctxRef      = useRef<AudioContext | null>(null);
  const nodesRef    = useRef<AudioNode[]>([]);
  const masterRef   = useRef<GainNode | null>(null);
  const enabledRef  = useRef(true);
  const arpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const arpIndexRef = useRef(0);

  const ensureCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new (
        window.AudioContext ??
        (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
      masterRef.current = ctxRef.current.createGain();
      masterRef.current.gain.value = 0;
      masterRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const stopCurrent = useCallback(() => {
    if (arpTimerRef.current) { clearInterval(arpTimerRef.current); arpTimerRef.current = null; }
    nodesRef.current.forEach(n => {
      try { (n as OscillatorNode).stop?.(); } catch {}
      try { n.disconnect(); } catch {}
    });
    nodesRef.current = [];
  }, []);

  // Pentatonic arpeggiator — layered melody over ambient pads
  const startArpeggiator = useCallback((musicCue: string) => {
    if (arpTimerRef.current) { clearInterval(arpTimerRef.current); arpTimerRef.current = null; }
    if (!enabledRef.current) return;
    const p = getArpParams(musicCue);
    arpIndexRef.current = 0;
    const beatMs = (60 / p.bpm) * 1000;
    arpTimerRef.current = setInterval(() => {
      const ctx = ctxRef.current;
      if (!ctx || !masterRef.current) return;
      const semitone = p.scale[arpIndexRef.current % p.scale.length] ?? 0;
      const freq = p.root * Math.pow(2, semitone / 12);
      const osc  = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const env = ctx.createGain();
      const now = ctx.currentTime;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(p.vol, now + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(env);
      env.connect(masterRef.current!);
      osc.start(now);
      osc.stop(now + 0.28);
      arpIndexRef.current++;
    }, beatMs);
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

    const lfo     = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = p.lfoRate;
    lfoGain.gain.value  = 0.28;
    lfo.connect(lfoGain);

    const padGain = ctx.createGain();
    padGain.gain.value = p.volume;
    lfoGain.connect(padGain.gain);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = p.filterFreq;
    filter.Q.value = 1.8;

    const delay  = ctx.createDelay(2.0);
    const fbGain = ctx.createGain();
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

    startArpeggiator(musicCue);
  }, [ensureCtx, stopCurrent, startArpeggiator]);

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

  useEffect(() => () => {
    if (arpTimerRef.current) clearInterval(arpTimerRef.current);
    stopCurrent();
    ctxRef.current?.close();
  }, [stopCurrent]);

  return { play, crossfade, fadeOut, fadeIn, setEnabled, startArpeggiator };
}
