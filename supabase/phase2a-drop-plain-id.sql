-- GUYANA KEYS VERIFY, Phase 2a, step 2 of 2. Boss runs this. Do not run it from the app.
-- Run order: AFTER supabase/phase2a-verify.sql AND after the Phase 2a code is merged and
-- live, so no running code still writes the plain id_number.
-- It backfills any row written by the old code in between, then drops the plain column.
-- This cannot be undone: the plain numbers are gone afterwards. Safe to run more than once.
-- The HMAC key is set the same way as in step 1 (gk.id_number_hmac_key), only if rows need it.

begin;

create extension if not exists pgcrypto;
set local search_path = public, extensions;

do $drop$
declare
  key text := coalesce(current_setting('gk.id_number_hmac_key', true), '');
  pending integer := 0;
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'keys_checks' and column_name = 'id_number_hmac') then
    raise exception 'Run supabase/phase2a-verify.sql first.';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'keys_checks' and column_name = 'id_number') then
    raise notice 'Phase 2a: the plain id_number column is already gone.';
    return;
  end if;
  execute 'select count(*) from public.keys_checks where id_number <> '''' and id_number_hmac = '''''
    into pending;
  if pending > 0 and char_length(key) < 32 then
    raise exception 'Phase 2a: % row(s) need the HMAC key. Set gk.id_number_hmac_key for this run.', pending;
  end if;
  if pending > 0 then
    execute $sql$
      update public.keys_checks
      set id_number_hmac = encode(hmac(left(upper(regexp_replace(btrim(id_number), '\s+', '', 'g')), 40), $1, 'sha256'), 'hex'),
          id_number_last3 = right(left(upper(regexp_replace(btrim(id_number), '\s+', '', 'g')), 40), 3)
      where id_number <> '' and id_number_hmac = ''
    $sql$ using key;
  end if;
  execute 'drop trigger if exists flag_duplicate_id_number on public.keys_checks';
  execute 'alter table public.keys_checks drop column id_number';
  raise notice 'Phase 2a: backfilled % row(s) and dropped the plain id_number column.', pending;
end
$drop$;

drop function if exists private.flag_duplicate_id_number();

commit;
