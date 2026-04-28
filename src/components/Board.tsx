"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Column } from "@/components/Column";
import { AddColumnForm } from "@/components/AddColumnForm";
import { CardItem } from "@/components/CardItem";
import { RoleGate } from "@/components/RoleGate";
import { useRealtimeBoard } from "@/hooks/useRealtimeBoard";
import { moveCard } from "@/lib/actions/card.actions";
import { calculatePosition } from "@/lib/utils/positions";
import { toast } from "sonner";
import type { Card, ColumnWithCards, BoardRole } from "@/types/supabase";

interface BoardProps {
  boardId: string;
  initialColumns: ColumnWithCards[];
  role: BoardRole | null;
}

export function Board({ boardId, initialColumns, role }: BoardProps) {
  const [columns, setColumns] = useState<ColumnWithCards[]>(initialColumns);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [snapshot, setSnapshot] = useState<ColumnWithCards[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const onCardChange = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      const { eventType } = payload;
      if (eventType === "INSERT") {
        const newCard = payload.new as unknown as Card;
        setColumns((prev) =>
          prev.map((col) =>
            col.id === newCard.column_id
              ? { ...col, cards: [...col.cards, newCard] }
              : col
          )
        );
      } else if (eventType === "UPDATE") {
        const updated = payload.new as unknown as Card;
        const oldData = payload.old as { column_id?: string };
        setColumns((prev) =>
          prev.map((col) => {
            if (col.id === oldData.column_id && oldData.column_id !== updated.column_id) {
              return { ...col, cards: col.cards.filter((c) => c.id !== updated.id) };
            }
            if (col.id === updated.column_id) {
              const exists = col.cards.some((c) => c.id === updated.id);
              if (exists) {
                return {
                  ...col,
                  cards: col.cards.map((c) => (c.id === updated.id ? updated : c)),
                };
              }
              return { ...col, cards: [...col.cards, updated] };
            }
            return {
              ...col,
              cards: col.cards.map((c) => (c.id === updated.id ? updated : c)),
            };
          })
        );
      } else if (eventType === "DELETE") {
        const old = payload.old as { id?: string };
        if (old.id) {
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              cards: col.cards.filter((c) => c.id !== old.id),
            }))
          );
        }
      }
    },
    []
  );

  const onColumnChange = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      const { eventType } = payload;
      if (eventType === "INSERT") {
        const newCol = payload.new as unknown as ColumnWithCards;
        setColumns((prev) => [...prev, { ...newCol, cards: newCol.cards ?? [] }]);
      } else if (eventType === "UPDATE") {
        const updated = payload.new as unknown as ColumnWithCards;
        setColumns((prev) =>
          prev.map((col) =>
            col.id === updated.id
              ? { ...col, ...updated, cards: col.cards }
              : col
          )
        );
      } else if (eventType === "DELETE") {
        const old = payload.old as { id?: string };
        if (old.id) {
          setColumns((prev) => prev.filter((col) => col.id !== old.id));
        }
      }
    },
    []
  );

  useRealtimeBoard(boardId, onCardChange, onColumnChange);

  function findCardColumn(cardId: string) {
    return columns.find((col) => col.cards.some((c) => c.id === cardId));
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const data = active.data.current;
    if (data?.type === "card") {
      setActiveCard(data.card as Card);
      setSnapshot([...columns.map((col) => ({ ...col, cards: [...col.cards] }))]);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== "card") return;

    const activeColumn = findCardColumn(active.id as string);
    let overColumn: ColumnWithCards | undefined;

    if (overData?.type === "column") {
      overColumn = columns.find((col) => col.id === over.id);
    } else if (overData?.type === "card") {
      overColumn = findCardColumn(over.id as string);
    } else {
      overColumn = columns.find((col) => col.id === over.id);
    }

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

    setColumns((prev) => {
      const activeCards = activeColumn.cards.filter((c) => c.id !== active.id);
      const overCards = [...overColumn.cards];
      const movedCard = activeColumn.cards.find((c) => c.id === active.id);
      if (!movedCard) return prev;

      const overIndex = overData?.type === "card"
        ? overCards.findIndex((c) => c.id === over.id)
        : overCards.length;

      overCards.splice(overIndex >= 0 ? overIndex : overCards.length, 0, {
        ...movedCard,
        column_id: overColumn.id,
      });

      return prev.map((col) => {
        if (col.id === activeColumn.id) return { ...col, cards: activeCards };
        if (col.id === overColumn.id) return { ...col, cards: overCards };
        return col;
      });
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) {
      if (snapshot) setColumns(snapshot);
      setSnapshot(null);
      return;
    }

    const activeData = active.data.current;
    if (activeData?.type !== "card") return;

    const activeColumn = findCardColumn(active.id as string);
    if (!activeColumn) return;

    const overData = over.data.current;

    let targetColumn = activeColumn;
    if (overData?.type === "column") {
      targetColumn = columns.find((col) => col.id === over.id) ?? activeColumn;
    } else if (overData?.type === "card") {
      targetColumn = findCardColumn(over.id as string) ?? activeColumn;
    }

    const activeIndex = activeColumn.cards.findIndex((c) => c.id === active.id);
    let newIndex = targetColumn.cards.findIndex((c) => c.id === over.id);
    if (newIndex < 0) newIndex = targetColumn.cards.length - 1;

    if (activeColumn.id === targetColumn.id && activeIndex === newIndex) {
      setSnapshot(null);
      return;
    }

    const sortedCards =
      activeColumn.id === targetColumn.id
        ? arrayMove([...targetColumn.cards], activeIndex, newIndex)
        : [...targetColumn.cards];

    const prevPos = newIndex > 0 ? sortedCards[newIndex - 1]?.position : null;
    const nextPos =
      newIndex < sortedCards.length - 1 ? sortedCards[newIndex + 1]?.position : null;
    const newPosition = calculatePosition(prevPos ?? null, nextPos ?? null);

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === targetColumn.id) {
          const cards =
            activeColumn.id === targetColumn.id
              ? arrayMove(
                  [...col.cards],
                  col.cards.findIndex((c) => c.id === active.id),
                  newIndex
                ).map((c) =>
                  c.id === active.id
                    ? { ...c, position: newPosition, column_id: targetColumn.id }
                    : c
                )
              : col.cards.map((c) =>
                  c.id === active.id
                    ? { ...c, position: newPosition, column_id: targetColumn.id }
                    : c
                );
          return { ...col, cards };
        }
        if (col.id === activeColumn.id && activeColumn.id !== targetColumn.id) {
          return { ...col, cards: col.cards.filter((c) => c.id !== active.id) };
        }
        return col;
      })
    );

    try {
      await moveCard(active.id as string, targetColumn.id, newPosition);
    } catch {
      if (snapshot) setColumns(snapshot);
      toast.error("Failed to move card — reverted");
    }

    setSnapshot(null);
  }

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);
  const maxColumnPosition =
    sortedColumns.length > 0
      ? Math.max(...sortedColumns.map((c) => c.position))
      : 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 px-4 flex-1">
        {sortedColumns.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            boardId={boardId}
            title={column.title}
            cards={column.cards}
            role={role}
          />
        ))}
        <RoleGate role={role} allowedRoles={["owner", "admin", "member"]}>
          <AddColumnForm boardId={boardId} maxPosition={maxColumnPosition} />
        </RoleGate>
      </div>

      <DragOverlay>
        {activeCard ? (
          <CardItem card={activeCard} isDragging canEdit={false} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
