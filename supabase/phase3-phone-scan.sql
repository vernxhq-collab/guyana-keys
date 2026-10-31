-- GUYANA KEYS phone scan. Boss runs this. Do not run it from the app.
-- Run after supabase/phase2a-verify.sql. Safe to run more than once. Free plan only.
--
-- What it does:
--   1. phone_scan_tokens stores only the hash of a single-use phone link (10 minutes in the app).
--   2. keys_checks gains scan_name, scan_expiry, and scan_flags.
--      scan_flags is a hint for the reviewer. It never approves a check.
--      The plain ID number is not added back.

begin;

create table if not exists public.phone_scan_tokens (
  id text primary key,
  agent_id uuid not null,
  token_hash text not null,
  session_hash text not null default '',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.phone_scan_tokens drop constraint if exists phone_scan_tokens_token_hash_check;
alter table public.phone_scan_tokens add constraint phone_scan_tokens_token_hash_check
  check (token_hash ~ '^[0-9a-f]{64}$');
alter table public.phone_scan_tokens drop constraint if exists phone_scan_tokens_session_hash_check;
alter table public.phone_scan_tokens add constraint phone_scan_tokens_session_hash_check
  check (session_hash = '' or session_hash ~ '^[0-9a-f]{64}$');

create unique index if not exists phone_scan_tokens_token_hash_idx on public.phone_scan_tokens (token_hash);

alter table public.phone_scan_tokens enable row level security;
revoke all on table public.phone_scan_tokens from public, anon, authenticated;

do $role$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, insert, update on table public.phone_scan_tokens to service_role';
  end if;
end
$role$;

comment on table public.phone_scan_tokens is 'Hashed single-use links that open Keys Check on a phone. The raw token is never stored.';

alter table public.keys_checks add column if not exists scan_name text not null default '';
alter table public.keys_checks add column if not exists scan_expiry text not null default '';
alter table public.keys_checks add column if not exists scan_flags text not null default '';

alter table public.keys_checks drop constraint if exists keys_checks_scan_expiry_check;
alter table public.keys_checks add constraint keys_checks_scan_expiry_check
  check (scan_expiry = '' or scan_expiry ~ '^\d{4}-\d{2}-\d{2}$');

alter table public.keys_checks drop constraint if exists keys_checks_scan_flags_check;
alter table public.keys_checks add constraint keys_checks_scan_flags_check
  check (
    scan_flags = ''
    or scan_flags ~ '^(scan_unread|scan_checksum|scan_expired|scan_mismatch)(,(scan_unread|scan_checksum|scan_expired|scan_mismatch))*$'
  );

revoke select (scan_name, scan_expiry, scan_flags), update (scan_name, scan_expiry, scan_flags)
  on table public.keys_checks from public, anon, authenticated;

comment on column public.keys_checks.scan_name is 'Name the agent confirmed. The on-device reading is not stored.';
comment on column public.keys_checks.scan_expiry is 'Expiry date the agent confirmed, YYYY-MM-DD.';
comment on column public.keys_checks.scan_flags is 'Hints from on-device reading. A person still decides. Never an approval.';

commit;
