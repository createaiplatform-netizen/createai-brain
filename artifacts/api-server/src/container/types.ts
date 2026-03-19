// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER TYPES — Interfaces for request-scoped DI context.
//
// RequestScope is created per HTTP request by ServiceContainer.createRequestScope()
// and attached to req.__scope by scopeMiddleware. It provides:
//   • requestId / userId — for tracing and logging
//   • logger            — context-aware RequestLogger instance
//   • get<T>(token)     — lazy access to any container-registered singleton
// ═══════════════════════════════════════════════════════════════════════════

import type { RequestLogger } from "./logger";

export interface RequestScope {
  readonly requestId: string;
  readonly userId?:   string;
  readonly logger:    RequestLogger;
  get<T>(token: symbol): T;
}
