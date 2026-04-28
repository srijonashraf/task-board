-- ─────────────────────────────────────────────
-- MIGRATION: Fix infinite recursion in RLS policies
--
-- The original policies on boards, board_members,
-- columns, and cards used direct sub-queries on
-- board_members which triggered the board_members
-- SELECT policy recursively. This migration drops
-- those policies and recreates them using the
-- get_user_role() SECURITY DEFINER function which
-- bypasses RLS and breaks the recursion.
--
-- It also fixes the members_insert policy to allow
-- board owners to add themselves as the first member.
--
-- Run this in the Supabase SQL Editor AFTER the
-- initial schema.sql and policies.sql have been run.
-- If you haven't run policies.sql yet, use the updated
-- policies.sql instead and skip this migration.
-- ─────────────────────────────────────────────

-- Drop all existing policies
drop policy if exists "boards_select" on public.boards;
drop policy if exists "boards_insert" on public.boards;
drop policy if exists "boards_update" on public.boards;
drop policy if exists "boards_delete" on public.boards;

drop policy if exists "members_select" on public.board_members;
drop policy if exists "members_insert" on public.board_members;
drop policy if exists "members_update" on public.board_members;
drop policy if exists "members_delete" on public.board_members;

drop policy if exists "columns_select" on public.columns;
drop policy if exists "columns_insert" on public.columns;
drop policy if exists "columns_update" on public.columns;
drop policy if exists "columns_delete" on public.columns;

drop policy if exists "cards_select" on public.cards;
drop policy if exists "cards_insert" on public.cards;
drop policy if exists "cards_update" on public.cards;
drop policy if exists "cards_delete" on public.cards;

drop policy if exists "invites_select" on public.invites;
drop policy if exists "invites_insert" on public.invites;
drop policy if exists "invites_update" on public.invites;

drop policy if exists "audit_select" on public.audit_log;

-- ─────────────────────────────────────────────
-- BOARDS — use get_user_role (SECURITY DEFINER)
-- ─────────────────────────────────────────────
create policy "boards_select" on public.boards
  for select using (
    public.get_user_role(id, auth.uid()) is not null
  );

create policy "boards_insert" on public.boards
  for insert with check (owner_id = auth.uid());

create policy "boards_update" on public.boards
  for update using (
    public.get_user_role(id, auth.uid()) in ('owner', 'admin')
  );

create policy "boards_delete" on public.boards
  for delete using (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- BOARD_MEMBERS — use get_user_role + owner check
-- ─────────────────────────────────────────────
create policy "members_select" on public.board_members
  for select using (
    public.get_user_role(board_id, auth.uid()) is not null
  );

create policy "members_insert" on public.board_members
  for insert with check (
    (user_id = auth.uid() and exists (
      select 1 from public.boards where id = board_id and owner_id = auth.uid()
    ))
    or
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin')
    or
    (user_id = auth.uid() and exists (
      select 1 from public.invites
      where invites.board_id = board_members.board_id
        and email = (select email from auth.users where id = auth.uid())
        and accepted_at is null
        and expires_at > now()
    ))
  );

create policy "members_update" on public.board_members
  for update using (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin')
    and role != 'owner'
  );

create policy "members_delete" on public.board_members
  for delete using (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin')
    or user_id = auth.uid()
  );

-- ─────────────────────────────────────────────
-- COLUMNS — use get_user_role
-- ─────────────────────────────────────────────
create policy "columns_select" on public.columns
  for select using (
    public.get_user_role(board_id, auth.uid()) is not null
  );

create policy "columns_insert" on public.columns
  for insert with check (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin', 'member')
  );

create policy "columns_update" on public.columns
  for update using (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin', 'member')
  );

create policy "columns_delete" on public.columns
  for delete using (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin')
  );

-- ─────────────────────────────────────────────
-- CARDS — use get_user_role
-- ─────────────────────────────────────────────
create policy "cards_select" on public.cards
  for select using (
    public.get_user_role(board_id, auth.uid()) is not null
  );

create policy "cards_insert" on public.cards
  for insert with check (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin', 'member')
    and created_by = auth.uid()
  );

create policy "cards_update" on public.cards
  for update using (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin', 'member')
  );

create policy "cards_delete" on public.cards
  for delete using (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin')
    or created_by = auth.uid()
  );

-- ─────────────────────────────────────────────
-- INVITES
-- ─────────────────────────────────────────────
create policy "invites_select" on public.invites
  for select using (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin')
    or email = (select email from auth.users where id = auth.uid())
  );

create policy "invites_insert" on public.invites
  for insert with check (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin')
    and invited_by = auth.uid()
  );

create policy "invites_update" on public.invites
  for update using (
    email = (select email from auth.users where id = auth.uid())
    or public.get_user_role(board_id, auth.uid()) in ('owner', 'admin')
  );

-- ─────────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────────
create policy "audit_select" on public.audit_log
  for select using (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin')
  );
