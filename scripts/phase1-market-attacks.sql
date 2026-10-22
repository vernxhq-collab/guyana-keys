-- Runs after supabase/phase1-market.sql. Safe to run more than once.

delete from public.agent_licences where id in ('lic-expire', 'lic-bad');
delete from public.partners where id = 'partner-hidden';

insert into public.agent_licences (id, agent_id, licence_type, check_status, expiry_date)
values ('lic-expire', '22222222-2222-4222-8222-222222222222', 'gra_house_agent', 'checked', current_date - 1);

do $$
begin
  if not exists (
    select 1 from public.agent_licences where id = 'lic-expire' and check_status = 'expired'
  ) then
    raise exception 'an expired licence stayed checked';
  end if;
  begin
    insert into public.agent_licences (id, agent_id, licence_type)
    values ('lic-bad', '22222222-2222-4222-8222-222222222222', 'made_up');
    raise exception 'a bad licence type was stored';
  exception when check_violation then
    null;
  end;
end $$;

insert into public.partners (id, name, category)
values ('partner-hidden', 'Hidden partner', 'lawyer')
on conflict (id) do update set consent_to_list = false;

do $$
begin
  if exists (select 1 from public.partners where id = 'partner-hidden' and consent_to_list) then
    raise exception 'a partner was listed without consent';
  end if;
  if not exists (select 1 from public.mortgage_rates where id = 'gbti-4m' and rate = 3.5) then
    raise exception 'the checked GBTI rate is missing';
  end if;
  if exists (select 1 from public.mortgage_rates where bank ilike '%republic%') then
    raise exception 'an unverified Republic Bank rate was stored';
  end if;
  if has_table_privilege('anon', 'public.id_documents', 'select')
    or has_table_privilege('authenticated', 'public.id_documents', 'select') = false
  then
    if has_table_privilege('anon', 'public.id_documents', 'select') then
      raise exception 'anon can read identity documents';
    end if;
  end if;
  if has_table_privilege('anon', 'public.id_documents', 'select') then
    raise exception 'anon can read identity documents';
  end if;
end $$;

delete from public.agent_licences where id = 'lic-expire';
delete from public.partners where id = 'partner-hidden';

delete from public.keys_check_flags where id in ('flg-doc-b', 'idn-chk-b');
delete from public.id_documents where id in ('doc-a', 'doc-b');
delete from public.keys_checks where id in ('chk-a', 'chk-b');

insert into public.id_documents (id, agent_id, kind, storage_path, consent_version, consent_at, sha256)
values
  ('doc-a', '22222222-2222-4222-8222-222222222222', 'id_front', '22222222-2222-4222-8222-222222222222/a.jpg', '2026-10-22-keys', now(), 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
  ('doc-b', '33333333-3333-4333-8333-333333333333', 'id_front', '33333333-3333-4333-8333-333333333333/b.jpg', '2026-10-22-keys', now(), 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

insert into public.keys_checks (id, agent_id, id_number)
values
  ('chk-a', '22222222-2222-4222-8222-222222222222', 'ID-100'),
  ('chk-b', '33333333-3333-4333-8333-333333333333', 'ID-100');

do $$
begin
  if not exists (select 1 from public.keys_check_flags where id = 'flg-doc-b' and flag = 'duplicate_file') then
    raise exception 'the same file hash was not flagged';
  end if;
  if not exists (select 1 from public.keys_check_flags where id = 'idn-chk-b' and flag = 'duplicate_id_number') then
    raise exception 'the same id number was not flagged';
  end if;
  if not exists (
    select 1 from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'private'
      and pg_proc.proname in ('flag_duplicate_id_file', 'flag_duplicate_id_number')
      and pg_proc.prosecdef
    having count(*) = 2
  ) then
    raise exception 'duplicate flags do not run with definer rights';
  end if;
  begin
    insert into public.keys_checks (id, agent_id, provider)
    values ('chk-bad', '22222222-2222-4222-8222-222222222222', 'didit');
    raise exception 'a third-party provider was stored';
  exception when check_violation then
    null;
  end;
end $$;

delete from public.keys_check_flags where id in ('flg-doc-b', 'idn-chk-b');
delete from public.id_documents where id in ('doc-a', 'doc-b');
delete from public.keys_checks where id in ('chk-a', 'chk-b');
