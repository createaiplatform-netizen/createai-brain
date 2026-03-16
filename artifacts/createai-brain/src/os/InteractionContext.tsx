// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL INTERACTION CONTEXT — wraps entire OS
// All state is internal-only / mock / demo.
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  InteractionEngine,
  UniversalState,
  UniversalView,
  DemoStatus,
} from "@/engine/InteractionEngine";

interface InteractionCtx {
  state: UniversalState;
  setRole:       (id: string)          => void;
  setDepartment: (id: string)          => void;
  setAgency:     (id: string)          => void;
  setState:      (name: string)        => void;
  setVendor:     (id: string)          => void;
  setView:       (v: UniversalView)    => void;
  setUserType:   (ut: string)          => void;
  setPacket:     (id: string | null)   => void;
  setDemoStatus: (s: DemoStatus)       => void;
  dispatch:      (action: string, payload?: string) => void;
  clearLog:      ()                    => void;
  reset:         ()                    => void;
  refresh:       ()                    => void;
}

const Ctx = createContext<InteractionCtx | null>(null);

export function InteractionProvider({ children }: { children: React.ReactNode }) {
  const [state, _setState] = useState<UniversalState>(() => InteractionEngine.getState());

  const refresh = useCallback(() => {
    _setState(InteractionEngine.getState());
  }, []);

  const setRole       = useCallback((id: string)        => { InteractionEngine.setRole(id);        refresh(); }, [refresh]);
  const setDepartment = useCallback((id: string)        => { InteractionEngine.setDepartment(id);  refresh(); }, [refresh]);
  const setAgency     = useCallback((id: string)        => { InteractionEngine.setAgency(id);      refresh(); }, [refresh]);
  const setState      = useCallback((name: string)      => { InteractionEngine.setState(name);     refresh(); }, [refresh]);
  const setVendor     = useCallback((id: string)        => { InteractionEngine.setVendor(id);      refresh(); }, [refresh]);
  const setView       = useCallback((v: UniversalView)  => { InteractionEngine.setView(v);         refresh(); }, [refresh]);
  const setUserType   = useCallback((ut: string)        => { InteractionEngine.setUserType(ut);    refresh(); }, [refresh]);
  const setPacket     = useCallback((id: string | null) => { InteractionEngine.setPacket(id);      refresh(); }, [refresh]);
  const setDemoStatus = useCallback((s: DemoStatus)     => { InteractionEngine.setDemoStatus(s);   refresh(); }, [refresh]);
  const dispatch      = useCallback((a: string, p?: string) => { InteractionEngine.dispatchAction(a, p); refresh(); }, [refresh]);
  const clearLog      = useCallback(() => { InteractionEngine.clearLog(); refresh(); }, [refresh]);
  const reset         = useCallback(() => { InteractionEngine.reset();    refresh(); }, [refresh]);

  return (
    <Ctx.Provider value={{
      state, setRole, setDepartment, setAgency, setState, setVendor,
      setView, setUserType, setPacket, setDemoStatus, dispatch,
      clearLog, reset, refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useInteraction(): InteractionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInteraction must be used inside InteractionProvider");
  return ctx;
}
