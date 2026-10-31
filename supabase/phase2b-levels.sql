-- GUYANA KEYS VERIFY, Phase 2b: agent levels and the review desk.
-- Boss runs this in the SQL editor. Do not run it from the app. Do not run it against a copy of live data from a laptop.
--
-- Run order, after the earlier files are already on the database:
--   1. supabase/phase2a-verify.sql
--   2. supabase/phase2a-drop-plain-id.sql   (only after the Phase 2a code is deployed)
--   3. supabase/phase3-phone-scan.sql
--   4. supabase/phase2b-levels.sql          (this file)
--   5. supabase/phase2b-levels-check.sql    (read-only; it changes nothing)
--
-- Safe to run more than once. Free plan only: tables, grants, triggers, and functions.
-- If you re-run supabase/phase1-market.sql afterwards, run this file again so agents
-- still cannot read file paths.
-- Nothing here calls a paid service.
--
-- Scheduling: vf_expire_due is not a paid cron. If pg_cron is already installed, a daily
-- call is added after this file commits. If it is not installed, nothing is scheduled.
-- Run it by hand, or from the review desk (senior reviewer, two-step sign-in):
--   select public.vf_expire_due('<reviewer profile uuid>');
--
-- First reviewer, after this file, either:
--   * open the review desk and use "Add me as the admin reviewer" (only while the role list is empty), or
--   * insert into public.reviewer_roles (user_id, marketplace_id, role)
--     values ('<profile uuid>', 'gy', 'admin');
--
-- Level 3 is not backfilled. An uploaded licence image never becomes Level 3.
-- A past ID review is copied into verification_status so the public line can read
-- "ID reviewed by Guyana Keys · Mon YYYY". A licence still needs vf_licence_decide.

begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres;

create extension if not exists pgcrypto;

-- Market
create table if not exists public.marketplaces (
  id text primary key,
  display_name text not null,
  accepted_id_kinds text[] not null default array['national_id', 'passport', 'drivers_licence'],
  retention_months int not null default 24,
  levels_enabled text[] not null default array['registered', 'identity_reviewed', 'licensed_agent'],
  created_at timestamptz not null default now()
);

insert into public.marketplaces (id, display_name)
values ('gy', 'Guyana')
on conflict (id) do update set display_name = excluded.display_name;

-- One public-safe row per agent and market. Dates are for the expiry job, not for the public view.
create table if not exists public.verification_status (
  agent_id uuid not null references public.profiles (id) on delete cascade,
  marketplace_id text not null references public.marketplaces (id),
  level text not null default 'registered',
  state text not null default 'active',
  badge_month text not null default '',
  recheck_at date,
  id_expires_on date,
  licence_expires_on date,
  level2_since timestamptz,
  level2_badge_month text not null default '',
  updated_at timestamptz not null default now(),
  primary key (agent_id, marketplace_id)
);

alter table public.verification_status drop constraint if exists verification_status_level_check;
alter table public.verification_status add constraint verification_status_level_check
  check (level in ('registered', 'identity_reviewed', 'licensed_agent'));
alter table public.verification_status drop constraint if exists verification_status_state_check;
alter table public.verification_status add constraint verification_status_state_check
  check (state in ('active', 'suspended', 'revoked', 'expired'));
alter table public.verification_status drop constraint if exists verification_status_badge_month_check;
alter table public.verification_status add constraint verification_status_badge_month_check
  check (badge_month = '' or badge_month ~ '^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Oct|Nov|Dec) [0-9]{4}$');
alter table public.verification_status drop constraint if exists verification_status_level2_month_check;
alter table public.verification_status add constraint verification_status_level2_month_check
  check (level2_badge_month = '' or level2_badge_month ~ '^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Oct|Nov|Dec) [0-9]{4}$');

-- Append-only decision history. No document numbers and no file paths.
create table if not exists public.verification_decisions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles (id) on delete cascade,
  marketplace_id text not null references public.marketplaces (id),
  application_id text not null default '',
  from_level text not null default '',
  to_level text not null default '',
  from_state text not null default '',
  to_state text not null default '',
  action text not null,
  reviewer_id uuid,
  method text not null default 'manual',
  evidence_ref text not null default '',
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.verification_decisions drop constraint if exists verification_decisions_action_check;
alter table public.verification_decisions add constraint verification_decisions_action_check
  check (action in ('approve', 'reject', 'request_info', 'suspend', 'revoke', 'expire', 'appeal_upheld', 'appeal_denied'));
alter table public.verification_decisions drop constraint if exists verification_decisions_reason_check;
alter table public.verification_decisions add constraint verification_decisions_reason_check
  check (char_length(btrim(reason)) >= 8);
alter table public.verification_decisions drop constraint if exists verification_decisions_reviewer_check;
alter table public.verification_decisions add constraint verification_decisions_reviewer_check
  check (reviewer_id is not null or action = 'expire');

create index if not exists verification_decisions_agent_idx
  on public.verification_decisions (agent_id, created_at desc);

