"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { createColumn } from "@/lib/actions/card.actions";
import { toast } from "sonner";

interface AddColumnFormProps {
  boardId: string;
  maxPosition: number;
}

export function AddColumnForm({ boardId, maxPosition }: AddColumnFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await createColumn(boardId, title.trim(), maxPosition + 1000);
      setTitle("");
      setIsAdding(false);
      toast.success("Column created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create column");
    } finally {
      setLoading(false);
    }
  }

  if (!isAdding) {
    return (
      <div className="flex-shrink-0 w-72">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground h-auto py-3"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add column
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-72 bg-muted/50 rounded-lg p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          autoFocus
          placeholder="Enter column title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={loading || !title.trim()}>
            {loading ? "Adding..." : "Add column"}
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
    </div>
  );
}
