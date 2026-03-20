import React from "react";

export const SectionHeader = ({ title }: { title: string }) => (
  <h2 style={{ marginTop: "30px", marginBottom: "10px", fontSize: "20px", fontWeight: 600, color: "#111" }}>
    {title}
  </h2>
);

export const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "15px", marginBottom: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
    {children}
  </div>
);
export const CardHeader = ({ title }: { title: string }) => (
  <h3 style={{ marginBottom: "10px", fontSize: "16px", fontWeight: 500 }}>{title}</h3>
);
export const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: "14px", color: "#333" }}>{children}</div>
);

export const Table = ({ children }: { children: React.ReactNode }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff", borderRadius: "8px", overflow: "hidden" }}>{children}</table>
);
export const TableHead = ({ children }: { children: React.ReactNode }) => (
  <thead style={{ backgroundColor: "#f0f0f5" }}>{children}</thead>
);
export const TableRow = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <tr style={{ borderBottom: "1px solid #e0e0e0", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>{children}</tr>
);
export const TableCell = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{ padding: "10px", fontSize: "14px", color: "#111", ...style }}>{children}</td>
);

import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

export const PieChart = ({
  data, valueKey, labelKey, colors, height,
}: { data: Record<string, unknown>[]; valueKey: string; labelKey: string; colors: string[]; height: number }) => (
  <ResponsiveContainer width="100%" height={height}>
    <RePieChart>
      <Pie data={data} dataKey={valueKey} nameKey={labelKey} outerRadius={height / 2 - 10} label>
        {data.map((_entry, idx) => <Cell key={idx} fill={colors[idx % colors.length]} />)}
      </Pie>
      <Tooltip />
    </RePieChart>
  </ResponsiveContainer>
);

export const BarChart = ({
  data, xKey, yKey, height, colorScheme,
}: { data: Record<string, unknown>[]; xKey: string; yKey: string; height: number; colorScheme: string[] }) => (
  <ResponsiveContainer width="100%" height={height}>
    <ReBarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Legend />
      <Bar dataKey={yKey} fill={colorScheme[0]} />
    </ReBarChart>
  </ResponsiveContainer>
);

export const AuditLog = ({
  logs, maxEntries,
}: { logs: { message: string; level: "OK" | "Warn" | "Blocked" }[]; maxEntries: number }) => (
  <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "10px", maxHeight: "200px", overflowY: "auto" }}>
    {logs.slice(0, maxEntries).map((log, idx) => (
      <div key={idx} style={{
        color: log.level === "OK" ? "#34c759" : log.level === "Warn" ? "#ffcc00" : "#ff3b30",
        fontSize: "13px", marginBottom: "5px",
      }}>
        [{log.level}] {log.message}
      </div>
    ))}
  </div>
);

export const SimulationInput = ({
  industries, onSimulate,
}: { industries: { name: string }[]; onSimulate: (scale: number) => void }) => {
  const [scale, setScale] = React.useState(1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
      <select onChange={e => setScale(Number(e.target.value))} style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ccc" }}>
        {[1, 2, 5, 10, 20].map(n => <option key={n} value={n}>{n}x scale</option>)}
      </select>
      <button onClick={() => onSimulate(scale)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: "#0a84ff", color: "#fff", cursor: "pointer" }}>
        Simulate
      </button>
    </div>
  );
};
