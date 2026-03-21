import { useState, useEffect } from "react";

export interface PlatformIdentity {
  npa:          string;
  handle:       string;
  platformName: string;
  legalEntity:  string;
  ownerName:    string;
  liveUrl:      string;
  liveDomain:   string;
  domainSource: "custom" | "replit-dev" | "replit-app" | "npa-fallback";
  contactEmail: string;
  fromEmail:    string;
  cashApp:      string;
  venmo:        string;
  resolvedAt:   string;
}

const SOURCE_LABELS: Record<PlatformIdentity["domainSource"], string> = {
  "custom":       "Custom Domain",
  "replit-dev":   "Replit Dev URL",
  "replit-app":   "Replit Published",
  "npa-fallback": "NPA Internal",
};

let _cached: PlatformIdentity | null = null;

export function usePlatformIdentity() {
  const [identity, setIdentity] = useState<PlatformIdentity | null>(_cached);
  const [loading, setLoading]   = useState(!_cached);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (_cached) { setIdentity(_cached); setLoading(false); return; }
    fetch("/api/platform-identity")
      .then(r => r.json())
      .then((data: PlatformIdentity) => {
        _cached = data;
        setIdentity(data);
      })
      .catch(() => setError("Could not resolve platform identity"))
      .finally(() => setLoading(false));
  }, []);

  const sourceLabel = identity ? SOURCE_LABELS[identity.domainSource] : "—";

  return { identity, loading, error, sourceLabel };
}
