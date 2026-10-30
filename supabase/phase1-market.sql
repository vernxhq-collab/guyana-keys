-- Phase 1 addendum. Additive and safe to run more than once.
-- Does not delete rows. Boss runs this. Do not run it from the app.
-- The identity-documents bucket must stay private. Confirm that in the Supabase dashboard after this file.

begin;

-- Listings are free to list, with no limits. Clear a count check left by an older founding.sql.
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

alter table public.enquiries add column if not exists source_page text not null default '';
alter table public.enquiries add column if not exists utm jsonb not null default '{}'::jsonb;
alter table public.enquiries add column if not exists lead_channel text not null default 'web';
alter table public.enquiries add column if not exists lead_kind text not null default 'enquiry';
alter table public.enquiries add column if not exists partner_id text not null default '';

alter table public.enquiries drop constraint if exists enquiries_lead_channel_check;
alter table public.enquiries add constraint enquiries_lead_channel_check check (lead_channel in ('web', 'email', 'whatsapp'));
alter table public.enquiries drop constraint if exists enquiries_lead_kind_check;
alter table public.enquiries add constraint enquiries_lead_kind_check check (lead_kind in ('enquiry', 'title_check', 'intro'));

alter table public.properties add column if not exists title_checked_by_lawyer boolean not null default false;
alter table public.properties add column if not exists title_lawyer_partner_id text not null default '';
alter table public.properties add column if not exists title_checked_on date;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'properties' and column_name = 'title_status'
  ) then
    execute 'alter table public.properties drop constraint if exists properties_title_status_check';
    execute $check$alter table public.properties add constraint properties_title_status_check
      check (title_status in ('', 'transport', 'certificate', 'certificate_of_title', 'lease', 'other', 'unknown'))$check$;
  end if;
end $$;

create table if not exists public.agent_licences (
  id text primary key,
  agent_id uuid not null,
  licence_type text not null,
  issuing_body text not null default '',
  licence_number text not null default '',
  issue_date date,
  expiry_date date,
  check_status text not null default 'pending',
  checked_by text not null default '',
  checked_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (agent_id, licence_type)
);

alter table public.agent_licences drop constraint if exists agent_licences_type_check;
alter table public.agent_licences add constraint agent_licences_type_check check (licence_type in ('gra_house_agent', 'reaba_professional'));
alter table public.agent_licences drop constraint if exists agent_licences_status_check;
alter table public.agent_licences add constraint agent_licences_status_check check (check_status in ('pending', 'checked', 'rejected', 'expired'));

create table if not exists public.agent_identity_checks (
  agent_id uuid primary key,
  id_status text not null default 'pending',
  checked_by text not null default '',
  checked_at timestamptz,
  notes text not null default ''
);

alter table public.agent_identity_checks drop constraint if exists agent_identity_checks_status_check;
alter table public.agent_identity_checks add constraint agent_identity_checks_status_check check (id_status in ('pending', 'checked', 'rejected'));

