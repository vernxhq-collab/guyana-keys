-- Runs after supabase/phase2a-verify.sql, with scripts/phase2a-seed.sql run before it.
-- CI key for the backfill (synthetic, not a secret): phase2a-ci-synthetic-key-not-a-secret-0000
-- Expected values were computed in Node with createHmac('sha256', key).
-- Safe to run more than once, before or after supabase/phase2a-drop-plain-id.sql.

delete from public.keys_check_flags where id in ('idn-p2a-3');
delete from public.keys_checks where id in ('p2a-3');

do $$
declare
  syn1 constant text := '0231731779c8419ba1f0ac69f4a882bc9122836b86c4f78c8f05fdea72241839';
  failed boolean;
begin
  -- Backfill matches the app's HMAC and normalisation.
  if not exists (select 1 from public.keys_checks where id = 'p2a-1' and id_number_hmac = syn1 and id_number_last3 = '001') then
    raise exception 'backfill hash or last 3 does not match the app';
  end if;
  if not exists (select 1 from public.keys_checks where id = 'p2a-2' and id_number_hmac = syn1) then
    raise exception 'backfill missed a row';
  end if;
  if not exists (select 1 from public.keys_check_flags where id = 'idn-p2a-2' and flag = 'duplicate_id_number') then
    raise exception 'a shared hash from the backfill was not flagged';
  end if;

  -- New rows are flagged on the hash.
  insert into public.keys_checks (id, agent_id, id_number_hmac, id_number_last3)
  values ('p2a-3', '44444444-4444-4444-8444-444444444444', syn1, '001');
  if not exists (select 1 from public.keys_check_flags where id = 'idn-p2a-3' and flag = 'duplicate_id_number') then
    raise exception 'a new shared hash was not flagged';
  end if;

  failed := false;
  begin
    update public.keys_checks set id_number_hmac = 'not-a-hash' where id = 'p2a-3';
  exception when check_violation then
    failed := true;
  end;
  if not failed then raise exception 'a malformed hash was stored'; end if;

  -- Only the old trigger is gone; the new one is in place.
  if exists (select 1 from pg_trigger where tgname = 'flag_duplicate_id_number' and tgrelid = 'public.keys_checks'::regclass) then
    raise exception 'the plain-number trigger is still on keys_checks';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'flag_duplicate_id_number_hmac' and tgrelid = 'public.keys_checks'::regclass) then
    raise exception 'the hash trigger is missing';
  end if;

  -- Agents never see the hash and cannot touch the number columns.
  if has_column_privilege('authenticated', 'public.keys_checks', 'id_number_hmac', 'SELECT')
    or has_column_privilege('anon', 'public.keys_checks', 'id_number_hmac', 'SELECT') then
    raise exception 'a signed-in user can read id_number_hmac';
  end if;
  if has_column_privilege('authenticated', 'public.keys_checks', 'id_number_hmac', 'INSERT')
    or has_column_privilege('authenticated', 'public.keys_checks', 'id_number_hmac', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'id_number_last3', 'UPDATE') then
    raise exception 'a signed-in user can write the hashed number';
  end if;
  if not has_column_privilege('authenticated', 'public.keys_checks', 'id_number_last3', 'SELECT') then
    raise exception 'agents lost the last 3 characters of their own number';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'keys_checks' and column_name = 'id_number') then
    if has_column_privilege('authenticated', 'public.keys_checks', 'id_number', 'SELECT')
      or has_column_privilege('authenticated', 'public.keys_checks', 'id_number', 'UPDATE')
      or has_column_privilege('authenticated', 'public.keys_checks', 'id_number', 'INSERT') then
      raise exception 'a signed-in user can still read or write the plain id_number';
    end if;
  end if;

  -- Storage: the direct-insert policy is gone.
  if to_regclass('storage.objects') is not null and exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'identity_documents_own_insert'
  ) then
    raise exception 'the identity_documents_own_insert policy still exists';
  end if;
end $$;

-- Audit log is append-only.
insert into public.audit_events (action, detail) values ('phase2a_attack_probe', 'synthetic');

do $$
declare
  failed boolean;
begin
  failed := false;
  begin
    update public.audit_events set detail = 'changed' where action = 'phase2a_attack_probe';
  exception when others then failed := sqlerrm like '%append-only%';
  end;
  if not failed then raise exception 'the owner updated an audit row'; end if;

  failed := false;
  begin
    delete from public.audit_events where action = 'phase2a_attack_probe';
  exception when others then failed := sqlerrm like '%append-only%';
  end;
  if not failed then raise exception 'the owner deleted an audit row'; end if;

  failed := false;
  begin
    truncate public.audit_events;
  exception when others then failed := sqlerrm like '%append-only%';
  end;
  if not failed then raise exception 'the owner truncated the audit log'; end if;

  foreach failed in array array[false] loop null; end loop;

  if has_table_privilege('service_role', 'public.audit_events', 'UPDATE')
    or has_table_privilege('service_role', 'public.audit_events', 'DELETE')
    or has_table_privilege('service_role', 'public.audit_events', 'TRUNCATE') then
    raise exception 'the service role can change audit rows';
  end if;
  if not has_table_privilege('service_role', 'public.audit_events', 'INSERT') then
    raise exception 'the service role cannot write audit rows';
  end if;
  if has_table_privilege('authenticated', 'public.audit_events', 'INSERT')
    or has_table_privilege('authenticated', 'public.audit_events', 'UPDATE')
    or has_table_privilege('anon', 'public.audit_events', 'SELECT') then
    raise exception 'a public role can touch the audit log';
  end if;
  if (select count(*) from public.audit_events where action = 'phase2a_attack_probe' and detail = 'synthetic') < 1 then
    raise exception 'the audit probe row is missing';
  end if;
end $$;

-- The service role can insert but not change rows, as the app does.
do $$
declare
  failed boolean := false;
begin
  set local role service_role;
  insert into public.audit_events (action, detail) values ('phase2a_attack_probe', 'service role');
  begin
    update public.audit_events set detail = 'x' where action = 'phase2a_attack_probe';
  exception when insufficient_privilege then failed := true;
  end;
  reset role;
  if not failed then raise exception 'the service role updated an audit row'; end if;
end $$;

delete from public.keys_check_flags where id in ('idn-p2a-3');
delete from public.keys_checks where id in ('p2a-3');
