-- Guyana listing details. Every column is nullable. Safe to run more than once.
-- Boss runs this on the project. The app still loads and saves listings if these columns are missing.

alter table public.properties add column if not exists generator text;
alter table public.properties add column if not exists water_tank text;
alter table public.properties add column if not exists water_notes text;
alter table public.properties add column if not exists parking text;
alter table public.properties add column if not exists parking_spaces integer;
alter table public.properties add column if not exists flood_risk text;
alter table public.properties add column if not exists furnished text;

alter table public.properties drop constraint if exists properties_generator_check;
alter table public.properties add constraint properties_generator_check
  check (generator is null or generator in ('yes', 'no', 'unknown'));

alter table public.properties drop constraint if exists properties_water_tank_check;
alter table public.properties add constraint properties_water_tank_check
  check (water_tank is null or water_tank in ('yes', 'no'));

alter table public.properties drop constraint if exists properties_parking_check;
alter table public.properties add constraint properties_parking_check
  check (parking is null or parking in ('none', 'street', 'yard', 'garage'));

alter table public.properties drop constraint if exists properties_parking_spaces_check;
alter table public.properties add constraint properties_parking_spaces_check
  check (parking_spaces is null or parking_spaces >= 0);

alter table public.properties drop constraint if exists properties_flood_risk_check;
alter table public.properties add constraint properties_flood_risk_check
  check (flood_risk is null or flood_risk in ('low', 'some', 'high', 'unknown'));

alter table public.properties drop constraint if exists properties_furnished_check;
alter table public.properties add constraint properties_furnished_check
  check (furnished is null or furnished in ('unfurnished', 'partly', 'furnished', 'unknown'));
