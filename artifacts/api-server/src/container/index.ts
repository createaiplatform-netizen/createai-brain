// ═══════════════════════════════════════════════════════════════════════════
// SERVICE CONTAINER — Lightweight, lazy DI container.
//
// Design:
//   • Singleton registry — each token produces one instance, created lazily
//     on first container.get() call. Eager initialization is never forced.
//   • createRequestScope() — produces a per-request RequestScope with a
//     context-aware logger (requestId + userId). Scope delegates singleton
//     get() to the container — services themselves stay singletons.
//   • No reflection, no decorators, no external packages.
//   • bootstrapServices() (container/bootstrap.ts) registers all services
//     before app.listen — call it once at server startup.
//
// Import direction (no circular dependencies):
//   container/index.ts  → logger.ts, types.ts        (no services)
//   services/*Service   → @workspace/db, each other via constructor injection
//   container/bootstrap → container/index + service classes
//   memoryService.ts    → container/index + tokens    (shims only)
//   middlewares         → container/index + types
// ═══════════════════════════════════════════════════════════════════════════

import crypto              from "crypto";
import { RequestLogger }   from "./logger";
import type { RequestScope } from "./types";

// ─── ServiceContainer ─────────────────────────────────────────────────────────

class ServiceContainer {
  private readonly _factories  = new Map<symbol, () => unknown>();
  private readonly _singletons = new Map<symbol, unknown>();

  /**
   * register — bind a factory to a token.
   * The factory is called at most once (lazy, on first get()).
   * Throws if the same token is registered twice.
   */
  register<T>(token: symbol, factory: () => T): void {
    if (this._factories.has(token)) {
      throw new Error(
        `ServiceContainer: token already registered — ${String(token)}. ` +
        `Call bootstrapServices() exactly once.`
      );
    }
    this._factories.set(token, factory);
  }

  /**
   * get<T> — lazy singleton access.
   * Creates the instance on first call, caches it for all subsequent calls.
   * Throws if no factory is registered for the token.
   */
  get<T>(token: symbol): T {
    if (!this._singletons.has(token)) {
      const factory = this._factories.get(token);
      if (!factory) {
        throw new Error(
          `ServiceContainer: no factory registered for token ${String(token)}. ` +
          `Ensure bootstrapServices() was called before this get().`
        );
      }
      this._singletons.set(token, factory());
    }
    return this._singletons.get(token) as T;
  }

  /**
   * createRequestScope — produce a per-request scope.
   * Each call returns a fresh RequestScope with a unique logger context.
   * Singletons are shared — the scope's get() delegates here.
   *
   * @param requestId    Server-generated UUID for this HTTP request
   * @param userId       Authenticated user ID (undefined if unauthenticated)
   * @param executionId  Optional — propagated from "x-execution-id" header
   * @param startedAt    Optional — defaults to Date.now() at call time
   */
  createRequestScope(
    requestId:    string,
    userId?:      string,
    executionId?: string,
    startedAt?:   number,
  ): RequestScope {
    const logger = new RequestLogger({ requestId, userId });
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self   = this;
    const scope: RequestScope = {
      requestId,
      ...(userId      ? { userId }      : {}),
      ...(executionId ? { executionId } : {}),
      startedAt: startedAt ?? Date.now(),
      logger,
      get<T>(token: symbol): T { return self.get<T>(token); },
    };
    return scope;
  }
}

// Module-level singleton — the one container for the entire process lifetime.
export const container = new ServiceContainer();
export type { ServiceContainer };
