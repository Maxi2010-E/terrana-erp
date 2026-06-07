-- DEPRECATED: Superseded by 00005_users_last_login_only.sql
-- Skip on fresh production — run 00005 instead. Safe to keep if dev DB already ran this file.
--
-- Allow users to update their own last_login on sign-in
drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
