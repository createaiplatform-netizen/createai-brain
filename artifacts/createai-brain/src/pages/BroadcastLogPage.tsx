import React from "react";

const EXAMPLE_BROADCASTS = [
  { id: 1, timestamp: "2026-03-24T07:00:00Z", title: "New universe layer added",           body: "The Ceiling layer has been wired across all 7 domains.",              status: "sent" },
  { id: 2, timestamp: "2026-03-24T06:45:00Z", title: "Family mode updated",                body: "Family Universe, Kids Universe, and First World configs refreshed.",  status: "sent" },
  { id: 3, timestamp: "2026-03-24T06:30:00Z", title: "All Systems Explorer live",          body: "25 connected endpoints now visible in the unified explorer.",          status: "sent" },
  { id: 4, timestamp: "2026-03-24T06:15:00Z", title: "Reality Explorer connected",         body: "5 reality layer files — absolute, activation, orchestrator, stack, index.", status: "sent" },
  { id: 5, timestamp: "2026-03-24T06:00:00Z", title: "Self Explorer connected",            body: "Ineffable, self-generating, and transcendental layers now exposed.",   status: "sent" },
  { id: 6, timestamp: "2026-03-24T05:45:00Z", title: "Continuum Dashboard live",          body: "Continuum, registry, relations, channels, and inspector all wired.",   status: "sent" },
  { id: 7, timestamp: "2026-03-24T05:30:00Z", title: "22 universe files connected",       body: "All previously orphaned data files now have API endpoints and UI.",    status: "sent" },
  { id: 8, timestamp: "2026-03-24T05:15:00Z", title: "Public Explorer activated",         body: "/public-explorer is now reachable without authentication.",            status: "sent" },
  { id: 9, timestamp: "2026-03-24T05:00:00Z", title: "Backend verification complete",     body: "25/25 endpoints return HTTP 200. Zero failures.",                      status: "sent" },
  { id: 10, timestamp: "2026-03-24T04:45:00Z", title: "System fully connected",           body: "No unconnected files remain. All layers wired end-to-end.",            status: "sent" },
];

function formatTime(iso: string) {
  return iso.replace("T", " ").replace("Z", " UTC");
}

export default function BroadcastLogPage() {
  return (
    <div style={{ background: "#0A0F1F", minHeight: "100vh", color: "#F5F3EE", fontFamily: "monospace", padding: "2rem" }}>
      <h1 style={{ color: "#E8C77A", fontSize: "1.3rem", margin: "0 0 0.25rem" }}>Broadcast Log</h1>
      <p style={{ color: "#5a7a5a", fontSize: "0.8rem", margin: "0 0 0.5rem" }}>
        Internal only &mdash; UI simulation &mdash; no external sending
      </p>
      <p style={{ color: "#3a4a3a", fontSize: "0.72rem", margin: "0 0 2rem", borderLeft: "2px solid #1e2e1e", paddingLeft: "0.75rem" }}>
        No email, SMS, webhooks, or push notifications are sent. This log is display-only.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {EXAMPLE_BROADCASTS.map(b => (
          <div
            key={b.id}
            style={{
              background: "#0d1520",
              border: "1px solid #1e2e1e",
              borderRadius: "6px",
              padding: "1rem 1.25rem",
              display: "flex",
              gap: "1.25rem",
              alignItems: "flex-start",
            }}
          >
            <div style={{ minWidth: "190px", color: "#3a5a3a", fontSize: "0.68rem", paddingTop: "2px" }}>
              {formatTime(b.timestamp)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#9CAF88", fontSize: "0.82rem", fontWeight: "bold", marginBottom: "3px" }}>{b.title}</div>
              <div style={{ color: "#6a8a6a", fontSize: "0.74rem" }}>{b.body}</div>
            </div>
            <div style={{
              background: "#1a3a1a",
              color: "#9CAF88",
              fontSize: "0.65rem",
              padding: "2px 7px",
              borderRadius: "3px",
              whiteSpace: "nowrap",
              alignSelf: "center",
            }}>
              {b.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
