-- Restrict self-updates on users: only last_login via RPC (no role/status escalation)

drop policy if exists users_update_own on public.users;

create or replace function public.update_own_last_login(login_time timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set last_login = login_time
  where id = auth.uid();
end;
$$;

grant execute on function public.update_own_last_login(timestamptz) to authenticated;
