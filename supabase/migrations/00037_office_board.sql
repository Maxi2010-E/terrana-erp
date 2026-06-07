-- Terrana ERP: Office — general board, private messages, daily tasks
-- Run in Supabase Dashboard → SQL Editor after prior migrations.

do $$ begin
  create type public.company_task_status as enum ('open', 'done');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.company_board_messages (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  author_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists company_board_messages_created_idx
  on public.company_board_messages (created_at desc);

create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users (id) on delete cascade,
  recipient_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists private_messages_recipient_unread_idx
  on public.private_messages (recipient_id, read_at)
  where read_at is null;

create index if not exists private_messages_participants_idx
  on public.private_messages (sender_id, recipient_id, created_at desc);

create table if not exists public.company_daily_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  notes text,
  status public.company_task_status not null default 'open',
  original_date date not null default current_date,
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  completed_by uuid references public.users (id) on delete set null,
  completed_at timestamptz
);

create index if not exists company_daily_tasks_open_idx
  on public.company_daily_tasks (status, original_date asc, created_at asc)
  where status = 'open';

create or replace function public.is_active_app_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.status = 'active'
  );
$$;

grant execute on function public.is_active_app_user() to authenticated;

alter table public.company_board_messages enable row level security;
alter table public.private_messages enable row level security;
alter table public.company_daily_tasks enable row level security;

drop policy if exists company_board_messages_select on public.company_board_messages;
create policy company_board_messages_select on public.company_board_messages
  for select to authenticated using (public.is_active_app_user());

drop policy if exists company_board_messages_insert on public.company_board_messages;
create policy company_board_messages_insert on public.company_board_messages
  for insert to authenticated
  with check (public.is_active_app_user() and author_id = auth.uid());

drop policy if exists company_board_messages_delete on public.company_board_messages;
create policy company_board_messages_delete on public.company_board_messages
  for delete to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists private_messages_select on public.private_messages;
create policy private_messages_select on public.private_messages
  for select to authenticated
  using (
    public.is_active_app_user()
    and (sender_id = auth.uid() or recipient_id = auth.uid())
  );

drop policy if exists private_messages_insert on public.private_messages;
create policy private_messages_insert on public.private_messages
  for insert to authenticated
  with check (
    public.is_active_app_user()
    and sender_id = auth.uid()
    and sender_id <> recipient_id
  );

drop policy if exists private_messages_update on public.private_messages;
create policy private_messages_update on public.private_messages
  for update to authenticated
  using (public.is_active_app_user() and recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists company_daily_tasks_select on public.company_daily_tasks;
create policy company_daily_tasks_select on public.company_daily_tasks
  for select to authenticated using (public.is_active_app_user());

drop policy if exists company_daily_tasks_insert on public.company_daily_tasks;
create policy company_daily_tasks_insert on public.company_daily_tasks
  for insert to authenticated
  with check (
    public.is_active_app_user()
    and public.current_app_role() in ('super_admin', 'admin')
    and created_by = auth.uid()
  );

drop policy if exists company_daily_tasks_update on public.company_daily_tasks;
create policy company_daily_tasks_update on public.company_daily_tasks
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'))
  with check (public.current_app_role() in ('super_admin', 'admin'));