create table if not exists public.appeals (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.verification_decisions (id),
  agent_id uuid not null references public.profiles (id) on delete cascade,
  marketplace_id text not null default 'gy' references public.marketplaces (id),
  statement text not null,
  status text not null default 'open',
  senior_reviewer_id uuid,
  outcome text not null default '',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

alter table public.appeals drop constraint if exists appeals_status_check;
alter table public.appeals add constraint appeals_status_check
  check (status in ('open', 'upheld', 'denied'));
alter table public.appeals drop constraint if exists appeals_statement_check;
alter table public.appeals add constraint appeals_statement_check
  check (char_length(btrim(statement)) >= 8);

create index if not exists appeals_open_idx on public.appeals (status, created_at desc);

create table if not exists public.customer_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid,
  reporter_email_hmac text not null default '',
  target_agent_id uuid,
  target_listing_id text not null default '',
  reason text not null,
  status text not null default 'open',
  handled_by uuid,
  handled_note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.customer_reports drop constraint if exists customer_reports_status_check;
alter table public.customer_reports add constraint customer_reports_status_check
  check (status in ('open', 'handled'));
alter table public.customer_reports drop constraint if exists customer_reports_reason_check;
alter table public.customer_reports add constraint customer_reports_reason_check
  check (char_length(btrim(reason)) >= 8);
alter table public.customer_reports drop constraint if exists customer_reports_hmac_check;
alter table public.customer_reports add constraint customer_reports_hmac_check
  check (reporter_email_hmac = '' or reporter_email_hmac ~ '^[0-9a-f]{64}$');

create table if not exists public.reviewer_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  marketplace_id text not null references public.marketplaces (id),
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, marketplace_id)
);

alter table public.reviewer_roles drop constraint if exists reviewer_roles_role_check;
alter table public.reviewer_roles add constraint reviewer_roles_role_check
  check (role in ('reviewer', 'senior_reviewer', 'admin'));

-- Columns the desk and the expiry job need. Existing phone-scan columns are left alone.
alter table public.keys_checks add column if not exists marketplace_id text;
update public.keys_checks set marketplace_id = 'gy' where marketplace_id is null or marketplace_id = '';
alter table public.keys_checks alter column marketplace_id set default 'gy';
alter table public.keys_checks alter column marketplace_id set not null;
alter table public.keys_checks drop constraint if exists keys_checks_marketplace_fk;
alter table public.keys_checks add constraint keys_checks_marketplace_fk
  foreign key (marketplace_id) references public.marketplaces (id);

alter table public.keys_checks add column if not exists info_requested_reason text;
update public.keys_checks set info_requested_reason = '' where info_requested_reason is null;
alter table public.keys_checks alter column info_requested_reason set default '';
alter table public.keys_checks alter column info_requested_reason set not null;

alter table public.id_documents add column if not exists id_expiry_date date;

alter table public.agent_licences add column if not exists verification_method text;
update public.agent_licences set verification_method = '' where verification_method is null;
alter table public.agent_licences alter column verification_method set default '';
alter table public.agent_licences alter column verification_method set not null;
alter table public.agent_licences drop constraint if exists agent_licences_method_check;
alter table public.agent_licences add constraint agent_licences_method_check
  check (verification_method in ('', 'issuer_phone', 'issuer_email', 'registry'));
alter table public.agent_licences add column if not exists evidence_ref text;
update public.agent_licences set evidence_ref = '' where evidence_ref is null;
alter table public.agent_licences alter column evidence_ref set default '';
alter table public.agent_licences alter column evidence_ref set not null;
alter table public.agent_licences add column if not exists recheck_at date;

-- Agents can read the "more information" reason on their own application. They cannot change it.
grant select (info_requested_reason, marketplace_id) on table public.keys_checks to authenticated;
-- The app saves a Keys Check as the service role, including the phone scan. Signed-in agents do not get this.
do $keys_grant$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, insert, update on table public.keys_checks to service_role';
    execute 'grant select, insert, update on table public.keys_check_flags to service_role';
    execute 'grant select, insert, update on table public.agent_identity_checks to service_role';
    execute 'grant select, insert, update on table public.agent_licences to service_role';
    execute 'grant select, insert, update on table public.id_documents to service_role';
  end if;
end
$keys_grant$;
revoke update (evidence_ref, verification_method, recheck_at) on table public.agent_licences from public, anon, authenticated;
revoke select on table public.id_documents from public, anon, authenticated;
grant select (
  id, agent_id, kind, consent_version, consent_at, retention_months, deleted_at, created_at,
  sha256, quality_note, check_id, id_expiry_date
) on table public.id_documents to authenticated;

-- Helpers
create or replace function private.vf_month(ts timestamptz)
returns text
language sql
immutable
as $$
  select case
    when ts is null then ''
    else (array['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'])[extract(month from (ts at time zone 'UTC'))::int]
      || ' ' || extract(year from (ts at time zone 'UTC'))::int::text
  end
$$;

revoke all on function private.vf_month(timestamptz) from public, anon, authenticated;

create or replace function private.vf_evidence_ok(ref text)
returns boolean
language plpgsql
immutable
as $$
declare
  cleaned text := btrim(coalesce(ref, ''));
begin
  if char_length(cleaned) < 12 then return false; end if;
  if cleaned ~* '^(an )?(uploaded|upload|image|file|photo)([ .]+(image|file|photo|licence|license))*[. ]*$' then return false; end if;
  if cleaned ~* '^(clean|quarantine)/' or cleaned ~* 'identity-documents' then return false; end if;
  if cleaned !~* '([0-9]|\yref\y|email|phone|confirmed|office|authority)' then return false; end if;
  return true;
