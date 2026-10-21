-- Phase 2. Do not run against production until approved.

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
