// src/components/AnalyticsRouteTracker.tsx
// Fires a "view" event on every Wouter route change. Renders nothing.
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trackAnalyticsEvent } from "@/lib/analyticsClient";

export function AnalyticsRouteTracker() {
  const [location] = useLocation();

  useEffect(() => {
    trackAnalyticsEvent({ route: location, event_type: "view" });
  }, [location]);

  return null;
}
