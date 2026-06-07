-- Employee HR documents (CV, employment letter, ID card) — private storage bucket
-- Run in Supabase Dashboard → SQL Editor after 00046_export_unassigned_warehouse_lot.sql
-- Columns cv_url, employment_letter_url, id_document_url already exist on public.employees (00002)

comment on column public.employees.cv_url is
  'Storage object path in bucket employee-documents, e.g. {employee_id}/cv.pdf';
comment on column public.employees.employment_letter_url is
  'Storage object path in bucket employee-documents, e.g. {employee_id}/employment-letter.pdf';
comment on column public.employees.id_document_url is
  'Storage object path in bucket employee-documents, e.g. {employee_id}/id-card.pdf';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-documents',
  'employee-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists employee_documents_select on storage.objects;
create policy employee_documents_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'employee-documents'
    and public.current_app_role() in ('super_admin', 'admin')
  );

drop policy if exists employee_documents_insert on storage.objects;
create policy employee_documents_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'employee-documents'
    and public.current_app_role() in ('super_admin', 'admin')
  );

drop policy if exists employee_documents_update on storage.objects;
create policy employee_documents_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'employee-documents'
    and public.current_app_role() in ('super_admin', 'admin')
  )
  with check (
    bucket_id = 'employee-documents'
    and public.current_app_role() in ('super_admin', 'admin')
  );

drop policy if exists employee_documents_delete on storage.objects;
create policy employee_documents_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'employee-documents'
    and public.current_app_role() in ('super_admin', 'admin')
  );
