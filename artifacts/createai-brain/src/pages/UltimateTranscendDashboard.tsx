/**
 * UltimateTranscendDashboard — now redirects to the Admin Universe.
 * The /transcend-dashboard route is auth-required. Admin/founder users
 * are sent to /admin. All other roles go to their role home.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";

export default function UltimateTranscendDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const role = (user as { role?: string } | null)?.role ?? "";
    if (role === "admin" || role === "founder") {
      navigate("/admin", { replace: true });
    } else if (role === "customer") {
      navigate("/dashboard", { replace: true });
    } else if (role === "family_adult" || role === "family_child") {
      navigate("/family", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return null;
}
