"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card as CardUI } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, Calendar, Trash2, Pencil } from "lucide-react";
import { updateCard, deleteCard } from "@/lib/actions/card.actions";
import { toast } from "sonner";
import type { Card } from "@/types/supabase";

interface CardItemProps {
  card: Card;
  isDragging?: boolean;
  canEdit: boolean;
}

export function CardItem({ card, isDragging, canEdit }: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description ?? "");
  const [loading, setLoading] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", card },
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.5 : 1,
  };

  async function handleUpdate() {
    if (!editTitle.trim()) return;
    setLoading(true);
    try {
      await updateCard(card.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      setIsEditing(false);
      toast.success("Card updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update card");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this card?")) return;
    try {
      await deleteCard(card.id);
      toast.success("Card deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete card");
    }
  }

  return (
    <>
      <CardUI
        ref={setNodeRef}
        style={style}
        className="p-3 cursor-default group hover:border-primary/50 transition-colors"
      >
        <div className="flex items-start gap-2">
          {canEdit && (
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{card.title}</p>
            {card.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {card.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {card.due_date && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(card.due_date).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardUI>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardTitle">Title</Label>
              <Input
                id="cardTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardDescription">Description</Label>
              <textarea
                id="cardDescription"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add a description..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
