-- Terrana ERP: facility geofence for valid attendance
-- Run in Supabase Dashboard → SQL Editor after 00037_office_board.sql

alter table public.company_settings
  add column if not exists geofence_enabled boolean not null default false,
  add column if not exists facility_latitude double precision,
  add column if not exists facility_longitude double precision,
  add column if not exists facility_radius_meters integer not null default 200,
  add column if not exists facility_name text not null default 'Terrana facility';

alter table public.attendance
  add column if not exists login_latitude double precision,
  add column if not exists login_longitude double precision,
  add column if not exists distance_from_facility_meters double precision,
  add column if not exists location_valid boolean not null default true;

create or replace function public.haversine_meters(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 6371000.0 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2.0), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
      * power(sin(radians(lng2 - lng1) / 2.0), 2)
  ));
$$;

create or replace function public.get_geofence_requirement()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'required',
        geofence_enabled
          and facility_latitude is not null
          and facility_longitude is not null,
        'facility_name',
        facility_name
      )
      from public.company_settings
      limit 1
    ),
    jsonb_build_object('required', false, 'facility_name', 'Terrana facility')
  );
$$;

grant execute on function public.get_geofence_requirement() to anon, authenticated;

create or replace function public.record_login_attendance(
  login_time timestamptz default now(),
  login_lat double precision default null,
  login_lng double precision default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_enabled boolean := false;
  v_facility_lat double precision;
  v_facility_lng double precision;
  v_radius integer := 200;
  v_distance double precision;
  v_valid boolean := true;
  v_attendance_date date;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;

  if not public.is_active_app_user() then
    return jsonb_build_object('ok', false, 'code', 'account_inactive');
  end if;

  select
    geofence_enabled,
    facility_latitude,
    facility_longitude,
    facility_radius_meters
  into v_enabled, v_facility_lat, v_facility_lng, v_radius
  from public.company_settings
  limit 1;

  v_attendance_date := (login_time at time zone 'Africa/Lagos')::date;

  if coalesce(v_enabled, false)
     and v_facility_lat is not null
     and v_facility_lng is not null then
    if login_lat is null or login_lng is null then
      return jsonb_build_object('ok', false, 'code', 'location_required');
    end if;

    v_distance := public.haversine_meters(
      v_facility_lat,
      v_facility_lng,
      login_lat,
      login_lng
    );
    v_valid := v_distance <= coalesce(v_radius, 200);

    if not v_valid then
      return jsonb_build_object(
        'ok', false,
        'code', 'outside_geofence',
        'distance_meters', round(v_distance::numeric, 1),
        'allowed_meters', coalesce(v_radius, 200)
      );
    end if;
  end if;

  insert into public.attendance (
    user_id,
    login_time,
    attendance_date,
    login_latitude,
    login_longitude,
    distance_from_facility_meters,
    location_valid
  )
  values (
    v_uid,
    login_time,
    v_attendance_date,
    login_lat,
    login_lng,
    v_distance,
    v_valid
  );

  perform public.update_own_last_login(login_time);

  return jsonb_build_object(
    'ok', true,
    'location_valid', v_valid,
    'distance_meters', case when v_distance is null then null else round(v_distance::numeric, 1) end
  );
end;
$$;

grant execute on function public.record_login_attendance(timestamptz, double precision, double precision)
  to authenticated;

-- Admin read/update company_settings geofence fields
drop policy if exists company_settings_select on public.company_settings;
create policy company_settings_select on public.company_settings
  for select to authenticated
  using (true);

drop policy if exists company_settings_update on public.company_settings;
create policy company_settings_update on public.company_settings
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'))
  with check (public.current_app_role() in ('super_admin', 'admin'));
