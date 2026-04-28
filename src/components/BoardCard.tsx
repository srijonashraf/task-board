"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import type { BoardRole } from "@/types/supabase";

interface BoardCardProps {
  title: string;
  slug: string;
  role: BoardRole;
  createdAt: string;
}

export function BoardCard({ title, slug, role, createdAt }: BoardCardProps) {
  return (
    <Link href={`/boards/${slug}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant={role === "owner" ? "default" : "secondary"}>
              {role}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
