import { useState, useEffect, useRef } from "react";

const API = "/api/self-host";

interface HostStatus {
  engineActive: boolean; frontendBuilt: boolean; frontendServed: boolean;
  distExists: boolean; distSizeKb: number;
  lastBuildAt: string|null; lastBuildResult: string|null; lastBuildError: string|null;
  publishedAt: string|null; publishedVersion: string|null;
  watchdogCycles: number; watchdogLastAt: string|null;
  subsystems: { api: string; identity: string; payments: string; email: string };
  serverPort: number; npa: string; liveUrl: string;
}

interface NpaRoute { npa: string; url: string; type: string; zone: string; }
interface Zone { zone: string; prefix: string; type: string; example: string; }
interface UrlMap { routes: NpaRoute[]; zones: Zone[]; totalRoutes: number; }
interface Resolution { input: string; zone: string; path: string; type: string; url: string; absolute: string; valid: boolean; }
interface Proof { npa: string; platformName: string; legalEntity: string; ownerName: string; liveUrl: string; issuedAt: string; expiresAt: string; signature: string; algorithm: string; claimKey: string; claims: Record<string,unknown>; }

type Tab = "status" | "router" | "proof" | "publish";

const CARD = { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "18px 20px", marginBottom: 16 };
const BADGE = (active: boolean) => ({ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 700, background: active ? "#14532d" : "#1e293b", color: active ? "#4ade80" : "#475569" });
const TYPE_COLOR: Record<string,string> = { frontend: "#818cf8", api: "#34d399", public: "#60a5fa", "well-known": "#f59e0b", unknown: "#64748b" };

