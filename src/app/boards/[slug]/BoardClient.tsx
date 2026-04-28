"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Board } from "@/components/Board";
import { MemberAvatars } from "@/components/MemberAvatars";
import { InviteModal } from "@/components/InviteModal";
import { RoleGate } from "@/components/RoleGate";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";
import type { Board as BoardType, ColumnWithCards, BoardRole } from "@/types/supabase";

interface BoardClientProps {
  board: BoardType;
  initialColumns: ColumnWithCards[];
  role: BoardRole;
  userId: string;
  userEmail: string;
  userAvatarUrl: string;
}

export function BoardClient({
  board,
  initialColumns,
  role,
  userId,
  userEmail,
  userAvatarUrl,
}: BoardClientProps) {
  const onlineUsers = usePresence(board.id, {
    id: userId,
    email: userEmail,
    avatar_url: userAvatarUrl,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{board.title}</h1>
          <MemberAvatars users={onlineUsers} />
        </div>
        <div className="flex items-center gap-2">
          <RoleGate role={role} allowedRoles={["owner", "admin"]}>
            <InviteModal boardId={board.id} />
            <Link href={`/boards/${board.slug}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </RoleGate>
        </div>
      </div>
      <div className="flex-1 overflow-hidden py-4">
        <Board boardId={board.id} initialColumns={initialColumns} role={role} />
      </div>
    </div>
  );
}