end;
$$;

revoke all on function private.vf_evidence_ok(text) from public, anon, authenticated;

create or replace function private.vf_write_audit(p_actor uuid, p_action text, p_detail text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_events (actor_id, action, detail)
  values (p_actor, left(coalesce(p_action, ''), 160), left(coalesce(p_detail, ''), 160));
end;
$$;

revoke all on function private.vf_write_audit(uuid, text, text) from public, anon, authenticated;

-- verification_status changes only while a review function has set the flag.
-- The service role's normal REST update cannot set it, so it cannot move a level.
create or replace function private.verification_status_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('gk.vf_decide', true) = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'verification_status changes only through the review functions';
end;
$$;

revoke all on function private.verification_status_guard() from public, anon, authenticated;

drop trigger if exists verification_status_guard on public.verification_status;
create trigger verification_status_guard
before insert or update or delete on public.verification_status
for each row execute function private.verification_status_guard();

-- Decisions are append-only, including for the table owner.
create or replace function private.verification_decisions_append_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'verification_decisions is append-only (% refused)', tg_op;
end;
$$;

revoke all on function private.verification_decisions_append_only() from public, anon, authenticated;

drop trigger if exists verification_decisions_no_update on public.verification_decisions;
create trigger verification_decisions_no_update
before update or delete on public.verification_decisions
for each row execute function private.verification_decisions_append_only();

drop trigger if exists verification_decisions_no_truncate on public.verification_decisions;
create trigger verification_decisions_no_truncate
before truncate on public.verification_decisions
for each statement execute function private.verification_decisions_append_only();

-- Inserts are allowed only while a review function has set the flag.
create or replace function private.verification_decisions_insert_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('gk.vf_decide', true) = 'on' then
    return new;
  end if;
  raise exception 'verification_decisions is append-only (insert refused)';
end;
$$;

revoke all on function private.verification_decisions_insert_guard() from public, anon, authenticated;

drop trigger if exists verification_decisions_no_insert on public.verification_decisions;
create trigger verification_decisions_no_insert
before insert on public.verification_decisions
for each row execute function private.verification_decisions_insert_guard();

-- Phone scan and the current desk still save a Keys Check as the service role.
-- A signed-in agent cannot move status or decision columns. Review functions set gk.vf_decide too.
create or replace function private.keys_checks_decision_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('gk.vf_decide', true) = 'on' then
    return new;
  end if;
  if new.status is not distinct from old.status
     and new.decision is not distinct from old.decision
     and new.decision_reason is not distinct from old.decision_reason
     and new.decided_by is not distinct from old.decided_by
     and new.decided_at is not distinct from old.decided_at
  then
    return new;
  end if;
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  raise exception 'keys_checks status and decision change only through vf_decide';
end;
$$;

revoke all on function private.keys_checks_decision_guard() from public, anon, authenticated;

drop trigger if exists keys_checks_decision_guard on public.keys_checks;
create trigger keys_checks_decision_guard
before update of status, decision, decision_reason, decided_by, decided_at on public.keys_checks
for each row execute function private.keys_checks_decision_guard();

-- Copy an existing ID review. Do not invent a Level 3 from an old licence row.
do $backfill$
begin
  perform set_config('gk.vf_decide', 'on', true);
  insert into public.verification_status (
    agent_id, marketplace_id, level, state, badge_month, recheck_at,
    id_expires_on, level2_since, level2_badge_month
  )
  select
    i.agent_id,
    'gy',
    'identity_reviewed',
    case
      when exp.id_expiry_date is not null and exp.id_expiry_date < current_date then 'expired'
      when i.checked_at + interval '24 months' < now() then 'expired'
      else 'active'
    end,
    private.vf_month(i.checked_at),
    case
      when exp.id_expiry_date is not null and exp.id_expiry_date < (i.checked_at + interval '24 months')::date then exp.id_expiry_date
      else (i.checked_at + interval '24 months')::date
    end,
    exp.id_expiry_date,
    i.checked_at,
    private.vf_month(i.checked_at)
  from public.agent_identity_checks i
  join public.profiles p on p.id = i.agent_id
  left join lateral (
    select d.id_expiry_date
    from public.id_documents d
    where d.agent_id = i.agent_id and d.deleted_at is null and d.id_expiry_date is not null
    order by d.created_at desc
    limit 1
  ) exp on true
  where i.id_status = 'checked' and i.checked_at is not null
  on conflict (agent_id, marketplace_id) do nothing;
  perform set_config('gk.vf_decide', '', true);
end
$backfill$;

-- Review functions. Execute is granted to the service role only, after they are created.
create or replace function public.vf_ensure_registered(p_agent uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_agent is null then return; end if;
  if not exists (select 1 from public.profiles where id = p_agent and role = 'agent' and suspended = false) then
    return;
  end if;
  if exists (select 1 from public.verification_status where agent_id = p_agent and marketplace_id = 'gy') then
    return;
  end if;
  perform set_config('gk.vf_decide', 'on', true);
  insert into public.verification_status (agent_id, marketplace_id, level, state)
  values (p_agent, 'gy', 'registered', 'active');
  perform set_config('gk.vf_decide', '', true);
exception when others then
  perform set_config('gk.vf_decide', '', true);
  raise;
end;
$$;

create or replace function public.vf_decide(
  p_reviewer uuid,
  p_application text,
  p_action text,
  p_reason text,
  p_method text default 'manual',
  p_evidence text default '',
  p_agent uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_agent uuid;
  v_name text;
  v_status text;
  v_level text := 'registered';
  v_state text := 'active';
  v_decision uuid;
  v_month text;
  v_id_expiry date;
  v_recheck date;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if char_length(v_reason) < 8 then
    raise exception 'a reason is required';
  end if;
  if p_action not in ('approve', 'reject', 'request_info', 'suspend', 'revoke') then
    raise exception 'not an allowed step';
  end if;

  if coalesce(p_application, '') <> '' then
    select agent_id, status into v_agent, v_status
    from public.keys_checks where id = p_application;
    if v_agent is null then
      raise exception 'not an allowed step';
    end if;
  else
    v_agent := p_agent;
  end if;
  if v_agent is null then
    raise exception 'not an allowed step';
  end if;
  if p_agent is not null and p_agent is distinct from v_agent then
    raise exception 'not an allowed step';
  end if;

  select role into v_role from public.reviewer_roles
  where user_id = p_reviewer and marketplace_id = 'gy';
  if v_role is null or v_role not in ('reviewer', 'senior_reviewer', 'admin') then
    raise exception 'reviewer role required';
  end if;
  if p_reviewer = v_agent then
    raise exception 'a reviewer cannot decide their own check';
  end if;
  if p_action in ('suspend', 'revoke') and v_role not in ('senior_reviewer', 'admin') then
    raise exception 'this action needs a senior reviewer';
  end if;

  select level, state into v_level, v_state
  from public.verification_status
  where agent_id = v_agent and marketplace_id = 'gy';
  v_level := coalesce(v_level, 'registered');
  v_state := coalesce(v_state, 'active');

  if p_action in ('approve', 'reject', 'request_info') and coalesce(v_status, '') not in ('submitted', 'noted') then
    raise exception 'not an allowed step';
  end if;
  if p_action = 'approve' and v_state in ('suspended', 'revoked') then
    raise exception 'not an allowed step';
  end if;
  if p_action = 'approve' and v_level = 'licensed_agent' and v_state = 'active' then
    raise exception 'not an allowed step';
  end if;
  if p_action = 'suspend' and v_state <> 'active' then
    raise exception 'not an allowed step';
  end if;
  if p_action = 'revoke' and v_state = 'revoked' then
    raise exception 'not an allowed step';
  end if;

  select name into v_name from public.profiles where id = p_reviewer;
  v_name := left(coalesce(v_name, 'Reviewer'), 160);
  v_month := private.vf_month(now());

  select d.id_expiry_date into v_id_expiry
  from public.id_documents d
  where d.agent_id = v_agent and d.deleted_at is null and d.id_expiry_date is not null
  order by d.created_at desc
  limit 1;
  if v_id_expiry is not null and v_id_expiry < (now() + interval '24 months')::date then
    v_recheck := v_id_expiry;
  else
    v_recheck := (now() + interval '24 months')::date;
  end if;

  perform set_config('gk.vf_decide', 'on', true);

  if p_action = 'approve' then
    insert into public.verification_status (
      agent_id, marketplace_id, level, state, badge_month, recheck_at, id_expires_on, level2_since, level2_badge_month
    ) values (
      v_agent, 'gy', 'identity_reviewed', 'active', v_month, v_recheck, v_id_expiry, now(), v_month
    )
    on conflict (agent_id, marketplace_id) do update set
      level = 'identity_reviewed',
      state = 'active',
      badge_month = excluded.badge_month,
      recheck_at = excluded.recheck_at,
      id_expires_on = excluded.id_expires_on,
      level2_since = excluded.level2_since,
      level2_badge_month = excluded.level2_badge_month,
      licence_expires_on = null,
      updated_at = now();
    update public.keys_checks set
      status = 'approved',
      decision = 'approve',
      decision_reason = left(v_reason, 2000),
      decided_by = v_name,
      decided_at = now()
    where id = p_application;
    insert into public.agent_identity_checks (agent_id, id_status, checked_by, checked_at, notes)
    values (v_agent, 'checked', v_name, now(), left(v_reason, 2000))
    on conflict (agent_id) do update set
      id_status = 'checked',
      checked_by = excluded.checked_by,
      checked_at = excluded.checked_at,
      notes = excluded.notes;
  elsif p_action = 'reject' then
    update public.keys_checks set
      status = 'rejected',
      decision = 'reject',
      decision_reason = left(v_reason, 2000),
      decided_by = v_name,
      decided_at = now()
    where id = p_application;
    insert into public.agent_identity_checks (agent_id, id_status, checked_by, checked_at, notes)
    values (v_agent, 'rejected', '', null, left(v_reason, 2000))
    on conflict (agent_id) do update set
      id_status = case when public.agent_identity_checks.id_status = 'checked' then 'checked' else 'rejected' end,
      notes = excluded.notes;
  elsif p_action = 'request_info' then
    update public.keys_checks set
      status = 'collecting',
      decision = 'request_info',
      decision_reason = left(v_reason, 2000),
      info_requested_reason = left(v_reason, 2000),
      decided_by = v_name,
      decided_at = now(),
      code = '',
      code_issued_at = null,
      submitted_at = null
    where id = p_application;
  elsif p_action = 'suspend' then
    insert into public.verification_status (agent_id, marketplace_id, level, state)
    values (v_agent, 'gy', v_level, 'suspended')
    on conflict (agent_id, marketplace_id) do update set state = 'suspended', updated_at = now();
  elsif p_action = 'revoke' then
    insert into public.verification_status (agent_id, marketplace_id, level, state)
    values (v_agent, 'gy', v_level, 'revoked')
    on conflict (agent_id, marketplace_id) do update set state = 'revoked', updated_at = now();
  end if;

  insert into public.verification_decisions (
    agent_id, marketplace_id, application_id, from_level, to_level, from_state, to_state,
    action, reviewer_id, method, evidence_ref, reason
  ) values (
    v_agent,
    'gy',
    coalesce(p_application, ''),
    v_level,
    case when p_action = 'approve' then 'identity_reviewed' else v_level end,
    v_state,
    case
      when p_action = 'approve' then 'active'
      when p_action = 'suspend' then 'suspended'
      when p_action = 'revoke' then 'revoked'
      else v_state
    end,
    p_action,
    p_reviewer,
    case when coalesce(p_method, '') = '' then 'manual' else left(p_method, 40) end,
    left(coalesce(p_evidence, ''), 500),
    left(v_reason, 2000)
  ) returning id into v_decision;

  perform private.vf_write_audit(p_reviewer, 'vf_' || p_action, v_decision::text);
  perform set_config('gk.vf_decide', '', true);
  return v_decision;
exception when others then
  perform set_config('gk.vf_decide', '', true);
  raise;
end;
$$;

create or replace function public.vf_licence_decide(
  p_reviewer uuid,
  p_agent uuid,
  p_action text,
  p_reason text,
  p_evidence text,
  p_method text default 'issuer_email'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_level text;
  v_state text;
  v_name text;
  v_month text;
  v_level2_month text;
  v_expiry date;
  v_licence text;
  v_decision uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_method text := btrim(coalesce(p_method, ''));
begin
  if char_length(v_reason) < 8 then
    raise exception 'a reason is required';
  end if;
  if p_action not in ('approve', 'reject') then
    raise exception 'not an allowed step';
  end if;
  if p_agent is null then
    raise exception 'not an allowed step';
  end if;
  select role into v_role from public.reviewer_roles
  where user_id = p_reviewer and marketplace_id = 'gy';
  if v_role is null or v_role not in ('reviewer', 'senior_reviewer', 'admin') then
    raise exception 'reviewer role required';
  end if;
  if v_role not in ('senior_reviewer', 'admin') then
    raise exception 'this action needs a senior reviewer';
  end if;
  if p_reviewer = p_agent then
    raise exception 'a reviewer cannot decide their own check';
  end if;

  select level, state, level2_badge_month into v_level, v_state, v_level2_month
  from public.verification_status
  where agent_id = p_agent and marketplace_id = 'gy';
  if v_level is distinct from 'identity_reviewed' or v_state is distinct from 'active' then
    raise exception 'not an allowed step';
  end if;

  if p_action = 'approve' then
    if v_method not in ('issuer_phone', 'issuer_email', 'registry') then
      raise exception 'an uploaded licence image alone never earns Level 3';
    end if;
    if not private.vf_evidence_ok(p_evidence) then
      raise exception 'an uploaded licence image alone never earns Level 3';
    end if;
    select id, expiry_date into v_licence, v_expiry
    from public.agent_licences
    where agent_id = p_agent
      and check_status in ('pending', 'checked')
      and expiry_date is not null
      and expiry_date >= current_date
    order by case licence_type when 'gra_house_agent' then 0 else 1 end, expiry_date desc
    limit 1;
    if v_licence is null then
      raise exception 'record the licence expiry before this check';
    end if;
  end if;

  select name into v_name from public.profiles where id = p_reviewer;
  v_name := left(coalesce(v_name, 'Reviewer'), 160);
  v_month := private.vf_month(now());

  perform set_config('gk.vf_decide', 'on', true);

  if p_action = 'approve' then
    update public.verification_status set
      level = 'licensed_agent',
      state = 'active',
      badge_month = v_month,
      level2_badge_month = case when coalesce(level2_badge_month, '') = '' then badge_month else level2_badge_month end,
      licence_expires_on = v_expiry,
      recheck_at = v_expiry,
      updated_at = now()
    where agent_id = p_agent and marketplace_id = 'gy';
    update public.agent_licences set
      check_status = 'checked',
      checked_by = v_name,
      checked_at = now(),
      notes = left(v_reason, 2000),
      verification_method = v_method,
      evidence_ref = left(btrim(p_evidence), 500),
      recheck_at = v_expiry
    where id = v_licence;
  else
    update public.agent_licences set
      check_status = 'rejected',
      checked_by = v_name,
      checked_at = now(),
      notes = left(v_reason, 2000),
      evidence_ref = ''
    where agent_id = p_agent and check_status = 'pending';
  end if;

  insert into public.verification_decisions (
    agent_id, marketplace_id, from_level, to_level, from_state, to_state,
    action, reviewer_id, method, evidence_ref, reason
  ) values (
    p_agent,
    'gy',
    'identity_reviewed',
    case when p_action = 'approve' then 'licensed_agent' else 'identity_reviewed' end,
    'active',
    'active',
    p_action,
    p_reviewer,
    case when p_action = 'approve' then v_method else 'manual' end,
    case when p_action = 'approve' then left(btrim(p_evidence), 500) else '' end,
    left(v_reason, 2000)
  ) returning id into v_decision;

  perform private.vf_write_audit(p_reviewer, 'vf_licence_' || p_action, v_decision::text);
  perform set_config('gk.vf_decide', '', true);
  return v_decision;
exception when others then
  perform set_config('gk.vf_decide', '', true);
  raise;
end;
$$;

create or replace function public.vf_open_appeal(
  p_agent uuid,
  p_statement text,
  p_decision uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_decision uuid := p_decision;
  v_owner uuid;
  v_action text;
  v_id uuid;
  v_statement text := btrim(coalesce(p_statement, ''));
begin
  if char_length(v_statement) < 8 then
    raise exception 'a reason is required';
  end if;
  if p_agent is null then
    raise exception 'not an allowed step';
  end if;
  if v_decision is null then
    select id into v_decision
    from public.verification_decisions
    where agent_id = p_agent and action in ('reject', 'suspend', 'revoke')
    order by created_at desc
    limit 1;
  end if;
  if v_decision is null then
    raise exception 'not an allowed step';
  end if;
  select agent_id, action into v_owner, v_action
  from public.verification_decisions where id = v_decision;
  if v_owner is distinct from p_agent or v_action not in ('reject', 'suspend', 'revoke') then
    raise exception 'not an allowed step';
  end if;
  if exists (select 1 from public.appeals where decision_id = v_decision and status = 'open') then
    raise exception 'not an allowed step';
  end if;
  insert into public.appeals (decision_id, agent_id, marketplace_id, statement)
  values (v_decision, p_agent, 'gy', left(v_statement, 2000))
  returning id into v_id;
  perform private.vf_write_audit(p_agent, 'vf_appeal_opened', v_id::text);
  return v_id;
end;
$$;

create or replace function public.vf_decide_appeal(
  p_reviewer uuid,
  p_appeal uuid,
  p_outcome text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_agent uuid;
  v_decision uuid;
  v_action text;
  v_from_state text;
  v_from_level text;
  v_application text;
  v_id uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if p_outcome not in ('appeal_upheld', 'appeal_denied') then
    raise exception 'not an allowed step';
  end if;
  if char_length(v_reason) < 8 then
    raise exception 'a reason is required';
  end if;
  select role into v_role from public.reviewer_roles
  where user_id = p_reviewer and marketplace_id = 'gy';
  if v_role is null or v_role not in ('senior_reviewer', 'admin') then
    raise exception 'this action needs a senior reviewer';
  end if;
  select a.agent_id, a.decision_id into v_agent, v_decision
  from public.appeals a
  where a.id = p_appeal and a.status = 'open';
  if v_agent is null then
    raise exception 'not an allowed step';
  end if;
  if p_reviewer = v_agent then
    raise exception 'a reviewer cannot decide their own check';
  end if;
  select action, from_state, from_level, application_id
    into v_action, v_from_state, v_from_level, v_application
  from public.verification_decisions where id = v_decision;

  perform set_config('gk.vf_decide', 'on', true);
  if p_outcome = 'appeal_upheld' and v_action in ('suspend', 'revoke') then
    update public.verification_status set
      state = case when coalesce(v_from_state, '') in ('active', 'expired') then v_from_state else 'active' end,
      updated_at = now()
    where agent_id = v_agent and marketplace_id = 'gy';
  elsif p_outcome = 'appeal_upheld' and v_action = 'reject' and coalesce(v_application, '') <> '' then
    update public.keys_checks set
      status = 'submitted',
      decision = '',
      decision_reason = left(v_reason, 2000),
      decided_at = now()
    where id = v_application and agent_id = v_agent;
  end if;

  update public.appeals set
    status = case when p_outcome = 'appeal_upheld' then 'upheld' else 'denied' end,
    senior_reviewer_id = p_reviewer,
    outcome = left(v_reason, 2000),
    decided_at = now()
  where id = p_appeal;

  insert into public.verification_decisions (
    agent_id, marketplace_id, application_id, from_level, to_level, from_state, to_state,
    action, reviewer_id, method, reason
  ) values (
    v_agent,
    'gy',
    coalesce(v_application, ''),
    coalesce(v_from_level, ''),
    coalesce(v_from_level, ''),
    case when v_action = 'suspend' then 'suspended' when v_action = 'revoke' then 'revoked' else coalesce(v_from_state, '') end,
    case
      when p_outcome = 'appeal_upheld' and v_action in ('suspend', 'revoke') then coalesce(nullif(v_from_state, ''), 'active')
      when v_action = 'suspend' then 'suspended'
      when v_action = 'revoke' then 'revoked'
      else coalesce(v_from_state, '')
    end,
    p_outcome,
    p_reviewer,
    'manual',
    left(v_reason, 2000)
  ) returning id into v_id;

  perform private.vf_write_audit(p_reviewer, 'vf_' || p_outcome, v_id::text);
  perform set_config('gk.vf_decide', '', true);
  return v_id;
exception when others then
  perform set_config('gk.vf_decide', '', true);
  raise;
end;
$$;

create or replace function public.vf_expire_due(p_reviewer uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_count integer := 0;
  rec record;
  v_decision uuid;
  v_recheck date;
begin
  select role into v_role from public.reviewer_roles
  where user_id = p_reviewer and marketplace_id = 'gy';
  if v_role is null or v_role not in ('senior_reviewer', 'admin') then
    raise exception 'this action needs a senior reviewer';
  end if;

  perform set_config('gk.vf_decide', 'on', true);

  for rec in
    select *
    from public.verification_status
    where marketplace_id = 'gy'
      and state = 'active'
      and level = 'licensed_agent'
      and licence_expires_on is not null
      and licence_expires_on < current_date
      and (id_expires_on is null or id_expires_on >= current_date)
      and (level2_since is null or level2_since + interval '24 months' >= now())
  loop
    v_recheck := case
      when rec.id_expires_on is null then (rec.level2_since + interval '24 months')::date
      when rec.level2_since is null then rec.id_expires_on
      when rec.id_expires_on < (rec.level2_since + interval '24 months')::date then rec.id_expires_on
      else (rec.level2_since + interval '24 months')::date
    end;
    update public.verification_status set
      level = 'identity_reviewed',
      badge_month = case when level2_badge_month <> '' then level2_badge_month else badge_month end,
      recheck_at = v_recheck,
      updated_at = now()
    where agent_id = rec.agent_id and marketplace_id = 'gy';
    update public.agent_licences set check_status = 'expired'
    where agent_id = rec.agent_id
      and check_status = 'checked'
      and expiry_date is not null
      and expiry_date < current_date;
    insert into public.verification_decisions (
      agent_id, marketplace_id, from_level, to_level, from_state, to_state, action, reviewer_id, method, reason
    ) values (
      rec.agent_id, 'gy', 'licensed_agent', 'identity_reviewed', 'active', 'active', 'expire', p_reviewer, 'manual',
      'The licence date has passed. The ID review still stands.'
    ) returning id into v_decision;
    perform private.vf_write_audit(p_reviewer, 'vf_expire', v_decision::text);
    v_count := v_count + 1;
  end loop;

  for rec in
    select *
    from public.verification_status
    where marketplace_id = 'gy'
      and state = 'active'
      and level in ('identity_reviewed', 'licensed_agent')
      and (
        (id_expires_on is not null and id_expires_on < current_date)
        or (level2_since is not null and level2_since + interval '24 months' < now())
        or (level = 'identity_reviewed' and recheck_at is not null and recheck_at < current_date)
      )
  loop
    update public.verification_status set
      level = 'identity_reviewed',
      state = 'expired',
      updated_at = now()
    where agent_id = rec.agent_id and marketplace_id = 'gy';
    insert into public.verification_decisions (
      agent_id, marketplace_id, from_level, to_level, from_state, to_state, action, reviewer_id, method, reason
    ) values (
      rec.agent_id, 'gy', rec.level, 'identity_reviewed', 'active', 'expired', 'expire', p_reviewer, 'manual',
      'The ID review date has passed.'
    ) returning id into v_decision;
    perform private.vf_write_audit(p_reviewer, 'vf_expire', v_decision::text);
    v_count := v_count + 1;
  end loop;

  perform set_config('gk.vf_decide', '', true);
  return v_count;
exception when others then
  perform set_config('gk.vf_decide', '', true);
  raise;
end;
$$;

create or replace function public.vf_grant_role(p_actor uuid, p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  n integer;
begin
  if p_role not in ('reviewer', 'senior_reviewer', 'admin') then
    raise exception 'not an allowed step';
  end if;
  if not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'not an allowed step';
  end if;
  select count(*) into n from public.reviewer_roles where marketplace_id = 'gy';
  if n = 0 then
    if p_actor is distinct from p_user or p_role is distinct from 'admin' then
      raise exception 'reviewer role required';
    end if;
  else
    select role into v_role from public.reviewer_roles
    where user_id = p_actor and marketplace_id = 'gy';
    if v_role is distinct from 'admin' then
      raise exception 'not an allowed step';
    end if;
  end if;
  insert into public.reviewer_roles (user_id, marketplace_id, role)
  values (p_user, 'gy', p_role)
  on conflict (user_id, marketplace_id) do update set role = excluded.role;
  perform private.vf_write_audit(p_actor, 'vf_grant_role', p_user::text);
end;
$$;

create or replace function public.vf_handle_report(p_reviewer uuid, p_report uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if char_length(v_reason) < 8 then
    raise exception 'a reason is required';
  end if;
  select role into v_role from public.reviewer_roles
  where user_id = p_reviewer and marketplace_id = 'gy';
  if v_role is null or v_role not in ('reviewer', 'senior_reviewer', 'admin') then
    raise exception 'reviewer role required';
  end if;
  update public.customer_reports set
    status = 'handled',
    handled_by = p_reviewer,
    handled_note = left(v_reason, 2000)
  where id = p_report and status = 'open';
  if not found then
    raise exception 'not an allowed step';
  end if;
  perform private.vf_write_audit(p_reviewer, 'vf_handle_report', p_report::text);
end;
$$;

revoke all on function public.vf_ensure_registered(uuid) from public, anon, authenticated;
revoke all on function public.vf_decide(uuid, text, text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.vf_licence_decide(uuid, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.vf_open_appeal(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.vf_decide_appeal(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.vf_expire_due(uuid) from public, anon, authenticated;
revoke all on function public.vf_grant_role(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.vf_handle_report(uuid, uuid, text) from public, anon, authenticated;

do $grant$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.vf_ensure_registered(uuid) to service_role';
    execute 'grant execute on function public.vf_decide(uuid, text, text, text, text, text, uuid) to service_role';
    execute 'grant execute on function public.vf_licence_decide(uuid, uuid, text, text, text, text) to service_role';
    execute 'grant execute on function public.vf_open_appeal(uuid, text, uuid) to service_role';
    execute 'grant execute on function public.vf_decide_appeal(uuid, uuid, text, text) to service_role';
    execute 'grant execute on function public.vf_expire_due(uuid) to service_role';
    execute 'grant execute on function public.vf_grant_role(uuid, uuid, text) to service_role';
    execute 'grant execute on function public.vf_handle_report(uuid, uuid, text) to service_role';
  end if;
end
$grant$;

-- Locks. Default privileges on a fresh database can hand new tables to anon. Take that back.
revoke all on table public.marketplaces from public, anon, authenticated, service_role;
revoke all on table public.verification_status from public, anon, authenticated, service_role;
revoke all on table public.verification_decisions from public, anon, authenticated, service_role;
revoke all on table public.appeals from public, anon, authenticated, service_role;
revoke all on table public.customer_reports from public, anon, authenticated, service_role;
revoke all on table public.reviewer_roles from public, anon, authenticated, service_role;

grant select on table public.marketplaces to anon, authenticated, service_role;
grant select on table public.verification_status to authenticated, service_role;
grant select on table public.verification_decisions to service_role;
grant select (id, agent_id, marketplace_id, application_id, from_level, to_level, from_state, to_state, action, reason, created_at)
  on table public.verification_decisions to authenticated;
grant select (id, decision_id, agent_id, marketplace_id, statement, status, outcome, created_at, decided_at)
  on table public.appeals to authenticated;
grant select on table public.appeals to service_role;
grant select on table public.customer_reports to service_role;
grant select on table public.reviewer_roles to service_role;

alter table public.marketplaces enable row level security;
alter table public.verification_status enable row level security;
alter table public.verification_decisions enable row level security;
alter table public.appeals enable row level security;
alter table public.customer_reports enable row level security;
alter table public.reviewer_roles enable row level security;

drop policy if exists marketplaces_public_read on public.marketplaces;
create policy marketplaces_public_read on public.marketplaces
for select to anon, authenticated using (true);

drop policy if exists verification_status_own on public.verification_status;
create policy verification_status_own on public.verification_status
for select to authenticated using (agent_id = auth.uid());

drop policy if exists verification_decisions_own on public.verification_decisions;
create policy verification_decisions_own on public.verification_decisions
for select to authenticated using (agent_id = auth.uid());

drop policy if exists appeals_own on public.appeals;
create policy appeals_own on public.appeals
for select to authenticated using (agent_id = auth.uid());

-- No insert, update, or delete policies. Those writes go through the functions above.

revoke update, delete, truncate on table public.verification_decisions from public, anon, authenticated, service_role;
revoke insert, update, delete, truncate on table public.verification_status from public, anon, authenticated, service_role;
revoke insert, update, delete, truncate on table public.verification_decisions from public, anon, authenticated;

do $service$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke insert, update, delete, truncate on table public.verification_status from service_role';
    execute 'revoke insert, update, delete, truncate on table public.verification_decisions from service_role';
    execute 'revoke insert, update, delete, truncate on table public.reviewer_roles from service_role';
    execute 'revoke insert, update, delete, truncate on table public.appeals from service_role';
  end if;
end
$service$;

-- Public line only. Active rows, live agents, no reasons and no file paths.
create or replace view public.public_agent_badges
with (security_invoker = false) as
select s.agent_id, s.level, s.badge_month
from public.verification_status s
join public.profiles p on p.id = s.agent_id
where s.marketplace_id = 'gy'
  and s.state = 'active'
  and s.level in ('identity_reviewed', 'licensed_agent')
  and p.role = 'agent'
  and p.suspended = false;

revoke all on table public.public_agent_badges from public, anon, authenticated, service_role;
grant select on table public.public_agent_badges to anon, authenticated, service_role;

comment on view public.public_agent_badges is
  'Public badge only: agent_id, level, badge_month. Active rows of live agents.';
comment on table public.verification_status is
  'Level and state for one agent in one market. The public view does not read this table directly.';
comment on table public.verification_decisions is
  'Append-only review history. Update and delete are refused for every role.';

commit;

-- Optional free schedule. A failure here does not undo the tables above.
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'vf_expire_due') then
      raise notice 'pg_cron is installed. Add a daily call yourself if you want one: select public.vf_expire_due(''<reviewer uuid>'');. This file does not schedule it, because the job needs a reviewer id.';
    end if;
  else
    raise notice 'pg_cron is not installed. Run select public.vf_expire_due(''<reviewer uuid>''); by hand, or use Run the expiry check on the review desk. No paid scheduler was added.';
  end if;
exception when others then
  raise notice 'vf_expire_due was not scheduled (%). Run it by hand.', sqlerrm;
end
$cron$;
