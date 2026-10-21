-- Phase 1 schema. Do not run against production until approved.
-- Safe to re-run. Does not drop existing tables.

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
