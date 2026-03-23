import { useLocation } from "wouter";

const SAGE   = "#9CAF88";
const SAGE_D = "#7a9068";
const MUTED  = "#6b7280";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4"
      style={{ background: "#fafafa" }}
    >
      <div className="text-center max-w-md">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-4xl mb-6"
          style={{ background: `${SAGE}15`, border: `1px solid ${SAGE}30` }}
        >
          🧭
        </div>

        <h1
          className="text-5xl font-bold mb-3"
          style={{ color: "#111", letterSpacing: "-0.03em" }}
        >
          404
        </h1>
        <h2 className="text-xl font-semibold mb-3" style={{ color: "#111" }}>
          Page not found
        </h2>
        <p className="text-sm mb-8" style={{ color: MUTED }}>
          This page doesn&apos;t exist or may have moved.
          Use the links below to find your way.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})`,
              color: "white",
            }}
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{
              background: "rgba(0,0,0,0.04)",
              color: "#374151",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            ← Go Back
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {[
            { label: "Platform",  path: "/semantic-store" },
            { label: "Pricing",   path: "/pricing"        },
            { label: "Privacy",   path: "/privacy"        },
            { label: "Terms",     path: "/terms"          },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="text-sm underline underline-offset-2 hover:opacity-70 transition-opacity"
              style={{ color: MUTED }}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs mt-10" style={{ color: "#d1d5db" }}>
          CreateAI Brain · Lakeside Trinity LLC · createai.digital
        </p>
      </div>
    </div>
  );
}
