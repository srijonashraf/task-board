"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCard(
  boardId: string,
  columnId: string,
  title: string,
  position: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("cards")
    .insert({
      board_id: boardId,
      column_id: columnId,
      title,
      position,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/boards");
  return data;
}

export async function updateCard(
  cardId: string,
  updates: {
    title?: string;
    description?: string | null;
    column_id?: string;
    position?: number;
    assignee_id?: string | null;
    due_date?: string | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("cards")
    .update(updates)
    .eq("id", cardId);

  if (error) throw new Error(error.message);
  revalidatePath("/boards");
}

export async function deleteCard(cardId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("cards").delete().eq("id", cardId);
  if (error) throw new Error(error.message);
  revalidatePath("/boards");
}

export async function moveCard(
  cardId: string,
  columnId: string,
  position: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("cards")
    .update({ column_id: columnId, position })
    .eq("id", cardId);

  if (error) throw new Error(error.message);
}

export async function createColumn(
  boardId: string,
  title: string,
  position: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("columns")
    .insert({
      board_id: boardId,
      title,
      position,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/boards");
  return data;
}

export async function updateColumn(columnId: string, title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("columns")
    .update({ title })
    .eq("id", columnId);

  if (error) throw new Error(error.message);
  revalidatePath("/boards");
}

export async function deleteColumn(columnId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("columns").delete().eq("id", columnId);
  if (error) throw new Error(error.message);
  revalidatePath("/boards");
}
