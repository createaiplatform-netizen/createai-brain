/**
 * useCRL — React hook for CRL resolution
 * ────────────────────────────────────────
 * Resolves a CRL URI to a real URL.
 * Uses the sync fast-path for known schemes (zero-latency).
 * Falls back to the API for dynamic/registered namespaces.
 *
 * Usage:
 *   const { url, loading, error } = useCRL("hub://healthcare");
 *   const { url } = useCRL("os://settings");
 */

import { useEffect, useState } from "react";
import { resolveCRL, resolveCRLSync, type CRLResolution } from "./resolveCRL";

interface UseCRLResult {
  data:    CRLResolution | null;
  url:     string | null;   // shorthand for data?.url
  loading: boolean;
  error:   string | null;
}

export function useCRL(crl: string | null | undefined): UseCRLResult {
  // Attempt sync resolution immediately — no loading state needed
  const syncPath = crl ? resolveCRLSync(crl) : null;

  const [data, setData]       = useState<CRLResolution | null>(
    syncPath && crl
      ? { crl, url: syncPath, scheme: crl.split("://")[0] ?? "", path: crl.split("://")[1] ?? "" }
      : null,
  );
  const [loading, setLoading] = useState(!syncPath && !!crl);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!crl) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Sync succeeded — no API call needed
    const fast = resolveCRLSync(crl);
    if (fast !== null) {
      setData({ crl, url: fast, scheme: crl.split("://")[0] ?? "", path: crl.split("://")[1] ?? "" });
      setLoading(false);
      return;
    }

    // Unknown scheme — resolve via API
    let cancelled = false;
    setLoading(true);
    setError(null);

    resolveCRL(crl)
      .then(res => {
        if (!cancelled) { setData(res); setLoading(false); }
      })
      .catch(err => {
        if (!cancelled) { setError((err as Error).message); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [crl]);

  return { data, url: data?.url ?? null, loading, error };
}
