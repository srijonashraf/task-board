import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";
import type { Board, BoardMember, Invite, BoardRole } from "@/types/supabase";

export default async function SettingsPage({
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
  if (role !== "owner" && role !== "admin") {
    redirect(`/boards/${slug}`);
  }

  const { data: members } = await supabase
    .from("board_members")
    .select("*")
    .eq("board_id", board.id)
    .order("joined_at", { ascending: true });

  const { data: invites } = await supabase
    .from("invites")
    .select("*")
    .eq("board_id", board.id)
    .order("created_at", { ascending: false });

  return (
    <SettingsClient
      board={board}
      members={(members ?? []) as unknown as BoardMember[]}
      invites={(invites ?? []) as unknown as Invite[]}
      role={role}
      currentUserId={user.id}
    />
  );
}
