-- Prod projects with "Automatically expose new tables" disabled need explicit grants.
-- Fixes: permission denied for table users (create user, users list, profile reads).

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update on public.users to authenticated;
grant all on public.users to service_role;
