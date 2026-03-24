// FILE: src/ui/Layout.tsx
import React from "react";

export const Layout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ fontFamily: "system-ui", padding: 16, background: "#050816", color: "#f9fafb", minHeight: "100vh" }}>
    <h1 style={{ fontSize: 24, marginBottom: 8 }}>{title}</h1>
    <div style={{ fontSize: 13, opacity: 0.8 }}>CreateAI · Family Universe · Reality Stack</div>
    <hr style={{ margin: "12px 0", borderColor: "#1f2937" }} />
    {children}
  </div>
);
