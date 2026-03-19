// ═══════════════════════════════════════════════════════════════════════════
// EXECUTION STORE — In-memory FIFO bounded store for execution records.
//
// Design:
//   • Strict FIFO eviction at MAX_RECORDS (1 000) — oldest record ejected
//     the moment cap is reached, before the new record is inserted.
//   • O(1) lookup by executionId via Map.
//   • list() returns newest-first (most recent at index 0).
//   • save() on an existing executionId performs an in-place update
//     without disturbing the FIFO queue (use for status mutations).
//   • No database — pure in-process, cleared on restart.
//
// No container import — this class is a pure dependency, not a resolver.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Execution record ─────────────────────────────────────────────────────────

export interface ExecutionRecord {
  executionId:      string;
  requestId:        string;
  userId?:          string;

  engineId:         string;
  trace:            string[];       // engineId sequence representing the call chain

  depth:            number;
  tokenUsage:       number;

  startedAt:        number;         // unix ms
  endedAt:          number;         // unix ms
  durationMs:       number;

  status:           "success" | "error" | "blocked";
  errorCode?:       string;

  costEstimate?:    number;         // USD
  efficiencyScore?: number;         // 0–1 (higher = more efficient)
  riskScore?:       number;         // 0–1 (higher = more anomalous)
}

// ─── ExecutionStore ───────────────────────────────────────────────────────────

export class ExecutionStore {
  private static readonly MAX_RECORDS = 1_000;

  /** Primary lookup index — executionId → record */
  private readonly _index = new Map<string, ExecutionRecord>();

  /** FIFO insertion order queue — oldest executionId at index 0 */
  private readonly _queue: string[] = [];

  /**
   * save — persist an execution record.
   *
   * If the executionId already exists (e.g. a partial record was saved on
   * start and is now being completed), the existing entry is updated in-place
   * with no FIFO disruption.
   *
   * If the record is new and the store is at capacity, the oldest entry is
   * evicted before insertion (strict bounded FIFO).
   */
  save(record: ExecutionRecord): void {
    if (this._index.has(record.executionId)) {
      // In-place update — FIFO order preserved
      this._index.set(record.executionId, record);
      return;
    }

    // Evict oldest if at cap
    if (this._queue.length >= ExecutionStore.MAX_RECORDS) {
      const evicted = this._queue.shift();
      if (evicted) this._index.delete(evicted);
    }

    this._index.set(record.executionId, record);
    this._queue.push(record.executionId);
  }

  /**
   * list — return all records newest-first.
   * Safe to call at any time — returns a snapshot array (no live references).
   */
  list(): ExecutionRecord[] {
    const result: ExecutionRecord[] = [];
    for (let i = this._queue.length - 1; i >= 0; i--) {
      const r = this._index.get(this._queue[i]);
      if (r) result.push(r);
    }
    return result;
  }

  /** getByExecutionId — O(1) lookup. Returns undefined if not found. */
  getByExecutionId(id: string): ExecutionRecord | undefined {
    return this._index.get(id);
  }

  /** size — number of records currently stored. */
  size(): number {
    return this._index.size;
  }
}
