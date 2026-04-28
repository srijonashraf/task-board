"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface PresenceUser {
  user_id: string;
  email: string;
  avatar_url?: string;
  online_at: string;
}

export function usePresence(boardId: string | null, currentUser: { id: string; email?: string; avatar_url?: string } | null) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!boardId || !currentUser) return;

    const supabase = createClient();
    const channel = supabase.channel(`presence:${boardId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users: PresenceUser[] = [];
        const seen = new Set<string>();
        for (const key of Object.keys(state)) {
          for (const presence of state[key]) {
            if (!seen.has(presence.user_id)) {
              seen.add(presence.user_id);
              users.push(presence);
            }
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUser.id,
            email: currentUser.email ?? "",
            avatar_url: currentUser.avatar_url ?? "",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, currentUser]);

  return onlineUsers;
}
