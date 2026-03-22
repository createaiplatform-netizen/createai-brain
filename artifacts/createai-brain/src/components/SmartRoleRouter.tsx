import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUserRole } from "@/hooks/useUserRole";
import { getRoleHome, needsRoleRedirect, isRoleBlocked } from "@/lib/roles";

// SmartRoleRouter — renders null, purely a side-effect component.
// After login + NDA, reads user role and redirects to the correct destination.
// Also enforces: if a role is blocked from the current path, redirect home.
export function SmartRoleRouter() {
  const [location, navigate] = useLocation();
  const { role, isLoading } = useUserRole();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || !role) return;

    const home = getRoleHome(role);

    // If user navigated to a blocked path, send them home
    if (isRoleBlocked(role, location)) {
      navigate(home);
      return;
    }

    // Initial redirect: only fire once, only for roles that need it
    if (hasRedirected.current) return;
    if (!needsRoleRedirect(role)) return;

    // If at root or the base path, redirect to role's home
    if (location === "/" || location === "" || location === window.__BASE_PATH__) {
      hasRedirected.current = true;
      navigate(home);
    }
  }, [role, isLoading, location, navigate]);

  return null;
}

// Extend Window for base path access
declare global {
  interface Window {
    __BASE_PATH__?: string;
  }
}
