"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils/slug";

export async function createBoard(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  if (!title || title.length < 1 || title.length > 100) {
    throw new Error("Title must be between 1 and 100 characters");
  }

  const slug = generateSlug(title);

  const { data: board, error } = await supabase
    .from("boards")
    .insert({ title, slug, owner_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("board_members").insert({
    board_id: board.id,
    user_id: user.id,
    role: "owner",
  });

  revalidatePath("/boards");
  redirect(`/boards/${board.slug}`);
}

export async function updateBoard(boardId: string, title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("boards")
    .update({ title })
    .eq("id", boardId);

  if (error) throw new Error(error.message);
  revalidatePath("/boards");
}

export async function deleteBoard(boardId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("boards").delete().eq("id", boardId);
  if (error) throw new Error(error.message);

  revalidatePath("/boards");
  redirect("/boards");
}

export async function getBoards() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select("*, board_members!inner(role, user_id)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getBoardBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}
