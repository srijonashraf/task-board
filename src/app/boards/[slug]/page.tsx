import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BoardClient } from "./BoardClient";
import type { Board, Card, Column, ColumnWithCards, BoardRole } from "@/types/supabase";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: boardData } = await supabase
    .from("boards")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!boardData) {
    notFound();
  }

  const board = boardData as unknown as Board;

  const { data: membershipData } = await supabase
    .from("board_members")
    .select("role")
    .eq("board_id", board.id)
    .eq("user_id", user.id)
    .single();

  if (!membershipData) {
    notFound();
  }

  const role = (membershipData as unknown as { role: BoardRole }).role;

  const { data: columnsData } = await supabase
    .from("columns")
    .select("*, cards(*)")
    .eq("board_id", board.id)
    .order("position", { ascending: true });

  const rawColumns = (columnsData ?? []) as unknown as (Column & { cards: Card[] | null })[];

  const columnsWithCards: ColumnWithCards[] = rawColumns.map((col) => ({
    ...col,
    cards: Array.isArray(col.cards) ? col.cards : [],
  }));

  return (
    <BoardClient
      board={board}
      initialColumns={columnsWithCards}
      role={role}
      userId={user.id}
      userEmail={user.email ?? ""}
      userAvatarUrl={user.user_metadata?.avatar_url ?? ""}
    />
  );
}
