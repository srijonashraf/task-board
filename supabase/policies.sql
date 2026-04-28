-- ─────────────────────────────────────────────
-- ENABLE RLS ON ALL TABLES
-- ─────────────────────────────────────────────
alter table public.boards       enable row level security;
alter table public.board_members enable row level security;
alter table public.columns      enable row level security;
alter table public.cards        enable row level security;
alter table public.invites      enable row level security;
alter table public.audit_log    enable row level security;

-- ─────────────────────────────────────────────
-- BOARDS
-- ─────────────────────────────────────────────
create policy "boards_select" on public.boards
  for select using (
    exists (
      select 1 from public.board_members
      where board_id = id and user_id = auth.uid()
    )
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
-- BOARD_MEMBERS
-- ─────────────────────────────────────────────
create policy "members_select" on public.board_members
  for select using (
    exists (
      select 1 from public.board_members bm
      where bm.board_id = board_id and bm.user_id = auth.uid()
    )
  );

create policy "members_insert" on public.board_members
  for insert with check (
    public.get_user_role(board_id, auth.uid()) in ('owner', 'admin')
    or
    (user_id = auth.uid() and exists (
      select 1 from public.invites
      where board_id = board_members.board_id
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
-- COLUMNS
-- ─────────────────────────────────────────────
create policy "columns_select" on public.columns
  for select using (
    exists (
      select 1 from public.board_members
      where board_id = columns.board_id and user_id = auth.uid()
    )
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
-- CARDS
-- ─────────────────────────────────────────────
create policy "cards_select" on public.cards
  for select using (
    exists (
      select 1 from public.board_members
      where board_id = cards.board_id and user_id = auth.uid()
    )
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
