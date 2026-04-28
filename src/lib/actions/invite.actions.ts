"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BoardRole } from "@/types/supabase";

export async function createInvite(
  boardId: string,
  email: string,
  role: BoardRole = "member"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("invites")
    .insert({
      board_id: boardId,
      email,
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to accept this invite");

  const { data: invite, error: fetchError } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .single();

  if (fetchError || !invite) throw new Error("Invite not found");
  if (invite.accepted_at) throw new Error("Invite already accepted");
  if (new Date(invite.expires_at) < new Date()) throw new Error("Invite has expired");

  const { error: memberError } = await supabase
    .from("board_members")
    .insert({
      board_id: invite.board_id,
      user_id: user.id,
      role: invite.role,
    });

  if (memberError) {
    if (memberError.code === "23505") {
      return { boardId: invite.board_id, alreadyMember: true };
    }
    throw new Error(memberError.message);
  }

  await supabase
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  revalidatePath("/boards");
  return { boardId: invite.board_id, alreadyMember: false };
}

export async function getInviteByToken(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*, boards(title, slug)")
    .eq("token", token)
    .single();

  if (error) return null;
  return data;
}

export async function getBoardInvites(boardId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateMemberRole(memberId: string, role: BoardRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("board_members")
    .update({ role })
    .eq("id", memberId);

  if (error) throw new Error(error.message);
  revalidatePath("/boards");
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("board_members")
    .delete()
    .eq("id", memberId);

  if (error) throw new Error(error.message);
  revalidatePath("/boards");
}

export async function getBoardMembers(boardId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("board_members")
    .select("*")
    .eq("board_id", boardId)
    .order("joined_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
