-- Guyana Keys desk schema. Safe to run more than once.
-- Service-role writes bypass RLS. The service role key stays on the server.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  name text not null default '',
  phone text not null default '',
  role text not null default 'buyer',
  company text not null default '',
  photo_url text not null default '',
  areas text[] not null default '{}',
  plan text not null default 'starter',
  listing_cap int not null default 3,
  abroad boolean not null default false,
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists name text not null default '';
alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists role text not null default 'buyer';
alter table public.profiles add column if not exists company text not null default '';
alter table public.profiles add column if not exists photo_url text not null default '';
alter table public.profiles add column if not exists areas text[] not null default '{}';
alter table public.profiles add column if not exists plan text not null default 'starter';
alter table public.profiles add column if not exists listing_cap int not null default 3;
alter table public.profiles add column if not exists abroad boolean not null default false;
alter table public.profiles add column if not exists suspended boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

update public.profiles
set role = 'buyer'
where role is null or role not in ('buyer', 'agent', 'admin');

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('buyer', 'agent', 'admin'));

-- properties (keep an existing table; add anything missing)
create table if not exists public.properties (
  id text primary key,
  agent_id uuid references public.profiles (id) on delete set null,
  title text not null default '',
  area text not null default '',
  region text not null default '',
  type text not null default 'House',
  purpose text not null default 'Sale',
  price_gyd bigint not null default 0,
  beds int not null default 0,
  baths int not null default 0,
  sqft int not null default 0,
  lat double precision,
  lng double precision,
  description text not null default '',
  status text not null default 'hidden',
  featured boolean not null default false,
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'properties' and column_name = 'id' and data_type = 'uuid'
  ) then
    alter table public.properties alter column id type text using id::text;
  end if;
exception when others then
  null;
end $$;

alter table public.properties add column if not exists agent_id uuid;
alter table public.properties add column if not exists title text not null default '';
alter table public.properties add column if not exists area text not null default '';
alter table public.properties add column if not exists region text not null default '';
alter table public.properties add column if not exists type text not null default 'House';
alter table public.properties add column if not exists purpose text not null default 'Sale';
alter table public.properties add column if not exists price_gyd bigint not null default 0;
alter table public.properties add column if not exists beds int not null default 0;
alter table public.properties add column if not exists baths int not null default 0;
alter table public.properties add column if not exists sqft int not null default 0;
alter table public.properties add column if not exists lat double precision;
alter table public.properties add column if not exists lng double precision;
alter table public.properties add column if not exists description text not null default '';
alter table public.properties add column if not exists status text not null default 'hidden';
alter table public.properties add column if not exists featured boolean not null default false;
alter table public.properties add column if not exists photo_urls text[] not null default '{}';
alter table public.properties add column if not exists created_at timestamptz not null default now();
alter table public.properties add column if not exists held_live boolean not null default false;

update public.properties
set status = 'hidden'
where status is null or status not in ('live', 'hidden');

update public.properties set featured = false where featured is null;
update public.properties set photo_urls = '{}' where photo_urls is null;
update public.properties set held_live = false where held_live is null;

alter table public.properties drop constraint if exists properties_status_check;
alter table public.properties add constraint properties_status_check check (status in ('live', 'hidden'));

