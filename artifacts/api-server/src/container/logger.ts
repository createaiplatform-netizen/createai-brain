// ═══════════════════════════════════════════════════════════════════════════
// REQUEST LOGGER — Context-aware logger for per-request tracing.
//
// Each request gets its own RequestLogger instance carrying requestId and
// optionally userId. Structured entries are written to stdout/stderr.
//
// Usage (inside a route, after scopeMiddleware):
//   req.__scope!.logger.info("project.created", { projectId: 42 });
//
// Zero external dependencies — plain Node.js console output only.
// ═══════════════════════════════════════════════════════════════════════════

export interface LogContext {
  requestId: string;
  userId?:   string;
}

type LogLevel = "info" | "warn" | "error";

export class RequestLogger {
  private readonly prefix: string;

  constructor(private readonly ctx: LogContext) {
    const uid = ctx.userId ? ` uid:${ctx.userId}` : "";
    this.prefix = `[${ctx.requestId.slice(0, 8)}${uid}]`;
  }

  private write(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
    const entry: Record<string, unknown> = {
      ts:        new Date().toISOString(),
      level,
      requestId: this.ctx.requestId,
      ...(this.ctx.userId ? { userId: this.ctx.userId } : {}),
      msg,
      ...meta,
    };
    const line = `${this.prefix} ${msg}${meta ? " " + JSON.stringify(meta) : ""}`;
    if      (level === "error") console.error(line, entry);
    else if (level === "warn")  console.warn (line, entry);
    else                        console.info (line, entry);
  }

  info (msg: string, meta?: Record<string, unknown>): void { this.write("info",  msg, meta); }
  warn (msg: string, meta?: Record<string, unknown>): void { this.write("warn",  msg, meta); }
  error(msg: string, meta?: Record<string, unknown>): void { this.write("error", msg, meta); }
}
