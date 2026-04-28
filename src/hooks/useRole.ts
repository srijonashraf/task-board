"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BoardRole } from "@/types/supabase";

export function useRole(boardId: string | null, userId: string | null) {
  const [role, setRole] = useState<BoardRole | null>(null);

  useEffect(() => {
    if (!boardId || !userId) return;

    const supabase = createClient();
    supabase
      .from("board_members")
      .select("role")
      .eq("board_id", boardId)
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data) setRole(data.role as BoardRole);
      });
  }, [boardId, userId]);

  return role;
}

export function canEdit(role: BoardRole | null): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

export function canAdmin(role: BoardRole | null): boolean {
  return role === "owner" || role === "admin";
}
