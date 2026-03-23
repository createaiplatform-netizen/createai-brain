/**
 * useDeviceMode — reactive device mode hook
 * ────────────────────────────────────────────
 * Returns the current device mode based on viewport width.
 * Updates live on resize. Consistent with the OSLayout 3-tier breakpoints.
 *
 * narrow  → < 768px  (mobile — hamburger nav)
 * medium  → 768–1279px (tablet — icon-only sidebar)
 * wide    → ≥ 1280px  (desktop — full sidebar)
 */

import { useState, useEffect } from "react";

export type DeviceMode = "narrow" | "medium" | "wide";

export interface DeviceModeInfo {
  mode:     DeviceMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width:    number;
}

export function useDeviceMode(): DeviceModeInfo {
  const getMode = (w: number): DeviceMode =>
    w < 768 ? "narrow" : w < 1280 ? "medium" : "wide";

  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const mode = getMode(width);
  return {
    mode,
    isMobile:  mode === "narrow",
    isTablet:  mode === "medium",
    isDesktop: mode === "wide",
    width,
  };
}
