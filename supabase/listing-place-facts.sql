-- Optional agent-entered services on a listing.
-- Safe to run more than once. Guyana Keys does not store measured signal or speed.

alter table public.properties add column if not exists mobile_networks text[] not null default '{}';
alter table public.properties add column if not exists broadband_providers text[] not null default '{}';
alter table public.properties add column if not exists broadband_speed text not null default '';
alter table public.properties add column if not exists water_supply text not null default '';
alter table public.properties add column if not exists electricity text not null default '';
alter table public.properties add column if not exists road_access text not null default '';
alter table public.properties add column if not exists drainage_note text not null default '';
alter table public.properties add column if not exists area_note text not null default '';

alter table public.properties drop constraint if exists properties_water_supply_check;
alter table public.properties add constraint properties_water_supply_check
  check (water_supply in ('', 'gwi', 'well', 'both', 'none'));

alter table public.properties drop constraint if exists properties_electricity_check;
alter table public.properties add constraint properties_electricity_check
  check (electricity in ('', 'gpl', 'generator', 'both', 'none'));

alter table public.properties drop constraint if exists properties_road_access_check;
alter table public.properties add constraint properties_road_access_check
  check (road_access in ('', 'paved', 'unpaved'));
