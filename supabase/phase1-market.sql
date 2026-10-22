-- Phase 1 addendum. Additive and safe to run more than once.
-- Does not delete rows. Boss runs this. Do not run it from the app.
-- The identity-documents bucket must stay private. Confirm that in the Supabase dashboard after this file.

begin;

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

alter table public.id_documents drop constraint if exists id_documents_kind_check;
alter table public.id_documents add constraint id_documents_kind_check check (kind in ('id_scan', 'selfie'));

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
    execute 'drop policy if exists identity_documents_own_insert on storage.objects';
    execute 'create policy identity_documents_own_insert on storage.objects for insert to authenticated with check (bucket_id = ''identity-documents'' and (storage.foldername(name))[1] = auth.uid()::text)';
  exception when others then
    raise notice 'Storage policies for identity-documents were not created. Confirm them in the dashboard. There is no public read policy.';
  end;
end
$bucket$;

commit;
