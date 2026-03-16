// ═══════════════════════════════════════════════════════════════════════════
// MEDIA PLAYER — Universal cinematic audio/video player component
// Supports audio and video with premium dark-glass controls
// No external dependencies — all native HTML5 media APIs
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState, useEffect, useCallback } from "react";

interface MediaPlayerProps {
  src?: string;
  type?: "audio" | "video";
  title?: string;
  subtitle?: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MediaPlayer({
  src,
  type = "audio",
  title = "Untitled",
  subtitle,
  poster,
  autoPlay = false,
  className = "",
}: MediaPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showVol, setShowVol] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const media = mediaRef.current;

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;

    const onCanPlay   = () => setLoading(false);
    const onDuration  = () => setDuration(el.duration);
    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime);
      setProgress(el.duration ? el.currentTime / el.duration : 0);
    };
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
    const onError = () => { setError(true); setLoading(false); };

    el.addEventListener("canplay",    onCanPlay);
    el.addEventListener("durationchange", onDuration);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("play",       onPlay);
    el.addEventListener("pause",      onPause);
    el.addEventListener("ended",      onEnded);
    el.addEventListener("error",      onError);
    return () => {
      el.removeEventListener("canplay",    onCanPlay);
      el.removeEventListener("durationchange", onDuration);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("play",       onPlay);
      el.removeEventListener("pause",      onPause);
      el.removeEventListener("ended",      onEnded);
      el.removeEventListener("error",      onError);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    if (playing) el.pause(); else el.play().catch(() => {});
  }, [playing]);

  const toggleMute = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    el.muted = !muted;
    setMuted(!muted);
  }, [muted]);

  const handleVolumeChange = useCallback((v: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.volume = v;
    setVolume(v);
    setMuted(v === 0);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = mediaRef.current;
    const bar = progressRef.current;
    if (!el || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * duration;
  }, [duration]);

  const skip = useCallback((seconds: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(duration, el.currentTime + seconds));
  }, [duration]);

  const toggleFullscreen = useCallback(() => {
    const container = document.getElementById("media-player-container");
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  }, []);

  const volumeIcon = muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊";

  // ── No source placeholder ──
  if (!src) {
    return (
      <div className={`media-player flex flex-col items-center justify-center gap-3 py-12 px-8 text-center ${className}`}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)" }}>
          {type === "video" ? "🎬" : "🎵"}
        </div>
        <div>
          <p className="font-semibold text-[14px]" style={{ color: "rgba(255,255,255,0.80)" }}>
            {type === "video" ? "Video Player" : "Audio Player"}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            {type === "video"
              ? "Drop a video file or connect a media source to begin"
              : "Drop an audio file or connect a media source to begin"}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button className="media-control-btn">⏮</button>
          <button className="media-control-btn primary" style={{ opacity: 0.5, cursor: "not-allowed" }}>▶</button>
          <button className="media-control-btn">⏭</button>
        </div>
        <div className="w-full mt-2">
          <div className="progress-bar-track w-full">
            <div className="progress-bar-fill" style={{ width: "0%" }} />
          </div>
        </div>
        <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.20)" }}>No media source — demo placeholder</p>
      </div>
    );
  }

  return (
    <div id="media-player-container" className={`media-player ${className}`}>
      {/* ── Video element ── */}
      {type === "video" && (
        <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            poster={poster}
            autoPlay={autoPlay}
            className="w-full h-full object-contain"
            playsInline
          />
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="text-3xl">⚠️</span>
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.50)" }}>Unable to load video</p>
            </div>
          )}
          {/* Click to play/pause */}
          <div className="absolute inset-0 cursor-pointer" onClick={togglePlay} />
          {/* Center play indicator */}
          {!playing && !loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-black/50 border border-white/20"
                style={{ backdropFilter: "blur(8px)" }}>
                ▶
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Audio visual ── */}
      {type === "audio" && (
        <div className="px-4 pt-4 pb-2 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.20),rgba(139,92,246,0.15))", border: "1px solid rgba(99,102,241,0.22)", animation: playing ? "floatUp 2s ease-in-out infinite" : undefined }}>
            🎵
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] truncate" style={{ color: "rgba(255,255,255,0.88)" }}>{title}</p>
            {subtitle && <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.40)" }}>{subtitle}</p>}
          </div>
          <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={src} autoPlay={autoPlay} />
        </div>
      )}

      {/* ── Metadata row (video) ── */}
      {type === "video" && (title || subtitle) && (
        <div className="px-4 pt-3 pb-1">
          <p className="font-semibold text-[13px]" style={{ color: "rgba(255,255,255,0.88)" }}>{title}</p>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>{subtitle}</p>}
        </div>
      )}

      {/* ── Progress bar ── */}
      <div className="px-4 py-3">
        <div
          ref={progressRef}
          className="progress-bar-track w-full cursor-pointer"
          onClick={handleSeek}
        >
          <div className="progress-bar-fill transition-none" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{formatTime(currentTime)}</span>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <button className="media-control-btn" onClick={() => skip(-10)} title="Back 10s">⏪</button>
        <button className="media-control-btn primary" onClick={togglePlay} title={playing ? "Pause" : "Play"}>
          {playing ? "⏸" : "▶"}
        </button>
        <button className="media-control-btn" onClick={() => skip(10)} title="Forward 10s">⏩</button>

        <div className="flex-1" />

        {/* Volume */}
        <div className="relative flex items-center gap-1.5">
          <button className="media-control-btn" onClick={toggleMute} title="Toggle mute"
            onMouseEnter={() => setShowVol(true)}
            onMouseLeave={() => setShowVol(false)}>
            {volumeIcon}
          </button>
          {showVol && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 rounded-xl"
              style={{ background: "rgba(10,12,30,0.98)", border: "1px solid rgba(255,255,255,0.10)", width: 32 }}
              onMouseEnter={() => setShowVol(true)}
              onMouseLeave={() => setShowVol(false)}>
              <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={e => handleVolumeChange(Number(e.target.value))}
                style={{ writingMode: "vertical-lr", height: 64, width: 4, direction: "rtl" }}
              />
            </div>
          )}
        </div>

        {/* Fullscreen (video only) */}
        {type === "video" && (
          <button className="media-control-btn" onClick={toggleFullscreen} title="Fullscreen">
            {fullscreen ? "⛶" : "⛶"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Audio Track Card (for playlists) ────────────────────────────────────
export function AudioTrack({ title, subtitle, duration: dur, active, onClick }: {
  title: string; subtitle?: string; duration?: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
      style={{
        background: active ? "rgba(99,102,241,0.12)" : "transparent",
        border: `1px solid ${active ? "rgba(99,102,241,0.25)" : "transparent"}`,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
        style={{ background: active ? "rgba(99,102,241,0.20)" : "rgba(255,255,255,0.06)" }}>
        {active ? <span className="animate-pulse" style={{ color: "#818cf8" }}>♪</span> : "♪"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[12px] truncate" style={{ color: active ? "#a5b4fc" : "rgba(255,255,255,0.80)" }}>{title}</p>
        {subtitle && <p className="text-[10px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{subtitle}</p>}
      </div>
      {dur && <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.30)" }}>{dur}</span>}
    </button>
  );
}
