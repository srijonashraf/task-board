"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PresenceUser } from "@/hooks/usePresence";

interface MemberAvatarsProps {
  users: PresenceUser[];
}

export function MemberAvatars({ users }: MemberAvatarsProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <Tooltip key={user.user_id}>
            <TooltipTrigger className="inline-block">
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarImage src={user.avatar_url} alt={user.email} />
                <AvatarFallback className="text-xs">
                  {user.email?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.email}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {users.length > 5 && (
        <span className="text-sm text-muted-foreground ml-1">
          +{users.length - 5}
        </span>
      )}
      <span className="text-sm text-muted-foreground ml-2">
        {users.length} online
      </span>
    </div>
  );
}
