import React, { useEffect, useState } from "react";
import { useParams } from "wouter";

const SAGE       = "#7a9068";
const SAGE_DARK  = "#5a6d50";
const SAGE_LIGHT = "#f0f4ee";
const SAGE_MID   = "#9CAF88";

interface MessageData {
  name:      string;
  firstName: string;
  subject:   string;
  message:   string;
  createdAt: string;
}

function nl2jsx(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) =>
    line.trim() === ""
      ? <br key={i} />
      : <React.Fragment key={i}>{line}<br /></React.Fragment>,
  );
}

export default function MessagePage() {
  const params                    = useParams<{ token: string }>();
  const token                     = params.token ?? "";
  const [data,    setData]        = useState<MessageData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("No message token provided."); setLoading(false); return; }

    fetch(`/api/shareable-messages/${token}`)
      .then(r => {
        if (!r.ok) throw new Error("Message not found");
        return r.json() as Promise<MessageData & { ok: boolean }>;
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => {
        setError("This message link is invalid or has expired.");
        setLoading(false);
      });
  }, [token]);

  const dateStr = data?.createdAt
    ? new Date(data.createdAt).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "";

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={pageWrap}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 80 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: SAGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>💚</div>
          <div style={{ width: 28, height: 28, border: `3px solid ${SAGE}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, color: "#94a3b8" }}>Loading your message…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div style={pageWrap}>
        <div style={card}>
          <div style={{ textAlign: "center", padding: "40px 24px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💌</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>Message not found</h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: "0 0 24px" }}>
              {error ?? "This link may be invalid or has expired."}
            </p>
            <a href="/" style={ctaSecondary}>Visit CreateAI Brain →</a>
          </div>
        </div>
      </div>
    );
  }

  // ── Message ────────────────────────────────────────────────────────────────
  return (
    <div style={pageWrap}>
      <div style={card}>

        {/* ── Sage header ── */}
        <div style={{
          background: `linear-gradient(135deg, ${SAGE} 0%, ${SAGE_DARK} 100%)`,
          padding: "32px 32px 28px",
          borderRadius: "20px 20px 0 0",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Subtle circle decoration */}
          <div style={{
            position: "absolute", right: -24, top: -24,
            width: 120, height: 120, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }} />
          <div style={{
            position: "absolute", right: 20, bottom: -40,
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>💚</div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.10em", textTransform: "uppercase", margin: 0 }}>
                A personal message from Sara
              </p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "2px 0 0" }}>
                {dateStr}
              </p>
            </div>
          </div>

          <h1 style={{
            color: "#fff", fontSize: "clamp(22px,5vw,30px)", fontWeight: 900,
            letterSpacing: "-0.03em", lineHeight: 1.2, margin: 0,
          }}>
            {data.subject}
          </h1>
        </div>

        {/* ── Message body ── */}
        <div style={{ padding: "32px 32px 0" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
            paddingBottom: 20, borderBottom: `1px solid ${SAGE_LIGHT}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${SAGE_MID} 0%, ${SAGE} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>👤</div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                For {data.name}
              </p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>
                From Sara Stadler · Lakeside Trinity LLC
              </p>
            </div>
          </div>

          <div style={{
            fontSize: 16, lineHeight: 1.8, color: "#1e293b",
            fontFamily: "Georgia, 'Times New Roman', serif",
            padding: "4px 0 28px",
          }}>
            {nl2jsx(data.message)}
          </div>

          {/* Sage accent block */}
          <div style={{
            background: SAGE_LIGHT,
            borderLeft: `4px solid ${SAGE}`,
            borderRadius: "0 10px 10px 0",
            padding: "14px 18px",
            marginBottom: 28,
          }}>
            <p style={{ fontSize: 13, color: SAGE_DARK, fontWeight: 600, margin: 0 }}>
              💚 This is a permanent, personal message — it will always be here for you at this link.
            </p>
          </div>
        </div>

        {/* ── CTA buttons ── */}
        <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
          <a
            href="/family"
            style={ctaPrimary}
          >
            🏡 Enter the Family Portal
          </a>
          <a
            href="/"
            style={ctaSecondary}
          >
            🧠 View the CreateAI Brain Platform
          </a>
          <a
            href="/family-portal-intro"
            style={ctaTertiary}
          >
            ℹ️ Learn what this platform is about
          </a>
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: `1px solid ${SAGE_LIGHT}`,
          padding: "18px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
          borderRadius: "0 0 20px 20px",
          background: "#fafcfa",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: SAGE, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 14,
            }}>🧠</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", margin: 0 }}>CreateAI Brain</p>
              <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>by Lakeside Trinity LLC</p>
            </div>
          </div>
          <a href="https://createai.digital" style={{ fontSize: 11, color: SAGE, textDecoration: "none", fontWeight: 600 }}>
            createai.digital
          </a>
        </div>
      </div>

      {/* Stars / decorative background dots */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-card { animation: fadeUp 0.4s ease both; }
        @media (max-width: 540px) {
          .msg-card { border-radius: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f0f4ee 0%, #e8f0e4 50%, #f5f8f3 100%)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "40px 16px 80px",
};

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  width: "100%",
  maxWidth: 580,
  boxShadow: "0 24px 80px rgba(122,144,104,0.15), 0 4px 16px rgba(0,0,0,0.06)",
  overflow: "hidden",
};

const ctaPrimary: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  padding: "15px 24px",
  background: `linear-gradient(135deg, ${SAGE} 0%, ${SAGE_DARK} 100%)`,
  color: "#fff",
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 700,
  textDecoration: "none",
  letterSpacing: "-0.01em",
  boxShadow: "0 4px 16px rgba(122,144,104,0.35)",
};

const ctaSecondary: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  padding: "14px 24px",
  background: "#f8faf7",
  border: `1.5px solid ${SAGE_MID}`,
  color: SAGE_DARK,
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};

const ctaTertiary: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  padding: "12px 24px",
  color: "#94a3b8",
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
};
