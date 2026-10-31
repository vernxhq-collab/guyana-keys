-- Runs after supabase/phase3-phone-scan.sql. Synthetic ids only. Safe to run more than once.

delete from public.phone_scan_tokens where id in ('p3-ok', 'p3-bad');
delete from public.keys_checks where id = 'p3-1';

insert into public.keys_checks (id, agent_id, scan_name, scan_expiry, scan_flags)
values ('p3-1', '22222222-2222-4222-8222-222222222222', 'SAMPLE', '2028-04-01', 'scan_expired');

do $$
declare
  failed boolean;
begin
  if not exists (select 1 from public.keys_checks where id = 'p3-1' and scan_flags = 'scan_expired' and scan_expiry = '2028-04-01') then
    raise exception 'the scan columns were not stored';
  end if;

  failed := false;
  begin
    update public.keys_checks set scan_flags = 'approved' where id = 'p3-1';
  exception when check_violation then
    failed := true;
  end;
  if not failed then raise exception 'an approval flag was stored'; end if;

  failed := false;
  begin
    insert into public.phone_scan_tokens (id, agent_id, token_hash, expires_at)
    values ('p3-bad', '22222222-2222-4222-8222-222222222222', 'short', now() + interval '10 minutes');
  exception when check_violation then
    failed := true;
  end;
  if not failed then raise exception 'a short token hash was stored'; end if;

  if has_table_privilege('anon', 'public.phone_scan_tokens', 'SELECT')
    or has_table_privilege('authenticated', 'public.phone_scan_tokens', 'SELECT')
    or has_table_privilege('authenticated', 'public.phone_scan_tokens', 'INSERT') then
    raise exception 'a public role can touch phone links';
  end if;

  if has_column_privilege('authenticated', 'public.keys_checks', 'scan_flags', 'SELECT')
    or has_column_privilege('authenticated', 'public.keys_checks', 'scan_name', 'UPDATE')
    or has_column_privilege('anon', 'public.keys_checks', 'scan_expiry', 'SELECT') then
    raise exception 'a signed-in user can read or write scan notes';
  end if;
end $$;

do $$
begin
  set local role service_role;
  insert into public.phone_scan_tokens (id, agent_id, token_hash, expires_at)
  values ('p3-ok', '22222222-2222-4222-8222-222222222222', repeat('ab', 32), now() + interval '10 minutes');
  reset role;
  if not exists (select 1 from public.phone_scan_tokens where id = 'p3-ok' and used_at is null) then
    raise exception 'the service role did not store the phone link';
  end if;
end $$;

delete from public.phone_scan_tokens where id in ('p3-ok', 'p3-bad');
delete from public.keys_checks where id = 'p3-1';
