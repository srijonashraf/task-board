"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CardItem } from "@/components/CardItem";
import { AddCardForm } from "@/components/AddCardForm";
import { RoleGate } from "@/components/RoleGate";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateColumn, deleteColumn } from "@/lib/actions/card.actions";
import { toast } from "sonner";
import type { Card, BoardRole } from "@/types/supabase";

interface ColumnProps {
  id: string;
  boardId: string;
  title: string;
  cards: Card[];
  role: BoardRole | null;
}

export function Column({ id, boardId, title, cards, role }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: "column", columnId: id },
  });

  const sortedCards = [...cards].sort((a, b) => a.position - b.position);
  const cardIds = sortedCards.map((c) => c.id);
  const maxPosition = sortedCards.length > 0
    ? Math.max(...sortedCards.map((c) => c.position))
    : 0;

  const canEditBoard = role === "owner" || role === "admin" || role === "member";

  async function handleRename() {
    if (!editTitle.trim() || editTitle.trim() === title) {
      setIsEditing(false);
      setEditTitle(title);
      return;
    }
    try {
      await updateColumn(id, editTitle.trim());
      setIsEditing(false);
      toast.success("Column renamed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename column");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${title}" and all its cards?`)) return;
    try {
      await deleteColumn(id);
      toast.success("Column deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete column");
    }
  }

  return (
    <div className="flex-shrink-0 w-72">
      <div
        ref={setNodeRef}
        className={`bg-muted/50 rounded-lg p-3 flex flex-col max-h-[calc(100vh-200px)] ${
          isOver ? "ring-2 ring-primary/50" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          {isEditing ? (
            <Input
              autoFocus
              className="h-7 text-sm font-semibold"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditTitle(title);
                }
              }}
            />
          ) : (
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {title}
              <span className="text-muted-foreground font-normal">
                {cards.length}
              </span>
            </h3>
          )}

          <RoleGate role={role} allowedRoles={["owner", "admin"]}>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </RoleGate>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-[2rem]">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {sortedCards.map((card) => (
              <CardItem key={card.id} card={card} canEdit={canEditBoard} />
            ))}
          </SortableContext>
        </div>

        <div className="mt-2">
          <RoleGate role={role} allowedRoles={["owner", "admin", "member"]}>
            <AddCardForm
              boardId={boardId}
              columnId={id}
              maxPosition={maxPosition}
            />
          </RoleGate>
        </div>
      </div>
    </div>
  );
}
