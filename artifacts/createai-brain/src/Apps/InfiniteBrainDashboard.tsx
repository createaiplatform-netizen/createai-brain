import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { BeyondInfinityConfig } from "@/config/BeyondInfinity";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleResult {
  score:            number;
  industry_average: number;
  overachievement:  number;
  label:            string;
  compliance:       string;
  apiProvider:      string;
  tasksRun:         string[];
  executedAt:       string;
}

interface TranscendReport {
  mode:          string;
  branding:      string;
  executedAt:    string;
  totalModules:  number;
  allPass:       boolean;
  modules:       Record<string, ModuleResult>;
  summary: {
    avgScore:           number;
    avgOverachievement: number;
    topModule:          string;
  };
}

// ─── Animations ───────────────────────────────────────────────────────────────

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`;

// ─── Styled components ────────────────────────────────────────────────────────

const Container = styled.div`
  font-family: 'Inter', sans-serif;
  background: #f8fafc;
  padding: 1.5rem;
  min-height: 100vh;
`;

const Header = styled.div`
  background: linear-gradient(90deg, #6366f1, #7c3aed);
  color: #fff;
  border-radius: 14px;
  padding: 1.1rem 1.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(99,102,241,0.25);
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HeaderTitle = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const HeaderSub = styled.span`
  font-size: 0.75rem;
  opacity: 0.8;
`;

const Badge = styled.span`
  background: rgba(255,255,255,0.18);
  color: #fff;
  padding: 0.3rem 0.85rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.8rem;
  border: 1px solid rgba(255,255,255,0.3);
  backdrop-filter: blur(4px);
`;

const RunButton = styled.button<{ $loading?: boolean }>`
  background: linear-gradient(90deg, #6366f1, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.8rem 1.6rem;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: ${({ $loading }) => $loading ? "not-allowed" : "pointer"};
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  opacity: ${({ $loading }) => $loading ? 0.75 : 1};
  box-shadow: 0 2px 12px rgba(99,102,241,0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99,102,241,0.4);
  }
  &:active:not(:disabled) { transform: translateY(0); }
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 1.5rem 0 0.75rem;
  letter-spacing: -0.01em;
`;

const SummaryBar = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  animation: ${fadeIn} 0.4s ease;
`;

const SummaryPill = styled.div<{ $accent?: string }>`
  background: #fff;
  border: 1px solid ${({ $accent }) => $accent ?? "#e2e8f0"};
  border-radius: 10px;
  padding: 0.55rem 1rem;
  font-size: 0.82rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);

  strong {
    color: ${({ $accent }) => $accent ?? "#1e293b"};
    font-weight: 700;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1rem;
  animation: ${fadeIn} 0.5s ease;
`;

const borderColor = ($status: "ok" | "warn" | "fail") => {
  if ($status === "ok")   return "#10b981";
  if ($status === "warn") return "#f59e0b";
  return "#ef4444";
};

const Card = styled.div<{ $status: "ok" | "warn" | "fail" }>`
  background: #fff;
  padding: 1rem 1.1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  border-left: 5px solid ${({ $status }) => borderColor($status)};
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CardName = styled.div`
  font-weight: 700;
  font-size: 0.9rem;
  color: #1e293b;
  text-transform: capitalize;
  margin-bottom: 4px;
`;

const CardRow = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  display: flex;
  justify-content: space-between;

  span { color: #1e293b; font-weight: 600; }
`;

const ScoreBar = styled.div<{ $pct: number; $color: string }>`
  height: 5px;
  border-radius: 3px;
  background: #e2e8f0;
  margin-top: 6px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    width: ${({ $pct }) => Math.min($pct, 100)}%;
    background: ${({ $color }) => $color};
    border-radius: 3px;
    transition: width 0.6s ease;
  }
`;

const AllPassBanner = styled.div`
  background: linear-gradient(90deg, #059669, #10b981);
  color: #fff;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1.5rem;
  animation: ${fadeIn} 0.4s ease;
  box-shadow: 0 4px 16px rgba(16,185,129,0.3);
`;

const LogPanel = styled.pre`
  background: #0f172a;
  color: #e2e8f0;
  padding: 1.1rem;
  border-radius: 10px;
  max-height: 400px;
  overflow-y: auto;
  font-size: 0.78rem;
  line-height: 1.6;
  margin-top: 0.5rem;
  animation: ${fadeIn} 0.5s ease;
  border: 1px solid #1e293b;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const InfiniteBrainDashboard: React.FC = () => {
  const [data,    setData]    = useState<TranscendReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const runTranscendAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brain/transcend-all");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: TranscendReport = await res.json();
      setData(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const cardStatus = (m: ModuleResult): "ok" | "warn" | "fail" =>
    m.overachievement >= 130 ? "ok" : m.overachievement >= 100 ? "warn" : "fail";

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <HeaderTitle>💠 Sara's Infinite Brain Dashboard</HeaderTitle>
          <HeaderSub>{BeyondInfinityConfig.behavior.branding}</HeaderSub>
        </HeaderLeft>
        <Badge>No Limits Mode</Badge>
      </Header>

      <RunButton $loading={loading} onClick={runTranscendAll} disabled={loading}>
        {loading ? <><Spinner /> Running Transcend All…</> : "💠 Transcend All / Absolute Infinity"}
      </RunButton>

      {error && (
        <div style={{ color: "#ef4444", marginBottom: "1rem", fontSize: "0.88rem" }}>
          ❌ {error}
        </div>
      )}

      {data && (
        <>
          <SummaryBar>
            <SummaryPill $accent="#6366f1">
              🧠 Avg Score <strong>{data.summary.avgScore}</strong>
            </SummaryPill>
            <SummaryPill $accent="#10b981">
              📈 Avg Overachievement <strong>{data.summary.avgOverachievement}%</strong>
            </SummaryPill>
            <SummaryPill $accent="#7c3aed">
              🏆 Top Module <strong style={{ textTransform: "capitalize" }}>{data.summary.topModule}</strong>
            </SummaryPill>
            <SummaryPill>
              🕐 <strong>{new Date(data.executedAt).toLocaleTimeString()}</strong>
            </SummaryPill>
          </SummaryBar>

          <SectionTitle>Modules</SectionTitle>
          <Grid>
            {Object.entries(data.modules).map(([key, val]) => {
              const status = cardStatus(val);
              const barColor = status === "ok" ? "#10b981" : status === "warn" ? "#f59e0b" : "#ef4444";
              return (
                <Card key={key} $status={status}>
                  <CardName>{val.label ?? key}</CardName>
                  <CardRow>Score <span>{val.score}</span></CardRow>
                  <CardRow>Industry Avg <span>{val.industry_average}</span></CardRow>
                  <CardRow>Overachievement <span>{val.overachievement.toFixed(1)}%</span></CardRow>
                  <CardRow>Compliance <span style={{ fontSize: "0.72rem" }}>{val.compliance}</span></CardRow>
                  <ScoreBar $pct={val.score} $color={barColor} />
                </Card>
              );
            })}
          </Grid>

          {data.allPass && (
            <AllPassBanner>
              💎 ABSOLUTE TRANSCENDENCE — All {data.totalModules} Modules Exceeded Industry Average
            </AllPassBanner>
          )}

          <SectionTitle>System Log</SectionTitle>
          <LogPanel>{JSON.stringify(data, null, 2)}</LogPanel>
        </>
      )}
    </Container>
  );
};
