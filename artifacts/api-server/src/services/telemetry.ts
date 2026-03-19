// ─────────────────────────────────────────────────────────────────────────────
// Telemetry — in-process AI stream tracking (no Redis required)
// Tracks active SSE streams, peak concurrency, and average duration.
// Module-scoped; clears on server restart. Thread-safe for single-process Node.
// ─────────────────────────────────────────────────────────────────────────────

export interface StreamEntry {
  streamId:  string;
  projectId: string;
  userId:    string;
  startedAt: number;
}

interface CompletedEntry {
  durationMs:  number;
  completedAt: number;
}

const _active    = new Map<string, StreamEntry>();
const _completed: CompletedEntry[] = [];

const MAX_COMPLETED  = 300;
let   _peakConcurrency = 0;
let   _totalStarted    = 0;

export function streamStart(streamId: string, projectId: string, userId: string): void {
  _active.set(streamId, { streamId, projectId, userId, startedAt: Date.now() });
  _totalStarted++;
  if (_active.size > _peakConcurrency) _peakConcurrency = _active.size;
}

export function streamEnd(streamId: string): void {
  const entry = _active.get(streamId);
  if (!entry) return;
  const durationMs = Date.now() - entry.startedAt;
  _active.delete(streamId);
  _completed.push({ durationMs, completedAt: Date.now() });
  if (_completed.length > MAX_COMPLETED) _completed.shift();
}

export function getStreamStats() {
  const now        = Date.now();
  const activeList = [..._active.values()].map(e => ({
    streamId:   e.streamId,
    projectId:  e.projectId,
    userId:     e.userId,
    durationMs: now - e.startedAt,
  }));

  const avgDuration =
    _completed.length > 0
      ? Math.round(_completed.reduce((s, e) => s + e.durationMs, 0) / _completed.length)
      : 0;

  const recentCompleted = _completed
    .slice(-10)
    .reverse()
    .map(e => ({
      durationMs:  e.durationMs,
      completedAt: new Date(e.completedAt).toISOString(),
    }));

  return {
    activeCount:      _active.size,
    peakConcurrency:  _peakConcurrency,
    totalStarted:     _totalStarted,
    completedCount:   _completed.length,
    avgDurationMs:    avgDuration,
    activeStreams:     activeList,
    recentCompleted,
    timestamp:        new Date().toISOString(),
  };
}
