import { useState, useEffect, useCallback } from "react";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

export interface EngineStat {
  engineId:       string;
  runCount:       number;
  successRate:    number;
  averageLatency: number;
}

interface RawStat {
  engineId:    string;
  successRate: number;
  totalRuns:   number;
  avgMs:       number;
}

export function useEngineStats(pollInterval = 30000) {
  const [stats,   setStats]   = useState<EngineStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/outcome/engine-stats`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const raw: RawStat[] = Array.isArray(data.stats) ? data.stats : [];
      setStats(raw.map(r => ({
        engineId:       r.engineId,
        runCount:       r.totalRuns,
        successRate:    r.successRate,
        averageLatency: r.avgMs,
      })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load engine stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    if (pollInterval > 0) {
      const id = setInterval(fetchStats, pollInterval);
      return () => clearInterval(id);
    }
  }, [fetchStats, pollInterval]);

  return { stats, loading, error, refresh: fetchStats };
}
