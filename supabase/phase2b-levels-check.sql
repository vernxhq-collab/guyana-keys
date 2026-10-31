-- Read-only check for Phase 2b. Boss can run this after supabase/phase2b-levels.sql.
-- It does not insert, update, or delete anything. Safe to run more than once.
-- If a check fails, the script stops.

do $$
declare
  cols text;
begin
  if not exists (select 1 from public.marketplaces where id = 'gy') then
    raise exception 'market gy is missing';
  end if;

  if to_regclass('public.verification_status') is null
     or to_regclass('public.verification_decisions') is null
     or to_regclass('public.appeals') is null
     or to_regclass('public.customer_reports') is null
     or to_regclass('public.reviewer_roles') is null
     or to_regclass('public.public_agent_badges') is null then
    raise exception 'a Phase 2b table or the public view is missing';
  end if;

  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'vf_decide')
     or not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'vf_licence_decide')
     or not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'vf_expire_due')
     or not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'vf_open_appeal')
     or not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'vf_decide_appeal') then
    raise exception 'a review function is missing';
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'verification_status_guard' and tgrelid = 'public.verification_status'::regclass)
     or not exists (select 1 from pg_trigger where tgname = 'verification_decisions_no_update' and tgrelid = 'public.verification_decisions'::regclass)
     or not exists (select 1 from pg_trigger where tgname = 'verification_decisions_no_truncate' and tgrelid = 'public.verification_decisions'::regclass)
     or not exists (select 1 from pg_trigger where tgname = 'verification_decisions_no_insert' and tgrelid = 'public.verification_decisions'::regclass)
     or not exists (select 1 from pg_trigger where tgname = 'keys_checks_decision_guard' and tgrelid = 'public.keys_checks'::regclass) then
    raise exception 'a Phase 2b trigger is missing';
  end if;

  select string_agg(column_name, ',' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'public_agent_badges';
  if cols is distinct from 'agent_id,level,badge_month' then
    raise exception 'public view columns are %', cols;
  end if;

  if pg_get_viewdef('public.public_agent_badges'::regclass) ~* 'storage_path|evidence_ref|id_number|hmac|decision_reason' then
    raise exception 'public view mentions a sensitive column';
  end if;

  if has_table_privilege('anon', 'public.verification_status', 'SELECT')
     or has_table_privilege('anon', 'public.verification_decisions', 'SELECT')
     or has_table_privilege('anon', 'public.appeals', 'SELECT')
     or has_table_privilege('anon', 'public.customer_reports', 'SELECT')
     or has_table_privilege('anon', 'public.id_documents', 'SELECT')
     or has_table_privilege('anon', 'public.keys_checks', 'SELECT') then
    raise exception 'anon can read a private table';
  end if;

  if has_table_privilege('authenticated', 'public.verification_status', 'INSERT')
     or has_table_privilege('authenticated', 'public.verification_status', 'UPDATE')
     or has_table_privilege('authenticated', 'public.verification_decisions', 'INSERT')
     or has_table_privilege('authenticated', 'public.verification_decisions', 'UPDATE')
     or has_table_privilege('service_role', 'public.verification_decisions', 'UPDATE')
     or has_table_privilege('service_role', 'public.verification_decisions', 'DELETE')
     or has_table_privilege('service_role', 'public.verification_status', 'UPDATE') then
    raise exception 'a role can write a level row outside the review functions';
  end if;

  if has_column_privilege('authenticated', 'public.id_documents', 'storage_path', 'SELECT')
     or has_column_privilege('authenticated', 'public.verification_decisions', 'evidence_ref', 'SELECT')
     or has_column_privilege('authenticated', 'public.appeals', 'senior_reviewer_id', 'SELECT') then
    raise exception 'an agent can read a file path or a hidden column';
  end if;

  if has_function_privilege('anon', 'public.vf_decide(uuid,text,text,text,text,text,uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.vf_decide(uuid,text,text,text,text,text,uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.vf_licence_decide(uuid,uuid,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.vf_expire_due(uuid)', 'EXECUTE') then
    raise exception 'a signed-in user can call a review function';
  end if;

  if not has_function_privilege('service_role', 'public.vf_decide(uuid,text,text,text,text,text,uuid)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.vf_expire_due(uuid)', 'EXECUTE') then
    raise exception 'the service role cannot call a review function';
  end if;

  if not has_table_privilege('anon', 'public.public_agent_badges', 'SELECT')
     or not has_table_privilege('authenticated', 'public.public_agent_badges', 'SELECT') then
    raise exception 'the public badge view is not readable';
  end if;
end $$;
