-- DO NOT RUN on production until Boss approves.
-- One transaction. Refuses to run if a required column is missing.
-- Does not send mail. Does not deploy. Service role still bypasses RLS.

begin;

create schema if not exists private;

do $check$
declare
  missing text;
begin
  select string_agg(col, ', ' order by col) into missing
  from (
    select 'profiles.' || c as col
    from (values ('id'), ('role'), ('plan'), ('listing_cap'), ('suspended'), ('email'), ('verified'), ('gra_licence')) as v(c)
    where not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = v.c
    )
    union all
    select 'properties.' || c
    from (values ('id'), ('agent_id'), ('featured'), ('status')) as v(c)
    where not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'properties' and column_name = v.c
    )
    union all
    select 'enquiries.' || c
    from (values
      ('id'), ('property_id'), ('buyer_id'), ('agent_id'), ('stage'), ('agent_reply'),
      ('private_note'), ('score'), ('next_step'), ('viewing_at'), ('source'), ('intent')
    ) as v(c)
    where not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'enquiries' and column_name = v.c
    )
  ) gaps;
  if missing is not null then
    raise exception 'p0-rls.sql refused to run. Missing columns: %', missing;
  end if;
end
$check$;

alter table public.profiles add column if not exists approved boolean;
update public.profiles set approved = true where role in ('agent', 'admin') and approved is null;
update public.profiles set approved = false where approved is null;
alter table public.profiles alter column approved set default false;
alter table public.profiles alter column approved set not null;

do $alerts$
begin
  if to_regclass('public.alerts') is not null then
    alter table public.alerts add column if not exists confirmed boolean not null default false;
    alter table public.alerts add column if not exists unsubscribed boolean not null default false;
    alter table public.alerts add column if not exists token text;
  end if;
end
$alerts$;

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
    or new.verified is distinct from old.verified
    or new.gra_licence is distinct from old.gra_licence
    or new.approved is distinct from old.approved
  then
    raise exception 'This account field cannot be changed here';
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
  jwt_role text;
  actor text;
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
  if actor = 'agent' and old.status = 'hidden' and new.status is distinct from 'hidden' then
    raise exception 'A listing stays hidden until it is published through the desk';
  end if;
  return new;
end;
$$;

create or replace function private.guard_enquiry_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
  owner uuid;
begin
  begin
    jwt_role := auth.role();
  exception when others then
    return new;
  end;
  if coalesce(jwt_role, '') = 'service_role' or auth.uid() is null then
    return new;
  end if;
  new.stage := 'new';
  new.agent_reply := '';
  new.private_note := '';
  new.score := null;
  new.next_step := '';
  new.viewing_at := null;
  new.source := 'guyana_keys';
  new.intent := '';
  if new.property_id is null then
    new.agent_id := null;
  else
    select agent_id into owner from public.properties where id = new.property_id;
    new.agent_id := owner;
  end if;
  return new;
end;
$$;

-- PUBLIC must not call these. The signed-in role still needs EXECUTE or the trigger cannot fire.
revoke all on function private.guard_profile_update() from public;
revoke all on function private.guard_property_update() from public;
revoke all on function private.guard_enquiry_insert() from public;
grant execute on function private.guard_profile_update() to authenticated;
grant execute on function private.guard_property_update() to authenticated;
grant execute on function private.guard_enquiry_insert() to authenticated;

do $roles$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function private.guard_profile_update() from anon;
    revoke all on function private.guard_property_update() from anon;
    revoke all on function private.guard_enquiry_insert() from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function private.guard_profile_update() to service_role;
    grant execute on function private.guard_property_update() to service_role;
    grant execute on function private.guard_enquiry_insert() to service_role;
  end if;
end
$roles$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update before update on public.profiles
for each row execute function private.guard_profile_update();

drop trigger if exists guard_property_update on public.properties;
create trigger guard_property_update before update on public.properties
for each row execute function private.guard_property_update();

drop trigger if exists guard_enquiry_insert on public.enquiries;
create trigger guard_enquiry_insert before insert on public.enquiries
for each row execute function private.guard_enquiry_insert();

drop policy if exists properties_agent_insert on public.properties;
create policy properties_agent_insert on public.properties
for insert to authenticated
with check (
  agent_id = auth.uid()
  and featured = false
  and status = 'hidden'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'agent' and suspended = false and approved = true
  )
);

drop policy if exists enquiries_buyer_insert on public.enquiries;
create policy enquiries_buyer_insert on public.enquiries
for insert to authenticated
with check (
  buyer_id = auth.uid()
  and coalesce(stage, 'new') = 'new'
  and coalesce(agent_reply, '') = ''
  and coalesce(private_note, '') = ''
  and score is null
  and coalesce(next_step, '') = ''
  and viewing_at is null
  and coalesce(source, 'guyana_keys') = 'guyana_keys'
  and coalesce(intent, '') = ''
);

do $lock$
declare
  name text;
begin
  foreach name in array array['agencies', 'audit_events', 'listing_stats', 'buyer_needs', 'outbox']
  loop
    if to_regclass('public.' || name) is not null then
      execute format('alter table public.%I enable row level security', name);
      execute format('revoke all on table public.%I from public', name);
      if exists (select 1 from pg_roles where rolname = 'anon') then
        execute format('revoke all on table public.%I from anon', name);
      end if;
      if exists (select 1 from pg_roles where rolname = 'authenticated') then
        execute format('revoke all on table public.%I from authenticated', name);
      end if;
    end if;
  end loop;
end
$lock$;

commit;
