-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

-- Boards
create table public.boards (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 100),
  slug        text unique not null,
  created_at  timestamptz default now()
);

-- Board membership with role enum
create type public.board_role as enum ('owner', 'admin', 'member', 'viewer');

create table public.board_members (
  id          uuid primary key default uuid_generate_v4(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.board_role not null default 'member',
  joined_at   timestamptz default now(),
  unique (board_id, user_id)
);

-- Columns (lists in Kanban terminology)
create table public.columns (
  id          uuid primary key default uuid_generate_v4(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 60),
  position    integer not null default 0,
  created_at  timestamptz default now()
);

-- Cards (tasks)
create table public.cards (
  id           uuid primary key default uuid_generate_v4(),
  column_id    uuid not null references public.columns(id) on delete cascade,
  board_id     uuid not null references public.boards(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  description  text,
  position     integer not null default 0,
  assignee_id  uuid references auth.users(id) on delete set null,
  due_date     date,
  created_by   uuid not null references auth.users(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Invites (pending, not yet accepted)
create table public.invites (
  id          uuid primary key default uuid_generate_v4(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  email       text not null,
  role        public.board_role not null default 'member',
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid not null references auth.users(id),
  expires_at  timestamptz default now() + interval '7 days',
  accepted_at timestamptz,
  created_at  timestamptz default now()
);

-- Audit log (append-only, filled by triggers)
create table public.audit_log (
  id          bigserial primary key,
  board_id    uuid not null references public.boards(id) on delete cascade,
  user_id     uuid references auth.users(id),
  action      text not null,
  table_name  text not null,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
create index on public.board_members(board_id);
create index on public.board_members(user_id);
create index on public.columns(board_id, position);
create index on public.cards(column_id, position);
create index on public.cards(board_id);
create index on public.audit_log(board_id, created_at desc);

-- ─────────────────────────────────────────────
-- HELPER FUNCTION (used inside RLS policies)
-- ─────────────────────────────────────────────
create or replace function public.get_user_role(p_board_id uuid, p_user_id uuid)
returns public.board_role
language sql
stable
security definer
as $$
  select role from public.board_members
  where board_id = p_board_id and user_id = p_user_id
  limit 1;
$$;

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cards_updated_at
  before update on public.cards
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────────
-- AUDIT TRIGGER
-- ─────────────────────────────────────────────
create or replace function public.handle_audit()
returns trigger language plpgsql security definer as $$
declare
  v_board_id uuid;
begin
  v_board_id := coalesce(
    (new).board_id,
    (old).board_id
  );
  insert into public.audit_log (board_id, user_id, action, table_name, record_id, old_data, new_data)
  values (
    v_board_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce((new).id, (old).id),
    case when tg_op = 'DELETE' then row_to_json(old)::jsonb else null end,
    case when tg_op != 'DELETE' then row_to_json(new)::jsonb else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger cards_audit
  after insert or update or delete on public.cards
  for each row execute function public.handle_audit();

create trigger columns_audit
  after insert or update or delete on public.columns
  for each row execute function public.handle_audit();
