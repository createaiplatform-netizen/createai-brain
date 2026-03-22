// ─── FamilyInviteModal ────────────────────────────────────────────────────────
// Invite a new family member by email. Calls POST /api/family-invites.

import { useState } from "react";

const SAGE   = "#7a9068";
const TEXT   = "#1a1916";
const MUTED  = "#6b6660";
const BORDER = "rgba(122,144,104,0.15)";
const CREAM  = "#faf9f6";

interface Props {
  onClose: () => void;
}

export function FamilyInviteModal({ onClose }: Props) {
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState<"family_adult" | "family_child">("family_adult");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch("/api/family-invites", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("sent");
      setMessage(`Invitation sent to ${email.trim()}.`);
    } catch {
      setStatus("error");
      setMessage("Could not reach the server. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,25,22,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
        style={{ background: CREAM, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-black" style={{ color: TEXT }}>Invite a family member</h2>
            <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
              They'll receive a private invitation link by email.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${SAGE}12`, color: MUTED }}
          >
            ×
          </button>
        </div>

        {status === "sent" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="text-4xl">🌿</div>
            <p className="text-[15px] font-semibold" style={{ color: TEXT }}>{message}</p>
            <p className="text-[12px]" style={{ color: MUTED }}>
              They'll get an email with a link to join your family space.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl text-[13px] font-bold"
              style={{ background: SAGE, color: "white" }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: MUTED }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                style={{
                  background: "white",
                  border: `1.5px solid ${BORDER}`,
                  color: TEXT,
                }}
              />
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: MUTED }}>
                Their role in the family
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { value: "family_adult", label: "🌿 Adult"    },
                    { value: "family_child", label: "🌱 Young one" },
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                    style={{
                      background: role === opt.value ? SAGE : "white",
                      color:      role === opt.value ? "white" : MUTED,
                      border:     `1.5px solid ${role === opt.value ? SAGE : BORDER}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {status === "error" && (
              <p className="text-[12px] px-3 py-2 rounded-xl" style={{ background: "#fff0f0", color: "#c0392b" }}>
                {message}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full py-3 rounded-xl text-[14px] font-bold transition-all"
              style={{
                background: status === "sending" ? `${SAGE}80` : SAGE,
                color: "white",
              }}
            >
              {status === "sending" ? "Sending…" : "Send Invitation"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
