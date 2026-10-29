-- GUYANA KEYS VERIFY, Phase 2a, step 1 of 2. Boss runs this. Do not run it from the app.
-- Run order: after supabase/phase1-market.sql, and BEFORE the Phase 2a code is merged.
-- Then merge and deploy. Then run supabase/phase2a-drop-plain-id.sql (step 2).
-- Safe to run more than once. Free plan only: pgcrypto, grants and triggers. Nothing paid.
--
-- What it does:
--   1. keys_checks gets id_number_hmac (keyed HMAC-SHA256, hex) and id_number_last3.
--   2. Existing plain id_number values are backfilled into those columns.
--   3. The duplicate-number flag moves to id_number_hmac.
--   4. The storage policy that let a signed-in user write straight into the
--      identity-documents bucket is removed. Uploads go through a signed URL from the server.
--   5. audit_events becomes append-only: no UPDATE, DELETE or TRUNCATE for any app role,
--      and a trigger refuses them for everyone, including the table owner.
--
-- The HMAC key: the same value as the Vercel env var ID_NUMBER_HMAC_KEY (at least 32 characters).
-- It is only needed when rows with a plain id_number exist. Never save it in this file.
-- psql:          psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "set gk.id_number_hmac_key = '<key>'" -f supabase/phase2a-verify.sql
--                (or: set it with PGOPTIONS="-c gk.id_number_hmac_key=<key>")
-- SQL editor:    add this as the first line for this run only, and do not save the snippet:
--                select set_config('gk.id_number_hmac_key', '<key>', false);
-- If rows need a backfill and the key is missing, the file stops and changes nothing.

begin;

create extension if not exists pgcrypto;
set local search_path = public, extensions;

alter table public.keys_checks add column if not exists id_number_hmac text not null default '';
alter table public.keys_checks add column if not exists id_number_last3 text not null default '';
alter table public.keys_checks drop constraint if exists keys_checks_id_number_hmac_check;
alter table public.keys_checks add constraint keys_checks_id_number_hmac_check
  check (id_number_hmac = '' or id_number_hmac ~ '^[0-9a-f]{64}$');
alter table public.keys_checks drop constraint if exists keys_checks_id_number_last3_check;
alter table public.keys_checks add constraint keys_checks_id_number_last3_check
  check (char_length(id_number_last3) <= 3);
comment on column public.keys_checks.id_number_hmac is 'HMAC-SHA256 of the upper-case ID number with spaces removed. Key: env ID_NUMBER_HMAC_KEY. Used for duplicate checks only.';
comment on column public.keys_checks.id_number_last3 is 'Last 3 characters of the ID number, for the reviewer.';
create index if not exists keys_checks_id_number_hmac_idx on public.keys_checks (id_number_hmac) where id_number_hmac <> '';

-- Backfill. Same normalisation as src/lib/id-number.ts.
do $backfill$
declare
  key text := coalesce(current_setting('gk.id_number_hmac_key', true), '');
  pending integer := 0;
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'keys_checks' and column_name = 'id_number') then
    execute 'select count(*) from public.keys_checks where id_number <> '''' and id_number_hmac = '''''
      into pending;
    if pending > 0 and char_length(key) < 32 then
      raise exception 'Phase 2a: % row(s) need the HMAC key. Set gk.id_number_hmac_key to the ID_NUMBER_HMAC_KEY value (32+ characters) for this run.', pending;
    end if;
    if pending > 0 then
      execute $sql$
        update public.keys_checks
        set id_number_hmac = encode(hmac(left(upper(regexp_replace(btrim(id_number), '\s+', '', 'g')), 40), $1, 'sha256'), 'hex'),
            id_number_last3 = right(left(upper(regexp_replace(btrim(id_number), '\s+', '', 'g')), 40), 3)
        where id_number <> '' and id_number_hmac = ''
      $sql$ using key;
    end if;
    raise notice 'Phase 2a: backfilled % row(s).', pending;
  end if;
end
$backfill$;

-- Duplicate flag on the hash. The plain-number trigger is removed.
create or replace function private.flag_duplicate_id_number_hmac()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id_number_hmac <> '' and exists (
    select 1 from public.keys_checks
    where id_number_hmac = new.id_number_hmac
      and agent_id is distinct from new.agent_id
      and id is distinct from new.id
  ) then
    insert into public.keys_check_flags (id, agent_id, check_id, flag, detail)
    values ('idn-' || new.id, new.agent_id, new.id, 'duplicate_id_number', 'same id number hash on another account')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.flag_duplicate_id_number_hmac() from public, anon, authenticated;

drop trigger if exists flag_duplicate_id_number on public.keys_checks;
drop trigger if exists flag_duplicate_id_number_hmac on public.keys_checks;
create trigger flag_duplicate_id_number_hmac
after insert or update of id_number_hmac on public.keys_checks
for each row execute function private.flag_duplicate_id_number_hmac();

-- Flag rows that already share a hash (from the backfill).
insert into public.keys_check_flags (id, agent_id, check_id, flag, detail)
select 'idn-' || later.id, later.agent_id, later.id, 'duplicate_id_number', 'same id number hash on another account'
from public.keys_checks later
where later.id_number_hmac <> ''
  and exists (
    select 1 from public.keys_checks other
    where other.id_number_hmac = later.id_number_hmac
      and other.agent_id is distinct from later.agent_id
      and other.created_at <= later.created_at
      and other.id <> later.id
  )
on conflict (id) do nothing;

-- Agents read the last 3 characters of their own row, never the hash, and can no longer
-- read or write the plain number. The app writes these columns with the service role.
revoke select (id_number_hmac) on table public.keys_checks from public, anon, authenticated;
revoke insert (id_number_hmac, id_number_last3), update (id_number_hmac, id_number_last3) on table public.keys_checks from public, anon, authenticated;
grant select (id_number_last3) on table public.keys_checks to authenticated;
do $plain$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'keys_checks' and column_name = 'id_number') then
    execute 'revoke select (id_number), insert (id_number), update (id_number) on table public.keys_checks from public, anon, authenticated';
  end if;
end
$plain$;

-- Storage: no direct insert into identity-documents by a signed-in user.
do $storage$
begin
  if to_regclass('storage.objects') is not null then
    begin
      execute 'drop policy if exists identity_documents_own_insert on storage.objects';
    exception when others then
      raise notice 'Remove the identity_documents_own_insert policy in the Supabase dashboard (Storage > Policies).';
    end;
  end if;
end
$storage$;

-- Audit log: append-only.
create or replace function private.audit_events_append_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'audit_events is append-only (% refused)', tg_op;
end;
$$;

revoke all on function private.audit_events_append_only() from public, anon, authenticated;

revoke update, delete, truncate on table public.audit_events from public, anon, authenticated;
do $audit$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke update, delete, truncate on table public.audit_events from service_role';
    execute 'grant select, insert on table public.audit_events to service_role';
  end if;
end
$audit$;

drop trigger if exists audit_events_no_update on public.audit_events;
create trigger audit_events_no_update
before update or delete on public.audit_events
for each row execute function private.audit_events_append_only();

drop trigger if exists audit_events_no_truncate on public.audit_events;
create trigger audit_events_no_truncate
before truncate on public.audit_events
for each statement execute function private.audit_events_append_only();

commit;