create table if not exists public.id_documents (
  id text primary key,
  agent_id uuid not null,
  kind text not null,
  storage_path text not null,
  consent_version text not null,
  consent_at timestamptz not null,
  retention_months int not null default 24,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.id_documents add column if not exists sha256 text not null default '';
alter table public.id_documents add column if not exists quality_note text not null default '';
alter table public.id_documents add column if not exists check_id text not null default '';

alter table public.id_documents drop constraint if exists id_documents_kind_check;
alter table public.id_documents add constraint id_documents_kind_check check (kind in (
  'id_scan', 'selfie',
  'id_front', 'id_back', 'licence', 'selfie_with_id', 'code_selfie', 'code_video'
));
alter table public.id_documents drop constraint if exists id_documents_sha256_check;
alter table public.id_documents add constraint id_documents_sha256_check check (sha256 = '' or sha256 ~ '^[0-9a-f]{64}$');

create table if not exists public.id_deletion_requests (
  id text primary key,
  agent_id uuid not null,
  document_id text,
  status text not null default 'requested',
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.id_deletion_requests drop constraint if exists id_deletion_requests_status_check;
alter table public.id_deletion_requests add constraint id_deletion_requests_status_check check (status in ('requested', 'purged', 'declined'));

create table if not exists public.partners (
  id text primary key,
  name text not null,
  category text not null,
  area text not null default '',
  phone text not null default '',
  email text not null default '',
  note text not null default '',
  consent_to_list boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.partners drop constraint if exists partners_category_check;
alter table public.partners add constraint partners_category_check
  check (category in ('bank', 'insurance_broker', 'lawyer', 'surveyor', 'valuer'));

create table if not exists public.mortgage_rates (
  id text primary key,
  bank text not null,
  product text not null,
  rate numeric not null,
  source_url text not null,
  checked_on date not null
);

insert into public.mortgage_rates (id, bank, product, rate, source_url, checked_on) values
  ('gbti-4m', 'GBTI', 'Standard mortgage, up to $4 million', 3.5, 'https://gbtibank.com/mortgage-centre/', '2026-10-22'),
  ('gbti-9m', 'GBTI', 'Standard mortgage, $4 million to $9 million', 3.7, 'https://gbtibank.com/mortgage-centre/', '2026-10-22'),
  ('gbti-20m', 'GBTI', 'Standard mortgage, $9 million to $20 million', 4.25, 'https://gbtibank.com/mortgage-centre/', '2026-10-22'),
  ('gbti-40m', 'GBTI', 'Standard mortgage, $20 million to $40 million', 4.75, 'https://gbtibank.com/mortgage-centre/', '2026-10-22'),
  ('gbti-60m', 'GBTI', 'Standard mortgage, $40 million to $60 million', 4.99, 'https://gbtibank.com/mortgage-centre/', '2026-10-22'),
  ('demerara-4m', 'Demerara Bank', 'Residential home loan, up to G$4,000,000', 3.5, 'https://demerarabank.com/home-loans/', '2026-10-22'),
  ('demerara-9m', 'Demerara Bank', 'Residential home loan, G$4,000,001 to G$9,000,000', 3.7, 'https://demerarabank.com/home-loans/', '2026-10-22'),
  ('demerara-15m', 'Demerara Bank', 'Residential home loan, G$9,000,001 to G$15,000,000', 4.5, 'https://demerarabank.com/home-loans/', '2026-10-22'),
  ('demerara-40m', 'Demerara Bank', 'Residential home loan, G$15,000,001 to G$40,000,000', 5, 'https://demerarabank.com/home-loans/', '2026-10-22'),
  ('demerara-above', 'Demerara Bank', 'Residential home loan, above G$40,000,000', 8, 'https://demerarabank.com/home-loans/', '2026-10-22'),
  ('citizens-10m', 'Citizens Bank', 'Mortgage up to $10 million', 3.5, 'https://citizensbankgy.com/choose-your-mortgage/', '2026-10-22'),
  ('citizens-20m', 'Citizens Bank', 'Mortgage up to $20 million', 3.7, 'https://citizensbankgy.com/choose-your-mortgage/', '2026-10-22'),
  ('citizens-30m', 'Citizens Bank', 'Mortgage up to $30 million', 4.6, 'https://citizensbankgy.com/choose-your-mortgage/', '2026-10-22'),
  ('citizens-50m', 'Citizens Bank', 'Mortgage up to $50 million', 5, 'https://citizensbankgy.com/choose-your-mortgage/', '2026-10-22'),
  ('scotia-floor', 'Scotiabank Guyana', 'Published floor for a new mortgage or a switch. Terms apply.', 4, 'https://gy.scotiabank.com/personal/borrowing/mortgages.html', '2026-10-22')
on conflict (id) do update set
  bank = excluded.bank,
  product = excluded.product,
  rate = excluded.rate,
  source_url = excluded.source_url,
  checked_on = excluded.checked_on;

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid,
  actor_id uuid,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

alter table public.audit_events add column if not exists created_at timestamptz not null default now();

alter table public.agent_licences enable row level security;
alter table public.agent_identity_checks enable row level security;
alter table public.id_documents enable row level security;
alter table public.id_deletion_requests enable row level security;
alter table public.partners enable row level security;
alter table public.mortgage_rates enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.agent_licences from public, anon, authenticated;
revoke all on table public.agent_identity_checks from public, anon, authenticated;
revoke all on table public.id_documents from public, anon, authenticated;
revoke all on table public.id_deletion_requests from public, anon, authenticated;
revoke all on table public.partners from public, anon, authenticated;
revoke all on table public.mortgage_rates from public, anon, authenticated;
revoke all on table public.audit_events from public, anon, authenticated;

grant select on table public.partners to anon, authenticated;
grant select on table public.mortgage_rates to anon, authenticated;
grant select, insert, update on table public.agent_licences to authenticated;
grant select on table public.agent_identity_checks to authenticated;
grant select, insert on table public.id_documents to authenticated;
grant select, insert on table public.id_deletion_requests to authenticated;

drop policy if exists partners_public_read on public.partners;
create policy partners_public_read on public.partners
for select to anon, authenticated
using (consent_to_list = true);

drop policy if exists mortgage_rates_public_read on public.mortgage_rates;
create policy mortgage_rates_public_read on public.mortgage_rates
for select to anon, authenticated
using (true);

drop policy if exists agent_licences_own on public.agent_licences;
create policy agent_licences_own on public.agent_licences
for select to authenticated using (agent_id = auth.uid());

drop policy if exists agent_licences_own_insert on public.agent_licences;
create policy agent_licences_own_insert on public.agent_licences
for insert to authenticated with check (agent_id = auth.uid() and check_status = 'pending');

drop policy if exists agent_licences_own_update on public.agent_licences;
create policy agent_licences_own_update on public.agent_licences
for update to authenticated using (agent_id = auth.uid()) with check (agent_id = auth.uid() and check_status in ('pending', 'expired'));

drop policy if exists identity_checks_own on public.agent_identity_checks;
create policy identity_checks_own on public.agent_identity_checks
for select to authenticated using (agent_id = auth.uid());

drop policy if exists id_documents_own on public.id_documents;
create policy id_documents_own on public.id_documents
for select to authenticated using (agent_id = auth.uid());

drop policy if exists id_documents_own_insert on public.id_documents;
create policy id_documents_own_insert on public.id_documents
for insert to authenticated with check (agent_id = auth.uid() and consent_version <> '' and consent_at is not null);

drop policy if exists id_deletion_own on public.id_deletion_requests;
create policy id_deletion_own on public.id_deletion_requests
for select to authenticated using (agent_id = auth.uid());

drop policy if exists id_deletion_own_insert on public.id_deletion_requests;
create policy id_deletion_own_insert on public.id_deletion_requests
for insert to authenticated with check (agent_id = auth.uid() and status = 'requested');

create or replace function private.expire_agent_licence()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.expiry_date is not null and new.expiry_date < current_date and new.check_status is distinct from 'rejected' then
    new.check_status := 'expired';
  end if;
  return new;
end;
$$;

revoke all on function private.expire_agent_licence() from public, anon, authenticated;

drop trigger if exists expire_agent_licence on public.agent_licences;
create trigger expire_agent_licence
before insert or update on public.agent_licences
for each row execute function private.expire_agent_licence();

do $bucket$
begin
  if to_regclass('storage.buckets') is not null then
    begin
      insert into storage.buckets (id, name, public)
      values ('identity-documents', 'identity-documents', false)
      on conflict (id) do update set public = false;
    exception when others then
      raise notice 'Create the identity-documents bucket in the Supabase dashboard and leave it private.';
    end;
  end if;
  if to_regclass('storage.objects') is null then
    return;
  end if;
  begin
    execute 'drop policy if exists identity_documents_own_read on storage.objects';
    execute 'create policy identity_documents_own_read on storage.objects for select to authenticated using (bucket_id = ''identity-documents'' and (storage.foldername(name))[1] = auth.uid()::text)';
    -- Phase 2a: no direct insert by signed-in users. Files arrive through a server-issued
    -- signed upload URL and the server checks them before they are kept.
    execute 'drop policy if exists identity_documents_own_insert on storage.objects';
  exception when others then
    raise notice 'Storage policies for identity-documents were not created. Confirm them in the dashboard. There is no public read policy.';
  end;
end
$bucket$;

create table if not exists public.keys_checks (
  id text primary key,
  agent_id uuid not null,
  subject_type text not null default 'agent',
  status text not null default 'collecting',
  provider text not null default 'manual',
  id_kind text not null default '',
  id_number text not null default '',
  code text not null default '',
  code_issued_at timestamptz,
  submitted_at timestamptz,
  reviewer_name text not null default '',
  reviewer_notes text not null default '',
  reviewed_at timestamptz,
  name_matches boolean,
  face_matches boolean,
  code_matches boolean,
  document_not_expired boolean,
  licence_recorded boolean,
  licence_expiry_ok boolean,
  decision text not null default '',
  decision_reason text not null default '',
  decided_by text not null default '',
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.keys_checks add column if not exists subject_type text not null default 'agent';
comment on column public.keys_checks.agent_id is 'The account this check belongs to. The role of the check is subject_type.';
comment on column public.keys_checks.subject_type is 'agent, tenant, purchaser, or landlord. This phase writes agent only.';

alter table public.keys_checks drop constraint if exists keys_checks_status_check;
alter table public.keys_checks add constraint keys_checks_status_check
  check (status in ('collecting', 'submitted', 'noted', 'approved', 'rejected'));
alter table public.keys_checks drop constraint if exists keys_checks_provider_check;
alter table public.keys_checks add constraint keys_checks_provider_check
  check (provider in ('manual', 'future_inhouse_auto', 'future_eid_registry'));
alter table public.keys_checks drop constraint if exists keys_checks_id_kind_check;
alter table public.keys_checks add constraint keys_checks_id_kind_check
  check (id_kind in ('', 'national_id', 'passport', 'drivers_licence'));
alter table public.keys_checks drop constraint if exists keys_checks_subject_type_check;
alter table public.keys_checks add constraint keys_checks_subject_type_check
  check (subject_type in ('agent', 'tenant', 'purchaser', 'landlord'));

create table if not exists public.keys_check_flags (
  id text primary key,
  agent_id uuid not null,
  check_id text not null default '',
  flag text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

alter table public.keys_check_flags drop constraint if exists keys_check_flags_flag_check;
alter table public.keys_check_flags add constraint keys_check_flags_flag_check
  check (flag in ('duplicate_file', 'duplicate_id_number'));

alter table public.keys_checks enable row level security;
alter table public.keys_check_flags enable row level security;
revoke all on table public.keys_checks from public, anon, authenticated;
revoke all on table public.keys_check_flags from public, anon, authenticated;
-- Agents can read their own row. They can insert a collecting check, and they can
-- update only the upload references on that row. Reviewer columns stay revoked.
-- Phase 2a replaces the plain id_number with id_number_hmac and id_number_last3, so the
-- number columns are granted only when they exist. This file stays safe to re-run after
-- supabase/phase2a-drop-plain-id.sql. Agents never get id_number_hmac.
do $grants$
declare
  plain boolean := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'keys_checks' and column_name = 'id_number')
    and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'keys_checks' and column_name = 'id_number_hmac');
  last3 boolean := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'keys_checks' and column_name = 'id_number_last3');
begin
  execute 'grant select (id, agent_id, subject_type, status, provider, id_kind, '
    || case when plain then 'id_number, ' else '' end
    || case when last3 then 'id_number_last3, ' else '' end
    || 'code, code_issued_at, submitted_at, reviewer_name, reviewer_notes, reviewed_at, name_matches, face_matches, code_matches, '
    || 'document_not_expired, licence_recorded, licence_expiry_ok, decision, decision_reason, decided_by, decided_at, created_at) '
    || 'on table public.keys_checks to authenticated';
  execute 'grant insert (id, agent_id, subject_type, status, provider, id_kind, '
    || case when plain then 'id_number, ' else '' end
    || 'code, code_issued_at) on table public.keys_checks to authenticated';
  execute 'grant update (id_kind, '
    || case when plain then 'id_number, ' else '' end
    || 'code, code_issued_at) on table public.keys_checks to authenticated';
end
$grants$;
grant select on table public.keys_check_flags to authenticated;

drop policy if exists keys_checks_own on public.keys_checks;
create policy keys_checks_own on public.keys_checks
for select to authenticated using (agent_id = auth.uid());

drop policy if exists keys_checks_own_insert on public.keys_checks;
create policy keys_checks_own_insert on public.keys_checks
for insert to authenticated with check (
  agent_id = auth.uid()
  and status = 'collecting'
  and provider = 'manual'
  and subject_type = 'agent'
  and decision = ''
  and decision_reason = ''
  and reviewer_notes = ''
  and reviewer_name = ''
  and decided_by = ''
  and name_matches is null
  and face_matches is null
  and code_matches is null
  and document_not_expired is null
  and licence_recorded is null
  and licence_expiry_ok is null
  and reviewed_at is null
  and decided_at is null
  and submitted_at is null
);

drop policy if exists keys_checks_own_update on public.keys_checks;
create policy keys_checks_own_update on public.keys_checks
for update to authenticated
using (agent_id = auth.uid() and status = 'collecting')
with check (
  agent_id = auth.uid()
  and status = 'collecting'
  and provider = 'manual'
  and subject_type = 'agent'
  and decision = ''
  and decision_reason = ''
  and reviewer_notes = ''
  and reviewer_name = ''
  and decided_by = ''
  and name_matches is null
  and face_matches is null
  and code_matches is null
  and document_not_expired is null
  and licence_recorded is null
  and licence_expiry_ok is null
  and reviewed_at is null
  and decided_at is null
  and submitted_at is null
);

drop policy if exists keys_flags_own on public.keys_check_flags;
create policy keys_flags_own on public.keys_check_flags
for select to authenticated using (agent_id = auth.uid());

create or replace function private.flag_duplicate_id_file()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sha256 ~ '^[0-9a-f]{64}$' and exists (
    select 1 from public.id_documents
    where sha256 = new.sha256
      and agent_id is distinct from new.agent_id
      and deleted_at is null
      and id is distinct from new.id
  ) then
    insert into public.keys_check_flags (id, agent_id, check_id, flag, detail)
    values ('flg-' || new.id, new.agent_id, coalesce(new.check_id, ''), 'duplicate_file', 'same sha256 on another account')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.flag_duplicate_id_file() from public, anon, authenticated;

drop trigger if exists flag_duplicate_id_file on public.id_documents;
create trigger flag_duplicate_id_file
after insert on public.id_documents
for each row execute function private.flag_duplicate_id_file();

create or replace function private.flag_duplicate_id_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id_number <> '' and exists (
    select 1 from public.keys_checks
    where id_number = new.id_number
      and agent_id is distinct from new.agent_id
      and id is distinct from new.id
  ) then
    insert into public.keys_check_flags (id, agent_id, check_id, flag, detail)
    values ('idn-' || new.id, new.agent_id, new.id, 'duplicate_id_number', 'same id number on another account')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.flag_duplicate_id_number() from public, anon, authenticated;

-- Signed-in agents cannot write reviewer columns, even on their own collecting row.
-- The service role and a session with no user (the migration owner) pass through.
-- Triggers fire as the function owner. EXECUTE stays revoked, as on the profile guard.
create or replace function private.guard_keys_check_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  begin
    jwt_role := auth.role();
  exception when others then
    return new;
  end;
  if coalesce(jwt_role, '') = 'service_role' or auth.uid() is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.agent_id is distinct from auth.uid()
      or new.status is distinct from 'collecting'
      or new.provider is distinct from 'manual'
      or new.subject_type is distinct from 'agent'
      or new.decision is distinct from ''
      or new.decision_reason is distinct from ''
      or new.reviewer_notes is distinct from ''
      or new.reviewer_name is distinct from ''
      or new.decided_by is distinct from ''
      or new.name_matches is not null
      or new.face_matches is not null
      or new.code_matches is not null
      or new.document_not_expired is not null
      or new.licence_recorded is not null
      or new.licence_expiry_ok is not null
      or new.reviewed_at is not null
      or new.decided_at is not null
      or new.submitted_at is not null
    then
      raise exception 'A Keys Check review field cannot be set here';
    end if;
    return new;
  end if;
  if old.status is distinct from 'collecting'
    or new.status is distinct from 'collecting'
    or new.agent_id is distinct from old.agent_id
    or new.agent_id is distinct from auth.uid()
    or new.subject_type is distinct from old.subject_type
    or new.provider is distinct from old.provider
    or new.provider is distinct from 'manual'
    or new.id is distinct from old.id
    or new.submitted_at is distinct from old.submitted_at
    or new.reviewer_name is distinct from old.reviewer_name
    or new.reviewer_notes is distinct from old.reviewer_notes
    or new.reviewed_at is distinct from old.reviewed_at
    or new.name_matches is distinct from old.name_matches
    or new.face_matches is distinct from old.face_matches
    or new.code_matches is distinct from old.code_matches
    or new.document_not_expired is distinct from old.document_not_expired
    or new.licence_recorded is distinct from old.licence_recorded
    or new.licence_expiry_ok is distinct from old.licence_expiry_ok
    or new.decision is distinct from old.decision
    or new.decision_reason is distinct from old.decision_reason
    or new.decided_by is distinct from old.decided_by
    or new.decided_at is distinct from old.decided_at
    or new.created_at is distinct from old.created_at
  then
    raise exception 'A Keys Check review field cannot be changed here';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_keys_check_write() from public, anon, authenticated;

drop trigger if exists guard_keys_check_write on public.keys_checks;
create trigger guard_keys_check_write
before insert or update on public.keys_checks
for each row execute function private.guard_keys_check_write();

drop trigger if exists flag_duplicate_id_number on public.keys_checks;
do $idn$
begin
  -- Before Phase 2a only. supabase/phase2a-verify.sql moves duplicate checks to id_number_hmac.
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'keys_checks' and column_name = 'id_number')
    and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'keys_checks' and column_name = 'id_number_hmac')
  then
    execute 'create trigger flag_duplicate_id_number after insert or update of id_number on public.keys_checks for each row execute function private.flag_duplicate_id_number()';
  end if;
end
$idn$;

commit;
