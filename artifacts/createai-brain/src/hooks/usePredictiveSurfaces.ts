/**
 * usePredictiveSurfaces — behavioral prediction hook
 * ─────────────────────────────────────────────────────
 * Fetches the user's app usage history and returns a ranked list of
 * surfaces they're likely to find valuable next, plus their top-used apps.
 *
 * Backed by: GET /api/contextual/predict
 */

import { useQuery } from "@tanstack/react-query";

export interface PredictedSurface {
  id:        string;
  title:     string;
  tagline:   string;
  url:       string;
  icon:      string;
  category:  string;
  predicted: boolean;
}

interface PredictResponse {
  ok:            boolean;
  authenticated: boolean;
  usageCount?:   number;
  surfaces:      PredictedSurface[];
}

export function usePredictiveSurfaces(limit = 5) {
  return useQuery<PredictResponse>({
    queryKey: ["predictive-surfaces", limit],
    queryFn: async () => {
      const res = await fetch(`/api/contextual/predict?limit=${limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Prediction unavailable");
      return res.json() as Promise<PredictResponse>;
    },
    staleTime:     5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
  });
}
