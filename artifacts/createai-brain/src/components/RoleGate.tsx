import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useUserRole } from "@/hooks/useUserRole";
import { getRoleHome } from "@/lib/roles";
import type { AppRole } from "@/lib/roles";

interface RoleGateProps {
  // Roles allowed past this gate
  allowed: AppRole[];
  children: ReactNode;
  // Where to send blocked users (defaults to their role's home)
  fallbackPath?: string;
}

// RoleGate — wraps a route and blocks access unless the user's role is in `allowed`.
// Shows nothing while loading (avoids flash of content).
// Redirects blocked users to their appropriate home.
export function RoleGate({ allowed, children, fallbackPath }: RoleGateProps) {
  const { role, isLoading } = useUserRole();
  const [, navigate] = useLocation();

  const isAllowed = !isLoading && role !== null && allowed.includes(role);

  useEffect(() => {
    if (isLoading) return;
    if (!role || !allowed.includes(role)) {
      navigate(fallbackPath ?? getRoleHome(role));
    }
  }, [role, isLoading, allowed, fallbackPath, navigate]);

  if (isLoading) return null;
  if (!isAllowed) return null;

  return <>{children}</>;
}
