"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { createCard } from "@/lib/actions/card.actions";
import { toast } from "sonner";

interface AddCardFormProps {
  boardId: string;
  columnId: string;
  maxPosition: number;
}

export function AddCardForm({ boardId, columnId, maxPosition }: AddCardFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await createCard(boardId, columnId, title.trim(), maxPosition + 1000);
      setTitle("");
      setIsAdding(false);
      toast.success("Card created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create card");
    } finally {
      setLoading(false);
    }
  }

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add a card
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        autoFocus
        placeholder="Enter card title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={loading || !title.trim()}>
          {loading ? "Adding..." : "Add card"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsAdding(false);
            setTitle("");
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