-- saved homes, views, searches
create table if not exists public.saved_homes (
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create table if not exists public.recently_viewed (
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id text not null,
  viewed_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create table if not exists public.saved_searches (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default '',
  purpose text not null default '',
  area text not null default '',
  beds int not null default 0,
  max_price bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.saved_searches add column if not exists label text not null default '';
alter table public.saved_searches add column if not exists purpose text not null default '';
alter table public.saved_searches add column if not exists area text not null default '';
alter table public.saved_searches add column if not exists beds int not null default 0;
alter table public.saved_searches add column if not exists max_price bigint not null default 0;
alter table public.saved_searches add column if not exists created_at timestamptz not null default now();

-- enquiries
create table if not exists public.enquiries (
  id text primary key default gen_random_uuid()::text,
  property_id text,
  buyer_id uuid references auth.users (id) on delete set null,
  agent_id uuid references public.profiles (id) on delete set null,
  name text not null default '',
  phone text not null default '',
  note text not null default '',
  abroad boolean not null default false,
  move_in text not null default '',
  occupants int,
  stage text not null default 'new',
  agent_reply text not null default '',
  score text,
  next_step text,
  viewing_at timestamptz,
  viewing_request text,
  private_note text not null default '',
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'enquiries' and column_name = 'id' and data_type = 'uuid'
  ) then
    alter table public.enquiries alter column id type text using id::text;
  end if;
exception when others then
  null;
end $$;

alter table public.enquiries add column if not exists property_id text;
alter table public.enquiries add column if not exists buyer_id uuid;
alter table public.enquiries add column if not exists agent_id uuid;
alter table public.enquiries add column if not exists name text not null default '';
alter table public.enquiries add column if not exists phone text not null default '';
alter table public.enquiries add column if not exists note text not null default '';
alter table public.enquiries add column if not exists abroad boolean not null default false;
alter table public.enquiries add column if not exists move_in text not null default '';
alter table public.enquiries add column if not exists occupants int;
alter table public.enquiries add column if not exists stage text not null default 'new';
alter table public.enquiries add column if not exists agent_reply text not null default '';
alter table public.enquiries add column if not exists score text;
alter table public.enquiries add column if not exists next_step text;
alter table public.enquiries add column if not exists viewing_at timestamptz;
alter table public.enquiries add column if not exists viewing_request text;
alter table public.enquiries add column if not exists private_note text not null default '';
alter table public.enquiries add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'enquiries' and column_name = 'listing_id'
  ) then
    execute $u$
      update public.enquiries
      set property_id = listing_id
      where (property_id is null or property_id = '')
        and listing_id is not null
    $u$;
  end if;
end $$;

update public.enquiries
set stage = 'new'
where stage is null or stage not in ('new', 'contacted', 'viewing', 'offer', 'closed');

update public.enquiries
set score = null
where score is not null and score not in ('High', 'Warm', 'New');

alter table public.enquiries drop constraint if exists enquiries_stage_check;
alter table public.enquiries add constraint enquiries_stage_check check (stage in ('new', 'contacted', 'viewing', 'offer', 'closed'));
alter table public.enquiries drop constraint if exists enquiries_score_check;
alter table public.enquiries add constraint enquiries_score_check check (score is null or score in ('High', 'Warm', 'New'));

create table if not exists public.enquiry_events (
  id text primary key default gen_random_uuid()::text,
  enquiry_id text not null,
  kind text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

alter table public.enquiry_events add column if not exists enquiry_id text;
alter table public.enquiry_events add column if not exists kind text;
alter table public.enquiry_events add column if not exists detail text not null default '';
alter table public.enquiry_events add column if not exists created_at timestamptz not null default now();

create index if not exists enquiry_events_enquiry_idx on public.enquiry_events (enquiry_id, created_at desc);
create index if not exists enquiries_agent_idx on public.enquiries (agent_id, created_at desc);
create index if not exists enquiries_buyer_idx on public.enquiries (buyer_id, created_at desc);
create index if not exists properties_agent_idx on public.properties (agent_id, status);

-- requests and reviews
create table if not exists public.requests (
  id text primary key default gen_random_uuid()::text,
  agent_id uuid references public.profiles (id) on delete cascade,
  kind text not null,
  property_id text,
  status text not null default 'submitted',
  instructions text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);

alter table public.requests add column if not exists agent_id uuid;
alter table public.requests add column if not exists kind text;
alter table public.requests add column if not exists property_id text;
alter table public.requests add column if not exists status text not null default 'submitted';
alter table public.requests add column if not exists instructions text not null default '';
alter table public.requests add column if not exists message text not null default '';
alter table public.requests add column if not exists created_at timestamptz not null default now();

update public.requests
set status = 'submitted'
where status is null or status not in ('submitted', 'instructions', 'paid', 'on', 'done');

update public.requests
set kind = 'help'
where kind is null or kind not in ('feature', 'plan', 'help');

alter table public.requests drop constraint if exists requests_kind_check;
alter table public.requests add constraint requests_kind_check check (kind in ('feature', 'plan', 'help'));
alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests add constraint requests_status_check check (status in ('submitted', 'instructions', 'paid', 'on', 'done'));

create table if not exists public.review_requests (
  id text primary key default gen_random_uuid()::text,
  enquiry_id text,
  agent_id uuid,
  buyer_id uuid,
  created_at timestamptz not null default now()
);

alter table public.review_requests add column if not exists enquiry_id text;
alter table public.review_requests add column if not exists agent_id uuid;
alter table public.review_requests add column if not exists buyer_id uuid;
alter table public.review_requests add column if not exists created_at timestamptz not null default now();

-- guards: buyers cannot change agent fields; agents cannot change featured
create or replace function private.guard_enquiry_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text;
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
  select role into actor from public.profiles where id = auth.uid();
  if actor = 'buyer' then
    if new.stage is distinct from old.stage
      or new.agent_reply is distinct from old.agent_reply
      or new.score is distinct from old.score
      or new.next_step is distinct from old.next_step
      or new.private_note is distinct from old.private_note
      or new.viewing_at is distinct from old.viewing_at
      or new.agent_id is distinct from old.agent_id
      or new.buyer_id is distinct from old.buyer_id
      or new.property_id is distinct from old.property_id
    then
      raise exception 'Buyers cannot change agent fields';
    end if;
  elsif actor = 'agent' then
    if new.buyer_id is distinct from old.buyer_id or new.property_id is distinct from old.property_id then
      raise exception 'Agents cannot reassign the enquiry';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.guard_property_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text;
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
  select role into actor from public.profiles where id = auth.uid();
  if actor = 'agent' and new.featured is distinct from old.featured then
    raise exception 'Agents cannot change featured';
  end if;
  return new;
end;
$$;

create or replace function private.guard_profile_update()
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
  if new.role is distinct from old.role
    or new.plan is distinct from old.plan
    or new.listing_cap is distinct from old.listing_cap
    or new.suspended is distinct from old.suspended
    or new.email is distinct from old.email
    or new.id is distinct from old.id
  then
    raise exception 'This account field cannot be changed here';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_enquiry_update() from public, anon, authenticated;
revoke all on function private.guard_property_update() from public, anon, authenticated;
revoke all on function private.guard_profile_update() from public, anon, authenticated;

drop trigger if exists guard_enquiry_update on public.enquiries;
create trigger guard_enquiry_update before update on public.enquiries
for each row execute function private.guard_enquiry_update();

drop trigger if exists guard_property_update on public.properties;
create trigger guard_property_update before update on public.properties
for each row execute function private.guard_property_update();

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update before update on public.profiles
for each row execute function private.guard_profile_update();

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.saved_homes enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.saved_searches enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_events enable row level security;
alter table public.requests enable row level security;
alter table public.review_requests enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.properties from anon, authenticated;
revoke all on public.saved_homes from anon, authenticated;
revoke all on public.recently_viewed from anon, authenticated;
revoke all on public.saved_searches from anon, authenticated;
revoke all on public.enquiries from anon, authenticated;
revoke all on public.enquiry_events from anon, authenticated;
revoke all on public.requests from anon, authenticated;
revoke all on public.review_requests from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.properties to anon, authenticated;
grant insert, update, delete on public.properties to authenticated;
grant select, insert, delete on public.saved_homes to authenticated;
grant select, insert, update, delete on public.recently_viewed to authenticated;
grant select, insert, delete on public.saved_searches to authenticated;
grant select (
  id, property_id, buyer_id, agent_id, name, phone, note, abroad, move_in, occupants,
  stage, agent_reply, score, next_step, viewing_at, viewing_request, created_at
) on public.enquiries to authenticated;
grant insert on public.enquiries to authenticated;
grant update (
  name, phone, note, abroad, move_in, occupants, stage, agent_reply, score, next_step, viewing_at, viewing_request, private_note
) on public.enquiries to authenticated;
grant select, insert on public.enquiry_events to authenticated;
grant select, insert on public.requests to authenticated;
grant select, insert on public.review_requests to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists properties_public_read on public.properties;
create policy properties_public_read on public.properties
for select to anon, authenticated using (status = 'live');

drop policy if exists properties_agent_read on public.properties;
create policy properties_agent_read on public.properties
for select to authenticated using (agent_id = auth.uid());

drop policy if exists properties_agent_insert on public.properties;
create policy properties_agent_insert on public.properties
for insert to authenticated with check (agent_id = auth.uid() and featured = false);

drop policy if exists properties_agent_update on public.properties;
create policy properties_agent_update on public.properties
for update to authenticated using (agent_id = auth.uid()) with check (agent_id = auth.uid());

drop policy if exists properties_agent_delete on public.properties;
create policy properties_agent_delete on public.properties
for delete to authenticated using (agent_id = auth.uid());

drop policy if exists saved_homes_own on public.saved_homes;
create policy saved_homes_own on public.saved_homes
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists recently_viewed_own on public.recently_viewed;
create policy recently_viewed_own on public.recently_viewed
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists saved_searches_own on public.saved_searches;
create policy saved_searches_own on public.saved_searches
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists enquiries_buyer_select on public.enquiries;
create policy enquiries_buyer_select on public.enquiries
for select to authenticated using (buyer_id = auth.uid());

drop policy if exists enquiries_buyer_insert on public.enquiries;
create policy enquiries_buyer_insert on public.enquiries
for insert to authenticated with check (buyer_id = auth.uid());

drop policy if exists enquiries_buyer_update on public.enquiries;
create policy enquiries_buyer_update on public.enquiries
for update to authenticated using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());

drop policy if exists enquiries_agent_select on public.enquiries;
create policy enquiries_agent_select on public.enquiries
for select to authenticated using (agent_id = auth.uid());

drop policy if exists enquiries_agent_update on public.enquiries;
create policy enquiries_agent_update on public.enquiries
for update to authenticated using (agent_id = auth.uid()) with check (agent_id = auth.uid());

drop policy if exists enquiry_events_agent_select on public.enquiry_events;
create policy enquiry_events_agent_select on public.enquiry_events
for select to authenticated using (
  exists (select 1 from public.enquiries e where e.id = enquiry_id and e.agent_id = auth.uid())
);

drop policy if exists enquiry_events_agent_insert on public.enquiry_events;
create policy enquiry_events_agent_insert on public.enquiry_events
for insert to authenticated with check (
  exists (select 1 from public.enquiries e where e.id = enquiry_id and e.agent_id = auth.uid())
);

drop policy if exists requests_agent_select on public.requests;
create policy requests_agent_select on public.requests
for select to authenticated using (agent_id = auth.uid());

drop policy if exists requests_agent_insert on public.requests;
create policy requests_agent_insert on public.requests
for insert to authenticated with check (
  agent_id = auth.uid()
  and status = 'submitted'
  and kind in ('feature', 'plan', 'help')
);

drop policy if exists reviews_agent_select on public.review_requests;
create policy reviews_agent_select on public.review_requests
for select to authenticated using (agent_id = auth.uid());

drop policy if exists reviews_agent_insert on public.review_requests;
create policy reviews_agent_insert on public.review_requests
for insert to authenticated with check (agent_id = auth.uid());

-- photos: public read, agent upload only into their own folder
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do update set public = true;

drop policy if exists listing_photos_public_read on storage.objects;
create policy listing_photos_public_read on storage.objects
for select to public using (bucket_id = 'listing-photos');

drop policy if exists listing_photos_agent_insert on storage.objects;
create policy listing_photos_agent_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'agent' and p.suspended = false
  )
);

drop policy if exists listing_photos_agent_update on storage.objects;
create policy listing_photos_agent_update on storage.objects
for update to authenticated using (
  bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists listing_photos_agent_delete on storage.objects;
create policy listing_photos_agent_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text
);
