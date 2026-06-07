-- Employee profile photo (storage path) + private bucket for uploads
-- Run in Supabase Dashboard → SQL Editor after 00024_resolve_user_display_names.sql

alter table public.employees
  add column if not exists photo_url text;

comment on column public.employees.photo_url is
  'Storage object path in bucket employee-photos, e.g. {employee_id}/profile.jpg';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-photos',
  'employee-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists employee_photos_select on storage.objects;
create policy employee_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'employee-photos'
    and public.current_app_role() in ('super_admin', 'admin')
  );

drop policy if exists employee_photos_insert on storage.objects;
create policy employee_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'employee-photos'
    and public.current_app_role() in ('super_admin', 'admin')
  );

drop policy if exists employee_photos_update on storage.objects;
create policy employee_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'employee-photos'
    and public.current_app_role() in ('super_admin', 'admin')
  )
  with check (
    bucket_id = 'employee-photos'
    and public.current_app_role() in ('super_admin', 'admin')
  );

drop policy if exists employee_photos_delete on storage.objects;
create policy employee_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'employee-photos'
    and public.current_app_role() in ('super_admin', 'admin')
  );
