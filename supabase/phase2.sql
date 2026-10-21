-- DO NOT RUN. Not applied. Not part of any deploy.
-- Row security below denies everyone except the table owner.
-- supabase/p0-rls.sql locks these tables again if they exist. Do not run this on production.

create table if not exists listing_stats (
  property_id text primary key,
  views integer not null default 0,
  saves integer not null default 0
);

create table if not exists buyer_needs (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid,
  purpose text,
  area text,
  beds integer not null default 0,
  max_price bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists outbox (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid,
  lead_id text,
  channel text not null,
  body text not null,
  status text not null default 'held',
  created_at timestamptz not null default now()
);

alter table listing_stats enable row level security;
alter table buyer_needs enable row level security;
alter table outbox enable row level security;
revoke all on table listing_stats from public;
revoke all on table buyer_needs from public;
revoke all on table outbox from public;

do $lock$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table listing_stats from anon;
    revoke all on table buyer_needs from anon;
    revoke all on table outbox from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table listing_stats from authenticated;
    revoke all on table buyer_needs from authenticated;
    revoke all on table outbox from authenticated;
  end if;
end
$lock$;
