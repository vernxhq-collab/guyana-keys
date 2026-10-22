-- Founding agents and message drafts. Listings are free to list, with no limits.
-- Additive and safe to run more than once. Does not delete rows.
-- Do not run until Boss approves. Service role bypasses RLS; the cap trigger still fires.

begin;

alter table public.profiles add column if not exists founding_agent boolean not null default false;
alter table public.properties add column if not exists owner_permission boolean not null default false;
alter table public.properties add column if not exists price_reduced boolean not null default false;

create table if not exists public.agent_applications (
  id text primary key,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  company text not null default '',
  areas text not null default '',
  message text not null default '',
  status text not null default 'submitted',
  id_checked boolean not null default false,
  licence_checked boolean not null default false,
  phone_checked boolean not null default false,
  reference_checked boolean not null default false,
  notes text not null default '',
  profile_id uuid,
  created_at timestamptz not null default now()
);

alter table public.agent_applications add column if not exists name text not null default '';
alter table public.agent_applications add column if not exists email text not null default '';
alter table public.agent_applications add column if not exists phone text not null default '';
alter table public.agent_applications add column if not exists company text not null default '';
alter table public.agent_applications add column if not exists areas text not null default '';
alter table public.agent_applications add column if not exists message text not null default '';
alter table public.agent_applications add column if not exists status text not null default 'submitted';
alter table public.agent_applications add column if not exists id_checked boolean not null default false;
alter table public.agent_applications add column if not exists licence_checked boolean not null default false;
alter table public.agent_applications add column if not exists phone_checked boolean not null default false;
alter table public.agent_applications add column if not exists reference_checked boolean not null default false;
alter table public.agent_applications add column if not exists notes text not null default '';
alter table public.agent_applications add column if not exists profile_id uuid;
alter table public.agent_applications add column if not exists created_at timestamptz not null default now();

alter table public.agent_applications drop constraint if exists agent_applications_status_check;
alter table public.agent_applications add constraint agent_applications_status_check check (status in ('submitted', 'approved', 'declined'));

create table if not exists public.message_drafts (
  id text primary key,
  agent_id uuid,
  enquiry_id text,
  channel text not null default 'email',
  body text not null default '',
  status text not null default 'draft',
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.message_drafts drop constraint if exists message_drafts_channel_check;
alter table public.message_drafts add constraint message_drafts_channel_check check (channel in ('email', 'whatsapp'));
alter table public.message_drafts drop constraint if exists message_drafts_status_check;
alter table public.message_drafts add constraint message_drafts_status_check check (status in ('draft', 'approved', 'sent'));

create table if not exists public.lead_activity (
  id text primary key,
  agent_id uuid,
  enquiry_id text,
  kind text not null default 'note',
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.follow_up_tasks (
  id text primary key,
  agent_id uuid,
  enquiry_id text,
  title text not null default '',
  due_on date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.event_outbox (
  id text primary key,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.event_outbox drop constraint if exists event_outbox_status_check;
alter table public.event_outbox add constraint event_outbox_status_check check (status in ('pending', 'done', 'failed'));

alter table public.agent_applications enable row level security;
alter table public.message_drafts enable row level security;
alter table public.lead_activity enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.event_outbox enable row level security;

revoke all on table public.agent_applications from public, anon, authenticated;
revoke all on table public.message_drafts from public, anon, authenticated;
revoke all on table public.lead_activity from public, anon, authenticated;
revoke all on table public.follow_up_tasks from public, anon, authenticated;
revoke all on table public.event_outbox from public, anon, authenticated;

-- Listings are free to list, with no limits. Replace any older count check with a no-op,
-- then remove the trigger and the restrictive policies. Safe to run more than once.
create or replace function private.enforce_live_listing_cap()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  return new;
end;
$$;

revoke all on function private.enforce_live_listing_cap() from public, anon, authenticated;

drop trigger if exists enforce_live_listing_cap on public.properties;
drop policy if exists properties_live_cap on public.properties;
drop policy if exists properties_live_cap_update on public.properties;

create or replace function private.guard_message_draft()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status is distinct from 'draft' then
    raise exception 'new messages start as drafts';
  end if;
  if tg_op = 'UPDATE' and new.status = 'sent' and old.status is distinct from 'approved' and old.status is distinct from 'sent' then
    raise exception 'a draft must be approved before it is sent';
  end if;
  if tg_op = 'UPDATE' and new.status = 'approved' and old.status = 'draft' then
    new.approved_at := coalesce(new.approved_at, now());
  end if;
  if tg_op = 'UPDATE' and new.status = 'sent' and old.status is distinct from 'sent' then
    new.sent_at := coalesce(new.sent_at, now());
  end if;
  return new;
end;
$$;

revoke all on function private.guard_message_draft() from public, anon, authenticated;

drop trigger if exists guard_message_draft on public.message_drafts;
create trigger guard_message_draft
before insert or update on public.message_drafts
for each row execute function private.guard_message_draft();

commit;
