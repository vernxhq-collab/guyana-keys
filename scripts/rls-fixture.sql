-- Local stand-in for the Supabase roles. Not production. Not applied anywhere but CI.
-- Builds the tables p0-rls.sql checks, then the attack script runs as a buyer.

create schema if not exists auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.role', true), '')
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;

create table if not exists public.profiles (
  id uuid primary key,
  email text not null default '',
  name text not null default '',
  role text not null default 'buyer',
  plan text not null default 'starter',
  listing_cap integer not null default 3,
  suspended boolean not null default false,
  verified boolean not null default false,
  gra_licence text not null default ''
);

create table if not exists public.properties (
  id text primary key,
  agent_id uuid,
  title text not null default '',
  status text not null default 'hidden',
  featured boolean not null default false
);

create table if not exists public.enquiries (
  id text primary key,
  property_id text,
  buyer_id uuid,
  agent_id uuid,
  stage text not null default 'new',
  agent_reply text not null default '',
  private_note text not null default '',
  score text,
  next_step text not null default '',
  viewing_at timestamptz,
  source text not null default 'guyana_keys',
  intent text not null default ''
);

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid,
  actor_id uuid,
  action text not null,
  detail text not null default ''
);

create table if not exists public.listing_stats (
  property_id text primary key,
  views integer not null default 0,
  saves integer not null default 0
);

create table if not exists public.buyer_needs (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid,
  area text
);

create table if not exists public.outbox (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid,
  body text not null,
  status text not null default 'held'
);

insert into public.agencies (id, name)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Demerara Homes')
on conflict (id) do nothing;

insert into public.profiles (id, email, role, verified)
values
  ('11111111-1111-4111-8111-111111111111', 'buyer@example.com', 'buyer', false),
  ('22222222-2222-4222-8222-222222222222', 'agent@example.com', 'agent', false)
on conflict (id) do nothing;

insert into public.properties (id, agent_id, title, status, featured)
values
  ('home-1', '22222222-2222-4222-8222-222222222222', 'Bel Air house', 'live', false),
  ('home-hidden', '22222222-2222-4222-8222-222222222222', 'Draft house', 'hidden', false)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.enquiries enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert on public.enquiries to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists properties_agent_read on public.properties;
create policy properties_agent_read on public.properties
for select to authenticated using (agent_id = auth.uid() or status = 'live');

drop policy if exists properties_agent_update on public.properties;
create policy properties_agent_update on public.properties
for update to authenticated using (agent_id = auth.uid()) with check (agent_id = auth.uid());

drop policy if exists enquiries_buyer_select on public.enquiries;
create policy enquiries_buyer_select on public.enquiries
for select to authenticated using (buyer_id = auth.uid());
