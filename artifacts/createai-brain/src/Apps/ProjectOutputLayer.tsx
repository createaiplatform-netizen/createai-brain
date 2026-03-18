import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectLike {
  id: string;
  name: string;
  industry: string;
  icon: string;
  color: string;
  files: Array<{ id: string; name: string; type: string; content?: string }>;
}

interface RendererProps {
  project: ProjectLike;
  compact: boolean;
}

export interface ProjectOutputLayerProps {
  project: ProjectLike;
  compact?: boolean;
}

type OutputType =
  | "video" | "game" | "app" | "website"
  | "book" | "music" | "podcast" | "course"
  | "business" | "startup" | "product" | "document"
  | "dashboard";

// ─── Type Detection ───────────────────────────────────────────────────────────

function detectOutputType(industry: string): OutputType {
  const s = industry.toLowerCase();
  if (s.includes("film") || s.includes("movie") || s.includes("documentary")) return "video";
  if (s.includes("game"))             return "game";
  if (s.includes("mobile app"))       return "app";
  if (s.includes("web app") || s.includes("saas")) return "website";
  if (s.includes("book") || s.includes("novel"))   return "book";
  if (s.includes("music") || s.includes("album"))  return "music";
  if (s.includes("podcast"))          return "podcast";
  if (s.includes("course"))           return "course";
  if (s.includes("startup"))          return "startup";
  if (s.includes("business"))         return "business";
  if (s.includes("physical product") || s.includes("product")) return "product";
  return "dashboard";
}

function getFileContent(project: ProjectLike, keywords: string[]): string {
  for (const kw of keywords) {
    const f = project.files.find(f => f.name.toLowerCase().includes(kw.toLowerCase()) && f.content);
    if (f?.content) return f.content;
  }
  return "";
}

// ─── Shared UI Pieces ─────────────────────────────────────────────────────────

function OutputShell({ label, icon, color, children, compact }: {
  label: string; icon: string; color: string; children: React.ReactNode; compact: boolean;
}) {
  return (
    <div style={{
      height: compact ? 200 : "100%",
      background: "#fff",
      borderRadius: compact ? 14 : 0,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      border: compact ? "1px solid rgba(0,0,0,0.08)" : "none",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: compact ? "8px 12px" : "10px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "#fafafa", flexShrink: 0,
      }}>
        <span style={{ fontSize: compact ? 14 : 16 }}>{icon}</span>
        <span style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: "#0f172a" }}>{label}</span>
        <span style={{
          marginLeft: "auto", fontSize: 10, fontWeight: 600,
          padding: "2px 8px", borderRadius: 20,
          background: `${color}15`, color,
          border: `1px solid ${color}30`,
        }}>LIVE OUTPUT</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

// ─── 1. Video Output (Film / Movie / Documentary) ─────────────────────────────

