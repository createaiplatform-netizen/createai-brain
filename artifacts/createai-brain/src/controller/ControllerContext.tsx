// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLER CONTEXT — React context that exposes PlatformController to every
// app, engine, and module in the entire platform. One provider wraps all.
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useRef } from "react";
import { PlatformController } from "./PlatformController";

// ─── Context ──────────────────────────────────────────────────────────────────

interface PlatformContextValue {
  controller: PlatformController;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const controllerRef = useRef<PlatformController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new PlatformController();
  }

  return (
    <PlatformContext.Provider value={{ controller: controllerRef.current }}>
      {children}
    </PlatformContext.Provider>
  );
}

// ─── Internal accessor (used by hooks) ────────────────────────────────────────

export function usePlatformContext(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatformContext must be used inside <PlatformProvider>");
  return ctx;
}
