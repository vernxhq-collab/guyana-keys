-- DO NOT RUN. Not applied. Not part of any deploy.
-- These tables are not safe on their own. supabase/p0-rls.sql locks them if they exist.
-- Running this file without that lock leaves agencies and audit_events readable by the table owner only,
-- and a hosted default grant would expose them. Do not run it on production.

create table if not exists agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists agency_id uuid references agencies(id);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references agencies(id),
  actor_id uuid,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists audit_events_agency_idx on audit_events (agency_id, created_at desc);

alter table agencies enable row level security;
alter table audit_events enable row level security;
revoke all on table agencies from public;
revoke all on table audit_events from public;