function VideoOutput({ project, compact }: RendererProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(18);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    const draw = () => {
      frameRef.current++;
      const t = frameRef.current;
      ctx.clearRect(0, 0, W, H);

      // Cinematic bars
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
      sky.addColorStop(0, "#0c1520");
      sky.addColorStop(1, "#1a3a5c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H * 0.6);

      // Stars (when not playing)
      if (!playing) {
        for (let i = 0; i < 40; i++) {
          const sx = ((i * 137 + 23) % W);
          const sy = ((i * 71 + 11) % (H * 0.5));
          const alpha = 0.4 + 0.4 * Math.sin(t * 0.05 + i);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Ground
      const ground = ctx.createLinearGradient(0, H * 0.55, 0, H * 0.85);
      ground.addColorStop(0, "#1a2e1a");
      ground.addColorStop(1, "#0a1a0a");
      ctx.fillStyle = ground;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);

      // Moving scene if playing
      const scroll = playing ? (t * 1.2) % W : 0;

      // Trees
      for (let i = 0; i < 6; i++) {
        const tx = ((i * 110 + W - scroll * 0.3) % (W + 60)) - 30;
        const th = 40 + (i % 3) * 15;
        ctx.fillStyle = "#0d2a0d";
        ctx.beginPath();
        ctx.moveTo(tx, H * 0.6);
        ctx.lineTo(tx - 18, H * 0.6 - th);
        ctx.lineTo(tx + 18, H * 0.6 - th);
        ctx.closePath();
        ctx.fill();
      }

      // Moon / sun
      const moonX = W * 0.75 + (playing ? Math.sin(t * 0.01) * 5 : 0);
      ctx.fillStyle = "#f0e68c";
      ctx.shadowColor = "#f0e68c";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(moonX, H * 0.18, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Film grain
      if (playing) {
        for (let i = 0; i < 60; i++) {
          const gx = Math.random() * W;
          const gy = Math.random() * H;
          ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
          ctx.fillRect(gx, gy, 2, 2);
        }
      }

      // Cinematic letterbox bars
      const barH = H * 0.12;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, barH);
      ctx.fillRect(0, H - barH, W, barH);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [playing]);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setProgress(p => Math.min(p + 0.4, 100)), 200);
    return () => clearInterval(iv);
  }, [playing]);

  const scenes = getFileContent(project, ["shot list", "scene", "script"]).split("\n").filter(Boolean).slice(0, 4);

  return (
    <OutputShell label={`${project.name} — Preview`} icon="🎬" color="#6366f1" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ flex: 1, position: "relative", background: "#000" }}>
          <canvas ref={canvasRef} width={640} height={200} style={{ width: "100%", height: "100%", display: "block" }} />
          {!playing && (
            <button
              onClick={() => setPlaying(true)}
              style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}
            >▶</button>
          )}
        </div>
        <div style={{ background: "#111", padding: "8px 12px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <button onClick={() => setPlaying(p => !p)} style={{ background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>
              {playing ? "⏸" : "▶"}
            </button>
            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, cursor: "pointer" }}
              onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setProgress(((e.clientX - r.left) / r.width) * 100); }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#6366f1", borderRadius: 2 }} />
            </div>
            <span style={{ color: "#94a3b8", fontSize: 10 }}>{Math.floor(progress * 1.2)}:{String(Math.floor((progress * 1.2 % 1) * 60)).padStart(2,"0")} / 2:00</span>
            <span style={{ color: "#94a3b8", fontSize: 14 }}>🔊</span>
          </div>
          {!compact && scenes.length > 0 && (
            <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
              {scenes.map((s, i) => (
                <div key={i} style={{ flexShrink: 0, padding: "4px 10px", background: "rgba(255,255,255,0.07)", borderRadius: 6, fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                  Scene {i + 1}: {s.slice(0, 28)}{s.length > 28 ? "…" : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 2. Game Output ───────────────────────────────────────────────────────────

function GameOutput({ project, compact }: RendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ x: 80, y: 140, vy: 0, grounded: true, score: 0, obstacles: [] as { x: number; h: number }[], t: 0, running: true });
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const G = 0.6, FLOOR = H - 50;

    const onKey = (e: KeyboardEvent) => {
      if (e.type === "keydown") keysRef.current.add(e.key);
      else keysRef.current.delete(e.key);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    // Init obstacles
    stateRef.current.obstacles = [{ x: W + 100, h: 30 }, { x: W + 280, h: 45 }, { x: W + 460, h: 35 }];

    const loop = () => {
      const s = stateRef.current;
      s.t++;

      // Input
      const jump = keysRef.current.has(" ") || keysRef.current.has("ArrowUp") || keysRef.current.has("w");
      if (jump && s.grounded) { s.vy = -12; s.grounded = false; }

      // Physics
      s.vy += G;
      s.y += s.vy;
      if (s.y >= FLOOR) { s.y = FLOOR; s.vy = 0; s.grounded = true; }

      // Move obstacles
      s.obstacles.forEach(ob => {
        ob.x -= 3;
        if (ob.x < -30) { ob.x = W + 50 + Math.random() * 200; ob.h = 25 + Math.random() * 30; s.score++; }
      });

      // Draw
      ctx.clearRect(0, 0, W, H);

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#dbeafe");
      sky.addColorStop(1, "#eff6ff");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Clouds
      for (let i = 0; i < 3; i++) {
        const cx = ((s.t * 0.4 + i * 180) % (W + 80)) - 40;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.ellipse(cx, 30 + i * 15, 40, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 25, 25 + i * 15, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(0, FLOOR + 8, W, H - FLOOR - 8);
      ctx.fillStyle = "#86efac";
      ctx.fillRect(0, FLOOR + 6, W, 4);

      // Obstacles
      s.obstacles.forEach(ob => {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.roundRect(ob.x - 12, FLOOR + 8 - ob.h, 24, ob.h, 4);
        ctx.fill();
        ctx.fillStyle = "#fca5a5";
        ctx.fillRect(ob.x - 8, FLOOR + 9 - ob.h, 6, 6);
      });

      // Player (box character)
      const bobY = s.grounded ? Math.sin(s.t * 0.3) * 2 : 0;
      ctx.fillStyle = project.color || "#6366f1";
      ctx.beginPath();
      ctx.roundRect(s.x - 16, s.y - 32 + bobY, 32, 32, 6);
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#fff";
      ctx.fillRect(s.x - 9, s.y - 26 + bobY, 6, 8);
      ctx.fillRect(s.x + 3, s.y - 26 + bobY, 6, 8);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(s.x - 7, s.y - 24 + bobY, 4, 5);
      ctx.fillRect(s.x + 5, s.y - 24 + bobY, 4, 5);

      // Score
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 13px system-ui";
      ctx.fillText(`Score: ${s.score}`, 12, 22);

      ctx.font = "11px system-ui";
      ctx.fillStyle = "#64748b";
      ctx.fillText("SPACE / ↑ to jump", W - 120, 22);

      animRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [project.color]);

  return (
    <OutputShell label={`${project.name} — Game Preview`} icon="🎮" color="#8b5cf6" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f0f9ff" }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={compact ? 120 : 240}
          style={{ width: "100%", flex: 1, display: "block", cursor: "pointer" }}
          onClick={() => {
            const s = stateRef.current;
            if (s.grounded) { s.vy = -12; s.grounded = false; }
          }}
          tabIndex={0}
        />
        {!compact && (
          <div style={{ padding: "6px 12px", background: "#f8fafc", borderTop: "1px solid rgba(0,0,0,0.06)", fontSize: 11, color: "#64748b" }}>
            Click canvas or press <kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>SPACE</kbd> / <kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>↑</kbd> to jump · Avoid red obstacles
          </div>
        )}
      </div>
    </OutputShell>
  );
}

// ─── 3. App Output (Mobile App) ───────────────────────────────────────────────

function AppOutput({ project, compact }: RendererProps) {
  const [screen, setScreen] = useState(0);
  const screens = [
    { label: "Home", icon: "🏠", content: getFileContent(project, ["home", "dashboard", "screen"]) || `Welcome to ${project.name}\n\nYour AI-powered mobile experience starts here.` },
    { label: "Features", icon: "✨", content: getFileContent(project, ["feature", "function"]) || "Core Features\n\n• Smart notifications\n• Real-time sync\n• Offline mode\n• Dark / Light theme" },
    { label: "Profile", icon: "👤", content: getFileContent(project, ["profile", "user", "account"]) || "User Profile\n\nCustomize your experience and manage your account settings." },
  ];
  const cur = screens[screen];

  return (
    <OutputShell label={`${project.name} — App Preview`} icon="📱" color="#06b6d4" compact={compact}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)", padding: compact ? 6 : 16 }}>
        <div style={{
          width: compact ? 130 : 220,
          height: compact ? 176 : 380,
          background: "#1e293b",
          borderRadius: compact ? 16 : 28,
          padding: compact ? 3 : 5,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column",
        }}>
          {/* Status bar */}
          <div style={{ background: project.color || "#6366f1", borderRadius: compact ? 13 : 23, padding: compact ? "4px 8px" : "8px 14px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: compact ? 7 : 10, color: "#fff", fontWeight: 700 }}>{cur.icon} {cur.label}</span>
            <span style={{ fontSize: compact ? 7 : 9, color: "rgba(255,255,255,0.7)" }}>9:41</span>
          </div>
          {/* Screen */}
          <div style={{ flex: 1, background: "#fff", margin: compact ? "3px 0" : "4px 0", borderRadius: 8, padding: compact ? "6px 7px" : "12px 10px", overflow: "hidden" }}>
            <div style={{ fontSize: compact ? 7 : 10, color: "#1e293b", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {cur.content.slice(0, compact ? 120 : 300)}
            </div>
          </div>
          {/* Tab bar */}
          <div style={{ display: "flex", background: "#f8fafc", borderRadius: compact ? 0 : "0 0 20px 20px", padding: compact ? 3 : 6, gap: 2 }}>
            {screens.map((s, i) => (
              <button key={i} onClick={() => setScreen(i)} style={{
                flex: 1, background: screen === i ? (project.color || "#6366f1") : "transparent",
                border: "none", cursor: "pointer", borderRadius: 6, padding: compact ? "2px 0" : "4px 0",
                fontSize: compact ? 10 : 14, color: screen === i ? "#fff" : "#94a3b8",
              }}>{s.icon}</button>
            ))}
          </div>
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 4. Website Output (Web App / SaaS) ───────────────────────────────────────

function WebOutput({ project, compact }: RendererProps) {
  const [scrollY, setScrollY] = useState(0);
  const content = getFileContent(project, ["landing", "homepage", "about", "readme"]) || "";

  const heroText = content.split("\n").find(l => l.trim().length > 20) || `The future of ${project.name} starts here`;

  return (
    <OutputShell label={`${project.name} — Website Preview`} icon="🌐" color="#10b981" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Browser chrome */}
        <div style={{ background: "#f1f5f9", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["#f87171","#fbbf24","#4ade80"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 10, color: "#64748b", border: "1px solid rgba(0,0,0,0.08)" }}>
            https://{project.name.toLowerCase().replace(/\s+/g,"-")}.app
          </div>
        </div>
        {/* Page content */}
        <div
          style={{ flex: 1, overflowY: "auto", background: "#fff" }}
          onScroll={e => setScrollY((e.currentTarget as HTMLDivElement).scrollTop)}
        >
          {/* Nav */}
          <div style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: project.color || "#6366f1" }}>{project.icon} {project.name}</span>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#64748b" }}>
              {["Features","Pricing","About","Login"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}
            </div>
          </div>
          {/* Hero */}
          <div style={{ padding: compact ? "20px 20px" : "48px 24px", textAlign: "center", background: `linear-gradient(135deg, ${project.color || "#6366f1"}08, transparent)` }}>
            <div style={{ fontSize: compact ? 16 : 26, fontWeight: 800, color: "#0f172a", marginBottom: 10, lineHeight: 1.2, maxWidth: 480, margin: "0 auto 12px" }}>
              {heroText}
            </div>
            <p style={{ fontSize: compact ? 10 : 13, color: "#64748b", maxWidth: 380, margin: "0 auto 16px", lineHeight: 1.6 }}>
              {content.split("\n").filter(l => l.trim().length > 30 && !l.startsWith("#")).slice(0, 2).join(" ") || `Build, launch, and scale ${project.name} with AI at the core of every decision.`}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button style={{ padding: "8px 18px", borderRadius: 8, background: project.color || "#6366f1", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Get Started →</button>
              <button style={{ padding: "8px 18px", borderRadius: 8, background: "transparent", color: "#64748b", border: "1px solid rgba(0,0,0,0.12)", fontSize: 12, cursor: "pointer" }}>Watch Demo</button>
            </div>
          </div>
          {!compact && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "24px 20px" }}>
              {["⚡ Fast","🔒 Secure","🌍 Global"].map((f, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)", textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{f.split(" ")[0]}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a", marginBottom: 4 }}>{f.split(" ")[1]}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Enterprise-grade infrastructure for {project.name}.</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 5. Book Output ───────────────────────────────────────────────────────────

function BookOutput({ project, compact }: RendererProps) {
  const [page, setPage] = useState(0);
  const content = getFileContent(project, ["chapter", "outline", "manuscript", "synopsis"]);
  const paras = content.split("\n\n").filter(p => p.trim().length > 20);
  const totalPages = Math.max(paras.length, 3);

  return (
    <OutputShell label={`${project.name} — Reader`} icon="📖" color="#f59e0b" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fffbf0" }}>
        <div style={{ flex: 1, display: "flex", padding: compact ? "8px 10px" : "20px 24px", gap: compact ? 8 : 16, overflow: "hidden" }}>
          {/* Left page */}
          <div style={{ flex: 1, background: "#fffef8", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, padding: compact ? "8px 10px" : "20px 18px", boxShadow: "2px 4px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ fontSize: compact ? 7 : 9, color: "#94a3b8", marginBottom: 8, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>{project.name}</div>
            <div style={{ fontSize: compact ? 8 : 13, color: "#1e293b", lineHeight: 1.7, fontFamily: "Georgia, serif" }}>
              {paras[page * 2] || `Chapter ${page + 1}\n\nThe story of ${project.name} begins here. Every great narrative starts with a single moment of clarity — and this is yours.`}
            </div>
          </div>
          {/* Right page */}
          {!compact && (
            <div style={{ flex: 1, background: "#fffef8", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, padding: "20px 18px", boxShadow: "-2px 4px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 8, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>Page {page * 2 + 2}</div>
              <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.7, fontFamily: "Georgia, serif" }}>
                {paras[page * 2 + 1] || "Continued…\n\nEvery scene, every character, every plot beat has been crafted with purpose. The world breathes with authentic detail."}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "8px 12px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#faf7ee" }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: "4px 12px", cursor: page === 0 ? "not-allowed" : "pointer", fontSize: 12, color: "#64748b", opacity: page === 0 ? 0.4 : 1 }}>◀ Prev</button>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>Page {page * 2 + 1} of {totalPages * 2}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: "4px 12px", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", fontSize: 12, color: "#64748b", opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Next ▶</button>
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 6. Music Output ──────────────────────────────────────────────────────────

function MusicOutput({ project, compact }: RendererProps) {
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(0);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tickRef = useRef(0);

  const trackList = getFileContent(project, ["tracklist", "track", "album"])
    .split("\n").filter(l => l.trim().length > 2).slice(0, 6)
    .map((l, i) => l.trim() || `Track ${i + 1}`);

  const tracks = trackList.length > 0 ? trackList : [
    "01. Opening Theme", "02. Rising Action", "03. The Bridge", "04. Climax", "05. Resolution", "06. Outro"
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const bars = 48;

    const draw = () => {
      tickRef.current++;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);

      const barW = W / bars;
      for (let i = 0; i < bars; i++) {
        const t = tickRef.current;
        const active = playing ? 1 : 0.15;
        const h = active * (H * 0.15 + H * 0.6 * Math.abs(Math.sin(t * 0.08 + i * 0.4) * Math.cos(t * 0.05 + i * 0.2)));
        const hue = 240 + i * 3;
        const alpha = playing ? 0.85 : 0.25;
        ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
        ctx.fillRect(i * barW + 1, H - h, barW - 2, h);
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [playing]);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setProgress(p => { if (p >= 100) { setTrack(t => (t + 1) % tracks.length); return 0; } return p + 0.5; }), 150);
    return () => clearInterval(iv);
  }, [playing, tracks.length]);

  return (
    <OutputShell label={`${project.name} — Album`} icon="🎵" color="#ec4899" compact={compact}>
      <div style={{ display: "flex", height: "100%" }}>
        {/* Player */}
        <div style={{ flex: compact ? 1 : "0 0 60%", display: "flex", flexDirection: "column" }}>
          <canvas ref={canvasRef} width={400} height={compact ? 100 : 160} style={{ width: "100%", flexShrink: 0 }} />
          <div style={{ background: "#1e293b", padding: "8px 12px", flexShrink: 0 }}>
            <div style={{ textAlign: "center", fontSize: compact ? 11 : 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              {tracks[track]?.slice(0, 30) || "Track 1"}
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 2, marginBottom: 8 }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#ec4899", borderRadius: 2 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
              <button onClick={() => setTrack(t => (t - 1 + tracks.length) % tracks.length)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 16, cursor: "pointer" }}>⏮</button>
              <button onClick={() => setPlaying(p => !p)} style={{ background: "#ec4899", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", fontSize: 14, cursor: "pointer" }}>
                {playing ? "⏸" : "▶"}
              </button>
              <button onClick={() => setTrack(t => (t + 1) % tracks.length)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 16, cursor: "pointer" }}>⏭</button>
            </div>
          </div>
        </div>
        {/* Track list */}
        {!compact && (
          <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", borderLeft: "1px solid rgba(0,0,0,0.06)", padding: "8px 0" }}>
            {tracks.map((t, i) => (
              <button key={i} onClick={() => { setTrack(i); setProgress(0); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", background: track === i ? "rgba(236,72,153,0.08)" : "transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                borderLeft: track === i ? "3px solid #ec4899" : "3px solid transparent",
              }}>
                <span style={{ fontSize: 10, color: "#94a3b8", width: 18, textAlign: "right" }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: track === i ? "#ec4899" : "#1e293b", fontWeight: track === i ? 600 : 400 }}>{t.slice(0, 28)}</span>
                {track === i && playing && <span style={{ marginLeft: "auto", fontSize: 10, color: "#ec4899" }}>▶ PLAYING</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </OutputShell>
  );
}

// ─── 7. Podcast Output ────────────────────────────────────────────────────────

function PodcastOutput({ project, compact }: RendererProps) {
  const [playing, setPlaying] = useState(false);
  const [ep, setEp] = useState(0);
  const [progress, setProgress] = useState(0);

  const notes = getFileContent(project, ["episode", "show notes", "outline"]);
  const episodes = [
    { title: `EP 01: Introducing ${project.name}`, dur: "42:18", desc: notes.split("\n").filter(l => l.trim().length > 10)[0] || "The first episode dives into the origin story and why this project exists." },
    { title: "EP 02: Deep Dive", dur: "58:44", desc: "Going deeper on the core concepts and real-world applications." },
    { title: "EP 03: Interview Edition", dur: "51:09", desc: "Conversations with industry leaders and practitioners." },
  ];

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setProgress(p => Math.min(p + 0.3, 100)), 200);
    return () => clearInterval(iv);
  }, [playing]);

  return (
    <OutputShell label={`${project.name} Podcast`} icon="🎙️" color="#8b5cf6" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" }}>
        {/* Now playing */}
        <div style={{ padding: compact ? "10px 12px" : "18px 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 12 }}>
            <div style={{ width: compact ? 44 : 64, height: compact ? 44 : 64, borderRadius: 10, background: `linear-gradient(135deg, ${project.color || "#8b5cf6"}, #6d28d9)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: compact ? 18 : 28, flexShrink: 0 }}>🎙️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: compact ? 10 : 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{episodes[ep].title}</div>
              <div style={{ fontSize: compact ? 8 : 10, color: "rgba(255,255,255,0.5)" }}>Duration: {episodes[ep].dur}</div>
            </div>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 2, margin: "10px 0 8px" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#a78bfa", borderRadius: 2, transition: "width 0.2s" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <button onClick={() => setEp(e => (e - 1 + episodes.length) % episodes.length)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 16, cursor: "pointer" }}>⏮</button>
            <button onClick={() => setPlaying(p => !p)} style={{ background: "#a78bfa", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 16, cursor: "pointer" }}>
              {playing ? "⏸" : "▶"}
            </button>
            <button onClick={() => { setEp(e => (e + 1) % episodes.length); setProgress(0); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 16, cursor: "pointer" }}>⏭</button>
          </div>
        </div>
        {/* Episode list */}
        {!compact && (
          <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {episodes.map((e, i) => (
              <button key={i} onClick={() => { setEp(i); setProgress(0); }} style={{
                width: "100%", textAlign: "left", padding: "12px 16px",
                background: ep === i ? "rgba(167,139,250,0.15)" : "transparent",
                border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)",
                cursor: "pointer",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: ep === i ? "#a78bfa" : "#e2e8f0", marginBottom: 3 }}>{e.title}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{e.desc.slice(0, 60)}{e.desc.length > 60 ? "…" : ""}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </OutputShell>
  );
}

// ─── 8. Course Output ─────────────────────────────────────────────────────────

function CourseOutput({ project, compact }: RendererProps) {
  const [lesson, setLesson] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const content = getFileContent(project, ["module", "lesson", "curriculum", "outline"]);
  const rawLessons = content.split("\n").filter(l => l.trim().length > 5).slice(0, 6);
  const lessons = rawLessons.length > 0 ? rawLessons : [
    "Module 1: Foundations", "Module 2: Core Concepts", "Module 3: Practical Application",
    "Module 4: Advanced Topics", "Module 5: Case Studies", "Module 6: Final Project"
  ];

  return (
    <OutputShell label={`${project.name} — Course`} icon="🎓" color="#0ea5e9" compact={compact}>
      <div style={{ display: "flex", height: "100%" }}>
        {/* Lesson sidebar */}
        {!compact && (
          <div style={{ width: 180, flexShrink: 0, borderRight: "1px solid rgba(0,0,0,0.08)", background: "#f8fafc", overflowY: "auto", padding: "8px 0" }}>
            <div style={{ padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Curriculum · {completed.length}/{lessons.length}
            </div>
            {lessons.map((l, i) => (
              <button key={i} onClick={() => setLesson(i)} style={{
                width: "100%", textAlign: "left", padding: "8px 12px",
                background: lesson === i ? "rgba(14,165,233,0.08)" : "transparent",
                border: "none", cursor: "pointer",
                borderLeft: lesson === i ? "3px solid #0ea5e9" : "3px solid transparent",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 12, color: completed.includes(i) ? "#22c55e" : "#94a3b8" }}>
                  {completed.includes(i) ? "✓" : `${i + 1}.`}
                </span>
                <span style={{ fontSize: 11, color: lesson === i ? "#0ea5e9" : "#1e293b", lineHeight: 1.3 }}>{l.slice(0, 28)}{l.length > 28 ? "…" : ""}</span>
              </button>
            ))}
          </div>
        )}
        {/* Lesson content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: compact ? "10px 12px" : "20px 24px", overflowY: "auto" }}>
            <div style={{ fontSize: compact ? 10 : 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{lessons[lesson]}</div>
            <div style={{ fontSize: compact ? 9 : 13, color: "#64748b", lineHeight: 1.7, marginBottom: 16 }}>
              {content.split("\n\n")[lesson] || `This module covers the essential concepts and practical techniques for ${project.name}. You'll build hands-on skills through interactive exercises and real-world examples.`}
            </div>
            {!compact && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["📹 Video Lesson", "📝 Reading Material", "🧪 Practice Quiz", "💡 Discussion"].map(r => (
                  <div key={r} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12, color: "#64748b" }}>{r}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#f8fafc", display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => { if (!completed.includes(lesson)) setCompleted(c => [...c, lesson]); setLesson(l => Math.min(l + 1, lessons.length - 1)); }} style={{ flex: 1, padding: "8px 0", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {completed.includes(lesson) ? "Next →" : "Mark Complete ✓"}
            </button>
          </div>
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 9. Business / Startup Output ────────────────────────────────────────────

function BusinessOutput({ project, compact }: RendererProps) {
  const [slide, setSlide] = useState(0);
  const content = getFileContent(project, ["pitch", "deck", "one-pager", "overview", "vision"]);
  const lines = content.split("\n").filter(l => l.trim().length > 8);

  const slides = [
    { title: project.name, subtitle: lines[0] || "Building the future, one product at a time.", icon: project.icon, bg: project.color || "#6366f1" },
    { title: "The Problem", subtitle: lines[1] || "Existing solutions are fragmented, slow, and expensive.", icon: "🎯", bg: "#f59e0b" },
    { title: "Our Solution", subtitle: lines[2] || "An AI-native platform that automates 90% of the workflow.", icon: "✨", bg: "#10b981" },
    { title: "Market Size", subtitle: "$48B TAM growing at 34% CAGR. Land-and-expand GTM.", icon: "📊", bg: "#6366f1" },
    { title: "Traction", subtitle: "1,200 waitlist · 3 pilots · $180K pre-seed committed.", icon: "🚀", bg: "#8b5cf6" },
    { title: "The Ask", subtitle: "Raising $2M seed to hire 4 engineers and reach 1K paying customers.", icon: "💰", bg: "#ec4899" },
  ];

  const cur = slides[slide];

  return (
    <OutputShell label={`${project.name} — Pitch Deck`} icon="📊" color={project.color || "#6366f1"} compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Slide */}
        <div style={{ flex: 1, background: `linear-gradient(135deg, ${cur.bg}18, ${cur.bg}08)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: compact ? 16 : 32, textAlign: "center" }}>
          <div style={{ fontSize: compact ? 28 : 48, marginBottom: compact ? 8 : 16 }}>{cur.icon}</div>
          <div style={{ fontSize: compact ? 14 : 24, fontWeight: 800, color: "#0f172a", marginBottom: compact ? 6 : 12 }}>{cur.title}</div>
          <div style={{ fontSize: compact ? 10 : 14, color: "#64748b", maxWidth: 400, lineHeight: 1.6 }}>{cur.subtitle}</div>
        </div>
        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "8px 12px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#fafafa", flexShrink: 0 }}>
          <button onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "#64748b", opacity: slide === 0 ? 0.3 : 1 }}>◀</button>
          <div style={{ display: "flex", gap: 6 }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} style={{ width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", background: slide === i ? (cur.bg) : "#e2e8f0" }} />
            ))}
          </div>
          <button onClick={() => setSlide(s => Math.min(slides.length - 1, s + 1))} disabled={slide === slides.length - 1} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "#64748b", opacity: slide === slides.length - 1 ? 0.3 : 1 }}>▶</button>
          <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>{slide + 1} / {slides.length}</span>
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 10. Physical Product Output ─────────────────────────────────────────────

function ProductOutput({ project, compact }: RendererProps) {
  const [angle, setAngle] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);
  const [rotating, setRotating] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const draw = () => {
      if (rotating) angleRef.current += 0.015;
      const a = angleRef.current;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 60, 60 * Math.abs(Math.cos(a)) + 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Product box
      const color = project.color || "#6366f1";
      const w = 80, h = 90, d = 30;
      const cos = Math.cos(a), sin = Math.sin(a);
      const perspective = 0.3 + 0.2 * Math.abs(cos);

      // Front face
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 6);
      ctx.fill();

      // Top face (3D effect)
      ctx.fillStyle = `color-mix(in srgb, ${color} 60%, white)`;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, cy - h / 2);
      ctx.lineTo(cx - w / 2 + d * perspective, cy - h / 2 - d * perspective);
      ctx.lineTo(cx + w / 2 + d * perspective, cy - h / 2 - d * perspective);
      ctx.lineTo(cx + w / 2, cy - h / 2);
      ctx.fill();

      // Side face
      ctx.fillStyle = `color-mix(in srgb, ${color} 40%, #000)`;
      ctx.beginPath();
      ctx.moveTo(cx + w / 2, cy - h / 2);
      ctx.lineTo(cx + w / 2 + d * perspective, cy - h / 2 - d * perspective);
      ctx.lineTo(cx + w / 2 + d * perspective, cy + h / 2 - d * perspective);
      ctx.lineTo(cx + w / 2, cy + h / 2);
      ctx.fill();

      // Label
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${compact ? 11 : 13}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText(project.icon, cx, cy - 8);
      ctx.font = `${compact ? 7 : 9}px system-ui`;
      ctx.fillText(project.name.slice(0, 12), cx, cy + 12);
      ctx.textAlign = "left";

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [rotating, project.color, project.icon, project.name, compact]);

  const content = getFileContent(project, ["spec", "product", "overview"]);
  const specs = content.split("\n").filter(l => l.trim().length > 5).slice(0, 4);

  return (
    <OutputShell label={`${project.name} — Product`} icon="📦" color={project.color || "#6366f1"} compact={compact}>
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ flex: compact ? 1 : "0 0 55%", position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={280}
            height={compact ? 150 : 240}
            style={{ width: "100%", height: "100%", cursor: "pointer" }}
            onClick={() => setRotating(r => !r)}
          />
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#94a3b8" }}>
            {rotating ? "Click to pause" : "Click to rotate"}
          </div>
        </div>
        {!compact && (
          <div style={{ flex: 1, padding: "16px 14px", borderLeft: "1px solid rgba(0,0,0,0.07)", overflowY: "auto" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Product Specs</div>
            {(specs.length > 0 ? specs : ["Materials: Premium grade aluminum", "Dimensions: 15 × 10 × 5 cm", "Weight: 280g", "Certification: CE / FCC"]).map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, color: "#64748b", alignItems: "flex-start" }}>
                <span style={{ color: project.color || "#6366f1", fontWeight: 700, flexShrink: 0 }}>·</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </OutputShell>
  );
}

// ─── 11. Document / Brochure Output ──────────────────────────────────────────

function DocumentOutput({ project, compact }: RendererProps) {
  const content = getFileContent(project, ["document", "report", "brief", "proposal"]);
  const sections = content.split("\n\n").filter(p => p.trim().length > 10);

  return (
    <OutputShell label={`${project.name} — Document`} icon="📄" color="#0ea5e9" compact={compact}>
      <div style={{ height: "100%", overflowY: "auto", background: "#f1f5f9", padding: compact ? 8 : 16 }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: compact ? "14px 16px" : "32px 36px" }}>
          {/* Header */}
          <div style={{ borderBottom: `3px solid ${project.color || "#0ea5e9"}`, paddingBottom: 12, marginBottom: 20 }}>
            <div style={{ fontSize: compact ? 14 : 20, fontWeight: 800, color: "#0f172a" }}>{project.name}</div>
            <div style={{ fontSize: compact ? 9 : 11, color: "#94a3b8", marginTop: 4 }}>Generated Document · {new Date().toLocaleDateString()}</div>
          </div>
          {(sections.length > 0 ? sections : [
            "Executive Summary\n\nThis document outlines the key objectives, methodology, and expected outcomes for the project.",
            "Background & Context\n\nThe market landscape has shifted significantly, creating a unique opportunity for innovation and execution.",
            "Proposed Approach\n\nOur strategy centers on three pillars: speed, quality, and scalability — each reinforcing the others.",
          ]).slice(0, compact ? 2 : 6).map((s, i) => {
            const [title, ...body] = s.split("\n");
            return (
              <div key={i} style={{ marginBottom: compact ? 12 : 20 }}>
                <div style={{ fontSize: compact ? 10 : 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: compact ? 9 : 12, color: "#64748b", lineHeight: 1.7 }}>{body.join(" ")}</div>
              </div>
            );
          })}
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 12. Dashboard Output (generic / traditional industries) ─────────────────

function DashboardOutput({ project, compact }: RendererProps) {
  const metrics = [
    { label: "Progress", value: "68%", trend: "+12%", color: "#10b981" },
    { label: "Tasks Done", value: "24", trend: "+3 today", color: "#6366f1" },
    { label: "Files", value: String(project.files.length), trend: "all types", color: "#f59e0b" },
    { label: "Score", value: "A+", trend: "excellent", color: "#ec4899" },
  ];

  return (
    <OutputShell label={`${project.name} — Dashboard`} icon={project.icon} color={project.color || "#6366f1"} compact={compact}>
      <div style={{ height: "100%", overflowY: "auto", padding: compact ? 10 : 20, background: "#f8fafc" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: compact ? 8 : 12, marginBottom: compact ? 8 : 16 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: "#fff", borderRadius: 10, padding: compact ? "10px 12px" : "14px 16px", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: compact ? 9 : 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: compact ? 18 : 24, fontWeight: 800, color: m.color, marginBottom: 2 }}>{m.value}</div>
              <div style={{ fontSize: compact ? 8 : 10, color: "#64748b" }}>{m.trend}</div>
            </div>
          ))}
        </div>
        {!compact && (
          <div style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>Project Files ({project.files.length})</div>
            {project.files.slice(0, 5).map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize: 14 }}>{f.type === "document" ? "📄" : f.type === "image" ? "🖼️" : "📁"}</span>
                <span style={{ fontSize: 12, color: "#1e293b", flex: 1 }}>{f.name}</span>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{f.type}</span>
              </div>
            ))}
            {project.files.length === 0 && (
              <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>No files yet — scaffold will populate these</div>
            )}
          </div>
        )}
      </div>
    </OutputShell>
  );
}

// ─── Renderer Registry (extensible) ──────────────────────────────────────────

const OUTPUT_RENDERERS: Record<OutputType, React.ComponentType<RendererProps>> = {
  video:     VideoOutput,
  game:      GameOutput,
  app:       AppOutput,
  website:   WebOutput,
  book:      BookOutput,
  music:     MusicOutput,
  podcast:   PodcastOutput,
  course:    CourseOutput,
  business:  BusinessOutput,
  startup:   BusinessOutput,
  product:   ProductOutput,
  document:  DocumentOutput,
  dashboard: DashboardOutput,
};

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ProjectOutputLayer({ project, compact = false }: ProjectOutputLayerProps) {
  const outputType = detectOutputType(project.industry);
  const Renderer = OUTPUT_RENDERERS[outputType] ?? DashboardOutput;
  return <Renderer project={project} compact={compact} />;
}
