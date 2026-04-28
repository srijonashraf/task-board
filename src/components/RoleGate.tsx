"use client";

import type { BoardRole } from "@/types/supabase";

interface RoleGateProps {
  role: BoardRole | null;
  allowedRoles: BoardRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ role, allowedRoles, children, fallback = null }: RoleGateProps) {
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
