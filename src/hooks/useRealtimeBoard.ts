"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type ChangePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

interface DragBroadcast {
  userId: string;
  cardId: string | null;
}

export function useRealtimeBoard(
  boardId: string | null,
  onCardChange: (payload: ChangePayload) => void,
  onColumnChange: (payload: ChangePayload) => void,
  onDragBroadcast?: (payload: DragBroadcast) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!boardId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cards",
          filter: `board_id=eq.${boardId}`,
        },
        onCardChange
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "columns",
          filter: `board_id=eq.${boardId}`,
        },
        onColumnChange
      )
      .on("broadcast", { event: "card_dragging" }, (payload) => {
        if (onDragBroadcast) {
          onDragBroadcast(payload.payload as DragBroadcast);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, onCardChange, onColumnChange, onDragBroadcast]);

  return channelRef;
}

export function broadcastDrag(
  boardId: string,
  userId: string,
  cardId: string | null
) {
  const supabase = createClient();
  const channel = supabase.channel(`board:${boardId}`);
  channel.send({
    type: "broadcast",
    event: "card_dragging",
    payload: { userId, cardId },
  });
}
