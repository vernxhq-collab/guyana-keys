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
delete from public.keys_checks where id in ('chk-a', 'chk-b', 'chk-tenant', 'chk-purchaser', 'chk-landlord', 'chk-guard', 'chk-submitted');

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
  if not exists (select 1 from public.keys_checks where id = 'chk-a' and subject_type = 'agent') then
    raise exception 'a keys check did not record the agent subject';
  end if;
  insert into public.keys_checks (id, agent_id, subject_type)
  values
    ('chk-tenant', '33333333-3333-4333-8333-333333333333', 'tenant'),
    ('chk-purchaser', '33333333-3333-4333-8333-333333333333', 'purchaser'),
    ('chk-landlord', '33333333-3333-4333-8333-333333333333', 'landlord');
  if (select count(*) from public.keys_checks where id in ('chk-tenant', 'chk-purchaser', 'chk-landlord')) <> 3 then
    raise exception 'tenant, purchaser, or landlord could not use the same check table';
  end if;
  begin
    insert into public.keys_checks (id, agent_id, provider)
    values ('chk-bad', '22222222-2222-4222-8222-222222222222', 'didit');
    raise exception 'a third-party provider was stored';
  exception when check_violation then
    null;
  end;
  begin
    insert into public.keys_checks (id, agent_id, subject_type)
    values ('chk-role', '22222222-2222-4222-8222-222222222222', 'employer');
    raise exception 'a subject outside the four roles was stored';
  exception when check_violation then
    null;
  end;
end $$;

-- An agent cannot write reviewer columns or change a decision, including on their own collecting row.
do $$
declare
  agent uuid := '22222222-2222-4222-8222-222222222222';
  failed boolean;
begin
  insert into public.keys_checks (id, agent_id, status, provider, subject_type, id_number)
  values ('chk-guard', agent, 'collecting', 'manual', 'agent', 'ID-GUARD');
  insert into public.keys_checks (id, agent_id, status, provider, subject_type, id_number, decision)
  values ('chk-submitted', agent, 'submitted', 'manual', 'agent', 'ID-SUBMITTED', '');

  if has_column_privilege('authenticated', 'public.keys_checks', 'face_matches', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'name_matches', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'code_matches', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'document_not_expired', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'licence_recorded', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'licence_expiry_ok', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'reviewer_notes', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'reviewer_name', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'reviewed_at', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'decision', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'decision_reason', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'decided_by', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'decided_at', 'UPDATE')
    or has_column_privilege('authenticated', 'public.keys_checks', 'status', 'UPDATE')
  then
    raise exception 'an agent can update a reviewer column';
  end if;
  if has_column_privilege('authenticated', 'public.keys_checks', 'id_number', 'UPDATE') = false
    or has_column_privilege('authenticated', 'public.keys_checks', 'id_kind', 'UPDATE') = false
    or has_column_privilege('authenticated', 'public.keys_checks', 'code', 'UPDATE') = false
    or has_column_privilege('authenticated', 'public.keys_checks', 'code_issued_at', 'UPDATE') = false
  then
    raise exception 'an agent cannot update their own upload reference while collecting';
  end if;
  if has_function_privilege('authenticated', 'private.guard_keys_check_write()', 'EXECUTE')
    or has_function_privilege('anon', 'private.guard_keys_check_write()', 'EXECUTE')
  then
    raise exception 'the keys check guard can be executed directly';
  end if;

  perform set_config('request.jwt.claim.sub', agent::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;

  failed := false;
  begin
    update public.keys_checks set face_matches = true where id = 'chk-guard';
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'an agent set face_matches on their own collecting row';
  end if;

  failed := false;
  begin
    update public.keys_checks set name_matches = true, code_matches = true, reviewer_notes = 'forged', reviewer_name = 'agent' where id = 'chk-guard';
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'an agent set reviewer notes on their own collecting row';
  end if;

  failed := false;
  begin
    update public.keys_checks set decision = 'approved', decision_reason = 'forged', decided_by = 'agent' where id = 'chk-guard';
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'an agent changed the decision on their own collecting row';
  end if;

  failed := false;
  begin
    update public.keys_checks set status = 'approved' where id = 'chk-guard';
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'an agent moved their own check out of collecting';
  end if;

  failed := false;
  begin
    update public.keys_checks set decision = 'approved' where id = 'chk-submitted';
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'an agent changed the decision on a submitted row';
  end if;

  failed := false;
  begin
    insert into public.keys_checks (id, agent_id, status, decision)
    values ('chk-forged', agent, 'collecting', 'approved');
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'an agent inserted a decision';
  end if;

  update public.keys_checks
  set id_number = 'ID-GUARD-OK', id_kind = 'passport'
  where id = 'chk-guard';
  reset role;

  if not exists (
    select 1 from public.keys_checks
    where id = 'chk-guard'
      and id_number = 'ID-GUARD-OK'
      and id_kind = 'passport'
      and status = 'collecting'
      and face_matches is null
      and name_matches is null
      and code_matches is null
      and reviewer_notes = ''
      and reviewer_name = ''
      and decision = ''
      and decision_reason = ''
      and decided_by = ''
  ) then
    raise exception 'the allowed collecting update did not keep the review fields clear';
  end if;
  if exists (select 1 from public.keys_checks where id = 'chk-submitted' and decision <> '') then
    raise exception 'a submitted decision was changed';
  end if;
  if exists (select 1 from public.keys_checks where id = 'chk-forged') then
    raise exception 'a forged decision insert was stored';
  end if;

  delete from public.keys_checks where id in ('chk-guard', 'chk-submitted', 'chk-forged');
end $$;

delete from public.keys_check_flags where id in ('flg-doc-b', 'idn-chk-b');
delete from public.id_documents where id in ('doc-a', 'doc-b');
delete from public.keys_checks where id in ('chk-a', 'chk-b', 'chk-tenant', 'chk-purchaser', 'chk-landlord', 'chk-guard', 'chk-submitted');

delete from public.properties where id in ('cap-a', 'cap-b', 'cap-c', 'cap-d');

do $$
declare
  agent uuid := '22222222-2222-4222-8222-222222222222';
begin
  if exists (
    select 1 from pg_trigger
    where tgname = 'enforce_live_listing_cap' and not tgisinternal
  ) then
    raise exception 'the removed listing trigger is still installed';
  end if;
  if exists (
    select 1 from pg_policies
    where policyname in ('properties_live_cap', 'properties_live_cap_update')
  ) then
    raise exception 'the removed listing policy is still installed';
  end if;
  insert into public.properties (id, agent_id, title, status, featured)
  values
    ('cap-a', agent, 'Cap A', 'live', false),
    ('cap-b', agent, 'Cap B', 'live', false),
    ('cap-c', agent, 'Cap C', 'live', false),
    ('cap-d', agent, 'Cap D', 'live', false);
  if (select count(*) from public.properties where id in ('cap-a', 'cap-b', 'cap-c', 'cap-d') and status = 'live') <> 4 then
    raise exception 'a fourth live listing was blocked';
  end if;
end $$;

delete from public.properties where id in ('cap-a', 'cap-b', 'cap-c', 'cap-d');