export default function SelfHostApp() {
  const [tab, setTab] = useState<Tab>("status");
  const [status, setStatus] = useState<HostStatus|null>(null);
  const [urlMap, setUrlMap] = useState<UrlMap|null>(null);
  const [proof, setProof]   = useState<Proof|null>(null);
  const [building, setBuilding] = useState(false);
  const [buildMsg, setBuildMsg] = useState("");
  const [resolveInput, setResolveInput] = useState("createai://app/home");
  const [resolution, setResolution] = useState<Resolution|null>(null);
  const [filterZone, setFilterZone] = useState("all");
  const pollerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  async function fetchStatus() {
    try { const r = await fetch(API + "/status"); setStatus(await r.json()); } catch {}
  }

  useEffect(() => {
    fetchStatus();
    pollerRef.current = setInterval(fetchStatus, 15000);
    return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
  }, []);

  useEffect(() => {
    if (tab === "router" && !urlMap) {
      fetch(API + "/url-map").then(r => r.json()).then(setUrlMap).catch(() => {});
    }
    if (tab === "proof" && !proof) {
      fetch(API + "/proof").then(r => r.json()).then(setProof).catch(() => {});
    }
  }, [tab, urlMap, proof]);

  async function handleBuild() {
    setBuilding(true); setBuildMsg("Build triggered — this takes ~30s…");
    try {
      const r = await fetch(API + "/build", { method: "POST" });
      const d = await r.json();
      setBuildMsg(d.message ?? "Build started");
      setTimeout(fetchStatus, 5000);
      setTimeout(fetchStatus, 15000);
      setTimeout(fetchStatus, 35000);
    } catch { setBuildMsg("Build request failed"); }
    finally { setBuilding(false); }
  }

  async function handleResolve() {
    try {
      const r = await fetch(API + "/resolve?npa=" + encodeURIComponent(resolveInput));
      setResolution(await r.json());
    } catch {}
  }

  async function handlePublish() {
    try {
      const r = await fetch(API + "/publish", { method: "POST" });
      const d = await r.json();
      setBuildMsg(d.ok ? ("Snapshot saved — version " + d.version) : (d.error ?? "Failed"));
      fetchStatus();
    } catch { setBuildMsg("Publish failed"); }
  }

  const filteredRoutes = urlMap?.routes.filter(r => filterZone === "all" || r.zone === filterZone) ?? [];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 800, color: "#e2e8f0", fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏠</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Internal Self-Host Engine</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              {status ? (status.liveUrl || "Resolving…") : "Loading…"}
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span style={BADGE(!!status?.engineActive)}>ENGINE {status?.engineActive ? "ACTIVE" : "STARTING"}</span>
            <span style={BADGE(!!status?.distExists)}>BUILD {status?.distExists ? "READY" : "NONE"}</span>
            <span style={BADGE(!!status?.frontendServed)}>SERVING {status?.frontendServed ? "YES" : "NO"}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {(["status", "router", "proof", "publish"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? "#312e81" : "#1e293b",
            color: tab === t ? "#a5b4fc" : "#64748b",
            border: "none", borderRadius: 6, padding: "7px 16px",
            cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 700 : 400,
            textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {/* ── STATUS TAB ─────────────────────────────────────────────────────── */}
      {tab === "status" && (
        <>
          {/* Subsystems */}
          <div style={{ ...CARD }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12, fontWeight: 600, letterSpacing: "0.08em" }}>SUBSYSTEMS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {status && Object.entries(status.subsystems).map(([k, v]) => (
                <div key={k} style={{ textAlign: "center", padding: "12px 8px", background: "#020617", borderRadius: 8 }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{k === "api" ? "⚡" : k === "identity" ? "🪪" : k === "payments" ? "💳" : "✉️"}</div>
                  <div style={{ color: v === "up" ? "#4ade80" : "#f87171", fontSize: 12, fontWeight: 700 }}>{v.toUpperCase()}</div>
                  <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{k}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div style={{ ...CARD }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12, fontWeight: 600, letterSpacing: "0.08em" }}>HOST METRICS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 13 }}>
              <Metric label="Server Port"   value={status ? String(status.serverPort) : "…"} />
              <Metric label="NPA Handle"    value={status?.npa ?? "…"} />
              <Metric label="Dist Size"     value={status ? (status.distSizeKb > 0 ? status.distSizeKb + " KB" : "Not built") : "…"} />
              <Metric label="Watchdog Cycles" value={status ? String(status.watchdogCycles) : "…"} />
              <Metric label="Last Build"    value={status?.lastBuildAt ? new Date(status.lastBuildAt).toLocaleTimeString() : "Never"} />
              <Metric label="Build Result"  value={status?.lastBuildResult ?? "None"} highlight={status?.lastBuildResult === "ok" ? "green" : status?.lastBuildResult === "error" ? "red" : undefined} />
            </div>
          </div>

          {/* Build error */}
          {status?.lastBuildError && (
            <div style={{ ...CARD, border: "1px solid #7f1d1d" }}>
              <div style={{ color: "#f87171", fontSize: 12, marginBottom: 6 }}>Last Build Error</div>
              <pre style={{ color: "#fca5a5", fontSize: 11, margin: 0, whiteSpace: "pre-wrap" }}>{status.lastBuildError}</pre>
            </div>
          )}

          {/* Actions */}
          <div style={{ ...CARD }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12, fontWeight: 600, letterSpacing: "0.08em" }}>ACTIONS</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <ActionBtn onClick={handleBuild} disabled={building} color="#312e81" text={building ? "Building…" : "Build Frontend"} sub="Compiles React → dist/" />
              <ActionBtn onClick={handlePublish} disabled={building} color="#14532d" text="Snapshot & Publish" sub="Saves portable build" />
            </div>
            {buildMsg && <div style={{ marginTop: 12, color: "#a5b4fc", fontSize: 12 }}>{buildMsg}</div>}
          </div>

          {/* How it works */}
          <div style={{ ...CARD }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10, fontWeight: 600, letterSpacing: "0.08em" }}>HOW SELF-HOSTING WORKS</div>
            {[
              ["Step 1 — Click Build Frontend", "Runs `pnpm run build` for the React app. Compiles all 12 tools, OS, and pages into a static dist/ folder inside the API server."],
              ["Step 2 — API server serves everything", "After build, a single Express process at port " + (status?.serverPort ?? "8080") + " serves both the API (/api/*) and the full frontend (/*). No Vite dev server needed."],
              ["Step 3 — One process, one port, one URL", "The platform is now fully self-contained. The API server IS the hosting server. Accessible at: " + (status?.liveUrl ?? "—")],
              ["Watchdog keeps it running", "A 60-second internal health loop monitors all subsystems and logs status. The process runs continuously via the Replit workflow."],
            ].map(([title, desc]) => (
              <div key={title} style={{ marginBottom: 12 }}>
                <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{title}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>{desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ROUTER TAB ─────────────────────────────────────────────────────── */}
      {tab === "router" && (
        <>
          {/* Resolver */}
          <div style={{ ...CARD }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10, fontWeight: 600, letterSpacing: "0.08em" }}>RESOLVE A createai:// ADDRESS</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                value={resolveInput}
                onChange={e => setResolveInput(e.target.value)}
                style={{ flex: 1, background: "#020617", border: "1px solid #1e293b", borderRadius: 6, padding: "8px 12px", color: "#e2e8f0", fontFamily: "monospace", fontSize: 13 }}
                placeholder="createai://app/home"
              />
              <button onClick={handleResolve} style={{ background: "#312e81", color: "#a5b4fc", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13 }}>
                Resolve
              </button>
            </div>
            {resolution && (
              <div style={{ background: "#020617", borderRadius: 8, padding: "12px 14px", fontSize: 12 }}>
                <ResRow label="Input"    value={resolution.input} />
                <ResRow label="Zone"     value={resolution.zone} />
                <ResRow label="Type"     value={resolution.type} color={TYPE_COLOR[resolution.type]} />
                <ResRow label="Path"     value={"/" + resolution.path} />
                <ResRow label="URL"      value={resolution.url} />
                <ResRow label="Absolute" value={resolution.absolute} />
                <ResRow label="Valid"    value={resolution.valid ? "✓ yes" : "✗ no"} color={resolution.valid ? "#4ade80" : "#f87171"} />
              </div>
            )}
          </div>

          {/* Zone filter + route table */}
          <div style={{ ...CARD }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}>
                URL MAP — {filteredRoutes.length} routes
              </div>
              <select value={filterZone} onChange={e => setFilterZone(e.target.value)} style={{ background: "#1e293b", border: "none", borderRadius: 6, color: "#94a3b8", padding: "4px 10px", fontSize: 12 }}>
                <option value="all">All zones</option>
                {urlMap?.zones.map(z => <option key={z.zone} value={z.zone}>{z.zone}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {filteredRoutes.map(route => (
                <div key={route.npa} style={{ display: "flex", gap: 12, padding: "8px 10px", background: "#020617", borderRadius: 6, fontSize: 12, alignItems: "center" }}>
                  <span style={{ color: "#818cf8", fontFamily: "monospace", minWidth: 240 }}>{route.npa}</span>
                  <span style={{ color: "#475569" }}>→</span>
                  <span style={{ color: "#94a3b8", fontFamily: "monospace", flex: 1 }}>{route.url}</span>
                  <span style={{ color: TYPE_COLOR[route.type] ?? "#64748b", fontSize: 10, fontWeight: 600, background: "#0f172a", padding: "1px 6px", borderRadius: 4 }}>{route.type}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── PROOF TAB ─────────────────────────────────────────────────────── */}
      {tab === "proof" && proof && (
        <>
          <div style={{ ...CARD }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12, fontWeight: 600, letterSpacing: "0.08em" }}>PLATFORM PROOF TOKEN (PPT)</div>
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 14 }}>
              An HMAC-SHA256 signed identity proof. Any system can verify this token proves the server is the canonical CreateAI Brain platform controlled by the owner.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
              <ResRow label="NPA"         value={proof.npa} />
              <ResRow label="Platform"    value={proof.platformName} />
              <ResRow label="Legal Entity" value={proof.legalEntity} />
              <ResRow label="Owner"       value={proof.ownerName} />
              <ResRow label="Algorithm"   value={proof.algorithm} />
              <ResRow label="Issued"      value={new Date(proof.issuedAt).toLocaleDateString()} />
              <ResRow label="Expires"     value={new Date(proof.expiresAt).toLocaleDateString()} />
              <ResRow label="Claim Key"   value={proof.claimKey} />
            </div>
          </div>

          <div style={{ ...CARD }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10, fontWeight: 600, letterSpacing: "0.08em" }}>SIGNATURE</div>
            <code style={{ color: "#4ade80", fontSize: 11, wordBreak: "break-all", fontFamily: "monospace" }}>{proof.signature}</code>
          </div>

          <div style={{ ...CARD }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10, fontWeight: 600, letterSpacing: "0.08em" }}>CLAIMS</div>
            {Object.entries(proof.claims).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: "#64748b" }}>{k}</span>
                <span style={{ color: typeof v === "boolean" ? (v ? "#4ade80" : "#f87171") : "#94a3b8" }}>{String(v)}</span>
              </div>
            ))}
          </div>

          <div style={{ ...CARD }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10, fontWeight: 600, letterSpacing: "0.08em" }}>WELL-KNOWN ENDPOINTS</div>
            {["/.well-known/platform-proof.json", "/.well-known/platform-id.json", "/.well-known/npa-resolve.json"].map(ep => (
              <div key={ep} style={{ marginBottom: 6 }}>
                <a href={ep} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", fontSize: 12, fontFamily: "monospace" }}>{ep}</a>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── PUBLISH TAB ───────────────────────────────────────────────────── */}
      {tab === "publish" && (
        <>
          <div style={{ ...CARD }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12, fontWeight: 600, letterSpacing: "0.08em" }}>INTERNAL PUBLISHING SYSTEM</div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
              The platform publishes itself in two steps: compile the React frontend into a static bundle, then serve it from the API server. No Replit deploy button, no Vercel, no Netlify required.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "🔨", title: "Step 1 — Build", desc: "Compiles the entire React app into static HTML/JS/CSS. Takes ~30 seconds. Result is stored in dist/.", action: "Build Frontend", onClick: handleBuild, disabled: building },
                { icon: "🚀", title: "Step 2 — Snapshot", desc: "Copies dist/ into a timestamped folder. Creates a publish-manifest.json with version, NPA, live URL.", action: "Snapshot & Publish", onClick: handlePublish, disabled: false },
              ].map(item => (
                <div key={item.title} style={{ display: "flex", gap: 16, padding: "14px 16px", background: "#020617", borderRadius: 8 }}>
                  <div style={{ fontSize: 24 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#e2e8f0", fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{item.title}</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 10 }}>{item.desc}</div>
                    <button onClick={item.onClick} disabled={item.disabled} style={{ background: "#312e81", color: "#a5b4fc", border: "none", borderRadius: 6, padding: "7px 16px", cursor: "pointer", fontSize: 12 }}>
                      {item.disabled ? "Working…" : item.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {buildMsg && <div style={{ marginTop: 14, color: "#a5b4fc", fontSize: 12 }}>{buildMsg}</div>}
          </div>

          {status?.publishedVersion && (
            <div style={{ ...CARD }}>
              <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10, fontWeight: 600, letterSpacing: "0.08em" }}>LATEST SNAPSHOT</div>
              <ResRow label="Version"     value={status.publishedVersion} />
              <ResRow label="Published"   value={status.publishedAt ? new Date(status.publishedAt).toLocaleString() : "—"} />
            </div>
          )}

          <div style={{ ...CARD, border: "1px solid #292524" }}>
            <div style={{ color: "#fbbf24", fontSize: 12, marginBottom: 10, fontWeight: 600, letterSpacing: "0.08em" }}>LIMITATIONS</div>
            {[
              "The platform still runs on Replit's compute — it cannot escape the underlying host machine",
              "The Replit dev URL changes between sessions. Use the published .replit.app URL for stability",
              "The dist/ build must be re-run after code changes to update the self-hosted version",
              "Google Search Console and Stripe still require a real publicly-accessible URL for activation",
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: "#f59e0b" }}>⚠</span>
                <span style={{ color: "#94a3b8" }}>{l}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: "green"|"red" }) {
  const color = highlight === "green" ? "#4ade80" : highlight === "red" ? "#f87171" : "#e2e8f0";
  return (
    <div style={{ background: "#020617", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ color: "#475569", fontSize: 11, marginBottom: 3 }}>{label}</div>
      <div style={{ color, fontSize: 13, fontFamily: "monospace" }}>{value}</div>
    </div>
  );
}

function ActionBtn({ onClick, disabled, color, text, sub }: { onClick: ()=>void; disabled: boolean; color: string; text: string; sub: string }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: color, border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", opacity: disabled ? 0.6 : 1, textAlign: "left" }}>
      <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{text}</div>
      <div style={{ color: "#94a3b8", fontSize: 11 }}>{sub}</div>
    </button>
  );
}

function ResRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
      <span style={{ color: "#475569" }}>{label}</span>
      <span style={{ color: color ?? "#94a3b8", fontFamily: "monospace", maxWidth: 360, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}
